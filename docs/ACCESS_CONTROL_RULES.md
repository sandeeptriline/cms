# Access Control Rules

**Last Updated**: 2026-02-12  
**Version**: 1.0

---

## Overview

This document defines the access control rules for the CMS platform, including Super Admin (platform-level) and tenant-level user access controls.

---

## User Types

### 1. Super Admin (Platform Level)

- **Storage**: Stored in `cms_platform.users` table
- **Quantity**: Only **one** Super Admin user allowed in the entire system
- **Role**: "Super Admin" role in `cms_platform.roles` table
- **Authentication**: No tenant ID required for login
- **JWT Token**: `tenantId: null` in token payload
- **Access Scope**: Platform-wide access to all tenants and system configuration

### 2. Tenant Users (Tenant Level)

- **Storage**: Stored in `cms_tenant_<tenant_id>.users` table
- **Quantity**: Multiple users per tenant
- **Roles**: Admin, Editor, Reviewer, Author, API Consumer (defined per tenant)
- **Authentication**: Tenant ID required for login
- **JWT Token**: `tenantId: <tenant_id>` in token payload
- **Access Scope**: Limited to their specific tenant

---

## Database Access Rules

### Platform Database (`cms_platform`)

#### Super Admin Access
- ✅ **Full Read/Write Access** to:
  - `tenants` table (view, create, update, delete tenants)
  - `users` table (Super Admin user only)
  - `roles` table (platform roles)
  - `user_roles` table (Super Admin role assignment)
  - `schema_templates` table
  - `library_items` table
  - `themes` table
  - `extensions` table
  - `translations` table
  - All other platform tables

#### Tenant User Access
- ❌ **No Access** to platform database
- Tenant users cannot access `cms_platform` database

### Tenant Databases (`cms_tenant_<tenant_id>`)

#### Super Admin Access
- ✅ **Full Read/Write Access** to all tenant databases
- ✅ Can access any tenant's data
- ✅ Can view, create, update, delete tenant users
- ✅ Can access tenant content, media, etc.
- ✅ Can manage tenant configuration

#### Tenant User Access
- ✅ **Full Read/Write Access** to **their own tenant database only**
- ✅ Cannot access other tenants' databases
- ✅ Access is isolated to their specific tenant
- ✅ Can view, create, update, delete content in their tenant
- ✅ Can manage users in their tenant (if Admin role)

---

## Authentication Rules

### Super Admin Login

**Endpoint**: `POST /api/v1/auth/platform-admin/login`

**Requirements**:
- ❌ **No tenant ID required**
- ✅ Email and password
- ✅ User must exist in `cms_platform.users` table
- ✅ User must have "Super Admin" role in `cms_platform.user_roles`
- ✅ User status must be `1` (active)

**JWT Token Payload**:
```json
{
  "sub": "<user_id>",
  "email": "admin@platform.com",
  "tenantId": null,
  "roles": ["Super Admin"]
}
```

### Tenant User Login

**Endpoint**: `POST /api/v1/auth/login`

**Requirements**:
- ✅ **Tenant ID required** (via `X-Tenant-ID` or `X-Tenant-Slug` header)
- ✅ Email and password
- ✅ User must exist in `cms_tenant_<tenant_id>.users` table
- ✅ User must have role in `cms_tenant_<tenant_id>.user_roles`
- ✅ User status must be `1` (active) or `'active'` (string, for backward compatibility)
- ✅ Tenant must be `active` (not `suspended`, `deleted`, or `provisioning`)

**JWT Token Payload**:
```json
{
  "sub": "<user_id>",
  "email": "user@example.com",
  "tenantId": "<tenant_id>",
  "roles": ["Admin", "Editor"]
}
```

---

## API Endpoint Access Rules

### Platform Admin Endpoints

**Access**: Super Admin only

**Examples**:
- `GET /api/v1/tenants` - List all tenants
- `POST /api/v1/tenants` - Create new tenant
- `GET /api/v1/tenants/:id` - Get tenant details
- `PATCH /api/v1/tenants/:id` - Update tenant
- `DELETE /api/v1/tenants/:id` - Delete tenant
- `GET /api/v1/tenants/:id/users` - List tenant users (Super Admin can access any tenant)

**Protection**: 
- Check for `roles.includes('Super Admin')`
- `tenantId` can be `null` in JWT token
- No `TenantGuard` required (or `TenantGuard` allows Super Admin bypass)

### Tenant User Endpoints

**Access**: Tenant users only (within their tenant)

**Examples**:
- `GET /api/v1/content-types` - List content types (tenant-specific)
- `POST /api/v1/content-types` - Create content type (tenant-specific)
- `GET /api/v1/users` - List users (tenant-specific)
- `POST /api/v1/users` - Create user (tenant-specific)

**Protection**:
- `TenantGuard` required
- `tenantId` must be present in JWT token
- Access limited to their specific tenant database

### Cross-Tenant Access

**Super Admin**:
- ✅ Can access any tenant's endpoints
- ✅ Can provide `X-Tenant-ID` header to access specific tenant
- ✅ Can access tenant data without tenant context (platform-level view)

