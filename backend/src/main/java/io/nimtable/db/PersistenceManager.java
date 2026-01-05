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

package io.nimtable.db;

import io.ebean.DatabaseFactory;
import io.ebean.config.DatabaseConfig;
import io.ebean.datasource.DataSourceConfig;
import io.nimtable.Config;
import java.sql.Connection;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PersistenceManager {

    private static final Logger LOG = LoggerFactory.getLogger(PersistenceManager.class);
    private static javax.sql.DataSource dataSourceInstance;

    // Prevent instantiation
    private PersistenceManager() {}

    public static synchronized void initialize(Config.Database dbConfig) {
        if (dataSourceInstance == null) {
            if (dbConfig == null || dbConfig.url() == null || dbConfig.url().isEmpty()) {
                LOG.error("Database URL configuration is required to initialize persistence.");
                throw new IllegalStateException("Database URL configuration is missing.");
            }
            try {
                LOG.info("Configuring DataSource for URL: {}", dbConfig.url());
                DataSourceConfig dsConfig = new DataSourceConfig();
                dsConfig.setUrl(dbConfig.url());
                dsConfig.setUsername(dbConfig.username());
                dsConfig.setPassword(dbConfig.password());
                // let Ebean choose driver via URL

                // --- Ebean configuration ---
                DatabaseConfig ebeanConfig = new DatabaseConfig();
                ebeanConfig.setName("db");
                ebeanConfig.setDataSourceConfig(dsConfig);
                ebeanConfig.addPackage("io.nimtable.db.entity");

                // Disable Ebean's DDL generation and execution
                ebeanConfig.setDdlGenerate(false);
                ebeanConfig.setDdlRun(false);
                ebeanConfig.setRunMigration(false);

                // Create Database and get DataSource
                javax.sql.DataSource ds = DatabaseFactory.create(ebeanConfig).dataSource();
                // Run Flyway migrations
                FlywayMigrator.migrateDatabase(ds, dbConfig);
            } catch (Exception e) {
                LOG.error("Failed to initialize persistence: {}", e.getMessage(), e);
                throw new RuntimeException("Failed to initialize persistence", e);
            }
        } else {
            LOG.warn("DataSource already initialized.");
        }
    }

    public static DataSource getDataSource() {
        if (dataSourceInstance == null) {
            throw new IllegalStateException(
                    "PersistenceManager not initialized. Call initialize() first.");
        }
        return dataSourceInstance;
    }

    // Convenience method to get a connection
    public static Connection getConnection() throws SQLException {
        return getDataSource().getConnection();
    }

    public static synchronized void close() {
        // Nothing to close: Ebean will shutdown datasource on JVM exit
    }
}
