/*
 * Copyright 2026 Nimtable
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
import io.nimtable.cache.DataDistributionCache;
import io.nimtable.db.entity.DataDistribution;
import io.nimtable.db.repository.CatalogRepository;
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
    private final CatalogRepository catalogRepository;
    private final DataDistributionCache distributionCache;

    public DistributionServlet(Config config) {
        this.config = config;
        this.objectMapper = new ObjectMapper();
        this.catalogRepository = new CatalogRepository();
        this.distributionCache = DataDistributionCache.getInstance();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse response) throws IOException {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing table identifier");
            return;
        }

        // Parse path: /catalogName/namespace/table[/snapshot-id]
        String[] parts = pathInfo.split("/");
        if (parts.length < 4 || parts.length > 5) {
            response.sendError(
                    HttpServletResponse.SC_BAD_REQUEST,
                    "Invalid path format. Expected: /catalogName/namespace/table[/snapshot-id]");
            return;
        }

        String catalogName = parts[1];
        String namespace = parts[2];
        String tableName = parts[3];
        String snapshotId = parts.length > 4 ? parts[4] : null;

        try {
            Map<String, String> properties;

            // First check config
            Config.Catalog catalogConfig = config.getCatalog(catalogName);
            if (catalogConfig != null) {
                properties = catalogConfig.properties();
            } else {
                // Check database
                io.nimtable.db.entity.Catalog dbCatalog = catalogRepository.findByName(catalogName);
                if (dbCatalog == null) {
                    throw new IllegalArgumentException("Catalog not found: " + catalogName);
                }
                properties = new HashMap<>(dbCatalog.getProperties());
                properties.put("type", dbCatalog.getType());
                properties.put("warehouse", dbCatalog.getWarehouse());
                properties.put("uri", dbCatalog.getUri());
            }

            Catalog catalog =
                    CatalogUtil.buildIcebergCatalog(
                            catalogName, properties, new org.apache.hadoop.conf.Configuration());

            DataDistribution dataDistribution =
                    calculateDistributionStats(
                            catalog, catalogName, namespace, tableName, snapshotId);
            int totalFiles = 0;
            for (Map.Entry<String, Integer> entry : dataDistribution.getRanges().entrySet()) {
                totalFiles += entry.getValue();
            }

            ObjectNode rootNode = MAPPER.createObjectNode();
            ObjectNode rangeNode = MAPPER.createObjectNode();
            for (Map.Entry<String, Integer> entry : dataDistribution.getRanges().entrySet()) {
                String range = entry.getKey();
                int count = entry.getValue();
                double percentage = totalFiles > 0 ? Math.round((count * 100.0) / totalFiles) : 0;

                ObjectNode rangeData = objectMapper.createObjectNode();
                rangeData.put("count", count);
                rangeData.put("percentage", percentage);

                rangeNode.set(range, rangeData);
            }

            rootNode.set("ranges", rangeNode);
            rootNode.put("dataFileCount", dataDistribution.getDataFileCount());
            rootNode.put("positionDeleteFileCount", dataDistribution.getPositionDeleteFileCount());
            rootNode.put("eqDeleteFileCount", dataDistribution.getEqDeleteFileCount());
            rootNode.put("dataFileSizeInBytes", dataDistribution.getDataFileSizeInBytes());
            rootNode.put(
                    "positionDeleteFileSizeInBytes",
                    dataDistribution.getPositionDeleteFileSizeInBytes());
            rootNode.put("eqDeleteFileSizeInBytes", dataDistribution.getEqDeleteFileSizeInBytes());
            rootNode.put("dataFileRecordCount", dataDistribution.getDataFileRecordCount());
            rootNode.put(
                    "positionDeleteFileRecordCount",
                    dataDistribution.getPositionDeleteFileRecordCount());
            rootNode.put("eqDeleteFileRecordCount", dataDistribution.getEqDeleteFileRecordCount());

            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            objectMapper.writeValue(response.getWriter(), rootNode);
        } catch (Exception e) {
            LOG.error("Error processing distribution request", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    private DataDistribution calculateDistributionStats(
            Catalog catalog,
            String catalogName,
            String namespace,
            String tableName,
            String snapshotId) {
        if (snapshotId != null) {
            // Try to get from cache first
            DataDistribution cached =
                    distributionCache.get(snapshotId, catalogName, namespace, tableName);

            if (cached != null) {
                LOG.debug(
                        "Using cached distribution for snapshot: {}, catalogName: {}, namespace: {}, tableName {}",
                        snapshotId,
                        catalogName,
                        namespace,
                        tableName);
                return cached;
            }
        }

        Table table = catalog.loadTable(TableIdentifier.of(namespace, tableName));

        Snapshot snapshot;
        if (snapshotId != null) {
            snapshot = table.snapshot(Long.parseLong(snapshotId));
            if (snapshot == null) {
                throw new IllegalArgumentException("Snapshot not found: " + snapshotId);
            }
        } else {
            snapshot = table.currentSnapshot();
            // try cache again
            if (snapshot != null) {
                DataDistribution cached =
                        distributionCache.get(
                                String.valueOf(snapshot.snapshotId()),
                                catalogName,
                                namespace,
                                tableName);
                if (cached != null) {
                    LOG.debug(
                            "Using cached distribution for snapshot: {}, catalogName: {}, namespace: {}, tableName {}",
                            snapshotId,
                            catalogName,
                            namespace,
                            tableName);
                    return cached;
                }
            }
        }

        DataDistribution dataDistribution = new DataDistribution();
        Map<String, Integer> distribution = new HashMap<>();
        distribution.put("0-8M", 0);
        distribution.put("8M-32M", 0);
        distribution.put("32M-128M", 0);
        distribution.put("128M-512M", 0);
        distribution.put("512M+", 0);
        dataDistribution.setRanges(distribution);

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
                            dataDistribution.setDataFileCount(
                                    dataDistribution.getDataFileCount() + 1);
                            dataDistribution.setDataFileSizeInBytes(
                                    dataDistribution.getDataFileSizeInBytes()
                                            + file.fileSizeInBytes());
                            dataDistribution.setDataFileRecordCount(
                                    dataDistribution.getDataFileRecordCount() + file.recordCount());
                        }
                        break;
                    case DELETES:
                        for (DeleteFile file :
                                ManifestFiles.readDeleteManifest(manifest, fileIO, table.specs())) {
                            processFileSize(distribution, file.fileSizeInBytes());
                            if (file.content() == FileContent.EQUALITY_DELETES) {
                                dataDistribution.setEqDeleteFileCount(
                                        dataDistribution.getEqDeleteFileCount() + 1);
                                dataDistribution.setEqDeleteFileSizeInBytes(
                                        dataDistribution.getEqDeleteFileSizeInBytes()
                                                + file.fileSizeInBytes());
                                dataDistribution.setEqDeleteFileRecordCount(
                                        dataDistribution.getEqDeleteFileRecordCount()
                                                + file.recordCount());
                            } else if (file.content() == FileContent.POSITION_DELETES) {
                                dataDistribution.setPositionDeleteFileCount(
                                        dataDistribution.getPositionDeleteFileCount() + 1);
                                dataDistribution.setPositionDeleteFileSizeInBytes(
                                        dataDistribution.getPositionDeleteFileSizeInBytes()
                                                + file.fileSizeInBytes());
                                dataDistribution.setPositionDeleteFileRecordCount(
                                        dataDistribution.getPositionDeleteFileRecordCount()
                                                + file.recordCount());
                            }
                        }
                        break;
                    default:
                        throw new RuntimeException("unreachable");
                }
            }
        }

        // Cache the result
        if (snapshot != null) {
            distributionCache.put(
                    String.valueOf(snapshot.snapshotId()),
                    catalogName,
                    namespace,
                    tableName,
                    dataDistribution);
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
