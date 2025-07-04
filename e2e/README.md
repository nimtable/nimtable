# E2E Testing with Playwright

This directory contains end-to-end tests for Nimtable using Playwright.

## Prerequisites

Before running tests, you need to manually start the development environment.

### Required Services
- PostgreSQL database
- Nimtable backend (Java/Kotlin)
- Nimtable frontend (Next.js)
- REST catalog service
- MinIO object storage

## Setup and Running Tests

### 1. Start Development Environment

First, start the Docker development environment manually:

```bash
# Navigate to docker dev directory
cd docker/dev

# Start all services
docker-compose up -d

# Check all services are running
docker-compose ps
```

Wait for all services to be ready:
- **Database**: PostgreSQL should be healthy
- **Backend**: Look for "Server started" message
- **Frontend**: Look for "Ready" message  
- **REST Catalog**: Should respond to http://localhost:8181/v1/config
- **MinIO**: Should show "MinIO Object Storage Server" started

### 2. Verify Services

Check that all services are accessible:

```bash
# Frontend (should show Nimtable UI)
curl http://localhost:3000

# Backend API (should return JSON)
curl http://localhost:8182/health

# REST Catalog (should return config)
curl http://localhost:8181/v1/config

# MinIO (should return XML)
curl http://localhost:9000
```

### 3. Run Tests

Once the environment is ready, run the tests:

```bash
# Run all e2e tests
npx playwright test

# Run specific test file
npx playwright test e2e/catalog/catalog-management.spec.ts

# Run with UI mode (interactive)
npx playwright test --ui

# Run with debug mode
npx playwright test --debug

# Run with browser visible
npx playwright test --headed
```

## Service URLs

When the environment is running, services are available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8182
- **REST Catalog**: http://localhost:8181
- **MinIO Storage**: http://localhost:9000
- **MinIO Console**: http://localhost:9001
- **PostgreSQL**: localhost:5432

## Environment Management

### Starting Services
```bash
cd docker/dev
docker-compose up -d
```

### Stopping Services
```bash
cd docker/dev
docker-compose down
```

### Restarting a Specific Service
```bash
cd docker/dev
docker-compose restart nimtable
docker-compose restart nimtable-web
```

### Viewing Logs
```bash
cd docker/dev

# All services
docker-compose logs -f

# Specific service
docker-compose logs -f nimtable
docker-compose logs -f nimtable-web
docker-compose logs -f database
```

### Rebuilding Services
```bash
cd docker/dev

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## Test Structure

### Test Categories
- `auth/` - Authentication and authorization tests
- `catalog/` - Catalog management tests
- `data-query/` - SQL editor and data querying tests
- `integration/` - End-to-end workflow tests
- `navigation/` - UI navigation tests
- `user-management/` - User CRUD operations tests

### Fixtures
- `test-base.ts` - Base test configuration and common utilities
- `iceberg-testcontainer.ts` - Iceberg-specific test containers (legacy)

## Configuration

### Environment Variables
- `BASE_URL` - Frontend URL (default: http://localhost:3000)
- `CI` - Enables CI-specific settings

### Playwright Configuration
- Single worker to avoid conflicts
- Automatic retries on CI
- Screenshots and videos on failure
- HTML and JSON reporting

## Troubleshooting

### Common Issues

1. **Services not ready**: Wait longer for services to start completely
   ```bash
   # Check service health
   docker-compose ps
   docker-compose logs nimtable
   ```

2. **Port conflicts**: Make sure ports 3000, 8182, 8181, 9000, 9001, 5432 are available
   ```bash
   # Check which ports are in use
   lsof -i :3000
   lsof -i :8182
   ```

3. **Database issues**: Reset the database if needed
   ```bash
   cd docker/dev
   docker-compose down -v  # Remove volumes
   docker-compose up -d
   ```

4. **Frontend not compiling**: Check frontend logs and restart
   ```bash
   docker-compose logs nimtable-web
   docker-compose restart nimtable-web
   ```

### Debug Tips

1. **Check service logs**: Use `docker-compose logs -f <service>` to see real-time logs
2. **Interactive debugging**: Add `await page.pause()` in tests for step-by-step debugging
3. **Browser dev tools**: Use `--headed` flag to see browser actions
4. **Network issues**: Verify services are accessible from host machine
5. **Test isolation**: Run single test files to isolate issues

### Performance

- Tests run sequentially (single worker) to avoid auth conflicts
- Each test should complete in <30 seconds
- Full test suite should complete in <5 minutes
- Services startup takes ~30-60 seconds

### Clean Environment

For a completely clean test environment:

```bash
cd docker/dev

# Stop and remove everything
docker-compose down -v --remove-orphans

# Remove any leftover containers
docker system prune -f

# Start fresh
docker-compose up -d
```

## CI/CD

For CI environments, ensure:
1. Docker and Docker Compose are available
2. Required ports are not blocked
3. Sufficient memory and disk space
4. Consider using `--no-deps` flags for faster startup

### GitHub Actions Example
```yaml
steps:
  - name: Start services
    run: |
      cd docker/dev
      docker-compose up -d
      
  - name: Wait for services
    run: |
      timeout 60 bash -c 'until curl -f http://localhost:3000; do sleep 2; done'
      
  - name: Run tests
    run: npx playwright test
    
  - name: Cleanup
    if: always()
    run: |
      cd docker/dev
      docker-compose down -v
```
