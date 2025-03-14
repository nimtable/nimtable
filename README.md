Iceberg Catalog UI
===================

This is a simple UI for browsing an Iceberg catalog. It's still under development. 🚧

## Development

Start the backend server (requires JRE >= 17):

```bash
cd backend
./gradlew run
```

Start the frontend:

```bash
npm install
npm run dev
```

To test the UI, you need to run a catalog server. For example, you can use the [Spark + Iceberg Quickstart Image](https://github.com/databricks/docker-spark-iceberg/).

```bash
git clone https://github.com/databricks/docker-spark-iceberg.git
docker-compose up

docker exec -it spark-iceberg spark-sql # create tables, insert data, etc.
```

## Roadmap

- **UI Features**. There are many features missing now. Please check [Apache Iceberg REST Catalog API](https://raw.githubusercontent.com/apache/iceberg/refs/heads/main/open-api/rest-catalog-open-api.yaml) for the features that are not implemented yet. (Hint: *read the spec with [Swagger UI](https://petstore.swagger.io/) or [Swagger Editor](https://editor-next.swagger.io/)*)
- **Backend Server**. Shall we move to the official Iceberg Java implementation to get more features? such as connecting to JDBC catalog, Hive Metastore, etc.
- **Pluggable Query Engines**. Connect to different query engines, such as DuckDB (embedded), Spark, Flink, RisingWave, etc.