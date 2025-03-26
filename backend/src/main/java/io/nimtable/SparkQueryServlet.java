package io.nimtable;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SparkQueryServlet extends HttpServlet {
    private final Config config;
    private final ObjectMapper mapper;

    private final Logger logger = LoggerFactory.getLogger(SparkQueryServlet.class);

    public SparkQueryServlet(Config config) {
        this.config = config;
        this.mapper = new ObjectMapper();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        String query = request.getParameter("query");
        if (query == null || query.trim().isEmpty()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Query parameter is required");
            return;
        }

        for (Config.Catalog catalog : config.catalogs()) {
            if (!"org.apache.iceberg.aws.s3.S3FileIO".equals(catalog.properties().get(Config.Catalog.FILE_IO_IMPL))) {
                logger.warn("Only S3 warehouse is supported. Skipped catalog: {}", catalog.name());
                continue;
            }

            try {
                String catalogName = catalog.name();
                String catalogType = catalog.properties().get("type");
                String warehouse = catalog.properties().get("warehouse");
                String s3Region = catalog.properties().getOrDefault("s3.region", "us-east-1");
                String s3Endpoint = catalog.properties().getOrDefault("s3.endpoint", "https://s3.amazonaws.com");
                String s3KeyId = catalog.properties().getOrDefault("s3.access-key-id", "");
                String s3Secret = catalog.properties().getOrDefault("s3.secret-access-key", "");
                String s3PathStyleAccess = catalog.properties().getOrDefault("s3.path-style-access", "true");
                String uri = catalog.properties().get("uri");

                SparkSession spark = SparkSession.builder()
                        .appName("IcebergSparkQuery")
                        .master("local[*]")
                        .config("spark.sql.extensions", "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions")
                        .config(String.format("spark.sql.catalog.%s", catalogName), "org.apache.iceberg.spark.SparkCatalog")
                        .config(String.format("spark.sql.catalog.%s.type", catalogName), catalogType)
                        .config(String.format("spark.sql.catalog.%s.warehouse", catalogName), warehouse)
                        .config(String.format("spark.sql.catalog.%s.s3.region", catalogName), s3Region)
                        .config(String.format("spark.sql.catalog.%s.s3.endpoint", catalogName), s3Endpoint)
                        .config(String.format("spark.sql.catalog.%s.s3.access-key-id", catalogName), s3KeyId)
                        .config(String.format("spark.sql.catalog.%s.s3.secret-access-key", catalogName), s3Secret)
                        .config(String.format("spark.sql.catalog.%s.s3.path-style-access", catalogName), s3PathStyleAccess)
                        .config(String.format("spark.sql.catalog.%s.uri", catalogName), uri)
                        .getOrCreate();

                Dataset<Row> ds = spark.sql(query);
                List<String> columns = new ArrayList<>();
                var columnNames = ds.columns();
                var columnCount = columnNames.length;
                for (int i = 0; i < columnCount; i++) {
                    columns.add(columnNames[i]);
                }

                // Get results as arrays
                List<List<Object>> results = new ArrayList<>();
                for (Row rs : ds.collectAsList()) {
                    List<Object> row = new ArrayList<>();
                    for (int i = 0; i < columnCount; i++) {
                        row.add(rs.get(i));
                    }
                    results.add(row);
                }

                // Prepare response
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("columns", columns);
                responseData.put("rows", results);

                // Send response
                response.setContentType("application/json");
                mapper.writeValue(response.getWriter(), responseData);
            } catch (Throwable e) {
                logger.error("Error executing query", e);
                response.setContentType("application/json");
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", e.getMessage());
                mapper.writeValue(response.getWriter(), errorResponse);
            }
        }
    }
}
