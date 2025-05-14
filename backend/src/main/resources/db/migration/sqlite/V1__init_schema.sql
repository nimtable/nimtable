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

-- Create the data_distributions table
CREATE TABLE data_distributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_id TEXT NOT NULL,
    catalog_name TEXT NOT NULL,
    namespace TEXT NOT NULL,
    table_name TEXT NOT NULL,
    data_file_count INTEGER NOT NULL,
    position_delete_file_count INTEGER NOT NULL,
    eq_delete_file_count INTEGER NOT NULL,
    data_file_size_in_bytes INTEGER NOT NULL,
    position_delete_file_size_in_bytes INTEGER NOT NULL,
    eq_delete_file_size_in_bytes INTEGER NOT NULL,
    data_file_record_count BIGINT NOT NULL,
    position_delete_file_record_count BIGINT NOT NULL,
    eq_delete_file_record_count BIGINT NOT NULL,
    ranges TEXT, -- Store JSON as TEXT
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(snapshot_id, catalog_name, namespace, table_name)
);

-- Indexes (Standard SQL, compatible with SQLite)
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_catalogs_name ON catalogs(name);
CREATE INDEX idx_data_distributions_snapshot ON data_distributions(snapshot_id, catalog_name, namespace, table_name);