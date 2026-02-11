# Phase 1 Testing Guide

**Status**: Ready for Testing  
**Date**: 2026

---

## Prerequisites

1. ✅ Backend server running: `npm run start:dev`
2. ✅ MySQL database `cms_platform` exists
3. ✅ Database connection configured in `.env`
4. ✅ Prisma Client generated

---

## Test 1: Health Check

### Endpoint
```bash
GET http://localhost:3001/api/v1
```

### Expected Response
```json
{
  "message": "CMS Platform API",
  "status": "ok"
}
```

### Test Command
```bash
curl http://localhost:3001/api/v1
```

---

## Test 2: Create Tenant

### Endpoint
```bash
POST http://localhost:3001/api/v1/tenants
Content-Type: application/json
```

### Request Body
```json
{
  "name": "Test Tenant",
  "slug": "test-tenant",
  "config": {
    "theme": "default"
  },
  "featureFlags": {
    "analytics": true
  }
}
```

### Expected Response
```json
{
  "id": "uuid-here",
  "name": "Test Tenant",
  "slug": "test-tenant",
  "db_name": "cms_tenant_test_tenant",
  "status": "provisioning",
  "config": { "theme": "default" },
  "feature_flags": { "analytics": true },
  "created_at": "2026-01-01T00:00:00.000Z"
}
```

### Test Command
```bash
curl -X POST http://localhost:3001/api/v1/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Tenant",
    "slug": "test-tenant",
    "config": {"theme": "default"},
    "featureFlags": {"analytics": true}
  }'
```

### Verify Database Creation
```bash
# Check if tenant database was created
mysql -u cms_user -p -e "SHOW DATABASES LIKE 'cms_tenant_%';"
```

---

## Test 3: List All Tenants

### Endpoint
```bash
GET http://localhost:3001/api/v1/tenants
```

### Expected Response
```json
[
  {
    "id": "uuid-here",
    "name": "Test Tenant",
    "slug": "test-tenant",
    "status": "active",
    "created_at": "2026-01-01T00:00:00.000Z"
  }
]
```

### Test Command
```bash
curl http://localhost:3001/api/v1/tenants
```

---

## Test 4: Get Tenant by ID

### Endpoint
```bash
GET http://localhost:3001/api/v1/tenants/{id}
```

### Test Command
```bash
# Replace {id} with actual tenant ID from Test 2
curl http://localhost:3001/api/v1/tenants/{id}
```

### Expected Response
```json
{
  "id": "uuid-here",
  "name": "Test Tenant",
  "slug": "test-tenant",
  "db_name": "cms_tenant_test_tenant",
  "status": "active",
  "config": { "theme": "default" },
  "feature_flags": { "analytics": true },
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

---

## Test 5: Get Tenant by Slug

### Endpoint
```bash
GET http://localhost:3001/api/v1/tenants/slug/test-tenant
```

### Test Command
```bash
curl http://localhost:3001/api/v1/tenants/slug/test-tenant
```

---

## Test 6: Update Tenant

### Endpoint
```bash
PATCH http://localhost:3001/api/v1/tenants/{id}
Content-Type: application/json
```

### Request Body
```json
{
  "name": "Updated Test Tenant",
  "config": {
    "theme": "dark"
  }
}
```

### Test Command
```bash
curl -X PATCH http://localhost:3001/api/v1/tenants/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Tenant",
    "config": {"theme": "dark"}
  }'
```

---

## Test 7: Activate Tenant

### Endpoint
```bash
PATCH http://localhost:3001/api/v1/tenants/{id}/activate
```

### Test Command
```bash
curl -X PATCH http://localhost:3001/api/v1/tenants/{id}/activate
```

---

## Test 8: Suspend Tenant

### Endpoint
```bash
PATCH http://localhost:3001/api/v1/tenants/{id}/suspend
```

### Test Command
```bash
curl -X PATCH http://localhost:3001/api/v1/tenants/{id}/suspend
```

---

## Test 9: Tenant Isolation Guard

### Test Without Tenant Header (Should Fail)
```bash
# This should return 400 Bad Request
curl http://localhost:3001/api/v1/tenants/{id}/content
```

### Test With Tenant Header (Should Work)
```bash
# This should work if endpoint uses TenantGuard
curl http://localhost:3001/api/v1/tenants/{id}/content \
  -H "X-Tenant-ID: {tenant-id}"
