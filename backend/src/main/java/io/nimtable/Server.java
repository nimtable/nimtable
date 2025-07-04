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
import io.nimtable.db.entity.Catalog;
import io.nimtable.db.repository.CatalogRepository;
import io.nimtable.schedule.ScheduleManager;
import io.nimtable.spark.LocalSpark;
import java.io.File;
import java.net.InetSocketAddress;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.hadoop.conf.Configuration;
import org.apache.iceberg.CatalogUtil;
import org.apache.iceberg.rest.RESTCatalogAdapter;
import org.apache.iceberg.rest.RESTCatalogServlet;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.util.component.AbstractLifeCycle;
import org.eclipse.jetty.util.component.LifeCycle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Server {
    private static final Logger LOG = LoggerFactory.getLogger(Server.class);
    private static ServletContextHandler apiContext;

    private Server() {}

    public static void registerCatalog(String name, Map<String, String> properties) {
        LOG.info("Dynamically registering catalog: {} with properties: {}", name, properties);
        try {
            org.apache.iceberg.catalog.Catalog icebergCatalog =
                    CatalogUtil.buildIcebergCatalog(name, properties, new Configuration());

            RESTCatalogAdapter adapter = new RESTCatalogAdapter(icebergCatalog);
            RESTCatalogServlet servlet = new RESTCatalogServlet(adapter);
            ServletHolder servletHolder = new ServletHolder(servlet);
            apiContext.addServlet(servletHolder, "/catalog/" + name + "/*");

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
                LOG.info("Creating catalog with properties: {}", catalog.properties());
                org.apache.iceberg.catalog.Catalog icebergCatalog =
                        CatalogUtil.buildIcebergCatalog(
                                catalog.name(), catalog.properties(), new Configuration());

                try (RESTCatalogAdapter adapter = new RESTCatalogAdapter(icebergCatalog)) {
                    RESTCatalogServlet servlet = new RESTCatalogServlet(adapter);
                    ServletHolder servletHolder = new ServletHolder(servlet);
                    apiContext.addServlet(servletHolder, "/catalog/" + catalog.name() + "/*");
                }
            }
        }

        // Add catalogs from database
        List<Catalog> dbCatalogs = catalogRepository.findAll();
        for (Catalog catalogEntity : dbCatalogs) {
            LOG.info("Creating catalog from database: {}", catalogEntity.getName());
            Map<String, String> properties = new HashMap<>(catalogEntity.getProperties());
            properties.put("type", catalogEntity.getType());
            properties.put("warehouse", catalogEntity.getWarehouse());
            properties.put("uri", catalogEntity.getUri());

            org.apache.iceberg.catalog.Catalog icebergCatalog =
                    CatalogUtil.buildIcebergCatalog(
                            catalogEntity.getName(), properties, new Configuration());

            try (RESTCatalogAdapter adapter = new RESTCatalogAdapter(icebergCatalog)) {
                RESTCatalogServlet servlet = new RESTCatalogServlet(adapter);
                ServletHolder servletHolder = new ServletHolder(servlet);
                apiContext.addServlet(servletHolder, "/catalog/" + catalogEntity.getName() + "/*");
            }
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
                        LOG.info("Shutting down server, closing ScheduleManager and PersistenceManager.");
                        scheduleManager.stop();
                        PersistenceManager.close();
                    }
                });

        httpServer.start();
        LOG.info("Server started on {}:{}", config.server().host(), config.server().port());
        httpServer.join();
    }
}
