#!/bin/bash

# List only CMS-related databases
# Excludes MySQL system databases

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "CMS Platform Databases:"
echo "======================"

# Get MySQL connection details from .env or use defaults
if [ -f .env ]; then
  source .env
fi

DB_HOST="${MYSQL_HOST:-localhost}"
DB_PORT="${MYSQL_PORT:-3306}"
DB_USER="${MYSQL_USER:-root}"

# Prompt for password if not in environment
if [ -z "$MYSQL_PASSWORD" ]; then
  read -sp "Enter MySQL password for $DB_USER: " DB_PASSWORD
  echo
else
  DB_PASSWORD="$MYSQL_PASSWORD"
fi

# List all databases
ALL_DBS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SHOW DATABASES;" 2>/dev/null | grep -v "Database" | grep -v "information_schema" | grep -v "mysql" | grep -v "performance_schema" | grep -v "sys")

# Filter CMS databases
CMS_PLATFORM_DB=$(echo "$ALL_DBS" | grep -i "^cms_platform$")
CMS_TENANT_DBS=$(echo "$ALL_DBS" | grep -i "^cms_tenant_")

echo ""
echo -e "${GREEN}Platform Database:${NC}"
if [ -z "$CMS_PLATFORM_DB" ]; then
  echo "  (none found)"
else
  echo "  ✓ $CMS_PLATFORM_DB"
fi

echo ""
echo -e "${GREEN}Tenant Databases:${NC}"
if [ -z "$CMS_TENANT_DBS" ]; then
  echo "  (none found)"
else
  echo "$CMS_TENANT_DBS" | while read -r db; do
    echo "  ✓ $db"
  done
fi

echo ""
echo -e "${YELLOW}Excluded Databases (not part of CMS):${NC}"
EXCLUDED_DBS=$(echo "$ALL_DBS" | grep -v -i "^cms_platform$" | grep -v -i "^cms_tenant_")
if [ -z "$EXCLUDED_DBS" ]; then
  echo "  (none)"
else
  echo "$EXCLUDED_DBS" | while read -r db; do
    echo "  ✗ $db (excluded)"
  done
fi

echo ""
echo "Total CMS databases: $(echo "$CMS_PLATFORM_DB" "$CMS_TENANT_DBS" | grep -v "^$" | wc -l)"
