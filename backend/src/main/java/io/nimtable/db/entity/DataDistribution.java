package io.nimtable.db.entity;

import io.ebean.Model;
import io.ebean.annotation.DbJson;
import io.ebean.annotation.WhenCreated;
import io.ebean.annotation.WhenModified;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Map;

@Entity
@Table(name = "data_distributions")
public class DataDistribution extends Model {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String snapshotId;

    @Column(nullable = false)
    private String catalogName;

    @Column(nullable = false)
    private String namespace;

    @Column(nullable = false)
    private String tableName;

    private int dataFileCount;
    private int positionDeleteFileCount;
    private int eqDeleteFileCount;
    private long dataFileSizeInBytes;
    private long positionDeleteFileSizeInBytes;
    private long eqDeleteFileSizeInBytes;
    private long dataFileRecordCount;
    private long positionDeleteFileRecordCount;
    private long eqDeleteFileRecordCount;

    @DbJson
    private Map<String, Integer> ranges;

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

    public String getSnapshotId() {
        return snapshotId;
    }

    public void setSnapshotId(String snapshotId) {
        this.snapshotId = snapshotId;
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

    public int getDataFileCount() {
        return dataFileCount;
    }

    public void setDataFileCount(int dataFileCount) {
        this.dataFileCount = dataFileCount;
    }

    public int getPositionDeleteFileCount() {
        return positionDeleteFileCount;
    }

    public void setPositionDeleteFileCount(int positionDeleteFileCount) {
        this.positionDeleteFileCount = positionDeleteFileCount;
    }

    public int getEqDeleteFileCount() {
        return eqDeleteFileCount;
    }

    public void setEqDeleteFileCount(int eqDeleteFileCount) {
        this.eqDeleteFileCount = eqDeleteFileCount;
    }

    public long getDataFileSizeInBytes() {
        return dataFileSizeInBytes;
    }

    public void setDataFileSizeInBytes(long dataFileSizeInBytes) {
        this.dataFileSizeInBytes = dataFileSizeInBytes;
    }

    public long getPositionDeleteFileSizeInBytes() {
        return positionDeleteFileSizeInBytes;
    }

    public void setPositionDeleteFileSizeInBytes(long positionDeleteFileSizeInBytes) {
        this.positionDeleteFileSizeInBytes = positionDeleteFileSizeInBytes;
    }

    public long getEqDeleteFileSizeInBytes() {
        return eqDeleteFileSizeInBytes;
    }

    public void setEqDeleteFileSizeInBytes(long eqDeleteFileSizeInBytes) {
        this.eqDeleteFileSizeInBytes = eqDeleteFileSizeInBytes;
    }

    public long getDataFileRecordCount() {
        return dataFileRecordCount;
    }

    public void setDataFileRecordCount(long dataFileRecordCount) {
        this.dataFileRecordCount = dataFileRecordCount;
    }

    public long getPositionDeleteFileRecordCount() {
        return positionDeleteFileRecordCount;
    }

    public void setPositionDeleteFileRecordCount(long positionDeleteFileRecordCount) {
        this.positionDeleteFileRecordCount = positionDeleteFileRecordCount;
    }

    public long getEqDeleteFileRecordCount() {
        return eqDeleteFileRecordCount;
    }

    public void setEqDeleteFileRecordCount(long eqDeleteFileRecordCount) {
        this.eqDeleteFileRecordCount = eqDeleteFileRecordCount;
    }

    public Map<String, Integer> getRanges() {
        return ranges;
    }

    public void setRanges(Map<String, Integer> ranges) {
        this.ranges = ranges;
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