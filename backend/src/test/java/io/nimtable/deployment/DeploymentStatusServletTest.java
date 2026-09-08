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

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Map;
import org.junit.jupiter.api.Test;

class DeploymentStatusServletTest {
    @Test
    void reportsSingletonOwnershipAndEmbeddedServices() {
        DeploymentStatusServlet servlet = new DeploymentStatusServlet(() -> true);

        Map<String, String> status = servlet.status(true);

        assertEquals("UP", status.get("status"));
        assertEquals("single-replica", status.get("deploymentMode"));
        assertEquals("HELD", status.get("replicaLock"));
        assertEquals("in-process", status.get("scheduler"));
        assertEquals("embedded-local", status.get("spark"));
        assertEquals("config-and-postgresql", status.get("catalogRegistration"));
    }

    @Test
    void reportsLockLossAsDown() {
        DeploymentStatusServlet servlet = new DeploymentStatusServlet(() -> false);

        Map<String, String> status = servlet.status(false);

        assertEquals("DOWN", status.get("status"));
        assertEquals("LOST", status.get("replicaLock"));
    }
}
