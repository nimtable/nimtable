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

import io.nimtable.Config;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.configuration.FluentConfiguration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Manages database migrations using Flyway. */
public class FlywayMigrator {
    private static final Logger LOG = LoggerFactory.getLogger(FlywayMigrator.class);

    private FlywayMigrator() {
        // Utility class, prevent instantiation
    }

    /**
     * Run database migrations based on the database URL.
     *
     * @param dataSource The datasource to run migrations on
     * @param dbConfig The database configuration
     */
    public static void migrateDatabase(DataSource dataSource, Config.Database dbConfig) {
        LOG.info("Running Flyway migrations for database: {}", dbConfig.url());

        String dbType = detectDatabaseType(dbConfig.url());
        FluentConfiguration flywayConfig =
                Flyway.configure().dataSource(dataSource).validateOnMigrate(true);

        // Configure migrations location based on database type
        if ("postgresql".equals(dbType)) {
            flywayConfig.locations("db/migration/postgresql");
        } else {
            throw new RuntimeException("Unsupported database type: " + dbType);
        }

        try {
            Flyway flyway = flywayConfig.load();
            flyway.migrate();
            LOG.info("Flyway migration completed successfully");
        } catch (Exception e) {
            LOG.error("Flyway migration failed: {}", e.getMessage(), e);
            throw new RuntimeException("Database migration failed", e);
        }
    }

    /**
     * Detects the database type from the JDBC URL.
     *
     * @param jdbcUrl The JDBC URL
     * @return The database type (postgresql, etc.)
     */
    private static String detectDatabaseType(String jdbcUrl) {
        if (jdbcUrl.startsWith("jdbc:postgresql:") || jdbcUrl.contains("postgresql")) {
            return "postgresql";
        } else {
            // Unknown database type, log warning and return empty string
            LOG.warn("Unable to detect database type from URL: {}", jdbcUrl);
            return "";
        }
    }
}
