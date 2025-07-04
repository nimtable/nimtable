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


![Screenshot](./docs/nimtable.png)


## Overview

Nimtable helps you easily manage and explore Apache Iceberg catalogs. With a web-based platform designed for clarity and simplicity, Nimtable makes it easy to browse tables, run queries, analyze file distributions, and optimize storage layouts.


### Key Features

- 🌟 **Multi-Catalog Support**  
  Connect to REST Catalog, AWS Glue, AWS S3 Tables, and PostgreSQL (via JDBC).

- 🗄️ **Object Store Integration**  
  Seamlessly work with S3 and S3-compatible stores like Cloudflare R2, Minio, and more.

- 🔍 **Table Exploration**  
  Inspect table schemas, partitions, and snapshots with ease.

- ⚡ **Interactive Querying**  
  Run SQL queries directly from the platform.

- 🤖 **AI Copilot**  
  Get intelligent assistance for Iceberg table exploration.

- 📄 **AI Summary**  
  Automatically generate summaries of your Iceberg tables.

- 📊 **File Distribution Analysis**  
  Visualize how data files are distributed across partitions and snapshots.

- 🔧 **Table Optimization**  
  Run file compaction and manage snapshot expiration.

- 🔌 **REST Catalog Compatibility**  
  Serve as a standard Iceberg REST Catalog, adapting any underlying catalog to a RESTful API.

## Architecture

Nimtable acts as a bridge between users and catalog servers, providing both an interactive web interface and a standard REST Catalog API layer.

<img src="docs/nimtable-arch.drawio1.png" alt="Architecture" width=491>

## Quick Start

The fastest way to get started is using Docker:

```bash
cd docker
docker compose up -d
```

Access the UI at [http://localhost:3000](http://localhost:3000).

#### Default Admin Login

- **Username:** `admin`
- **Password:** `admin`

You can customize the admin credentials by setting environment variables in your `docker-compose.yml`:

```yaml
services:
  nimtable-web:
    environment:
      - ADMIN_USERNAME=your-admin-username
      - ADMIN_PASSWORD=your-secure-password
```

---

## Managing the Service (Optional)

- **View logs:**
  ```bash
  docker compose logs -f
  ```
- **Stop the service:**
  ```bash
  docker compose down
  ```

## Development

See [HACKING.md](docs/HACKING.md) for details on how to hack on Nimtable.

## Configuration

Nimtable can be configured in two ways:

- **Web UI:** Easiest for new users - just log in and click "Create Catalog."
- **YAML Configuration File:** Recommended for advanced users or automated deployments.

### 1. Configuration File Location

- By default, Nimtable looks for `config.yaml` in the working directory.
- **Docker:** Mount your config file to `/app/config.yaml` inside the container.
- See [docker/docker-compose.yml](./docker/docker-compose.yml) for an example of mounting configuration.

### 2. Minimal Configuration Example

```yaml
server:
  port: 8182
  host: 0.0.0.0
database:
  url: jdbc:postgresql://localhost:5432/nimtable_db
  username: nimtable_user
  password: password
```

> **Important:** Change the default admin password after your first login for security.

### 3. Catalog Configuration

You can add catalogs in two ways:

- **Web UI:**  
  After logging in, click "Create Catalog" and follow the prompts. Catalogs added via the UI are stored in the internal database and do not modify `config.yaml`.

- **YAML File:**  
  Pre-configure catalogs by adding them to your `config.yaml`.  
  See [backend/config.yaml](./backend/config.yaml) for full examples and templates.

**Supported Catalog Types:**  
- REST
- AWS Glue
- S3 Tables
- PostgreSQL (via JDBC)

Each catalog type may require specific fields. Refer to the sample config for details.

### 4. AWS Credential Configuration

If you use AWS Glue or S3, you can provide credentials in two ways:

- **Environment Variables:**
  ```yaml
  # docker-compose.yml
  services:
    nimtable:
      environment:
        - AWS_REGION=us-east-1
        - AWS_ACCESS_KEY_ID=your-access-key
        - AWS_SECRET_ACCESS_KEY=your-secret-key
  ```

- **Mounting AWS Credentials File:**
  ```yaml
  # docker-compose.yml
  services:
    nimtable:
      volumes:
        - ~/.aws/credentials:/root/.aws/credentials:ro
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
- 🤖 **Better AI Copilot Support**: Enhanced capabilities for AI agent.
- 🏢 **Catalog & Warehouse Integration**: Support for various storage backends

For detailed roadmap items and progress tracking, see [Roadmap](https://github.com/nimtable/nimtable/issues/50).

## Contributing

We welcome contributions! Please see our [Contributing Guide](docs/HACKING.md) for details.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
