# How to Authenticate in Swagger UI

**Last Updated**: 2026-02-12

---

## Overview

Swagger UI provides an "Authorize" button that allows you to set your JWT access token once, and it will be automatically included in all API requests.

---

## Step-by-Step Guide

### Step 1: Open Swagger UI

Navigate to: `http://localhost:3001/api/docs`

### Step 2: Login to Get Access Token

1. Find the **`POST /api/v1/auth/platform-admin/login`** endpoint
2. Click **"Try it out"** button
3. Enter your credentials:
   ```json
   {
     "email": "admin@example.com",
     "password": "admin@123"
   }
   ```
4. Click **"Execute"** button
5. Scroll down to see the response
6. Copy the `accessToken` value from the response

**Example Response:**
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

### Step 3: Authorize with the Token

1. Look for the **"Authorize"** button at the top right of the Swagger UI page
   - It's usually a 🔒 lock icon or a button labeled "Authorize"
   - It's located in the top-right corner, next to the API title

2. Click the **"Authorize"** button

3. A modal window will open showing available authentication methods:
   - **JWT-auth** (this is what you need)
   - **tenant-id** (optional, for tenant-scoped operations)
   - **tenant-slug** (optional, for tenant-scoped operations)

4. In the **JWT-auth** section:
   - You'll see a field labeled **"Value"** or an input box
   - Paste your `accessToken` here
   - **Important**: Do NOT include the word "Bearer" - just paste the token itself
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

5. Click **"Authorize"** button in the modal

6. Click **"Close"** to close the modal

### Step 4: Verify Authorization

After authorizing, you should see:
- A 🔒 lock icon next to protected endpoints
- The lock icon may be green or show as "locked"
- The "Authorize" button may show a checkmark or change color

### Step 5: Test Protected Endpoints

Now you can test any protected endpoint:

1. Find any endpoint that requires authentication (like `GET /api/v1/auth/me`)
2. Click **"Try it out"**
3. Click **"Execute"**
4. The token will be automatically included in the request headers
5. You should get a successful response

---

## Visual Guide

```
┌─────────────────────────────────────────────────────────┐
│  CMS Platform API                    [🔒 Authorize]    │  ← Click here
├─────────────────────────────────────────────────────────┤
│                                                         │
│  auth                                                    │
│  ├─ POST /api/v1/auth/platform-admin/login             │
│  ├─ GET /api/v1/auth/me              [🔒]              │  ← Lock icon shows
│  └─ POST /api/v1/auth/logout         [🔒]              │    it's protected
│                                                         │
│  tenants                                                 │
│  ├─ GET /api/v1/tenants              [🔒]               │
│  └─ POST /api/v1/tenants             [🔒]               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Authorization Modal

When you click "Authorize", you'll see a modal like this:

```
┌──────────────────────────────────────────────────────┐
│  Available authorizations                    [X]     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  JWT-auth (http, Bearer)                            │
│  ┌──────────────────────────────────────────────┐  │
│  │ Enter JWT access token. Get token from login │  │
│  │ endpoints. Format: Bearer {token}            │  │
│  │                                               │  │
│  │ Value: [eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9]│  │  ← Paste token here
│  │                                               │  │
│  │ [Authorize]  [Close]                         │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  tenant-id (apiKey, header)                         │
│  ┌──────────────────────────────────────────────┐  │
│  │ Tenant ID for multi-tenant requests          │  │
│  │                                               │  │
│  │ Value: [                                    ]│  │
│  │                                               │  │
│  │ [Authorize]  [Close]                         │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Important Notes

### Token Format

- ✅ **Correct**: Just paste the token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- ❌ **Wrong**: Don't include "Bearer": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

Swagger UI automatically adds the "Bearer " prefix when sending the request.

### Token Persistence

- Swagger UI will remember your token for the current session
- The token persists even if you refresh the page (if `persistAuthorization: true` is set)
- To clear the token, click "Authorize" again and click "Logout" or clear the value

### Token Expiration

- Access tokens expire after 7 days (configurable)
- If you get a 401 Unauthorized error, your token may have expired
- Re-login to get a new token and update it in the Authorize modal

### For Super Admin

- Super Admin endpoints **do NOT require** tenant headers
- You can leave `tenant-id` and `tenant-slug` fields empty
- Only set the `JWT-auth` token

### For Tenant Users

- Tenant-scoped endpoints may require `tenant-id` or `tenant-slug` headers
- Set these in the respective authorization sections if needed

---

## Troubleshooting

### "Authorize" Button Not Visible

1. **Check URL**: Make sure you're at `http://localhost:3001/api/docs`
2. **Check Server**: Ensure backend server is running
3. **Hard Refresh**: Press `Ctrl+F5` (Windows/Linux) or `Cmd+Shift+R` (Mac)

### Token Not Working

1. **Check Token Format**: Make sure you copied the entire token (it's very long)
2. **Check Token Expiry**: Token may have expired - get a new one
3. **Check Authorization**: Make sure you clicked "Authorize" after pasting the token
4. **Check Request Headers**: In the response, check if `Authorization: Bearer ...` header is present

### Getting 401 Unauthorized

1. **Token Expired**: Get a new token by logging in again
2. **Wrong Token**: Make sure you're using the `accessToken`, not `refreshToken`
3. **Token Not Set**: Verify the token is set in the Authorize modal
4. **User Deactivated**: Check if the user account is still active

---

## Quick Reference

```bash
# 1. Login to get token
POST /api/v1/auth/platform-admin/login
{
  "email": "admin@example.com",
  "password": "admin@123"
}

# 2. Copy accessToken from response

# 3. Click "Authorize" button in Swagger UI

# 4. Paste token in JWT-auth field

# 5. Click "Authorize" and "Close"

# 6. Now all protected endpoints will use this token automatically!
```

---

## Related Documentation

- [Get Access Token](./GET_ACCESS_TOKEN.md)
- [Super Admin Login](../api/SUPER_ADMIN_LOGIN.md)
- [Swagger Configuration](../../src/main.ts)
