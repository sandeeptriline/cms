#!/bin/bash

# Script to run tenant database migrations for an existing tenant
# This creates all tables in the tenant database

API_URL="http://localhost:3001/api"

# Find schema file (relative to script location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="$SCRIPT_DIR/../../docs/tenant-db.sql"

if [ -z "$1" ]; then
  echo "Usage: $0 <tenant-id>"
  echo ""
  echo "Example:"
  echo "  $0 a111e427-2a5a-4119-a235-6e988eaf412b"
  echo ""
  exit 1
fi

TENANT_ID="$1"

echo "=========================================="
echo "  Run Tenant Database Migrations"
echo "=========================================="
echo ""

# Get tenant info
echo "Fetching tenant info..."
TENANT_RESPONSE=$(curl -s "$API_URL/tenants/$TENANT_ID")

if echo "$TENANT_RESPONSE" | grep -q "not found"; then
  echo "❌ Tenant not found: $TENANT_ID"
  exit 1
fi

# Extract database name
DB_NAME=$(echo "$TENANT_RESPONSE" | grep -o '"db_name":"[^"]*"' | head -1 | cut -d'"' -f4)
TENANT_NAME=$(echo "$TENANT_RESPONSE" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$DB_NAME" ]; then
  echo "❌ Could not extract database name"
  echo "Response: $TENANT_RESPONSE"
  exit 1
fi

echo "Tenant: $TENANT_NAME"
echo "Database: $DB_NAME"
echo ""

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
  echo "❌ Schema file not found: $SCHEMA_FILE"
  echo "   Please ensure the file exists relative to this script"
  exit 1
fi

echo "Running migrations from: $SCHEMA_FILE"
echo ""
echo "Note: If you get 'Access denied', your MySQL root uses auth_socket."
echo "      The script will try sudo mysql (no password needed)."
echo ""

# Drop the problematic constraint if it exists (for idempotent migrations)
echo "Preparing database (dropping existing constraint if present)..."
sudo mysql "$DB_NAME" <<EOF 2>/dev/null
ALTER TABLE content_entries DROP FOREIGN KEY fk_content_entries_published_version;
EOF
# Ignore errors if constraint doesn't exist

echo ""
echo "Running migrations..."

# Run the SQL file using sudo (works with auth_socket)
sudo mysql "$DB_NAME" < "$SCHEMA_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migrations completed successfully!"
  echo ""
  echo "Verifying tables..."
  TABLE_COUNT=$(sudo mysql -e "USE \`$DB_NAME\`; SHOW TABLES;" -s -N 2>/dev/null | wc -l)
  echo "   Found $TABLE_COUNT tables in database"
else
  echo ""
  echo "❌ Migrations failed"
  echo ""
  echo "If you got 'Access denied', you may need to:"
  echo "  1. Run: sudo mysql"
  echo "  2. Then: ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Sandeep@123!';"
  echo "  3. See: backend/docs/troubleshooting/MYSQL_AUTH_FIX.md"
  exit 1
fi

echo ""
echo "✅ Done! Tenant database is now fully provisioned."
