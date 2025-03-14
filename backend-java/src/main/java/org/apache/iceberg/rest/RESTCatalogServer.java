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

package org.apache.iceberg.rest;

import java.io.File;
import java.net.InetSocketAddress;
import java.util.HashMap;
import java.util.Map;
import org.apache.hadoop.conf.Configuration;
import org.apache.iceberg.CatalogUtil;
import org.apache.iceberg.catalog.Catalog;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.gzip.GzipHandler;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;

public class RESTCatalogServer {
  private static final Logger LOG = LoggerFactory.getLogger(RESTCatalogServer.class);

  private RESTCatalogServer() {}

  record CatalogContext(Catalog catalog, Map<String,String> configuration) { }

  @SuppressWarnings("unchecked")
  public static void main(String[] args) throws Exception {
    // Read and parse the config.yaml file
    Map<String, String> catalogProperties = new HashMap<>();
    ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
    Map<String, Object> config = mapper.readValue(new File("config.yaml"), Map.class);
    
    // Extract catalog properties from config
    Map<String, String> catalogConfig = (Map<String, String>) config.get("catalog");
    if (catalogConfig != null) {
      catalogProperties.putAll(catalogConfig);
    }

    LOG.info("Creating catalog with properties: {}", catalogProperties);
    CatalogContext catalogContext = new CatalogContext(
        CatalogUtil.buildIcebergCatalog("rest_backend", catalogProperties, new Configuration()),
        catalogProperties);

    Map<String, Object> serverConfig = (Map<String, Object>) config.get("server");

    try (RESTCatalogAdapter adapter = new RESTServerCatalogAdapter(catalogContext)) {
      IcebergRestCatalogServlet servlet = new IcebergRestCatalogServlet(adapter);

      ServletContextHandler context = new ServletContextHandler(ServletContextHandler.NO_SESSIONS);
      context.setContextPath("/api/catalog/sqlite-catalog-demo");

      ServletHolder servletHolder = new ServletHolder(servlet);
      servletHolder.setInitParameter("javax.ws.rs.Application", "ServiceListPublic");
      context.addServlet(servletHolder, "/*");
      context.setVirtualHosts(null);
      context.insertHandler(new GzipHandler());

      Server httpServer =
          new Server(
            new InetSocketAddress((String) serverConfig.getOrDefault("host", "0.0.0.0"),
            (Integer) serverConfig.getOrDefault("port", 8181))
          );
      httpServer.setHandler(context);

      httpServer.start();
      httpServer.join();
    }
  }
}
