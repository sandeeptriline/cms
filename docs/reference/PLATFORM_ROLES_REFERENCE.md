# Platform Roles Reference

**Date**: 2026-02-12  
**Status**: Ready for Implementation

---

## Overview

This document describes the platform-level roles available in the CMS system. These roles are stored in the `cms_platform.roles` table and control access to platform-level features.

---

## Role Hierarchy

### 1. **Super Admin** (System Role)
- **Description**: System-wide control - Manage all tenants, system configuration, platform-level settings
- **Permissions**: ALL permissions (should have all 33 permissions assigned)
- **Use Case**: Primary system administrator
- **Restrictions**: Cannot be deleted, deactivated, or have email changed

### 2. **Platform Admin**
- **Description**: Manage tenants and platform users. Full access to tenant and user management, but limited system configuration access.
- **Permissions**:
  - ✅ All Tenant Management (create, read, update, delete, activate, suspend, provision, view_usage)
  - ✅ All User Management (create, read, update, delete, impersonate)
  - ✅ Theme Management (read only)
  - ✅ Schema Management (read only)
  - ✅ Library Management (read only)
  - ✅ Platform Analytics (view only)
- **Use Case**: Senior platform administrators who manage tenants and users
- **Total Permissions**: ~15 permissions

### 3. **Support Admin**
- **Description**: Support team role. Can view and update tenants and users, but cannot delete or create new tenants.
- **Permissions**:
  - ✅ Tenant Management (read, update, activate, suspend, view_usage)
  - ❌ Tenant Management (NO create, delete, provision)
  - ✅ User Management (read, update, impersonate)
  - ❌ User Management (NO create, delete)
  - ✅ Theme Management (read only)
  - ✅ Schema Management (read only)
  - ✅ Library Management (read only)
  - ✅ Platform Analytics (view only)
- **Use Case**: Support team members who need to help users but shouldn't delete data
- **Total Permissions**: ~12 permissions

### 4. **Content Manager**
- **Description**: Manage platform-level content resources: themes, schema templates, and library items. Read-only access to tenants and users.
- **Permissions**:
  - ✅ Tenant Management (read, view_usage only)
  - ✅ User Management (read only)
  - ✅ All Theme Management (create, read, update, delete, publish)
  - ✅ All Schema Management (create, read, update, delete)
  - ✅ All Library Management (create, read, update, delete)
  - ✅ Platform Analytics (view only)
- **Use Case**: Content team members who manage platform-level content resources
- **Total Permissions**: ~16 permissions

### 5. **System Admin**
- **Description**: Manage system-level configuration, backups, logs, and health monitoring. Read-only access to tenants and users.
- **Permissions**:
  - ✅ Tenant Management (read, view_usage only)
  - ✅ User Management (read only)
  - ✅ Theme Management (read only)
  - ✅ Schema Management (read only)
  - ✅ Library Management (read only)
  - ✅ All Platform Configuration (configure, view_analytics, manage_extensions, manage_translations)
  - ✅ All System Administration (view_logs, manage_backups, view_health)
- **Use Case**: DevOps/Infrastructure team members
- **Total Permissions**: ~10 permissions

### 6. **Viewer** (Read-Only)
- **Description**: Read-only access to view tenants, users, analytics, and content resources. No modification permissions.
- **Permissions**:
  - ✅ Tenant Management (read, view_usage only)
  - ✅ User Management (read only)
  - ✅ Theme Management (read only)
  - ✅ Schema Management (read only)
  - ✅ Library Management (read only)
  - ✅ Platform Analytics (view only)
- **Use Case**: Executives, auditors, or read-only access for reporting
- **Total Permissions**: ~7 permissions

---

## Permission Categories

### Tenant Management (8 permissions)
- `tenant:create` - Create new tenant
- `tenant:read` - View tenant list and details
- `tenant:update` - Update tenant information
- `tenant:delete` - Delete tenant
- `tenant:activate` - Activate suspended tenant
- `tenant:suspend` - Suspend active tenant
- `tenant:provision` - Trigger tenant provisioning
- `tenant:view_usage` - View tenant usage metrics

