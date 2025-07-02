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

For a complete development environment with all services, use the `docker/dev` directory:

```bash
cd docker/dev
docker-compose up -d
```

This provides:
- **Frontend**: Next.js app at http://localhost:3000
- **Backend**: Java/Kotlin API at http://localhost:8182
- **Database**: PostgreSQL at localhost:5432
- **REST Catalog**: Iceberg catalog at http://localhost:8181
- **Storage**: MinIO S3-compatible storage at http://localhost:9000
- **Management**: MinIO console at http://localhost:9001

This environment is ideal for:
- Local development with real services
- End-to-end testing
- Catalog integration testing
- S3 storage testing

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

### All-in-one Demo Environment

See https://github.com/nimtable/nimtable-demo

### End-to-End Testing

Nimtable includes comprehensive E2E tests using **Playwright** that test against a real development environment including frontend, backend, database, Iceberg REST catalog, and S3 storage.

**Prerequisites:**
1. Docker and Docker Compose must be running
2. Playwright dependencies installed

**Setup and Run Tests:**
```bash
# Install test dependencies (one-time setup)
pnpm install
pnpm exec playwright install

  # Start the development environment
  cd docker/dev
  docker-compose up -d
  
  # Wait for all services to be ready (optional - tests will wait automatically)
  timeout 60 bash -c 'until curl -f http://localhost:3000; do sleep 2; done'
  timeout 60 bash -c 'until curl -f http://localhost:8182; do sleep 2; done'
  timeout 60 bash -c 'until curl -f http://localhost:8181/v1/config; do sleep 2; done'
  
  # Run all E2E tests
  pnpm run test:e2e
  ```

**Environment Management:**
```bash
# Stop the environment
cd docker/dev && docker-compose down

# Clean restart (removes volumes)
cd docker/dev && docker-compose down -v && docker-compose up -d

# View logs
cd docker/dev && docker-compose logs -f

# View specific service logs
cd docker/dev && docker-compose logs -f nimtable
```

**Test Structure:**
- `e2e/auth/` - Authentication and authorization tests
- `e2e/catalog/` - Catalog management tests
- `e2e/data-query/` - SQL editor and querying tests
- `e2e/integration/` - End-to-end workflow tests
- `e2e/navigation/` - UI navigation tests
- `e2e/user-management/` - User CRUD operations tests

**Service URLs during testing:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8182
- REST Catalog: http://localhost:8181
- MinIO Storage: http://localhost:9000
- MinIO Console: http://localhost:9001
- PostgreSQL: localhost:5432

See the [E2E Testing README](../e2e/README.md) for detailed instructions and troubleshooting.


### Code Quality

```bash
# Frontend linting
pnpm run check       # Check
pnpm run fix         # Fix

# Backend linting
cd backend
./gradlew spotlessCheck  # Check
./gradlew spotlessApply  # Fix
```
