#!/bin/bash

# =============================================================================
# Activate User Account
# =============================================================================
# This script activates a user account in a tenant database
# Usage: ./activate-user.sh <tenant_db_name> <user_email>
# Example: ./activate-user.sh cms_tenant_auth_test_tenant_1 user@example.com
# =============================================================================

set -e

TENANT_DB=$1
USER_EMAIL=$2

if [ -z "$TENANT_DB" ] || [ -z "$USER_EMAIL" ]; then
  echo "❌ Usage: $0 <tenant_db_name> <user_email>"
  echo ""
  echo "Example:"
  echo "  $0 cms_tenant_auth_test_tenant_1 user@example.com"
  echo ""
  echo "To find tenant databases:"
  echo "  sudo mysql -e \"SHOW DATABASES LIKE 'cms_tenant_%';\""
  exit 1
fi

echo "🔍 Activating user account..."
echo "  Database: $TENANT_DB"
echo "  Email: $USER_EMAIL"
echo ""

# Check if database exists
DB_EXISTS=$(sudo mysql -N -e "SHOW DATABASES LIKE '$TENANT_DB';" | wc -l)

if [ "$DB_EXISTS" -eq 0 ]; then
  echo "❌ Database '$TENANT_DB' does not exist!"
  echo ""
  echo "Available tenant databases:"
  sudo mysql -e "SHOW DATABASES LIKE 'cms_tenant_%';"
  exit 1
fi

# Check if user exists
USER_EXISTS=$(sudo mysql -N -e "USE $TENANT_DB; SELECT COUNT(*) FROM users WHERE email = '$USER_EMAIL';")

if [ "$USER_EXISTS" -eq 0 ]; then
  echo "❌ User '$USER_EMAIL' not found in database '$TENANT_DB'!"
  echo ""
  echo "Available users in this database:"
  sudo mysql -e "USE $TENANT_DB; SELECT email, name, status FROM users LIMIT 10;"
  exit 1
fi

# Get current status
CURRENT_STATUS=$(sudo mysql -N -e "USE $TENANT_DB; SELECT status FROM users WHERE email = '$USER_EMAIL';")
USER_NAME=$(sudo mysql -N -e "USE $TENANT_DB; SELECT name FROM users WHERE email = '$USER_EMAIL';")

echo "User found:"
echo "  Name: $USER_NAME"
echo "  Current Status: $CURRENT_STATUS"
echo ""

if [ "$CURRENT_STATUS" = "1" ]; then
  echo "✅ User is already active!"
  exit 0
fi

if [ "$CURRENT_STATUS" = "-1" ]; then
  echo "⚠️  User is deleted (status = -1). Restoring and activating..."
  sudo mysql -e "USE $TENANT_DB; UPDATE users SET status = 1, updated_at = NOW() WHERE email = '$USER_EMAIL';"
else
  echo "Activating user..."
  sudo mysql -e "USE $TENANT_DB; UPDATE users SET status = 1, updated_at = NOW() WHERE email = '$USER_EMAIL';"
fi

# Verify
NEW_STATUS=$(sudo mysql -N -e "USE $TENANT_DB; SELECT status FROM users WHERE email = '$USER_EMAIL';")

if [ "$NEW_STATUS" = "1" ]; then
  echo "✅ User activated successfully!"
  echo ""
  echo "You can now login with:"
  echo "  Email: $USER_EMAIL"
  echo ""
  echo "If you still get 'Invalid credentials', the password might be incorrect."
  echo "To reset the password, use: ./reset-user-password.sh $TENANT_DB $USER_EMAIL"
else
  echo "❌ Failed to activate user (status is still $NEW_STATUS)"
  exit 1
fi
