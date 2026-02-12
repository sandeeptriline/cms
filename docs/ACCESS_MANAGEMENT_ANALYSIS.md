# Access Management Analysis & Proposal

**Date**: 2026-02-12  
**Status**: Proposal

---

## Current State Analysis

### Existing Structure in `cms_platform`

1. **`users` table** ✅
   - Stores Super Admin user(s)
   - Has `status` field (active/inactive)

2. **`roles` table** ✅
   - Stores platform roles (currently only "Super Admin")
   - Has `permissions` JSON field (marked as "Legacy - migrate to permissions table")
   - Has `is_system` flag (system roles cannot be deleted)

3. **`user_roles` table** ✅
   - M2M relationship between users and roles
   - Links Super Admin user to "Super Admin" role

### What's Missing

1. **Granular Permissions System**
   - Currently using JSON field in `roles.permissions` (legacy)
   - No relational permissions table
   - No permission-to-role mapping table
   - Hard to query, filter, and manage permissions

2. **Permission Structure**
   - No standardized permission format
   - No resource:action pattern
   - No permission categories/groups

3. **Permission Management**
   - Cannot easily add/remove permissions
   - Cannot assign custom permissions to roles
   - No permission inheritance or hierarchy

---

## Proposed Access Management System

### Architecture Overview

```
┌─────────────┐
│   users     │ (Super Admin users)
└──────┬──────┘
       │
       │ (via user_roles)
       ▼
┌─────────────┐
│    roles    │ (Platform roles: "Super Admin", etc.)
└──────┬──────┘
       │
       │ (via role_permissions)
       ▼
┌─────────────┐
│ permissions │ (Granular permissions: "tenant:create", etc.)
└─────────────┘
```

### Proposed Database Schema

#### 1. Permissions Table

**Purpose**: Store all available platform-level permissions

```sql
CREATE TABLE IF NOT EXISTS permissions (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE COMMENT 'e.g., "tenant:create"',
    resource        VARCHAR(50)  NOT NULL COMMENT 'e.g., "tenant", "user", "theme"',
    action          VARCHAR(20)  NOT NULL COMMENT 'e.g., "create", "read", "update", "delete"',
    description     VARCHAR(255) NULL,
    category        VARCHAR(50)  NULL COMMENT 'e.g., "tenant_management", "user_management"',
    is_system       TINYINT(1)  NOT NULL DEFAULT 1 COMMENT 'System permissions cannot be deleted',
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_permissions_name (name),
    INDEX idx_permissions_resource (resource),
    INDEX idx_permissions_action (action),
    INDEX idx_permissions_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Permission Naming Convention**: `resource:action`
- Examples:
  - `tenant:create` - Create new tenant
  - `tenant:read` - View tenant details
  - `tenant:update` - Update tenant information
  - `tenant:delete` - Delete tenant
  - `tenant:activate` - Activate suspended tenant
  - `tenant:suspend` - Suspend active tenant
  - `user:create` - Create user (across all tenants)
  - `user:read` - View user (across all tenants)
  - `user:update` - Update user (across all tenants)
  - `user:delete` - Delete user (across all tenants)
  - `theme:read` - View themes
  - `theme:create` - Create theme
  - `platform:configure` - Configure platform settings
  - `platform:view_analytics` - View platform analytics

#### 2. Role Permissions Table (M2M)

**Purpose**: Map roles to permissions

```sql
CREATE TABLE IF NOT EXISTS role_permissions (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    role_id       CHAR(36)  NOT NULL,
    permission_id CHAR(36)  NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_role_permissions (role_id, permission_id),
    INDEX idx_role_permissions_role (role_id),
    INDEX idx_role_permissions_permission (permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) 
        REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) 
        REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Permission Categories

### Platform-Level Permissions

#### 1. Tenant Management
- `tenant:create` - Create new tenant
- `tenant:read` - View tenant list and details
- `tenant:update` - Update tenant information
- `tenant:delete` - Delete tenant
- `tenant:activate` - Activate suspended tenant
- `tenant:suspend` - Suspend active tenant
- `tenant:provision` - Trigger tenant provisioning
- `tenant:view_usage` - View tenant usage metrics

#### 2. User Management (Cross-Tenant)
- `user:create` - Create user in any tenant
- `user:read` - View user in any tenant
- `user:update` - Update user in any tenant
- `user:delete` - Delete user in any tenant
- `user:impersonate` - Impersonate user (for support)

#### 3. Theme Management
- `theme:create` - Create new theme
- `theme:read` - View themes
- `theme:update` - Update theme
- `theme:delete` - Delete theme
- `theme:publish` - Publish theme to library

#### 4. Schema Template Management
- `schema_template:create` - Create schema template
- `schema_template:read` - View schema templates
- `schema_template:update` - Update schema template
- `schema_template:delete` - Delete schema template

#### 5. Library Item Management
- `library_item:create` - Create library item
- `library_item:read` - View library items
- `library_item:update` - Update library item
- `library_item:delete` - Delete library item

