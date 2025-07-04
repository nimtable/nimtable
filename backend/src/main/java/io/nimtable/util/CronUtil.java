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

package io.nimtable.util;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Utility class for handling cron expressions.
 * Supports standard cron format: second minute hour day-of-month month day-of-week
 */
public class CronUtil {

    private static final Logger LOG = LoggerFactory.getLogger(CronUtil.class);
    
    private static final Pattern CRON_PATTERN = Pattern.compile(
        "^([*]|\\d+(-\\d+)?(/\\d+)?)\\s+" + // second
        "([*]|\\d+(-\\d+)?(/\\d+)?)\\s+" +  // minute
        "([*]|\\d+(-\\d+)?(/\\d+)?)\\s+" +  // hour
        "([*]|\\d+(-\\d+)?(/\\d+)?)\\s+" +  // day of month
        "([*]|\\d+(-\\d+)?(/\\d+)?)\\s+" +  // month
        "([*]|\\d+(-\\d+)?(/\\d+)?)$"       // day of week
    );

    /**
     * Validates if a cron expression is valid.
     */
    public static boolean isValidCronExpression(String cronExpression) {
        if (cronExpression == null || cronExpression.trim().isEmpty()) {
            return false;
        }
        
        String[] parts = cronExpression.trim().split("\\s+");
        if (parts.length != 6) {
            return false;
        }
        
        try {
            // Basic validation
            validateField(parts[0], 0, 59);  // second
            validateField(parts[1], 0, 59);  // minute
            validateField(parts[2], 0, 23);  // hour
            validateField(parts[3], 1, 31);  // day of month
            validateField(parts[4], 1, 12);  // month
            validateField(parts[5], 0, 6);   // day of week (0 = Sunday)
            
            return true;
        } catch (Exception e) {
            LOG.warn("Invalid cron expression: {}", cronExpression, e);
            return false;
        }
    }

    /**
     * Calculate the next execution time based on cron expression.
     */
    public static LocalDateTime getNextExecutionTime(String cronExpression, LocalDateTime from) {
        if (!isValidCronExpression(cronExpression)) {
            throw new IllegalArgumentException("Invalid cron expression: " + cronExpression);
        }
        
        String[] parts = cronExpression.trim().split("\\s+");
        
        LocalDateTime next = from.plusMinutes(1).truncatedTo(ChronoUnit.MINUTES);
        
        // Simple implementation for common cases
        // For production, consider using a more robust cron library like Quartz
        
        int targetSecond = parseField(parts[0], 0);
        int targetMinute = parseField(parts[1], next.getMinute());
        int targetHour = parseField(parts[2], next.getHour());
        
        next = next.withSecond(targetSecond);
        
        if (!parts[1].equals("*")) {
            next = next.withMinute(targetMinute);
        }
        
        if (!parts[2].equals("*")) {
            next = next.withHour(targetHour);
        }
        
        // Handle daily execution
        if (parts[0].equals("0") && parts[1].equals("0") && !parts[2].equals("*") && 
            parts[3].equals("*") && parts[4].equals("*") && parts[5].equals("*")) {
            // Daily at specific hour
            if (next.isBefore(from) || next.equals(from)) {
                next = next.plusDays(1);
            }
        }
        
        // Handle hourly execution
        if (parts[0].equals("0") && !parts[1].equals("*") && parts[2].equals("*") && 
            parts[3].equals("*") && parts[4].equals("*") && parts[5].equals("*")) {
            // Hourly at specific minute
            if (next.isBefore(from) || next.equals(from)) {
                next = next.plusHours(1);
            }
        }
        
        return next;
    }

    /**
     * Get a human-readable description of the cron expression.
     */
    public static String getCronDescription(String cronExpression) {
        if (!isValidCronExpression(cronExpression)) {
            return "Invalid cron expression";
        }
        
        String[] parts = cronExpression.trim().split("\\s+");
        
        // Handle common patterns
        if (parts[0].equals("0") && parts[1].equals("0") && !parts[2].equals("*") && 
            parts[3].equals("*") && parts[4].equals("*") && parts[5].equals("*")) {
            return "Daily at " + parts[2] + ":00";
        }
        
        if (parts[0].equals("0") && !parts[1].equals("*") && parts[2].equals("*") && 
            parts[3].equals("*") && parts[4].equals("*") && parts[5].equals("*")) {
            return "Hourly at minute " + parts[1];
        }
        
        if (parts[0].equals("0") && parts[1].equals("0") && parts[2].equals("0") && 
            !parts[3].equals("*") && parts[4].equals("*") && parts[5].equals("*")) {
            return "Monthly on day " + parts[3];
        }
        
        if (parts[0].equals("0") && parts[1].equals("0") && !parts[2].equals("*") && 
            parts[3].equals("*") && parts[4].equals("*") && !parts[5].equals("*")) {
            return "Weekly on " + getDayOfWeekName(parts[5]) + " at " + parts[2] + ":00";
        }
        
        return "Custom: " + cronExpression;
    }

    private static void validateField(String field, int min, int max) {
        if (field.equals("*")) {
            return;
        }
        
        if (field.contains("/")) {
            String[] stepParts = field.split("/");
            if (stepParts.length != 2) {
                throw new IllegalArgumentException("Invalid step format: " + field);
            }
            validateField(stepParts[0], min, max);
            int step = Integer.parseInt(stepParts[1]);
            if (step <= 0) {
                throw new IllegalArgumentException("Step must be positive: " + step);
            }
        } else if (field.contains("-")) {
            String[] rangeParts = field.split("-");
            if (rangeParts.length != 2) {
                throw new IllegalArgumentException("Invalid range format: " + field);
            }
            int start = Integer.parseInt(rangeParts[0]);
            int end = Integer.parseInt(rangeParts[1]);
            if (start < min || start > max || end < min || end > max || start > end) {
                throw new IllegalArgumentException("Invalid range: " + field);
            }
        } else {
            int value = Integer.parseInt(field);
            if (value < min || value > max) {
                throw new IllegalArgumentException("Value out of range: " + value);
            }
        }
    }

    private static int parseField(String field, int defaultValue) {
        if (field.equals("*")) {
            return defaultValue;
        }
        return Integer.parseInt(field);
    }

    private static String getDayOfWeekName(String dayOfWeek) {
        switch (dayOfWeek) {
            case "0": return "Sunday";
            case "1": return "Monday";
            case "2": return "Tuesday";
            case "3": return "Wednesday";
            case "4": return "Thursday";
            case "5": return "Friday";
            case "6": return "Saturday";
            default: return "Unknown";
        }
    }

    /**
     * Common cron expressions for quick reference.
     */
    public static class CommonCronExpressions {
        public static final String EVERY_MINUTE = "0 * * * * *";
        public static final String EVERY_HOUR = "0 0 * * * *";
        public static final String DAILY_AT_MIDNIGHT = "0 0 0 * * *";
        public static final String DAILY_AT_NOON = "0 0 12 * * *";
        public static final String WEEKLY_SUNDAY_MIDNIGHT = "0 0 0 * * 0";
        public static final String MONTHLY_FIRST_DAY = "0 0 0 1 * *";
        public static final String EVERY_10_MINUTES = "0 */10 * * * *";
        public static final String EVERY_30_MINUTES = "0 */30 * * * *";
        public static final String EVERY_6_HOURS = "0 0 */6 * * *";
        public static final String WORKDAYS_AT_9AM = "0 0 9 * * 1-5";
    }
} 