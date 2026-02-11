# Phase 2: Authentication Testing Guide

**Status**: Ready for Testing  
**Date**: 2026-02-11

---

## Prerequisites

1. ✅ Backend server running: `npm run start:dev`
2. ✅ MySQL database `cms_platform` exists
3. ✅ At least one tenant created and provisioned
4. ✅ Environment variables configured (JWT_SECRET, JWT_REFRESH_SECRET)

---

## Quick Test (Automated Script)

Run the automated test script:

```bash
cd backend
./scripts/test-auth.sh
```

This script will:
1. Create a test tenant (or use existing)
2. Test user registration
3. Test user login
4. Test protected endpoint (`GET /auth/me`)
5. Test token refresh
6. Test invalid credentials
7. Test missing tenant header
8. Test logout

---

## Manual Testing

### Step 1: Get or Create a Tenant

First, you need a tenant ID. You can either:

**Option A: Create a new tenant**
```bash
curl -X POST http://localhost:3001/api/v1/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Auth Test Tenant",
    "slug": "auth-test-tenant"
  }'
```

**Option B: List existing tenants**
```bash
curl http://localhost:3001/api/v1/tenants
```

Save the `id` from the response as `TENANT_ID`.

---

### Step 2: Register a New User

**Endpoint**: `POST /api/v1/auth/register`

**Request**:
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <TENANT_ID>" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePassword123!",
    "name": "Test User"
  }'
```

**Expected Response** (201 Created):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "testuser@example.com",
    "name": "Test User",
    "roles": []
  }
}
```

**Note**: The tokens are also set as HTTP-only cookies.

---

### Step 3: Login

**Endpoint**: `POST /api/v1/auth/login`

**Request**:
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <TENANT_ID>" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePassword123!"
  }'
```

**Expected Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "testuser@example.com",
    "name": "Test User",
    "roles": []
  }
}
```

---

### Step 4: Access Protected Endpoint

**Endpoint**: `GET /api/v1/auth/me`

**Request**:
```bash
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected Response** (200 OK):
```json
{
  "id": "uuid-here",
  "email": "testuser@example.com",
  "tenantId": "tenant-uuid",
  "roles": []
}
```

**Test without token** (should fail):
```bash
curl http://localhost:3001/api/v1/auth/me
```

Expected: 401 Unauthorized

---

### Step 5: Refresh Token

**Endpoint**: `POST /api/v1/auth/refresh`

**Request**:
```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <TENANT_ID>" \
  -d '{
    "refreshToken": "<REFRESH_TOKEN>"
  }'
```

**Expected Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "testuser@example.com",
    "name": "Test User",
    "roles": []
  }
}
```

---

### Step 6: Logout

**Endpoint**: `POST /api/v1/auth/logout`

**Request**:
```bash
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

---

## Error Cases

### Invalid Credentials

**Request**:
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <TENANT_ID>" \
  -d '{
    "email": "testuser@example.com",
    "password": "WrongPassword"
  }'
```

**Expected Response** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

### Missing Tenant Header

**Request**:
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePassword123!"
  }'
```

**Expected Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Tenant identifier is required (X-Tenant-ID header or X-Tenant-Slug header)",
  "error": "Bad Request"
}
```

---

### Invalid Token

**Request**:
```bash
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer invalid-token"
```

**Expected Response** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

### Duplicate Email Registration

**Request** (register same email twice):
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <TENANT_ID>" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePassword123!",
    "name": "Test User"
  }'
```

**Expected Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "User with this email already exists",
  "error": "Bad Request"
}
```

---

## Testing with Swagger UI

1. Open Swagger UI: http://localhost:3001/api/docs
2. Click "Authorize" button (top right)
3. Enter tenant ID or slug in `tenant-id` or `tenant-slug` field
4. For protected endpoints, enter JWT token in `JWT-auth` field
5. Test endpoints interactively

---

## Expected Results Summary

| Test Case | Expected Status | Notes |
|-----------|----------------|-------|
| Register (new user) | 201 Created | User created, tokens returned |
| Register (duplicate) | 400 Bad Request | Email already exists |
| Login (valid) | 200 OK | Tokens returned |
| Login (invalid password) | 401 Unauthorized | Invalid credentials |
| Login (missing tenant) | 400 Bad Request | Tenant header required |
| GET /auth/me (with token) | 200 OK | User info returned |
| GET /auth/me (no token) | 401 Unauthorized | Token required |
| Refresh token (valid) | 200 OK | New tokens returned |
| Refresh token (invalid) | 401 Unauthorized | Invalid refresh token |
| Logout | 200 OK | Cookies cleared |

---

## Troubleshooting

### "Tenant not found" Error
- Ensure tenant exists and is provisioned
- Check tenant status is `active`
- Verify tenant ID/slug is correct

### "User not found" Error
- Ensure user exists in tenant database
- Check user status is `active`
- Verify email is correct

### "Invalid credentials" Error
- Verify password is correct
- Check password hashing is working
- Ensure user exists in tenant database

### Database Connection Issues
- Verify tenant database exists
- Check `TenantPrismaService` is working
- Ensure users table exists in tenant database

### Token Issues
- Verify JWT_SECRET is set in `.env`
- Check token expiration settings
- Ensure token format is correct

---

## Next Steps

After successful testing:
1. ✅ User model verified in tenant database
2. ✅ Authentication flow working
3. ✅ Token management working
4. ⏳ Implement user service and CRUD
5. ⏳ Implement role-based access control (RBAC)

---

**Last Updated**: 2026-02-11
