# Backend Testing Guide

**Last Updated**: 2026-02-13

---

## Quick Start

### 1. Start Server

```bash
cd backend
npm run start:dev
```

### 2. Test Health Endpoint

```bash
curl http://localhost:3001/api/v1/health
```

### 3. Test Authentication

```bash
# Login as Super Admin
curl -X POST http://localhost:3001/api/v1/auth/platform-admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "ChangeThisPassword123!"
  }'
```

---

## API Testing

### Using Swagger UI

1. Start server: `npm run start:dev`
2. Open: `http://localhost:3001/api/docs`
3. Test endpoints interactively

### Using cURL

#### Get Access Token

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/platform-admin/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "ChangeThisPassword123!"}' \
  | jq -r '.accessToken')

echo $TOKEN
```

#### Use Token in Requests

```bash
curl -X GET http://localhost:3001/api/v1/tenants \
  -H "Authorization: Bearer $TOKEN"
```

---

## Testing Endpoints

### Authentication

```bash
# Platform Admin Login
curl -X POST http://localhost:3001/api/v1/auth/platform-admin/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'

# Tenant User Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@tenant.com", "password": "password"}'
```

### Tenants

```bash
# List tenants
curl -X GET http://localhost:3001/api/v1/tenants \
  -H "Authorization: Bearer $TOKEN"

# Get tenant by ID
curl -X GET http://localhost:3001/api/v1/tenants/<tenant_id> \
  -H "Authorization: Bearer $TOKEN"

# Create tenant
curl -X POST http://localhost:3001/api/v1/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Tenant",
    "slug": "test-tenant"
  }'
```

---

## Testing Checklist

### Phase 1: Multi-Tenant Core
- [ ] Create tenant
- [ ] List tenants
- [ ] Get tenant by ID
- [ ] Update tenant
- [ ] Activate tenant
- [ ] Suspend tenant
- [ ] Delete tenant (soft delete)

### Phase 2: Authentication
- [ ] Super Admin login
- [ ] Tenant user login
- [ ] Get access token
- [ ] Refresh token
- [ ] Protected routes require authentication

### Phase 2.5: User Management
- [ ] Create tenant user
- [ ] List tenant users
- [ ] Update tenant user
- [ ] Assign roles to user
- [ ] Delete tenant user

---

## Test Results

Document test results and any issues found.

---

**Last Updated**: 2026-02-13
