#!/bin/bash

API_URL="http://localhost:3001/api/v1"
TENANT_SLUG="test-tenant-$(date +%s)"

echo "=========================================="
echo "  Phase 1: Tenant API Testing"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "✅ Test 1: Health Check"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')
if [ "$HTTP_CODE" = "200" ]; then
  echo "   Status: PASS (HTTP $HTTP_CODE)"
  echo "   Response: $BODY"
else
  echo "   Status: FAIL (HTTP $HTTP_CODE)"
  echo "   Response: $BODY"
fi
echo ""

# Test 2: Create Tenant
echo "✅ Test 2: Create Tenant"
CREATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/tenants" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Tenant\",
    \"slug\": \"$TENANT_SLUG\",
    \"config\": {\"theme\": \"default\"},
    \"featureFlags\": {\"analytics\": true}
  }")

HTTP_CODE=$(echo "$CREATE_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$CREATE_RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "201" ]; then
  echo "   Status: PASS (HTTP $HTTP_CODE)"
  TENANT_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "   Tenant ID: $TENANT_ID"
  echo "   Tenant Slug: $TENANT_SLUG"
  echo "   Response: $BODY" | head -c 200
  echo "..."
else
  echo "   Status: FAIL (HTTP $HTTP_CODE)"
  echo "   Response: $BODY"
  exit 1
fi
echo ""

# Wait for provisioning (if async)
echo "⏳ Waiting 3 seconds for tenant provisioning..."
sleep 3
echo ""

# Test 3: List Tenants
echo "✅ Test 3: List All Tenants"
LIST_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/tenants")
HTTP_CODE=$(echo "$LIST_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$LIST_RESPONSE" | sed '/HTTP_CODE/d')
if [ "$HTTP_CODE" = "200" ]; then
  echo "   Status: PASS (HTTP $HTTP_CODE)"
  COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l)
  echo "   Found $COUNT tenant(s)"
else
  echo "   Status: FAIL (HTTP $HTTP_CODE)"
  echo "   Response: $BODY"
fi
echo ""

# Test 4: Get Tenant by ID
if [ ! -z "$TENANT_ID" ]; then
  echo "✅ Test 4: Get Tenant by ID"
  GET_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/tenants/$TENANT_ID")
  HTTP_CODE=$(echo "$GET_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
  BODY=$(echo "$GET_RESPONSE" | sed '/HTTP_CODE/d')
  if [ "$HTTP_CODE" = "200" ]; then
    echo "   Status: PASS (HTTP $HTTP_CODE)"
    STATUS=$(echo "$BODY" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "   Tenant Status: $STATUS"
  else
    echo "   Status: FAIL (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
  fi
  echo ""
fi

# Test 5: Get Tenant by Slug
echo "✅ Test 5: Get Tenant by Slug"
SLUG_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL/tenants/slug/$TENANT_SLUG")
HTTP_CODE=$(echo "$SLUG_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$SLUG_RESPONSE" | sed '/HTTP_CODE/d')
if [ "$HTTP_CODE" = "200" ]; then
  echo "   Status: PASS (HTTP $HTTP_CODE)"
else
  echo "   Status: FAIL (HTTP $HTTP_CODE)"
  echo "   Response: $BODY"
fi
echo ""

# Test 6: Update Tenant
if [ ! -z "$TENANT_ID" ]; then
  echo "✅ Test 6: Update Tenant"
  UPDATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PATCH "$API_URL/tenants/$TENANT_ID" \
    -H "Content-Type: application/json" \
    -d '{"name": "Updated Test Tenant"}')
  HTTP_CODE=$(echo "$UPDATE_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
  BODY=$(echo "$UPDATE_RESPONSE" | sed '/HTTP_CODE/d')
  if [ "$HTTP_CODE" = "200" ]; then
    echo "   Status: PASS (HTTP $HTTP_CODE)"
  else
    echo "   Status: FAIL (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
  fi
  echo ""
fi

# Test 7: Error Case - Duplicate Slug
echo "✅ Test 7: Error Case - Duplicate Slug"
DUPLICATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/tenants" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Duplicate\", \"slug\": \"$TENANT_SLUG\"}")
HTTP_CODE=$(echo "$DUPLICATE_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$DUPLICATE_RESPONSE" | sed '/HTTP_CODE/d')
if [ "$HTTP_CODE" = "409" ]; then
  echo "   Status: PASS (HTTP $HTTP_CODE - Conflict as expected)"
else
  echo "   Status: FAIL (Expected 409, got $HTTP_CODE)"
  echo "   Response: $BODY"
fi
echo ""

# Test 8: Error Case - Invalid Slug
echo "✅ Test 8: Error Case - Invalid Slug Format"
INVALID_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/tenants" \
  -H "Content-Type: application/json" \
  -d '{"name": "Invalid", "slug": "Invalid Slug With Spaces!"}')
HTTP_CODE=$(echo "$INVALID_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$INVALID_RESPONSE" | sed '/HTTP_CODE/d')
if [ "$HTTP_CODE" = "400" ]; then
  echo "   Status: PASS (HTTP $HTTP_CODE - Validation error as expected)"
else
  echo "   Status: FAIL (Expected 400, got $HTTP_CODE)"
  echo "   Response: $BODY"
fi
echo ""

echo "=========================================="
echo "  Testing Complete"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo "  1. Check tenant database was created:"
echo "     mysql -u cms_user -p -e \"SHOW DATABASES LIKE 'cms_tenant_%';\""
echo ""
echo "  2. Check tenant status:"
if [ ! -z "$TENANT_ID" ]; then
  echo "     curl $API_URL/tenants/$TENANT_ID"
fi
echo ""
