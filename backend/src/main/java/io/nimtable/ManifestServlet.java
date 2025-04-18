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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.nimtable.db.entity.Catalog;
import io.nimtable.db.repository.CatalogRepository;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.hadoop.conf.Configuration;
import org.apache.iceberg.CatalogUtil;
import org.apache.iceberg.DataFile;
import org.apache.iceberg.DeleteFile;
import org.apache.iceberg.ManifestFile;
import org.apache.iceberg.ManifestFiles;
import org.apache.iceberg.Table;
import org.apache.iceberg.catalog.TableIdentifier;
import org.apache.iceberg.io.FileIO;
import org.apache.iceberg.transforms.Transforms;
import org.apache.iceberg.types.Types;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Servlet for fetching manifests for a given table and snapshot. */
public class ManifestServlet extends HttpServlet {
    private static final Logger logger = LoggerFactory.getLogger(ManifestServlet.class);

    private final Config config;
    private final ObjectMapper objectMapper;
    private final CatalogRepository catalogRepository;

    public ManifestServlet(Config config) {
        this.config = config;
        this.objectMapper = new ObjectMapper();
        this.catalogRepository = new CatalogRepository();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        // Parse path parameters
        String path = request.getRequestURI();
        String[] parts = path.split("/");
        if (parts.length < 7) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid path format");
            return;
        }

        // Format:
        // /manifest/{catalog-name}/{namespace}/{table-name}/{snapshot-id}[/{manifest-number}]
        String catalogName = parts[3];
        String namespace = parts[4];
        String tableName = parts[5];
        String snapshotId = parts[6];
        Integer manifestNumber = parts.length > 7 ? Integer.parseInt(parts[7]) : null;

        // Get catalog
        Config.Catalog catalog = config.getCatalog(catalogName);
        Map<String, String> properties;

        if (catalog != null) {
            properties = catalog.properties();
        } else {
            // Check database
            Catalog dbCatalog = catalogRepository.findByName(catalogName);
            if (dbCatalog == null) {
                response.sendError(
                        HttpServletResponse.SC_NOT_FOUND, "Catalog not found: " + catalogName);
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
            response.sendError(
                    HttpServletResponse.SC_NOT_FOUND,
                    "Table not found: " + namespace + "." + tableName);
            return;
        }

        // Find snapshot
        long snapshotIdLong;
        try {
            snapshotIdLong = Long.parseLong(snapshotId);
        } catch (NumberFormatException e) {
            response.sendError(
                    HttpServletResponse.SC_BAD_REQUEST, "Invalid snapshot ID: " + snapshotId);
            return;
        }

        var snapshot = table.snapshot(snapshotIdLong);
        if (snapshot == null) {
            response.sendError(
                    HttpServletResponse.SC_NOT_FOUND, "Snapshot not found: " + snapshotId);
            return;
        }

        // Read manifest list file
        try (FileIO fileIO = table.io()) {
            List<ManifestFile> manifests = snapshot.allManifests(fileIO);
            var rootNode = objectMapper.createObjectNode();
            if (manifestNumber == null) {
                rootNode.put("snapshot_id", snapshotId);
                rootNode.put("manifest_list_location", snapshot.manifestListLocation());
                var manifestsNode = objectMapper.createArrayNode();
                for (ManifestFile manifest : manifests) {
                    manifestsNode.add(manifestToJson(manifest));
                }
                rootNode.set("manifests", manifestsNode);
            } else {
                ManifestFile manifest = manifests.get(manifestNumber);
                if (manifest == null) {
                    response.sendError(
                            HttpServletResponse.SC_NOT_FOUND,
                            "Invalid manifest number: " + manifestNumber);
                    return;
                }
                rootNode.put("path", manifest.path());
                rootNode.put("content", manifest.content().name());
                var filesNode = objectMapper.createArrayNode();

                var reader = ManifestFiles.read(manifest, fileIO, table.specs());
                switch (manifest.content()) {
                    case DATA:
                        for (DataFile file : reader) {
                            filesNode.add(dataFileToJson(file));
                        }
                        break;
                    case DELETES:
                        for (DeleteFile file :
                                ManifestFiles.readDeleteManifest(manifest, fileIO, table.specs())) {
                            filesNode.add(deleteFileToJson(file));
                        }
                        break;
                    default:
                        throw new RuntimeException("unreachable");
                }
                rootNode.set("files", filesNode);
            }
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            objectMapper.writeValue(response.getWriter(), rootNode);
        }
    }

