#!/bin/bash

# Script to grant MySQL privileges to cms_user for a tenant database
# This must be run as MySQL root user

if [ -z "$1" ]; then
  echo "Usage: $0 <database-name>"
  echo ""
  echo "Example:"
  echo "  $0 cms_tenant_auth_test_tenant_1"
  echo ""
  echo "Or grant privileges to all tenant databases:"
  echo "  $0 --all"
  echo ""
  exit 1
fi

DB_NAME="$1"
DB_USER="cms_user"
DB_HOST="localhost"

echo "=========================================="
echo "  Grant Tenant Database Privileges"
echo "=========================================="
echo ""

if [ "$DB_NAME" = "--all" ]; then
  echo "Granting privileges to all tenant databases..."
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
    echo "  Granting privileges on $db..."
    mysql -u root -p <<EOF
GRANT ALL PRIVILEGES ON \`$db\`.* TO '$DB_USER'@'$DB_HOST';
FLUSH PRIVILEGES;
EOF
    if [ $? -eq 0 ]; then
      echo "  ✅ Privileges granted for $db"
    else
      echo "  ❌ Failed to grant privileges for $db"
    fi
  done
  
else
  echo "Database: $DB_NAME"
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
    echo "✅ Privileges granted successfully!"
    echo ""
    echo "Verifying privileges..."
    mysql -u root -p -e "SHOW GRANTS FOR '$DB_USER'@'$DB_HOST';" 2>/dev/null | grep "$DB_NAME"
  else
    echo ""
    echo "❌ Failed to grant privileges"
    echo "Make sure you're running as MySQL root user"
    exit 1
  fi
fi

echo ""
echo "Done!"
