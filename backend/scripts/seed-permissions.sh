#!/bin/bash

# =============================================================================
# Seed Platform Permissions Script
# =============================================================================
# This script seeds all platform-level permissions and assigns them to Super Admin
# Run this after creating the permissions and role_permissions tables

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SQL_FILE="$SCRIPT_DIR/seed-permissions.sql"

echo -e "${GREEN}Seeding Platform Permissions...${NC}"

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}Error: SQL file not found: $SQL_FILE${NC}"
    exit 1
fi

# Check if MySQL is available
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}Error: mysql command not found${NC}"
    exit 1
fi

# Get database connection details from .env or use defaults
if [ -f "$PROJECT_ROOT/backend/.env" ]; then
    source "$PROJECT_ROOT/backend/.env"
fi

DB_NAME="${DATABASE_NAME:-cms_platform}"
DB_USER="${DATABASE_USER:-cms_user}"
DB_PASS="${DATABASE_PASSWORD:-password}"
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-3306}"

echo -e "${YELLOW}Database: $DB_NAME${NC}"
echo -e "${YELLOW}User: $DB_USER${NC}"
echo -e "${YELLOW}Host: $DB_HOST:$DB_PORT${NC}"

# Check if database exists
if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME" 2>/dev/null; then
    echo -e "${RED}Error: Database '$DB_NAME' does not exist or cannot be accessed${NC}"
    exit 1
fi

# Check if permissions table exists
if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "DESCRIBE permissions" &>/dev/null; then
    echo -e "${RED}Error: 'permissions' table does not exist. Please run platform-db.sql first.${NC}"
    exit 1
fi

# Check if Super Admin role exists
SUPER_ADMIN_EXISTS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM roles WHERE name = 'Super Admin'")

if [ "$SUPER_ADMIN_EXISTS" -eq 0 ]; then
    echo -e "${YELLOW}Warning: Super Admin role does not exist. Creating it...${NC}"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" <<EOF
INSERT INTO roles (id, name, description, is_system, created_at, updated_at)
VALUES (UUID(), 'Super Admin', 'System-wide administrator with full access', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=name;
EOF
fi

# Run SQL script
echo -e "${GREEN}Running permissions seed script...${NC}"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Permissions seeded successfully!${NC}"
    
    # Count permissions
    PERM_COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM permissions")
    echo -e "${GREEN}✓ Total permissions: $PERM_COUNT${NC}"
    
    # Count role permissions for Super Admin
    ROLE_PERM_COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM role_permissions rp JOIN roles r ON rp.role_id = r.id WHERE r.name = 'Super Admin'")
    echo -e "${GREEN}✓ Permissions assigned to Super Admin: $ROLE_PERM_COUNT${NC}"
else
    echo -e "${RED}✗ Error seeding permissions${NC}"
    exit 1
fi

echo -e "${GREEN}Done!${NC}"
