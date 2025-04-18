package io.nimtable.db.repository;

import io.nimtable.db.PersistenceManager;
import io.nimtable.db.entity.User;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class UserRepository {

    private static final Logger LOG = LoggerFactory.getLogger(UserRepository.class);

    public Optional<User> findByUsername(String username) {
        String sql =
                "SELECT id, username, password_hash, created_at, updated_at FROM users WHERE username = ?";
        try (Connection conn = PersistenceManager.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, username);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    User user = mapRowToUser(rs);
                    return Optional.of(user);
                }
            }
        } catch (SQLException | DateTimeParseException e) {
            LOG.error("Error finding user by username: {}", username, e);
        }
        return Optional.empty();
    }

    public User save(User user) {
        // Determine if it's an insert or update
        if (user.getId() == null) {
            return insert(user);
        } else {
            return update(user); // Or throw exception if updates aren't expected/allowed this way
        }
    }

    private User insert(User user) {
        String sql =
                "INSERT INTO users (username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)";
        // Use generated keys approach compatible with SQLite AUTOINCREMENT
        try (Connection conn = PersistenceManager.getConnection();
                PreparedStatement pstmt =
                        conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            Instant now = Instant.now();
            String nowStr = now.toString(); // ISO8601 format
            pstmt.setString(1, user.getUsername());
            pstmt.setString(2, user.getPasswordHash());
            pstmt.setString(3, nowStr); // Set created_at as TEXT
            pstmt.setString(4, nowStr); // Set updated_at as TEXT

            int affectedRows = pstmt.executeUpdate();

            if (affectedRows == 0) {
                throw new SQLException("Creating user failed, no rows affected.");
            }

            // Retrieve the generated ID (ROWID in SQLite for AUTOINCREMENT)
            try (ResultSet generatedKeys = pstmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    user.setId(generatedKeys.getLong(1));
                    user.setCreatedAt(now);
                    user.setUpdatedAt(now);
                    return user;
                } else {
                    throw new SQLException("Creating user failed, no ID obtained.");
                }
            }
        } catch (SQLException e) {
            LOG.error("Error inserting user: {}", user.getUsername(), e);
            throw new RuntimeException("Failed to insert user", e);
        }
    }

    private User update(User user) {
        String sql =
                "UPDATE users SET username = ?, password_hash = ?, updated_at = ? WHERE id = ?";
        try (Connection conn = PersistenceManager.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {

            Instant now = Instant.now();
            String nowStr = now.toString(); // ISO8601 format
            pstmt.setString(1, user.getUsername());
            pstmt.setString(2, user.getPasswordHash());
            pstmt.setString(3, nowStr); // Update updated_at as TEXT
            pstmt.setLong(4, user.getId());

            int affectedRows = pstmt.executeUpdate();

            if (affectedRows == 0) {
                LOG.warn("Updating user failed, no rows affected for user ID: {}", user.getId());
                // Consider throwing an exception if the user must exist
                // throw new SQLException("Updating user failed, user not found or no changes
                // made.");
                return null; // Or return original user, or throw exception
            }
            user.setUpdatedAt(now);
            return user;
        } catch (SQLException e) {
            LOG.error("Error updating user: {}", user.getUsername(), e);
            throw new RuntimeException("Failed to update user", e);
        }
    }

    private User mapRowToUser(ResultSet rs) throws SQLException, DateTimeParseException {
        User user = new User();
        user.setId(rs.getLong("id"));
        user.setUsername(rs.getString("username"));
        user.setPasswordHash(rs.getString("password_hash"));
        // Parse ISO8601 string from TEXT column
        user.setCreatedAt(Instant.parse(rs.getString("created_at")));
        user.setUpdatedAt(Instant.parse(rs.getString("updated_at")));
        return user;
    }

    // Add other methods like delete etc. if needed
}
