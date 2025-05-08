/*
 * Copyright 2025 Nimtable
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package io.nimtable;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.nimtable.db.repository.CatalogRepository;
import io.nimtable.spark.LocalSpark;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.apache.hadoop.conf.Configuration;
import org.apache.iceberg.*;
import org.apache.iceberg.catalog.TableIdentifier;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// NOTE(eric): This implementation is not well tested yet.
// Please refer to https://iceberg.apache.org/docs/latest/spark-procedures/ for future work.
public class OptimizeServlet extends HttpServlet {
    private static final Logger logger = LoggerFactory.getLogger(OptimizeServlet.class);
    private final Config config;
    private final ObjectMapper objectMapper;
    private final CatalogRepository catalogRepository;

    record CompactionResult(
            int rewrittenDataFilesCount,
            int addedDataFilesCount,
            long rewrittenBytesCount,
            int failedDataFilesCount) {}

    record ExpireSnapshotResult(
            long deletedDataFilesCount,
            long deletedPositionDeleteFilesCount,
            long deletedEqualityDeleteFilesCount,
            long deletedManifestFilesCount,
            long deletedManifestListsCount,
            long deletedStatisticsFilesCount) {}

    record CleanOrphanFilesResult(List<String> orphanFileLocations) {}

    private static final long DEFAULT_TARGET_FILE_SIZE_BYTES = 536870912L; // 512MB

    public OptimizeServlet(Config config) {
        this.config = config;
        this.objectMapper = new ObjectMapper();
        this.catalogRepository = new CatalogRepository();
    }

    private CompactionResult compactTable(
            SparkSession spark,
            String catalogName,
            String namespace,
            String tableName,
            long targetFileSizeBytes,
            String strategy,
            String sortOrder,
            String whereClause)
            throws Exception {

        StringBuilder sqlBuilder = new StringBuilder();
        sqlBuilder.append(
                String.format(
                        "CALL `%s`.system.rewrite_data_files(table => '%s.%s'",
                        catalogName, namespace, tableName));

        if (strategy != null && !strategy.isEmpty()) {
            sqlBuilder.append(String.format(", strategy => '%s'", strategy));
        }

        if (sortOrder != null && !sortOrder.isEmpty()) {
            sqlBuilder.append(String.format(", sort_order => '%s'", sortOrder));
        }

        if (whereClause != null && !whereClause.isEmpty()) {
            sqlBuilder.append(String.format(", where => '%s'", whereClause));
        }

        // Add options
        sqlBuilder.append(
                String.format(
                        ", options => map('rewrite-all', 'true', 'target-file-size-bytes', '%d'))",
                        targetFileSizeBytes));

        String sql = sqlBuilder.toString();
        logger.info("Executing compaction SQL: {}", sql);
        try {
            Row result = spark.sql(sql).collectAsList().get(0);
            return new CompactionResult(
                    result.getAs("rewritten_data_files_count"),
                    result.getAs("added_data_files_count"),
                    result.getAs("rewritten_bytes_count"),
                    result.getAs("failed_data_files_count"));
        } catch (Exception e) {
            logger.error("Failed to execute compaction SQL: {}", sql, e);
            throw new Exception("Failed to execute compaction: " + e.getMessage(), e);
        }
    }

    private ExpireSnapshotResult expireSnapshots(
            SparkSession spark,
            String catalogName,
            String namespace,
            String tableName,
            long maxSnapshotAgeMs,
            int minSnapshotsToKeep) {
        String timestampStr =
                Instant.ofEpochMilli(System.currentTimeMillis() - maxSnapshotAgeMs).toString();
        String sql =
                String.format(
                        "CALL `%s`.system.expire_snapshots(table => '%s.%s', older_than => TIMESTAMP '%s', retain_last => %d)",
                        catalogName, namespace, tableName, timestampStr, minSnapshotsToKeep);
        logger.info("Executing expire snapshots SQL: {}", sql);
        Row result = spark.sql(sql).collectAsList().get(0);

        return new ExpireSnapshotResult(
                result.getAs("deleted_data_files_count"),
                result.getAs("deleted_position_delete_files_count"),
                result.getAs("deleted_equality_delete_files_count"),
                result.getAs("deleted_manifest_files_count"),
                result.getAs("deleted_manifest_lists_count"),
                result.getAs("deleted_statistics_files_count"));
    }

    private CleanOrphanFilesResult cleanOrphanFiles(
            SparkSession spark,
            String catalogName,
            String namespace,
            String tableName,
            long olderThanMs) {
        String timestampStr =
                Instant.ofEpochMilli(System.currentTimeMillis() - olderThanMs).toString();
        String sql =
                String.format(
                        "CALL `%s`.system.remove_orphan_files(table => '%s.%s', older_than => TIMESTAMP '%s')",
                        catalogName, namespace, tableName, timestampStr);
        logger.info("Executing remove orphan files SQL: {}", sql);
        List<Row> result = spark.sql(sql).collectAsList();
        return new CleanOrphanFilesResult(
                result.stream().map(row -> row.getString(0)).collect(Collectors.toList()));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        // Parse path parameters
        String path = request.getRequestURI();
        String[] parts = path.split("/");
        if (parts.length < 7) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Invalid path format");
            objectMapper.writeValue(response.getOutputStream(), errorResponse);
            return;
        }

        // Format: /optimize/{catalog-name}/{namespace}/{table-name}/{operation}
        String catalogName = parts[3];
        String namespace = parts[4];
        String tableName = parts[5];
        String operation = parts[6];

        // Get catalog
        Config.Catalog catalog = config.getCatalog(catalogName);
        Map<String, String> properties;

        if (catalog != null) {
            properties = catalog.properties();
        } else {
            // Check database
            io.nimtable.db.entity.Catalog dbCatalog = catalogRepository.findByName(catalogName);
            if (dbCatalog == null) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Catalog not found: " + catalogName);
                objectMapper.writeValue(response.getOutputStream(), errorResponse);
                return;
            }
            properties = new HashMap<>(dbCatalog.getProperties());
            properties.put("type", dbCatalog.getType());
            properties.put("warehouse", dbCatalog.getWarehouse());
            properties.put("uri", dbCatalog.getUri());
        }

        // Load table
        Table table;
        try {
            table =
                    CatalogUtil.buildIcebergCatalog(catalogName, properties, new Configuration())
                            .loadTable(TableIdentifier.of(namespace, tableName));
        } catch (Exception e) {
            logger.error("Failed to load table: {}.{}", namespace, tableName, e);
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Table not found: " + namespace + "." + tableName);
            objectMapper.writeValue(response.getOutputStream(), errorResponse);
            return;
        }

        Map<String, Object> requestBody =
                objectMapper.readValue(
                        request.getReader(), new TypeReference<Map<String, Object>>() {});

        // Extract request parameters with defaults
        boolean snapshotRetention =
                Boolean.parseBoolean(
                        requestBody.getOrDefault("snapshotRetention", false).toString());
        long retentionPeriod =
                Long.parseLong(requestBody.getOrDefault("retentionPeriod", "432000000").toString());
        int minSnapshotsToKeep =
                Integer.parseInt(requestBody.getOrDefault("minSnapshotsToKeep", "1").toString());
        boolean orphanFileDeletion =
                Boolean.parseBoolean(
                        requestBody.getOrDefault("orphanFileDeletion", false).toString());
        long orphanFileRetention =
                Long.parseLong(
                        requestBody.getOrDefault("orphanFileRetention", "86400000").toString());
        boolean compaction =
                Boolean.parseBoolean(requestBody.getOrDefault("compaction", false).toString());
        long targetFileSizeBytes =
                requestBody.get("targetFileSizeBytes") != null
                        ? ((Number) requestBody.get("targetFileSizeBytes")).longValue()
                        : DEFAULT_TARGET_FILE_SIZE_BYTES;
        String strategy =
                requestBody.get("strategy") != null ? requestBody.get("strategy").toString() : null;
        String sortOrder =
                requestBody.get("sortOrder") != null
                        ? requestBody.get("sortOrder").toString()
                        : null;
        String whereClause =
                requestBody.get("whereClause") != null
                        ? requestBody.get("whereClause").toString()
                        : null;

        Map<String, Object> result = new HashMap<>();

        // Handle each operation separately
        switch (operation) {
            case "compact":
                if (compaction) {
                    SparkSession spark = LocalSpark.getInstance(config).getSpark();
                    try {
                        CompactionResult compactionResult =
                                compactTable(
                                        spark,
                                        catalogName,
                                        namespace,
                                        tableName,
                                        targetFileSizeBytes,
                                        strategy,
                                        sortOrder,
                                        whereClause);
                        result.put(
                                "rewrittenDataFilesCount",
                                compactionResult.rewrittenDataFilesCount());
                        result.put("addedDataFilesCount", compactionResult.addedDataFilesCount());
                        result.put("rewrittenBytesCount", compactionResult.rewrittenBytesCount());
                        result.put("failedDataFilesCount", compactionResult.failedDataFilesCount());
                    } catch (Exception e) {
                        logger.error(
                                "Failed to execute compaction: {}.{}", namespace, tableName, e);
                        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                        response.setContentType("application/json");
                        response.setCharacterEncoding("UTF-8");
                        Map<String, Object> errorResponse = new HashMap<>();
                        errorResponse.put("success", false);
                        errorResponse.put(
                                "message", "Failed to execute compaction: " + e.getMessage());
                        objectMapper.writeValue(response.getOutputStream(), errorResponse);
                        return;
                    }
                }
                break;

            case "expire-snapshots":
                if (snapshotRetention) {
                    SparkSession spark = LocalSpark.getInstance(config).getSpark();
                    try {
                        ExpireSnapshotResult expireResult =
                                expireSnapshots(
                                        spark,
                                        catalogName,
                                        namespace,
                                        tableName,
                                        retentionPeriod,
                                        minSnapshotsToKeep);
                        result.put("deletedDataFilesCount", expireResult.deletedDataFilesCount());
                        result.put(
                                "deletedManifestFilesCount",
                                expireResult.deletedManifestFilesCount());
                        result.put(
                                "deletedManifestListsCount",
                                expireResult.deletedManifestListsCount());
                    } catch (Exception e) {
                        logger.error("Failed to expire snapshots: {}.{}", namespace, tableName, e);
                        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                        response.setContentType("application/json");
                        response.setCharacterEncoding("UTF-8");
                        Map<String, Object> errorResponse = new HashMap<>();
                        errorResponse.put("success", false);
                        errorResponse.put(
                                "message", "Failed to expire snapshots: " + e.getMessage());
                        objectMapper.writeValue(response.getOutputStream(), errorResponse);
                        return;
                    }
                }
                break;

            case "clean-orphan-files":
                if (orphanFileDeletion) {
                    SparkSession spark = LocalSpark.getInstance(config).getSpark();
                    try {
                        CleanOrphanFilesResult cleanResult =
                                cleanOrphanFiles(
                                        spark,
                                        catalogName,
                                        namespace,
                                        tableName,
                                        orphanFileRetention);
                        result.put("orphanFileLocations", cleanResult.orphanFileLocations());
                    } catch (Exception e) {
                        logger.error(
                                "Failed to clean orphan files: {}.{}", namespace, tableName, e);
                        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                        response.setContentType("application/json");
                        response.setCharacterEncoding("UTF-8");
                        Map<String, Object> errorResponse = new HashMap<>();
                        errorResponse.put("success", false);
                        errorResponse.put(
                                "message", "Failed to clean orphan files: " + e.getMessage());
                        objectMapper.writeValue(response.getOutputStream(), errorResponse);
                        return;
                    }
                }
                break;

            case "schedule":
                Map<String, String> tableProperties = new HashMap<>();
                if (snapshotRetention) {
                    tableProperties.put("nimtable.retention.enabled", "true");
                    tableProperties.put(
                            "history.expire.max-snapshot-age-ms", String.valueOf(retentionPeriod));
                    tableProperties.put(
                            "history.expire.min-snapshots-to-keep",
                            String.valueOf(minSnapshotsToKeep));
                } else {
                    tableProperties.put("nimtable.retention.enabled", "false");
                }

                if (orphanFileDeletion) {
                    tableProperties.put("nimtable.orphan-file-deletion.enabled", "true");
                    tableProperties.put(
                            "nimtable.orphan-file-deletion.retention-ms",
                            String.valueOf(orphanFileRetention));
                } else {
                    tableProperties.put("nimtable.orphan-file-deletion.enabled", "false");
                }

                if (compaction) {
                    tableProperties.put("nimtable.compaction.enabled", "true");
                    tableProperties.put(
                            "nimtable.compaction.target-file-size-bytes",
                            String.valueOf(targetFileSizeBytes));
                } else {
                    tableProperties.put("nimtable.compaction.enabled", "false");
                }
                // Update table properties
                try {
                    UpdateProperties updates = table.updateProperties();
                    for (Map.Entry<String, String> entry : tableProperties.entrySet()) {
                        updates.set(entry.getKey(), entry.getValue());
                    }
                    updates.commit();
                } catch (Exception e) {
                    logger.error(
                            "Failed to update table properties: {}.{}", namespace, tableName, e);
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("success", false);
                    errorResponse.put(
                            "message", "Failed to update table properties: " + e.getMessage());
                    objectMapper.writeValue(response.getOutputStream(), errorResponse);
                    return;
                }
                break;
            default:
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Invalid operation: " + operation);
                objectMapper.writeValue(response.getOutputStream(), errorResponse);
                return;
        }

        // Return success response with operation results
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        result.put("success", true);
        result.put("message", "Operation completed successfully");
        objectMapper.writeValue(response.getOutputStream(), result);
    }
}
