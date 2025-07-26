# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Nimtable is a control plane for Apache Iceberg that provides a web-based interface for managing Iceberg catalogs, tables, and data operations. It consists of:

- **Frontend**: Next.js 15 application with React 19, TypeScript, Tailwind CSS, and shadcn/ui components
- **Backend**: Java 17 application using Jetty server, Apache Iceberg, Apache Spark, and Ebean ORM
- **Database**: PostgreSQL for storing metadata and user data

## Development Commands

### Frontend Development
```bash
# Install dependencies
pnpm install

# Generate Prisma client (required after schema changes or first setup)
pnpm prisma generate

# Start development server
pnpm dev

# Build for production
pnpm build

# Code quality
pnpm run lint           # Check linting
pnpm run lint:fix       # Fix linting issues
pnpm run typecheck      # TypeScript type checking
pnpm run format:check   # Check formatting
pnpm run format:write   # Apply formatting

# Combined commands
pnpm run check          # Run format:check + lint
pnpm run fix            # Run format:write + lint:fix

# API client generation
pnpm run gen-client-api     # Generate main API client from api.yaml
pnpm run gen-acc-client-api # Generate ACC API client

# E2E Testing (Zero Configuration)
pnpm run test:e2e           # Run all E2E tests (completely automated!)
pnpm run test:e2e:ui        # Run tests with interactive UI
pnpm run test:e2e:headed    # Run tests with visible browser
pnpm run test:e2e:debug     # Debug specific tests

# The E2E tests now use Testcontainers to automatically manage the complete docker/dev environment
# No manual setup required - tests start frontend, backend, database, REST catalog, and S3 storage automatically
```

### Backend Development
```bash
cd backend

# Run development server
./gradlew run

# Build application
./gradlew build

# Code quality
./gradlew spotlessCheck  # Check code formatting
./gradlew spotlessApply  # Apply code formatting

# Utility tasks
./gradlew downloadDependencies  # Download all dependencies
./gradlew analyzeDependencies   # Analyze JAR sizes
./gradlew shadowJar            # Create fat JAR
```

### Docker Development
```bash
# Production deployment
cd docker
docker compose up -d

# Development with additional services
cd docker/dev
docker compose up -d
```

## Architecture Overview

### Frontend Architecture
- **App Router**: Next.js 15 with app directory structure
- **State Management**: React Query for server state, React Context for client state
- **Authentication**: JWT-based auth with AuthProvider context
- **AI Integration**: Built-in AI agent for table exploration and SQL assistance
- **UI Components**: shadcn/ui components with Radix UI primitives
- **Database**: Drizzle ORM with PostgreSQL, Prisma for schema management

### Backend Architecture
- **Server**: Jetty-based HTTP server with servlet-based API endpoints
- **Database**: Ebean ORM with PostgreSQL, Flyway for migrations
- **Iceberg Integration**: Direct Apache Iceberg API usage for catalog operations
- **Spark Integration**: Embedded Spark for query execution
- **REST Catalog**: Compatible with Iceberg REST Catalog specification

### Key Directories
- `src/app/`: Next.js app router pages and API routes
- `src/components/`: Reusable React components
- `src/lib/`: Utility functions, API clients, and shared logic
- `backend/src/main/java/io/nimtable/`: Java backend servlets and core logic
- `backend/src/main/resources/`: Configuration files and database migrations

## Database Schema Management

### Frontend (Drizzle + Prisma)
- Schema defined in `src/db/schema.ts` (Drizzle) and `prisma/schema.prisma`
- Run `pnpm prisma generate` after schema changes
- Migrations in `prisma/migrations/`

### Backend (Ebean + Flyway)
- Entity classes in `backend/src/main/java/io/nimtable/db/entity/`
- Repository classes in `backend/src/main/java/io/nimtable/db/repository/`
- Migrations in `backend/src/main/resources/db/migration/postgresql/`

## API Integration

The frontend uses auto-generated API clients:
- Main API client generated from `src/lib/api.yaml`
- ACC API client generated from `src/lib/acc-api/api.yaml`
- Generated clients located in respective `client/` directories

After modifying OpenAPI specifications, run the appropriate generation command.

## Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `ADMIN_USERNAME`/`ADMIN_PASSWORD`: Initial admin credentials
- `JAVA_API_URL`: Backend API URL (for frontend)

### Backend Configuration
- Main config file: `backend/config.yaml`
- Docker config: `docker/docker-compose.yml` (embedded config)
- Supports multiple Iceberg catalog types: Hive, PostgreSQL, REST, AWS Glue, S3 Tables

## AI Agent Integration

The application includes an AI agent for table exploration:
- Context provider: `src/contexts/ai-agent-context.tsx`
- Components: `src/components/ai-agent/`
- Backend integration: `src/app/api/agent/`

## Testing

### E2E Testing with Playwright + Testcontainers (Zero Configuration)
The project includes comprehensive end-to-end tests with **zero manual setup**:
- Authentication flows and session management
- Catalog management with real Iceberg REST catalog + S3 storage
- SQL editor and query execution against real Iceberg tables
- User management and role-based access
- Navigation and responsive UI
- Complete user journey workflows in real environment

### Running E2E Tests
```bash
# One-time setup
pnpm install
pnpm exec playwright install

# Run all tests (completely automated!)
pnpm run test:e2e

# Interactive testing with UI
pnpm run test:e2e:ui

# Run with visible browser
pnpm run test:e2e:headed

# Debug specific tests
pnpm run test:e2e:debug

# Cross-browser testing
pnpm exec playwright test --project=firefox
pnpm exec playwright test --project=webkit

# Run specific test suites
pnpm exec playwright test auth/
pnpm exec playwright test catalog/catalog-management.spec.ts
```

### E2E Test Architecture
- **Testcontainers Integration**: Automatically starts complete docker/dev environment
- **Real Services**: Frontend, backend, PostgreSQL, Iceberg REST catalog, MinIO S3, Spark
- **Dynamic Ports**: All services get dynamic ports to avoid conflicts
- **Health Checks**: Waits for all services to be ready before running tests
- **Auto Cleanup**: Automatically stops and cleans up all containers after tests
- **CI/CD Ready**: Works perfectly in GitHub Actions and other CI systems

## Development Notes

- Always run `pnpm prisma generate` after pulling changes that modify the Prisma schema
- Use the Task tool for complex multi-file searches across the codebase
- Backend requires Java 17+ with specific JVM arguments for Spark compatibility
- Frontend uses strict TypeScript configuration
- Both frontend and backend have code formatting tools that should be run before commits
- E2E tests use custom fixtures in `e2e/fixtures/test-base.ts` for common operations
- Test selectors should be resilient using multiple strategies (`button:has-text("Create"), [data-testid="create-btn"]`)