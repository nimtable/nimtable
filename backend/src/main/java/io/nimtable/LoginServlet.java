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
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LoginServlet extends HttpServlet {
    private static final Logger LOG = LoggerFactory.getLogger(LoginServlet.class);
    private final Config config;
    private final ObjectMapper objectMapper;

    public LoginServlet(Config config) {
        this.config = config;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        ObjectNode requestNode = objectMapper.readValue(request.getReader(), ObjectNode.class);
        String username = requestNode.path("username").asText();
        String password = requestNode.path("password").asText();

        // Get credentials from Config
        String configUsername = config.auth().username();
        String configPassword = config.auth().password();

        ObjectNode responseNode = objectMapper.createObjectNode();
        response.setContentType("application/json");

        if (username.isEmpty() || password.isEmpty()) {
            LOG.warn("Login attempt with empty credentials");
            responseNode.put("success", false);
            responseNode.put("message", "Username and password cannot be empty");
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        } else if (username.equals(configUsername) && password.equals(configPassword)) {
            // Authentication successful
            LOG.info("Successful login for user: {}", username);
            responseNode.put("success", true);
            response.setStatus(HttpServletResponse.SC_OK);
        } else {
            // Authentication failed
            LOG.warn("Failed login attempt for user: {}", username);
            responseNode.put("success", false);
            responseNode.put("message", "Invalid username or password");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        }

        objectMapper.writeValue(response.getWriter(), responseNode);
    }
} 