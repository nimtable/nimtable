/*
 * Copyright 2026 Nimtable
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
import io.nimtable.spark.LocalSpark;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
        if (query == null || query.trim().isEmpty()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Query parameter is required");
            return;
        }

        try {
            // Execute the query using Spark SQL
            Dataset<Row> result = LocalSpark.getInstance(config).getSpark().sql(query);
            String[] columns = result.columns();

            List<List<Object>> rows = new ArrayList<>();
            result.collectAsList()
                    .forEach(
                            row -> {
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
}
