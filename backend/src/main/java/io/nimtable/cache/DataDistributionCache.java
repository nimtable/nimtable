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
package io.nimtable.cache;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.nimtable.db.entity.DataDistribution;
import io.nimtable.db.repository.DataDistributionRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DataDistributionCache {
    private static final Logger LOG = LoggerFactory.getLogger(DataDistributionCache.class);
    private static DataDistributionCache instance;
    private final Map<String, DataDistribution> memoryCache;
    private final DataDistributionRepository repository;
    private final ObjectMapper objectMapper;

    private DataDistributionCache() {
        this.memoryCache = new ConcurrentHashMap<>();
        this.repository = new DataDistributionRepository();
        this.objectMapper = new ObjectMapper();
    }

    public static synchronized DataDistributionCache getInstance() {
        if (instance == null) {
            instance = new DataDistributionCache();
        }
        return instance;
    }

    private String generateCacheKey(
            String snapshotId, String catalogName, String namespace, String tableName) {
        return String.format("%s:%s:%s:%s", snapshotId, catalogName, namespace, tableName);
    }

    public DataDistribution get(
            String snapshotId, String catalogName, String namespace, String tableName) {
        String cacheKey = generateCacheKey(snapshotId, catalogName, namespace, tableName);

        // Try memory cache first
        DataDistribution cached = memoryCache.get(cacheKey);
        if (cached != null) {
            LOG.debug("Cache hit in memory for key: {}", cacheKey);
            return cached;
        }

        // Try database cache
        cached = repository.findBySnapshotId(snapshotId, catalogName, namespace, tableName);
        if (cached != null) {
            LOG.debug("Cache hit in database for key: {}", cacheKey);
            memoryCache.put(cacheKey, cached);
            return cached;
        }

        LOG.debug("Cache miss for key: {}", cacheKey);
        return null;
    }

    public void put(
            String snapshotId,
            String catalogName,
            String namespace,
            String tableName,
            DataDistribution distribution) {
        String cacheKey = generateCacheKey(snapshotId, catalogName, namespace, tableName);

        // Save to database
        distribution.setSnapshotId(snapshotId);
        distribution.setCatalogName(catalogName);
        distribution.setNamespace(namespace);
        distribution.setTableName(tableName);
        repository.save(distribution);

        // Update memory cache
        memoryCache.put(cacheKey, distribution);
        LOG.debug("Cached distribution for key: {}", cacheKey);
    }

    public void remove(String snapshotId, String catalogName, String namespace, String tableName) {
        String cacheKey = generateCacheKey(snapshotId, catalogName, namespace, tableName);

        // Remove from database
        repository.deleteBySnapshotId(snapshotId, catalogName, namespace, tableName);

        // Remove from memory cache
        memoryCache.remove(cacheKey);
        LOG.debug("Removed distribution from cache for key: {}", cacheKey);
    }

    public void clear() {
        memoryCache.clear();
        LOG.debug("Cleared memory cache");
    }

    public void removeByCatalogName(String catalogName) {
        // Remove from database first
        repository.deleteByCatalogName(catalogName);

        // Remove matching entries from memory cache
        String marker = ":" + catalogName + ":";
        List<String> keysToRemove = new ArrayList<>();
        for (String key : memoryCache.keySet()) {
            if (key.contains(marker)) {
                keysToRemove.add(key);
            }
        }
        for (String key : keysToRemove) {
            memoryCache.remove(key);
        }
        LOG.debug(
                "Removed {} entries from memory cache for catalog: {}",
                keysToRemove.size(),
                catalogName);
    }

    public Map<String, DataDistribution> getMemoryCache() {
        return memoryCache;
    }
}
