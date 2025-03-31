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

package io.nimtable.spark;

import io.nimtable.Config;
import org.apache.spark.sql.SparkSession;
import java.util.Map;

public class LocalSpark {
    private static LocalSpark instance;
    private final SparkSession spark;

    private LocalSpark(Config config) {
        this.spark = initializeSpark(config);
    }

    public static synchronized LocalSpark getInstance(Config config) {
        if (instance == null) {
            instance = new LocalSpark(config);
        }
        return instance;
    }

    private SparkSession initializeSpark(Config config) {
        SparkSession.Builder builder = SparkSession.builder()
            .appName("Nimtable")
            .master("local[*]")
            .config("spark.sql.extensions", "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions")
            .config("spark.jars.packages", "org.apache.spark:spark-hadoop-cloud_2.12:3.5.1") // for S3
            .config("spark.hadoop.fs.s3.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem")
            // FIXME: remove these hard-coded parameters
            .config("spark.hadoop.fs.s3a.endpoint", "http://localhost:9000")
            .config("spark.hadoop.fs.s3a.access.key", "admin")
            .config("spark.hadoop.fs.s3a.secret.key", "password")
            .config("spark.hadoop.fs.s3a.path.style.access", "true");
        
        // Pass all catalog properties to Spark
        for (Config.Catalog catalog : config.catalogs()) {
            String catalogName = catalog.name();
            builder.config(String.format("spark.sql.catalog.%s", catalogName), "org.apache.iceberg.spark.SparkCatalog");
            for (Map.Entry<String, String> property : catalog.properties().entrySet()) {
                builder.config(String.format("spark.sql.catalog.%s.%s", catalogName, property.getKey()), property.getValue());
            }
        }

        SparkSession session = builder.getOrCreate();
        session.sparkContext().setLogLevel("ERROR");
        return session;
    }

    public SparkSession getSpark() {
        return spark;
    }

    public void stop() {
        if (spark != null) {
            spark.stop();
            instance = null; // Reset the instance when stopped
        }
    }
}
