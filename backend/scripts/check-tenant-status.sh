#!/bin/bash

API_URL="http://localhost:3001/api"

echo "=========================================="
echo "  Tenant Status Checker"
echo "=========================================="
echo ""

# Check if tenant ID or slug is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <tenant-id-or-slug>"
  echo ""
  echo "Example:"
  echo "  $0 123e4567-e89b-12d3-a456-426614174000"
  echo "  $0 my-tenant-slug"
  echo ""
  exit 1
fi

TENANT_IDENTIFIER="$1"

# Try to get tenant by ID first
TENANT_RESPONSE=$(curl -s "$API_URL/tenants/$TENANT_IDENTIFIER" 2>&1)

# If not found by ID, try by slug
if echo "$TENANT_RESPONSE" | grep -q "not found"; then
  TENANT_RESPONSE=$(curl -s "$API_URL/tenants/slug/$TENANT_IDENTIFIER" 2>&1)
fi

# Check if we got a valid response
if echo "$TENANT_RESPONSE" | grep -q "not found"; then
  echo "❌ Tenant not found: $TENANT_IDENTIFIER"
  echo ""
  echo "Available tenants:"
  curl -s "$API_URL/tenants" | grep -o '"id":"[^"]*"' | head -5
  exit 1
fi

# Extract tenant info
TENANT_ID=$(echo "$TENANT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
TENANT_NAME=$(echo "$TENANT_RESPONSE" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
TENANT_SLUG=$(echo "$TENANT_RESPONSE" | grep -o '"slug":"[^"]*"' | head -1 | cut -d'"' -f4)
TENANT_STATUS=$(echo "$TENANT_RESPONSE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Tenant Information:"
echo "  ID: $TENANT_ID"
echo "  Name: $TENANT_NAME"
echo "  Slug: $TENANT_SLUG"
echo "  Status: $TENANT_STATUS"
echo ""

if [ "$TENANT_STATUS" = "suspended" ]; then
  echo "⚠️  Tenant is SUSPENDED"
  echo ""
  echo "To activate the tenant, run:"
  echo "  curl -X PATCH $API_URL/tenants/$TENANT_ID/activate"
  echo ""
  echo "Or use Swagger UI:"
  echo "  http://localhost:3001/api/docs"
  echo "  → PATCH /api/tenants/{id}/activate"
  echo ""
elif [ "$TENANT_STATUS" = "provisioning" ]; then
  echo "⏳ Tenant is PROVISIONING"
  echo ""
  echo "Please wait for provisioning to complete. The tenant will be automatically activated."
  echo "This usually takes 5-10 seconds."
  echo ""
elif [ "$TENANT_STATUS" = "active" ]; then
  echo "✅ Tenant is ACTIVE"
  echo ""
  echo "You can now register users with this tenant."
  echo ""
elif [ "$TENANT_STATUS" = "deleted" ]; then
  echo "❌ Tenant has been DELETED"
  echo ""
  echo "This tenant is no longer accessible."
  echo ""
fi
