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

import io.ebean.DB;
import io.nimtable.db.entity.User;
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

    /**
     * Creates a new user in the database. Sets the `createdAt` and `updatedAt` timestamps.
     *
     * @param user The user object to create. The ID field is ignored and will be generated.
     *     Requires `username` and `passwordHash` to be set.
     * @return The created user with the generated ID and timestamps populated.
     */
    public User createUser(User user) {
        DB.save(user);
        return user;
    }

    /**
     * Finds a user by their unique ID.
     *
     * @param id The ID of the user to find.
     * @return An Optional containing the found User, or an empty Optional if not found. Logs an
     *     error if a SQLException occurs during the query.
     */
    public Optional<User> findUserById(long id) {
        return Optional.ofNullable(DB.find(User.class, id));
    }

    /**
     * Finds a user by their unique username.
     *
     * @param username The username to search for.
     * @return An Optional containing the found User, or an empty Optional if not found or username
     *     is null/empty. Logs an error if a SQLException occurs during the query.
     */
    public Optional<User> findUserByUsername(String username) {
        return Optional.ofNullable(DB.find(User.class).where().eq("username", username).findOne());
    }

    /**
     * Retrieves a list of all users from the database, ordered by username.
     *
     * @return A List of User objects. Returns an empty list if no users are found or an error
     *     occurs. Logs an error if a SQLException occurs during the query.
     */
    public List<User> getAllUsers() {
        return DB.find(User.class).orderBy().asc("username").findList();
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
    public boolean updateUser(User user) {
        DB.update(user);
        return true;
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
    public boolean deleteUser(long id) {
        User user = DB.find(User.class, id);
        if (user == null) {
            return false;
        }
        DB.delete(user);
        return true;
    }

    // --- Helper Methods removed (mapping handled by Ebean) ---
}
