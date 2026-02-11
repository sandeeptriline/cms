# Tenant Status Issues - Troubleshooting Guide

## Problem: "Tenant is suspended" Error

When trying to register or login, you may encounter:
```json
{
  "statusCode": 401,
  "message": "Tenant is suspended. Please contact the administrator to activate the tenant or use PATCH /api/v1/tenants/:id/activate to activate it."
}
```

---

## Solution

### Step 1: Check Tenant Status

**Option A: Using the script**
```bash
cd backend
./scripts/check-tenant-status.sh <tenant-id-or-slug>
```

**Option B: Using API**
```bash
# Get tenant by ID
curl http://localhost:3001/api/v1/tenants/<tenant-id>

# Or get tenant by slug
curl http://localhost:3001/api/v1/tenants/slug/<tenant-slug>

# List all tenants
curl http://localhost:3001/api/v1/tenants
```

**Option C: Using Swagger UI**
1. Open: http://localhost:3001/api/docs
2. Find `GET /api/v1/tenants/{id}` or `GET /api/v1/tenants/slug/{slug}`
3. Enter tenant ID or slug
4. Execute to see status

---

### Step 2: Activate the Tenant

If the tenant status is `suspended`, activate it:

**Option A: Using API**
```bash
curl -X PATCH http://localhost:3001/api/v1/tenants/<tenant-id>/activate
```

**Option B: Using Swagger UI**
1. Open: http://localhost:3001/api/docs
2. Find `PATCH /api/v1/tenants/{id}/activate`
3. Enter tenant ID
4. Execute

**Option C: Using the script (after checking status)**
The script will provide the exact command to run.

---

### Step 3: Verify Tenant is Active

Check the tenant status again to confirm it's now `active`:
```bash
curl http://localhost:3001/api/v1/tenants/<tenant-id>
```

Look for `"status": "active"` in the response.

---

### Step 4: Try Registration Again

Once the tenant is active, try registration again:
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant-id>" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "name": "User Name"
  }'
```

---

## Tenant Status Values

| Status | Description | Can Register? |
|--------|-------------|---------------|
| `provisioning` | Tenant database is being set up | ❌ No - Wait for provisioning to complete |
| `active` | Tenant is ready to use | ✅ Yes |
| `suspended` | Tenant is suspended (needs activation) | ❌ No - Activate first |
| `deleted` | Tenant has been deleted | ❌ No - Cannot be used |

---

## Common Scenarios

### Scenario 1: Tenant is Provisioning

**Error**: "Tenant is still being provisioned"

**Solution**: Wait 5-10 seconds and try again. Provisioning happens automatically when a tenant is created.

---

### Scenario 2: Tenant Provisioning Failed

**Symptom**: Tenant status is `suspended` right after creation

**Possible Causes**:
- Database connection issues
- Insufficient MySQL privileges
- Database name conflicts

**Solution**:
1. Check backend logs for provisioning errors
2. Verify MySQL user has CREATE DATABASE privileges
3. Check if database already exists
4. Try activating the tenant manually
5. If issues persist, delete and recreate the tenant

---

### Scenario 3: Tenant Was Manually Suspended

**Symptom**: Tenant was working, now shows as `suspended`

**Solution**: Simply activate it using:
```bash
curl -X PATCH http://localhost:3001/api/v1/tenants/<tenant-id>/activate
```

---

## Quick Reference Commands

```bash
# Check tenant status
curl http://localhost:3001/api/v1/tenants/<tenant-id>

# Activate tenant
curl -X PATCH http://localhost:3001/api/v1/tenants/<tenant-id>/activate

# Suspend tenant (if needed)
curl -X PATCH http://localhost:3001/api/v1/tenants/<tenant-id>/suspend

# List all tenants
curl http://localhost:3001/api/v1/tenants
```

---

## Prevention

To avoid this issue:
1. Always wait for tenant provisioning to complete before using it
2. Check tenant status after creation
3. Monitor tenant status in your application
4. Set up alerts for tenant status changes

---

**Last Updated**: 2026-02-11
