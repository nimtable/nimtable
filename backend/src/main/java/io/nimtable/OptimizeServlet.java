package io.nimtable;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.hadoop.conf.Configuration;
import org.apache.iceberg.CatalogUtil;
import org.apache.iceberg.Table;
import org.apache.iceberg.UpdateProperties;
import org.apache.iceberg.catalog.TableIdentifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.nimtable.spark.LocalSpark;

import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// NOTE(eric): This implementation is not well tested yet.
// Please refer to https://iceberg.apache.org/docs/latest/spark-procedures/ for future work.
public class OptimizeServlet extends HttpServlet {
    private static final Logger logger = LoggerFactory.getLogger(OptimizeServlet.class);
    private final Config config;
    private final ObjectMapper objectMapper;

    record CompactionResult(
        int rewrittenDataFilesCount,
        int addedDataFilesCount,
        long rewrittenBytesCount,
        int failedDataFilesCount
    ) {}

    record ExpireSnapshotResult(
        long deletedDataFilesCount,
        long deletedPositionDeleteFilesCount,
        long deletedEqualityDeleteFilesCount,
        long deletedManifestFilesCount,
        long deletedManifestListsCount,
        long deletedStatisticsFilesCount
    ) {}

    record CleanOrphanFilesResult(
        List<String> orphanFileLocations
    ) {}

    public OptimizeServlet(Config config) {
        this.config = config;
        this.objectMapper = new ObjectMapper();
    }

    private CompactionResult compactTable(SparkSession spark, String catalogName, String namespace, String tableName) {
        String sql = String.format(
            "CALL `%s`.system.rewrite_data_files(table => '%s.%s')",
            catalogName, namespace, tableName
        );
        Row result = spark.sql(sql).collectAsList().get(0);

        return new CompactionResult(
            result.getAs("rewritten_data_files_count"),
            result.getAs("added_data_files_count"),
            result.getAs("rewritten_bytes_count"),
            result.getAs("failed_data_files_count")
        );
    }

    private ExpireSnapshotResult expireSnapshots(SparkSession spark, String catalogName, String namespace, String tableName, 
                                         long maxSnapshotAgeMs, int minSnapshotsToKeep) {
        String timestampStr = Instant.ofEpochMilli(System.currentTimeMillis() - maxSnapshotAgeMs).toString();
        String sql = String.format(
            "CALL `%s`.system.expire_snapshots(table => '%s.%s', older_than => TIMESTAMP '%s', retain_last => %d)",
            catalogName, namespace, tableName, timestampStr, minSnapshotsToKeep
        );
        Row result = spark.sql(sql).collectAsList().get(0);

        return new ExpireSnapshotResult(
            result.getAs("deleted_data_files_count"),
            result.getAs("deleted_position_delete_files_count"),
            result.getAs("deleted_equality_delete_files_count"),
            result.getAs("deleted_manifest_files_count"),
            result.getAs("deleted_manifest_lists_count"),
            result.getAs("deleted_statistics_files_count")
        );
    }

    private CleanOrphanFilesResult cleanOrphanFiles(SparkSession spark, String catalogName, String namespace, String tableName, 
                                        long olderThanMs) {
        String timestampStr = Instant.ofEpochMilli(System.currentTimeMillis() - olderThanMs).toString();
        String sql = String.format(
            "CALL `%s`.system.remove_orphan_files(table => '%s.%s', older_than => TIMESTAMP '%s')",
            catalogName, namespace, tableName, timestampStr
        );
        List<Row> result = spark.sql(sql).collectAsList();
        return new CleanOrphanFilesResult(
            result.stream()
                .map(row -> row.getString(0))
                .collect(Collectors.toList())
        );
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        // Parse path parameters
        String path = request.getRequestURI();
        String[] parts = path.split("/");
        if (parts.length < 7) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid path format");
            return;
        }

        // Format: /optimize/{catalog-name}/{namespace}/{table-name}/{action}
        String catalogName = parts[3];
        String namespace = parts[4];
        String tableName = parts[5];
        String action = parts[6];

