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

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.nimtable.db.entity.Catalog;
import io.nimtable.db.repository.CatalogRepository;
import io.nimtable.spark.LocalSpark;
import io.nimtable.util.SensitiveDataFilter;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.Closeable;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.apache.hadoop.conf.Configuration;
import org.apache.iceberg.CatalogUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CatalogsServlet extends HttpServlet {
    private static final Logger LOG = LoggerFactory.getLogger(CatalogsServlet.class);
    private final Config config;
    private final ObjectMapper mapper;
    private final CatalogRepository catalogRepository;

    public CatalogsServlet(Config config) {
        this.config = config;
        this.mapper = new ObjectMapper();
        this.mapper.findAndRegisterModules();
        this.catalogRepository = new CatalogRepository();
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

            // Check if catalog exists in database
            Catalog catalog = catalogRepository.findByName(catalogName);
            if (catalog == null) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Not found");
                errorResponse.put("message", "Catalog not found: " + catalogName);
                resp.setContentType("application/json");
                mapper.writeValue(resp.getWriter(), errorResponse);
                return;
            }

            // Delete from database
            catalogRepository.delete(catalog);

            // Update LocalSpark instance with new catalog configuration
            LocalSpark.updateInstance(config);

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
