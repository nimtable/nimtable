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

package io.nimtable;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.nimtable.db.entity.User;
import io.nimtable.db.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.mindrot.jbcrypt.BCrypt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Servlet for handling User CRUD operations via RESTful API endpoints. Base
 * Path: `/api/users`
 *
 * <p>
 * Endpoints: - GET /api/users: Retrieve a list of all users. - POST /api/users:
 * Create a new
 * user. - GET /api/users/{id}: Retrieve a specific user by their ID. - PUT
 * /api/users/{id}: Update
 * a specific user by their ID. - DELETE /api/users/{id}: Delete a specific user
 * by their ID.
 */
public class UserServlet extends HttpServlet {

    private static final Logger LOG = LoggerFactory.getLogger(UserServlet.class);
    // Regex to extract user ID from path like /api/users/123
    private static final Pattern USER_ID_PATTERN = Pattern.compile("/api/users/(\\d+)");
    // Base path for listing/creating users
    private static final String USERS_BASE_PATH = "/api/users";

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public UserServlet(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.objectMapper = new ObjectMapper();
        // Register module to handle Java 8 date/time types like Instant
        this.objectMapper.registerModule(new JavaTimeModule());
        // TODO: Configure objectMapper further if needed (e.g., disable
        // FAIL_ON_UNKNOWN_PROPERTIES)
    }