        // Get catalog
        Config.Catalog catalog = config.getCatalog(catalogName);
        if (catalog == null) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "Catalog not found: " + catalogName);
            return;
        }

        // Load table
        Table table;
        try {
            table = CatalogUtil.buildIcebergCatalog(catalog.name(), catalog.properties(), new Configuration())
              .loadTable(TableIdentifier.of(namespace, tableName));
        } catch (Exception e) {
            logger.error("Failed to load table: {}.{}", namespace, tableName, e);
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "Table not found: " + namespace + "." + tableName);
            return;
        }

        boolean isRunOnce;
        switch (action) {
            case "enable":
                isRunOnce = false;
                break;
            case "run":
                isRunOnce = true;
                break;
            default:
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid action: " + action);
                return;
        }

        Map<String, Object> requestBody = objectMapper.readValue(request.getReader(), new TypeReference<Map<String, Object>>() {});
        
        // Extract request parameters with defaults
        boolean snapshotRetention = Boolean.parseBoolean(requestBody.getOrDefault("snapshotRetention", false).toString());
        long retentionPeriod = Long.parseLong(requestBody.getOrDefault("retentionPeriod", "432000000").toString());
        int minSnapshotsToKeep = Integer.parseInt(requestBody.getOrDefault("minSnapshotsToKeep", "1").toString());
        boolean orphanFileDeletion = Boolean.parseBoolean(requestBody.getOrDefault("orphanFileDeletion", false).toString());
        long orphanFileRetention = Long.parseLong(requestBody.getOrDefault("orphanFileRetention", "86400000").toString());
        boolean compaction = Boolean.parseBoolean(requestBody.getOrDefault("compaction", false).toString());

        Map<String, String> properties = new HashMap<>();

        // Handle snapshot retention
        if (snapshotRetention) {
            properties.put("nimtable.retention.enabled", "true");
            properties.put("history.expire.max-snapshot-age-ms", String.valueOf(retentionPeriod));
            properties.put("history.expire.min-snapshots-to-keep", String.valueOf(minSnapshotsToKeep));
        } else {
            properties.put("nimtable.retention.enabled", "false");
        }

        // Handle orphan file deletion
        if (orphanFileDeletion) {
            properties.put("nimtable.orphan-file-deletion.enabled", "true");
            properties.put("nimtable.orphan-file-deletion.retention-ms", String.valueOf(orphanFileRetention));
        } else {
            properties.put("nimtable.orphan-file-deletion.enabled", "false");
        }

        // Handle compaction
        if (compaction) {
            properties.put("nimtable.compaction.enabled", "true");
        } else {
            properties.put("nimtable.compaction.enabled", "false");
        }

        // If this is a one-time run, execute the maintenance operations
        if (isRunOnce) {
            SparkSession spark = LocalSpark.getInstance(config).getSpark();
            try {
                // Execute compaction if enabled
                if (compaction) {
                    compactTable(spark, catalogName, namespace, tableName);
                }

                // Execute snapshot expiration if enabled
                if (snapshotRetention) {
                    expireSnapshots(spark, catalogName, namespace, tableName, retentionPeriod, minSnapshotsToKeep);
                }

                // Execute orphan file cleanup if enabled
                if (orphanFileDeletion) {
                    cleanOrphanFiles(spark, catalogName, namespace, tableName, orphanFileRetention);
                }
            } catch (Exception e) {
                logger.error("Failed to execute maintenance operations: {}.{}", namespace, tableName, e);
                response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to execute maintenance operations: " + e.getMessage());
                return;
            }
        }
        
        // Update table properties
        try {
            UpdateProperties updates = table.updateProperties();
            for (Map.Entry<String, String> entry : properties.entrySet()) {
                updates.set(entry.getKey(), entry.getValue());
            }
            updates.commit();
        } catch (Exception e) {
            logger.error("Failed to update table properties: {}.{}", namespace, tableName, e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to update table properties: " + e.getMessage());
        }


        // Return success response
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getOutputStream(), Map.of(
            "success", true,
            "message", isRunOnce ? "Optimization completed" : "Optimization settings updated"
        ));
    }
} 