### User Management (5 permissions)
- `user:create` - Create user in any tenant
- `user:read` - View user in any tenant
- `user:update` - Update user in any tenant
- `user:delete` - Delete user in any tenant
- `user:impersonate` - Impersonate user (for support)

### Theme Management (5 permissions)
- `theme:create` - Create new theme
- `theme:read` - View themes
- `theme:update` - Update theme
- `theme:delete` - Delete theme
- `theme:publish` - Publish theme to library

### Schema Management (4 permissions)
- `schema_template:create` - Create schema template
- `schema_template:read` - View schema templates
- `schema_template:update` - Update schema template
- `schema_template:delete` - Delete schema template

### Library Management (4 permissions)
- `library_item:create` - Create library item
- `library_item:read` - View library items
- `library_item:update` - Update library item
- `library_item:delete` - Delete library item

### Platform Configuration (4 permissions)
- `platform:configure` - Configure platform settings
- `platform:view_analytics` - View platform analytics
- `platform:manage_extensions` - Manage extensions
- `platform:manage_translations` - Manage translations

### System Administration (3 permissions)
- `system:view_logs` - View system logs
- `system:manage_backups` - Manage backups
- `system:view_health` - View system health

---

## Setup Instructions

### Step 1: Ensure Permissions Table is Populated

Make sure the `permissions` table has all 33 permissions. If not, run the permissions seed script first.

### Step 2: Run the Roles Seed Script

```bash
mysql -u root -p cms_platform < docs/platform-roles-seed.sql
```

Or using `sudo mysql` (for Ubuntu/Debian):

```bash
sudo mysql cms_platform < docs/platform-roles-seed.sql
```

### Step 3: Assign All Permissions to Super Admin (If Not Done)

If the Super Admin role doesn't have all permissions assigned yet, run:

```sql
-- Assign all permissions to Super Admin role
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Super Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'Super Admin' LIMIT 1)
    AND rp.permission_id = permissions.id
);
```

### Step 4: Verify Roles and Permissions

Run the verification queries at the end of `platform-roles-seed.sql`:

```sql
-- View all roles and their permission counts
SELECT 
    r.name as role_name,
    r.description,
    COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name, r.description
ORDER BY permission_count DESC;
```

**Expected Results**:
- Super Admin: 33 permissions (all)
- Platform Admin: ~15 permissions
- Support Admin: ~12 permissions
- Content Manager: ~16 permissions
- System Admin: ~10 permissions
- Viewer: ~7 permissions

---

## Role Assignment

### Assigning Roles to Platform Users

Roles are assigned to platform users via the `user_roles` table:

```sql
-- Assign role to a platform user
INSERT INTO user_roles (id, user_id, role_id, created_at)
VALUES (
    UUID(),
    '<user_id>',
    (SELECT id FROM roles WHERE name = 'Platform Admin' LIMIT 1),
    NOW()
);
```

### Multiple Roles

A platform user can have multiple roles. Their effective permissions will be the union of all permissions from all their roles.

---

## Best Practices

1. **Super Admin Protection**: 
   - Super Admin users should be protected in the UI (cannot be deleted, deactivated, or have email changed)
   - Only assign Super Admin role to trusted administrators

2. **Principle of Least Privilege**:
   - Assign the minimum permissions needed for a user's job function
   - Use Support Admin for support staff instead of Platform Admin
   - Use Viewer for read-only access needs

3. **Role Naming**:
   - All roles are system roles (`is_system = 1`) and cannot be deleted
   - Custom roles can be created but should not be marked as system roles

4. **Permission Auditing**:
   - Regularly review role permissions
   - Use the verification queries to audit permissions
   - Document any custom roles created

---

## Related Documentation

- [ACCESS_CONTROL_RULES.md](./ACCESS_CONTROL_RULES.md) - Access control rules
- [ACCESS_MANAGEMENT_ANALYSIS.md](./ACCESS_MANAGEMENT_ANALYSIS.md) - Permission system analysis
- [SUPER_ADMIN_USER_MANAGEMENT.md](./SUPER_ADMIN_USER_MANAGEMENT.md) - Super Admin user management

---

**Last Updated**: 2026-02-12
