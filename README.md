# Nimtable

<div align="center">

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

A modern, user-friendly web interface for Apache Iceberg catalogs

![Screenshot](./docs/screenshot.png)

</div>

## Overview

Nimtable is a powerful web-based UI that simplifies the management and exploration of Apache Iceberg catalogs. It provides an intuitive interface for browsing tables, executing queries, analyzing data distributions, and performing table optimizations.

### Key Features

- 🌟 **Multi-Catalog Support**: Connect to multiple catalog types including Hive Metastore, PostgreSQL (JDBC), REST Catalog, AWS Glue, and S3 Tables
- 🔍 **Table Exploration**: Browse and inspect table schemas, partitions, and snapshots
- ⚡ **Interactive Querying**: Execute SQL queries directly through the UI
- 📊 **File Distribution Analysis**: Visualize and understand data file distribution
- 🔧 **Table Optimization**: Perform compaction and manage snapshot expiration
- 🔌 **REST Catalog Compatibility**: Serves as a standard Iceberg REST Catalog, adapting any underlying catalog to RESTful API

## Architecture

Nimtable acts as a bridge between users and various catalog servers, providing both a user interface and a standard REST Catalog API layer:

<img src="docs/nimtable-arch.drawio.png" alt="Architecture" width=491>

## Quick Start

The fastest way to get started is using Docker:

```bash
cd docker

# Start the service
docker compose up -d

# View logs
docker compose logs -f

# Stop the service
docker compose down
```

Access the UI at http://localhost:8182

## Configuration

Nimtable uses YAML for configuration, supporting both server settings and catalog connections. The configuration format is compatible with Spark's Iceberg catalog configuration. You can configure catalogs in two ways:

1. **Configuration File**: Configure catalogs via YAML configuration (recommended for experts)
2. **Web Interface**: Configure catalogs through the Nimtable UI (recommended for new users)

For Docker deployments, you can find a sample configuration file at [docker/config.yaml](./docker/config.yaml).

### Server Configuration

```yaml
server:
  port: 8182
  host: 0.0.0.0
admin:
  username: admin
  password: admin
```

### Catalog Configuration Examples

#### REST Catalog

```yaml
catalogs:
  - name: rest-catalog
    type: rest
    uri: http://localhost:8181
    warehouse: s3://warehouse/wh/
    io-impl: org.apache.iceberg.aws.s3.S3FileIO
    s3.endpoint: http://localhost:9000
    s3.access-key-id: admin
    s3.secret-access-key: password
    s3.region: us-east-1
    s3.path-style-access: true
    client.region: us-east-1
```

#### AWS S3 Tables

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

#### JDBC Catalog (e.g. PostgreSQL)

```yaml
catalogs:
  - name: jdbc-catalog
    type: jdbc
    jdbc.schema-version: V1
    uri: jdbc:postgresql://localhost:5432/db
    warehouse: s3://warehouse/wh/
    jdbc.user: admin
    jdbc.password: password
    # S3 Configuration
    io-impl: org.apache.iceberg.aws.s3.S3FileIO
    s3.endpoint: http://localhost:9000
    s3.access-key-id: admin
    s3.secret-access-key: password
    s3.region: us-east-1
    s3.path-style-access: true
    client.region: us-east-1
```

#### AWS Glue Catalog

You need to provide AWS credentials for Glue Catalog access. You can do this by either mounting the AWS credentials file or using environment variables. See the section below for details.


```yaml
catalogs:
  - name: glue-catalog
    type: glue
    warehouse: s3://your-bucket/test
```

### AWS Credential Configuration in Docker

There are two ways to configure AWS credentials in Docker:

1. Using Environment Variables:
```yaml
# docker-compose.yml
services:
  nimtable:
    environment:
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=your-access-key
      - AWS_SECRET_ACCESS_KEY=your-secret-key
```

2. Mounting AWS Credentials File (Read-only):
```yaml
# docker-compose.yml
services:
  nimtable:
    volumes:
      - ~/.aws/credentials:/root/.aws/credentials:ro
```


## Development

### Prerequisites

- JDK 17 or later
- Node.js 23 or later
- Docker (optional, for running test catalogs)

### Backend Development

```bash
cd backend
./gradlew run
```

It will serve at http://localhost:8182.

### Frontend Development

First start the backend server as mentioned above.

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

It will serve a separate UI at http://localhost:3000, which can be dynamically updated as you make changes to the frontend code.

### Testing with a Catalog

For testing, you can use the [Spark + Iceberg Quickstart Image](https://github.com/databricks/docker-spark-iceberg/):

```bash
git clone https://github.com/databricks/docker-spark-iceberg.git
docker-compose up

# Create tables and insert data
docker exec -it spark-iceberg spark-sql
```

### Code Quality

```bash
# Frontend linting
npm run lint        # Check
npm run lint --fix  # Fix

# Backend linting
cd backend
./gradlew spotlessCheck  # Check
./gradlew spotlessApply  # Fix
```

## Roadmap

- 🔧 **Optimized Compaction**: Advanced compaction strategies and scheduling
- 📊 **Monitoring & Analytics**: Comprehensive dashboard and insights
- 💾 **Caching**: Database integration and metadata caching
- ⚡ **Query Engine Integration**: Support for multiple query engines
- 📋 **Metadata Management**: Enhanced snapshot, schema and partition management
- 🔐 **Security & Access Control**: RBAC and fine-grained permissions
- 🔌 **API & Integration**: REST API support and authentication
- 🔄 **Data Lineage**: Table and column-level lineage tracking
- 🏢 **Catalog & Warehouse Integration**: Support for various storage backends

For detailed roadmap items and progress tracking, see [Roadmap](https://github.com/nimtable/nimtable/issues/50).

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.