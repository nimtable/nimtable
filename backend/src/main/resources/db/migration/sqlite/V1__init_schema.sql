-- V1 Initial Schema (SQLite)

-- Create the users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create the catalogs table
CREATE TABLE catalogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    uri TEXT,
    warehouse TEXT,
    properties TEXT, -- Store JSON as TEXT
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes (Standard SQL, compatible with SQLite)
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_catalogs_name ON catalogs(name);