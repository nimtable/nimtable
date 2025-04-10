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
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.LoadingCache;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.apache.iceberg.*;
import org.apache.iceberg.catalog.Catalog;
import org.apache.iceberg.catalog.TableIdentifier;
import org.apache.iceberg.io.FileIO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DistributionServlet extends HttpServlet {
    private static final Logger LOG = LoggerFactory.getLogger(DistributionServlet.class);
    private static final String CACHE_KEY = "distributionCache";
    private static final String SERVLET_KEY = "distributionServlet";
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private final Config config;
    private final ObjectMapper objectMapper;
    private LoadingCache<String, ObjectNode> cache;

    public DistributionServlet(Config config) {
        this.config = config;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public void init() throws ServletException {
        super.init();
        getServletContext().setAttribute(SERVLET_KEY, this);
        this.cache = Caffeine.newBuilder()
            .expireAfterWrite(config.cache().distributionExpireSeconds(), TimeUnit.SECONDS)
            .build(this::loadDistribution);
        getServletContext().setAttribute(CACHE_KEY, cache);
    }

    private LoadingCache<String, ObjectNode> getCache() {
        return cache;
    }

    private ObjectNode getDistribution(String cacheKey) {
        try {
            var entry = getCache().get(cacheKey);
            if (entry != null) {
                LOG.info("Cache hit for key: {}", cacheKey);
            }

            return entry;
        } catch (Exception e) {
            LOG.error("Error getting distribution from cache for key: {}", cacheKey, e);
            // If cache loading fails, invalidate the cache and try to load directly
            getCache().invalidate(cacheKey);
            ObjectNode distribution = loadDistribution(cacheKey);
            // Update cache with the new distribution
            LOG.info("Updating cache for key: {}", cacheKey);
            getCache().put(cacheKey, distribution);
            return distribution;
        }
    }

    private ObjectNode loadDistribution(String key) {
        String[] parts = key.split("/");
        String catalogName = parts[0];
        String namespace = parts[1];
        String tableName = parts[2];

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
            Map<String, Integer> distribution = calculateDistributionStats(table);
            int totalFiles = 0;
            for (Map.Entry<String, Integer> entry : distribution.entrySet()) {
                totalFiles += entry.getValue();
            }

            ObjectNode rootNode = MAPPER.createObjectNode();
            for (Map.Entry<String, Integer> entry : distribution.entrySet()) {
                String range = entry.getKey();
                int count = entry.getValue();
                double percentage = totalFiles > 0 ? Math.round((count * 100.0) / totalFiles) : 0;

                ObjectNode rangeData = objectMapper.createObjectNode();
                rangeData.put("count", count);
                rangeData.put("percentage", percentage);

                rootNode.set(range, rangeData);
            }
            return rootNode;
        } catch (Exception e) {
            LOG.error(
                    "Error loading distribution for {}/{}/{}",
                    catalogName,
                    namespace,
                    tableName,
                    e);
            throw new RuntimeException(e);
        }
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
            String cacheKey = String.format("%s/%s/%s", catalogName, namespace, tableName);
            ObjectNode distribution = getDistribution(cacheKey);

            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            objectMapper.writeValue(response.getWriter(), distribution);
        } catch (Exception e) {
            LOG.error("Error processing distribution request", e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    public void invalidateCache(String catalogName, String namespace, String tableName) {
        String cacheKey = String.format("%s/%s/%s", catalogName, namespace, tableName);
        getCache().invalidate(cacheKey);
    }

    private Map<String, Integer> calculateDistributionStats(Table table) {
        var snapshot = table.currentSnapshot();
        Map<String, Integer> distribution = new HashMap<>();
        distribution.put("0-8M", 0);
        distribution.put("8M-32M", 0);
        distribution.put("32M-128M", 0);
        distribution.put("128M-512M", 0);
        distribution.put("512M+", 0);

        if (snapshot == null) {
            return distribution;
        }

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
                        for (DeleteFile file :
                                ManifestFiles.readDeleteManifest(manifest, fileIO, table.specs())) {
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
