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
import org.apache.iceberg.rest.requests.UpdateTableRequest;
import org.apache.iceberg.rest.responses.LoadTableResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class OptimizeServlet extends HttpServlet {
    private static final Logger logger = LoggerFactory.getLogger(OptimizeServlet.class);
    private final Config config;
    private final ObjectMapper objectMapper;

    public OptimizeServlet(Config config) {
        this.config = config;
        this.objectMapper = new ObjectMapper();
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
        Map<String, String> properties = new HashMap<>();

        // Handle snapshot retention
        if (Boolean.parseBoolean(requestBody.getOrDefault("snapshotRetention", false).toString())) {
            properties.put("nimtable.retention.enabled", "true");
            // Reference. https://www.tabular.io/apache-iceberg-cookbook/data-operations-snapshot-expiration/
            properties.put("history.expire.max-snapshot-age-ms", requestBody.getOrDefault("retentionPeriod", "432000000").toString());
            properties.put("history.expire.min-snapshots-to-keep", requestBody.getOrDefault("minSnapshotsToKeep", "1").toString());
        } else {
            properties.put("nimtable.retention.enabled", "false");
        }

        // Handle orphan file deletion
        if (Boolean.parseBoolean(requestBody.getOrDefault("orphanFileDeletion", false).toString())) {
            properties.put("nimtable.orphan-file-deletion.enabled", "true");
            properties.put("nimtable.orphan-file-deletion.retention-ms", requestBody.getOrDefault("orphanFileRetention", "86400000").toString());
        } else {
            properties.put("nimtable.orphan-file-deletion.enabled", "false");
        }

        // Handle compaction
        if (Boolean.parseBoolean(requestBody.getOrDefault("compaction", false).toString())) {
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

            // Return success response
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            objectMapper.writeValue(response.getOutputStream(), Map.of(
                "success", true,
                "message", isRunOnce ? "Optimization completed" : "Optimization settings updated"
            ));
        } catch (Exception e) {
            logger.error("Failed to update table properties: {}.{}", namespace, tableName, e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to update table properties: " + e.getMessage());
        }
    }
} 