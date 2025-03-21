/*
 * Copyright 2024 Tabular Technologies Inc.
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

import java.io.File;
import java.net.InetSocketAddress;

import org.apache.hadoop.conf.Configuration;
import org.apache.iceberg.CatalogUtil;
import org.apache.iceberg.catalog.Catalog;
import org.apache.iceberg.rest.RESTCatalogServlet;
import org.apache.iceberg.rest.RESTCatalogAdapter;
import org.eclipse.jetty.server.handler.gzip.GzipHandler;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;

public class Server {
  private static final Logger LOG = LoggerFactory.getLogger(Server.class);

  private Server() {
  }

  public static void main(String[] args) throws Exception {
    // Read and parse the config.yaml file
    ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
    Config config = mapper.readValue(new File("config.yaml"), Config.class);

    // Add CatalogsServlet to handle `/api/catalogs` endpoint
    ServletContextHandler context = new ServletContextHandler(ServletContextHandler.NO_SESSIONS);
    context.setContextPath("/api");
    context.addServlet(new ServletHolder("catalogs", new CatalogsServlet(config)), "/catalogs");
    context.addServlet(new ServletHolder("catalog-config", new CatalogConfigServlet(config)), "/config/*");
    context.addServlet(new ServletHolder("duckdb-query", new DuckDBQueryServlet(config)), "/query");

    // Add route for each `/api/catalog/<catalog-name>/*` endpoints
    for (Config.Catalog catalog : config.getCatalogs()) {
      LOG.info("Creating catalog with properties: {}", catalog.getProperties());
      Catalog icebergCatalog = CatalogUtil.buildIcebergCatalog(catalog.getName(), catalog.getProperties(), new Configuration());

      try (RESTCatalogAdapter adapter = new RESTCatalogAdapter(icebergCatalog)) {
        RESTCatalogServlet servlet = new RESTCatalogServlet(adapter);
        ServletHolder servletHolder = new ServletHolder(servlet);
        context.addServlet(servletHolder, "/catalog/" + catalog.getName() + "/*");
      }
    }

    context.insertHandler(new GzipHandler());
    org.eclipse.jetty.server.Server httpServer = new org.eclipse.jetty.server.Server(
            new InetSocketAddress(config.getServer().getHost(), config.getServer().getPort()));
    httpServer.insertHandler(context);
    httpServer.start();
    httpServer.join();
  }
}
