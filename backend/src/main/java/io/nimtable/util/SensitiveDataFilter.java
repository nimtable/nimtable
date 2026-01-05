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

package io.nimtable.util;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Utility class to filter out sensitive configuration properties before sending to client. This
 * ensures credentials, keys, and other sensitive data are not exposed to the frontend.
 */
public class SensitiveDataFilter {

    private static final List<String> SENSITIVE_KEYS =
            Arrays.asList(
                    // AWS credentials
                    "aws.access-key-id",
                    "aws.secret-access-key",
                    "aws.session-token",
                    "s3.access-key-id",
                    "s3.secret-access-key",
                    "s3.session-token",
                    // Database credentials
                    "jdbc.user",
                    "jdbc.password",
                    "password",
                    "user",
                    "username",
                    // OAuth and tokens
                    "oauth2.credential",
                    "credential",
                    "token",
                    "secret",
                    "key",
                    // Azure credentials
                    "azure.account.key",
                    "azure.sas-token",
                    // Google credentials
                    "gcs.service-account-json",
                    "gcs.oauth2.credential",
                    // Generic sensitive patterns
                    "auth",
                    "authentication",
                    "authorization");

    /**
     * Filters out sensitive properties from a configuration map.
     *
     * @param properties the original properties map
     * @return a new map with sensitive properties removed
     */
    public static Map<String, String> filterSensitiveProperties(Map<String, String> properties) {
        if (properties == null) {
            return new HashMap<>();
        }

        Map<String, String> filtered = new HashMap<>();

        for (Map.Entry<String, String> entry : properties.entrySet()) {
            String key = entry.getKey();
            String keyLower = key.toLowerCase();

            boolean isSensitive =
                    SENSITIVE_KEYS.stream()
                            .anyMatch(
                                    sensitiveKey ->
                                            keyLower.contains(sensitiveKey)
                                                    || keyLower.contains("password")
                                                    || keyLower.contains("secret")
                                                    || (keyLower.contains("key")
                                                            && (keyLower.contains("access")
                                                                    || keyLower.contains("auth"))));

            if (!isSensitive) {
                filtered.put(key, entry.getValue());
            }
        }

        return filtered;
    }
}