    private ObjectNode manifestToJson(ManifestFile manifest) {
        var node = objectMapper.createObjectNode();
        node.put("path", manifest.path());
        node.put("length", manifest.length());
        node.put("partition_spec_id", manifest.partitionSpecId());
        node.put("content", manifest.content().name());
        node.put("sequence_number", manifest.sequenceNumber());
        node.put("min_sequence_number", manifest.minSequenceNumber());
        if (manifest.snapshotId() != null) {
            node.put("snapshot_id", manifest.snapshotId());
        }
        if (manifest.addedFilesCount() != null) {
            node.put("added_files_count", manifest.addedFilesCount());
        }
        if (manifest.existingFilesCount() != null) {
            node.put("existing_files_count", manifest.existingFilesCount());
        }
        if (manifest.deletedFilesCount() != null) {
            node.put("deleted_files_count", manifest.deletedFilesCount());
        }
        if (manifest.addedRowsCount() != null) {
            node.put("added_rows_count", manifest.addedRowsCount());
        }
        if (manifest.existingRowsCount() != null) {
            node.put("existing_rows_count", manifest.existingRowsCount());
        }
        if (manifest.deletedRowsCount() != null) {
            node.put("deleted_rows_count", manifest.deletedRowsCount());
        }
        return node;
    }

    private ObjectNode dataFileToJson(DataFile file) {
        var fileNode = objectMapper.createObjectNode();
        fileNode.put("content", file.content().name());
        fileNode.put("file_path", file.location());
        fileNode.put("file_format", file.format().name());
        fileNode.put("spec_id", file.specId());
        fileNode.put("record_count", file.recordCount());
        fileNode.put("file_size_in_bytes", file.fileSizeInBytes());

        if (file.columnSizes() != null) {
            var columnSizesNode = objectMapper.createObjectNode();
            file.columnSizes().forEach((key, value) -> columnSizesNode.put(key.toString(), value));
            fileNode.set("column_sizes", columnSizesNode);
        }

        if (file.valueCounts() != null) {
            var valueCountsNode = objectMapper.createObjectNode();
            file.valueCounts().forEach((key, value) -> valueCountsNode.put(key.toString(), value));
            fileNode.set("value_counts", valueCountsNode);
        }

        if (file.nullValueCounts() != null) {
            var nullValueCountsNode = objectMapper.createObjectNode();
            file.nullValueCounts()
                    .forEach((key, value) -> nullValueCountsNode.put(key.toString(), value));
            fileNode.set("null_value_counts", nullValueCountsNode);
        }

        if (file.nanValueCounts() != null) {
            var nanValueCountsNode = objectMapper.createObjectNode();
            file.nanValueCounts()
                    .forEach((key, value) -> nanValueCountsNode.put(key.toString(), value));
            fileNode.set("nan_value_counts", nanValueCountsNode);
        }

        if (file.lowerBounds() != null) {
            var lowerBoundsNode = objectMapper.createObjectNode();
            file.lowerBounds()
                    .forEach(
                            (key, value) ->
                                    lowerBoundsNode.put(key.toString(), formatBinary(value)));
            fileNode.set("lower_bounds", lowerBoundsNode);
        }

        if (file.upperBounds() != null) {
            var upperBoundsNode = objectMapper.createObjectNode();
            file.upperBounds()
                    .forEach(
                            (key, value) ->
                                    upperBoundsNode.put(key.toString(), formatBinary(value)));
            fileNode.set("upper_bounds", upperBoundsNode);
        }

        if (file.keyMetadata() != null) {
            fileNode.put("key_metadata", formatBinary(file.keyMetadata()));
        }

        if (file.splitOffsets() != null) {
            var splitOffsetsNode = objectMapper.createArrayNode();
            file.splitOffsets().forEach(splitOffsetsNode::add);
            fileNode.set("split_offsets", splitOffsetsNode);
        }

        if (file.equalityFieldIds() != null) {
            var equalityIdsNode = objectMapper.createArrayNode();
            file.equalityFieldIds().forEach(equalityIdsNode::add);
            fileNode.set("equality_ids", equalityIdsNode);
        }

        fileNode.put("sort_order_id", file.sortOrderId());
        return fileNode;
    }

    private ObjectNode deleteFileToJson(DeleteFile file) {
        var fileNode = objectMapper.createObjectNode();
        fileNode.put("content", file.content().name().toLowerCase());
        fileNode.put("file_path", file.location());
        fileNode.put("file_format", file.format().name().toLowerCase());
        fileNode.put("record_count", file.recordCount());
        fileNode.put("file_size_in_bytes", file.fileSizeInBytes());

        if (file.splitOffsets() != null) {
            var splitOffsetsNode = objectMapper.createArrayNode();
            file.splitOffsets().forEach(splitOffsetsNode::add);
            fileNode.set("split_offsets", splitOffsetsNode);
        }

        if (file.referencedDataFile() != null) {
            fileNode.put("referenced_data_file", file.referencedDataFile());
        }

        if (file.contentOffset() != null) {
            fileNode.put("content_offset", file.contentOffset());
        }

        if (file.contentSizeInBytes() != null) {
            fileNode.put("content_size_in_bytes", file.contentSizeInBytes());
        }

        if (file.equalityFieldIds() != null) {
            var equalityIdsNode = objectMapper.createArrayNode();
            file.equalityFieldIds().forEach(equalityIdsNode::add);
            fileNode.set("equality_ids", equalityIdsNode);
        }

        return fileNode;
    }

    private static String formatBinary(ByteBuffer buffer) {
        return Transforms.identity().toHumanString(Types.BinaryType.get(), buffer);
    }
}
