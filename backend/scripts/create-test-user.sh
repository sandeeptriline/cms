#!/bin/bash

# Script to create a test user for login
# This registers a user in the tenant database

API_URL="http://localhost:3001/api/v1"

if [ -z "$1" ]; then
  echo "Usage: $0 <tenant-id> [email] [password] [name]"
  echo ""
  echo "Example:"
  echo "  $0 a111e427-2a5a-4119-a235-6e988eaf412b"
  echo "  $0 a111e427-2a5a-4119-a235-6e988eaf412b admin@example.com Password123! Admin User"
  echo ""
  exit 1
fi

TENANT_ID="$1"
EMAIL="${2:-admin@example.com}"
PASSWORD="${3:-Password123!}"
NAME="${4:-Admin User}"

echo "=========================================="
echo "  Create Test User for Login"
echo "=========================================="
echo ""

echo "Tenant ID: $TENANT_ID"
echo "Email: $EMAIL"
echo "Password: $PASSWORD"
echo "Name: $NAME"
echo ""

echo "Registering user..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"name\": \"$NAME\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "201" ]; then
  echo "✅ User created successfully!"
  echo ""
  echo "=========================================="
  echo "  Login Credentials"
  echo "=========================================="
  echo ""
  echo "Tenant ID: $TENANT_ID"
  echo "Email:     $EMAIL"
  echo "Password:  $PASSWORD"
  echo ""
  echo "Go to: http://localhost:3000/login"
  echo ""
else
  echo "❌ Failed to create user (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
  echo ""
  
  if echo "$BODY" | grep -q "already exists"; then
    echo "⚠️  User already exists. You can use these credentials to login:"
    echo ""
    echo "Tenant ID: $TENANT_ID"
    echo "Email:     $EMAIL"
    echo "Password:  (use the password you set when creating this user)"
    echo ""
    echo "Or create a new user with a different email."
  fi
  exit 1
fi
