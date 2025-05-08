-- V1 Initial Schema (PostgreSQL)

-- Create the users table
CREATE TABLE users (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create the catalogs table
CREATE TABLE catalogs (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(255) NOT NULL,
    uri VARCHAR(1024),
    warehouse VARCHAR(1024),
    properties JSONB, -- Store as JSONB type in PostgreSQL
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create the data_distributions table
CREATE TABLE data_distributions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    snapshot_id VARCHAR(255) NOT NULL,
    catalog_name VARCHAR(255) NOT NULL,
    namespace VARCHAR(255) NOT NULL,
    table_name VARCHAR(255) NOT NULL,
    data_file_count INTEGER NOT NULL,
    position_delete_file_count INTEGER NOT NULL,
    eq_delete_file_count INTEGER NOT NULL,
    data_file_size_in_bytes BIGINT NOT NULL,
    position_delete_file_size_in_bytes BIGINT NOT NULL,
    eq_delete_file_size_in_bytes BIGINT NOT NULL,
    data_file_record_count BIGINT NOT NULL,
    position_delete_file_record_count BIGINT NOT NULL,
    eq_delete_file_record_count BIGINT NOT NULL,
    ranges JSONB, -- Store as JSONB type in PostgreSQL
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(snapshot_id, catalog_name, namespace, table_name)
);

-- Indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_catalogs_name ON catalogs(name);
CREATE INDEX idx_data_distributions_snapshot ON data_distributions(snapshot_id, catalog_name, namespace, table_name); 