#!/bin/bash

# Catalog Management E2E Test Runner
# This script helps run catalog tests with better error handling and reporting

set -e

echo "🧪 Nimtable Catalog Management E2E Test Runner"
echo "=============================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required services are running
check_services() {
    echo -e "${BLUE}📋 Checking required services...${NC}"
    
    # Check if frontend is running
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✅ Frontend (localhost:3000) is running${NC}"
    else
        echo -e "${RED}❌ Frontend is not running. Please start with: npm run dev${NC}"
        exit 1
    fi
    
    # Check if backend is running
    if curl -s http://localhost:8182/api/catalogs > /dev/null; then
        echo -e "${GREEN}✅ Backend (localhost:8182) is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend is not running. Some tests may fail.${NC}"
        echo -e "${YELLOW}   Start backend with: cd backend && ./gradlew run${NC}"
    fi
    
    echo ""
}

# Run specific catalog tests
run_tests() {
    local test_pattern=${1:-"e2e/catalog/"}
    local options=${2:-""}
    
    echo -e "${BLUE}🚀 Running catalog tests: ${test_pattern}${NC}"
    echo ""
    
    # Set test environment variables
    export E2E_ADMIN_USERNAME=${E2E_ADMIN_USERNAME:-admin}
    export E2E_ADMIN_PASSWORD=${E2E_ADMIN_PASSWORD:-admin}
    export E2E_API_URL=${E2E_API_URL:-http://localhost:8182}
    export BASE_URL=${BASE_URL:-http://localhost:3000}
    
    # Run the tests
    if npx playwright test ${test_pattern} ${options}; then
        echo -e "${GREEN}✅ Tests completed successfully!${NC}"
    else
        echo -e "${RED}❌ Some tests failed. Check the output above.${NC}"
        echo -e "${YELLOW}💡 Tips for debugging:${NC}"
        echo -e "   • Run with --headed to see browser: npm run test:catalog -- --headed"
        echo -e "   • Run with --debug for step-by-step: npm run test:catalog -- --debug"
        echo -e "   • Check test report: npx playwright show-report"
        exit 1
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  run [pattern]     Run catalog tests (default: all catalog tests)"
    echo "  check            Check services only"
    echo "  debug            Run tests in debug mode"
    echo "  headed           Run tests with visible browser"
    echo "  help             Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 run                          # Run all catalog tests"
    echo "  $0 run catalog-management       # Run specific test file"
    echo "  $0 debug                        # Debug catalog tests"
    echo "  $0 headed                       # Run with visible browser"
    echo ""
    echo "Environment Variables:"
    echo "  E2E_ADMIN_USERNAME              Admin username (default: admin)"
    echo "  E2E_ADMIN_PASSWORD              Admin password (default: admin)"
    echo "  E2E_API_URL                     Backend URL (default: http://localhost:8182)"
    echo "  BASE_URL                        Frontend URL (default: http://localhost:3000)"
}

# Main script logic
case "${1:-run}" in
    "check")
        check_services
        ;;
    "run")
        check_services
        run_tests "${2}"
        ;;
    "debug")
        check_services
        run_tests "e2e/catalog/" "--debug"
        ;;
    "headed")
        check_services
        run_tests "e2e/catalog/" "--headed"
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac 