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

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;

class BackendInstanceLockTest {
    @Test
    void acquiresAndReleasesPostgresAdvisoryLock() throws Exception {
        DataSource dataSource = mock(DataSource.class);
        Connection connection = mock(Connection.class);
        PreparedStatement acquireStatement = mock(PreparedStatement.class);
        PreparedStatement releaseStatement = mock(PreparedStatement.class);
        ResultSet acquireResult = mock(ResultSet.class);
        ResultSet releaseResult = mock(ResultSet.class);

        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement("SELECT pg_try_advisory_lock(?)"))
                .thenReturn(acquireStatement);
        when(acquireStatement.executeQuery()).thenReturn(acquireResult);
        when(acquireResult.next()).thenReturn(true);
        when(acquireResult.getBoolean(1)).thenReturn(true);
        when(connection.isClosed()).thenReturn(false);
        when(connection.isValid(1)).thenReturn(true);
        when(connection.prepareStatement("SELECT pg_advisory_unlock(?)"))
                .thenReturn(releaseStatement);
        when(releaseStatement.executeQuery()).thenReturn(releaseResult);
        when(releaseResult.next()).thenReturn(true);
        when(releaseResult.getBoolean(1)).thenReturn(true);

        BackendInstanceLock instanceLock = BackendInstanceLock.acquire(dataSource);
        assertTrue(instanceLock.isHeld());

        instanceLock.close();

        assertFalse(instanceLock.isHeld());
        verify(acquireStatement).setLong(1, 0x4e494d5441424c45L);
        verify(releaseStatement).setLong(1, 0x4e494d5441424c45L);
        verify(connection).close();
    }

    @Test
    void rejectsASecondBackendAndClosesItsConnection() throws Exception {
        DataSource dataSource = mock(DataSource.class);
        Connection connection = mock(Connection.class);
        PreparedStatement acquireStatement = mock(PreparedStatement.class);
        ResultSet acquireResult = mock(ResultSet.class);

        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement("SELECT pg_try_advisory_lock(?)"))
                .thenReturn(acquireStatement);
        when(acquireStatement.executeQuery()).thenReturn(acquireResult);
        when(acquireResult.next()).thenReturn(true);
        when(acquireResult.getBoolean(1)).thenReturn(false);

        IllegalStateException error =
                assertThrows(
                        IllegalStateException.class, () -> BackendInstanceLock.acquire(dataSource));

        assertTrue(error.getMessage().contains("exactly one backend replica"));
        verify(connection).close();
    }
}
