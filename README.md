Nimtable
===================

Nimtable is a simple UI for browsing Apache Iceberg catalogs. It's still under development. 🚧

![Screenshot](./docs/screenshot.png)

## Architecture

The Nimtable server can be configured to connect to different catalog servers, such as Hive Metastore, PostgreSQL via JDBC catalog, or REST Catalog such as Apache Polaris. On top of that, Nimtable provides a human-friendly UI for browsing, querying and optimizing Iceberg tables.

Besides, Nimtable also serves as a standard Iceberg REST Catalog, which means it can adapt any underlying catalog implementation to the standard RESTful Catalog API.

<img src="docs/nimtable-arch.drawio.png" alt="Architecture" width=491>


## Get Started

You can use Docker to run Nimtable without installing any dependencies locally:

```bash
cd docker

# Build and start container
docker compose up -d

# View logs
docker compose logs -f

# Stop the service
docker compose down
```

This will build and start Nimtable at http://localhost:8182.

You can customize the configuration by editing `docker/config.yaml` and `docker/docker-compose.yml` before starting the container.

For other ways to run or develop Nimtable, please refer to the following sections.

## Configuration

Nimtable uses a YAML configuration file (`config.yaml`) to define server settings and catalog connections. The configuration is compatible with Spark's Iceberg catalog configuration format.

You can find the example configuration file at [`docker/config.yaml`](docker/config.yaml).

### Basic Server Configuration

```yaml
server:
  port: 8182
  host: 0.0.0.0
auth:
  username: admin
  password: admin
```

### Catalog Configuration

You can configure multiple catalogs in the `catalogs` section. Here are examples for different catalog types:

#### 1. JDBC Catalog (PostgreSQL, MySQL, etc.)

```yaml
catalogs:
  - name: jdbc-catalog
    type: jdbc
    jdbc.schema-version: V1
    uri: jdbc:postgresql://localhost:5432/db
    warehouse: s3://warehouse/wh/
    jdbc.user: admin
    jdbc.password: password
    # S3 Configuration (when using S3 as warehouse)
    io-impl: org.apache.iceberg.aws.s3.S3FileIO
    s3.endpoint: http://localhost:9000  # Optional, for custom S3 endpoints
    s3.access-key-id: admin
    s3.secret-access-key: password
    s3.region: us-east-1
    s3.path-style-access: true
    client.region: us-east-1
```

#### 2. REST Catalog

```yaml
catalogs:
  - name: rest-catalog
    type: rest
    uri: http://localhost:8181
    warehouse: s3://warehouse/wh/
    # S3 Configuration (when using S3 as warehouse)
    io-impl: org.apache.iceberg.aws.s3.S3FileIO
    s3.endpoint: http://localhost:9000  # Optional, for custom S3 endpoints
    s3.access-key-id: admin
    s3.secret-access-key: password
    s3.region: us-east-1
    s3.path-style-access: true
    client.region: us-east-1
```

#### 3. S3 Tables Catalog

For AWS S3 Tables, you can configure the catalog as follows. Note that you need to replace `xxxxx` with your AWS account ID and configure the appropriate bucket name. You can also provide AWS credentials through environment variables.

```yaml
catalogs:
  - name: s3-tables-catalog
    type: rest
    uri: https://s3tables.us-east-1.amazonaws.com/iceberg
    warehouse: arn:aws:s3tables:us-east-1:xxxxx:bucket/your-bucket
    io-impl: org.apache.iceberg.aws.s3.S3FileIO
    s3.access-key-id: admin
    s3.secret-access-key: password
    s3.region: us-east-1
    s3.path-style-access: true
    rest.sigv4-enabled: true
    rest.signing-name: s3tables
    rest.signing-region: us-east-1
```

#### 4. AWS Glue Catalog

For Glue catalog, you need to provide AWS credentials through environment variables:
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

```yaml
catalogs:
  - name: glue-catalog
    type: glue
    warehouse: s3://your-bucket/test
```

## Development

To develop, JDK 17 and Node.js 23 are required.

Start the backend server with:

```bash
cd backend
./gradlew run
```

The UI will be available at http://localhost:8182.

To test the UI, you need to run a catalog server separately. For example, you can use the [Spark + Iceberg Quickstart Image](https://github.com/databricks/docker-spark-iceberg/).

```bash
git clone https://github.com/databricks/docker-spark-iceberg.git
docker-compose up

docker exec -it spark-iceberg spark-sql # create tables, insert data, etc.
```

### Develop frontend

The frontend can also be developed separately by running the following commands:

```bash
npm install
npm run dev
```

### Lints

Fix lint issues:
```bash
# Frontend
# check lint
npm run lint
# fix lint
npm run lint -- --fix

# Backend
# check lint
cd backend && ./gradlew spotlessCheck
# fix lint
cd backend && ./gradlew spotlessApply
```

## Roadmap

- **Pluggable Query Engines**. Connect to different query engines, such as DuckDB (embedded), Spark, Flink, RisingWave, etc.
- **Table Optimize**. Run table maintenance operations, such as compaction and garbage collection with pluggable backends. (Work in progress)
- **Query Console**. A user-friendly console for running ad-hoc queries.
- **Authentication**. Support user management and authentication.