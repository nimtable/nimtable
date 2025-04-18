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
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.iceberg.*;
import org.apache.iceberg.catalog.Catalog;
import org.apache.iceberg.catalog.TableIdentifier;
import org.apache.iceberg.io.FileIO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
            response.sendError(
                    HttpServletResponse.SC_BAD_REQUEST,
                    "Invalid path format. Expected: /catalogName/namespace/table");
            return;
        }

        String catalogName = parts[1];
        String namespace = parts[2];
        String tableName = parts[3];

        try {
            Config.Catalog catalogConfig =
                    config.catalogs().stream()
                            .filter(c -> c.name().equals(catalogName))
                            .findFirst()
                            .orElseThrow(
                                    () ->
                                            new IllegalArgumentException(
                                                    "Catalog not found: " + catalogName));

            Catalog catalog =
                    CatalogUtil.buildIcebergCatalog(
                            catalogConfig.name(),
                            catalogConfig.properties(),
                            new org.apache.hadoop.conf.Configuration());

            Table table = catalog.loadTable(TableIdentifier.of(namespace, tableName));

            DataDistribution dataDistribution = calculateDistributionStats(table);
            int totalFiles = 0;
            for (Map.Entry<String, Integer> entry : dataDistribution.ranges.entrySet()) {
                totalFiles += entry.getValue();
            }

            ObjectNode rootNode = MAPPER.createObjectNode();
            ObjectNode rangeNode = MAPPER.createObjectNode();
            for (Map.Entry<String, Integer> entry : dataDistribution.ranges.entrySet()) {
                String range = entry.getKey();
                int count = entry.getValue();
                double percentage = totalFiles > 0 ? Math.round((count * 100.0) / totalFiles) : 0;

                ObjectNode rangeData = objectMapper.createObjectNode();
                rangeData.put("count", count);
                rangeData.put("percentage", percentage);

                rangeNode.set(range, rangeData);
            }

            rootNode.set("ranges", rangeNode);
            rootNode.put("dataFileCount", dataDistribution.dataFileCount);
            rootNode.put("positionDeleteFileCount", dataDistribution.positionDeleteFileCount);
            rootNode.put("eqDeleteFileCount", dataDistribution.eqDeleteFileCount);
            rootNode.put("dataFileSizeInBytes", dataDistribution.dataFileSizeInBytes);
            rootNode.put(
                    "positionDeleteFileSizeInBytes",
                    dataDistribution.positionDeleteFileSizeInBytes);
            rootNode.put("eqDeleteFileSizeInBytes", dataDistribution.eqDeleteFileSizeInBytes);

            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            objectMapper.writeValue(response.getWriter(), rootNode);
        } catch (Exception e) {
            LOG.error("Error processing distribution request", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    class DataDistribution {
        int dataFileCount;
        int positionDeleteFileCount;
        int eqDeleteFileCount;
        int dataFileSizeInBytes;
        int positionDeleteFileSizeInBytes;
        int eqDeleteFileSizeInBytes;
        Map<String, Integer> ranges;
    }

    private DataDistribution calculateDistributionStats(Table table) {
        var snapshot = table.currentSnapshot();
        DataDistribution dataDistribution = new DataDistribution();
        Map<String, Integer> distribution = new HashMap<>();
        distribution.put("0-8M", 0);
        distribution.put("8M-32M", 0);
        distribution.put("32M-128M", 0);
        distribution.put("128M-512M", 0);
        distribution.put("512M+", 0);
        dataDistribution.ranges = distribution;

        if (snapshot == null) {
            return dataDistribution;
        }

        try (FileIO fileIO = table.io()) {
            List<ManifestFile> manifests = snapshot.allManifests(fileIO);
            for (ManifestFile manifest : manifests) {
                switch (manifest.content()) {
                    case DATA:
                        for (DataFile file : ManifestFiles.read(manifest, fileIO, table.specs())) {
                            processFileSize(distribution, file.fileSizeInBytes());
                            dataDistribution.dataFileCount += 1;
                            dataDistribution.dataFileSizeInBytes += file.fileSizeInBytes();
                        }
                        break;
                    case DELETES:
                        for (DeleteFile file :
                                ManifestFiles.readDeleteManifest(manifest, fileIO, table.specs())) {
                            processFileSize(distribution, file.fileSizeInBytes());
                            if (file.content() == FileContent.EQUALITY_DELETES) {
                                dataDistribution.eqDeleteFileCount += 1;
                                dataDistribution.eqDeleteFileSizeInBytes += file.fileSizeInBytes();
                            } else if (file.content() == FileContent.POSITION_DELETES) {
                                dataDistribution.positionDeleteFileCount += 1;
                                dataDistribution.positionDeleteFileSizeInBytes +=
                                        file.fileSizeInBytes();
                            }
                        }
                        break;
                    default:
                        throw new RuntimeException("unreachable");
                }
            }
        }

        return dataDistribution;
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
