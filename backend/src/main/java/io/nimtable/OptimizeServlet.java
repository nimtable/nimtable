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
import io.nimtable.iceberg.IcebergProto.DataContentType;
import io.nimtable.iceberg.IcebergProto.DataFileFormat;
import io.nimtable.iceberg.IcebergProto.FileIoBuilder;
import io.nimtable.iceberg.IcebergProto.FileScanTaskDescriptor;
import io.nimtable.iceberg.IcebergProto.RewriteFilesRequest;
import io.nimtable.iceberg.IcebergProto.RewriteFilesResponse;
import io.nimtable.iceberg.IcebergProto.SchemaDescriptor;
import io.nimtable.spark.LocalSpark;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.apache.hadoop.conf.Configuration;
import org.apache.iceberg.*;
import org.apache.iceberg.Metrics;
import org.apache.iceberg.catalog.TableIdentifier;
import org.apache.iceberg.util.SortOrderUtil;
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

    public OptimizeServlet(Config config) {
        this.config = config;
        this.objectMapper = new ObjectMapper();
    }

    private CompactionResult compactTable(
            SparkSession spark, String catalogName, String namespace, String tableName) {
        Table table =
                CatalogUtil.buildIcebergCatalog(
                                catalogName,
                                config.getCatalog(catalogName).properties(),
                                new Configuration())
                        .loadTable(TableIdentifier.of(namespace, tableName));

        var rewrite_files_action = table.newRewrite();

        List<FileScanTaskDescriptor> fileScanTasks = new ArrayList<>();
        var inputFiles = table.newScan().planFiles();
        for (FileScanTask task : inputFiles) {
            var file = task.file();
            rewrite_files_action.deleteFile(file);

            DataFileFormat protoDataFileFormat;
            FileFormat format = file.format();
            switch (format) {
                case AVRO:
                    protoDataFileFormat = DataFileFormat.AVRO;
                    break;
                case PARQUET:
                    protoDataFileFormat = DataFileFormat.PARQUET;
                    break;
                case ORC:
                    protoDataFileFormat = DataFileFormat.ORC;
                    break;
                default:
                    throw new RuntimeException("Unsupported file format: " + format);
            }

            fileScanTasks.add(
                    FileScanTaskDescriptor.newBuilder()
                            .setDataFilePath(file.location())
                            .setRecordCount(file.recordCount())
                            .setDataFileContentValue(file.content().id())
                            .setDataFileFormat(protoDataFileFormat)
                            .setStart(0)
                            .setLength(file.fileSizeInBytes())
                            .setSequenceNumber(
                                    file.dataSequenceNumber() == null
                                            ? 0
                                            : file.dataSequenceNumber())
                            .addAllEqualityIds(
                                    file.equalityFieldIds() == null
                                            ? new ArrayList<>()
                                            : file.equalityFieldIds())
                            .addAllProjectFieldIds(
                                    task.schema().columns().stream()
                                            .map(column -> column.fieldId())
                                            .collect(Collectors.toList()))
                            .build());
        }
        var fileIoBuilder = FileIoBuilder.newBuilder();
        // set properties
        for (var entry : config.getCatalog(catalogName).properties().entrySet()) {
            fileIoBuilder.putProps(entry.getKey(), entry.getValue());
        }

        // set scheme
        fileIoBuilder.setSchemeStr(table.location());

        // build schema
        var schema =
                SchemaDescriptor.newBuilder()
                        .setSchemaId(table.schema().schemaId())
                        .addAllFields(
                                table.schema().columns().stream()
                                        .map(column -> TypeConverter.convert(column))
                                        .collect(Collectors.toList()))
                        .build();

        // build request
        RewriteFilesRequest request =
                RewriteFilesRequest.newBuilder()
                        .addAllFileScanTaskDescriptor(fileScanTasks)
                        .setDirPath(table.location())
                        .setFileIoBuilder(fileIoBuilder)
                        .setSchema(schema)
                        .build();

        try (IcebergCompactionClient client = new IcebergCompactionClient("127.0.0.1", 7777)) {
            RewriteFilesResponse rewrite_files_stat_response = client.rewriteFiles(request);
            var rewrite_files_stat = rewrite_files_stat_response.getStat();

            for (var protoFile : rewrite_files_stat_response.getRewrittenFilesList()) {
                var metrics =
                        new Metrics(
                                protoFile.getRecordCount(),
                                protoFile.getColumnSizesMap(),
                                protoFile.getValueCountsMap(),
                                protoFile.getNullValueCountsMap(),
                                protoFile.getNanValueCountsMap(),
                                protoFile.getLowerBoundsMap().entrySet().stream()
                                        .collect(
                                                Collectors.toMap(
                                                        Map.Entry::getKey,
                                                        e ->
                                                                ByteBuffer.wrap(
                                                                        e.getValue()
                                                                                .toByteArray()))),
                                protoFile.getUpperBoundsMap().entrySet().stream()
                                        .collect(
                                                Collectors.toMap(
                                                        Map.Entry::getKey,
                                                        e ->
                                                                ByteBuffer.wrap(
                                                                        e.getValue()
                                                                                .toByteArray()))));

                FileFormat dataFileFormat;
                var protoDataFileFormat = protoFile.getFileFormat().toString();
                switch (protoDataFileFormat) {
                    case "AVRO":
                        dataFileFormat = FileFormat.AVRO;
                        break;
                    case "ORC":
                        dataFileFormat = FileFormat.ORC;
                        break;
                    case "PARQUET":
                        dataFileFormat = FileFormat.PARQUET;
                        break;
                    default:
                        throw new RuntimeException(
                                "Unsupported file format: " + protoFile.getFileFormat());
                }

                if (protoFile.getContent() == DataContentType.DATA) {
                    var dataFile =
                            DataFiles.builder(table.spec())
                                    .withPath(protoFile.getFilePath())
                                    .withFormat(dataFileFormat)
                                    .withRecordCount(protoFile.getRecordCount())
                                    .withFileSizeInBytes(protoFile.getFileSizeInBytes())
                                    .withMetrics(metrics)
                                    .withEncryptionKeyMetadata(
                                            ByteBuffer.wrap(
                                                    protoFile.getKeyMetadata().toByteArray()))
                                    .withSplitOffsets(protoFile.getSplitOffsetsList())
                                    .withSortOrder(SortOrderUtil.buildSortOrder(table))
                                    .build();
                    rewrite_files_action.addFile(dataFile);
                } else if (protoFile.getContent() == DataContentType.POSITION_DELETES) {
                    var deleteFile =
                            FileMetadata.deleteFileBuilder(table.spec())
                                    .ofPositionDeletes()
                                    .withPath(protoFile.getFilePath())
                                    .withFormat(dataFileFormat)
                                    .withRecordCount(protoFile.getRecordCount())
                                    .withFileSizeInBytes(protoFile.getFileSizeInBytes())
                                    .withMetrics(metrics)
                                    .withEncryptionKeyMetadata(
                                            ByteBuffer.wrap(
                                                    protoFile.getKeyMetadata().toByteArray()))
                                    .withSplitOffsets(protoFile.getSplitOffsetsList())
                                    .withSortOrder(SortOrderUtil.buildSortOrder(table))
                                    .build();
                    rewrite_files_action.addFile(deleteFile);
                } else if (protoFile.getContent() == DataContentType.EQUALIRY_DELETES) {
                    var deleteFile =
                            FileMetadata.deleteFileBuilder(table.spec())
                                    .ofEqualityDeletes()
                                    .withPath(protoFile.getFilePath())
                                    .withFormat(dataFileFormat)
                                    .withRecordCount(protoFile.getRecordCount())
                                    .withFileSizeInBytes(protoFile.getFileSizeInBytes())
                                    .withMetrics(metrics)
                                    .withEncryptionKeyMetadata(
                                            ByteBuffer.wrap(
                                                    protoFile.getKeyMetadata().toByteArray()))
                                    .withSplitOffsets(protoFile.getSplitOffsetsList())
                                    .withSortOrder(SortOrderUtil.buildSortOrder(table))
                                    .build();
                    rewrite_files_action.addFile(deleteFile);
                } else {
                    throw new RuntimeException(
                            "Unsupported data content type: " + protoFile.getContent());
                }
            }

            // commit RewriteFiles Action to iceberg catalog
            try {
                rewrite_files_action.commit();
            } catch (Exception e) {
                throw new RuntimeException("Failed to commit rewrite files action", e);
            }

            return new CompactionResult(
                    rewrite_files_stat.getRewrittenFilesCount(),
                    rewrite_files_stat.getAddedFilesCount(),
                    rewrite_files_stat.getRewrittenBytes(),
                    rewrite_files_stat.getFailedDataFilesCount());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to connect to compaction service", e);
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
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid path format");
            return;
        }

        // Format: /optimize/{catalog-name}/{namespace}/{table-name}/{operation}
        String catalogName = parts[3];
        String namespace = parts[4];
        String tableName = parts[5];
        String operation = parts[6];

        // Get catalog
        Config.Catalog catalog = config.getCatalog(catalogName);
        if (catalog == null) {
            response.sendError(
                    HttpServletResponse.SC_NOT_FOUND, "Catalog not found: " + catalogName);
            return;
        }

        // Load table
        Table table;
        try {
            table =
                    CatalogUtil.buildIcebergCatalog(
                                    catalog.name(), catalog.properties(), new Configuration())
                            .loadTable(TableIdentifier.of(namespace, tableName));
        } catch (Exception e) {
            logger.error("Failed to load table: {}.{}", namespace, tableName, e);
            response.sendError(
                    HttpServletResponse.SC_NOT_FOUND,
                    "Table not found: " + namespace + "." + tableName);
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

        Map<String, Object> result = new HashMap<>();

        // Handle each operation separately
        switch (operation) {
            case "compact":
                if (compaction) {
                    SparkSession spark = LocalSpark.getInstance(config).getSpark();
                    try {
                        CompactionResult compactionResult =
                                compactTable(spark, catalogName, namespace, tableName);
                        result.put(
                                "rewrittenDataFilesCount",
                                compactionResult.rewrittenDataFilesCount());
                        result.put("addedDataFilesCount", compactionResult.addedDataFilesCount());
                        result.put("rewrittenBytesCount", compactionResult.rewrittenBytesCount());
                        result.put("failedDataFilesCount", compactionResult.failedDataFilesCount());
                    } catch (Exception e) {
                        logger.error(
                                "Failed to execute compaction: {}.{}", namespace, tableName, e);
                        response.sendError(
                                HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                                "Failed to execute compaction: " + e.getMessage());
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
                        response.sendError(
                                HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                                "Failed to expire snapshots: " + e.getMessage());
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
                        response.sendError(
                                HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                                "Failed to clean orphan files: " + e.getMessage());
                        return;
                    }
                }
                break;

            case "schedule":
                Map<String, String> properties = new HashMap<>();
                if (snapshotRetention) {
                    properties.put("nimtable.retention.enabled", "true");
                    properties.put(
                            "history.expire.max-snapshot-age-ms", String.valueOf(retentionPeriod));
                    properties.put(
                            "history.expire.min-snapshots-to-keep",
                            String.valueOf(minSnapshotsToKeep));
                } else {
                    properties.put("nimtable.retention.enabled", "false");
                }

                if (orphanFileDeletion) {
                    properties.put("nimtable.orphan-file-deletion.enabled", "true");
                    properties.put(
                            "nimtable.orphan-file-deletion.retention-ms",
                            String.valueOf(orphanFileRetention));
                } else {
                    properties.put("nimtable.orphan-file-deletion.enabled", "false");
                }

                if (compaction) {
                    properties.put("nimtable.compaction.enabled", "true");
                } else {
                    properties.put("nimtable.compaction.enabled", "false");
                }
                // Update table properties
                try {
                    UpdateProperties updates = table.updateProperties();
                    for (Map.Entry<String, String> entry : properties.entrySet()) {
                        updates.set(entry.getKey(), entry.getValue());
                    }
                    updates.commit();
                } catch (Exception e) {
                    logger.error(
                            "Failed to update table properties: {}.{}", namespace, tableName, e);
                    response.sendError(
                            HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                            "Failed to update table properties: " + e.getMessage());
                }
                break;
            default:
                response.sendError(
                        HttpServletResponse.SC_BAD_REQUEST, "Invalid operation: " + operation);
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
