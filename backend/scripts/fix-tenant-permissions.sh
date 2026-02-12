#!/bin/bash

# Script to fix MySQL permissions for a tenant database
# This must be run as MySQL root user

if [ -z "$1" ]; then
  echo "Usage: $0 <tenant-id>"
  echo ""
  echo "Example:"
  echo "  $0 a111e427-2a5a-4119-a235-6e988eaf412b"
  echo ""
  echo "Or fix all tenant databases:"
  echo "  $0 --all"
  echo ""
  exit 1
fi

TENANT_ID="$1"
DB_USER="cms_user"
DB_HOST="localhost"

echo "=========================================="
echo "  Fix Tenant Database Permissions"
echo "=========================================="
echo ""

if [ "$TENANT_ID" = "--all" ]; then
  echo "Fixing permissions for all tenant databases..."
  echo ""
  
  # Get all tenant databases
  TENANT_DBS=$(mysql -u root -p -e "SHOW DATABASES LIKE 'cms_tenant_%';" -s -N 2>/dev/null)
  
  if [ -z "$TENANT_DBS" ]; then
    echo "⚠️  No tenant databases found"
    exit 0
  fi
  
  echo "Found tenant databases:"
  echo "$TENANT_DBS" | while read -r db; do
    echo "  - $db"
  done
  echo ""
  
  echo "Granting privileges..."
  echo "$TENANT_DBS" | while read -r db; do
    echo "  Fixing permissions for $db..."
    mysql -u root -p <<EOF
GRANT ALL PRIVILEGES ON \`$db\`.* TO '$DB_USER'@'$DB_HOST';
FLUSH PRIVILEGES;
EOF
    if [ $? -eq 0 ]; then
      echo "  ✅ Permissions fixed for $db"
    else
      echo "  ❌ Failed to fix permissions for $db"
    fi
  done
  
else
  # First, try to find the database name from the tenant ID
  echo "Looking up tenant database for ID: $TENANT_ID"
  echo ""
  
  # Connect to platform database and get db_name
  DB_NAME=$(mysql -u root -p cms_platform -e "SELECT db_name FROM tenants WHERE id = '$TENANT_ID';" -s -N 2>/dev/null)
  
  if [ -z "$DB_NAME" ]; then
    echo "❌ Tenant not found with ID: $TENANT_ID"
    echo ""
    echo "Available tenants:"
    mysql -u root -p cms_platform -e "SELECT id, name, db_name FROM tenants LIMIT 10;" 2>/dev/null
    exit 1
  fi
  
  echo "Found tenant database: $DB_NAME"
  echo "User: $DB_USER@$DB_HOST"
  echo ""
  
  # Check if database exists
  DB_EXISTS=$(mysql -u root -p -e "SHOW DATABASES LIKE '$DB_NAME';" -s -N 2>/dev/null)
  
  if [ -z "$DB_EXISTS" ]; then
    echo "❌ Database '$DB_NAME' does not exist"
    echo ""
    echo "Available tenant databases:"
    mysql -u root -p -e "SHOW DATABASES LIKE 'cms_tenant_%';" 2>/dev/null
    exit 1
  fi
  
  echo "Granting privileges..."
  mysql -u root -p <<EOF
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'$DB_HOST';
FLUSH PRIVILEGES;
EOF
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Permissions fixed successfully!"
    echo ""
    echo "Verifying privileges..."
    mysql -u root -p -e "SHOW GRANTS FOR '$DB_USER'@'$DB_HOST';" 2>/dev/null | grep "$DB_NAME"
  else
    echo ""
    echo "❌ Failed to fix permissions"
    exit 1
  fi
fi

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="
