package io.nimtable;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.spark.sql.SparkSession;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SparkQueryServlet extends HttpServlet {
    private final Config config;
    private final ObjectMapper mapper;
    private final Logger logger = LoggerFactory.getLogger(SparkQueryServlet.class);
    private SparkSession spark;

    public SparkQueryServlet(Config config) {
        this.config = config;
        this.mapper = new ObjectMapper();
        initializeSpark();
    }

    private void initializeSpark() {
        SparkSession.Builder builder = SparkSession.builder()
            .appName("Nimtable")
            .master("local[*]")
            .config("spark.sql.extensions", "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions");

        // Pass all catalog properties to Spark
        for (Config.Catalog catalog : config.catalogs()) {
            String catalogName = catalog.name();
            builder.config(String.format("spark.sql.catalog.%s", catalogName), "org.apache.iceberg.spark.SparkCatalog");
            for (Map.Entry<String, String> property : catalog.properties().entrySet()) {
                builder.config(String.format("spark.sql.catalog.%s.%s", catalogName, property.getKey()), property.getValue());
            }
        }

        spark = builder.getOrCreate();
        spark.sparkContext().setLogLevel("ERROR");
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        String query = request.getParameter("query");
        if (query == null || query.trim().isEmpty()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Query parameter is required");
            return;
        }

        try {
            // Execute the query using Spark SQL
            Dataset<Row> result = spark.sql(query);
            
            // Get column names
            String[] columns = result.columns();
            
            // Convert results to a list of rows
            List<List<Object>> rows = new ArrayList<>();
            result.collectAsList().forEach(row -> {
                List<Object> rowData = new ArrayList<>();
                for (String column : columns) {
                    rowData.add(row.getAs(column));
                }
                rows.add(rowData);
            });

            // Prepare response
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("columns", List.of(columns));
            responseData.put("rows", rows);

            // Send response
            response.setContentType("application/json");
            mapper.writeValue(response.getWriter(), responseData);
        } catch (Exception e) {
            logger.error("Error executing query", e);
            response.setContentType("application/json");
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            mapper.writeValue(response.getWriter(), errorResponse);
        }
    }

    @Override
    public void destroy() {
        if (spark != null) {
            spark.stop();
        }
    }
} 