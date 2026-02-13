# Permissions Systems Explained

**Date**: 2026-02-12  
**Purpose**: Clarify the difference between Tenant Permissions and Platform Permissions

---

## Quick Answer

**Yes, "Tenant Permissions" = "Tenant User Permissions"**

"Tenant Permissions" is the **role-based access control (RBAC) system** that controls what **tenant users** (like Admin, Editor, Reviewer) can do within their tenant.

---

## Two Separate Permission Systems

The CMS has **TWO separate permission systems**:

### 1. **Tenant Permissions** (Tenant User Permissions)
- **Location**: Each `cms_tenant_*.user_role_permissions` table
- **Who uses it**: **Tenant users** (users who belong to a tenant)
- **What it controls**: What tenant users can do **within their tenant**
- **Examples**: 
  - Can they create content? (`content_entry:create`)
  - Can they manage users? (`user:create`, `user:read`)
  - Can they upload media? (`media:upload`)

### 2. **Platform Permissions** (Platform User Permissions)
- **Location**: `cms_platform.permissions` table
- **Who uses it**: **Platform users** (Super Admin, Platform Admin, etc.)
- **What it controls**: What platform users can do **across the entire platform**
- **Examples**:
  - Can they create tenants? (`tenant:create`)
  - Can they manage platform users? (`user:create`, `user:read`)
  - Can they view platform analytics? (`platform:view_analytics`)

---

## Visual Comparison

```
┌─────────────────────────────────────────────────────────────┐
│                    PLATFORM LEVEL                            │
│                  (cms_platform database)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Platform Users (Super Admin, Platform Admin, etc.)          │
│  ↓                                                           │
│  Platform Roles (Super Admin, Platform Admin, etc.)          │
│  ↓                                                           │
│  Platform Permissions                                      │
│  (tenant:create, tenant:read, platform:view_analytics, etc.) │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Manages tenants
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    TENANT LEVEL                              │
│            (cms_tenant_<id> database)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Tenant Users (Admin, Editor, Reviewer, Author, etc.)        │
│  ↓                                                           │
│  Tenant Roles (Admin, Editor, Reviewer, Author, etc.)        │
│  ↓                                                           │
│  Tenant Permissions                                         │
│  (content_entry:create, user:read, media:upload, etc.)      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Detailed Comparison

| Aspect | **Tenant Permissions** | **Platform Permissions** |
|--------|----------------------|------------------------|
| **Database** | `cms_tenant_*.user_role_permissions` | `cms_platform.permissions` |
| **Users** | Tenant users (Admin, Editor, etc.) | Platform users (Super Admin, etc.) |
| **Roles** | Admin, Editor, Reviewer, Author, API Consumer | Super Admin, Platform Admin, Support Admin, etc. |
| **Scope** | Within a single tenant | Across entire platform |
| **Resources** | `content_entry:*`, `user:*`, `media:*` | `tenant:*`, `platform:*`, `theme:*` |
| **Example Permission** | `content_entry:create` | `tenant:create` |
| **Who can manage** | Tenant Admin (within their tenant) | Super Admin (platform-wide) |

---

## Example Scenarios

### Scenario 1: Tenant User (Editor Role)

**User**: `editor@example.com` (tenant user)  
**Role**: Editor  
**Permissions**: Tenant Permissions (from `cms_tenant_*.user_role_permissions`)

**Can do**:
- ✅ Create content entries (`content_entry:create`)
- ✅ Upload media (`media:upload`)
- ❌ Create users (`user:create`) - Editor role doesn't have this permission
- ❌ Create tenants - This is a **platform permission**, not a tenant permission

**Cannot do**:
- ❌ Manage tenants (requires platform permissions)
- ❌ Access platform settings (requires platform permissions)

---

### Scenario 2: Platform User (Super Admin)

**User**: `admin@platform.com` (platform user)  
**Role**: Super Admin  
**Permissions**: Platform Permissions (from `cms_platform.permissions`)

**Can do**:
- ✅ Create tenants (`tenant:create`)
- ✅ View platform analytics (`platform:view_analytics`)
- ✅ Manage platform users (`user:create`, `user:read`)
- ✅ Access any tenant's data (bypasses tenant permissions)

**Cannot do**:
- ❌ Nothing - Super Admin has ALL permissions

---

## When Testing "Tenant Permissions"

When we say "Test Tenant Permissions System", we mean:

1. **Test that tenant users** (like Admin, Editor) **have the correct permissions**
2. **Test that roles** (Admin, Editor, Reviewer) **are assigned the correct permissions**
3. **Test that permission checks work** when tenant users try to access resources
4. **Test that different roles** have different access levels

**Example Test**:
- Create a tenant user with "Editor" role
- Try to create content → Should work (Editor has `content_entry:create`)
- Try to create a user → Should fail (Editor doesn't have `user:create`)
- Try to access tenant settings → Should fail (Editor doesn't have `settings:update`)

---

## Database Tables

### Tenant Permissions (in `cms_tenant_*` databases)

```
users
  ↓ (via user_roles)
roles (Admin, Editor, Reviewer, Author, API Consumer)
  ↓ (via role_permissions)
user_role_permissions (content_entry:create, user:read, etc.)
```

### Platform Permissions (in `cms_platform` database)

```
users (Super Admin, Platform Admin, etc.)
  ↓ (via user_roles)
roles (Super Admin, Platform Admin, Support Admin, etc.)
  ↓ (via role_permissions)
permissions (tenant:create, platform:view_analytics, etc.)
```

---

## Summary

✅ **"Tenant Permissions" = "Tenant User Permissions"**

- Controls what **tenant users** can do **within their tenant**
- Stored in each tenant database (`cms_tenant_*.user_role_permissions`)
- Examples: `content_entry:create`, `user:read`, `media:upload`

**Separate from**:
- **Platform Permissions** = Controls what **platform users** can do **across the platform**
- Stored in platform database (`cms_platform.permissions`)
- Examples: `tenant:create`, `platform:view_analytics`

---

## Related Documentation

- [Tenant Permissions System](./TENANT_PERMISSIONS_SYSTEM.md)
- [Platform Roles Reference](./PLATFORM_ROLES_REFERENCE.md)
- [Access Control Rules](./ACCESS_CONTROL_RULES.md)
- [Table Names Clarification](./TABLE_NAMES_CLARIFICATION.md)

---

**Last Updated**: 2026-02-12
