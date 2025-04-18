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
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import io.nimtable.db.PersistenceManager;
import io.nimtable.db.repository.CatalogRepository;
import io.nimtable.db.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.util.List;
import java.util.Map;
import org.apache.hadoop.conf.Configuration;
import org.apache.iceberg.CatalogUtil;
import org.apache.iceberg.rest.RESTCatalogAdapter;
import org.apache.iceberg.rest.RESTCatalogServlet;
import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.handler.AbstractHandler;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.server.handler.gzip.GzipHandler;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.util.component.AbstractLifeCycle;
import org.eclipse.jetty.util.component.LifeCycle;
import org.eclipse.jetty.util.resource.Resource;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Server {
    private static final Logger LOG = LoggerFactory.getLogger(Server.class);

    private Server() {}

    public static void main(String[] args) throws Exception {
        // Read and parse the config.yaml file
        ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
        Config config = mapper.readValue(new File("config.yaml"), Config.class);
        Config.Database dbConfig = config.database(); // Get DB config early

        // Initialize and run Flyway migrations
        try {
            if (dbConfig == null || dbConfig.url() == null || dbConfig.url().isEmpty()) {
                LOG.error("Database URL configuration is missing in config.yaml");
                System.exit(1);
            }

            String dbUrl = dbConfig.url();
            String dbType;
            if (dbUrl.startsWith("jdbc:sqlite:")) {
                dbType = "sqlite";
            } else {
                LOG.error("Unsupported database type for URL: {}", dbUrl);
                System.exit(1);
                return; // Should not be reached due to System.exit(1)
            }

            String migrationLocation = "classpath:db/migration/" + dbType;
            LOG.info(
                    "Using database type '{}' and migration location '{}'",
                    dbType,
                    migrationLocation);

            Flyway flyway =
                    Flyway.configure()
                            .dataSource(dbUrl, dbConfig.username(), dbConfig.password())
                            .locations(migrationLocation)
                            .load();
            flyway.migrate();
            LOG.info("Database migration completed successfully.");

        } catch (FlywayException e) {
            LOG.error("Database migration failed: {}", e.getMessage(), e);
            System.exit(1); // Exit if migration fails
        }

        // Initialize Persistence Manager
        PersistenceManager.initialize(dbConfig);

        // --- Instantiate Repositories ---
        UserRepository userRepository = new UserRepository(); // Instantiate UserRepository
        CatalogRepository catalogRepository = new CatalogRepository(); // Simple instantiation

        // Add Servlets to handle API endpoints
        ServletContextHandler apiContext =
                new ServletContextHandler(ServletContextHandler.NO_SESSIONS);
        apiContext.setContextPath("/api");
        apiContext.addServlet(
                new ServletHolder("catalogs", new CatalogsServlet(config)), "/catalogs");
        apiContext.addServlet(
                new ServletHolder("catalog-config", new CatalogConfigServlet(config)), "/config/*");
        apiContext.addServlet(
                new ServletHolder("spark-query", new SparkQueryServlet(config)), "/query");
        apiContext.addServlet(
                new ServletHolder("manifest", new ManifestServlet(config)), "/manifest/*");
        apiContext.addServlet(
                new ServletHolder("optimize", new OptimizeServlet(config)), "/optimize/*");
        apiContext.addServlet(
                new ServletHolder("distribution", new DistributionServlet(config)),
                "/distribution/*");
        apiContext.addServlet(new ServletHolder("login", new LoginServlet(config)), "/login");
        apiContext.addServlet(new ServletHolder(new LogoutServlet()), "/logout");
        apiContext.addServlet(
                new ServletHolder("users", new UserServlet(userRepository)), "/users/*");

        // Load catalogs from the database and add routes
        List<io.nimtable.db.entity.Catalog> dbCatalogs = catalogRepository.findAll();
        LOG.info("Found {} catalogs in the database.", dbCatalogs.size());

        for (io.nimtable.db.entity.Catalog dbCatalog : dbCatalogs) {
            LOG.info(
                    "Creating catalog endpoint for: {} with properties: {}",
                    dbCatalog.getName(),
                    dbCatalog.getProperties());

            // Prepare properties map for Iceberg CatalogUtil
            Map<String, String> catalogProperties = dbCatalog.getProperties();
            if (catalogProperties == null) {
                catalogProperties = new java.util.HashMap<>(); // Ensure not null
            }
            // Add essential properties if not already present in JSONB
            catalogProperties.putIfAbsent(Config.Catalog.TYPE, dbCatalog.getType());
            if (dbCatalog.getUri() != null) {
                catalogProperties.putIfAbsent(
                        CatalogUtil.ICEBERG_CATALOG_TYPE_REST + ".uri",
                        dbCatalog.getUri()); // Adjust
                // property
                // key
                // based
                // on
                // type
                // if
                // needed
                catalogProperties.putIfAbsent(
                        CatalogUtil.ICEBERG_CATALOG_TYPE_JDBC + ".uri", dbCatalog.getUri());
            }
            if (dbCatalog.getWarehouse() != null) {
                catalogProperties.putIfAbsent(
                        Config.Catalog.WAREHOUSE_LOCATION, dbCatalog.getWarehouse());
            }

            // Build Iceberg Catalog
            try {
                org.apache.iceberg.catalog.Catalog icebergCatalog =
                        CatalogUtil.buildIcebergCatalog(
                                dbCatalog.getName(), catalogProperties, new Configuration());

                // Create and add the REST servlet for this catalog
                try (RESTCatalogAdapter adapter = new RESTCatalogAdapter(icebergCatalog)) {
                    RESTCatalogServlet servlet = new RESTCatalogServlet(adapter);
                    ServletHolder servletHolder =
                            new ServletHolder(dbCatalog.getName() + "-rest", servlet);
                    apiContext.addServlet(servletHolder, "/catalog/" + dbCatalog.getName() + "/*");
                    LOG.info("Added REST endpoint for catalog: {}", dbCatalog.getName());
                }
            } catch (Exception e) {
                LOG.error(
                        "Failed to initialize Iceberg catalog or REST endpoint for: {}",
                        dbCatalog.getName(),
                        e);
                // Decide how to handle catalog initialization failure (e.g., skip, log, exit)
            }
        }

        // Create a handler for serving static files and SPA routing
        Resource baseResource =
                Resource.newResource(
                        Server.class.getClassLoader().getResource("static").toExternalForm());
        AbstractHandler staticHandler =
                new AbstractHandler() {
                    @Override
                    public void handle(
                            String target,
                            Request baseRequest,
                            HttpServletRequest request,
                            HttpServletResponse response)
                            throws IOException, ServletException {
                        if (request.getRequestURI().startsWith("/api/")) {
                            return; // Let API handler handle this
                        }

                        // For root path or empty target, serve index.html directly
                        if (target == null || target.isEmpty() || "/".equals(target)) {
                            serveIndexHtml(baseRequest, response);
                            return;
                        }

                        // Try to serve the requested file directly
                        Resource resource =
                                baseResource.addPath(
                                        target.startsWith("/") ? target.substring(1) : target);
                        if (resource.exists() && !resource.isDirectory()) {
                            response.setContentType(getContentType(target));
                            try (InputStream in = resource.getInputStream()) {
                                in.transferTo(response.getOutputStream());
                            }
                            baseRequest.setHandled(true);
                            return;
                        }

                        // If not found, try mapping the route to a static HTML file.
                        // Remove query parameters if any.
                        String route = target;
                        int queryIndex = route.indexOf('?');
                        if (queryIndex != -1) {
                            route = route.substring(0, queryIndex);
                        }
                        // Remove leading slash
                        if (route.startsWith("/")) {
                            route = route.substring(1);
                        }

                        // Map known routes to corresponding HTML files.
                        String fileName = route + ".html";

                        // Try serving the mapped file.
                        Resource mappedResource = baseResource.addPath(fileName);
                        if (mappedResource.exists() && !mappedResource.isDirectory()) {
                            response.setContentType(getContentType(fileName));
                            try (InputStream in = mappedResource.getInputStream()) {
                                in.transferTo(response.getOutputStream());
                            }
                            baseRequest.setHandled(true);
                            return;
                        }

                        // Fallback: serve index.html for SPA routing.
                        serveIndexHtml(baseRequest, response);
                    }

                    private void serveIndexHtml(Request baseRequest, HttpServletResponse response)
                            throws IOException {
                        Resource indexHtml = baseResource.addPath("index.html");
                        response.setContentType("text/html");
                        try (InputStream in = indexHtml.getInputStream()) {
                            in.transferTo(response.getOutputStream());
                        }
                        baseRequest.setHandled(true);
                    }

                    private String getContentType(String path) {
                        if (path.endsWith(".js")) return "application/javascript";
                        if (path.endsWith(".css")) return "text/css";
                        if (path.endsWith(".html")) return "text/html";
                        if (path.endsWith(".json")) return "application/json";
                        if (path.endsWith(".png")) return "image/png";
                        if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
                        if (path.endsWith(".gif")) return "image/gif";
                        if (path.endsWith(".svg")) return "image/svg+xml";
                        return "application/octet-stream";
                    }
                };

        // Add gzip compression
        GzipHandler gzipHandler = new GzipHandler();
        gzipHandler.setHandler(staticHandler);

        HandlerList handlers = new HandlerList();
        handlers.addHandler(gzipHandler);
        handlers.addHandler(apiContext);
        org.eclipse.jetty.server.Server httpServer =
                new org.eclipse.jetty.server.Server(
                        new InetSocketAddress(config.server().host(), config.server().port()));
        httpServer.setHandler(handlers);

        // Add listener bean to close PersistenceManager on shutdown
        httpServer.addBean(
                new AbstractLifeCycle.AbstractLifeCycleListener() {
                    @Override
                    public void lifeCycleStopping(LifeCycle event) {
                        LOG.info("Shutting down server, closing PersistenceManager.");
                        PersistenceManager.close();
                    }
                });

        httpServer.start();
        LOG.info("Server started on {}:{}", config.server().host(), config.server().port());
        httpServer.join();
    }
}
