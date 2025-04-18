-- V1 Initial Schema (SQLite)

-- Create the users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL, -- Store as ISO8601 string
    updated_at TEXT NOT NULL  -- Store as ISO8601 string
);

-- Create the catalogs table
CREATE TABLE catalogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    uri TEXT,
    warehouse TEXT,
    properties TEXT, -- Store JSON as TEXT
    created_at TEXT NOT NULL, -- Store as ISO8601 string
    updated_at TEXT NOT NULL  -- Store as ISO8601 string
);

-- Indexes (Standard SQL, compatible with SQLite)
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_catalogs_name ON catalogs(name); 