# How to Get Access Token

**Last Updated**: 2026-02-12

---

## Overview

After logging in as Super Admin, you need to extract the `accessToken` from the response to use it for authenticated API calls.

---

## Method 1: Using the Script (Easiest)

```bash
cd /home/sandeep/Documents/NextJs/triline/cms/backend/scripts
./get-access-token.sh
```

This will:
- Login as Super Admin
- Extract and display the access token
- Save it to `/tmp/cms_access_token.txt`
- Show you how to use it

---

## Method 2: Using curl with jq (Recommended)

### Step 1: Login and Extract Token

```bash
# Extract token directly
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/platform-admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin@123"
  }' | jq -r '.accessToken')

# Display token
echo "Access Token: $TOKEN"
```

### Step 2: Use the Token

```bash
# Test the token
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Method 3: Using curl (Without jq)

### Step 1: Login and Save Response

```bash
curl -X POST http://localhost:3001/api/v1/auth/platform-admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin@123"
  }' > login_response.json
```

### Step 2: Extract Token Manually

Open `login_response.json` and copy the `accessToken` value:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "name": "Platform Administrator",
    "roles": ["Super Admin"]
  }
}
```

### Step 3: Use the Token

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Method 4: Using Swagger UI

1. Open Swagger UI: `http://localhost:3001/api/docs`
2. Find `POST /api/v1/auth/platform-admin/login`
3. Click "Try it out"
4. Enter credentials:
   - Email: `admin@example.com`
   - Password: `admin@123`
5. Click "Execute"
6. Copy the `accessToken` from the response
7. Click the "Authorize" button (🔒) at the top
8. Paste the token in the "Value" field
9. Click "Authorize" and "Close"

Now all API calls in Swagger will use this token automatically!

---

## Method 5: Using Browser Developer Tools

1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Make a login request from your frontend or Swagger
4. Find the login request in the network tab
5. Click on it and go to "Response" tab
6. Copy the `accessToken` from the JSON response

---

## Using the Token

Once you have the token, use it in API calls:

```bash
# Set token as variable
TOKEN="your_access_token_here"

# Use in API calls
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

curl -X GET http://localhost:3001/api/v1/tenants \
  -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:3001/api/v1/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Tenant",
    "slug": "test-tenant"
  }'
```

---

## Token Expiration

- **Access Token**: Expires in 7 days (configurable via `JWT_EXPIRES_IN` in `.env`)
- **Refresh Token**: Expires in 30 days (configurable via `JWT_REFRESH_EXPIRES_IN` in `.env`)

When the access token expires, use the refresh token to get a new one:

```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

---

## Troubleshooting

### Token Not Working

1. **Check if token is expired**: Tokens expire after the configured time
2. **Verify token format**: Should start with `eyJ...`
3. **Check Authorization header**: Must be `Bearer <token>` (with space)
4. **Verify user still exists**: User might have been deleted or deactivated

### Login Fails

1. **Check credentials**: Email and password must match
2. **Verify user exists**: Run `verify-super-admin.sql` script
3. **Check user status**: User must have `status = 1` (active)
4. **Verify Super Admin role**: User must have "Super Admin" role assigned

---

## Related Documentation

- [Create Super Admin](./CREATE_SUPER_ADMIN.md)
- [Super Admin Login API](../../api/SUPER_ADMIN_LOGIN.md)
- [Authentication Guide](../development/AUTHENTICATION.md)
