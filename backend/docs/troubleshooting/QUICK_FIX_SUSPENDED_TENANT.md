# Quick Fix: Tenant is Suspended

## Problem
You're getting this error when trying to register:
```json
{
  "statusCode": 401,
  "message": "Tenant is suspended..."
}
```

## Quick Solution (3 Steps)

### Step 1: Find Your Tenant ID

**Option A: List all tenants**
```bash
curl http://localhost:3001/api/v1/tenants
```

Look for the tenant you want to use and copy its `id` field.

**Option B: If you know the tenant slug**
```bash
curl http://localhost:3001/api/v1/tenants/slug/<your-slug>
```

---

### Step 2: Activate the Tenant

**Option A: Using the helper script (Easiest)**
```bash
cd backend
./scripts/activate-tenant.sh <tenant-id-or-slug>
```

**Option B: Using curl**
```bash
curl -X PATCH http://localhost:3001/api/v1/tenants/<tenant-id>/activate
```

**Option C: Using Swagger UI**
1. Open: http://localhost:3001/api/docs
2. Find: `PATCH /api/v1/tenants/{id}/activate`
3. Enter your tenant ID
4. Click "Execute"

---

### Step 3: Try Registration Again

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant-id>" \
  -d '{
    "email": "sandeep@example.com",
    "password": "Password123!",
    "name": "Sandeep"
  }'
```

---

## Complete Example

```bash
# 1. List tenants to find ID
curl http://localhost:3001/api/v1/tenants

# 2. Activate tenant (replace with your tenant ID)
curl -X PATCH http://localhost:3001/api/v1/tenants/YOUR-TENANT-ID/activate

# 3. Register user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: YOUR-TENANT-ID" \
  -d '{
    "email": "sandeep@example.com",
    "password": "Password123!",
    "name": "Sandeep"
  }'
```

---

## Using the Helper Script

The easiest way:

```bash
cd backend

# Activate tenant (it will show you the exact command to use)
./scripts/activate-tenant.sh <tenant-id-or-slug>

# Then register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant-id-from-script>" \
  -d '{
    "email": "sandeep@example.com",
    "password": "Password123!",
    "name": "Sandeep"
  }'
```

---

## Verify Tenant is Active

After activation, verify:
```bash
curl http://localhost:3001/api/v1/tenants/<tenant-id>
```

Look for `"status": "active"` in the response.

---

**That's it!** Once the tenant is active, registration will work.
