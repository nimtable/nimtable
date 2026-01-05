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
import io.nimtable.db.entity.ScheduledTask;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ScheduledTaskRepository {

    private static final Logger LOG = LoggerFactory.getLogger(ScheduledTaskRepository.class);

    public List<ScheduledTask> findAll() {
        return DB.find(ScheduledTask.class).orderBy().asc("taskName").findList();
    }

    public List<ScheduledTask> findEnabledTasks() {
        return DB.find(ScheduledTask.class).where().eq("isEnabled", true).findList();
    }

    public List<ScheduledTask> findTasksToRun() {
        return DB.find(ScheduledTask.class)
                .where()
                .eq("isEnabled", true)
                .le("nextRunAt", Instant.now())
                .isNotNull("nextRunAt")
                .findList();
    }

    public ScheduledTask findById(Long id) {
        return DB.find(ScheduledTask.class).where().eq("id", id).findOne();
    }

    public ScheduledTask findByTaskName(String taskName) {
        return DB.find(ScheduledTask.class).where().eq("taskName", taskName).findOne();
    }

    public List<ScheduledTask> findByTable(String catalogName, String namespace, String tableName) {
        return DB.find(ScheduledTask.class)
                .where()
                .eq("catalogName", catalogName)
                .eq("namespace", namespace)
                .eq("tableName", tableName)
                .findList();
    }

    public ScheduledTask save(ScheduledTask task) {
        DB.save(task);
        LOG.info("Saved scheduled task: {}", task.getTaskName());
        return task;
    }

    public void delete(ScheduledTask task) {
        DB.delete(task);
        LOG.info("Deleted scheduled task: {}", task.getTaskName());
    }

    public void deleteById(Long id) {
        DB.find(ScheduledTask.class).where().eq("id", id).delete();
        LOG.info("Deleted scheduled task with id: {}", id);
    }

    public void updateTaskExecution(Long id, String status, String message, Instant nextRunAt) {
        ScheduledTask task = findById(id);
        if (task != null) {
            task.setLastRunAt(Instant.now());
            task.setLastRunStatus(status);
            task.setLastRunMessage(message);
            task.setNextRunAt(nextRunAt);
            DB.update(task);
            LOG.info("Updated task execution for task: {}", task.getTaskName());
        }
    }

    public void enableTask(Long id) {
        ScheduledTask task = findById(id);
        if (task != null) {
            task.setEnabled(true);
            DB.update(task);
            LOG.info("Enabled task: {}", task.getTaskName());
        }
    }

    public void disableTask(Long id) {
        ScheduledTask task = findById(id);
        if (task != null) {
            task.setEnabled(false);
            DB.update(task);
            LOG.info("Disabled task: {}", task.getTaskName());
        }
    }
}
