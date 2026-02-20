#!/bin/bash

# Script to fix tenant database permissions and create database if needed
# This must be run as MySQL root user

API_URL="http://localhost:3001/api"

echo "=========================================="
echo "  Fix Tenant Database Permissions"
echo "=========================================="
echo ""

if [ -z "$1" ]; then
  echo "Usage: $0 <tenant-id-or-slug>"
  echo ""
  echo "Example:"
  echo "  $0 a111e427-2a5a-4119-a235-6e988eaf412b"
  echo "  $0 auth-test-tenant-1"
  echo ""
  echo "Or list all tenants first:"
  echo "  curl $API_URL/tenants | jq"
  echo ""
  exit 1
fi

TENANT_IDENTIFIER="$1"

echo "Looking up tenant: $TENANT_IDENTIFIER"
echo ""

# Try to get tenant by ID first
TENANT_RESPONSE=$(curl -s "$API_URL/tenants/$TENANT_IDENTIFIER" 2>&1)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/tenants/$TENANT_IDENTIFIER")

# If not found by ID, try by slug
if [ "$HTTP_CODE" != "200" ]; then
  echo "Not found by ID, trying by slug..."
  TENANT_RESPONSE=$(curl -s "$API_URL/tenants/slug/$TENANT_IDENTIFIER" 2>&1)
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/tenants/slug/$TENANT_IDENTIFIER")
fi

# Check if we got a valid response
if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Tenant not found: $TENANT_IDENTIFIER"
  exit 1
fi

# Extract tenant info using jq if available, otherwise use grep
if command -v jq &> /dev/null; then
  DB_NAME=$(echo "$TENANT_RESPONSE" | jq -r '.dbName // .db_name')
  TENANT_NAME=$(echo "$TENANT_RESPONSE" | jq -r '.name')
  TENANT_STATUS=$(echo "$TENANT_RESPONSE" | jq -r '.status')
else
  DB_NAME=$(echo "$TENANT_RESPONSE" | grep -o '"db_name":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -z "$DB_NAME" ]; then
    DB_NAME=$(echo "$TENANT_RESPONSE" | grep -o '"dbName":"[^"]*"' | head -1 | cut -d'"' -f4)
  fi
  TENANT_NAME=$(echo "$TENANT_RESPONSE" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
  TENANT_STATUS=$(echo "$TENANT_RESPONSE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

if [ -z "$DB_NAME" ]; then
  echo "❌ Could not extract database name from tenant response"
  echo "Response: $TENANT_RESPONSE"
  exit 1
fi

echo "Tenant: $TENANT_NAME"
echo "Database: $DB_NAME"
echo "Status: $TENANT_STATUS"
echo ""

# Check if database exists
DB_EXISTS=$(mysql -u root -p -e "SHOW DATABASES LIKE '$DB_NAME';" -s -N 2>/dev/null)

if [ -z "$DB_EXISTS" ]; then
  echo "⚠️  Database '$DB_NAME' does not exist"
  echo ""
  read -p "Create the database now? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating database..."
    mysql -u root -p <<EOF
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF
    if [ $? -eq 0 ]; then
      echo "✅ Database created successfully"
    else
      echo "❌ Failed to create database"
      exit 1
    fi
  else
    echo "Skipping database creation"
    exit 1
  fi
else
  echo "✅ Database exists"
fi

echo ""
echo "Granting privileges to cms_user..."
mysql -u root -p <<EOF
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
  echo "✅ Privileges granted successfully!"
  echo ""
  echo "Verifying privileges..."
  mysql -u root -p -e "SHOW GRANTS FOR 'cms_user'@'localhost';" 2>/dev/null | grep "$DB_NAME" || echo "⚠️  Could not verify (this is okay if privileges were granted)"
else
  echo "❌ Failed to grant privileges"
  echo "Make sure you're running as MySQL root user"
  exit 1
fi

echo ""
echo "Done! You can now use tenant ID: $TENANT_IDENTIFIER"
