package io.nimtable;

import java.io.IOException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import org.apache.iceberg.CatalogProperties;
import org.apache.iceberg.CatalogUtil;

public final class Config {
    private Server server;
    private List<Catalog> catalogs;

    public Server getServer() {
        return server;
    }

    public void setServer(Server server) {
        this.server = server;
    }

    public List<Catalog> getCatalogs() {
        return catalogs;
    }

    public void setCatalogs(List<Catalog> catalogs) {
        this.catalogs = catalogs;
    }

    public final static class Server {
        private int port;
        private String host;

        public int getPort() {
            return port;
        }

        public void setPort(int port) {
            this.port = port;
        }

        public String getHost() {
            return host;
        }

        public void setHost(String host) {
            this.host = host;
        }
    }

    @JsonDeserialize(using = CatalogDeserializer.class)
    public final static class Catalog {
        private String name;

        private Map<String, String> properties;

        // Options: "hadoop", "hive", "rest", "glue", "nessie", "jdbc"
        public static final String TYPE = CatalogUtil.ICEBERG_CATALOG_TYPE;

        public static final String CATALOG_IMPL = CatalogProperties.CATALOG_IMPL;
        public static final String FILE_IO_IMPL = CatalogProperties.FILE_IO_IMPL;
        public static final String WAREHOUSE_LOCATION = CatalogProperties.WAREHOUSE_LOCATION;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Map<String, String> getProperties() {
            return properties;
        }

        public void setProperties(Map<String, String> properties) {
            this.properties = properties;
        }
    }

    public static class CatalogDeserializer extends JsonDeserializer<Config.Catalog> {
        @Override
        public Config.Catalog deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            JsonNode node = p.getCodec().readTree(p);
            Config.Catalog catalog = new Config.Catalog();
            
            // Extract the name field
            if (node.has("name")) {
                catalog.setName(node.get("name").asText());
            }
            
            // Put all other fields into properties
            Map<String, String> properties = new HashMap<>();
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                if (!"name".equals(field.getKey())) {
                    properties.put(field.getKey(), field.getValue().asText());
                }
            }
            catalog.setProperties(properties);
            
            return catalog;
        }
    } 
}
