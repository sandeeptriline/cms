#!/bin/bash

# =============================================================================
# Seed Tenant Roles Script
# =============================================================================
# This script seeds default roles into tenant databases
# Usage:
#   ./seed-tenant-roles.sh [tenant_db_name]
#   If tenant_db_name is provided, seeds only that tenant
#   If not provided, seeds all tenant databases
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get MySQL credentials from environment or use defaults
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-}"
MYSQL_HOST="${MYSQL_HOST:-localhost}"
MYSQL_PORT="${MYSQL_PORT:-3306}"

# Build MySQL command
if [ -z "$MYSQL_PASSWORD" ]; then
    MYSQL_CMD="mysql -h${MYSQL_HOST} -P${MYSQL_PORT} -u${MYSQL_USER}"
else
    MYSQL_CMD="mysql -h${MYSQL_HOST} -P${MYSQL_PORT} -u${MYSQL_USER} -p${MYSQL_PASSWORD}"
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="${SCRIPT_DIR}/../docs/tenant-roles-seed.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}Error: SQL file not found at $SQL_FILE${NC}"
    exit 1
fi

# Function to seed roles for a tenant
seed_tenant_roles() {
    local db_name=$1
    echo -e "${YELLOW}Seeding roles for tenant: ${db_name}${NC}"
    
    # Check if database exists
    if ! $MYSQL_CMD -e "USE ${db_name}" 2>/dev/null; then
        echo -e "${RED}  ✗ Database ${db_name} does not exist${NC}"
        return 1
    fi
    
    # Execute SQL
    if $MYSQL_CMD "${db_name}" < "$SQL_FILE" 2>/dev/null; then
        echo -e "${GREEN}  ✓ Roles seeded successfully${NC}"
        
        # Verify roles
        echo -e "${YELLOW}  Verifying roles...${NC}"
        $MYSQL_CMD "${db_name}" -e "SELECT name, description FROM roles ORDER BY name;" 2>/dev/null || true
        return 0
    else
        echo -e "${RED}  ✗ Failed to seed roles${NC}"
        return 1
    fi
}

# Main execution
if [ -n "$1" ]; then
    # Seed specific tenant
    seed_tenant_roles "$1"
else
    # Seed all tenant databases
    echo -e "${YELLOW}Finding all tenant databases...${NC}"
    
    # Get all tenant database names
    TENANT_DBS=$($MYSQL_CMD -N -e "SHOW DATABASES LIKE 'cms_tenant_%';" 2>/dev/null || echo "")
    
    if [ -z "$TENANT_DBS" ]; then
        echo -e "${YELLOW}No tenant databases found${NC}"
        exit 0
    fi
    
    echo -e "${GREEN}Found tenant databases:${NC}"
    echo "$TENANT_DBS" | while read -r db; do
        echo "  - $db"
    done
    
    echo ""
    echo -e "${YELLOW}Seeding roles for all tenant databases...${NC}"
    echo ""
    
    SUCCESS_COUNT=0
    FAIL_COUNT=0
    
    echo "$TENANT_DBS" | while read -r db; do
        if seed_tenant_roles "$db"; then
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
        echo ""
    done
    
    echo -e "${GREEN}Summary:${NC}"
    echo -e "  Success: ${SUCCESS_COUNT}"
    echo -e "  Failed: ${FAIL_COUNT}"
fi

echo -e "${GREEN}Done!${NC}"