**Tenant Users**:
- ❌ Cannot access other tenants' endpoints
- ❌ Cannot access platform admin endpoints
- ❌ Cannot access other tenants' data

---

## Tenant Guard Rules

### Super Admin Behavior

When `TenantGuard` is applied:

1. **If user has "Super Admin" role**:
   - ✅ Can proceed **without** tenant context
   - ✅ Can proceed **with** tenant context (to access specific tenant)
   - ✅ If tenant ID provided, validates tenant exists (optional)
   - ✅ Attaches tenant to request if provided

2. **If user does NOT have "Super Admin" role**:
   - ❌ **Must** provide tenant context (`X-Tenant-ID` or `X-Tenant-Slug`)
   - ❌ Tenant must exist
   - ❌ Tenant must be `active` (not `suspended`, `deleted`, or `provisioning`)

### Implementation

```typescript
// backend/src/tenants/guards/tenant.guard.ts

// Super Admin can bypass tenant checks
if (user && user.roles && user.roles.includes('Super Admin')) {
  // Super Admin can proceed without tenant context
  return true;
}

// Regular tenant users require tenant context
if (!tenantIdentifier) {
  throw new BadRequestException('Tenant identifier is required');
}
```

---

## Role-Based Access Control (RBAC)

### Platform Roles

**Location**: `cms_platform.roles` table

**Roles**:
- **Super Admin**: System-wide control

**Note**: Only "Super Admin" role should exist in platform database.

### Tenant Roles

**Location**: `cms_tenant_<tenant_id>.roles` table

**Roles**:
- **Admin**: Tenant-level administration
- **Editor**: Content creation and editing
- **Reviewer**: Content review and approval
- **Author**: Content creation only
- **API Consumer**: Read-only API access

**Note**: Each tenant can have custom roles defined in their tenant database.

---

## JWT Token Rules

### Super Admin Token

