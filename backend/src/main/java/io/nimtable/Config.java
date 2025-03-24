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

public record Config(
    Server server,
    List<Catalog> catalogs
) {
    public record Server(
        int port,
        String host
    ) {}

    @JsonDeserialize(using = CatalogDeserializer.class)
    public record Catalog(
        String name,
        Map<String, String> properties
    ) {
        // Options: "hadoop", "hive", "rest", "glue", "nessie", "jdbc"
        public static final String TYPE = CatalogUtil.ICEBERG_CATALOG_TYPE;

        public static final String CATALOG_IMPL = CatalogProperties.CATALOG_IMPL;
        public static final String FILE_IO_IMPL = CatalogProperties.FILE_IO_IMPL;
        public static final String WAREHOUSE_LOCATION = CatalogProperties.WAREHOUSE_LOCATION;
    }

    public static class CatalogDeserializer extends JsonDeserializer<Catalog> {
        @Override
        public Catalog deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            JsonNode node = p.getCodec().readTree(p);
            String name = null;
            
            // Extract the name field
            if (node.has("name")) {
                name = node.get("name").asText();
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
            
            return new Catalog(name, properties);
        }
    }
}
