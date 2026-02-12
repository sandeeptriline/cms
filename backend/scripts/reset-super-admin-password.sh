#!/bin/bash

# Reset Super Admin Password
# Usage: ./reset-super-admin-password.sh [email] [password]

set -e

DB_NAME="cms_platform"
ADMIN_EMAIL="${1:-admin@platform.com}"
ADMIN_PASSWORD="${2:-admin@123}"

echo "🔐 Resetting Super Admin Password..."
echo "Email: $ADMIN_EMAIL"
echo ""

# Check if user exists
USER_EXISTS=$(sudo mysql -N -e "USE $DB_NAME; SELECT COUNT(*) FROM users WHERE email = '$ADMIN_EMAIL';")

if [ "$USER_EXISTS" -eq 0 ]; then
  echo "❌ User does not exist!"
  echo "Run: ./fix-super-admin-login.sh to create the user"
  exit 1
fi

echo "✅ User exists"
echo ""

# Generate password hash
echo "Generating password hash..."
cd "$(dirname "$0")/.."
PASSWORD_HASH=$(node -e "const bcrypt = require('bcrypt'); bcrypt.hash('$ADMIN_PASSWORD', 10).then(h => console.log(h))")

if [ -z "$PASSWORD_HASH" ]; then
  echo "❌ Failed to generate password hash"
  exit 1
fi

echo "Updating password in database..."
sudo mysql -e "USE $DB_NAME; UPDATE users SET password_hash = '$PASSWORD_HASH', updated_at = NOW() WHERE email = '$ADMIN_EMAIL';"

if [ $? -eq 0 ]; then
  echo "✅ Password updated successfully!"
  echo ""
  echo "You can now login with:"
  echo "  Email: $ADMIN_EMAIL"
  echo "  Password: $ADMIN_PASSWORD"
else
  echo "❌ Failed to update password"
  exit 1
fi
