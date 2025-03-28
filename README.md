Iceberg Catalog UI
===================

This is a simple UI for browsing an Iceberg catalog. It's still under development. 🚧

![Screenshot](./docs/screenshot.png)

## Development

To develop, JDK 17 and Node.js >= 23 are required.

Start the server with:

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

## Roadmap

- **UI Features**. There are many features missing now. Please check [Apache Iceberg REST Catalog API](https://raw.githubusercontent.com/apache/iceberg/refs/heads/main/open-api/rest-catalog-open-api.yaml) for the features that are not implemented yet. (Hint: *read the spec with [Swagger UI](https://petstore.swagger.io/) or [Swagger Editor](https://editor-next.swagger.io/)*)
- **Pluggable Query Engines**. Connect to different query engines, such as DuckDB (embedded), Spark, Flink, RisingWave, etc.
- **Table Maintenance**. Run table maintenance operations, such as compaction and garbage collection with pluggable backends.
