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
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetSocketAddress;
import org.apache.hadoop.conf.Configuration;
import org.apache.iceberg.CatalogUtil;
import org.apache.iceberg.catalog.Catalog;
import org.apache.iceberg.rest.RESTCatalogAdapter;
import org.apache.iceberg.rest.RESTCatalogServlet;
import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.handler.AbstractHandler;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.server.handler.gzip.GzipHandler;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.util.resource.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Server {
    private static final Logger LOG = LoggerFactory.getLogger(Server.class);

    private Server() {}

    public static void main(String[] args) throws Exception {
        // Read and parse the config.yaml file
        ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
        Config config = mapper.readValue(new File("config.yaml"), Config.class);

        // Add CatalogsServlet to handle `/api/catalogs` endpoint
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

        // Add route for each `/api/catalog/<catalog-name>/*` endpoints
        for (Config.Catalog catalog : config.catalogs()) {
            LOG.info("Creating catalog with properties: {}", catalog.properties());
            Catalog icebergCatalog =
                    CatalogUtil.buildIcebergCatalog(
                            catalog.name(), catalog.properties(), new Configuration());

            try (RESTCatalogAdapter adapter = new RESTCatalogAdapter(icebergCatalog)) {
                RESTCatalogServlet servlet = new RESTCatalogServlet(adapter);
                ServletHolder servletHolder = new ServletHolder(servlet);
                apiContext.addServlet(servletHolder, "/catalog/" + catalog.name() + "/*");
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

                        // Try to serve the requested file
                        Resource resource =
                                baseResource.addPath(
                                        target.startsWith("/") ? target.substring(1) : target);
                        if (resource.exists()) {
                            response.setContentType(getContentType(target));
                            try (InputStream in = resource.getInputStream()) {
                                in.transferTo(response.getOutputStream());
                            }
                            baseRequest.setHandled(true);
                            return;
                        }

                        // If file doesn't exist, serve index.html for SPA routing
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
        httpServer.start();
        httpServer.join();
    }
}
