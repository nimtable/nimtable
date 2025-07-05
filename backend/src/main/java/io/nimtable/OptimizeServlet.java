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

package io.nimtable;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.nimtable.db.entity.ScheduledTask;
import io.nimtable.db.repository.CatalogRepository;
import io.nimtable.db.repository.ScheduledTaskRepository;
import io.nimtable.spark.LocalSpark;
import io.nimtable.util.CronUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.apache.hadoop.conf.Configuration;
import org.apache.iceberg.*;
import org.apache.iceberg.catalog.TableIdentifier;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// NOTE(eric): This implementation is not well tested yet.
// Please refer to https://iceberg.apache.org/docs/latest/spark-procedures/ for future work.
public class OptimizeServlet extends HttpServlet {
    private static final Logger logger = LoggerFactory.getLogger(OptimizeServlet.class);
    private final Config config;
    private final ObjectMapper objectMapper;
    private final CatalogRepository catalogRepository;
    private final ScheduledTaskRepository scheduledTaskRepository;

    record CompactionResult(
            int rewrittenDataFilesCount,
            int addedDataFilesCount,
            long rewrittenBytesCount,
            int failedDataFilesCount) {}

    record ExpireSnapshotResult(
            long deletedDataFilesCount,
            long deletedPositionDeleteFilesCount,
            long deletedEqualityDeleteFilesCount,
            long deletedManifestFilesCount,
            long deletedManifestListsCount,
            long deletedStatisticsFilesCount) {}

    record CleanOrphanFilesResult(List<String> orphanFileLocations) {}

    private static final long DEFAULT_TARGET_FILE_SIZE_BYTES = 536870912L; // 512MB

    public OptimizeServlet(Config config) {
        this.config = config;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.findAndRegisterModules();
        this.catalogRepository = new CatalogRepository();
        this.scheduledTaskRepository = new ScheduledTaskRepository();
    }

    private CompactionResult compactTable(
            SparkSession spark,
            String catalogName,
            String namespace,
            String tableName,
            long targetFileSizeBytes,
            String strategy,
            String sortOrder,
            String whereClause)
            throws Exception {

        StringBuilder sqlBuilder = new StringBuilder();
        sqlBuilder.append(
                String.format(
                        "CALL `%s`.system.rewrite_data_files(table => '%s.%s'",
                        catalogName, namespace, tableName));

        if (strategy != null && !strategy.isEmpty()) {
            sqlBuilder.append(String.format(", strategy => '%s'", strategy));
        }

        if (sortOrder != null && !sortOrder.isEmpty()) {
            sqlBuilder.append(String.format(", sort_order => '%s'", sortOrder));
        }

        if (whereClause != null && !whereClause.isEmpty()) {
            sqlBuilder.append(String.format(", where => '%s'", whereClause));
        }

        // Add options
        sqlBuilder.append(
                String.format(
                        ", options => map('rewrite-all', 'true', 'target-file-size-bytes', '%d'))",
                        targetFileSizeBytes));

        String sql = sqlBuilder.toString();
        logger.info("Executing compaction SQL: {}", sql);
        try {
            Row result = spark.sql(sql).collectAsList().get(0);
            return new CompactionResult(
                    result.getAs("rewritten_data_files_count"),
                    result.getAs("added_data_files_count"),
                    result.getAs("rewritten_bytes_count"),
                    result.getAs("failed_data_files_count"));
        } catch (Exception e) {
            logger.error("Failed to execute compaction SQL: {}", sql, e);
            throw new Exception("Failed to execute compaction: " + e.getMessage(), e);
        }
    }

    private ExpireSnapshotResult expireSnapshots(
            SparkSession spark,
            String catalogName,
            String namespace,
            String tableName,
            long maxSnapshotAgeMs,
            int minSnapshotsToKeep) {
        String timestampStr =
                Instant.ofEpochMilli(System.currentTimeMillis() - maxSnapshotAgeMs).toString();
        String sql =
                String.format(
                        "CALL `%s`.system.expire_snapshots(table => '%s.%s', older_than => TIMESTAMP '%s', retain_last => %d)",
                        catalogName, namespace, tableName, timestampStr, minSnapshotsToKeep);
        logger.info("Executing expire snapshots SQL: {}", sql);
        Row result = spark.sql(sql).collectAsList().get(0);

        return new ExpireSnapshotResult(
                result.getAs("deleted_data_files_count"),
                result.getAs("deleted_position_delete_files_count"),
                result.getAs("deleted_equality_delete_files_count"),
                result.getAs("deleted_manifest_files_count"),
                result.getAs("deleted_manifest_lists_count"),
                result.getAs("deleted_statistics_files_count"));
    }

