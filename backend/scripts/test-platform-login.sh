#!/bin/bash

# Test Platform Admin Login
# Usage: ./test-platform-login.sh [email] [password]

EMAIL="${1:-admin@platform.com}"
PASSWORD="${2:-admin@123}"
API_URL="${API_URL:-http://localhost:3001/api}"

echo "Testing Platform Admin Login..."
echo "Email: $EMAIL"
echo "API URL: $API_URL"
echo ""

# Test login
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/platform-admin/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status Code: $HTTP_CODE"
echo ""
echo "Response Body:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Login successful!"
  ACCESS_TOKEN=$(echo "$BODY" | jq -r '.accessToken' 2>/dev/null)
  if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
    echo "Access Token: ${ACCESS_TOKEN:0:50}..."
  fi
else
  echo "❌ Login failed!"
  echo ""
  echo "Troubleshooting:"
  echo "1. Check if backend is running: curl $API_URL/health"
  echo "2. Verify Super Admin exists in database"
  echo "3. Check backend logs for errors"
  echo "4. Verify email and password are correct"
fi
