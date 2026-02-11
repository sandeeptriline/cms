#!/bin/bash

# Script to list all tenant databases and their status

echo "=========================================="
echo "  List Tenant Databases"
echo "=========================================="
echo ""

echo "Checking MySQL for tenant databases..."
echo ""

# List all tenant databases
TENANT_DBS=$(mysql -u root -p -e "SHOW DATABASES LIKE 'cms_tenant_%';" -s -N 2>/dev/null)

if [ -z "$TENANT_DBS" ]; then
  echo "⚠️  No tenant databases found in MySQL"
  echo ""
  echo "This could mean:"
  echo "  1. No tenants have been created yet"
  echo "  2. Tenant provisioning failed"
  echo "  3. Databases were created with a different naming pattern"
  echo ""
  echo "All databases:"
  mysql -u root -p -e "SHOW DATABASES;" 2>/dev/null | grep -E "cms|tenant" || echo "  (none found)"
else
  echo "Found tenant databases:"
  echo ""
  echo "$TENANT_DBS" | while read -r db; do
    echo "  📦 $db"
    
    # Check if cms_user has privileges
    PRIVILEGES=$(mysql -u root -p -e "SHOW GRANTS FOR 'cms_user'@'localhost';" 2>/dev/null | grep "$db" || echo "")
    if [ -z "$PRIVILEGES" ]; then
      echo "     ⚠️  No privileges for cms_user"
    else
      echo "     ✅ Privileges granted"
    fi
  done
fi

echo ""
echo "To grant privileges to a specific database, run:"
echo "  ./scripts/fix-tenant-database.sh <tenant-id-or-slug>"
echo ""
echo "Or grant to all tenant databases:"
echo "  ./scripts/grant-tenant-privileges.sh --all"
