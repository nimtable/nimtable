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

package io.nimtable.db;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import io.nimtable.Config;
import java.sql.Connection;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PersistenceManager {

    private static final Logger LOG = LoggerFactory.getLogger(PersistenceManager.class);
    private static volatile HikariDataSource dataSourceInstance;

    // Prevent instantiation
    private PersistenceManager() {}

    public static synchronized void initialize(Config.Database dbConfig) {
        if (dataSourceInstance == null) {
            if (dbConfig == null || dbConfig.url() == null || dbConfig.url().isEmpty()) {
                LOG.error("Database URL configuration is required to initialize persistence.");
                throw new IllegalStateException("Database URL configuration is missing.");
            }
            try {
                LOG.info("Initializing HikariCP DataSource for SQLite URL: {}", dbConfig.url());
                HikariConfig config = new HikariConfig();
                config.setJdbcUrl(dbConfig.url());
                config.setDriverClassName("org.sqlite.JDBC"); // Set SQLite driver

                // HikariCP Pool settings (optional, but recommended)
                config.setMaximumPoolSize(
                        5); // SQLite typically handles fewer concurrent connections well
                config.setMinimumIdle(1);
                config.setIdleTimeout(600000); // 10 minutes
                config.setConnectionTimeout(30000); // 30 seconds
                config.addDataSourceProperty("cachePrepStmts", "true");
                config.addDataSourceProperty("prepStmtCacheSize", "250");
                config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");

                dataSourceInstance = new HikariDataSource(config);
                LOG.info("HikariCP DataSource initialized successfully for SQLite.");

                FlywayMigrator.migrateDatabase(dataSourceInstance, dbConfig);
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
        if (dataSourceInstance != null && !dataSourceInstance.isClosed()) {
            dataSourceInstance.close();
            dataSourceInstance = null;
            LOG.info("HikariCP DataSource closed.");
        }
    }
}
