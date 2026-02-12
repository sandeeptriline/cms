# Permissions System Setup

**Last Updated**: 2026-02-12

---

## Overview

The CMS platform uses a granular permissions system for access control. Permissions are stored in a relational database structure, allowing fine-grained control over what users can do.

---

## Database Setup

### 1. Create Tables

The permissions tables are included in `platform-db.sql`:

- `permissions` - Stores all available permissions
- `role_permissions` - Maps roles to permissions (M2M)

Run the platform database setup:

```bash
cd backend
./scripts/setup-platform-database.sh
```

### 2. Seed Permissions

Seed all platform-level permissions and assign them to Super Admin:

```bash
cd backend
./scripts/seed-permissions.sh
```

This script will:
1. Insert all platform permissions (tenant management, user management, themes, etc.)
2. Assign all permissions to the "Super Admin" role

---

## Permission Structure

### Permission Naming Convention

Permissions follow the format: `resource:action`

Examples:
- `tenant:create` - Create new tenant
- `tenant:read` - View tenant details
- `tenant:update` - Update tenant information
- `tenant:delete` - Delete tenant
- `user:create` - Create user (across all tenants)
- `theme:read` - View themes

### Permission Categories

1. **Tenant Management** (`tenant_management`)
   - `tenant:create`, `tenant:read`, `tenant:update`, `tenant:delete`
   - `tenant:activate`, `tenant:suspend`, `tenant:provision`
   - `tenant:view_usage`

2. **User Management** (`user_management`)
   - `user:create`, `user:read`, `user:update`, `user:delete`
   - `user:impersonate`

3. **Theme Management** (`theme_management`)
   - `theme:create`, `theme:read`, `theme:update`, `theme:delete`
   - `theme:publish`

4. **Schema Template Management** (`schema_management`)
   - `schema_template:create`, `schema_template:read`, `schema_template:update`, `schema_template:delete`

5. **Library Item Management** (`library_management`)
   - `library_item:create`, `library_item:read`, `library_item:update`, `library_item:delete`

6. **Platform Configuration** (`platform_config`)
   - `platform:configure`, `platform:view_analytics`
   - `platform:manage_extensions`, `platform:manage_translations`

7. **System Administration** (`system_admin`)
   - `system:view_logs`, `system:manage_backups`, `system:view_health`

---

## Usage

### Backend: Using Permissions

#### 1. Check Permission in Service

```typescript
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class TenantsService {
  constructor(private permissionsService: PermissionsService) {}

  async createTenant(userId: string, data: CreateTenantDto) {
    // Check if user has permission
    const hasPermission = await this.permissionsService.hasPermission(
      userId,
      'tenant:create'
    );

    if (!hasPermission) {
      throw new ForbiddenException('Permission denied: tenant:create required');
    }

    // Create tenant...
  }
}
```

#### 2. Use Permission Guard on Routes

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';

@Controller('tenants')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TenantsController {
  @Post()
  @RequirePermission('tenant:create')
  async create(@Body() createTenantDto: CreateTenantDto) {
    // Only users with tenant:create permission can access
  }
}
```

#### 3. Require Multiple Permissions

```typescript
// Require any of the permissions
@RequireAnyPermission(['tenant:create', 'tenant:update'])

// Require all permissions
@RequireAllPermissions(['tenant:read', 'tenant:update'])
```

#### 4. Get User Permissions

```typescript
const permissions = await permissionsService.getUserPermissions(userId);
// Returns: ['tenant:create', 'tenant:read', 'user:create', ...]
```

---

## Super Admin Setup

The "Super Admin" role automatically gets **all permissions** when you run the seed script.

To verify:

```sql
SELECT COUNT(*) FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
WHERE r.name = 'Super Admin';
```

This should return the total number of permissions (currently ~30+).

---

## Adding New Permissions

### 1. Add to Database

```sql
INSERT INTO permissions (id, name, resource, action, description, category, is_system)
VALUES (
  UUID(),
  'new_resource:new_action',
  'new_resource',
  'new_action',
  'Description of what this permission allows',
  'category_name',
  1
);
```

### 2. Assign to Role

```sql
INSERT INTO role_permissions (id, role_id, permission_id)
VALUES (
  UUID(),
  (SELECT id FROM roles WHERE name = 'Super Admin'),
  (SELECT id FROM permissions WHERE name = 'new_resource:new_action')
);
```

### 3. Update Seed Script

Add the new permission to `backend/scripts/seed-permissions.sql` for future setups.

---

## Permission Checking Flow

```
User Request
    ↓
JwtAuthGuard (validates token, sets user)
    ↓
PermissionGuard (checks permission requirement)
    ↓
PermissionsService.hasPermission(userId, permission)
    ↓
Query: user → user_roles → role → role_permissions → permission
    ↓
Allow or Deny
```

---

## Troubleshooting

### Issue: Permission denied for Super Admin

**Solution**: Ensure Super Admin role has all permissions assigned:

```bash
cd backend
./scripts/seed-permissions.sh
```

### Issue: Permission not found

**Solution**: Check if permission exists in database:

```sql
SELECT * FROM permissions WHERE name = 'tenant:create';
```

### Issue: User has no permissions

**Solution**: Check user's roles and role permissions:

```sql
-- Get user's roles
SELECT r.name FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = '<user_id>';

-- Get role's permissions
SELECT p.name FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = '<role_id>';
```

---

## Related Documentation

- [Access Control Rules](../../../docs/ACCESS_CONTROL_RULES.md)
- [Access Management Analysis](../../../docs/ACCESS_MANAGEMENT_ANALYSIS.md)
- [Super Admin Architecture](../../../docs/SUPER_ADMIN_ARCHITECTURE.md)

---

**Status**: Implemented and Ready for Use
