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
import io.nimtable.db.entity.Catalog;
import io.nimtable.db.repository.CatalogRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class CatalogConfigServlet extends HttpServlet {
    private final Config config;
    private final ObjectMapper mapper;
    private final CatalogRepository catalogRepository;

    public CatalogConfigServlet(Config config) {
        this.config = config;
        this.mapper = new ObjectMapper();
        this.catalogRepository = new CatalogRepository();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Catalog name is required");
            return;
        }

        String catalogName = pathInfo.substring(1); // Remove leading slash

        // First try to get from config
        Config.Catalog configCatalog = config.getCatalog(catalogName);

        // Then try to get from database
        Catalog dbCatalog = catalogRepository.findByName(catalogName);

        if (configCatalog == null && dbCatalog == null) {
            response.sendError(
                    HttpServletResponse.SC_NOT_FOUND, "Catalog not found: " + catalogName);
            return;
        }

        // Build unified catalog configuration response
        Map<String, Object> catalogResponse = new HashMap<>();
        Map<String, String> defaults = new HashMap<>();
        Map<String, String> overrides = new HashMap<>();

        // Add properties from config catalog if available
        if (configCatalog != null) {
            defaults.putAll(configCatalog.properties());
        }

        // Add properties from database catalog if available, these become defaults
        if (dbCatalog != null) {
            defaults.put("type", dbCatalog.getType());
            if (dbCatalog.getUri() != null) {
                defaults.put("uri", dbCatalog.getUri());
            }
            if (dbCatalog.getWarehouse() != null) {
                defaults.put("warehouse", dbCatalog.getWarehouse());
            }
            if (dbCatalog.getProperties() != null) {
                defaults.putAll(dbCatalog.getProperties());
            }
        }

        catalogResponse.put("defaults", defaults);
        catalogResponse.put("overrides", overrides);

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        mapper.writeValue(response.getOutputStream(), catalogResponse);
    }
}
