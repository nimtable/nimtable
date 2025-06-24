#!/bin/bash

echo "Waiting for services to be ready..."
sleep 10

echo "Creating test databases and tables..."

spark-sql \
  --packages org.apache.iceberg:iceberg-spark-runtime-3.5_2.12:1.4.2,org.apache.hadoop:hadoop-aws:3.3.4 \
  --conf spark.sql.extensions=org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions \
  --conf spark.sql.catalog.demo=org.apache.iceberg.spark.SparkCatalog \
  --conf spark.sql.catalog.demo.type=rest \
  --conf spark.sql.catalog.demo.uri=http://rest:8181 \
  --conf spark.sql.catalog.demo.io-impl=org.apache.iceberg.aws.s3.S3FileIO \
  --conf spark.sql.catalog.demo.warehouse=s3://warehouse/ \
  --conf spark.sql.catalog.demo.s3.endpoint=http://minio:9000 \
  --conf spark.hadoop.fs.s3a.access.key=admin \
  --conf spark.hadoop.fs.s3a.secret.key=password \
  --conf spark.hadoop.fs.s3a.endpoint=http://minio:9000 \
  --conf spark.hadoop.fs.s3a.path.style.access=true \
  -f /home/iceberg/test-data/create-test-data.sql

echo "Test data creation completed. Container will now exit." 