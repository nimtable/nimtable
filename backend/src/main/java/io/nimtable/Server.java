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
    private final Config config;
    private final org.eclipse.jetty.server.Server server;

    public Server(Config config) throws IOException {
        this.config = config;
        this.server =
                new org.eclipse.jetty.server.Server(
                        new InetSocketAddress(config.server().host(), config.server().port()));

        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
        context.setContextPath("/");
        server.setHandler(context);

        // Register servlets
        registerServlets(context);
        registerCatalogs(context);
        setupStaticFileHandler(context);
    }

    private void registerServlets(ServletContextHandler context) {
        // Register API servlets
        context.addServlet(new ServletHolder(new OptimizeServlet(config)), "/api/optimize/*");
        ServletHolder distributionHolder = new ServletHolder(new DistributionServlet(config));
        distributionHolder.setInitOrder(1); // Ensure DistributionServlet is initialized first
        context.addServlet(distributionHolder, "/api/distribution/*");

        context.addServlet(
                new ServletHolder("catalogs", new CatalogsServlet(config)), "/api/catalogs");
        context.addServlet(
                new ServletHolder("catalog-config", new CatalogConfigServlet(config)),
                "/api/config/*");
        context.addServlet(
                new ServletHolder("spark-query", new SparkQueryServlet(config)), "/api/query");
        context.addServlet(
                new ServletHolder("manifest", new ManifestServlet(config)), "/api/manifest/*");
        context.addServlet(new ServletHolder(new LoginServlet(config)), "/api/login");
        context.addServlet(new ServletHolder(new LogoutServlet()), "/api/logout");
    }

    private void registerCatalogs(ServletContextHandler context) throws IOException {
        for (Config.Catalog catalog : config.catalogs()) {
            LOG.info("Creating catalog with properties: {}", catalog.properties());
            Catalog icebergCatalog =
                    CatalogUtil.buildIcebergCatalog(
                            catalog.name(), catalog.properties(), new Configuration());

            RESTCatalogAdapter adapter = new RESTCatalogAdapter(icebergCatalog);
            try {
                RESTCatalogServlet servlet = new RESTCatalogServlet(adapter);
                ServletHolder servletHolder = new ServletHolder(servlet);
                context.addServlet(servletHolder, "/api/catalog/" + catalog.name() + "/*");
            } finally {
                adapter.close();
            }
        }
    }

    private void setupStaticFileHandler(ServletContextHandler context) throws IOException {
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
                            return;
                        }

                        if (target == null || target.isEmpty() || "/".equals(target)) {
                            serveIndexHtml(baseRequest, response);
                            return;
                        }

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

                        String route = target;
                        int queryIndex = route.indexOf('?');
                        if (queryIndex != -1) {
                            route = route.substring(0, queryIndex);
                        }
                        if (route.startsWith("/")) {
                            route = route.substring(1);
                        }

                        String fileName = route + ".html";
                        Resource mappedResource = baseResource.addPath(fileName);
                        if (mappedResource.exists() && !mappedResource.isDirectory()) {
                            response.setContentType(getContentType(fileName));
                            try (InputStream in = mappedResource.getInputStream()) {
                                in.transferTo(response.getOutputStream());
                            }
                            baseRequest.setHandled(true);
                            return;
                        }

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

        GzipHandler gzipHandler = new GzipHandler();
        gzipHandler.setHandler(staticHandler);

        HandlerList handlers = new HandlerList();
        handlers.addHandler(gzipHandler);
        handlers.addHandler(context);
        server.setHandler(handlers);
    }

    public void start() throws Exception {
        server.start();
        server.join();
    }

    public static void main(String[] args) throws Exception {
        ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
        Config config = mapper.readValue(new File("config.yaml"), Config.class);
        Server server = new Server(config);
        server.start();
    }
}
