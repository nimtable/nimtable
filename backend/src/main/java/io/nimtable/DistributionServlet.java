package io.nimtable;

import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.iceberg.*;
import org.apache.iceberg.catalog.Catalog;
import org.apache.iceberg.catalog.TableIdentifier;
import org.apache.iceberg.io.FileIO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

public class DistributionServlet extends HttpServlet {
    private static final Logger LOG = LoggerFactory.getLogger(DistributionServlet.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private final Config config;
    private final ObjectMapper objectMapper;

    public DistributionServlet(Config config) {
        this.config = config;
        this.objectMapper = new ObjectMapper();

    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse response) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing table identifier");
            return;
        }

        // Parse path: /catalogName/namespace/table
        String[] parts = pathInfo.split("/");
        if (parts.length != 4) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid path format. Expected: /catalogName/namespace/table");
            return;
        }

        String catalogName = parts[1];
        String namespace = parts[2];
        String tableName = parts[3];

        try {
            Config.Catalog catalogConfig = config.catalogs().stream()
                    .filter(c -> c.name().equals(catalogName))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Catalog not found: " + catalogName));

            Catalog catalog = CatalogUtil.buildIcebergCatalog(
                    catalogConfig.name(),
                    catalogConfig.properties(),
                    new org.apache.hadoop.conf.Configuration()
            );

            Table table = catalog.loadTable(TableIdentifier.of(namespace, tableName));
            
            // Calculate distribution statistics
            Map<String, Integer> distribution = calculateDistributionStats(table);

            // Calculate the total count of files
            int totalFiles = 0;
            for (Map.Entry<String, Integer> entry : distribution.entrySet()) {
                totalFiles += entry.getValue();
            }

            ObjectNode rootNode = MAPPER.createObjectNode();
            for (Map.Entry<String, Integer> entry : distribution.entrySet()) {
                String range = entry.getKey();
                int count = entry.getValue();
                double percentage = totalFiles > 0 
                    ? Math.round((count * 100.0) / totalFiles) 
                    : 0;

                ObjectNode rangeData = objectMapper.createObjectNode();
                rangeData.put("count", count);
                rangeData.put("percentage", percentage);

                rootNode.set(range, rangeData);
            }

            // add distribution to rootNode
            // No need to nest the distribution data since rootNode already contains it
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            objectMapper.writeValue(response.getWriter(), rootNode);
        } catch (Exception e) {
            LOG.error("Error processing distribution request", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    private Map<String, Integer> calculateDistributionStats(Table table) {
        var snapshot = table.currentSnapshot();

        // help me we calculate the distribution statistics
        // Example
        // 0-8 MB
        // 8-32 MB
        // 32-128 MB
        // 128-512 MB
        // 512 MB+



        Map<String, Integer> distribution = new HashMap<>();
        // init
        distribution.put("0-8M", 0);
        distribution.put("8M-32M", 0);
        distribution.put("32M-128M", 0);
        distribution.put("128M-512M", 0);
        distribution.put("512M+", 0);

        try (FileIO fileIO = table.io()) {
            List<ManifestFile> manifests = snapshot.allManifests(fileIO);
            for (ManifestFile manifest : manifests) {
                switch (manifest.content()) {
                    case DATA:
                        for (DataFile file : ManifestFiles.read(manifest, fileIO, table.specs())) {
                            processFileSize(distribution, file.fileSizeInBytes());
                        }
                        break;
                    case DELETES:
                        for (DeleteFile file : ManifestFiles.readDeleteManifest(manifest, fileIO, table.specs())) {
                            processFileSize(distribution, file.fileSizeInBytes());
                        }
                        break;
                    default:
                        throw new RuntimeException("unreachable");
                }
            }
        }
        
        return distribution;
    }

    private void processFileSize(Map<String, Integer> distribution, long fileSize) {
        if (fileSize < 8_000_000) { // 8M
            distribution.merge("0-8M", 1, Integer::sum);
        } else if (fileSize < 32_000_000) { // 32M
            distribution.merge("8M-32M", 1, Integer::sum);
        } else if (fileSize < 128_000_000) { // 128M
            distribution.merge("32M-128M", 1, Integer::sum);
        } else if (fileSize < 512_000_000) { // 512M
            distribution.merge("128M-512M", 1, Integer::sum);
        } else {
            distribution.merge("512M+", 1, Integer::sum);
        }
    }
} 
