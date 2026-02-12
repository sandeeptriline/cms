#!/bin/bash

# =============================================================================
# Get Access Token Script
# =============================================================================
# This script logs in as Super Admin and extracts the access token
# Usage: ./get-access-token.sh
# =============================================================================

API_URL="http://localhost:3001/api/v1/auth/platform-admin/login"
EMAIL="admin@example.com"
PASSWORD="admin@123"

echo "🔐 Logging in as Super Admin..."
echo "Email: $EMAIL"
echo ""

# Make login request and extract token
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

# Check if login was successful
if echo "$RESPONSE" | grep -q "accessToken"; then
  # Extract access token
  ACCESS_TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
  REFRESH_TOKEN=$(echo "$RESPONSE" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
  
  echo "✅ Login successful!"
  echo ""
  echo "📋 Access Token:"
  echo "$ACCESS_TOKEN"
  echo ""
  echo "📋 Refresh Token:"
  echo "$REFRESH_TOKEN"
  echo ""
  echo "💡 To use the token, run:"
  echo "export TOKEN=\"$ACCESS_TOKEN\""
  echo ""
  echo "💡 Then test with:"
  echo "curl -X GET http://localhost:3001/api/v1/auth/me -H \"Authorization: Bearer \$TOKEN\""
  echo ""
  
  # Save to file
  echo "$ACCESS_TOKEN" > /tmp/cms_access_token.txt
  echo "💾 Token saved to /tmp/cms_access_token.txt"
else
  echo "❌ Login failed!"
  echo "Response: $RESPONSE"
  exit 1
fi
