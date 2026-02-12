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

# Get the script directory and resolve path to docs/platform-db.sql
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$SCRIPT_DIR/.."
SQL_FILE="$PROJECT_ROOT/docs/platform-db.sql"

# Load .env file if it exists
if [ -f "$BACKEND_DIR/.env" ]; then
  echo -e "${YELLOW}Loading environment variables from: $BACKEND_DIR/.env${NC}"
  # Source .env file, but handle potential errors
  set +e
  source "$BACKEND_DIR/.env" 2>/dev/null
  set -e
fi

# Default values
DB_NAME="cms_platform"
MYSQL_USER="root"
MYSQL_PASSWORD=""
USE_SUDO=false

# Try to extract from MYSQL_ROOT_URL if available
if [ -n "$MYSQL_ROOT_URL" ]; then
  echo -e "${YELLOW}Using MYSQL_ROOT_URL from .env${NC}"
  # Parse MYSQL_ROOT_URL: mysql://user:password@host:port/database
  # Extract user, password, host, port from URL
  MYSQL_ROOT_URL_CLEANED="${MYSQL_ROOT_URL#mysql://}"
  if [[ "$MYSQL_ROOT_URL_CLEANED" == *"@"* ]]; then
    # Has authentication
    CREDENTIALS="${MYSQL_ROOT_URL_CLEANED%%@*}"
    HOST_PORT_DB="${MYSQL_ROOT_URL_CLEANED#*@}"
    if [[ "$CREDENTIALS" == *":"* ]]; then
      MYSQL_USER="${CREDENTIALS%%:*}"
      MYSQL_PASSWORD="${CREDENTIALS#*:}"
    else
      MYSQL_USER="$CREDENTIALS"
    fi
  else
    # No authentication
    HOST_PORT_DB="$MYSQL_ROOT_URL_CLEANED"
  fi
  # Extract host and port
  if [[ "$HOST_PORT_DB" == *":"* ]]; then
    HOST_PORT="${HOST_PORT_DB%%/*}"
    if [[ "$HOST_PORT" == *":"* ]]; then
      MYSQL_HOST="${HOST_PORT%%:*}"
      MYSQL_PORT="${HOST_PORT#*:}"
    else
      MYSQL_HOST="$HOST_PORT"
      MYSQL_PORT="3306"
    fi
  else
    MYSQL_HOST="${HOST_PORT_DB%%/*}"
    MYSQL_PORT="3306"
  fi
  # URL decode password (basic handling)
  MYSQL_PASSWORD="${MYSQL_PASSWORD//%40/@}"
  MYSQL_PASSWORD="${MYSQL_PASSWORD//%21/!}"
  MYSQL_PASSWORD="${MYSQL_PASSWORD//%23/#}"
  MYSQL_PASSWORD="${MYSQL_PASSWORD//%24/$}"
  MYSQL_PASSWORD="${MYSQL_PASSWORD//%25/%}"
  MYSQL_PASSWORD="${MYSQL_PASSWORD//%26/&}"
  MYSQL_PASSWORD="${MYSQL_PASSWORD//%2A/*}"
  MYSQL_PASSWORD="${MYSQL_PASSWORD//%2B/+}"
  MYSQL_PASSWORD="${MYSQL_PASSWORD//%2C/,}"
  MYSQL_PASSWORD="${MYSQL_PASSWORD//%2F//}"
  MYSQL_PASSWORD="${MYSQL_PASSWORD//%3A/:}"
  MYSQL_PASSWORD="${MYSQL_PASSWORD//%3B/;}"
  MYSQL_PASSWORD="${MYSQL_PASSWORD//%3D/=}"
  MYSQL_PASSWORD="${MYSQL_PASSWORD//%3F/?}"
  MYSQL_PASSWORD="${MYSQL_PASSWORD//%5B/[}"
  MYSQL_PASSWORD="${MYSQL_PASSWORD//%5D/]}"
fi

# Parse arguments (command-line args override .env)
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
      echo "  --root-password PASSWORD  MySQL root password (overrides .env)"
      echo "  --use-sudo                Use sudo mysql (for auth_socket authentication)"
      echo "  --help                    Show this help message"
      echo ""
      echo "Environment Variables (from backend/.env):"
      echo "  MYSQL_ROOT_URL            MySQL root connection URL (mysql://user:password@host:port/db)"
      echo ""
      echo "The script will automatically load backend/.env if it exists."
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# If MYSQL_PASSWORD is still empty and not using sudo, try to detect auth_socket
if [ -z "$MYSQL_PASSWORD" ] && [ "$USE_SUDO" = false ]; then
  # Check if we can connect without password (auth_socket)
  if ! mysql -u root -e "SELECT 1;" 2>/dev/null; then
    # If connection fails, check if it's auth_socket error
    ERROR_OUTPUT=$(mysql -u root -e "SELECT 1;" 2>&1 || true)
    if echo "$ERROR_OUTPUT" | grep -q "Access denied\|auth_socket\|1698"; then
      echo -e "${YELLOW}Detected auth_socket authentication. Automatically using sudo...${NC}"
      USE_SUDO=true
    fi
  fi
fi

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
  echo -e "${RED}Error: SQL file not found: $SQL_FILE${NC}"
  exit 1
fi

echo -e "${GREEN}Setting up platform database: $DB_NAME${NC}"
echo ""

# Check if database exists
echo -e "${YELLOW}Checking if database exists...${NC}"
DB_EXISTS=$($MYSQL_CMD -e "SHOW DATABASES LIKE '$DB_NAME';" 2>/dev/null | grep -c "$DB_NAME" || true)

# Create database if it doesn't exist
if [ "$DB_EXISTS" -eq 0 ]; then
  echo -e "${YELLOW}Database does not exist. Creating database: $DB_NAME${NC}"
  $MYSQL_CMD -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || {
    echo -e "${RED}Error creating database. Trying with sudo...${NC}"
    if [ "$USE_SUDO" != true ]; then
      USE_SUDO=true
      MYSQL_CMD="sudo mysql"
      $MYSQL_CMD -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    else
      exit 1
    fi
  }
  echo -e "${GREEN}Database created successfully${NC}"
else
  echo -e "${GREEN}Database already exists${NC}"
fi

echo ""

# Check existing tables
echo -e "${YELLOW}Checking existing tables...${NC}"
EXISTING_TABLES=$($MYSQL_CMD -D "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | tail -n +2 || true)

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
if ! $MYSQL_CMD -D "$DB_NAME" < "$SQL_FILE" 2>/dev/null; then
  ERROR_OUTPUT=$($MYSQL_CMD -D "$DB_NAME" < "$SQL_FILE" 2>&1 || true)
  if echo "$ERROR_OUTPUT" | grep -q "Access denied\|auth_socket\|1698"; then
    echo -e "${YELLOW}Access denied. Trying with sudo...${NC}"
    if [ "$USE_SUDO" != true ]; then
      USE_SUDO=true
      MYSQL_CMD=$(build_mysql_cmd)
      $MYSQL_CMD -D "$DB_NAME" < "$SQL_FILE"
    else
      echo -e "${RED}Error: Cannot run SQL file even with sudo${NC}"
      exit 1
    fi
  else
    echo -e "${RED}Error running SQL file: $ERROR_OUTPUT${NC}"
    exit 1
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
TABLES=$($MYSQL_CMD -D "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | tail -n +2 || true)

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
