#!/bin/bash

# Script to list all tenants and their IDs

echo "=== Listing All Tenants ==="
echo ""

API_URL="http://localhost:3001/api"

# Check if server is running
if ! curl -s "$API_URL" > /dev/null 2>&1; then
    echo "❌ Error: Backend server is not running on $API_URL"
    echo "   Please start the server first: cd backend && npm run start:dev"
    exit 1
fi

echo "Fetching tenants from $API_URL/tenants..."
echo ""

# Get tenants
RESPONSE=$(curl -s "$API_URL/tenants")

# Check if response is valid JSON
if ! echo "$RESPONSE" | jq . > /dev/null 2>&1; then
    echo "❌ Error: Invalid response from server"
    echo "Response: $RESPONSE"
    exit 1
fi

# Check if response is an array
if echo "$RESPONSE" | jq 'type' | grep -q "array"; then
    COUNT=$(echo "$RESPONSE" | jq 'length')
    
    if [ "$COUNT" -eq 0 ]; then
        echo "⚠️  No tenants found."
        echo ""
        echo "To create a tenant, run:"
        echo "  curl -X POST $API_URL/tenants \\"
        echo "    -H 'Content-Type: application/json' \\"
        echo "    -d '{\"name\": \"My Tenant\", \"slug\": \"my-tenant\"}'"
        exit 0
    fi
    
    echo "Found $COUNT tenant(s):"
    echo ""
    
    # Display tenants in a table format
    echo "$RESPONSE" | jq -r '.[] | "ID: \(.id)\nName: \(.name)\nSlug: \(.slug)\nStatus: \(.status)\n---"'
    
    echo ""
    echo "💡 Copy any 'ID' above to use as Tenant ID in the login form"
    
else
    echo "Response: $RESPONSE"
fi
