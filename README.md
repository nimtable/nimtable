<div align="center">

# Nimtable: The Control Plane for Apache Iceberg™

</div>

<div align="center">

<b> A lightweight, easy-to-use platform to monitor, optimize, and govern your Iceberg-based lakehouse. </b>

</div>

<div align="center">
  <a
    href="https://go.nimtable.com/slack"
    target="_blank"
  >
    <img alt="Slack" src="https://badgen.net/badge/Slack/Join%20Nimtable/0abd59?icon=slack" />
  </a>
</div>


![Screenshot](./docs/dashboard.png)


## Overview

Nimtable helps you easily manage and explore Apache Iceberg catalogs. With a web-based platform designed for clarity and simplicity, Nimtable makes it easy to browse tables, run queries, analyze file distributions, and optimize storage layouts.


### Key Features

- 🌟 **Multi-Catalog Support**: Connect to Hive Metastore, PostgreSQL (via JDBC), REST Catalog, AWS Glue, and S3 Tables.
- 🔍 **Table Exploration**: Inspect table schemas, partitions, and snapshots.
- ⚡ **Interactive Querying**: Execute SQL queries directly from the platform.
- 📊 **File Distribution Analysis**: Visualize how data files are distributed across partitions and snapshots.
- 🔧 **Table Optimization**: Run file compaction and manage snapshot expiration.
- 🔌 **REST Catalog Compatibility**: Serve as a standard Iceberg REST Catalog, adapting any underlying catalog to a RESTful API.

## Architecture

Nimtable acts as a bridge between users and catalog servers, providing both an interactive web interface and a standard REST Catalog API layer.

<img src="docs/nimtable-arch.drawio1.png" alt="Architecture" width=491>

## Quick Start

### Using Docker (Recommended for Production)

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

Access the UI at http://localhost:3000

### Local Development

For local development, follow these steps:

1. Install dependencies:
```bash
pnpm install
```

2. Generate Prisma client:
```bash
pnpm prisma generate
```

3. Start the development server:
```bash
pnpm dev
```

The application will be available at http://localhost:3000

Note: You need to run `pnpm prisma generate` after:
- First time setup
- Pulling new changes that include Prisma schema updates
- Installing new dependencies

## Configuration

Nimtable uses YAML for configuration, supporting both server settings and catalog connections. The configuration format is compatible with Spark's Iceberg catalog configuration. You can configure catalogs in two ways:

1. **Configuration File**: Configure catalogs via YAML configuration (recommended for experts)
2. **Web Interface**: Configure catalogs through the Nimtable UI (recommended for new users)

To configure the Docker deployment, read the sample configuration file at [docker/docker-compose.yml](./docker/docker-compose.yml).

### Server Configuration

```yaml
server:
  port: 8182
  host: 0.0.0.0
admin:
  username: admin
  password: admin
database:
  url: jdbc:postgresql://localhost:5432/nimtable_db
  username: nimtable_user
  password: password
```

### Environment Variables

Nimtable supports configuration through environment variables. You can set the following environment variables in your `.env` file:

```bash
# Database connection
DATABASE_URL="postgresql://nimtable_user:password@localhost:5432/nimtable_db?schema=public"

# JWT configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin

```

To use these environment variables with Docker, you need to explicitly configure them in your `docker-compose.yml` file under the `environment` section of the relevant service.

### Database Configuration

Nimtable needs a PostgreSQL database to store data.
If you deploy with the `docker-compose.yml` file,
a Postgres container is included.

You can also use your own Postgres database by setting the `url`, `username`, and `password`
in `config.yaml`.

### Catalog Configuration Examples

You can connect catalogs to Nimtable by clicking `CREATE CATALOG` in the UI.
There are multiple example templates provided to help you get started.

![create-catalog](docs/create-catalog.png)

Alternatively, the catalogs can be pre-configured in the `config.yaml` file.
Refer to [config.yaml](./backend/config.yaml) for examples.

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

See [HACKING.md](docs/HACKING.md) for details on how to hack on Nimtable.

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

We welcome contributions! Please see our [Contributing Guide](docs/HACKING.md) for details.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
