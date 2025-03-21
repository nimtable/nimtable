package io.nimtable;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DuckDBQueryServlet extends HttpServlet {
    private final Config config;
    private final ObjectMapper mapper;

    private final Logger logger = LoggerFactory.getLogger(DuckDBQueryServlet.class);

    public DuckDBQueryServlet(Config config) {
        this.config = config;
        this.mapper = new ObjectMapper();
    }

    private void initializeDuckDB(Connection conn, Config config) throws Exception {
        try (Statement stmt = conn.createStatement()) {
            // Install and load required extensions
            stmt.execute("INSTALL iceberg");
            stmt.execute("LOAD iceberg");
            stmt.execute("INSTALL httpfs");
            stmt.execute("LOAD httpfs");

            for (Config.Catalog catalog : config.getCatalogs()) {
                if (!"org.apache.iceberg.aws.s3.S3FileIO".equals(catalog.getProperties().get(Config.Catalog.FILE_IO_IMPL))) {
                    logger.warn("Only S3 warehouse is supported. Skipped catalog: {}", catalog.getName());
                    continue;
                }

                // Create S3 secret.
                // To convert properties from Iceberg Java properties to DuckDB, refer to
                // - `org.apache.iceberg.aws.s3.S3FileIOProperties`
                // - https://github.com/duckdb/duckdb-iceberg/blob/main/test/sql/local/iceberg_on_tpch.test
                String s3SecretName = "s3-secret-" + catalog.getName();
                String s3Region = catalog.getProperties().getOrDefault("s3.region", "us-east-1");
                String s3EndpointUrl = catalog.getProperties().getOrDefault("s3.endpoint", "https://s3.amazonaws.com");
                boolean s3UseSSL = s3EndpointUrl.toLowerCase().startsWith("https://");
                String s3Endpoint = s3EndpointUrl.replaceFirst("^https?://", "");
                String s3KeyId = catalog.getProperties().getOrDefault("s3.access-key-id", "");
                String s3Secret = catalog.getProperties().getOrDefault("s3.secret-access-key", "");

                String query = String.format(
                        "CREATE SECRET \"%s\" (TYPE s3, REGION '%s', ENDPOINT '%s', URL_STYLE 'path', USE_SSL %b, KEY_ID '%s', SECRET '%s')",
                        s3SecretName, s3Region, s3Endpoint, s3UseSSL, s3KeyId, s3Secret
                );
                logger.info(query);
                stmt.execute(query);

                // Create Iceberg secret
                // FIXME: Use the new syntax: https://github.com/duckdb/duckdb-iceberg/commit/358cc9599612e05a46d8c989cc801b89c32c04f8
                String icebergSecretName = "iceberg-secret-" + catalog.getName();
                String icebergEndpoint = String.format("http://%s:%d/api/catalog/%s", config.getServer().getHost(), config.getServer().getPort(), catalog.getName());
                query = String.format(
                        "CREATE SECRET (TYPE ICEBERG, ENDPOINT '%s')",
                        icebergEndpoint
                );
                logger.info(query);
                stmt.execute(query);

                // Attach catalog
                stmt.execute(String.format("ATTACH '' AS \"%s\" (TYPE ICEBERG)", catalog.getName()));
            }
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        String query = request.getParameter("query");
        if (query == null || query.trim().isEmpty()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Query parameter is required");
            return;
        }

        // Connect to DuckDB and initialize configuration
        try (Connection conn = DriverManager.getConnection("jdbc:duckdb:")) {
            initializeDuckDB(conn, config);
            
            // Execute the user query
            try (Statement stmt = conn.createStatement();
                    ResultSet rs = stmt.executeQuery(query)) {
                
                ResultSetMetaData metaData = rs.getMetaData();
                int columnCount = metaData.getColumnCount();
                
                // Get column names
                List<String> columns = new ArrayList<>();
                for (int i = 1; i <= columnCount; i++) {
                    columns.add(metaData.getColumnName(i));
                }

                // Get results as arrays
                List<List<Object>> results = new ArrayList<>();
                while (rs.next()) {
                    List<Object> row = new ArrayList<>();
                    for (int i = 1; i <= columnCount; i++) {
                        row.add(rs.getObject(i));
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
            }
        } catch (Exception e) {
            logger.error("Error executing query", e);

            response.setContentType("application/json");
            Map<String, String> errorResponse = new HashMap<>();
            // HACK(eric): The `getCause()` is because DuckDB library wraps a redundant layer of SQLException.
            errorResponse.put("error", e.getCause().getMessage());
            mapper.writeValue(response.getWriter(), errorResponse);
        }
    }
}
