#!/bin/bash

# Fix Super Admin Login Issues
# This script verifies and fixes common Super Admin login problems

set -e

DB_NAME="cms_platform"
ADMIN_EMAIL="admin@platform.com"
ADMIN_PASSWORD="admin@123"

echo "🔍 Checking Super Admin User..."
echo "Email: $ADMIN_EMAIL"
echo ""

# Check if user exists
echo "1. Checking if user exists..."
USER_EXISTS=$(sudo mysql -N -e "USE $DB_NAME; SELECT COUNT(*) FROM users WHERE email = '$ADMIN_EMAIL';")

if [ "$USER_EXISTS" -eq 0 ]; then
  echo "❌ User does not exist!"
  echo ""
  echo "Creating Super Admin user..."
  
  # Generate UUID and password hash
  USER_ID=$(uuidgen 2>/dev/null || node -e "const {v4: uuidv4} = require('uuid'); console.log(uuidv4());")
  PASSWORD_HASH=$(cd "$(dirname "$0")/.." && node -e "const bcrypt = require('bcrypt'); bcrypt.hash('$ADMIN_PASSWORD', 10).then(h => console.log(h))")
  
  # Check if Super Admin role exists
  ROLE_ID=$(sudo mysql -N -e "USE $DB_NAME; SELECT id FROM roles WHERE name = 'Super Admin' LIMIT 1;")
  
  if [ -z "$ROLE_ID" ]; then
    echo "❌ Super Admin role does not exist!"
    echo "Creating Super Admin role..."
    ROLE_ID=$(uuidgen 2>/dev/null || node -e "const {v4: uuidv4} = require('uuid'); console.log(uuidv4());")
    sudo mysql -e "USE $DB_NAME; INSERT INTO roles (id, name, description, is_system, created_at, updated_at) VALUES ('$ROLE_ID', 'Super Admin', 'System-wide administrator with full access', 1, NOW(), NOW()) ON DUPLICATE KEY UPDATE name=name;"
  fi
  
  # Create user
  sudo mysql -e "USE $DB_NAME; INSERT INTO users (id, email, password_hash, name, status, created_at, updated_at) VALUES ('$USER_ID', '$ADMIN_EMAIL', '$PASSWORD_HASH', 'Platform Administrator', 1, NOW(), NOW());"
  
  # Assign role
  USER_ROLE_ID=$(uuidgen 2>/dev/null || node -e "const {v4: uuidv4} = require('uuid'); console.log(uuidv4());")
  sudo mysql -e "USE $DB_NAME; INSERT INTO user_roles (id, user_id, role_id, created_at, updated_at) VALUES ('$USER_ROLE_ID', '$USER_ID', '$ROLE_ID', NOW(), NOW());"
  
  echo "✅ Super Admin user created!"
else
  echo "✅ User exists"
  
  # Check user status
  echo ""
  echo "2. Checking user status..."
  USER_STATUS=$(sudo mysql -N -e "USE $DB_NAME; SELECT status FROM users WHERE email = '$ADMIN_EMAIL';")
  
  if [ "$USER_STATUS" != "1" ]; then
    echo "⚠️  User status is $USER_STATUS (should be 1)"
    echo "Fixing user status..."
    sudo mysql -e "USE $DB_NAME; UPDATE users SET status = 1 WHERE email = '$ADMIN_EMAIL';"
    echo "✅ User status updated to active"
  else
    echo "✅ User is active"
  fi
  
  # Check if user has Super Admin role
  echo ""
  echo "3. Checking user roles..."
  HAS_ROLE=$(sudo mysql -N -e "USE $DB_NAME; SELECT COUNT(*) FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE u.email = '$ADMIN_EMAIL' AND r.name = 'Super Admin';")
  
  if [ "$HAS_ROLE" -eq 0 ]; then
    echo "❌ User does not have Super Admin role!"
    echo "Assigning Super Admin role..."
    
    # Get user ID and role ID
    USER_ID=$(sudo mysql -N -e "USE $DB_NAME; SELECT id FROM users WHERE email = '$ADMIN_EMAIL';")
    ROLE_ID=$(sudo mysql -N -e "USE $DB_NAME; SELECT id FROM roles WHERE name = 'Super Admin' LIMIT 1;")
    
    if [ -z "$ROLE_ID" ]; then
      echo "Creating Super Admin role..."
      ROLE_ID=$(uuidgen 2>/dev/null || node -e "const {v4: uuidv4} = require('uuid'); console.log(uuidv4());")
      sudo mysql -e "USE $DB_NAME; INSERT INTO roles (id, name, description, is_system, created_at, updated_at) VALUES ('$ROLE_ID', 'Super Admin', 'System-wide administrator with full access', 1, NOW(), NOW()) ON DUPLICATE KEY UPDATE name=name;"
    fi
    
    USER_ROLE_ID=$(uuidgen 2>/dev/null || node -e "const {v4: uuidv4} = require('uuid'); console.log(uuidv4());")
    sudo mysql -e "USE $DB_NAME; INSERT INTO user_roles (id, user_id, role_id, created_at, updated_at) VALUES ('$USER_ROLE_ID', '$USER_ID', '$ROLE_ID', NOW(), NOW()) ON DUPLICATE KEY UPDATE user_id=user_id;"
    
    echo "✅ Super Admin role assigned"
  else
    echo "✅ User has Super Admin role"
  fi
  
  # Check password hash
  echo ""
  echo "4. Verifying password hash..."
  echo "⚠️  If login still fails, password hash might be incorrect"
  echo "To reset password, run:"
  echo "  cd backend && node -e \"const bcrypt = require('bcrypt'); bcrypt.hash('$ADMIN_PASSWORD', 10).then(console.log)\""
  echo "Then update: UPDATE users SET password_hash = '<hash>' WHERE email = '$ADMIN_EMAIL';"
fi

echo ""
echo "=== Verification Summary ==="
sudo mysql -e "USE $DB_NAME; 
SELECT 
  u.email,
  CASE WHEN u.status = 1 THEN '✅ Active' ELSE '❌ Inactive' END as status,
  COALESCE(r.name, '❌ No role') as role
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = '$ADMIN_EMAIL';"

echo ""
echo "✅ Verification complete!"
echo ""
echo "Try logging in with:"
echo "  Email: $ADMIN_EMAIL"
echo "  Password: $ADMIN_PASSWORD"
