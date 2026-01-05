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
