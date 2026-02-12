#!/bin/bash

# =============================================================================
# Setup Platform Database Script
# =============================================================================
# This script creates/updates the platform database schema
# Database: cms_platform
#
# Usage:
#   ./setup-platform-database.sh
#   ./setup-platform-database.sh --root-password "your_password"
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
DB_NAME="cms_platform"
# Get the script directory and resolve path to docs/platform-db.sql
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SQL_FILE="$PROJECT_ROOT/docs/platform-db.sql"
MYSQL_USER="root"
MYSQL_PASSWORD=""
USE_SUDO=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --root-password)
      MYSQL_PASSWORD="$2"
      shift 2
      ;;
    --use-sudo)
      USE_SUDO=true
      shift
      ;;
    --help)
      echo "Usage: $0 [--root-password PASSWORD] [--use-sudo]"
      echo ""
      echo "Options:"
      echo "  --root-password PASSWORD  MySQL root password"
      echo "  --use-sudo                Use sudo mysql (for auth_socket authentication)"
      echo "  --help                    Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
  echo -e "${RED}Error: SQL file not found: $SQL_FILE${NC}"
  exit 1
fi

echo -e "${GREEN}Setting up platform database: $DB_NAME${NC}"
echo ""

# Check if database exists
echo -e "${YELLOW}Checking if database exists...${NC}"
if [ "$USE_SUDO" = true ]; then
  DB_EXISTS=$(sudo mysql -e "SHOW DATABASES LIKE '$DB_NAME';" | grep -c "$DB_NAME" || true)
else
  if [ -z "$MYSQL_PASSWORD" ]; then
    DB_EXISTS=$(mysql -u "$MYSQL_USER" -e "SHOW DATABASES LIKE '$DB_NAME';" 2>/dev/null | grep -c "$DB_NAME" || true)
  else
    DB_EXISTS=$(mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SHOW DATABASES LIKE '$DB_NAME';" 2>/dev/null | grep -c "$DB_NAME" || true)
  fi
fi

# Create database if it doesn't exist
if [ "$DB_EXISTS" -eq 0 ]; then
  echo -e "${YELLOW}Database does not exist. Creating database: $DB_NAME${NC}"
  if [ "$USE_SUDO" = true ]; then
    sudo mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  else
    if [ -z "$MYSQL_PASSWORD" ]; then
      mysql -u "$MYSQL_USER" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    else
      mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    fi
  fi
  echo -e "${GREEN}Database created successfully${NC}"
else
  echo -e "${GREEN}Database already exists${NC}"
fi

echo ""

# Check existing tables
echo -e "${YELLOW}Checking existing tables...${NC}"
if [ "$USE_SUDO" = true ]; then
  EXISTING_TABLES=$(sudo mysql -D "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | tail -n +2 || true)
else
  if [ -z "$MYSQL_PASSWORD" ]; then
    EXISTING_TABLES=$(mysql -u "$MYSQL_USER" -D "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | tail -n +2 || true)
  else
    EXISTING_TABLES=$(mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -D "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | tail -n +2 || true)
  fi
fi

if [ -n "$EXISTING_TABLES" ]; then
  echo -e "${YELLOW}Existing tables:${NC}"
  echo "$EXISTING_TABLES" | while read -r table; do
    echo "  - $table"
  done
  echo ""
  echo -e "${YELLOW}Note: This script uses 'CREATE TABLE IF NOT EXISTS', so existing tables will not be modified.${NC}"
  echo -e "${YELLOW}If you need to update table structures, you may need to run ALTER TABLE statements manually.${NC}"
  echo ""
fi

# Run SQL file
echo -e "${YELLOW}Running SQL file: $SQL_FILE${NC}"
if [ "$USE_SUDO" = true ]; then
  sudo mysql -D "$DB_NAME" < "$SQL_FILE"
else
  if [ -z "$MYSQL_PASSWORD" ]; then
    mysql -u "$MYSQL_USER" -D "$DB_NAME" < "$SQL_FILE"
  else
    mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -D "$DB_NAME" < "$SQL_FILE"
  fi
fi

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ SQL file executed successfully${NC}"
else
  echo -e "${RED}✗ Error executing SQL file${NC}"
  exit 1
fi

echo ""

# Verify tables were created
echo -e "${YELLOW}Verifying tables...${NC}"
if [ "$USE_SUDO" = true ]; then
  TABLES=$(sudo mysql -D "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | tail -n +2 || true)
else
  if [ -z "$MYSQL_PASSWORD" ]; then
    TABLES=$(mysql -u "$MYSQL_USER" -D "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | tail -n +2 || true)
  else
    TABLES=$(mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -D "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | tail -n +2 || true)
  fi
fi

echo -e "${GREEN}Tables in database:${NC}"
echo "$TABLES" | while read -r table; do
  echo "  ✓ $table"
done

echo ""
echo -e "${GREEN}Platform database setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Verify tables: mysql -u root -p -D $DB_NAME -e 'SHOW TABLES;'"
echo "  2. Check users table: mysql -u root -p -D $DB_NAME -e 'DESCRIBE users;'"
echo "  3. Check roles table: mysql -u root -p -D $DB_NAME -e 'DESCRIBE roles;'"
echo "  4. Check user_roles table: mysql -u root -p -D $DB_NAME -e 'DESCRIBE user_roles;'"
echo "  5. Create Super Admin user (see backend/docs/setup/CREATE_SUPER_ADMIN.md)"
