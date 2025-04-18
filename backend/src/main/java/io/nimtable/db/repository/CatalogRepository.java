/*
 * Copyright 2025 Nimtable
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

package io.nimtable.db.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.nimtable.db.PersistenceManager;
import io.nimtable.db.entity.Catalog;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CatalogRepository {

    private static final Logger LOG = LoggerFactory.getLogger(CatalogRepository.class);
    private final ObjectMapper jsonMapper = new ObjectMapper(); // For handling JSON TEXT

    public List<Catalog> findAll() {
        List<Catalog> catalogs = new ArrayList<>();
        String sql =
                "SELECT id, name, type, uri, warehouse, properties, created_at, updated_at FROM catalogs";
        try (Connection conn = PersistenceManager.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql);
                ResultSet rs = pstmt.executeQuery()) {

            while (rs.next()) {
                catalogs.add(mapRowToCatalog(rs));
            }
        } catch (SQLException
                | JsonProcessingException
                | DateTimeParseException e) { // Catch parsing exceptions
            LOG.error("Error finding all catalogs", e);
            return Collections.emptyList();
        }
        return catalogs;
    }

    public Catalog save(Catalog catalog) {
        if (catalog.getId() == null) {
            return insert(catalog);
        } else {
            return update(catalog);
        }
    }

    private Catalog insert(Catalog catalog) {
        String sql =
                "INSERT INTO catalogs (name, type, uri, warehouse, properties, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = PersistenceManager.getConnection();
                PreparedStatement pstmt =
                        conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            Instant now = Instant.now();
            String nowStr = now.toString();
            pstmt.setString(1, catalog.getName());
            pstmt.setString(2, catalog.getType());
            pstmt.setString(3, catalog.getUri());
            pstmt.setString(4, catalog.getWarehouse());
            pstmt.setString(5, toJsonString(catalog.getProperties())); // Handle JSON as TEXT
            pstmt.setString(6, nowStr); // Store timestamp as TEXT
            pstmt.setString(7, nowStr); // Store timestamp as TEXT

            int affectedRows = pstmt.executeUpdate();

            if (affectedRows == 0) {
                throw new SQLException("Creating catalog failed, no rows affected.");
            }

            try (ResultSet generatedKeys = pstmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    catalog.setId(generatedKeys.getLong(1));
                    catalog.setCreatedAt(now);
                    catalog.setUpdatedAt(now);
                    return catalog;
                } else {
                    throw new SQLException("Creating catalog failed, no ID obtained.");
                }
            }
        } catch (SQLException | JsonProcessingException e) {
            LOG.error("Error inserting catalog: {}", catalog.getName(), e);
            throw new RuntimeException("Failed to insert catalog", e);
        }
    }

    private Catalog update(Catalog catalog) {
        String sql =
                "UPDATE catalogs SET name = ?, type = ?, uri = ?, warehouse = ?, properties = ?, updated_at = ? WHERE id = ?";
        try (Connection conn = PersistenceManager.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {

            Instant now = Instant.now();
            String nowStr = now.toString();
            pstmt.setString(1, catalog.getName());
            pstmt.setString(2, catalog.getType());
            pstmt.setString(3, catalog.getUri());
            pstmt.setString(4, catalog.getWarehouse());
            pstmt.setString(5, toJsonString(catalog.getProperties())); // Handle JSON as TEXT
            pstmt.setString(6, nowStr); // Update updated_at as TEXT
            pstmt.setLong(7, catalog.getId());

            int affectedRows = pstmt.executeUpdate();

            if (affectedRows == 0) {
                LOG.warn(
                        "Updating catalog failed, no rows affected for catalog ID: {}",
                        catalog.getId());
                return null;
            }
            catalog.setUpdatedAt(now); // Update object state
            return catalog;
        } catch (SQLException | JsonProcessingException e) {
            LOG.error("Error updating catalog: {}", catalog.getName(), e);
            throw new RuntimeException("Failed to update catalog", e);
        }
    }

    private Catalog mapRowToCatalog(ResultSet rs)
            throws SQLException, JsonProcessingException, DateTimeParseException {
        Catalog catalog = new Catalog();
        catalog.setId(rs.getLong("id"));
        catalog.setName(rs.getString("name"));
        catalog.setType(rs.getString("type"));
        catalog.setUri(rs.getString("uri"));
        catalog.setWarehouse(rs.getString("warehouse"));
        catalog.setProperties(fromJsonString(rs.getString("properties"))); // Handle JSON TEXT
        // Parse timestamp from TEXT
        catalog.setCreatedAt(Instant.parse(rs.getString("created_at")));
        catalog.setUpdatedAt(Instant.parse(rs.getString("updated_at")));
        return catalog;
    }

    // Helper to convert Map to JSON String for TEXT column
    private String toJsonString(Map<String, String> properties) throws JsonProcessingException {
        if (properties == null || properties.isEmpty()) {
            return null; // Store null or empty JSON string "{}" based on preference
        }
        return jsonMapper.writeValueAsString(properties);
    }

    // Helper to convert JSON string from DB to Map
    private Map<String, String> fromJsonString(String jsonString) throws JsonProcessingException {
        if (jsonString == null || jsonString.isEmpty()) {
            return Collections.emptyMap();
        }
        TypeReference<Map<String, String>> typeRef = new TypeReference<>() {};
        return jsonMapper.readValue(jsonString, typeRef);
    }

    // Add other methods like findByName, findById, delete etc. if needed
}
