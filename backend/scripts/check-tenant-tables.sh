#!/bin/bash

# Script to check if tenant database has tables

API_URL="http://localhost:3001/api"

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
echo "  Check Tenant Database Tables"
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

# Check tables
echo "Checking tables (enter MySQL root password when prompted)..."
TABLES=$(mysql -u root -p -e "USE \`$DB_NAME\`; SHOW TABLES;" -s -N 2>/dev/null)

if [ -z "$TABLES" ]; then
  echo "❌ No tables found in database!"
  echo ""
  echo "Run migrations with:"
  echo "  ./scripts/run-tenant-migrations.sh $TENANT_ID"
  exit 1
fi

TABLE_COUNT=$(echo "$TABLES" | wc -l)
echo "✅ Found $TABLE_COUNT tables:"
echo ""
echo "$TABLES" | head -20

if [ "$TABLE_COUNT" -gt 20 ]; then
  echo "... and $((TABLE_COUNT - 20)) more"
fi

echo ""
echo "Checking for critical tables..."

# Check for users table
if echo "$TABLES" | grep -q "^users$"; then
  echo "✅ users table exists"
else
  echo "❌ users table MISSING"
fi

# Check for projects table
if echo "$TABLES" | grep -q "^projects$"; then
  echo "✅ projects table exists"
else
  echo "❌ projects table MISSING"
fi

# Check for content_types table
if echo "$TABLES" | grep -q "^content_types$"; then
  echo "✅ content_types table exists"
else
  echo "❌ content_types table MISSING"
fi

echo ""
echo "Done!"
