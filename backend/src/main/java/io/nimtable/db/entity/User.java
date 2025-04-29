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

package io.nimtable.db.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.ebean.Model;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User extends Model {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false, unique = true)
    private String username;

    // Field to receive plain text password from request (write-only)
    @Transient private String password;

    // Field to store hashed password in DB (read/write internally, ignore in
    // response)
    private String passwordHash;

    @Column(insertable = true, updatable = false)
    private Instant createdAt;

    @Column(insertable = true, updatable = true)
    private Instant updatedAt;

    // Constructors
    public User() {}

    public User(
            long id, String username, String passwordHash, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    // Allow Jackson to deserialize 'password' field from JSON
    @JsonProperty("password")
    public void setPassword(String password) {
        this.password = password;
    }

    // Do not expose plain password via getter
    @JsonIgnore
    public String getPassword() {
        return password;
    }

    // Allow internal setting/getting of passwordHash
    public String getPasswordHash() {
        return passwordHash;
    }

    // Allow internal setting/getting of passwordHash
    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
