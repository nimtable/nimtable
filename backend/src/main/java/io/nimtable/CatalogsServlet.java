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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.ebean.DB;
import io.nimtable.cache.DataDistributionCache;
import io.nimtable.db.entity.Catalog;
import io.nimtable.db.repository.CatalogRepository;
import io.nimtable.db.repository.DataDistributionRepository;
import io.nimtable.db.repository.ScheduledTaskRepository;
import io.nimtable.spark.LocalSpark;
import io.nimtable.util.SensitiveDataFilter;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.Closeable;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentSkipListSet;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.apache.hadoop.conf.Configuration;
import org.apache.iceberg.CatalogUtil;
import org.apache.spark.sql.SparkSession;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CatalogsServlet extends HttpServlet {
    private static final Logger LOG = LoggerFactory.getLogger(CatalogsServlet.class);
    private static final Set<String> DELETED_CONFIG_CATALOGS = new ConcurrentSkipListSet<>();
    private final Config config;
    private final ObjectMapper mapper;
    private final CatalogRepository catalogRepository;
    private final ScheduledTaskRepository scheduledTaskRepository;
    private final DataDistributionRepository dataDistributionRepository;
    private final DataDistributionCache dataDistributionCache;

    public CatalogsServlet(Config config) {
        this.config = config;
        this.mapper = new ObjectMapper();
        this.mapper.findAndRegisterModules();
        this.catalogRepository = new CatalogRepository();
        this.scheduledTaskRepository = new ScheduledTaskRepository();
        this.dataDistributionRepository = new DataDistributionRepository();
        this.dataDistributionCache = DataDistributionCache.getInstance();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();

        // Handle specific catalog request: /api/catalogs/{catalogName}
        if (pathInfo != null && !pathInfo.equals("/") && !pathInfo.isEmpty()) {
            String catalogName = pathInfo.substring(1); // Remove leading slash
            handleGetCatalogDetails(catalogName, response);
            return;
        }

        // Handle list all catalogs request: /api/catalogs
        // Get catalogs from both config and database
        List<String> configCatalogs =
                config.catalogs() != null
                        ? config.catalogs().stream()
                                .map(Config.Catalog::name)
                                    .filter(name -> !DELETED_CONFIG_CATALOGS.contains(name))
                                .collect(Collectors.toList())
                        : new ArrayList<>();
        List<String> dbCatalogs =
                catalogRepository.findAll().stream()
                        .map(Catalog::getName)
                        .collect(Collectors.toList());

        // Combine both lists
        List<String> allCatalogs = new ArrayList<>(configCatalogs);
        allCatalogs.addAll(dbCatalogs);

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        mapper.writeValue(response.getOutputStream(), allCatalogs);
    }

    private void handleGetCatalogDetails(String catalogName, HttpServletResponse response)
            throws IOException {
        try {
            // First try to get from database
            Catalog dbCatalog = catalogRepository.findByName(catalogName);

            if (dbCatalog != null) {
                // Filter sensitive properties before returning to client
                Map<String, String> filteredProperties =
                        SensitiveDataFilter.filterSensitiveProperties(dbCatalog.getProperties());

                // Create filtered catalog object
                Map<String, Object> filteredCatalog = new HashMap<>();
                filteredCatalog.put("name", dbCatalog.getName());
                filteredCatalog.put("type", dbCatalog.getType());
                filteredCatalog.put("uri", dbCatalog.getUri());
                filteredCatalog.put("warehouse", dbCatalog.getWarehouse());
                filteredCatalog.put("properties", filteredProperties);

                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                mapper.writeValue(response.getOutputStream(), filteredCatalog);
                return;
            }

            // If not in database, check if it exists in config
            Config.Catalog configCatalog = config.getCatalog(catalogName);
            if (configCatalog != null) {
                // Create a catalog object from config data
                Map<String, Object> catalogData = new HashMap<>();
                catalogData.put("name", catalogName);

                // Filter sensitive properties before returning to client
                Map<String, String> properties = configCatalog.properties();
                Map<String, String> filteredProperties =
                        SensitiveDataFilter.filterSensitiveProperties(properties);

                // Extract type, uri, warehouse from filtered properties
                if (filteredProperties.containsKey("type")) {
                    catalogData.put("type", filteredProperties.get("type"));
                }
                if (filteredProperties.containsKey("uri")) {
                    catalogData.put("uri", filteredProperties.get("uri"));
                }
                if (filteredProperties.containsKey("warehouse")) {
                    catalogData.put("warehouse", filteredProperties.get("warehouse"));
                }
                catalogData.put("properties", filteredProperties);

                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                mapper.writeValue(response.getOutputStream(), catalogData);
                return;
            }

            // Catalog not found
            response.sendError(
                    HttpServletResponse.SC_NOT_FOUND, "Catalog not found: " + catalogName);

        } catch (Exception e) {
            LOG.error("Error getting catalog details for: " + catalogName, e);
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Internal error");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            // Sub-route: seed demo data for a catalog.
            // POST /api/catalogs/{catalogName}/seed-demo
            // 1) Prefer request URI parsing (works even if getPathInfo() behaves unexpectedly
            // behind proxies).
            String requestUri = req.getRequestURI();
            if (requestUri != null) {
                String suffix = "/seed-demo";
                String suffixSlash = "/seed-demo/";
                boolean isSeed = requestUri.endsWith(suffix) || requestUri.endsWith(suffixSlash);
                int catalogsIdx = requestUri.indexOf("/api/catalogs/");
                if (isSeed && catalogsIdx >= 0) {
                    String after = requestUri.substring(catalogsIdx + "/api/catalogs/".length());
                    // after: "{catalogName}/seed-demo" or "{catalogName}/seed-demo/"
                    int slashIdx = after.indexOf('/');
                    if (slashIdx > 0) {
                        String catalogName = after.substring(0, slashIdx);
                        if (!catalogName.isEmpty()) {
                            handleSeedDemo(catalogName, req, resp);
                            return;
                        }
                    }
                }
            }

            // 2) Fallback to Servlet pathInfo parsing.
            String pathInfo = req.getPathInfo();
            if (pathInfo != null) {
                // Expected: "/{catalogName}/seed-demo" (optionally with trailing "/")
                String cleaned =
                        pathInfo.endsWith("/")
                                ? pathInfo.substring(0, pathInfo.length() - 1)
                                : pathInfo;
                String[] parts = cleaned.split("/");
                // parts: ["", "{catalogName}", "seed-demo"]
                if (parts.length >= 3
                        && "seed-demo".equals(parts[2])
                        && parts[1] != null
                        && !parts[1].isEmpty()) {
                    String catalogName = parts[1];
                    handleSeedDemo(catalogName, req, resp);
                    return;
                }
            }

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(req.getReader());

            // Validate required fields
            String name = root.path("name").asText();
            String type = root.path("type").asText();

            if (name == null || name.trim().isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Validation error");
                errorResponse.put("message", "Catalog name is required");
                resp.setContentType("application/json");
                mapper.writeValue(resp.getWriter(), errorResponse);
                return;
            }

            if (type == null || type.trim().isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Validation error");
                errorResponse.put("message", "Catalog type is required");
                resp.setContentType("application/json");
                mapper.writeValue(resp.getWriter(), errorResponse);
                return;
            }

            // Build properties map
            Map<String, String> properties = new HashMap<>();
            properties.put("type", type);

            String uri = root.path("uri").asText();
            if (uri != null && !uri.trim().isEmpty()) {
                properties.put("uri", uri);
            }

            String warehouse = root.path("warehouse").asText();
            if (warehouse != null && !warehouse.trim().isEmpty()) {
                properties.put("warehouse", warehouse);
            }

            // Add custom properties
            JsonNode propertiesNode = root.path("properties");
            if (!propertiesNode.isMissingNode()) {
                propertiesNode
                        .fields()
                        .forEachRemaining(
                                entry -> {
                                    properties.put(entry.getKey(), entry.getValue().asText());
                                });
            }

            // Validate catalog configuration by attempting to build it
            try {
                org.apache.iceberg.catalog.Catalog icebergCatalog =
                        CatalogUtil.buildIcebergCatalog(name, properties, new Configuration());
                if (icebergCatalog instanceof Closeable) {
                    ((Closeable) icebergCatalog).close();
                }
            } catch (Exception e) {
                LOG.error("Failed to validate catalog configuration", e);
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                // Create a more detailed error response
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Invalid catalog configuration");
                errorResponse.put("message", e.getMessage());
                errorResponse.put("details", getDetailedErrorMessage(e));
                resp.setContentType("application/json");
                mapper.writeValue(resp.getWriter(), errorResponse);
                return;
            }

            // Create and save catalog entity
            Catalog catalog = new Catalog();
            catalog.setName(name);
            catalog.setType(type);
            catalog.setUri(uri);
            catalog.setWarehouse(warehouse);
            catalog.setProperties(properties);

            // Save to database
            catalogRepository.save(catalog);

            // Register the catalog dynamically
            Server.registerCatalog(catalog.getName(), properties);

            // Update LocalSpark instance with new catalog configuration
            LocalSpark.updateInstance(config);

            // Return success response
            resp.setStatus(HttpServletResponse.SC_CREATED);
            resp.setContentType("application/json");
            resp.getWriter().write(mapper.writeValueAsString(catalog));

        } catch (Exception e) {
            LOG.error("Failed to create catalog", e);
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to create catalog");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("details", getDetailedErrorMessage(e));
            resp.setContentType("application/json");
            mapper.writeValue(resp.getWriter(), errorResponse);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        try {
            String pathInfo = req.getPathInfo();
            if (pathInfo == null || pathInfo.isEmpty() || pathInfo.equals("/")) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Validation error");
                errorResponse.put("message", "Catalog name is required");
                resp.setContentType("application/json");
                mapper.writeValue(resp.getWriter(), errorResponse);
                return;
            }

            // Remove leading slash
            String catalogName = pathInfo.substring(1);
            boolean purge = Boolean.parseBoolean(req.getParameter("purge"));

            // Look up catalog in DB and config
            Catalog catalog = catalogRepository.findByName(catalogName);
            Config.Catalog configCatalog = config.getCatalog(catalogName);

            if (catalog == null && configCatalog == null && !purge) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Not found");
                errorResponse.put("message", "Catalog not found: " + catalogName);
                resp.setContentType("application/json");
                mapper.writeValue(resp.getWriter(), errorResponse);
                return;
            }

            String warehouseToDelete = null;
            boolean isLocalHadoop =
                    (catalog != null && "hadoop".equalsIgnoreCase(catalog.getType()))
                            || (configCatalog != null
                                    && (configCatalog.properties().containsKey(
                                                    Config.Catalog.WAREHOUSE_LOCATION)
                                            || "hadoop"
                                                    .equalsIgnoreCase(
                                                            configCatalog
                                                                    .properties()
                                                                    .getOrDefault(
                                                                            Config.Catalog
                                                                                    .CATALOG_IMPL,
                                                                            ""))));
            if (isLocalHadoop) {
                if (catalog != null) {
                    warehouseToDelete = catalog.getWarehouse();
                } else if (configCatalog != null) {
                    warehouseToDelete =
                            configCatalog
                                    .properties()
                                    .getOrDefault(Config.Catalog.WAREHOUSE_LOCATION, null);
                }
            }

            if (purge) {
                purgeCatalogData(catalogName);
            }

            if (isLocalHadoop) {
                dropNamespacesAndTables(catalogName);
                deleteWarehouseDirectory(catalogName, warehouseToDelete);
            }

            // Delete from database (if it exists there; config-defined catalogs can't be deleted
            // here)
            if (catalog != null) {
                catalogRepository.delete(catalog);
                // Remove REST servlet route so the catalog name can be re-created cleanly.
                Server.unregisterCatalog(catalogName);
            }

            // Hide config-defined catalog for the current runtime session
            if (configCatalog != null) {
                DELETED_CONFIG_CATALOGS.add(catalogName);
                Server.unregisterCatalog(catalogName);
            }

            // Update LocalSpark instance with new catalog configuration
            if (catalog != null) {
                LocalSpark.updateInstance(config);
            }

            // Return success response
            resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
        } catch (Exception e) {
            LOG.error("Failed to delete catalog", e);
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to delete catalog");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("details", getDetailedErrorMessage(e));
            resp.setContentType("application/json");
            mapper.writeValue(resp.getWriter(), errorResponse);
        }
    }

    private void handleSeedDemo(
            String catalogName, HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();

        if (catalogName == null || catalogName.trim().isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.setContentType("application/json");
            mapper.writeValue(
                    resp.getWriter(),
                    Map.of("error", "Validation error", "message", "Catalog name is required"));
            return;
        }

        boolean existsInConfig =
                config.catalogs() != null
                        && config.catalogs().stream().anyMatch(c -> catalogName.equals(c.name()));
        Catalog dbCatalog = catalogRepository.findByName(catalogName);

        if (!existsInConfig && dbCatalog == null) {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            resp.setContentType("application/json");
            mapper.writeValue(
                    resp.getWriter(),
                    Map.of("error", "Not found", "message", "Catalog not found: " + catalogName));
            return;
        }

        // Body is optional.
        String body = req.getReader().lines().collect(Collectors.joining("\n")).trim();
        JsonNode root = body.isEmpty() ? mapper.createObjectNode() : mapper.readTree(body);

        String namespace = root.path("namespace").asText("nimtable_demo").trim();
        String table = root.path("table").asText("sample").trim();
        int requestedRows = root.path("rows").asInt(3);
        String phase = root.path("phase").asText("all").trim().toLowerCase();

        if (namespace.isEmpty() || table.isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.setContentType("application/json");
            mapper.writeValue(
                    resp.getWriter(),
                    Map.of(
                            "error",
                            "Validation error",
                            "message",
                            "namespace and table are required"));
            return;
        }

        // Keep the demo small and safe.
        int rows = Math.max(0, Math.min(100, requestedRows));

        String qCatalog = quoteIdent(catalogName);
        String qNamespace = quoteIdent(namespace);
        String qTable = quoteIdent(table);
        String fqNamespace = qCatalog + "." + qNamespace;
        String fqTable = qCatalog + "." + qNamespace + "." + qTable;

        try {
            SparkSession spark = LocalSpark.getInstance(config).getSpark();

            List<String> sql = new ArrayList<>();
            boolean alreadyHadData = false;
            int insertedRows = 0;

            // Step 1: create namespace
            if (phase.equals("all") || phase.equals("namespace")) {
                String createNamespaceSql =
                        String.format("CREATE NAMESPACE IF NOT EXISTS %s", fqNamespace);
                sql.add(createNamespaceSql);
                spark.sql(createNamespaceSql);
            }

            // Step 2: create table
            if (phase.equals("all") || phase.equals("table")) {
                String createTableSql =
                        String.format(
                                "CREATE TABLE IF NOT EXISTS %s ("
                                        + "id BIGINT, "
                                        + "name STRING, "
                                        + "created_at TIMESTAMP"
                                        + ") USING iceberg",
                                fqTable);
                sql.add(createTableSql);
                spark.sql(createTableSql);
            }

            // Step 3: populate
            if (phase.equals("all") || phase.equals("populate")) {
                String countSql = String.format("SELECT count(*) AS c FROM %s", fqTable);
                sql.add(countSql);
                long count =
                        spark.sql(countSql).collectAsList().stream()
                                .findFirst()
                                .map(r -> ((Number) r.getAs("c")).longValue())
                                .orElse(0L);

                alreadyHadData = count > 0;

                if (!alreadyHadData && rows > 0) {
                    String values =
                            " (1, 'alice', current_timestamp()),"
                                    + " (2, 'bob', current_timestamp()),"
                                    + " (3, 'cathy', current_timestamp())";
                    // If caller requests fewer than 3, truncate; if more, keep 3 (simple,
                    // predictable).
                    if (rows < 3) {
                        if (rows == 1) {
                            values = " (1, 'alice', current_timestamp())";
                        } else {
                            values =
                                    " (1, 'alice', current_timestamp()), (2, 'bob', current_timestamp())";
                        }
                    }
                    String insertSql = String.format("INSERT INTO %s VALUES%s", fqTable, values);
                    sql.add(insertSql);
                    spark.sql(insertSql);
                    insertedRows = Math.min(rows, 3);
                }
            }

            resp.setStatus(HttpServletResponse.SC_OK);
            resp.setContentType("application/json");
            mapper.writeValue(
                    resp.getWriter(),
                    Map.of(
                            "catalog",
                            catalogName,
                            "namespace",
                            namespace,
                            "table",
                            table,
                            "tableFqn",
                            catalogName + "." + namespace + "." + table,
                            "phase",
                            phase,
                            "sql",
                            sql,
                            "alreadyHadData",
                            alreadyHadData,
                            "insertedRows",
                            insertedRows));
        } catch (Exception e) {
            LOG.error("Failed to seed demo table for catalog: {}", catalogName, e);
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.setContentType("application/json");
            mapper.writeValue(
                    resp.getWriter(),
                    Map.of(
                            "error",
                            "Failed to seed demo table",
                            "message",
                            e.getMessage() == null ? "Unknown error" : e.getMessage(),
                            "details",
                            getDetailedErrorMessage(e)));
        }
    }

    private static String quoteIdent(String ident) {
        // Spark SQL uses backticks for identifiers. Escape embedded backticks defensively.
        return "`" + ident.replace("`", "``") + "`";
    }

    private void purgeCatalogData(String catalogName) {
        try {
            int scheduledTasksDeleted = scheduledTaskRepository.deleteByCatalogName(catalogName);
            int distributionsDeleted = dataDistributionRepository.deleteByCatalogName(catalogName);
            int tableSummariesDeleted =
                    DB.createUpdate(
                                    Catalog.class,
                                    "delete from table_summaries where catalog_name = :catalogName")
                            .setParameter("catalogName", catalogName)
                            .execute();

            // Clear in-memory distribution cache entries for this catalog
            dataDistributionCache.removeByCatalogName(catalogName);

            LOG.info(
                    "Purged catalog data for {} (scheduled_tasks={}, data_distributions={}, table_summaries={})",
                    catalogName,
                    scheduledTasksDeleted,
                    distributionsDeleted,
                    tableSummariesDeleted);
        } catch (Exception e) {
            // Purge should be best-effort but must not leave the system in an unknown state
            // silently.
            LOG.error("Failed to purge catalog data for: {}", catalogName, e);
            throw e;
        }
    }

    private void deleteWarehouseDirectory(String catalogName, String warehousePath) throws IOException {
        if (warehousePath == null || warehousePath.isBlank()) {
            LOG.info("No warehouse path recorded for catalog {}; skip deleting files.", catalogName);
            return;
        }

        if (warehousePath == null) {
            LOG.info("No warehouse path recorded for catalog {}; skip deleting files.", catalogName);
            return;
        }

        warehousePath = warehousePath.trim();
        if (warehousePath.isEmpty()) {
            LOG.info("Empty warehouse path for catalog {}; skip deleting files.", catalogName);
            return;
        }

        // Guard against non-local schemes (e.g., s3://) — only delete local file paths.
        if (warehousePath.contains("://")) {
            LOG.warn(
                    "Refusing to delete non-local warehouse path {} for catalog {}",
                    warehousePath,
                    catalogName);
            return;
        }

        Path warehouse = Paths.get(warehousePath).normalize();
        // Safety guard: never attempt to delete root or an empty path
        if (warehouse.getNameCount() == 0 || "/".equals(warehouse.toString())) {
            LOG.warn(
                    "Refusing to delete warehouse path {} for catalog {} (path too broad)",
                    warehousePath,
                    catalogName);
            return;
        }

        if (!Files.exists(warehouse)) {
            LOG.info(
                    "Warehouse path {} for catalog {} does not exist on disk; nothing to delete.",
                    warehouse,
                    catalogName);
            return;
        }

        LOG.info("Deleting warehouse directory {} for catalog {}", warehouse, catalogName);

        try {
            deleteRecursively(warehouse);
        } catch (IOException e) {
            LOG.warn(
                    "Java delete failed for warehouse {} ({}). Trying chmod -R u+rwX + rm -rf.",
                    warehouse,
                    e.toString());
            try {
                ensureWritable(warehouse);
            } catch (IOException chmodErr) {
                LOG.warn(
                        "chmod -R u+rwX failed for warehouse {} ({}), continuing to rm -rf anyway.",
                        warehouse,
                        chmodErr.toString());
            }
            fallbackShellDelete(warehouse);
        }

        if (Files.exists(warehouse)) {
            LOG.warn("Warehouse directory {} still exists after delete attempt", warehouse);
        } else {
            LOG.info("Deleted warehouse directory {} for catalog {}", warehouse, catalogName);
        }
    }

    private void dropNamespacesAndTables(String catalogName) {
        try {
            SparkSession spark = LocalSpark.getSession();
            Dataset<Row> namespaces =
                    spark.sql(
                            String.format(
                                    "SHOW NAMESPACES IN `%s`", sanitizeIdent(catalogName)));
            List<String> nsList =
                    namespaces.collectAsList().stream()
                            .map(
                                    row -> {
                                        try {
                                            return row.getString(0);
                                        } catch (Exception e) {
                                            return null;
                                        }
                                    })
                            .filter(ns -> ns != null && !ns.isBlank())
                            .toList();

            for (String ns : nsList) {
                String sql =
                        String.format(
                                "DROP NAMESPACE IF EXISTS `%s`.`%s` CASCADE",
                                sanitizeIdent(catalogName), sanitizeIdent(ns));
                try {
                    spark.sql(sql);
                    LOG.info("Dropped namespace {}.{}", catalogName, ns);
                } catch (Exception e) {
                    LOG.warn("Failed to drop namespace {}.{}: {}", catalogName, ns, e.toString());
                }
            }
        } catch (Exception e) {
            LOG.warn("Failed to drop namespaces/tables for catalog {}: {}", catalogName, e.toString());
        }
    }

    private String sanitizeIdent(String ident) {
        return ident.replace("`", "``");
    }

    private void ensureWritable(Path warehouse) throws IOException {
        ProcessBuilder pb =
                new ProcessBuilder("/bin/sh", "-c", "chmod -R u+rwX -- " + warehouse.toString())
                        .redirectErrorStream(true);
        Process proc = pb.start();
        try (proc) {
            proc.getInputStream().transferTo(OutputStream.nullOutputStream());
            int code = proc.waitFor();
            if (code != 0) {
                throw new IOException("chmod exited with code " + code);
            }
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new IOException("chmod interrupted", ie);
        }
    }

    private void deleteRecursively(Path root) throws IOException {
        try (Stream<Path> paths = Files.walk(root)) {
            paths.sorted(Comparator.reverseOrder())
                    .forEach(
                            p -> {
                                try {
                                    Files.deleteIfExists(p);
                                } catch (IOException e) {
                                    throw new RuntimeException(e);
                                }
                            });
        } catch (RuntimeException e) {
            if (e.getCause() instanceof IOException ioException) {
                throw ioException;
            }
            throw e;
        }
    }

    private void fallbackShellDelete(Path warehouse) throws IOException {
        ProcessBuilder pb =
                new ProcessBuilder("/bin/sh", "-c", "rm -rf -- " + warehouse.toString())
                        .redirectErrorStream(true);
        Process proc = pb.start();
        try (proc) {
            proc.getInputStream().transferTo(OutputStream.nullOutputStream());
            int code = proc.waitFor();
            if (code != 0) {
                throw new IOException("rm -rf exited with code " + code);
            }
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new IOException("rm -rf interrupted", ie);
        }
    }

    private String getDetailedErrorMessage(Exception e) {
        StringBuilder details = new StringBuilder();
        Throwable cause = e;
        while (cause != null) {
            if (details.length() > 0) {
                details.append(": ");
            }
            details.append(cause.getMessage());
            cause = cause.getCause();
        }
        return details.toString();
    }
}
