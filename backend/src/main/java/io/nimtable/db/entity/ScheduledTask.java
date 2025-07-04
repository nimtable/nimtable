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

package io.nimtable.db.entity;

import io.ebean.Model;
import io.ebean.annotation.WhenCreated;
import io.ebean.annotation.WhenModified;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "scheduled_tasks")
public class ScheduledTask extends Model {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String taskName;

    @Column(nullable = false)
    private String catalogName;

    @Column(nullable = false)
    private String namespace;

    @Column(nullable = false)
    private String tableName;

    @Column(nullable = false)
    private String cronExpression;

    @Column(nullable = false)
    private String taskType = "COMPACTION";

    @Column(nullable = false)
    private boolean isEnabled = true;

    // Compaction parameters
    @Column(nullable = false)
    private boolean snapshotRetention = false;

    @Column(nullable = false)
    private long retentionPeriod = 432000000L; // 5 days in ms

    @Column(nullable = false)
    private int minSnapshotsToKeep = 1;

    @Column(nullable = false)
    private boolean orphanFileDeletion = false;

    @Column(nullable = false)
    private long orphanFileRetention = 86400000L; // 1 day in ms

    @Column(nullable = false)
    private boolean compaction = true;

    @Column(nullable = false)
    private long targetFileSizeBytes = 536870912L; // 512MB

    private String strategy;

    private String sortOrder;

    private String whereClause;

    // Task metadata
    private Instant lastRunAt;

    private String lastRunStatus;

    private String lastRunMessage;

    private Instant nextRunAt;

    private String createdBy;

    @WhenCreated
    private Instant createdAt;

    @WhenModified
    private Instant updatedAt;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTaskName() {
        return taskName;
    }

    public void setTaskName(String taskName) {
        this.taskName = taskName;
    }

    public String getCatalogName() {
        return catalogName;
    }

    public void setCatalogName(String catalogName) {
        this.catalogName = catalogName;
    }

    public String getNamespace() {
        return namespace;
    }

    public void setNamespace(String namespace) {
        this.namespace = namespace;
    }

    public String getTableName() {
        return tableName;
    }

    public void setTableName(String tableName) {
        this.tableName = tableName;
    }

    public String getCronExpression() {
        return cronExpression;
    }

    public void setCronExpression(String cronExpression) {
        this.cronExpression = cronExpression;
    }

    public String getTaskType() {
        return taskType;
    }

    public void setTaskType(String taskType) {
        this.taskType = taskType;
    }

    public boolean isEnabled() {
        return isEnabled;
    }

    public void setEnabled(boolean enabled) {
        isEnabled = enabled;
    }

    public boolean isSnapshotRetention() {
        return snapshotRetention;
    }

    public void setSnapshotRetention(boolean snapshotRetention) {
        this.snapshotRetention = snapshotRetention;
    }

    public long getRetentionPeriod() {
        return retentionPeriod;
    }

    public void setRetentionPeriod(long retentionPeriod) {
        this.retentionPeriod = retentionPeriod;
    }

    public int getMinSnapshotsToKeep() {
        return minSnapshotsToKeep;
    }

    public void setMinSnapshotsToKeep(int minSnapshotsToKeep) {
        this.minSnapshotsToKeep = minSnapshotsToKeep;
    }

    public boolean isOrphanFileDeletion() {
        return orphanFileDeletion;
    }

    public void setOrphanFileDeletion(boolean orphanFileDeletion) {
        this.orphanFileDeletion = orphanFileDeletion;
    }

    public long getOrphanFileRetention() {
        return orphanFileRetention;
    }

    public void setOrphanFileRetention(long orphanFileRetention) {
        this.orphanFileRetention = orphanFileRetention;
    }

    public boolean isCompaction() {
        return compaction;
    }

    public void setCompaction(boolean compaction) {
        this.compaction = compaction;
    }

    public long getTargetFileSizeBytes() {
        return targetFileSizeBytes;
    }

    public void setTargetFileSizeBytes(long targetFileSizeBytes) {
        this.targetFileSizeBytes = targetFileSizeBytes;
    }

    public String getStrategy() {
        return strategy;
    }

    public void setStrategy(String strategy) {
        this.strategy = strategy;
    }

    public String getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(String sortOrder) {
        this.sortOrder = sortOrder;
    }

    public String getWhereClause() {
        return whereClause;
    }

    public void setWhereClause(String whereClause) {
        this.whereClause = whereClause;
    }

    public Instant getLastRunAt() {
        return lastRunAt;
    }

    public void setLastRunAt(Instant lastRunAt) {
        this.lastRunAt = lastRunAt;
    }

    public String getLastRunStatus() {
        return lastRunStatus;
    }

    public void setLastRunStatus(String lastRunStatus) {
        this.lastRunStatus = lastRunStatus;
    }

    public String getLastRunMessage() {
        return lastRunMessage;
    }

    public void setLastRunMessage(String lastRunMessage) {
        this.lastRunMessage = lastRunMessage;
    }

    public Instant getNextRunAt() {
        return nextRunAt;
    }

    public void setNextRunAt(Instant nextRunAt) {
        this.nextRunAt = nextRunAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
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