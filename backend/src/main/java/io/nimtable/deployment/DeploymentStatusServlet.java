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

package io.nimtable.deployment;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.BooleanSupplier;

/** Reports the backend deployment model and ownership of its singleton responsibilities. */
public class DeploymentStatusServlet extends HttpServlet {
    private final BooleanSupplier lockHeld;
    private final ObjectMapper mapper;

    public DeploymentStatusServlet(BackendInstanceLock instanceLock) {
        this(instanceLock::isHeld);
    }

    DeploymentStatusServlet(BooleanSupplier lockHeld) {
        this.lockHeld = lockHeld;
        this.mapper = new ObjectMapper();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        boolean healthy = lockHeld.getAsBoolean();
        response.setStatus(
                healthy ? HttpServletResponse.SC_OK : HttpServletResponse.SC_SERVICE_UNAVAILABLE);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        mapper.writeValue(response.getOutputStream(), status(healthy));
    }

    Map<String, String> status(boolean healthy) {
        Map<String, String> status = new LinkedHashMap<>();
        status.put("status", healthy ? "UP" : "DOWN");
        status.put("deploymentMode", BackendInstanceLock.DEPLOYMENT_MODE);
        status.put("replicaLock", healthy ? "HELD" : "LOST");
        status.put("scheduler", "in-process");
        status.put("spark", "embedded-local");
        status.put("catalogRegistration", "config-and-postgresql");
        return status;
    }
}
