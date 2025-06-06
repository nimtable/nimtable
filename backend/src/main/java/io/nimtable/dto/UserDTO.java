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

package io.nimtable.dto;

import io.nimtable.db.entity.User;
import java.time.Instant;

/**
 * Data Transfer Object for User responses. This ensures consistent serialization between backend
 * and client.
 */
public record UserDTO(Long id, String username, String role, Instant createdAt, Instant updatedAt) {
    public static UserDTO fromUser(User user) {
        return new UserDTO(
                user.getId(),
                user.getUsername(),
                user.getRoleId() == 1 ? "admin" : user.getRoleId() == 2 ? "editor" : "viewer",
                user.getCreatedAt(),
                user.getUpdatedAt());
    }
}
