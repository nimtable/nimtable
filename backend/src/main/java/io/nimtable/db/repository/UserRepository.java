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

import io.nimtable.db.PersistenceManager;
import io.nimtable.db.entity.User;
import java.sql.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Repository class for managing User entities in the database. Uses plain JDBC and
 * PersistenceManager for connection handling.
 */
public class UserRepository {
    private static final Logger LOG = LoggerFactory.getLogger(UserRepository.class);

    // SQL Statements (Removed email)
    private static final String INSERT_USER_SQL =
            "INSERT INTO users (username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)";
    private static final String SELECT_USER_BY_ID_SQL =
            "SELECT id, username, password_hash, created_at, updated_at FROM users WHERE id = ?";
    private static final String SELECT_USER_BY_USERNAME_SQL =
            "SELECT id, username, password_hash, created_at, updated_at FROM users WHERE username = ?";
    private static final String SELECT_ALL_USERS_SQL =
            "SELECT id, username, password_hash, created_at, updated_at FROM users ORDER BY username";
    private static final String UPDATE_USER_SQL =
            "UPDATE users SET username = ?, password_hash = ?, updated_at = ? WHERE id = ?";
    private static final String DELETE_USER_SQL = "DELETE FROM users WHERE id = ?";

    /**
     * Creates a new user in the database. Sets the `createdAt` and `updatedAt` timestamps.
     *
     * @param user The user object to create. The ID field is ignored and will be generated.
     *     Requires `username` and `passwordHash` to be set.
     * @return The created user with the generated ID and timestamps populated.
     * @throws SQLException if a database access error occurs or the user could not be created.
     */
    public User createUser(User user) throws SQLException {
        LOG.info("Creating user: {}", user.getUsername());
        Instant now = Instant.now();
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        try (Connection conn = PersistenceManager.getConnection();
                PreparedStatement pstmt =
                        conn.prepareStatement(INSERT_USER_SQL, Statement.RETURN_GENERATED_KEYS)) {

            pstmt.setString(1, user.getUsername());
            pstmt.setString(2, user.getPasswordHash());
            pstmt.setString(3, now.toString()); // created_at
            pstmt.setString(4, now.toString()); // updated_at

            int affectedRows = pstmt.executeUpdate();

            if (affectedRows == 0) {
                throw new SQLException("Creating user failed, no rows affected.");
            }

            try (ResultSet generatedKeys = pstmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    user.setId(generatedKeys.getLong(1));
                    LOG.info("User created successfully with ID: {}", user.getId());
                    return user;
                } else {
                    throw new SQLException("Creating user failed, no ID obtained.");
                }
            }
        } catch (SQLException e) {
            LOG.error("Error creating user {}: {}", user.getUsername(), e.getMessage(), e);
            throw e; // Re-throw the exception after logging
        }
    }

    /**
     * Finds a user by their unique ID.
     *
     * @param id The ID of the user to find.
     * @return An Optional containing the found User, or an empty Optional if not found. Logs an
     *     error if a SQLException occurs during the query.
     */
    public Optional<User> findUserById(long id) {
        LOG.debug("Finding user by ID: {}", id);
        try (Connection conn = PersistenceManager.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(SELECT_USER_BY_ID_SQL)) {

            pstmt.setLong(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToUser(rs));
                }
            }
        } catch (SQLException e) {
            LOG.error("Error finding user by ID {}: {}", id, e.getMessage(), e);
            // Optional: Re-throw a custom exception or return empty
        }
        return Optional.empty();
    }

    /**
     * Finds a user by their unique username.
     *
     * @param username The username to search for.
     * @return An Optional containing the found User, or an empty Optional if not found or username
     *     is null/empty. Logs an error if a SQLException occurs during the query.
     */
    public Optional<User> findUserByUsername(String username) {
        LOG.debug("Finding user by username: {}", username);
        if (username == null || username.trim().isEmpty()) {
            return Optional.empty();
        }
        try (Connection conn = PersistenceManager.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(SELECT_USER_BY_USERNAME_SQL)) {

            pstmt.setString(1, username);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToUser(rs));
                }
            }
        } catch (SQLException e) {
            LOG.error("Error finding user by username '{}': {}", username, e.getMessage(), e);
        }
        return Optional.empty();
    }

    /**
     * Retrieves a list of all users from the database, ordered by username.
     *
     * @return A List of User objects. Returns an empty list if no users are found or an error
     *     occurs. Logs an error if a SQLException occurs during the query.
     */
    public List<User> getAllUsers() {
        LOG.debug("Getting all users");
        List<User> users = new ArrayList<>();
        try (Connection conn = PersistenceManager.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(SELECT_ALL_USERS_SQL);
                ResultSet rs = pstmt.executeQuery()) {

            while (rs.next()) {
                users.add(mapRowToUser(rs));
            }
        } catch (SQLException e) {
            LOG.error("Error getting all users: {}", e.getMessage(), e);
            // Optional: Return empty list or throw exception
        }
        return users;
    }

    /**
     * Updates an existing user in the database. Updates the `updatedAt` timestamp.
     *
     * @param user The user object containing the updated information. The ID field must be set.
     *     Requires `username` and `passwordHash` to be set with the desired values.
     * @return true if the user was found and updated successfully, false otherwise (e.g., user not
     *     found).
     * @throws SQLException if a database access error occurs (e.g., unique constraint violation).
     * @throws IllegalArgumentException if the user ID is not positive.
     */
    public boolean updateUser(User user) throws SQLException {
        LOG.info("Updating user ID: {}", user.getId());
        if (user.getId() <= 0) {
            throw new IllegalArgumentException("User ID must be positive for update.");
        }
        Instant now = Instant.now();
        user.setUpdatedAt(now); // Update the timestamp

        try (Connection conn = PersistenceManager.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(UPDATE_USER_SQL)) {

            pstmt.setString(1, user.getUsername());
            pstmt.setString(2, user.getPasswordHash()); // Assume hash is already updated if needed
            pstmt.setString(3, now.toString()); // updated_at
            pstmt.setLong(4, user.getId());

            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                LOG.info("User ID {} updated successfully.", user.getId());
                return true;
            } else {
                LOG.warn(
                        "Update user ID {} failed, user not found or no changes made.",
                        user.getId());
                return false;
            }
        } catch (SQLException e) {
            LOG.error("Error updating user ID {}: {}", user.getId(), e.getMessage(), e);
            throw e; // Re-throw the exception after logging
        }
    }

    /**
     * Deletes a user from the database by their ID.
     *
     * @param id The ID of the user to delete.
     * @return true if the user was found and deleted successfully, false otherwise (e.g., user not
     *     found).
     * @throws SQLException if a database access error occurs.
     * @throws IllegalArgumentException if the user ID is not positive.
     */
    public boolean deleteUser(long id) throws SQLException {
        LOG.info("Deleting user ID: {}", id);
        if (id <= 0) {
            throw new IllegalArgumentException("User ID must be positive for delete.");
        }
        try (Connection conn = PersistenceManager.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(DELETE_USER_SQL)) {

            pstmt.setLong(1, id);
            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                LOG.info("User ID {} deleted successfully.", id);
                return true;
            } else {
                LOG.warn("Delete user ID {} failed, user not found.", id);
                return false;
            }
        } catch (SQLException e) {
            LOG.error("Error deleting user ID {}: {}", id, e.getMessage(), e);
            throw e; // Re-throw the exception after logging
        }
    }

    // --- Helper Methods --- (Optional: For mapping ResultSet to User object)

    /**
     * Helper method to map a row from a ResultSet to a User object.
     *
     * @param rs The ResultSet pointing to the current row.
     * @return A User object populated from the ResultSet.
     * @throws SQLException if a column is not found or a database access error occurs.
     */
    private User mapRowToUser(ResultSet rs) throws SQLException {
        return new User(
                rs.getLong("id"),
                rs.getString("username"),
                rs.getString("password_hash"),
                Instant.parse(rs.getString("created_at")), // Parse ISO-8601 string back to Instant
                Instant.parse(rs.getString("updated_at")));
    }
}
