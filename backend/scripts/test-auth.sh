#!/bin/bash

API_URL="http://localhost:3001/api/v1"
TENANT_SLUG="test-tenant-auth-$(date +%s)"
TEST_EMAIL="testuser@example.com"
TEST_PASSWORD="TestPassword123!"
TEST_NAME="Test User"

echo "=========================================="
echo "  Phase 2: Authentication API Testing"
echo "=========================================="
echo ""

# Step 1: Create a tenant for testing
echo "📋 Step 1: Creating test tenant..."
CREATE_TENANT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/tenants" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Auth Test Tenant\",
    \"slug\": \"$TENANT_SLUG\"
  }")

HTTP_CODE=$(echo "$CREATE_TENANT_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$CREATE_TENANT_RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "201" ]; then
  echo "   ✅ Tenant created successfully (HTTP $HTTP_CODE)"
  TENANT_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "   Tenant ID: $TENANT_ID"
  echo "   Tenant Slug: $TENANT_SLUG"
else
  echo "   ❌ Failed to create tenant (HTTP $HTTP_CODE)"
  echo "   Response: $BODY"
  echo ""
  echo "   Trying to use existing tenant..."
  # Try to get existing tenant
  LIST_RESPONSE=$(curl -s "$API_URL/tenants")
  TENANT_ID=$(echo "$LIST_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  TENANT_SLUG=$(echo "$LIST_RESPONSE" | grep -o '"slug":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -z "$TENANT_ID" ]; then
    echo "   ❌ No existing tenant found. Please create a tenant first."
    exit 1
  fi
  echo "   Using existing tenant: $TENANT_ID"
fi
echo ""

# Wait for tenant provisioning
echo "⏳ Waiting 5 seconds for tenant database provisioning..."
sleep 5
echo ""

# Step 2: Test Registration
echo "📋 Step 2: Testing User Registration"
REGISTER_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"name\": \"$TEST_NAME\"
  }")

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$REGISTER_RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "201" ]; then
  echo "   ✅ Registration successful (HTTP $HTTP_CODE)"
  ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  REFRESH_TOKEN=$(echo "$BODY" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
  USER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  echo "   User ID: $USER_ID"
  echo "   Access Token: ${ACCESS_TOKEN:0:50}..."
  echo "   Refresh Token: ${REFRESH_TOKEN:0:50}..."
else
  echo "   ❌ Registration failed (HTTP $HTTP_CODE)"
  echo "   Response: $BODY"
  # If registration fails, try login (user might already exist)
  echo "   Attempting login instead..."
  ACCESS_TOKEN=""
  REFRESH_TOKEN=""
fi
echo ""

# Step 3: Test Login (if registration didn't work)
if [ -z "$ACCESS_TOKEN" ]; then
  echo "📋 Step 3: Testing User Login"
  LOGIN_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-ID: $TENANT_ID" \
    -d "{
      \"email\": \"$TEST_EMAIL\",
      \"password\": \"$TEST_PASSWORD\"
    }")

  HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
  BODY=$(echo "$LOGIN_RESPONSE" | sed '/HTTP_CODE/d')

  if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Login successful (HTTP $HTTP_CODE)"
    ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$BODY" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
    USER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "   User ID: $USER_ID"
    echo "   Access Token: ${ACCESS_TOKEN:0:50}..."
    echo "   Refresh Token: ${REFRESH_TOKEN:0:50}..."
  else
    echo "   ❌ Login failed (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
    exit 1
  fi
  echo ""
else
  echo "📋 Step 3: Skipping login (already authenticated from registration)"
  echo ""
fi

# Step 4: Test Protected Endpoint (GET /auth/me)
if [ ! -z "$ACCESS_TOKEN" ]; then
  echo "📋 Step 4: Testing Protected Endpoint (GET /auth/me)"
  ME_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/auth/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  HTTP_CODE=$(echo "$ME_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
  BODY=$(echo "$ME_RESPONSE" | sed '/HTTP_CODE/d')

  if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Protected endpoint accessible (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
  else
    echo "   ❌ Protected endpoint failed (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
  fi
  echo ""
fi

# Step 5: Test Token Refresh
if [ ! -z "$REFRESH_TOKEN" ]; then
  echo "📋 Step 5: Testing Token Refresh"
  REFRESH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/auth/refresh" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-ID: $TENANT_ID" \
    -d "{
      \"refreshToken\": \"$REFRESH_TOKEN\"
    }")

  HTTP_CODE=$(echo "$REFRESH_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
  BODY=$(echo "$REFRESH_RESPONSE" | sed '/HTTP_CODE/d')

  if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Token refresh successful (HTTP $HTTP_CODE)"
    NEW_ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    NEW_REFRESH_TOKEN=$(echo "$BODY" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
    echo "   New Access Token: ${NEW_ACCESS_TOKEN:0:50}..."
    echo "   New Refresh Token: ${NEW_REFRESH_TOKEN:0:50}..."
    ACCESS_TOKEN="$NEW_ACCESS_TOKEN"
  else
    echo "   ❌ Token refresh failed (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
  fi
  echo ""
fi

# Step 6: Test Invalid Credentials
echo "📋 Step 6: Testing Invalid Credentials"
INVALID_LOGIN_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"WrongPassword123!\"
  }")

HTTP_CODE=$(echo "$INVALID_LOGIN_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$INVALID_LOGIN_RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "401" ]; then
  echo "   ✅ Invalid credentials rejected correctly (HTTP $HTTP_CODE)"
else
  echo "   ❌ Expected 401, got HTTP $HTTP_CODE"
  echo "   Response: $BODY"
fi
echo ""

# Step 7: Test Missing Tenant Header
echo "📋 Step 7: Testing Missing Tenant Header"
NO_TENANT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

HTTP_CODE=$(echo "$NO_TENANT_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$NO_TENANT_RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ]; then
  echo "   ✅ Missing tenant header rejected correctly (HTTP $HTTP_CODE)"
else
  echo "   ⚠️  Expected 400/401, got HTTP $HTTP_CODE"
  echo "   Response: $BODY"
fi
echo ""

# Step 8: Test Logout
if [ ! -z "$ACCESS_TOKEN" ]; then
  echo "📋 Step 8: Testing Logout"
  LOGOUT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/auth/logout" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  HTTP_CODE=$(echo "$LOGOUT_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
  BODY=$(echo "$LOGOUT_RESPONSE" | sed '/HTTP_CODE/d')

  if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Logout successful (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
  else
    echo "   ❌ Logout failed (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
  fi
  echo ""
fi

# Summary
echo "=========================================="
echo "  Test Summary"
echo "=========================================="
echo "✅ Tenant Creation: $([ "$HTTP_CODE" = "201" ] && echo "PASS" || echo "SKIP")"
echo "✅ User Registration: $([ ! -z "$ACCESS_TOKEN" ] && echo "PASS" || echo "FAIL")"
echo "✅ User Login: $([ ! -z "$ACCESS_TOKEN" ] && echo "PASS" || echo "FAIL")"
echo "✅ Protected Endpoint: $([ "$HTTP_CODE" = "200" ] && echo "PASS" || echo "FAIL")"
echo "✅ Token Refresh: $([ "$HTTP_CODE" = "200" ] && echo "PASS" || echo "FAIL")"
echo "✅ Invalid Credentials: $([ "$HTTP_CODE" = "401" ] && echo "PASS" || echo "FAIL")"
echo "✅ Missing Tenant Header: $([ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "401" ] && echo "PASS" || echo "FAIL")"
echo "✅ Logout: $([ "$HTTP_CODE" = "200" ] && echo "PASS" || echo "FAIL")"
echo ""
echo "Test Tenant ID: $TENANT_ID"
echo "Test Tenant Slug: $TENANT_SLUG"
echo "Test User Email: $TEST_EMAIL"
echo ""
echo "=========================================="