    /**
     * Handles GET requests for user resources.
     *
     * <p>
     * Routes: - `/api/users`: Calls
     * {@link #handleGetAllUsers(HttpServletResponse)}. -
     * `/api/users/{id}`: Calls
     * {@link #handleGetUserById(long, HttpServletResponse)}.
     *
     * @param req  HttpServletRequest object.
     * @param resp HttpServletResponse object for sending the response.
     * @throws ServletException If a servlet-specific error occurs.
     * @throws IOException      If an input or output error occurs.
     */
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String pathInfo = req.getPathInfo();
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        try {
            // Check if path matches /api/users/{id}
            Matcher matcher = USER_ID_PATTERN.matcher(req.getRequestURI());
            if (matcher.matches()) {
                long userId = Long.parseLong(matcher.group(1));
                handleGetUserById(userId, resp);
            }
            // Check if path matches /api/users or /api/users/
            else if (req.getRequestURI().equals(USERS_BASE_PATH)
                    || req.getRequestURI().equals(USERS_BASE_PATH + "/")) {
                handleGetAllUsers(resp);
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                objectMapper.writeValue(resp.getWriter(), new ErrorResponse("Not Found"));
            }
        } catch (NumberFormatException e) {
            LOG.warn("Invalid user ID format in URI: {}", req.getRequestURI());
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            objectMapper.writeValue(resp.getWriter(), new ErrorResponse("Invalid user ID format."));
        } catch (Exception e) {
            LOG.error("Unexpected error during GET request: {}", e.getMessage(), e);
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            objectMapper.writeValue(
                    resp.getWriter(), new ErrorResponse("An unexpected error occurred."));
        }
    }

    /**
     * Retrieves a specific user by ID and writes it to the response as JSON.
     * Responds with 200 OK
     * and user data if found, 404 Not Found otherwise. Password hash is always
     * masked in the
     * response.
     *
     * @param userId The ID of the user to retrieve.
     * @param resp   The HttpServletResponse object.
     * @throws IOException If an I/O error occurs writing the response.
     */
    private void handleGetUserById(long userId, HttpServletResponse resp) throws IOException {
        Optional<User> userOptional = userRepository.findUserById(userId);
        if (userOptional.isPresent()) {
            resp.setStatus(HttpServletResponse.SC_OK);
            // Mask password hash before sending response
            User user = userOptional.get();
            user.setPasswordHash(null); // Never send password hash to client
            objectMapper.writeValue(resp.getWriter(), user);
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            objectMapper.writeValue(resp.getWriter(), new ErrorResponse("User not found"));
        }
    }

    /**
     * Retrieves all users and writes the list to the response as JSON. Responds
     * with 200 OK and a
     * JSON array of users. Password hashes are always masked in the response.
     *
     * @param resp The HttpServletResponse object.
     * @throws IOException If an I/O error occurs writing the response.
     */
    private void handleGetAllUsers(HttpServletResponse resp) throws IOException {
        List<User> users = userRepository.getAllUsers();
        // Mask password hash for all users in the list
        users.forEach(user -> {
            user.setPasswordHash(null);
            // Ensure updatedAt is returned
            if (user.getUpdatedAt() == null) {
                user.setUpdatedAt(user.getCreatedAt());
            }
        });
        resp.setStatus(HttpServletResponse.SC_OK);
        objectMapper.writeValue(resp.getWriter(), users);
    }

    /**
     * Handles POST requests to create a new user. Path: `/api/users`
     *
     * <p>
     * Expects a JSON request body representing the new user, requiring `username`
     * and `password`
     * fields.
     *
     * <p>
     * Responses: - 201 Created: User created successfully. Response body contains
     * the created
     * user (with password hash masked). - 400 Bad Request: Invalid JSON format or
     * missing required
     * fields (username, password). - 409 Conflict: Username already exists. - 500
     * Internal Server
     * Error: Database error or other unexpected error.
     *
     * @param req  HttpServletRequest object containing the user data in the body.
     * @param resp HttpServletResponse object for sending the response.
     * @throws ServletException If a servlet-specific error occurs.
     * @throws IOException      If an input or output error occurs.
     */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        // Expect path to be /api/users
        if (!req.getRequestURI().equals(USERS_BASE_PATH)) {
            resp.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
            objectMapper.writeValue(
                    resp.getWriter(), new ErrorResponse("POST only allowed at /api/users"));
            return;
        }

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        try {
            User newUser = objectMapper.readValue(req.getReader(), User.class);

            // --- Password Hashing ---
            if (newUser.getPassword() == null || newUser.getPassword().trim().isEmpty()) {
                throw new IllegalArgumentException("Password is required for new users.");
            }
            String hashedPassword = BCrypt.hashpw(newUser.getPassword(), BCrypt.gensalt());
            newUser.setPasswordHash(hashedPassword);
            newUser.setPassword(null); // Clear plaintext password

            // --- Input Validation ---
            if (newUser.getUsername() == null || newUser.getUsername().trim().isEmpty()) {
                throw new IllegalArgumentException("Username is required.");
            }

            // --- Role Validation ---
            if (newUser.getRoleId() <= 0) {
                throw new IllegalArgumentException(
                        "Role ID must be greater than 0. Valid roles are: 1 (admin), 2 (editor), 3 (viewer)");
            }

            User createdUser = userRepository.createUser(newUser);

            resp.setStatus(HttpServletResponse.SC_CREATED);
            createdUser.setPasswordHash(null); // Mask hash in response
            objectMapper.writeValue(resp.getWriter(), createdUser);

        } catch (com.fasterxml.jackson.core.JsonProcessingException | IllegalArgumentException e) {
            LOG.warn("Invalid request data received for POST: {}", e.getMessage());
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            objectMapper.writeValue(
                    resp.getWriter(), new ErrorResponse("Invalid request data: " + e.getMessage()));
        } catch (io.ebean.DuplicateKeyException e) {
            LOG.warn("Username already exists: {}", e.getMessage());
            resp.setStatus(HttpServletResponse.SC_CONFLICT);
            objectMapper.writeValue(
                    resp.getWriter(),
                    new ErrorResponse("Username already exists: " + e.getMessage()));
        } catch (Exception e) {
            LOG.error("Unexpected error during POST request: {}", e.getMessage(), e);
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            objectMapper.writeValue(
                    resp.getWriter(), new ErrorResponse("An unexpected error occurred."));
        }
    }

    /**
     * Handles PUT requests to update an existing user. Path: `/api/users/{id}`
     *
     * <p>
     * Expects a JSON request body representing the user updates. - `username` is
     * required. - If
     * `password` field is provided, the user's password will be updated. - Other
     * fields in the User
     * object can be updated.
     *
     * <p>
     * Responses: - 200 OK: User updated successfully. Response body contains the
     * updated user
     * (with password hash masked). - 400 Bad Request: Invalid JSON format or
     * missing required
     * fields (username). - 404 Not Found: User with the specified ID does not
     * exist. - 409
     * Conflict: Username already exists (if changed to an existing one). - 500
     * Internal Server
     * Error: Database error or other unexpected error.
     *
     * @param req  HttpServletRequest object containing the user ID in the path and
     *             updates in the
     *             body.
     * @param resp HttpServletResponse object for sending the response.
     * @throws ServletException If a servlet-specific error occurs.
     * @throws IOException      If an input or output error occurs.
     */
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Matcher matcher = USER_ID_PATTERN.matcher(req.getRequestURI());
        if (!matcher.matches()) {
            resp.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
            objectMapper.writeValue(
                    resp.getWriter(), new ErrorResponse("PUT expects /api/users/{id}"));
            return;
        }

        try {
            long userId = Long.parseLong(matcher.group(1));
            User userUpdates = objectMapper.readValue(req.getReader(), User.class);
            userUpdates.setId(userId); // Set ID from path

            // Fetch existing user to compare and get existing hash if needed
            Optional<User> existingUserOpt = userRepository.findUserById(userId);
            if (!existingUserOpt.isPresent()) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                objectMapper.writeValue(
                        resp.getWriter(), new ErrorResponse("User not found for update."));
                return;
            }
            User existingUser = existingUserOpt.get();

            // --- Handle Password Update ---
            if (userUpdates.getPassword() != null && !userUpdates.getPassword().trim().isEmpty()) {
                String newHashedPassword = BCrypt.hashpw(userUpdates.getPassword(), BCrypt.gensalt());
                userUpdates.setPasswordHash(newHashedPassword);
                LOG.debug("Updating password hash for user ID: {}", userId);
            } else {
                userUpdates.setPasswordHash(existingUser.getPasswordHash());
            }
            userUpdates.setPassword(null); // Clear plaintext password if it was present
            // -----------------------------

            // --- Input Validation ---
            if (userUpdates.getUsername() == null || userUpdates.getUsername().trim().isEmpty()) {
                throw new IllegalArgumentException("Username cannot be empty.");
            }

            // --- Role Validation ---
            if (userUpdates.getRoleId() <= 0) {
                throw new IllegalArgumentException(
                        "Role ID must be greater than 0. Valid roles are: 1 (admin), 2 (editor), 3 (viewer)");
            }

            // If roleId is not provided in the update, keep the existing role
            if (userUpdates.getRoleId() == 0) {
                userUpdates.setRoleId(existingUser.getRoleId());
            }

            boolean updated = userRepository.updateUser(userUpdates);

            if (updated) {
                resp.setStatus(HttpServletResponse.SC_OK);
                userUpdates.setPasswordHash(null); // Mask hash in response
                objectMapper.writeValue(resp.getWriter(), userUpdates);
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                objectMapper.writeValue(
                        resp.getWriter(),
                        new ErrorResponse("User not found or update failed unexpectedly."));
            }

        } catch (NumberFormatException e) {
            LOG.warn("Invalid user ID format in PUT URI: {}", req.getRequestURI());
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            objectMapper.writeValue(resp.getWriter(), new ErrorResponse("Invalid user ID format."));
        } catch (com.fasterxml.jackson.core.JsonProcessingException | IllegalArgumentException e) {
            LOG.warn("Invalid request data received for PUT: {}", e.getMessage());
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            objectMapper.writeValue(
                    resp.getWriter(), new ErrorResponse("Invalid request data: " + e.getMessage()));
        } catch (Exception e) {
            LOG.error(
                    "Unexpected error during PUT request for user ID {}: {}",
                    matcher.group(1),
                    e.getMessage(),
                    e);
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            objectMapper.writeValue(
                    resp.getWriter(), new ErrorResponse("An unexpected error occurred."));
        }
    }

    /**
     * Handles DELETE requests to remove an existing user. Path: `/api/users/{id}`
     *
     * <p>
     * Responses: - 204 No Content: User deleted successfully. - 400 Bad Request:
     * Invalid user ID
     * format in the path. - 404 Not Found: User with the specified ID does not
     * exist. - 500
     * Internal Server Error: Database error or other unexpected error.
     *
     * @param req  HttpServletRequest object containing the user ID in the path.
     * @param resp HttpServletResponse object for sending the response.
     * @throws ServletException If a servlet-specific error occurs.
     * @throws IOException      If an input or output error occurs.
     */
    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Matcher matcher = USER_ID_PATTERN.matcher(req.getRequestURI());
        if (!matcher.matches()) {
            resp.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
            objectMapper.writeValue(
                    resp.getWriter(), new ErrorResponse("DELETE expects /api/users/{id}"));
            return;
        }

        try {
            long userId = Long.parseLong(matcher.group(1));
            boolean deleted = userRepository.deleteUser(userId);

            if (deleted) {
                resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                objectMapper.writeValue(
                        resp.getWriter(), new ErrorResponse("User not found for deletion."));
            }
        } catch (NumberFormatException e) {
            LOG.warn("Invalid user ID format in DELETE URI: {}", req.getRequestURI());
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            objectMapper.writeValue(resp.getWriter(), new ErrorResponse("Invalid user ID format."));
        } catch (Exception e) {
            LOG.error("Unexpected error during DELETE request: {}", e.getMessage(), e);
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            objectMapper.writeValue(
                    resp.getWriter(), new ErrorResponse("An unexpected error occurred."));
        }
    }

    // Simple inner class for error responses
    private static class ErrorResponse {
        private String error;

        public ErrorResponse(String error) {
            this.error = error;
        }

        public String getError() {
            return error;
        }
    }
}
