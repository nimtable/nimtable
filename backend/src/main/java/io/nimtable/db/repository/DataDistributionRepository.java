package io.nimtable.db.repository;

import io.ebean.DB;
import io.nimtable.db.entity.DataDistribution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DataDistributionRepository {
    private static final Logger LOG = LoggerFactory.getLogger(DataDistributionRepository.class);

    public DataDistribution findBySnapshotId(
            String snapshotId, String catalogName, String namespace, String tableName) {
        return DB.find(DataDistribution.class)
                .where()
                .eq("snapshotId", snapshotId)
                .eq("catalogName", catalogName)
                .eq("namespace", namespace)
                .eq("tableName", tableName)
                .findOne();
    }

    public DataDistribution save(DataDistribution distribution) {
        DB.save(distribution);
        return distribution;
    }

    public void delete(DataDistribution distribution) {
        DB.delete(distribution);
    }

    public void deleteBySnapshotId(
            String snapshotId, String catalogName, String namespace, String tableName) {
        DB.find(DataDistribution.class)
                .where()
                .eq("snapshotId", snapshotId)
                .eq("catalogName", catalogName)
                .eq("namespace", namespace)
                .eq("tableName", tableName)
                .delete();
    }
}
