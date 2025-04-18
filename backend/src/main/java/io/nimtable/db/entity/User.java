package io.nimtable.db.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public class User {

    private long id;
    private String username;
    // Field to receive plain text password from request (write-only)
    private String password;
    // Field to store hashed password in DB (read/write internally, ignore in
    // response)
    private String passwordHash;
    private Instant createdAt;
    private Instant updatedAt;

    // Constructors
    public User() {
    }

    public User(long id, String username, String passwordHash, Instant createdAt, Instant updatedAt) {
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