#### 6. Platform Configuration
- `platform:configure` - Configure platform settings
- `platform:view_analytics` - View platform analytics
- `platform:manage_extensions` - Manage extensions
- `platform:manage_translations` - Manage translations

#### 7. System Administration
- `system:view_logs` - View system logs
- `system:manage_backups` - Manage backups
- `system:view_health` - View system health

---

## Super Admin Role Setup

### Default Permissions for "Super Admin" Role

The "Super Admin" role should have **ALL** permissions by default:

```sql
-- After creating permissions, assign all to "Super Admin" role
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Super Admin') as role_id,
    id as permission_id
FROM permissions;
```

**Alternative Approach**: Use a special flag in `roles` table:
- `has_all_permissions` TINYINT(1) DEFAULT 0
- If `has_all_permissions = 1`, bypass permission checks (grant all permissions)

---

## Implementation Benefits

### 1. **Flexibility**
- ✅ Easy to add new permissions
- ✅ Easy to create custom roles with specific permissions
- ✅ Can assign permissions granularly

### 2. **Maintainability**
- ✅ Relational structure (easier to query)
- ✅ Clear permission definitions
- ✅ Can version permissions

### 3. **Security**
- ✅ Principle of least privilege
- ✅ Fine-grained access control
- ✅ Audit trail (who has what permissions)

### 4. **Scalability**
- ✅ Can add new resources/actions easily
- ✅ Supports permission inheritance (future)
- ✅ Supports conditional permissions (future)

---

## Migration Strategy

### Step 1: Create New Tables
1. Create `permissions` table
2. Create `role_permissions` table

### Step 2: Seed Permissions
1. Insert all platform-level permissions
2. Categorize permissions by resource

### Step 3: Migrate Existing Data
1. For "Super Admin" role: Assign all permissions
2. For future roles: Assign specific permissions

### Step 4: Update Application Code
1. Create permission checking service
2. Update guards/decorators to use permissions
3. Remove JSON-based permission checks

### Step 5: Deprecate Legacy Field
1. Mark `roles.permissions` JSON field as deprecated
2. Remove in future version

---

## Permission Checking Implementation

### Backend Service

```typescript
// backend/src/permissions/permissions.service.ts

@Injectable()
export class PermissionsService {
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    // Check if user's role has the permission
    // If role has has_all_permissions flag, return true
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    // Get all permissions for user's roles
  }
}
```

### Guard/Decorator

```typescript
// backend/src/permissions/decorators/require-permission.decorator.ts

@RequirePermission('tenant:create')
async createTenant() {
  // Only users with tenant:create permission can access
}
```

---

## Comparison: Current vs Proposed

| Aspect | Current (JSON) | Proposed (Relational) |
|--------|---------------|----------------------|
| **Structure** | JSON field in roles | Separate permissions table |
| **Querying** | Hard (JSON queries) | Easy (SQL joins) |
| **Management** | Manual JSON editing | CRUD operations |
| **Scalability** | Limited | Highly scalable |
| **Flexibility** | Low | High |
| **Audit Trail** | Difficult | Easy (relational) |
| **Performance** | Slower (JSON parsing) | Faster (indexed queries) |

---

## Recommendations

### ✅ **Implement Relational Permissions System**

**Reasons**:
1. Better maintainability
2. Easier to query and filter
3. Supports future features (permission inheritance, conditional permissions)
4. Better performance
5. Clearer audit trail

### ✅ **Keep JSON Field Temporarily**

- Mark `roles.permissions` as deprecated
- Support both systems during migration
- Remove JSON field in future version

### ✅ **Start with Super Admin**

- Assign all permissions to "Super Admin" role
- This maintains current behavior
- Allows gradual migration

### ✅ **Future Enhancements**

1. **Permission Inheritance**: Roles can inherit from other roles
2. **Conditional Permissions**: Permissions based on conditions (e.g., "tenant:update" only for own tenant)
3. **Permission Groups**: Group related permissions
4. **Dynamic Permissions**: Permissions that change based on context

---

## Next Steps

1. **Review this proposal** - Confirm approach
2. **Create database schema** - Add permissions and role_permissions tables
3. **Seed initial permissions** - Insert all platform-level permissions
4. **Assign to Super Admin** - Grant all permissions to Super Admin role
5. **Create permission service** - Backend service for permission checks
6. **Update guards/decorators** - Use new permission system
7. **Test thoroughly** - Ensure Super Admin still has full access

---

## Questions for Discussion

1. **Should we use `has_all_permissions` flag or assign all permissions?**
   - Recommendation: Assign all permissions (more explicit, better audit trail)

2. **Should permissions be hierarchical?**
   - Example: `tenant:*` grants all tenant permissions
   - Recommendation: Start simple, add wildcards later if needed

3. **Should we support custom permissions?**
   - Recommendation: Yes, but mark as non-system permissions

4. **How to handle tenant-level permissions?**
   - Tenant databases already have permissions table for content
   - Platform permissions are separate (for platform-level resources)

---

**Status**: Ready for Review  
**Next Action**: Awaiting approval to implement
