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

package io.nimtable.schedule;

import io.nimtable.Config;
import io.nimtable.db.entity.ScheduledTask;
import io.nimtable.db.repository.CatalogRepository;
import io.nimtable.db.repository.ScheduledTaskRepository;
import io.nimtable.spark.LocalSpark;
import io.nimtable.util.CronUtil;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import org.apache.hadoop.conf.Configuration;
import org.apache.iceberg.CatalogUtil;
import org.apache.iceberg.Table;
import org.apache.iceberg.catalog.TableIdentifier;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Manages scheduled tasks for Iceberg table optimization. */
public class ScheduleManager {

    private static final Logger LOG = LoggerFactory.getLogger(ScheduleManager.class);

    private static ScheduleManager instance;
    private final Config config;
    private final ScheduledTaskRepository scheduledTaskRepository;
    private final CatalogRepository catalogRepository;
    private final ScheduledExecutorService executorService;
    private boolean isRunning = false;

    private ScheduleManager(Config config) {
        this.config = config;
        this.scheduledTaskRepository = new ScheduledTaskRepository();
        this.catalogRepository = new CatalogRepository();
        this.executorService = Executors.newScheduledThreadPool(4);
    }

    public static synchronized ScheduleManager getInstance(Config config) {
        if (instance == null) {
            instance = new ScheduleManager(config);
        }
        return instance;
    }

    /** Start the schedule manager. */
    public void start() {
        if (isRunning) {
            LOG.warn("ScheduleManager is already running");
            return;
        }

        LOG.info("Starting ScheduleManager");
        isRunning = true;

        // Initialize next run times for all enabled tasks
        initializeNextRunTimes();

        // Schedule the main task checker to run every minute
        executorService.scheduleWithFixedDelay(this::checkAndExecuteTasks, 0, 1, TimeUnit.MINUTES);

        LOG.info("ScheduleManager started successfully");
    }

    /** Stop the schedule manager. */
    public void stop() {
        if (!isRunning) {
            LOG.warn("ScheduleManager is not running");
            return;
        }

        LOG.info("Stopping ScheduleManager");
        isRunning = false;

        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(30, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }

        LOG.info("ScheduleManager stopped");
    }

    /** Initialize next run times for all enabled tasks. */
    private void initializeNextRunTimes() {
        LOG.info("Initializing next run times for scheduled tasks");

        List<ScheduledTask> enabledTasks = scheduledTaskRepository.findEnabledTasks();
        LocalDateTime now = LocalDateTime.now();

        for (ScheduledTask task : enabledTasks) {
            try {
                LocalDateTime nextRun =
                        CronUtil.getNextExecutionTime(task.getCronExpression(), now);
                task.setNextRunAt(nextRun.atZone(ZoneId.systemDefault()).toInstant());
                scheduledTaskRepository.save(task);

                LOG.info(
                        "Initialized next run time for task '{}': {}", task.getTaskName(), nextRun);
            } catch (Exception e) {
                LOG.error(
                        "Failed to initialize next run time for task '{}': {}",
                        task.getTaskName(),
                        e.getMessage(),
                        e);
            }
        }
    }

    /** Check for tasks that need to be executed and execute them. */
    private void checkAndExecuteTasks() {
        try {
            List<ScheduledTask> tasksToRun = scheduledTaskRepository.findTasksToRun();

            if (tasksToRun.isEmpty()) {
                LOG.debug("No tasks to run at this time");
                return;
            }

            LOG.info("Found {} tasks to execute", tasksToRun.size());

            for (ScheduledTask task : tasksToRun) {
                executorService.submit(() -> executeTask(task));
            }

        } catch (Exception e) {
            LOG.error("Error checking for tasks to run", e);
        }
    }

    /** Execute a scheduled task. */
    private void executeTask(ScheduledTask task) {
        LOG.info("Executing task: {}", task.getTaskName());

        String status = "SUCCESS";
        String message = "Task completed successfully";

        try {
            switch (task.getTaskType()) {
                case "COMPACTION":
                    executeCompactionTask(task);
                    break;
                default:
                    throw new IllegalArgumentException("Unknown task type: " + task.getTaskType());
            }
        } catch (Exception e) {
            status = "FAILED";
            message = "Task failed: " + e.getMessage();
            LOG.error("Task execution failed: {}", task.getTaskName(), e);
        }

        // Calculate next run time
        LocalDateTime nextRun = null;
        try {
            nextRun = CronUtil.getNextExecutionTime(task.getCronExpression(), LocalDateTime.now());
        } catch (Exception e) {
            LOG.error("Failed to calculate next run time for task: {}", task.getTaskName(), e);
        }

        // Update task execution record
        scheduledTaskRepository.updateTaskExecution(
                task.getId(),
                status,
                message,
                nextRun != null ? nextRun.atZone(ZoneId.systemDefault()).toInstant() : null);

        LOG.info("Task '{}' execution completed with status: {}", task.getTaskName(), status);
    }