```

### Test With Tenant Slug Header
```bash
curl http://localhost:3001/api/v1/tenants/{id}/content \
  -H "X-Tenant-Slug: test-tenant"
```

---

## Test 10: Tenant Hierarchy (Parent-Child)

### Create Parent Tenant
```bash
curl -X POST http://localhost:3001/api/v1/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Parent Tenant",
    "slug": "parent-tenant"
  }'
```

### Create Child Tenant
```bash
# Replace {parent-id} with parent tenant ID
curl -X POST http://localhost:3001/api/v1/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Child Tenant",
    "slug": "child-tenant",
    "parentId": "{parent-id}"
  }'
```

### Verify Hierarchy
```bash
# Get parent tenant - should include children
curl http://localhost:3001/api/v1/tenants/{parent-id}
```

---

## Test 11: Error Cases

### Duplicate Slug (Should Fail)
```bash
curl -X POST http://localhost:3001/api/v1/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Duplicate",
    "slug": "test-tenant"
  }'
# Expected: 409 Conflict
```

### Invalid Slug Format (Should Fail)
```bash
curl -X POST http://localhost:3001/api/v1/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid",
    "slug": "Invalid Slug With Spaces!"
  }'
# Expected: 400 Bad Request (validation error)
```

### Non-existent Tenant (Should Fail)
```bash
curl http://localhost:3001/api/v1/tenants/non-existent-id
# Expected: 404 Not Found
```

---

## Test 12: Tenant Provisioning Verification

### Check Tenant Status
```bash
# After creating tenant, check status
curl http://localhost:3001/api/v1/tenants/{id}
# Status should change from "provisioning" to "active"
```

### Verify Database Exists
```bash
mysql -u cms_user -p -e "SHOW DATABASES LIKE 'cms_tenant_%';"
```

### Check Database Tables
```bash
mysql -u cms_user -p cms_tenant_test_tenant -e "SHOW TABLES;"
```

---

## Automated Test Script

Save this as `test-tenants.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:3001/api/v1"
TENANT_SLUG="test-tenant-$(date +%s)"

echo "=== Testing Tenant API ==="
echo ""

# Test 1: Create Tenant
echo "1. Creating tenant..."
RESPONSE=$(curl -s -X POST "$API_URL/tenants" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Tenant\",
    \"slug\": \"$TENANT_SLUG\"
  }")

TENANT_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Created tenant ID: $TENANT_ID"
echo "Response: $RESPONSE"
echo ""

# Test 2: List Tenants
echo "2. Listing tenants..."
curl -s "$API_URL/tenants" | jq '.'
echo ""

# Test 3: Get Tenant by ID
echo "3. Getting tenant by ID..."
curl -s "$API_URL/tenants/$TENANT_ID" | jq '.'
echo ""

# Test 4: Get Tenant by Slug
echo "4. Getting tenant by slug..."
curl -s "$API_URL/tenants/slug/$TENANT_SLUG" | jq '.'
echo ""

echo "=== Tests Complete ==="
```

---

## Expected Results Summary

| Test | Expected Status | Notes |
|------|----------------|-------|
| Health Check | 200 OK | Basic API working |
| Create Tenant | 201 Created | Tenant created, status: provisioning |
| List Tenants | 200 OK | Array of tenants |
| Get by ID | 200 OK | Single tenant object |
| Get by Slug | 200 OK | Single tenant object |
| Update Tenant | 200 OK | Tenant updated |
| Activate Tenant | 200 OK | Status changed to active |
| Suspend Tenant | 200 OK | Status changed to suspended |
| Tenant Guard (no header) | 400 Bad Request | Missing tenant identifier |
| Tenant Guard (with header) | 200 OK | Tenant context available |
| Duplicate Slug | 409 Conflict | Validation error |
| Invalid Slug | 400 Bad Request | Format validation |
| Non-existent Tenant | 404 Not Found | Error handling |

---

## Troubleshooting

### Database Connection Issues
- Check `.env` file has correct `DATABASE_URL`
- Verify MySQL is running: `sudo systemctl status mysql`
- Test connection: `mysql -u cms_user -p`

### Provisioning Fails
- Check MySQL user has CREATE DATABASE privilege
- Check logs for specific error messages
- Verify database name format is correct

### Guard Not Working
- Ensure `@UseGuards(TenantGuard)` is applied to route
- Check headers are being sent correctly
- Verify tenant exists in database

---

**Last Updated**: 2026
