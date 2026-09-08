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

package io.nimtable.util;

/** Utilities for safely embedding identifiers in Spark SQL statements. */
public final class SparkSqlUtil {
    private SparkSqlUtil() {}

    /** Returns a SQL string literal containing a quoted two-part table identifier. */
    public static String tableIdentifierArgument(String namespace, String tableName) {
        String tableIdentifier = quoteIdentifier(namespace) + "." + quoteIdentifier(tableName);
        return "'" + tableIdentifier.replace("'", "''") + "'";
    }

    private static String quoteIdentifier(String identifier) {
        return "`" + identifier.replace("`", "``") + "`";
    }
}
