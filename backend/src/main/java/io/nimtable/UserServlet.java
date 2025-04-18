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
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.mindrot.jbcrypt.BCrypt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// Maps to /api/users/*
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

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
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
            else if (req.getRequestURI().equals(USERS_BASE_PATH) || req.getRequestURI().equals(USERS_BASE_PATH + "/")) {
                handleGetAllUsers(resp);
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                objectMapper.writeValue(resp.getWriter(), new ErrorResponse("Not Found"));
            }
        } catch (NumberFormatException e) {
            LOG.warn("Invalid user ID format in URI: {}", req.getRequestURI());
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            objectMapper.writeValue(resp.getWriter(), new ErrorResponse("Invalid user ID format."));
        } catch (SQLException e) {
            LOG.error("Database error during GET request: {}", e.getMessage(), e);
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            objectMapper.writeValue(resp.getWriter(), new ErrorResponse("Internal Server Error"));
        } catch (Exception e) {
            LOG.error("Unexpected error during GET request: {}", e.getMessage(), e);
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            objectMapper.writeValue(resp.getWriter(), new ErrorResponse("An unexpected error occurred."));
        }
    }

    private void handleGetUserById(long userId, HttpServletResponse resp) throws SQLException, IOException {
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

    private void handleGetAllUsers(HttpServletResponse resp) throws SQLException, IOException {
        List<User> users = userRepository.getAllUsers();
        // Mask password hash for all users in the list
        users.forEach(user -> user.setPasswordHash(null));
        resp.setStatus(HttpServletResponse.SC_OK);
        objectMapper.writeValue(resp.getWriter(), users);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        // Expect path to be /api/users
        if (!req.getRequestURI().equals(USERS_BASE_PATH)) {
            resp.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
            objectMapper.writeValue(resp.getWriter(), new ErrorResponse("POST only allowed at /api/users"));
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
            // ------------------------

            // --- Input Validation ---
            if (newUser.getUsername() == null || newUser.getUsername().trim().isEmpty()) {
                throw new IllegalArgumentException("Username is required.");
            }
            // Removed email validation
            // ----------------------

            User createdUser = userRepository.createUser(newUser);

            resp.setStatus(HttpServletResponse.SC_CREATED);
            createdUser.setPasswordHash(null); // Mask hash in response
            objectMapper.writeValue(resp.getWriter(), createdUser);

        } catch (com.fasterxml.jackson.core.JsonProcessingException | IllegalArgumentException e) {
            LOG.warn("Invalid request data received for POST: {}", e.getMessage());
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            objectMapper.writeValue(resp.getWriter(), new ErrorResponse("Invalid request data: " + e.getMessage()));
        } catch (SQLException e) {
            LOG.error("Database error during POST request: {}", e.getMessage(), e);
            if (e.getErrorCode() == 19 /* SQLITE_CONSTRAINT */) {
                if (e.getMessage().contains("users.username")) {
                    resp.setStatus(HttpServletResponse.SC_CONFLICT);
                    objectMapper.writeValue(resp.getWriter(), new ErrorResponse("Username already exists."));
                } else {
                    resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR); // Other constraint error
                    objectMapper.writeValue(resp.getWriter(), new ErrorResponse("Database constraint violation."));
                }
            } else {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                objectMapper.writeValue(resp.getWriter(),
                        new ErrorResponse("Database error occurred during user creation."));
            }
        } catch (Exception e) {
            LOG.error("Unexpected error during POST request: {}", e.getMessage(), e);
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            objectMapper.writeValue(resp.getWriter(), new ErrorResponse("An unexpected error occurred."));
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Matcher matcher = USER_ID_PATTERN.matcher(req.getRequestURI());
        if (!matcher.matches()) {
            resp.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
            objectMapper.writeValue(resp.getWriter(), new ErrorResponse("PUT expects /api/users/{id}"));
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
                objectMapper.writeValue(resp.getWriter(), new ErrorResponse("User not found for update."));
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
            // Removed email validation
            // ----------------------

            boolean updated = userRepository.updateUser(userUpdates);

            if (updated) {
                resp.setStatus(HttpServletResponse.SC_OK);
                userUpdates.setPasswordHash(null); // Mask hash in response
                objectMapper.writeValue(resp.getWriter(), userUpdates);
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                objectMapper.writeValue(resp.getWriter(),
                        new ErrorResponse("User not found or update failed unexpectedly."));
            }

        } catch (NumberFormatException e) {
            LOG.warn("Invalid user ID format in PUT URI: {}", req.getRequestURI());
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            objectMapper.writeValue(resp.getWriter(), new ErrorResponse("Invalid user ID format."));
        } catch (com.fasterxml.jackson.core.JsonProcessingException | IllegalArgumentException e) {
            LOG.warn("Invalid request data received for PUT: {}", e.getMessage());
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            objectMapper.writeValue(resp.getWriter(), new ErrorResponse("Invalid request data: " + e.getMessage()));
        } catch (SQLException e) {
            LOG.error("Database error during PUT request for user ID {}: {}", matcher.group(1), e.getMessage(), e);
            if (e.getErrorCode() == 19 /* SQLITE_CONSTRAINT */) {
                if (e.getMessage().contains("users.username")) {
                    resp.setStatus(HttpServletResponse.SC_CONFLICT);
                    objectMapper.writeValue(resp.getWriter(), new ErrorResponse("Username already exists."));
                } else {
                    resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    objectMapper.writeValue(resp.getWriter(), new ErrorResponse("Database constraint violation."));
                }
            } else {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                objectMapper.writeValue(resp.getWriter(),
                        new ErrorResponse("Database error occurred during user update."));
            }
        } catch (Exception e) {
            LOG.error("Unexpected error during PUT request for user ID {}: {}", matcher.group(1), e.getMessage(), e);
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            objectMapper.writeValue(resp.getWriter(), new ErrorResponse("An unexpected error occurred."));
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        handleNotImplemented(resp, "DELETE");
    }

    private void handleNotImplemented(HttpServletResponse resp, String method) throws IOException {
        resp.setStatus(HttpServletResponse.SC_NOT_IMPLEMENTED);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(resp.getWriter(), new ErrorResponse(method + " method not implemented yet."));
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