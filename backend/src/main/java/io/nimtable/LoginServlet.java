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
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.nimtable.db.entity.User;
import io.nimtable.db.repository.UserRepository;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import org.mindrot.jbcrypt.BCrypt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LoginServlet extends HttpServlet {
    private static final Logger LOG = LoggerFactory.getLogger(LoginServlet.class);
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final Config config;

    public LoginServlet(Config config) {
        this.objectMapper = new ObjectMapper();
        this.userRepository = new UserRepository();
        this.config = config;
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        ObjectNode requestNode;
        try {
            requestNode = objectMapper.readValue(request.getReader(), ObjectNode.class);
        } catch (IOException e) {
            LOG.warn("Failed to parse login request body", e);
            sendErrorResponse(
                    response, HttpServletResponse.SC_BAD_REQUEST, "Invalid request format");
            return;
        }

        String username = requestNode.path("username").asText();
        String password = requestNode.path("password").asText();

        ObjectNode responseNode = objectMapper.createObjectNode();
        response.setContentType("application/json");

        if (username == null || username.isEmpty() || password == null || password.isEmpty()) {
            LOG.warn("Login attempt with empty credentials for user: {}", username);
            sendErrorResponse(
                    response,
                    HttpServletResponse.SC_BAD_REQUEST,
                    "Username and password cannot be empty");
            return;
        }

        boolean loggedIn = false;

        Optional<User> userOptional = userRepository.findUserByUsername(username);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (BCrypt.checkpw(password, user.getPasswordHash())) {
                LOG.info("Successful database login for user: {}", username);
                loggedIn = true;
            } else {
                LOG.warn("Invalid database password attempt for user: {}", username);
            }
        }

        if (!loggedIn) {
            Config.Admin configAuth = config.admin();
            if (configAuth != null
                    && username.equals(configAuth.username())
                    && password.equals(configAuth.password())) {
                LOG.info("Successful config file login for user: {}", username);
                loggedIn = true;
            } else if (!userOptional.isPresent()) {
                LOG.warn(
                        "Login attempt for non-existent user or invalid config credentials: {}",
                        username);
            }
        }

        if (loggedIn) {
            responseNode.put("success", true);
            response.setStatus(HttpServletResponse.SC_OK);
        } else {
            sendErrorResponse(
                    response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid username or password");
        }

        if (!response.isCommitted()) {
            objectMapper.writeValue(response.getWriter(), responseNode);
        }
    }

    private void sendErrorResponse(HttpServletResponse response, int status, String message)
            throws IOException {
        if (!response.isCommitted()) {
            response.setStatus(status);
            ObjectNode errorNode = objectMapper.createObjectNode();
            errorNode.put("success", false);
            errorNode.put("message", message);
            objectMapper.writeValue(response.getWriter(), errorNode);
        }
    }
}
