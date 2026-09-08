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

package io.nimtable.deployment;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Holds the PostgreSQL advisory lock that enforces Nimtable's single-backend model. */
public final class BackendInstanceLock implements AutoCloseable {
    public static final String DEPLOYMENT_MODE = "single-replica";

    // The ASCII bytes for "NIMTABLE", interpreted as a positive signed bigint.
    private static final long LOCK_ID = 0x4e494d5441424c45L;
    private static final Logger LOG = LoggerFactory.getLogger(BackendInstanceLock.class);

    private final Connection connection;
    private boolean acquired;

    private BackendInstanceLock(Connection connection) {
        this.connection = connection;
        this.acquired = true;
    }

    /**
     * Acquires a session-level lock on a dedicated database connection.
     *
     * <p>The connection remains open for the backend lifetime. PostgreSQL automatically releases
     * the lock if the process or connection terminates unexpectedly.
     */
    public static BackendInstanceLock acquire(DataSource dataSource) throws SQLException {
        Connection connection = dataSource.getConnection();
        boolean acquired = false;
        try {
            acquired = tryAcquire(connection);
            if (!acquired) {
                throw new IllegalStateException(
                        "Another Nimtable backend is already active for this database. "
                                + "Nimtable supports exactly one backend replica.");
            }

            LOG.info("Acquired {} backend deployment lock", DEPLOYMENT_MODE);
            return new BackendInstanceLock(connection);
        } finally {
            if (!acquired) {
                connection.close();
            }
        }
    }

    private static boolean tryAcquire(Connection connection) throws SQLException {
        try (PreparedStatement statement =
                connection.prepareStatement("SELECT pg_try_advisory_lock(?)")) {
            statement.setLong(1, LOCK_ID);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    throw new SQLException("PostgreSQL did not return an advisory lock result");
                }
                return resultSet.getBoolean(1);
            }
        }
    }

    /** Returns whether the lock-owning database session is still usable. */
    public synchronized boolean isHeld() {
        if (!acquired) {
            return false;
        }

        try {
            return !connection.isClosed() && connection.isValid(1);
        } catch (SQLException e) {
            LOG.error("Failed to validate the backend deployment lock", e);
            return false;
        }
    }

    @Override
    public synchronized void close() {
        if (!acquired) {
            return;
        }

        try (PreparedStatement statement =
                connection.prepareStatement("SELECT pg_advisory_unlock(?)")) {
            statement.setLong(1, LOCK_ID);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next() || !resultSet.getBoolean(1)) {
                    LOG.warn("PostgreSQL reported that the backend deployment lock was not held");
                }
            }
        } catch (SQLException e) {
            LOG.warn("Failed to explicitly release the backend deployment lock", e);
        } finally {
            acquired = false;
            try {
                connection.close();
            } catch (SQLException e) {
                LOG.warn("Failed to close the backend deployment lock connection", e);
            }
        }
    }
}
