# Hacking on Nimtable

### Prerequisites

- JDK 17 or later
- Node.js 23 or later
- Docker (optional, for running test catalogs)

### Backend Development

```bash
cd backend
./gradlew run
```

It uses the default config file at `backend/config.yaml`.
To develop with Postgres, start a Postgres with docker or homebrew, and update the config file.
You can also develop with `docker-compose.yml`. See [Docker Development](#docker-development) below.

The backend API will be available at http://localhost:8182.

### Frontend Development

First start the backend server as mentioned above.

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

The UI will be available at http://localhost:3000.

### Docker Development

To setup a more complex development environment, e.g., with Postgres, or with some iceberg catalogs, you can use the `docker/dev` directory.

See the [README there](../docker/dev/README.md) for details.

### API Generation

The frontend API interfaces and types can be automatically generated from the OpenAPI specification:

```bash
# Generate TypeScript interfaces and API client
pnpm run gen-client-api
```

This will generate the API client and types in `sdk.gen.ts` based on the OpenAPI specification in `api.yaml`. After modifying the `api.yaml` file, you should run this command to update the generated code.

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
pnpm run lint        # Check
pnpm run lint --fix  # Fix

# Backend linting
cd backend
./gradlew spotlessCheck  # Check
./gradlew spotlessApply  # Fix
```