    private CleanOrphanFilesResult cleanOrphanFiles(
            SparkSession spark,
            String catalogName,
            String namespace,
            String tableName,
            long olderThanMs) {
        String timestampStr =
                Instant.ofEpochMilli(System.currentTimeMillis() - olderThanMs).toString();
        String sql =
                String.format(
                        "CALL `%s`.system.remove_orphan_files(table => '%s.%s', older_than => TIMESTAMP '%s')",
                        catalogName, namespace, tableName, timestampStr);
        logger.info("Executing remove orphan files SQL: {}", sql);
        List<Row> result = spark.sql(sql).collectAsList();
        return new CleanOrphanFilesResult(
                result.stream().map(row -> row.getString(0)).collect(Collectors.toList()));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        // Parse path parameters
        String path = request.getRequestURI();
        String[] parts = path.split("/");
        if (parts.length < 7) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Invalid path format");
            objectMapper.writeValue(response.getOutputStream(), errorResponse);
            return;
        }

        // Format: /optimize/{catalog-name}/{namespace}/{table-name}/{operation}
        String catalogName = parts[3];
        String namespace = parts[4];
        String tableName = parts[5];
        String operation = parts[6];

        // Get catalog
        Config.Catalog catalog = config.getCatalog(catalogName);
        Map<String, String> properties;

