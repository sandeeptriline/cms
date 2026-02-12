# Next Steps After Permissions Seeding

**Date**: 2026-02-12

---

## ✅ What's Done

- ✅ Platform database (`cms_platform`) created
- ✅ `permissions` table created and seeded (~33 permissions)
- ✅ `role_permissions` table created
- ✅ Super Admin role has all permissions assigned

---

## 📋 Next Steps

### Step 1: Regenerate Prisma Client ⚠️ **REQUIRED**

The Prisma schema was updated with new models (`permissions`, `role_permissions`). You **must** regenerate the Prisma Client:

```bash
cd /home/sandeep/Documents/NextJs/triline/cms/backend
npx prisma generate
```

**Why**: The Prisma Client needs to be regenerated to include the new `permissions` and `role_permissions` models.

**Expected Output**:
```
✔ Generated Prisma Client (X.XX.XX) to ./node_modules/@prisma/client in XXXms
```

---

### Step 2: Verify Prisma Models

Check if the new models are available:

```bash
cd backend
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); console.log('Prisma Client loaded successfully');"
```

---

### Step 3: Create Super Admin User (If Not Done)

If you haven't created a Super Admin user yet:

```bash
cd /home/sandeep/Documents/NextJs/triline/cms/backend

# Using SQL script (recommended)
sudo mysql cms_platform < scripts/create-super-admin.sql
```

**Default Credentials** (from `create-super-admin.sql`):
- Email: `admin@example.com`
- Password: `admin@123`

**⚠️ Change these in production!**

**See**: [Create Super Admin Guide](./CREATE_SUPER_ADMIN.md) for detailed instructions

---

### Step 4: Verify Super Admin User

```bash
cd /home/sandeep/Documents/NextJs/triline/cms/backend

# Check if Super Admin user exists
sudo mysql -e "USE cms_platform; SELECT u.id, u.email, u.name, u.status, r.name as role FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name = 'Super Admin';"

# Verify user has permissions
sudo mysql -e "USE cms_platform; SELECT COUNT(*) as permission_count FROM role_permissions rp JOIN user_roles ur ON rp.role_id = ur.role_id JOIN users u ON ur.user_id = u.id JOIN roles r ON ur.role_id = r.id WHERE u.email = 'admin@example.com' AND r.name = 'Super Admin';"
```

---

### Step 5: Test Backend Server

Start the backend server and verify it works:

```bash
cd /home/sandeep/Documents/NextJs/triline/cms/backend

# Install dependencies (if needed)
npm install

# Start development server
npm run start:dev
```

**Expected**: Server should start on `http://localhost:3001`

---

### Step 6: Test Permission System

#### 6.1 Test Platform Admin Login

```bash
# Test Super Admin login
curl -X POST http://localhost:3001/api/v1/auth/platform-admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin@123"
  }'
```

**Expected Response**:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "name": "Platform Administrator",
    "roles": ["Super Admin"]
  }
}
```

#### 6.2 Test Permission Checking

After logging in, test if permissions are working:

```bash
# Use the accessToken from login response
TOKEN="your_access_token_here"

# Test a protected endpoint (example: create tenant - requires tenant:create permission)
curl -X POST http://localhost:3001/api/v1/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Tenant",
    "slug": "test-tenant"
  }'
```

---

### Step 7: Use Permissions in Code (Optional)

Now you can use permissions in your controllers:

#### Example: Protect Route with Permission

```typescript
// backend/src/tenants/tenants.controller.ts

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
    // Only users with 'tenant:create' permission can access
    // Super Admin has all permissions, so will have access
  }
}
```

---

## 📊 Verification Checklist

After completing all steps, verify:

- [ ] Prisma Client regenerated successfully
- [ ] Super Admin user exists in `cms_platform.users`
- [ ] Super Admin user has "Super Admin" role assigned
- [ ] Super Admin user has all permissions (check `role_permissions`)
- [ ] Backend server starts without errors
- [ ] Platform admin login works
- [ ] JWT token contains `roles: ["Super Admin"]`
- [ ] Permission checking works (test with protected endpoint)

---

## 🔍 Quick Verification Commands

```bash
cd /home/sandeep/Documents/NextJs/triline/cms/backend

# 1. Check Prisma Client
npx prisma generate

# 2. Check Super Admin user
sudo mysql -e "USE cms_platform; SELECT u.email, u.status, r.name as role FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name = 'Super Admin';"

# 3. Check permissions count
sudo mysql -e "USE cms_platform; SELECT COUNT(*) as total FROM permissions;"
sudo mysql -e "USE cms_platform; SELECT COUNT(*) as assigned FROM role_permissions rp JOIN roles r ON rp.role_id = r.id WHERE r.name = 'Super Admin';"

# 4. Start server
npm run start:dev
```

---

## 🚀 What You Can Do Now

### 1. **Use Permission Guards**

Protect any route with specific permissions:

```typescript
@RequirePermission('tenant:create')
@RequirePermission('user:delete')
@RequireAnyPermission(['tenant:read', 'tenant:update'])
```

### 2. **Check Permissions in Services**

```typescript
const hasPermission = await this.permissionsService.hasPermission(
  userId,
  'tenant:create'
);
```

### 3. **Get User Permissions**

```typescript
const permissions = await this.permissionsService.getUserPermissions(userId);
// Returns: ['tenant:create', 'tenant:read', 'user:create', ...]
```

---

## 📚 Related Documentation

- [Permissions Setup](./PERMISSIONS_SETUP.md) - Full permissions guide
- [Create Super Admin](./CREATE_SUPER_ADMIN.md) - Super Admin creation
- [Platform Database Setup](./PLATFORM_DATABASE_SETUP.md) - Database setup
- [Access Control Rules](../../../docs/ACCESS_CONTROL_RULES.md) - Access control rules

---

## ⚠️ Important Notes

1. **Prisma Client Must Be Regenerated**: After adding new models, always run `npx prisma generate`

2. **Super Admin Has All Permissions**: The seed script automatically assigns all permissions to Super Admin

3. **Permission Checking**: The `PermissionGuard` will automatically check permissions for routes decorated with `@RequirePermission()`

4. **JWT Token**: Super Admin tokens have `tenantId: null` and `roles: ["Super Admin"]`

---

**Status**: Ready for Next Steps
