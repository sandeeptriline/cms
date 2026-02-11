# Quick Testing Guide - Phase 2 Authentication

## 🚀 Quick Start

### Step 1: Start the Backend Server

```bash
cd backend
npm run start:dev
```

Wait for the server to start. You should see:
```
🚀 Backend API is running on: http://localhost:3001/api/v1
📚 Swagger documentation: http://localhost:3001/api/docs
```

---

## 🧪 Testing Options

### Option 1: Automated Test Script (Recommended)

Run the automated test script that tests all endpoints:

```bash
cd backend
./scripts/test-auth.sh
```

This script will:
- ✅ Create a test tenant
- ✅ Test user registration
- ✅ Test user login
- ✅ Test protected endpoints
- ✅ Test token refresh
- ✅ Test error cases

---

### Option 2: Swagger UI (Interactive)

1. **Open Swagger UI**: http://localhost:3001/api/docs

2. **Authorize** (Click the "Authorize" button):
   - `tenant-id`: Enter a tenant ID (or use `tenant-slug`)
   - `JWT-auth`: Leave empty for now (will be filled after login)

3. **Test Registration**:
   - Find `POST /api/v1/auth/register`
   - Click "Try it out"
   - Enter:
     ```json
     {
       "email": "test@example.com",
       "password": "TestPassword123!",
       "name": "Test User"
     }
     ```
   - Add `X-Tenant-ID` header with your tenant ID
   - Click "Execute"
   - Copy the `accessToken` from response

4. **Authorize with Token**:
   - Click "Authorize" again
   - In `JWT-auth` field, enter: `Bearer <your-access-token>`
   - Click "Authorize"

5. **Test Protected Endpoint**:
   - Find `GET /api/v1/auth/me`
   - Click "Try it out" → "Execute"
   - Should return user info

6. **Test Login**:
   - Find `POST /api/v1/auth/login`
   - Click "Try it out"
   - Enter credentials
   - Execute

---

### Option 3: Manual Testing with curl

#### 1. Get or Create a Tenant

```bash
# List existing tenants
curl http://localhost:3001/api/v1/tenants

# Or create a new tenant
curl -X POST http://localhost:3001/api/v1/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Tenant",
    "slug": "test-tenant"
  }'
```

Save the `id` from response as `TENANT_ID`.

#### 2. Register a User

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <TENANT_ID>" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'
```

Save the `accessToken` from response.

#### 3. Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <TENANT_ID>" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

#### 4. Access Protected Endpoint

```bash
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

#### 5. Refresh Token

```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <TENANT_ID>" \
  -d '{
    "refreshToken": "<REFRESH_TOKEN>"
  }'
```

---

## ✅ Expected Results

| Endpoint | Method | Expected Status | Notes |
|----------|--------|----------------|-------|
| `/auth/register` | POST | 201 Created | User created, tokens returned |
| `/auth/login` | POST | 200 OK | Tokens returned |
| `/auth/me` | GET | 200 OK | User info (requires token) |
| `/auth/refresh` | POST | 200 OK | New tokens returned |
| `/auth/logout` | POST | 200 OK | Cookies cleared |

---

## 🐛 Troubleshooting

### Server Not Starting
- Check if port 3001 is available: `lsof -ti:3001`
- Check `.env` file exists and has correct values
- Check database connection

### "Tenant not found" Error
- Ensure tenant exists: `curl http://localhost:3001/api/v1/tenants`
- Wait 5-10 seconds after creating tenant (provisioning time)
- Check tenant status is `active`

### "User not found" or "Invalid credentials"
- Ensure user exists in tenant database
- Check password is correct
- Verify tenant database was provisioned correctly

### "401 Unauthorized"
- Check JWT token is valid
- Verify token format: `Bearer <token>`
- Check token hasn't expired
- Verify JWT_SECRET in `.env` matches

---

## 📚 More Details

For comprehensive testing guide, see:
- `docs/testing/PHASE2_TESTING_GUIDE.md` - Full testing documentation
- `docs/api/AUTHENTICATION_GUIDE.md` - API reference
