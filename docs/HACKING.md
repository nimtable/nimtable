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

### Environment Variables

Nimtable supports configuration through environment variables.

```bash
# Database connection
DATABASE_URL="postgresql://nimtable_user:password@localhost:5432/nimtable_db?schema=public"

# JWT configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
```
You can set the following environment variables in your `.env` file:

Before starting the application, please copy `.env.example` to `.env` and configure the environment variables according to your needs:

```bash
cp .env.example .env
```

Then edit the `.env` file with your specific configuration values.

To use these environment variables with Docker, you need to explicitly configure them in your `docker-compose.yml` file under the `environment` section of the relevant service.

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
