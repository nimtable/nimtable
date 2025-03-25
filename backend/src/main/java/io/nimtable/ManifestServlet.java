package io.nimtable;

import java.io.IOException;
import java.util.List;

import org.apache.hadoop.conf.Configuration;
import org.apache.iceberg.CatalogUtil;
import org.apache.iceberg.ManifestFile;
import org.apache.iceberg.Table;
import org.apache.iceberg.catalog.TableIdentifier;
import org.apache.iceberg.io.FileIO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Servlet for fetching manifests for a given table and snapshot.
 */
public class ManifestServlet extends HttpServlet {
    private static final Logger logger = LoggerFactory.getLogger(ManifestServlet.class);

    private final Config config;
    private final ObjectMapper objectMapper;

    public ManifestServlet(Config config) {
        this.config = config;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Parse path parameters
        String path = request.getRequestURI();
        String[] parts = path.split("/");
        if (parts.length < 7) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid path format");
            return;
        }

        // Format: /manifest/{catalog-name}/{namespace}/{table-name}/{snapshot-id}
        String catalogName = parts[3];
        String namespace = parts[4];
        String tableName = parts[5];
        String snapshotId = parts[6];

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

        // Find snapshot
        long snapshotIdLong;
        try {
            snapshotIdLong = Long.parseLong(snapshotId);
        } catch (NumberFormatException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid snapshot ID: " + snapshotId);
            return;
        }

        var snapshot = table.snapshot(snapshotIdLong);
        if (snapshot == null) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "Snapshot not found: " + snapshotId);
            return;
        }

        // Read manifest list file
        try (FileIO fileIO = table.io()) {
            List<ManifestFile> manifests = snapshot.allManifests(fileIO);
            var rootNode = objectMapper.createObjectNode();
            rootNode.put("snapshot_id", snapshotId);
            rootNode.put("manifest_list_location", snapshot.manifestListLocation());
            var manifestsNode = objectMapper.createArrayNode();
            for (ManifestFile manifest : manifests) {
                manifestsNode.add(manifestToJson(manifest));
            }
            rootNode.set("manifests", manifestsNode);
            
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
}
