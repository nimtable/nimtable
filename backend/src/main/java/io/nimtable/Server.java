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
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import io.nimtable.db.PersistenceManager;
import io.nimtable.db.entity.Catalog;
import io.nimtable.db.repository.CatalogRepository;
import io.nimtable.schedule.ScheduleManager;
import io.nimtable.spark.LocalSpark;
import java.io.File;
import java.net.InetSocketAddress;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.apache.hadoop.conf.Configuration;
import org.apache.iceberg.CatalogUtil;
import org.apache.iceberg.rest.RESTCatalogAdapter;
import org.apache.iceberg.rest.RESTCatalogServlet;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.servlet.ServletMapping;
import org.eclipse.jetty.util.component.AbstractLifeCycle;
import org.eclipse.jetty.util.component.LifeCycle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Server {
    private static final Logger LOG = LoggerFactory.getLogger(Server.class);
    private static ServletContextHandler apiContext;

    /**
     * Keep adapters alive for the lifetime of the server.
     *
     * <p>Jetty may continue to route requests to the servlet after registration, so we must not
     * close the adapter immediately after adding the servlet mapping.
     */
    private static final Map<String, RESTCatalogAdapter> CATALOG_ADAPTERS =
            new ConcurrentHashMap<>();

    private Server() {}

    private static void removeCatalogServletMappings(String catalogName) {
        if (apiContext == null) {
            return;
        }
        final String pathSpec = "/catalog/" + catalogName + "/*";
        final String expectedServletName = "iceberg-rest-" + catalogName;
        final var handler = apiContext.getServletHandler();
        if (handler == null) {
            return;
        }

        ServletMapping[] existingMappings = handler.getServletMappings();
        if (existingMappings == null || existingMappings.length == 0) {
            return;
        }

        List<ServletMapping> keptMappings = new ArrayList<>();
        Set<String> servletNamesToRemove = new HashSet<>();

        for (ServletMapping mapping : existingMappings) {
            String[] pathSpecs = mapping.getPathSpecs();
            boolean matches = false;
            if (pathSpecs != null) {
                for (String spec : pathSpecs) {
                    if (pathSpec.equals(spec)) {
                        matches = true;
                        break;
                    }
                }
            }
            if (matches || expectedServletName.equals(mapping.getServletName())) {
                servletNamesToRemove.add(mapping.getServletName());
            } else {
                keptMappings.add(mapping);
            }
        }

        if (servletNamesToRemove.isEmpty()) {
            return;
        }

        handler.setServletMappings(keptMappings.toArray(new ServletMapping[0]));

        ServletHolder[] existingServlets = handler.getServlets();
        if (existingServlets != null && existingServlets.length > 0) {
            List<ServletHolder> keptServlets = new ArrayList<>();
            for (ServletHolder holder : existingServlets) {
                if (!servletNamesToRemove.contains(holder.getName())) {
                    keptServlets.add(holder);
                }
            }
            handler.setServlets(keptServlets.toArray(new ServletHolder[0]));
        }

        LOG.info("Removed existing servlet mappings for {} (pathSpec={})", catalogName, pathSpec);
    }

    public static synchronized void unregisterCatalog(String name) {
        if (apiContext == null) {
            return;
        }
        try {
            final boolean wasStarted = apiContext.isStarted();
            if (wasStarted) {
                apiContext.stop();
            }

            removeCatalogServletMappings(name);

            RESTCatalogAdapter adapter = CATALOG_ADAPTERS.remove(name);
            if (adapter != null) {
                try {
                    adapter.close();
                } catch (Exception e) {
                    LOG.warn("Failed to close RESTCatalogAdapter for {}", name, e);
                }
            }

            if (wasStarted) {
                apiContext.start();
            }

            LOG.info("Unregistered catalog: {}", name);
        } catch (Exception e) {
            LOG.warn("Failed to unregister catalog: {}", name, e);
        }
    }

    public static synchronized void registerCatalog(String name, Map<String, String> properties) {
        LOG.info("Dynamically registering catalog: {} with properties: {}", name, properties);
        if (apiContext == null) {
            throw new IllegalStateException("API context is not initialized yet");
        }
        // Make registration idempotent: replace any existing mapping/adapter so users can delete
        // and
        // re-create the same catalog name without restarting the server.
        if (CATALOG_ADAPTERS.containsKey(name)) {
            LOG.info("Catalog already registered, replacing: {}", name);
            unregisterCatalog(name);
        }
        try {
            org.apache.iceberg.catalog.Catalog icebergCatalog =
                    CatalogUtil.buildIcebergCatalog(name, properties, new Configuration());

            RESTCatalogAdapter adapter = new RESTCatalogAdapter(icebergCatalog);

            // Register servlet + mapping. Jetty can be picky about adding servlet mappings after
            // the
            // handler has started, so we stop/start the context to apply changes safely.
            final boolean wasStarted = apiContext.isStarted();
            if (wasStarted) {
                apiContext.stop();
            }

            // If a previous attempt (or duplicate DB rows) registered the same path, clean it up so
            // this operation is idempotent and won't fail with "Multiple servlets map to path ...".
            removeCatalogServletMappings(name);

            RESTCatalogServlet servlet = new RESTCatalogServlet(adapter);
            ServletHolder servletHolder = new ServletHolder("iceberg-rest-" + name, servlet);

            // Add the servlet holder and mapping explicitly to avoid "No such servlet" issues.
            apiContext.getServletHandler().addServlet(servletHolder);
            ServletMapping mapping = new ServletMapping();
            mapping.setServletName(servletHolder.getName());
            mapping.setPathSpec("/catalog/" + name + "/*");
            apiContext.getServletHandler().addServletMapping(mapping);

            if (wasStarted) {
                apiContext.start();
            }

            // Store adapter for later cleanup.
            CATALOG_ADAPTERS.put(name, adapter);

            // Add a listener to clean up the adapter when the servlet is destroyed
            servletHolder.addEventListener(
                    new AbstractLifeCycle.AbstractLifeCycleListener() {
                        @Override
                        public void lifeCycleStopping(LifeCycle event) {
                            try {
                                adapter.close();
                            } catch (Exception e) {
                                LOG.error(
                                        "Error closing RESTCatalogAdapter for catalog: {}",
                                        name,
                                        e);
                            }
                        }
                    });

            LOG.info("Successfully registered catalog: {}", name);
        } catch (Exception e) {
            LOG.error("Failed to register catalog: {}", name, e);
            throw new RuntimeException("Failed to register catalog: " + name, e);
        }
    }

    public static void main(String[] args) throws Exception {
        // Read and parse the config.yaml file
        ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
        Config config = mapper.readValue(new File("config.yaml"), Config.class);
        Config.Database dbConfig = config.database(); // Get DB config early

        // Initialize Persistence Manager
        PersistenceManager.initialize(dbConfig);

        // --- Instantiate Repositories ---
        CatalogRepository catalogRepository = new CatalogRepository(); // Simple instantiation

        // init spark
        LocalSpark.getInstance(config);

        // Initialize and start the schedule manager
        ScheduleManager scheduleManager = ScheduleManager.getInstance(config);
        scheduleManager.start();

        // Add Servlets to handle API endpoints
        apiContext = new ServletContextHandler(ServletContextHandler.NO_SESSIONS);
        apiContext.setContextPath("/api");
        apiContext.addServlet(
                new ServletHolder("catalogs", new CatalogsServlet(config)), "/catalogs/*");
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

        // Add route for each `/api/catalog/<catalog-name>/*` endpoints
        if (config.catalogs() != null) {
            for (Config.Catalog catalog : config.catalogs()) {
                if (CATALOG_ADAPTERS.containsKey(catalog.name())) {
                    LOG.warn("Duplicate catalog name in config.yaml, skipping: {}", catalog.name());
                    continue;
                }
                registerCatalog(catalog.name(), catalog.properties());
            }
        }

        // Add catalogs from database
        List<Catalog> dbCatalogs = catalogRepository.findAll();
        for (Catalog catalogEntity : dbCatalogs) {
            if (CATALOG_ADAPTERS.containsKey(catalogEntity.getName())) {
                LOG.warn(
                        "Duplicate catalog name in database rows, skipping: {}",
                        catalogEntity.getName());
                continue;
            }
            LOG.info("Creating catalog from database: {}", catalogEntity.getName());
            Map<String, String> properties = new HashMap<>(catalogEntity.getProperties());
            properties.put("type", catalogEntity.getType());
            properties.put("warehouse", catalogEntity.getWarehouse());
            properties.put("uri", catalogEntity.getUri());
            registerCatalog(catalogEntity.getName(), properties);
        }

        // Create handler list with API context
        HandlerList handlers = new HandlerList();
        handlers.addHandler(apiContext);
        org.eclipse.jetty.server.Server httpServer =
                new org.eclipse.jetty.server.Server(
                        new InetSocketAddress(config.server().host(), config.server().port()));
        httpServer.setHandler(handlers);

        // Add listener bean to close PersistenceManager and ScheduleManager on shutdown
        httpServer.addBean(
                new AbstractLifeCycle.AbstractLifeCycleListener() {
                    @Override
                    public void lifeCycleStopping(LifeCycle event) {
                        LOG.info(
                                "Shutting down server, closing ScheduleManager and PersistenceManager.");
                        scheduleManager.stop();
                        CATALOG_ADAPTERS.forEach(
                                (name, adapter) -> {
                                    try {
                                        adapter.close();
                                    } catch (Exception e) {
                                        LOG.warn(
                                                "Failed to close RESTCatalogAdapter for {}",
                                                name,
                                                e);
                                    }
                                });
                        PersistenceManager.close();
                    }
                });

        httpServer.start();
        LOG.info("Server started on {}:{}", config.server().host(), config.server().port());
        httpServer.join();
    }
}