    /** Execute a compaction task. */
    private void executeCompactionTask(ScheduledTask task) throws Exception {
        LOG.info(
                "Executing compaction task for {}.{}.{}",
                task.getCatalogName(),
                task.getNamespace(),
                task.getTableName());

        SparkSession spark = LocalSpark.getInstance(config).getSpark();

        // Get catalog properties
        Map<String, String> properties = getCatalogProperties(task.getCatalogName());

        // Load table to verify it exists
        Table table =
                CatalogUtil.buildIcebergCatalog(
                                task.getCatalogName(), properties, new Configuration())
                        .loadTable(TableIdentifier.of(task.getNamespace(), task.getTableName()));

        // Execute compaction if enabled
        if (task.isCompaction()) {
            executeCompaction(spark, task);
        }

        // Execute snapshot retention if enabled
        if (task.isSnapshotRetention()) {
            executeSnapshotRetention(spark, task);
        }

        // Execute orphan file cleanup if enabled
        if (task.isOrphanFileDeletion()) {
            executeOrphanFileCleanup(spark, task);
        }

        LOG.info(
                "Compaction task completed for {}.{}.{}",
                task.getCatalogName(),
                task.getNamespace(),
                task.getTableName());
    }

    private void executeCompaction(SparkSession spark, ScheduledTask task) throws Exception {
        StringBuilder sqlBuilder = new StringBuilder();
        sqlBuilder.append(
                String.format(
                        "CALL `%s`.system.rewrite_data_files(table => '%s.%s'",
                        task.getCatalogName(), task.getNamespace(), task.getTableName()));

        if (task.getStrategy() != null && !task.getStrategy().isEmpty()) {
            sqlBuilder.append(String.format(", strategy => '%s'", task.getStrategy()));
        }

        if (task.getSortOrder() != null && !task.getSortOrder().isEmpty()) {
            sqlBuilder.append(String.format(", sort_order => '%s'", task.getSortOrder()));
        }

        if (task.getWhereClause() != null && !task.getWhereClause().isEmpty()) {
            sqlBuilder.append(String.format(", where => '%s'", task.getWhereClause()));
        }

        sqlBuilder.append(
                String.format(
                        ", options => map('rewrite-all', 'true', 'target-file-size-bytes', '%d'))",
                        task.getTargetFileSizeBytes()));

        String sql = sqlBuilder.toString();
        LOG.info("Executing compaction SQL: {}", sql);

        Row result = spark.sql(sql).collectAsList().get(0);
        LOG.info(
                "Compaction result - rewritten files: {}, added files: {}, bytes: {}",
                result.getAs("rewritten_data_files_count"),
                result.getAs("added_data_files_count"),
                result.getAs("rewritten_bytes_count"));
    }

    private void executeSnapshotRetention(SparkSession spark, ScheduledTask task) throws Exception {
        String timestampStr =
                Instant.ofEpochMilli(System.currentTimeMillis() - task.getRetentionPeriod())
                        .toString();

        String sql =
                String.format(
                        "CALL `%s`.system.expire_snapshots(table => '%s.%s', older_than => TIMESTAMP '%s', retain_last => %d)",
                        task.getCatalogName(),
                        task.getNamespace(),
                        task.getTableName(),
                        timestampStr,
                        task.getMinSnapshotsToKeep());

        LOG.info("Executing snapshot retention SQL: {}", sql);

        Row result = spark.sql(sql).collectAsList().get(0);
        LOG.info(
                "Snapshot retention result - deleted files: {}, manifest files: {}",
                result.getAs("deleted_data_files_count"),
                result.getAs("deleted_manifest_files_count"));
    }

    private void executeOrphanFileCleanup(SparkSession spark, ScheduledTask task) throws Exception {
        String timestampStr =
                Instant.ofEpochMilli(System.currentTimeMillis() - task.getOrphanFileRetention())
                        .toString();

        String sql =
                String.format(
                        "CALL `%s`.system.remove_orphan_files(table => '%s.%s', older_than => TIMESTAMP '%s')",
                        task.getCatalogName(),
                        task.getNamespace(),
                        task.getTableName(),
                        timestampStr);

        LOG.info("Executing orphan file cleanup SQL: {}", sql);

        List<Row> result = spark.sql(sql).collectAsList();
        LOG.info("Orphan file cleanup result - removed {} files", result.size());
    }

    private Map<String, String> getCatalogProperties(String catalogName) throws Exception {
        // First check config
        Config.Catalog catalogConfig = config.getCatalog(catalogName);
        if (catalogConfig != null) {
            return catalogConfig.properties();
        }

        // Check database
        io.nimtable.db.entity.Catalog dbCatalog = catalogRepository.findByName(catalogName);
        if (dbCatalog == null) {
            throw new IllegalArgumentException("Catalog not found: " + catalogName);
        }

        Map<String, String> properties = new HashMap<>(dbCatalog.getProperties());
        properties.put("type", dbCatalog.getType());
        properties.put("warehouse", dbCatalog.getWarehouse());
        properties.put("uri", dbCatalog.getUri());

        return properties;
    }

    /** Get the current status of the schedule manager. */
    public Map<String, Object> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("isRunning", isRunning);
        status.put("enabledTasks", scheduledTaskRepository.findEnabledTasks().size());
        status.put("totalTasks", scheduledTaskRepository.findAll().size());

        List<ScheduledTask> tasksToRun = scheduledTaskRepository.findTasksToRun();
        status.put("pendingTasks", tasksToRun.size());

        return status;
    }

    /** Manually trigger a task execution. */
    public void triggerTask(Long taskId) {
        ScheduledTask task = scheduledTaskRepository.findById(taskId);
        if (task == null) {
            throw new IllegalArgumentException("Task not found: " + taskId);
        }

        if (!task.isEnabled()) {
            throw new IllegalArgumentException("Task is disabled: " + task.getTaskName());
        }

        LOG.info("Manually triggering task: {}", task.getTaskName());
        executorService.submit(() -> executeTask(task));
    }
}
