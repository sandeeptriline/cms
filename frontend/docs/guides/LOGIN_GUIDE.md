# Login Guide

**Frontend URL**: http://localhost:3000/login

---

## Prerequisites

1. ✅ Backend server running on `http://localhost:3001`
2. ✅ At least one tenant created and active
3. ✅ At least one user registered in that tenant

---

## Step-by-Step Login Process

### Step 1: Get a Tenant ID

You need a tenant ID to login. Choose one method:

#### Option A: List Existing Tenants (Easiest)

**Using the helper script:**
```bash
cd backend
./scripts/get-tenants.sh
```

**Using Swagger UI:**
1. Open: http://localhost:3001/api/docs
2. Find `GET /api/v1/tenants`
3. Click "Try it out" → "Execute"
4. Copy any tenant `id` from the response

**Using curl:**
```bash
curl http://localhost:3001/api/v1/tenants | jq '.[0].id'
```

#### Option B: Create a New Tenant

**Using Swagger UI:**
1. Open: http://localhost:3001/api/docs
2. Find `POST /api/v1/tenants`
3. Click "Try it out"
4. Enter:
   ```json
   {
     "name": "My Tenant",
     "slug": "my-tenant"
   }
   ```
5. Click "Execute"
6. Copy the `id` from the response

**Note**: Wait 5-10 seconds for provisioning to complete.

---

### Step 2: Register a User

You need to register a user account in the tenant.

#### Using Swagger UI:

1. Open: http://localhost:3001/api/docs
2. Find `POST /api/v1/auth/register`
3. Click "Try it out"
4. Enter:
   ```json
   {
     "email": "admin@example.com",
     "password": "Password123!",
     "name": "Admin User"
   }
   ```
5. Add header: `X-Tenant-ID: <your-tenant-id>`
6. Click "Execute"

#### Using curl:

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <your-tenant-id>" \
  -d '{
    "email": "admin@example.com",
    "password": "Password123!",
    "name": "Admin User"
  }'
```

---

### Step 3: Login at http://localhost:3000/login

1. **Open the login page**: http://localhost:3000/login

2. **Enter credentials**:
   - **Tenant ID**: `<your-tenant-id>` (from Step 1)
   - **Email**: `admin@example.com` (from Step 2)
   - **Password**: `Password123!` (from Step 2)

3. **Click "Sign in"**

4. **You should be redirected** to `/dashboard` upon successful login

---

## Quick Test (All-in-One)

If you want to quickly test login, use the automated script:

```bash
cd backend
./scripts/test-auth.sh
```

This script will:
- Create a test tenant
- Register a test user
- Test login
- Show you the credentials to use

Then use those credentials at http://localhost:3000/login

---

## Troubleshooting

### "Tenant is suspended"

The tenant needs to be activated:

```bash
cd backend
./scripts/activate-tenant.sh <tenant-id>
```

### "Invalid credentials"

- Verify the email and password are correct
- Make sure the user exists in that tenant
- Check that the tenant is `active` (not `suspended` or `provisioning`)

### "Tenant not found"

- Verify the tenant ID is correct
- Check the tenant exists: `curl http://localhost:3001/api/v1/tenants`

### Database Permission Error

If you see database permission errors, grant privileges:

```bash
cd backend
./scripts/fix-tenant-database.sh <tenant-id>
```

---

## Example Credentials

After running the test script, you might see credentials like:

- **Tenant ID**: `a111e427-2a5a-4119-a235-6e988eaf412b`
- **Email**: `test@example.com`
- **Password**: `TestPassword123!`

Use these at http://localhost:3000/login

---

**Last Updated**: 2026-02-11
