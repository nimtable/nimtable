<div align="center">

# Nimtable: Observability for Apache Iceberg™

</div>

<div align="center">

<b> Nimtable is a lightweight web platform for exploring and managing Apache Iceberg catalogs and tables. </b>

</div>

<div align="center">
  <a
    href="https://docs.risingwave.com/iceberg/nimtable/get-started"
    target="_blank"
  >
    <img
      alt="Docs"
      src="https://badgen.net/badge/Docs/Nimtable%20Docs/2b6cb0?icon=book"
    />
  </a>
  <a
    href="https://go.risingwave.com/slack"
    target="_blank"
  >
    <img alt="Slack" src="https://badgen.net/badge/Slack/Join%20Community%20(Powered%20By%20RisingWave%20Labs)/0abd59?icon=slack" />
  </a>
</div>


![Screenshot](./docs/nimtable.png)


## Overview

Nimtable provides a clean interface and REST API for Apache Iceberg.
It helps engineers inspect catalog metadata, view table schemas and partitions, analyze file layouts, and manage routine maintenance workflows through existing compute engines such as [Apache Spark](https://spark.apache.org/) or [RisingWave](https://github.com/risingwavelabs/risingwave).

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

> **Important:** After your first login, we strongly recommend changing the default admin password through the web interface for security. Once changed, the password will be stored in the database and environment variables will no longer be used for authentication.

## Core Capabilities

Nimtable runs between users and Iceberg catalogs.
It provides both a REST API and a browser-based console for interactive metadata management.

```
                     [Users]        [AI agents]        [Apps]

                             +-------------------------+
                             |         NIMTABLE         |
                             +-------------------------+
                                          |
+-------------------------+  +-------------------------+  +-------------------------+
|     Catalog services    |  | Ingestion + compaction  |  |      Query engines      |
|-------------------------|  |-------------------------|  |-------------------------|
| - Hive Metastore        |  | - RisingWave            |  | - Snowflake             |
| - AWS Glue              |  | - Spark                 |  | - Databricks            |
| - Apache Polaris        |  | - Flink                 |  | - DuckDB                |
| - Unity Catalog         |  | - Other engines         |  | - StarRocks             |
| - Lakekeeper            |  |                         |  | - ClickHouse            |
| - Other catalogs        |  |                         |  | - Other engines         |
+-------------------------+  +-------------------------+  +-------------------------+
```
It offers the following capabilities:

- Connect to multiple catalogs including REST, AWS Glue, and S3 Tables.
- Explore tables, schemas, partitions, snapshots, and manifests.
- Run SQL queries directly from the browser for quick inspection.
- Visualize file and snapshot distribution to identify optimization opportunities.
- Integrate with external engines like Spark or RisingWave to manage compaction and maintenance tasks.
- Serve as a standard Iceberg REST Catalog API endpoint.


## Roadmap

For detailed roadmap items and progress tracking, see [Roadmap](https://github.com/nimtable/nimtable/issues/50).

## Contributing

We welcome contributions! Please see our [Contributing Guide](docs/HACKING.md) for details.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
