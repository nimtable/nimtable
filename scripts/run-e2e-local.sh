#!/bin/bash

# Local E2E Test Runner for Nimtable
# This script sets up the environment and runs E2E tests locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if process is running on port
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready at $url..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - $service_name not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within expected time"
    return 1
}

# Function to cleanup background processes
cleanup() {
    print_status "Cleaning up background processes..."
    
    if [ -f .backend.pid ]; then
        kill $(cat .backend.pid) 2>/dev/null || true
        rm .backend.pid
    fi
    
    if [ -f .frontend.pid ]; then
        kill $(cat .frontend.pid) 2>/dev/null || true
        rm .frontend.pid
    fi
    
    # Kill any remaining processes on our ports
    lsof -ti:8182 | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Main script
main() {
    print_status "Starting Nimtable E2E Test Environment"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "Must be run from the project root directory"
        exit 1
    fi
    
    # Parse command line arguments
    HEADLESS=true
    BROWSER="chromium"
    TEST_PATTERN=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --headed)
                HEADLESS=false
                shift
                ;;
            --browser)
                BROWSER="$2"
                shift 2
                ;;
            --test)
                TEST_PATTERN="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --headed         Run tests in headed mode (visible browser)"
                echo "  --browser NAME   Run tests on specific browser (chromium, firefox, webkit)"
                echo "  --test PATTERN   Run specific test pattern"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Check dependencies
    print_status "Checking dependencies..."
    
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is required but not installed"
        exit 1
    fi
    
    if ! command -v java &> /dev/null; then
        print_error "Java is required but not installed"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker not found - you'll need to start PostgreSQL manually"
    fi
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    pnpm install
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    pnpm prisma generate
    
    # Build frontend
    print_status "Building frontend..."
    pnpm run build
    
    # Check if PostgreSQL is running
    if ! check_port 5432; then
        print_warning "PostgreSQL not detected on port 5432"
        print_status "Starting PostgreSQL with Docker..."
        
        docker run -d \
            --name nimtable-postgres-e2e \
            -e POSTGRES_USER=nimtable_user \
            -e POSTGRES_PASSWORD=password \
            -e POSTGRES_DB=nimtable \
            -p 5432:5432 \
            postgres:17
        
        # Wait for PostgreSQL to be ready
        sleep 5
        wait_for_service "postgresql://nimtable_user:password@localhost:5432/nimtable" "PostgreSQL"
    else
        print_success "PostgreSQL is already running"
    fi
    
    # Start backend
    print_status "Starting backend server..."
    cd backend
    
    if check_port 8182; then
        print_warning "Port 8182 is already in use - stopping existing service"
        lsof -ti:8182 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # Build backend
    print_status "Building backend..."
    ./gradlew build -x test
    
    # Start backend in background
    nohup ./gradlew run > ../backend.log 2>&1 &
    echo $! > ../.backend.pid
    cd ..
    
    # Wait for backend to be ready
    wait_for_service "http://localhost:8182" "Backend"
    
    # Start frontend
    print_status "Starting frontend server..."
    
    if check_port 3000; then
        print_warning "Port 3000 is already in use - stopping existing service"
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # Start frontend in background
    nohup pnpm start > frontend.log 2>&1 &
    echo $! > .frontend.pid
    
    # Wait for frontend to be ready
    wait_for_service "http://localhost:3000" "Frontend"
    
    # Install Playwright browsers if needed
    print_status "Installing Playwright browsers..."
    pnpm exec playwright install $BROWSER
    
    # Run E2E tests
    print_status "Running E2E tests..."
    
    # Build test command
    TEST_CMD="pnpm exec playwright test"
    
    if [ "$HEADLESS" = false ]; then
        TEST_CMD="$TEST_CMD --headed"
    fi
    
    if [ "$BROWSER" != "chromium" ]; then
        TEST_CMD="$TEST_CMD --project=$BROWSER"
    fi
    
    if [ -n "$TEST_PATTERN" ]; then
        TEST_CMD="$TEST_CMD $TEST_PATTERN"
    fi
    
    print_status "Running: $TEST_CMD"
    
    # Set environment variables for tests
    export E2E_ADMIN_USERNAME=admin
    export E2E_ADMIN_PASSWORD=admin
    export E2E_API_URL=http://localhost:8182
    export BASE_URL=http://localhost:3000
    
    # Run the tests
    if eval $TEST_CMD; then
        print_success "All E2E tests passed!"
    else
        print_error "Some E2E tests failed"
        
        # Show recent logs on failure
        print_status "Recent backend logs:"
        tail -20 backend.log || true
        
        print_status "Recent frontend logs:"
        tail -20 frontend.log || true
        
        exit 1
    fi
    
    print_success "E2E test run completed successfully!"
}

# Run main function
main "$@"