**Structure**:
```json
{
  "sub": "<user_id>",
  "email": "admin@platform.com",
  "tenantId": null,
  "roles": ["Super Admin"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Validation**:
- ✅ `tenantId` can be `null`
- ✅ Must have `roles.includes('Super Admin')`
- ✅ If `tenantId` is `null`, user must be Super Admin

### Tenant User Token

**Structure**:
```json
{
  "sub": "<user_id>",
  "email": "user@example.com",
  "tenantId": "<tenant_id>",
  "roles": ["Admin", "Editor"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Validation**:
- ❌ `tenantId` **cannot** be `null`
- ✅ `tenantId` must be a valid tenant ID
- ✅ User must exist in that tenant's database

---

## Frontend Access Rules

### Platform Admin UI

**Access**: Super Admin only

**Features**:
- ✅ Tenant Management (list, create, edit, delete tenants)
- ✅ Platform Dashboard (tenant statistics, usage metrics)
- ✅ Schema Library (platform-level schema templates)
- ✅ Theme Library (platform-level themes)
- ✅ Component Library (platform-level components)
- ✅ System Settings (platform configuration)

**Navigation**: 
- Visible only when `isSuperAdmin(user.roles)` returns `true`
- Uses `PlatformAdminRoute` component for protection

### Tenant Admin UI

**Access**: Tenant users (Admin, Editor, Reviewer, Author)

**Features**:
- ✅ Content Types (tenant-specific)
- ✅ Pages (tenant-specific)
- ✅ Blocks (tenant-specific)
- ✅ Media (tenant-specific)
- ✅ Users (tenant-specific)
- ✅ Settings (tenant-specific)

**Navigation**:
- Visible for all authenticated users
- Content filtered by tenant automatically

---

## Data Isolation Rules

### Tenant Data Isolation

**Rule**: Tenant users can **only** access data from their own tenant.

**Implementation**:
- All queries automatically filtered by `tenantId` from JWT token
- Database connection switches to tenant database based on `tenantId`
- No cross-tenant data leakage possible

**Example**:
```typescript
// Tenant user with tenantId: "abc-123"
// Can only access: cms_tenant_abc_123 database
// Cannot access: cms_tenant_xyz_456 database
```

### Super Admin Data Access

**Rule**: Super Admin can access **all** tenant data.

**Implementation**:
- Super Admin can provide `X-Tenant-ID` header to access specific tenant
- Super Admin can query any tenant database
- Super Admin can view platform-level data

**Example**:
```typescript
// Super Admin (tenantId: null)
// Can access: cms_platform database
// Can access: cms_tenant_abc_123 database (with X-Tenant-ID header)
// Can access: cms_tenant_xyz_456 database (with X-Tenant-ID header)
```

---

## Status Field Rules

### Platform Database (`cms_platform.users`)

**Field Type**: `TINYINT(1)`
- `1` = active (user can login and access the system)
- `0` = inactive (user is disabled and cannot login)

### Tenant Databases (`cms_tenant_*.users`)

**Field Type**: `VARCHAR(20)` or `TINYINT(1)` (migration in progress)
- `1` or `'active'` = active (user can login and access the system)
- `0` or `'inactive'` = inactive (user is disabled and cannot login)

**Backward Compatibility**: 
- Auth service handles both formats
- Type checking: `typeof user.status === 'number' ? user.status === 1 : user.status === 'active'`

---

## Route Protection Rules

### Platform Admin Routes

**Protection**: `PlatformAdminRoute` component (frontend)

**Backend**: Check for `roles.includes('Super Admin')`

**Example**:
```typescript
// frontend/components/auth/platform-admin-route.tsx
if (!isSuperAdmin(user?.roles)) {
  redirect('/dashboard'); // Redirect to tenant admin
}
```

### Tenant Admin Routes

**Protection**: `ProtectedRoute` component (frontend)

**Backend**: `JwtAuthGuard` + `TenantGuard`

**Example**:
```typescript
// All authenticated users can access
// Content automatically filtered by tenantId from JWT
```

---

## Security Rules

### 1. Only One Super Admin

**Rule**: Only one active Super Admin user is allowed in the system.

**Enforcement**:
- Application-level validation in `PlatformUsersService.createSuperAdmin()`
- Checks if Super Admin exists before creating
- Throws error if Super Admin already exists

### 2. Tenant Isolation

**Rule**: Tenant users cannot access other tenants' data.

**Enforcement**:
- `TenantGuard` validates tenant context
- Database queries automatically filtered by `tenantId`
- No cross-tenant queries possible

### 3. Role Validation

**Rule**: Users must have valid roles to access protected endpoints.

**Enforcement**:
- JWT token contains roles
- Backend validates roles before granting access
- Frontend checks roles before showing UI elements

### 4. Token Validation

**Rule**: JWT tokens must be valid and contain required fields.

**Enforcement**:
- `JwtStrategy` validates token payload
- Super Admin tokens must have `tenantId: null` and `roles.includes('Super Admin')`
- Tenant user tokens must have valid `tenantId` and roles

---

## API Endpoint Examples

### Super Admin Endpoints

```bash
# Platform Admin Login (no tenant ID)
POST /api/v1/auth/platform-admin/login
Content-Type: application/json

{
  "email": "admin@platform.com",
  "password": "SecurePassword123!"
}

# List All Tenants (Super Admin only)
GET /api/v1/tenants
Authorization: Bearer <super_admin_token>

# Access Tenant Users (Super Admin can access any tenant)
GET /api/v1/tenants/<tenant_id>/users
Authorization: Bearer <super_admin_token>
X-Tenant-ID: <tenant_id>  # Optional for Super Admin
```

### Tenant User Endpoints

```bash
# Tenant User Login (tenant ID required)
POST /api/v1/auth/login
X-Tenant-ID: <tenant_id>
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}

# List Content Types (tenant-specific)
GET /api/v1/content-types
Authorization: Bearer <tenant_user_token>
X-Tenant-ID: <tenant_id>  # Required for tenant users
```

---

## Implementation Details

### Backend Guards

1. **JwtAuthGuard**: Validates JWT token
   - Extracts user from token
   - Validates token expiration
   - Attaches user to request

2. **TenantGuard**: Validates tenant context
   - Super Admin: Can bypass (optional tenant context)
   - Tenant Users: Must provide tenant context

3. **Role Guards**: Validate user roles (to be implemented)
   - Check for specific roles
   - Grant/deny access based on role

### Frontend Protection

1. **ProtectedRoute**: Requires authentication
   - Redirects to login if not authenticated
   - Works for both Super Admin and tenant users

2. **PlatformAdminRoute**: Requires Super Admin role
   - Redirects to tenant dashboard if not Super Admin
   - Only shows platform admin UI to Super Admin

---

## Related Documentation

- [Super Admin Architecture](./SUPER_ADMIN_ARCHITECTURE.md)
- [Database Structure](./DATABASE_STRUCTURE.md)
- [Platform Database Schema](./platform-db.sql)
- [Tenant Database Schema](./tenant-db.sql)
- [Backend Implementation Summary](../backend/docs/development/SUPER_ADMIN_IMPLEMENTATION_SUMMARY.md)

---

## Summary

| User Type | Database | Login Endpoint | Tenant ID | JWT tenantId | Access Scope |
|-----------|----------|----------------|-----------|--------------|--------------|
| **Super Admin** | `cms_platform.users` | `/auth/platform-admin/login` | ❌ Not required | `null` | All tenants + Platform |
| **Tenant Admin** | `cms_tenant_*.users` | `/auth/login` | ✅ Required | `<tenant_id>` | Own tenant only |
| **Tenant Editor** | `cms_tenant_*.users` | `/auth/login` | ✅ Required | `<tenant_id>` | Own tenant only |
| **Tenant Reviewer** | `cms_tenant_*.users` | `/auth/login` | ✅ Required | `<tenant_id>` | Own tenant only |
| **Tenant Author** | `cms_tenant_*.users` | `/auth/login` | ✅ Required | `<tenant_id>` | Own tenant only |

---

**Last Updated**: 2026-02-12  
**Status**: Implemented and Documented
