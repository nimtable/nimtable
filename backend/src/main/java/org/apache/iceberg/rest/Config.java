package org.apache.iceberg.rest;

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

public class Config {
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

    public static class Server {
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
    public static class Catalog {
        private String name;

        private Map<String, String> properties;

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
