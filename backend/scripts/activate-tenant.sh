#!/bin/bash

API_URL="http://localhost:3001/api"

echo "=========================================="
echo "  Tenant Activation Helper"
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
  echo "Or list all tenants first:"
  echo "  curl $API_URL/tenants"
  echo ""
  exit 1
fi

TENANT_IDENTIFIER="$1"

echo "Looking up tenant: $TENANT_IDENTIFIER"
echo ""

# Try to get tenant by ID first
TENANT_RESPONSE=$(curl -s "$API_URL/tenants/$TENANT_IDENTIFIER" 2>&1)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/tenants/$TENANT_IDENTIFIER")

# If not found by ID, try by slug
if [ "$HTTP_CODE" != "200" ]; then
  echo "Not found by ID, trying by slug..."
  TENANT_RESPONSE=$(curl -s "$API_URL/tenants/slug/$TENANT_IDENTIFIER" 2>&1)
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/tenants/slug/$TENANT_IDENTIFIER")
fi

# Check if we got a valid response
if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Tenant not found: $TENANT_IDENTIFIER"
  echo ""
  echo "Available tenants:"
  echo ""
  ALL_TENANTS=$(curl -s "$API_URL/tenants")
  echo "$ALL_TENANTS" | grep -o '"id":"[^"]*"' | while read -r line; do
    ID=$(echo "$line" | cut -d'"' -f4)
    echo "  - $ID"
  done
  echo ""
  echo "Or list full details:"
  echo "  curl $API_URL/tenants | jq"
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
echo "  Current Status: $TENANT_STATUS"
echo ""

if [ "$TENANT_STATUS" = "active" ]; then
  echo "✅ Tenant is already ACTIVE"
  echo ""
  echo "You can now register users. Use this tenant ID in your requests:"
  echo "  X-Tenant-ID: $TENANT_ID"
  echo "  or"
  echo "  X-Tenant-Slug: $TENANT_SLUG"
  exit 0
fi

if [ "$TENANT_STATUS" = "suspended" ]; then
  echo "⚠️  Tenant is SUSPENDED - Activating now..."
  echo ""
  
  ACTIVATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X PATCH "$API_URL/tenants/$TENANT_ID/activate")
  HTTP_CODE=$(echo "$ACTIVATE_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
  BODY=$(echo "$ACTIVATE_RESPONSE" | sed '/HTTP_CODE/d')
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Tenant activated successfully!"
    echo ""
    echo "You can now register users. Use this tenant ID in your requests:"
    echo "  X-Tenant-ID: $TENANT_ID"
    echo "  or"
    echo "  X-Tenant-Slug: $TENANT_SLUG"
    echo ""
    echo "Try registration again:"
    echo "  curl -X POST $API_URL/auth/register \\"
    echo "    -H \"Content-Type: application/json\" \\"
    echo "    -H \"X-Tenant-ID: $TENANT_ID\" \\"
    echo "    -d '{\"email\":\"user@example.com\",\"password\":\"Password123!\",\"name\":\"User\"}'"
  else
    echo "❌ Failed to activate tenant (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
    exit 1
  fi
elif [ "$TENANT_STATUS" = "provisioning" ]; then
  echo "⏳ Tenant is PROVISIONING"
  echo ""
  echo "Please wait for provisioning to complete (usually 5-10 seconds)."
  echo "The tenant will be automatically activated when provisioning finishes."
  echo ""
  echo "Check status again in a few seconds:"
  echo "  ./scripts/check-tenant-status.sh $TENANT_ID"
elif [ "$TENANT_STATUS" = "deleted" ]; then
  echo "❌ Tenant has been DELETED"
  echo ""
  echo "This tenant cannot be activated. You need to create a new tenant."
  exit 1
fi
