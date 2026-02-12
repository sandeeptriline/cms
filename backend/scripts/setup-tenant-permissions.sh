#!/bin/bash

# =============================================================================
# Setup Tenant Permissions Script
# =============================================================================
# This script sets up permissions and role_permissions tables and seeds data
# Usage:
#   ./setup-tenant-permissions.sh [tenant_db_name]
#   If tenant_db_name is provided, sets up only that tenant
#   If not provided, sets up all tenant databases
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
SQL_DIR="${SCRIPT_DIR}/../docs"

# SQL files
TABLES_SQL="${SQL_DIR}/tenant-role-permissions-tables.sql"
PERMISSIONS_SQL="${SQL_DIR}/tenant-permissions-seed.sql"
ROLES_SQL="${SQL_DIR}/tenant-roles-seed.sql"
ROLE_PERMISSIONS_SQL="${SQL_DIR}/tenant-role-permissions-assign.sql"
UPDATE_USER_ROLES_SQL="${SQL_DIR}/update-user-roles-table.sql"
UPDATE_ROLE_PERMISSIONS_SQL="${SQL_DIR}/update-role-permissions-table.sql"

# Function to setup permissions for a tenant
setup_tenant_permissions() {
    local db_name=$1
    echo -e "${YELLOW}Setting up permissions for tenant: ${db_name}${NC}"
    
    # Check if database exists
    if ! $MYSQL_CMD -e "USE ${db_name}" 2>/dev/null; then
        echo -e "${RED}  ✗ Database ${db_name} does not exist${NC}"
        return 1
    fi
    
    # Step 1: Create tables
    echo -e "${YELLOW}  Step 1: Creating permissions tables...${NC}"
    if $MYSQL_CMD "${db_name}" < "$TABLES_SQL" 2>/dev/null; then
        echo -e "${GREEN}    ✓ Tables created${NC}"
    else
        echo -e "${RED}    ✗ Failed to create tables${NC}"
        return 1
    fi
    
    # Step 2: Update user_roles table
    echo -e "${YELLOW}  Step 2: Updating user_roles table...${NC}"
    if $MYSQL_CMD "${db_name}" < "$UPDATE_USER_ROLES_SQL" 2>/dev/null; then
        echo -e "${GREEN}    ✓ user_roles table updated${NC}"
    else
        echo -e "${YELLOW}    ⚠ user_roles table update skipped (may already be updated)${NC}"
    fi
    
    # Step 3: Seed roles
    echo -e "${YELLOW}  Step 3: Seeding roles...${NC}"
    if $MYSQL_CMD "${db_name}" < "$ROLES_SQL" 2>/dev/null; then
        echo -e "${GREEN}    ✓ Roles seeded${NC}"
    else
        echo -e "${YELLOW}    ⚠ Roles seeding skipped (may already exist)${NC}"
    fi
    
    # Step 4: Seed permissions
    echo -e "${YELLOW}  Step 4: Seeding permissions...${NC}"
    if $MYSQL_CMD "${db_name}" < "$PERMISSIONS_SQL" 2>/dev/null; then
        echo -e "${GREEN}    ✓ Permissions seeded${NC}"
    else
        echo -e "${RED}    ✗ Failed to seed permissions${NC}"
        return 1
    fi
    
    # Step 5: Assign permissions to roles
    echo -e "${YELLOW}  Step 5: Assigning permissions to roles...${NC}"
    if $MYSQL_CMD "${db_name}" < "$ROLE_PERMISSIONS_SQL" 2>/dev/null; then
        echo -e "${GREEN}    ✓ Permissions assigned to roles${NC}"
    else
        echo -e "${RED}    ✗ Failed to assign permissions${NC}"
        return 1
    fi
    
    # Step 6: Update role_permissions table (add updated_at, updated_by if needed)
    echo -e "${YELLOW}  Step 6: Updating role_permissions table...${NC}"
    if $MYSQL_CMD "${db_name}" < "$UPDATE_ROLE_PERMISSIONS_SQL" 2>/dev/null; then
        echo -e "${GREEN}    ✓ role_permissions table updated${NC}"
    else
        echo -e "${YELLOW}    ⚠ role_permissions table update skipped (may already be updated)${NC}"
    fi
    
    echo -e "${GREEN}  ✓ Setup completed successfully${NC}"
    return 0
}

# Main execution
if [ -n "$1" ]; then
    # Setup specific tenant
    setup_tenant_permissions "$1"
else
    # Setup all tenant databases
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
    echo -e "${YELLOW}Setting up permissions for all tenant databases...${NC}"
    echo ""
    
    SUCCESS_COUNT=0
    FAIL_COUNT=0
    
    echo "$TENANT_DBS" | while read -r db; do
        if setup_tenant_permissions "$db"; then
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
