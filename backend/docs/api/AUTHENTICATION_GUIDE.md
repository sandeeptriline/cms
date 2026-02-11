# Authentication & Authorization Guide

**Last Updated**: 2026-02-11

This guide explains the different authentication methods available in the CMS Platform API and when to use them.

---

## 🔐 Authentication Methods Overview

The API supports three types of authentication/authorization:

| Method | Purpose | Status | Required? |
|--------|---------|--------|-----------|
| **JWT-auth** | User authentication | ⏳ Phase 2 (Not yet implemented) | ❌ Not required yet |
| **tenant-id** | Tenant identification | ✅ Phase 1 (Active) | ✅ Required for tenant-scoped endpoints |
| **tenant-slug** | Tenant identification | ✅ Phase 1 (Active) | ✅ Alternative to tenant-id |

---

## 📋 Quick Answer

### Are all three required?

**No!** Here's what you actually need:

1. **JWT-auth**: ❌ **Not required** (Phase 2 - not implemented yet)
2. **tenant-id** OR **tenant-slug**: ✅ **One is required** (not both) for tenant-scoped endpoints

**You only need ONE of the tenant headers, not both!**

---

## 🔍 Detailed Explanation

### 1. JWT-auth (Bearer Token)

**Status**: ⏳ **Not yet implemented** (Phase 2)

**Purpose**: User authentication - identifies WHO is making the request

**When to use**: 
- After Phase 2 implementation
- For authenticated user requests
- To access user-specific resources

**Current status**: 
- Configured in Swagger UI for future use
- Not enforced by any guards yet
- Will be required in Phase 2

**Example**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 2. tenant-id (API Key)

**Status**: ✅ **Active** (Phase 1)

**Purpose**: Tenant identification - identifies WHICH tenant's data to access

**When to use**:
- For tenant-scoped API endpoints
- When you know the tenant UUID
- For programmatic access

**Required for**: 
- Endpoints that use `@UseGuards(TenantGuard)`
- Multi-tenant content operations
- Tenant-specific resources

**Example**:
```http
X-Tenant-ID: 123e4567-e89b-12d3-a456-426614174000
```

---

### 3. tenant-slug (API Key)

**Status**: ✅ **Active** (Phase 1)

**Purpose**: Tenant identification - alternative to tenant-id using slug

**When to use**:
- For tenant-scoped API endpoints
- When you know the tenant slug (more human-readable)
- Same functionality as tenant-id, just different identifier

**Required for**: 
- Same as tenant-id
- Use this OR tenant-id (not both)

**Example**:
```http
X-Tenant-Slug: acme-corp
```

---

## 🎯 Usage Scenarios

### Scenario 1: Platform Admin Endpoints (Current)

**Endpoint**: `GET /api/v1/tenants`

**Required**: ❌ None (platform-level endpoint)

**Headers**: None needed

---

### Scenario 2: Tenant-Scoped Endpoints (Current)

**Endpoint**: `GET /api/v1/content` (when implemented with TenantGuard)

**Required**: ✅ **One of**:
- `X-Tenant-ID: <uuid>` OR
- `X-Tenant-Slug: <slug>`

**Headers**: 
```http
X-Tenant-ID: 123e4567-e89b-12d3-a456-426614174000
```

OR

```http
X-Tenant-Slug: acme-corp
```

---

### Scenario 3: Authenticated Tenant Endpoints (Phase 2)

**Endpoint**: `GET /api/v1/content` (with authentication)

**Required**: ✅ **Both**:
- `Authorization: Bearer <jwt-token>` (user authentication)
- `X-Tenant-ID: <uuid>` OR `X-Tenant-Slug: <slug>` (tenant context)

**Headers**: 
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Tenant-ID: 123e4567-e89b-12d3-a456-426614174000
```

---

## 📊 Decision Matrix

| Endpoint Type | JWT-auth | tenant-id/slug | Notes |
|---------------|----------|----------------|-------|
| **Platform Admin** | ❌ | ❌ | No auth needed (Phase 1) |
| **Tenant-Scoped** | ❌ | ✅ One required | Current Phase 1 |
| **Authenticated Tenant** | ✅ | ✅ One required | Phase 2 (future) |
| **Public API** | ❌ | ✅ One required | Content delivery |

---

## 🔄 Priority Order

When multiple tenant identifiers are provided, the system uses this priority:

1. **X-Tenant-ID** header (highest priority)
2. **tenantId** query parameter
3. **X-Tenant-Slug** header (lowest priority)

**Only ONE is used** - the first one found in priority order.

---

## 🛠️ Using in Swagger UI

### For Current Phase 1 Endpoints:

1. Click **"Authorize"** button (🔒 icon)
2. **Skip** JWT-auth (not needed yet)
3. Choose **ONE**:
   - Enter tenant ID in **tenant-id** field, OR
   - Enter tenant slug in **tenant-slug** field
4. Click **"Authorize"**
5. Test your endpoint

### Example:
```
✅ tenant-id: 123e4567-e89b-12d3-a456-426614174000
❌ tenant-slug: (leave empty)
❌ JWT-auth: (leave empty)
```

---

## ⚠️ Common Mistakes

### ❌ Wrong: Using both tenant-id and tenant-slug
```http
X-Tenant-ID: 123e4567-e89b-12d3-a456-426614174000
X-Tenant-Slug: acme-corp
```
**Result**: Only tenant-id will be used (priority order)

### ✅ Correct: Using only one
```http
X-Tenant-ID: 123e4567-e89b-12d3-a456-426614174000
```

### ❌ Wrong: Using JWT-auth for Phase 1 endpoints
**Result**: JWT is ignored (not implemented yet)

### ✅ Correct: Using tenant header for Phase 1
```http
X-Tenant-Slug: acme-corp
```

---

## 📝 Summary

| Question | Answer |
|----------|--------|
| **Is JWT-auth required?** | ❌ No (Phase 2 - not implemented) |
| **Is tenant-id required?** | ✅ Yes, for tenant-scoped endpoints |
| **Is tenant-slug required?** | ✅ Yes, as alternative to tenant-id |
| **Do I need both tenant-id AND tenant-slug?** | ❌ No, only ONE is needed |
| **Do I need JWT + tenant header?** | ⏳ Not yet (Phase 2 will require both) |

---

## 🚀 Future (Phase 2)

When JWT authentication is implemented:

- **JWT-auth** will be required for authenticated endpoints
- **tenant-id/slug** will still be required for tenant context
- Both will work together:
  - JWT identifies the USER
  - Tenant header identifies the TENANT

---

**Last Updated**: 2026-02-11
