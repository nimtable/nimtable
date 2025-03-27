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
        this.mapper.findAndRegisterModules();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        String query = request.getParameter("query");
        String catalogName = request.getParameter("catalog");
        if (query == null || query.trim().isEmpty()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Query parameter is required");
            return;
        }

        Config.Catalog catalog = config.getCatalog(catalogName);

        if (!"org.apache.iceberg.aws.s3.S3FileIO".equals(catalog.properties().get(Config.Catalog.FILE_IO_IMPL))) {
            response.setContentType("application/json");
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "only support S3FileIO for now");
            mapper.writeValue(response.getWriter(), errorResponse);
            return;
        }

        try {
            String catalogType = catalog.properties().get("type");
            if (!catalogType.equalsIgnoreCase("rest") && !catalogType.equalsIgnoreCase("jdbc")) {
                response.setContentType("application/json");
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "only support rest and jdbc catalog for now");
                mapper.writeValue(response.getWriter(), errorResponse);
                return;
            }
            var sparkBuilder = SparkSession.builder()
                    .appName("IcebergSparkQuery")
                    .master("local[*]")
                    .config("spark.sql.extensions", "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions")
                    .config(String.format("spark.sql.catalog.%s", catalogName), "org.apache.iceberg.spark.SparkCatalog");

            for (Map.Entry<String, String> entry : catalog.properties().entrySet()) {
                sparkBuilder.config(String.format("spark.sql.catalog.%s.%s", catalogName, entry.getKey()), entry.getValue());
            }
            SparkSession spark = sparkBuilder.getOrCreate();


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
