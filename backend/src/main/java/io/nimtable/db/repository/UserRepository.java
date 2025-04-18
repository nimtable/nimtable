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
     * Creates a new user in the database.
     *
     * @param user The user object to create (id should typically be null or ignored).
     * @return The created user with the generated ID and timestamps.
     * @throws SQLException if a database access error occurs.
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

    // TODO: Implement findUserById
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

    // TODO: Implement findUserByUsername
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

    // TODO: Implement getAllUsers
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

    // TODO: Implement updateUser
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

    // TODO: Implement deleteUser
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

    private User mapRowToUser(ResultSet rs) throws SQLException {
        return new User(
                rs.getLong("id"),
                rs.getString("username"),
                rs.getString("password_hash"),
                Instant.parse(rs.getString("created_at")), // Parse ISO-8601 string back to Instant
                Instant.parse(rs.getString("updated_at")));
    }
}
