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
        
        // Start from the next second to avoid returning the current time
        LocalDateTime next = from.plusSeconds(1).withNano(0);
        
        // Try to find the next execution time within a reasonable timeframe
        for (int attempts = 0; attempts < 60 * 24 * 40; attempts++) { // Up to 40 days
            if (matchesTimeSlot(next, parts)) {
                return next;
            }
            
            // Increment more intelligently based on the cron expression
            next = getNextIncrement(next, parts);
            
            // Safety check to prevent infinite loops
            if (next.isAfter(from.plusDays(40))) {
                break;
            }
        }
        
        throw new IllegalArgumentException("Unable to find next execution time for: " + cronExpression);
    }
    
    private static LocalDateTime getNextIncrement(LocalDateTime current, String[] cronParts) {
        // Analyze the cron expression to determine the best increment strategy
        
        // If it's a daily pattern (specific hour, minute, second)
        if (!cronParts[2].equals("*") && !cronParts[2].contains("/") && !cronParts[2].contains("-") && 
            !cronParts[1].equals("*") && !cronParts[1].contains("/") && !cronParts[1].contains("-") &&
            !cronParts[0].equals("*") && !cronParts[0].contains("/") && !cronParts[0].contains("-") &&
            cronParts[3].equals("*") && cronParts[4].equals("*") && cronParts[5].equals("*")) {
            
            // Daily pattern - jump to the next day at the specified time
            int targetHour = Integer.parseInt(cronParts[2]);
            int targetMinute = Integer.parseInt(cronParts[1]);
            int targetSecond = Integer.parseInt(cronParts[0]);
            
            LocalDateTime todayTarget = current.toLocalDate().atTime(targetHour, targetMinute, targetSecond);
            
            if (todayTarget.isAfter(current)) {
                return todayTarget;
            } else {
                return todayTarget.plusDays(1);
            }
        }
        
        // If it's a weekly pattern (with day-of-week specification)
        if (!cronParts[2].equals("*") && !cronParts[2].contains("/") && !cronParts[2].contains("-") && 
            !cronParts[1].equals("*") && !cronParts[1].contains("/") && !cronParts[1].contains("-") &&
            !cronParts[0].equals("*") && !cronParts[0].contains("/") && !cronParts[0].contains("-") &&
            cronParts[3].equals("*") && cronParts[4].equals("*") && !cronParts[5].equals("*")) {
            
            // Weekly pattern - jump to the next day to find the right day of week
            int targetHour = Integer.parseInt(cronParts[2]);
            int targetMinute = Integer.parseInt(cronParts[1]);
            int targetSecond = Integer.parseInt(cronParts[0]);
            
            // Try today first
            LocalDateTime todayTarget = current.toLocalDate().atTime(targetHour, targetMinute, targetSecond);
            if (todayTarget.isAfter(current) && matchesField(current.getDayOfWeek().getValue() % 7, cronParts[5], 0, 6)) {
                return todayTarget;
            }
            
            // Search for the next matching day within the next 7 days
            for (int i = 1; i <= 7; i++) {
                LocalDateTime nextDay = current.plusDays(i).toLocalDate().atTime(targetHour, targetMinute, targetSecond);
                if (matchesField(nextDay.getDayOfWeek().getValue() % 7, cronParts[5], 0, 6)) {
                    return nextDay;
                }
            }
            
            // Fallback - should not happen
            return current.plusDays(1).withHour(0).withMinute(0).withSecond(0);
        }
        
        // If it's an hourly pattern (specific minute and second)
        if (!cronParts[1].equals("*") && !cronParts[1].contains("/") && !cronParts[1].contains("-") &&
            !cronParts[0].equals("*") && !cronParts[0].contains("/") && !cronParts[0].contains("-") &&
            cronParts[2].equals("*") && cronParts[3].equals("*") && cronParts[4].equals("*") && cronParts[5].equals("*")) {
            
            // Hourly pattern - jump to the next hour at the specified minute
            int targetMinute = Integer.parseInt(cronParts[1]);
            int targetSecond = Integer.parseInt(cronParts[0]);
            
            LocalDateTime thisHourTarget = current.withMinute(targetMinute).withSecond(targetSecond);
            
            if (thisHourTarget.isAfter(current)) {
                return thisHourTarget;
            } else {
                return thisHourTarget.plusHours(1);
            }
        }
        
        // If minutes has a step pattern, jump to the next step
        if (cronParts[1].startsWith("*/")) {
            int step = Integer.parseInt(cronParts[1].substring(2));
            int currentMinute = current.getMinute();
            int nextMinute = ((currentMinute / step) + 1) * step;
            
            if (nextMinute >= 60) {
                return current.plusHours(1).withMinute(0).withSecond(0);
            } else {
                return current.withMinute(nextMinute).withSecond(0);
            }
        }
        
        // If hours has a step pattern, jump to the next step
        if (cronParts[2].startsWith("*/")) {
            int step = Integer.parseInt(cronParts[2].substring(2));
            int currentHour = current.getHour();
            int nextHour = ((currentHour / step) + 1) * step;
            
            if (nextHour >= 24) {
                return current.plusDays(1).withHour(0).withMinute(0).withSecond(0);
            } else {
                return current.withHour(nextHour).withMinute(0).withSecond(0);
            }
        }
        
        // If it's a monthly pattern
        if (!cronParts[3].equals("*") && !cronParts[3].contains("/") && !cronParts[3].contains("-")) {
            // Jump to the next day to find the right day of month
            return current.plusDays(1).withHour(0).withMinute(0).withSecond(0);
        }
        
        // Default increment by 1 minute for complex patterns
        return current.plusMinutes(1);
    }
    
    private static boolean matchesTimeSlot(LocalDateTime dateTime, String[] cronParts) {
        return matchesField(dateTime.getSecond(), cronParts[0], 0, 59) &&
               matchesField(dateTime.getMinute(), cronParts[1], 0, 59) &&
               matchesField(dateTime.getHour(), cronParts[2], 0, 23) &&
               matchesField(dateTime.getDayOfMonth(), cronParts[3], 1, 31) &&
               matchesField(dateTime.getMonthValue(), cronParts[4], 1, 12) &&
               matchesField(dateTime.getDayOfWeek().getValue() % 7, cronParts[5], 0, 6); // Convert to Sunday=0
    }
    
    private static boolean matchesField(int value, String cronField, int min, int max) {
        if (cronField.equals("*")) {
            return true;
        }
        
        if (cronField.contains("/")) {
            String[] parts = cronField.split("/");
            String base = parts[0];
            int step = Integer.parseInt(parts[1]);
            
            if (base.equals("*")) {
                return (value - min) % step == 0;
            } else {
                int baseValue = Integer.parseInt(base);
                return value >= baseValue && (value - baseValue) % step == 0;
            }
        }
        
        if (cronField.contains("-")) {
            String[] parts = cronField.split("-");
            int start = Integer.parseInt(parts[0]);
            int end = Integer.parseInt(parts[1]);
            return value >= start && value <= end;
        }
        
        if (cronField.contains(",")) {
            String[] parts = cronField.split(",");
            for (String part : parts) {
                if (matchesField(value, part.trim(), min, max)) {
                    return true;
                }
            }
            return false;
        }
        
        return value == Integer.parseInt(cronField);
    }

    /**
     * Get a human-readable description of the cron expression.
     */
    public static String getCronDescription(String cronExpression) {
        if (!isValidCronExpression(cronExpression)) {
            return "Invalid cron expression";
        }
        
        String[] parts = cronExpression.trim().split("\\s+");
        
        // Handle step expressions
        if (parts[1].startsWith("*/")) {
            int minutes = Integer.parseInt(parts[1].substring(2));
            if (parts[0].equals("0") && parts[2].equals("*") && parts[3].equals("*") && 
                parts[4].equals("*") && parts[5].equals("*")) {
                if (minutes == 1) {
                    return "Every minute";
                } else if (minutes < 60) {
                    return "Every " + minutes + " minutes";
                } else {
                    return "Every " + (minutes / 60) + " hour(s)";
                }
            }
        }
        
        if (parts[2].startsWith("*/")) {
            int hours = Integer.parseInt(parts[2].substring(2));
            if (parts[0].equals("0") && parts[1].equals("0") && parts[3].equals("*") && 
                parts[4].equals("*") && parts[5].equals("*")) {
                return "Every " + hours + " hour(s)";
            }
        }
        
        // Handle daily patterns
        if (parts[0].equals("0") && parts[1].equals("0") && !parts[2].equals("*") && 
            parts[3].equals("*") && parts[4].equals("*") && parts[5].equals("*")) {
            int hour = Integer.parseInt(parts[2]);
            return "Daily at " + String.format("%02d:00", hour);
        }
        
        // Handle hourly patterns
        if (parts[0].equals("0") && !parts[1].equals("*") && parts[2].equals("*") && 
            parts[3].equals("*") && parts[4].equals("*") && parts[5].equals("*")) {
            int minute = Integer.parseInt(parts[1]);
            return "Hourly at minute " + minute;
        }
        
        // Handle weekly patterns
        if (parts[0].equals("0") && parts[1].equals("0") && !parts[2].equals("*") && 
            parts[3].equals("*") && parts[4].equals("*") && !parts[5].equals("*")) {
            int hour = Integer.parseInt(parts[2]);
            return "Weekly on " + getDayOfWeekName(parts[5]) + " at " + String.format("%02d:00", hour);
        }
        
        // Handle monthly patterns
        if (parts[0].equals("0") && parts[1].equals("0") && parts[2].equals("0") && 
            !parts[3].equals("*") && parts[4].equals("*") && parts[5].equals("*")) {
            return "Monthly on day " + parts[3];
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
            
            String base = stepParts[0];
            if (!base.equals("*")) {
                int baseValue = Integer.parseInt(base);
                if (baseValue < min || baseValue > max) {
                    throw new IllegalArgumentException("Base value out of range: " + baseValue);
                }
            }
            
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
        } else if (field.contains(",")) {
            String[] commaParts = field.split(",");
            for (String part : commaParts) {
                validateField(part.trim(), min, max);
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
        
        // Handle step expressions like "*/10"
        if (field.startsWith("*/")) {
            // For step expressions, we can't return a single value
            // This method is deprecated in favor of matchesField
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