#!/bin/bash

# Quick fix script for missing tenant database
# This will create the database and grant privileges automatically

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
echo "  Fix Missing Tenant Database"
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

# Check if database exists
echo "Checking if database exists (you'll be prompted for MySQL root password)..."
DB_EXISTS=$(mysql -u root -p -e "SHOW DATABASES LIKE '$DB_NAME';" -s -N 2>/dev/null)

if [ -z "$DB_EXISTS" ]; then
  echo "⚠️  Database '$DB_NAME' does not exist. Creating..."
  echo "Enter MySQL root password when prompted:"
  
  mysql -u root -p <<EOF
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;
EOF

  if [ $? -eq 0 ]; then
    echo "✅ Database created and privileges granted!"
  else
    echo "❌ Failed to create database"
    exit 1
  fi
else
  echo "✅ Database exists"
  echo ""
  echo "Granting privileges (enter MySQL root password when prompted)..."
  mysql -u root -p <<EOF
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;
EOF
  if [ $? -eq 0 ]; then
    echo "✅ Privileges granted!"
  else
    echo "❌ Failed to grant privileges"
    exit 1
  fi
fi

echo ""
echo "✅ Done! You can now login with tenant ID: $TENANT_ID"