        if (catalog != null) {
            properties = catalog.properties();
        } else {
            // Check database
            io.nimtable.db.entity.Catalog dbCatalog = catalogRepository.findByName(catalogName);
            if (dbCatalog == null) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Catalog not found: " + catalogName);
                objectMapper.writeValue(response.getOutputStream(), errorResponse);
                return;
            }
            properties = new HashMap<>(dbCatalog.getProperties());
            properties.put("type", dbCatalog.getType());
            properties.put("warehouse", dbCatalog.getWarehouse());
            properties.put("uri", dbCatalog.getUri());
        }

        // Load table
        Table table;
        try {
            table =
                    CatalogUtil.buildIcebergCatalog(catalogName, properties, new Configuration())
                            .loadTable(TableIdentifier.of(namespace, tableName));
        } catch (Exception e) {
            logger.error("Failed to load table: {}.{}", namespace, tableName, e);
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Table not found: " + namespace + "." + tableName);
            objectMapper.writeValue(response.getOutputStream(), errorResponse);
            return;
        }

        Map<String, Object> requestBody =
                objectMapper.readValue(
                        request.getReader(), new TypeReference<Map<String, Object>>() {});

        // Extract request parameters with defaults
        boolean snapshotRetention =
                Boolean.parseBoolean(
                        requestBody.getOrDefault("snapshotRetention", false).toString());
        long retentionPeriod =
                Long.parseLong(requestBody.getOrDefault("retentionPeriod", "432000000").toString());
        int minSnapshotsToKeep =
                Integer.parseInt(requestBody.getOrDefault("minSnapshotsToKeep", "1").toString());
        boolean orphanFileDeletion =
                Boolean.parseBoolean(
                        requestBody.getOrDefault("orphanFileDeletion", false).toString());
        long orphanFileRetention =
                Long.parseLong(
                        requestBody.getOrDefault("orphanFileRetention", "86400000").toString());
        boolean compaction =
                Boolean.parseBoolean(requestBody.getOrDefault("compaction", false).toString());
        long targetFileSizeBytes =
                requestBody.get("targetFileSizeBytes") != null
                        ? ((Number) requestBody.get("targetFileSizeBytes")).longValue()
                        : DEFAULT_TARGET_FILE_SIZE_BYTES;
        String strategy =
                requestBody.get("strategy") != null ? requestBody.get("strategy").toString() : null;
        String sortOrder =
                requestBody.get("sortOrder") != null
                        ? requestBody.get("sortOrder").toString()
                        : null;
        String whereClause =
                requestBody.get("whereClause") != null
                        ? requestBody.get("whereClause").toString()
                        : null;

        Map<String, Object> result = new HashMap<>();

        // Handle each operation separately
        switch (operation) {
            case "compact":
                if (compaction) {
                    SparkSession spark = LocalSpark.getInstance(config).getSpark();
                    try {
                        CompactionResult compactionResult =
                                compactTable(
                                        spark,
                                        catalogName,
                                        namespace,
                                        tableName,
                                        targetFileSizeBytes,
                                        strategy,
                                        sortOrder,
                                        whereClause);
                        result.put(
                                "rewrittenDataFilesCount",
                                compactionResult.rewrittenDataFilesCount());
                        result.put("addedDataFilesCount", compactionResult.addedDataFilesCount());
                        result.put("rewrittenBytesCount", compactionResult.rewrittenBytesCount());
                        result.put("failedDataFilesCount", compactionResult.failedDataFilesCount());
                    } catch (Exception e) {
                        logger.error(
                                "Failed to execute compaction: {}.{}", namespace, tableName, e);
                        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                        response.setContentType("application/json");
                        response.setCharacterEncoding("UTF-8");
                        Map<String, Object> errorResponse = new HashMap<>();
                        errorResponse.put("success", false);
                        errorResponse.put(
                                "message", "Failed to execute compaction: " + e.getMessage());
                        objectMapper.writeValue(response.getOutputStream(), errorResponse);
                        return;
                    }
                }
                break;

            case "expire-snapshots":
                if (snapshotRetention) {
                    SparkSession spark = LocalSpark.getInstance(config).getSpark();
                    try {
                        ExpireSnapshotResult expireResult =
                                expireSnapshots(
                                        spark,
                                        catalogName,
                                        namespace,
                                        tableName,
                                        retentionPeriod,
                                        minSnapshotsToKeep);
                        result.put("deletedDataFilesCount", expireResult.deletedDataFilesCount());
                        result.put(
                                "deletedManifestFilesCount",
                                expireResult.deletedManifestFilesCount());
                        result.put(
                                "deletedManifestListsCount",
                                expireResult.deletedManifestListsCount());
                    } catch (Exception e) {
                        logger.error("Failed to expire snapshots: {}.{}", namespace, tableName, e);
                        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                        response.setContentType("application/json");
                        response.setCharacterEncoding("UTF-8");
                        Map<String, Object> errorResponse = new HashMap<>();
                        errorResponse.put("success", false);
                        errorResponse.put(
                                "message", "Failed to expire snapshots: " + e.getMessage());
                        objectMapper.writeValue(response.getOutputStream(), errorResponse);
                        return;
                    }
                }
                break;

            case "clean-orphan-files":
                if (orphanFileDeletion) {
                    SparkSession spark = LocalSpark.getInstance(config).getSpark();
                    try {
                        CleanOrphanFilesResult cleanResult =
                                cleanOrphanFiles(
                                        spark,
                                        catalogName,
                                        namespace,
                                        tableName,
                                        orphanFileRetention);
                        result.put("orphanFileLocations", cleanResult.orphanFileLocations());
                    } catch (Exception e) {
                        logger.error(
                                "Failed to clean orphan files: {}.{}", namespace, tableName, e);
                        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                        response.setContentType("application/json");
                        response.setCharacterEncoding("UTF-8");
                        Map<String, Object> errorResponse = new HashMap<>();
                        errorResponse.put("success", false);
                        errorResponse.put(
                                "message", "Failed to clean orphan files: " + e.getMessage());
                        objectMapper.writeValue(response.getOutputStream(), errorResponse);
                        return;
                    }
                }
                break;

            case "schedule":
                // Get cron expression from request
                String cronExpression = requestBody.get("cronExpression") != null 
                    ? requestBody.get("cronExpression").toString() 
                    : null;
                String taskName = requestBody.get("taskName") != null 
                    ? requestBody.get("taskName").toString() 
                    : String.format("%s_%s_%s_compaction", catalogName, namespace, tableName);
                boolean enabled = Boolean.parseBoolean(
                    requestBody.getOrDefault("enabled", true).toString());
                String createdBy = requestBody.get("createdBy") != null 
                    ? requestBody.get("createdBy").toString() 
                    : "system";

                // Validate cron expression
                if (cronExpression == null || cronExpression.trim().isEmpty()) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("success", false);
                    errorResponse.put("message", "Cron expression is required");
                    objectMapper.writeValue(response.getOutputStream(), errorResponse);
                    return;
                }

                if (!CronUtil.isValidCronExpression(cronExpression)) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("success", false);
                    errorResponse.put("message", "Invalid cron expression: " + cronExpression);
                    objectMapper.writeValue(response.getOutputStream(), errorResponse);
                    return;
                }

                try {
                    // Check if task already exists
                    ScheduledTask existingTask = scheduledTaskRepository.findByTaskName(taskName);
                    
                    if (existingTask != null) {
                        // Update existing task
                        existingTask.setCronExpression(cronExpression);
                        existingTask.setEnabled(enabled);
                        existingTask.setSnapshotRetention(snapshotRetention);
                        existingTask.setRetentionPeriod(retentionPeriod);
                        existingTask.setMinSnapshotsToKeep(minSnapshotsToKeep);
                        existingTask.setOrphanFileDeletion(orphanFileDeletion);
                        existingTask.setOrphanFileRetention(orphanFileRetention);
                        existingTask.setCompaction(compaction);
                        existingTask.setTargetFileSizeBytes(targetFileSizeBytes);
                        existingTask.setStrategy(strategy);
                        existingTask.setSortOrder(sortOrder);
                        existingTask.setWhereClause(whereClause);
                        
                        // Calculate next run time
                        LocalDateTime nextRun = CronUtil.getNextExecutionTime(
                            cronExpression, LocalDateTime.now());
                        existingTask.setNextRunAt(nextRun.atZone(ZoneId.systemDefault()).toInstant());
                        
                        scheduledTaskRepository.save(existingTask);
                        result.put("taskId", existingTask.getId());
                        result.put("updated", true);
                    } else {
                        // Create new task
                        ScheduledTask newTask = new ScheduledTask();
                        newTask.setTaskName(taskName);
                        newTask.setCatalogName(catalogName);
                        newTask.setNamespace(namespace);
                        newTask.setTableName(tableName);
                        newTask.setCronExpression(cronExpression);
                        newTask.setEnabled(enabled);
                        newTask.setSnapshotRetention(snapshotRetention);
                        newTask.setRetentionPeriod(retentionPeriod);
                        newTask.setMinSnapshotsToKeep(minSnapshotsToKeep);
                        newTask.setOrphanFileDeletion(orphanFileDeletion);
                        newTask.setOrphanFileRetention(orphanFileRetention);
                        newTask.setCompaction(compaction);
                        newTask.setTargetFileSizeBytes(targetFileSizeBytes);
                        newTask.setStrategy(strategy);
                        newTask.setSortOrder(sortOrder);
                        newTask.setWhereClause(whereClause);
                        newTask.setCreatedBy(createdBy);
                        
                        // Calculate next run time
                        LocalDateTime nextRun = CronUtil.getNextExecutionTime(
                            cronExpression, LocalDateTime.now());
                        newTask.setNextRunAt(nextRun.atZone(ZoneId.systemDefault()).toInstant());
                        
                        scheduledTaskRepository.save(newTask);
                        result.put("taskId", newTask.getId());
                        result.put("created", true);
                    }
                    
                    result.put("taskName", taskName);
                    result.put("cronExpression", cronExpression);
                    result.put("cronDescription", CronUtil.getCronDescription(cronExpression));
                    result.put("enabled", enabled);
                    
                } catch (Exception e) {
                    logger.error(
                            "Failed to create/update scheduled task: {}.{}", namespace, tableName, e);
                    response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("success", false);
                    errorResponse.put(
                            "message", "Failed to create/update scheduled task: " + e.getMessage());
                    objectMapper.writeValue(response.getOutputStream(), errorResponse);
                    return;
                }
                break;
            default:
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Invalid operation: " + operation);
                objectMapper.writeValue(response.getOutputStream(), errorResponse);
                return;
        }

        // Return success response with operation results
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        result.put("success", true);
        result.put("message", "Operation completed successfully");
        objectMapper.writeValue(response.getOutputStream(), result);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        String pathInfo = request.getPathInfo();
        if (pathInfo == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing path info");
            return;
        }

        String[] pathParts = pathInfo.split("/");
        if (pathParts.length < 2) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid path");
            return;
        }

        String operation = pathParts[1];
        switch (operation) {
            case "system-info":
                handleGetSystemInfo(response);
                break;
            case "scheduled-tasks":
                handleGetScheduledTasks(response);
                break;
            case "scheduled-task":
                if (pathParts.length >= 3) {
                    handleGetScheduledTask(response, pathParts[2]);
                } else {
                    response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Task ID required");
                }
                break;
            default:
                response.sendError(
                        HttpServletResponse.SC_BAD_REQUEST, "Unknown operation: " + operation);
        }
    }

    private void handleGetSystemInfo(HttpServletResponse response) throws IOException {
        try {
            Runtime runtime = Runtime.getRuntime();
            Map<String, Object> systemInfo = new HashMap<>();
            systemInfo.put("cpuCount", runtime.availableProcessors());
            systemInfo.put("totalMemory", runtime.totalMemory());
            systemInfo.put("maxMemory", runtime.maxMemory());
            systemInfo.put("freeMemory", runtime.freeMemory());
            systemInfo.put("usedMemory", runtime.totalMemory() - runtime.freeMemory());

            logger.info(
                    "System info: CPU cores={}, Total memory={}, Max memory={}, Free memory={}",
                    runtime.availableProcessors(),
                    runtime.totalMemory(),
                    runtime.maxMemory(),
                    runtime.freeMemory());

            response.setContentType("application/json");
            objectMapper.writeValue(response.getOutputStream(), systemInfo);
        } catch (Exception e) {
            logger.error("Failed to get system info", e);
            response.sendError(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to get system info");
        }
    }

    private void handleGetScheduledTasks(HttpServletResponse response) throws IOException {
        try {
            List<ScheduledTask> tasks = scheduledTaskRepository.findAll();
            
            List<Map<String, Object>> tasksData = tasks.stream().map(task -> {
                Map<String, Object> taskData = new HashMap<>();
                taskData.put("id", task.getId());
                taskData.put("taskName", task.getTaskName());
                taskData.put("catalogName", task.getCatalogName());
                taskData.put("namespace", task.getNamespace());
                taskData.put("tableName", task.getTableName());
                taskData.put("cronExpression", task.getCronExpression());
                taskData.put("cronDescription", CronUtil.getCronDescription(task.getCronExpression()));
                taskData.put("taskType", task.getTaskType());
                taskData.put("enabled", task.isEnabled());
                taskData.put("lastRunAt", task.getLastRunAt());
                taskData.put("lastRunStatus", task.getLastRunStatus());
                taskData.put("lastRunMessage", task.getLastRunMessage());
                taskData.put("nextRunAt", task.getNextRunAt());
                taskData.put("createdBy", task.getCreatedBy());
                taskData.put("createdAt", task.getCreatedAt());
                taskData.put("updatedAt", task.getUpdatedAt());
                
                // Add task parameters
                Map<String, Object> parameters = new HashMap<>();
                parameters.put("snapshotRetention", task.isSnapshotRetention());
                parameters.put("retentionPeriod", task.getRetentionPeriod());
                parameters.put("minSnapshotsToKeep", task.getMinSnapshotsToKeep());
                parameters.put("orphanFileDeletion", task.isOrphanFileDeletion());
                parameters.put("orphanFileRetention", task.getOrphanFileRetention());
                parameters.put("compaction", task.isCompaction());
                parameters.put("targetFileSizeBytes", task.getTargetFileSizeBytes());
                parameters.put("strategy", task.getStrategy());
                parameters.put("sortOrder", task.getSortOrder());
                parameters.put("whereClause", task.getWhereClause());
                taskData.put("parameters", parameters);
                
                return taskData;
            }).collect(Collectors.toList());

            response.setContentType("application/json");
            objectMapper.writeValue(response.getOutputStream(), tasksData);
        } catch (Exception e) {
            logger.error("Failed to get scheduled tasks", e);
            response.sendError(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to get scheduled tasks");
        }
    }

    private void handleGetScheduledTask(HttpServletResponse response, String taskId) throws IOException {
        try {
            Long id = Long.parseLong(taskId);
            ScheduledTask task = scheduledTaskRepository.findById(id);
            
            if (task == null) {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "Task not found");
                return;
            }

            Map<String, Object> taskData = new HashMap<>();
            taskData.put("id", task.getId());
            taskData.put("taskName", task.getTaskName());
            taskData.put("catalogName", task.getCatalogName());
            taskData.put("namespace", task.getNamespace());
            taskData.put("tableName", task.getTableName());
            taskData.put("cronExpression", task.getCronExpression());
            taskData.put("cronDescription", CronUtil.getCronDescription(task.getCronExpression()));
            taskData.put("taskType", task.getTaskType());
            taskData.put("enabled", task.isEnabled());
            taskData.put("lastRunAt", task.getLastRunAt());
            taskData.put("lastRunStatus", task.getLastRunStatus());
            taskData.put("lastRunMessage", task.getLastRunMessage());
            taskData.put("nextRunAt", task.getNextRunAt());
            taskData.put("createdBy", task.getCreatedBy());
            taskData.put("createdAt", task.getCreatedAt());
            taskData.put("updatedAt", task.getUpdatedAt());
            
            // Add task parameters
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("snapshotRetention", task.isSnapshotRetention());
            parameters.put("retentionPeriod", task.getRetentionPeriod());
            parameters.put("minSnapshotsToKeep", task.getMinSnapshotsToKeep());
            parameters.put("orphanFileDeletion", task.isOrphanFileDeletion());
            parameters.put("orphanFileRetention", task.getOrphanFileRetention());
            parameters.put("compaction", task.isCompaction());
            parameters.put("targetFileSizeBytes", task.getTargetFileSizeBytes());
            parameters.put("strategy", task.getStrategy());
            parameters.put("sortOrder", task.getSortOrder());
            parameters.put("whereClause", task.getWhereClause());
            taskData.put("parameters", parameters);

            response.setContentType("application/json");
            objectMapper.writeValue(response.getOutputStream(), taskData);
        } catch (NumberFormatException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid task ID");
        } catch (Exception e) {
            logger.error("Failed to get scheduled task", e);
            response.sendError(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to get scheduled task");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        String pathInfo = request.getPathInfo();
        if (pathInfo == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing path info");
            return;
        }

        String[] pathParts = pathInfo.split("/");
        if (pathParts.length < 3 || !"scheduled-task".equals(pathParts[1])) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid path");
            return;
        }

        try {
            Long taskId = Long.parseLong(pathParts[2]);
            ScheduledTask task = scheduledTaskRepository.findById(taskId);
            
            if (task == null) {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "Task not found");
                return;
            }
            
            scheduledTaskRepository.deleteById(taskId);
            
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Task deleted successfully");
            objectMapper.writeValue(response.getOutputStream(), result);
            
        } catch (NumberFormatException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid task ID");
        } catch (Exception e) {
            logger.error("Failed to delete scheduled task", e);
            response.sendError(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to delete scheduled task");
        }
    }
    
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        String pathInfo = request.getPathInfo();
        if (pathInfo == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing path info");
            return;
        }

        String[] pathParts = pathInfo.split("/");
        if (pathParts.length < 4 || !"scheduled-task".equals(pathParts[1]) || !"toggle".equals(pathParts[3])) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid path");
            return;
        }

        try {
            Long taskId = Long.parseLong(pathParts[2]);
            ScheduledTask task = scheduledTaskRepository.findById(taskId);
            
            if (task == null) {
                response.sendError(HttpServletResponse.SC_NOT_FOUND, "Task not found");
                return;
            }
            
            Map<String, Object> requestBody = objectMapper.readValue(
                    request.getReader(), new TypeReference<Map<String, Object>>() {});
                    
            boolean enabled = Boolean.parseBoolean(requestBody.get("enabled").toString());
            
            if (enabled) {
                scheduledTaskRepository.enableTask(taskId);
            } else {
                scheduledTaskRepository.disableTask(taskId);
            }
            
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Task status updated successfully");
            result.put("enabled", enabled);
            objectMapper.writeValue(response.getOutputStream(), result);
            
        } catch (NumberFormatException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid task ID");
        } catch (Exception e) {
            logger.error("Failed to toggle scheduled task", e);
            response.sendError(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to toggle scheduled task");
        }
    }
}
