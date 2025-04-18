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
import io.nimtable.db.entity.Catalog;
import io.nimtable.db.repository.CatalogRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.spark.sql.SparkSession;

public class LocalSpark {
    private static LocalSpark instance;
    private final SparkSession spark;
    private final Config config;

    private LocalSpark(Config config) {
        this.config = config;
        this.spark = initializeSpark(config);
    }

    public static synchronized LocalSpark getInstance(Config config) {
        if (instance == null) {
            instance = new LocalSpark(config);
        }
        return instance;
    }

    public static synchronized void updateInstance(Config config) {
        if (instance != null) {
            instance.stop();
        }
        instance = new LocalSpark(config);
    }

    private SparkSession initializeSpark(Config config) {
        SparkSession.Builder builder =
                SparkSession.builder()
                        .appName("Nimtable")
                        .master("local[*]")
                        .config(
                                "spark.sql.extensions",
                                "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions")
                        .config("spark.hadoop.fs.s3.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem")
                        // FIXME: remove these hard-coded parameters
                        .config("spark.hadoop.fs.s3a.endpoint", "http://localhost:9000")
                        .config("spark.hadoop.fs.s3a.access.key", "admin")
                        .config("spark.hadoop.fs.s3a.secret.key", "password")
                        .config("spark.hadoop.fs.s3a.path.style.access", "true");

        // Load catalogs from config
        if (config.catalogs() != null) {
            for (Config.Catalog catalog : config.catalogs()) {
                String catalogName = catalog.name();
                builder.config(
                        String.format("spark.sql.catalog.%s", catalogName),
                        "org.apache.iceberg.spark.SparkCatalog");

                // Add all properties to Spark config
                for (Map.Entry<String, String> property : catalog.properties().entrySet()) {
                    builder.config(
                            String.format(
                                    "spark.sql.catalog.%s.%s", catalogName, property.getKey()),
                            property.getValue());
                }
            }
        }

        // Load catalogs from database
        CatalogRepository catalogRepository = new CatalogRepository();
        List<Catalog> catalogs = catalogRepository.findAll();

        // Pass all catalog properties to Spark
        for (Catalog catalog : catalogs) {
            String catalogName = catalog.getName();
            builder.config(
                    String.format("spark.sql.catalog.%s", catalogName),
                    "org.apache.iceberg.spark.SparkCatalog");

            // Add type to properties
            Map<String, String> properties = new HashMap<>(catalog.getProperties());
            properties.put("type", catalog.getType());

            // Add warehouse if specified
            if (catalog.getWarehouse() != null) {
                properties.put("warehouse", catalog.getWarehouse());
            }

            // Add URI if specified
            if (catalog.getUri() != null) {
                properties.put("uri", catalog.getUri());
            }

            // Add all properties to Spark config
            for (Map.Entry<String, String> property : properties.entrySet()) {
                builder.config(
                        String.format("spark.sql.catalog.%s.%s", catalogName, property.getKey()),
                        property.getValue());
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
        }
    }
}
