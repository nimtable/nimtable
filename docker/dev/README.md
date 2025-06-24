# Development Docker

This directory contains a Dockerfile and docker-compose.yml file for development purposes.

The image copies a pre-built jar from the host directly.
This way, you don't need to build the jar in the container.

## Usage

```bash
cd docker/dev

./up.sh

# # Or, ...
# ./build.sh # ALWAYS RUN THIS FIRST, otherwise, changes to the code will not be reflected
# docker compose up --build
```

## Frontend Access

The frontend is now running in Next.js server mode and is accessible at:

- http://localhost:3000

It communicates with the backend API at:

- http://nimtable:8182/api

The frontend service is configured to use volume mounts for your source code, allowing for hot-reloading of changes during development.

## Test catalog

A test catalog is prepared. You can create a catalog in Nimtable with "Load from Spark CLI parameters":

```
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
  --conf spark.hadoop.fs.s3a.path.style.access=true 
```
