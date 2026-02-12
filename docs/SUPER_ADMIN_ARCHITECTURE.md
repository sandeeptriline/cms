# Super Admin Architecture

**Last Updated**: 2026-02-12

---

## Overview

The CMS platform has **only one Super Admin user** in the entire system. This user is stored in the **platform database** (`cms_platform`), not in tenant databases.

---

## Database Structure

### Platform Database (`cms_platform`)

**Table**: `users`

- Stores **only the Super Admin user**
- Only one active Super Admin user is allowed in the system
- Enforced at application level (backend validation)
- Note: Table name is `users` (same as tenant database) but in platform database

**Schema**:
```sql
CREATE TABLE IF NOT EXISTS users (
    id                   CHAR(36)     NOT NULL PRIMARY KEY,
    email                VARCHAR(255) NOT NULL UNIQUE,
    password_hash        VARCHAR(255) NOT NULL,
    name                 VARCHAR(255) NULL,
    avatar               VARCHAR(500) NULL,
    status               TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '1 = active, 0 = inactive',
    -- ... (same structure as tenant users table)
);
```

**Related Tables**:
- `roles` - Platform roles (only "Super Admin" role should exist)
- `user_roles` - Links users to roles (Super Admin has "Super Admin" role)

### Tenant Databases (`cms_tenant_*`)

**Table**: `users`

- Stores tenant-level users (Admin, Editor, Reviewer, Author, etc.)
- **Does NOT store Super Admin**
- Each tenant has its own users table

---

## Authentication Flow

### Super Admin Login

1. **No tenant ID required** - Super Admin login is platform-level
2. **Check `users` table** in `cms_platform` database
3. **Validate credentials** against platform database
4. **Check user has "Super Admin" role** in `user_roles` table
5. **Generate JWT token** with `roles: ['Super Admin']` and `tenantId: null`
6. **Grant access** to platform admin UI (Tenants, Libraries, Themes, etc.)

### Tenant User Login

1. **Tenant ID required** - Tenant user login requires tenant context
2. **Check `users` table** in `cms_tenant_<tenant_id>` database
3. **Validate credentials** against tenant database
4. **Generate JWT token** with `roles: ['Admin', 'Editor', etc.]` and `tenantId: <tenant_id>`
5. **Grant access** to tenant admin UI (Content Types, Pages, Blocks, Media, etc.)

---

## Backend Implementation Requirements

### 1. Platform User Service

Create a service to manage platform users (Super Admin):

```typescript
// backend/src/platform-users/platform-users.service.ts
@Injectable()
export class PlatformUsersService {
  // Check if Super Admin exists
  async superAdminExists(): Promise<boolean>
  
  // Get Super Admin user
  async getSuperAdmin()
  
  // Create Super Admin (only if none exists)
  async createSuperAdmin(data: { email: string; password: string; name?: string })
  
  // Update Super Admin
  async updateSuperAdmin(id: string, data: { email?: string; name?: string; password?: string })
  
  // Authenticate Super Admin
  async authenticate(email: string, password: string)
}
```

### 2. Authentication Service Updates

Update `AuthService` to handle both platform and tenant authentication:

```typescript
// backend/src/auth/auth.service.ts

// Platform Admin Login (no tenant ID)
async platformAdminLogin(loginDto: LoginDto): Promise<AuthResponse> {
  // Check users table in cms_platform database
  // Verify user has "Super Admin" role
  // Return JWT with roles: ['Super Admin'] and tenantId: null
}

// Tenant User Login (requires tenant ID)
async tenantUserLogin(loginDto: LoginDto, tenantId: string): Promise<AuthResponse> {
  // Check tenant users table
  // Return JWT with roles: ['Admin', 'Editor', etc.]
}
```

### 3. Prisma Schema Updates

Add platform_users model to Prisma schema:

```prisma
// backend/prisma/schema.prisma

model users {
  id                   String      @id @db.Char(36)
  email                String      @unique @db.VarChar(255)
  password_hash        String      @db.VarChar(255)
  name                 String?     @db.VarChar(255)
  avatar               String?     @db.VarChar(500)
  status               Int         @default(1) @db.TinyInt // 1 = active, 0 = inactive
  email_verified_at     DateTime?   @db.Timestamp(0)
  // ... other fields
  created_at           DateTime    @default(now()) @db.Timestamp(0)
  updated_at           DateTime    @default(now()) @updatedAt @db.Timestamp(0)
  
  user_roles           user_roles[]
  
  @@map("users")
}

model roles {
  id           String      @id @db.Char(36)
  name         String      @unique @db.VarChar(50)
  description  String?     @db.VarChar(255)
  is_system    Boolean     @default(true)
  // ... other fields
  
  user_roles   user_roles[]
  
  @@map("roles")
}

model user_roles {
  id         String   @id @db.Char(36)
  user_id    String   @db.Char(36)
  role_id    String   @db.Char(36)
  created_at DateTime @default(now()) @db.Timestamp(0)
  updated_at DateTime @default(now()) @updatedAt @db.Timestamp(0)
  
  user       users    @relation(fields: [user_id], references: [id], onDelete: Cascade)
  role       roles    @relation(fields: [role_id], references: [id], onDelete: Cascade)
  
  @@map("user_roles")
}
```

---

## Frontend Implementation

### 1. Login Flow

The login page should detect if user is trying to login as Super Admin:

```typescript
// frontend/app/(auth)/login/page.tsx

// Option 1: Separate login form for Super Admin
// Option 2: Checkbox "Login as Platform Admin"
// Option 3: Special email pattern (e.g., admin@platform.local)

const handleLogin = async (email: string, password: string, isPlatformAdmin: boolean) => {
  if (isPlatformAdmin) {
    // Call platform admin login endpoint (no tenant ID)
    await authApi.platformAdminLogin({ email, password })
  } else {
    // Call tenant user login endpoint (with tenant ID)
    await authApi.tenantUserLogin({ email, password }, tenantId)
  }
}
```

### 2. Role Detection

The frontend already checks for Super Admin role:

```typescript
// frontend/lib/utils/roles.ts
export function isSuperAdmin(roles?: string[]): boolean {
  // Returns true if user has 'Super Admin' role
}
```

---

## Initial Setup

### Creating the First Super Admin

1. **Database Migration**: Run `platform-db.sql` to create `users`, `roles`, and `user_roles` tables
2. **Create Super Admin**: Use setup script `backend/scripts/create-super-admin.sql` or `PlatformUsersService.createSuperAdmin()`
3. **Validation**: Ensure only one Super Admin exists (enforced in `PlatformUsersService.createSuperAdmin()`)

### Setup Script Example

```typescript
// backend/scripts/create-super-admin.ts

async function createSuperAdmin() {
  const platformUsersService = new PlatformUsersService()
  
  // Check if Super Admin already exists
  if (await platformUsersService.superAdminExists()) {
    throw new Error('Super Admin already exists')
  }
  
  // Create Super Admin
  await platformUsersService.createSuperAdmin({
    email: process.env.PLATFORM_ADMIN_EMAIL,
    password: process.env.PLATFORM_ADMIN_PASSWORD,
    name: 'Platform Administrator',
  })
}
```

---

## Security Considerations

1. **Only One Super Admin**: Enforce at application level (backend validation)
2. **Platform Database Access**: Super Admin has access to platform database only
3. **Tenant Isolation**: Super Admin can view/manage tenants but cannot access tenant data directly (unless impersonating)
4. **JWT Token**: Super Admin tokens should have `tenantId: null` or special platform identifier
5. **Route Protection**: Platform admin routes should check for Super Admin role

---

## Related Documentation

- [Access Control Rules](./ACCESS_CONTROL_RULES.md)
- [Database Structure](./DATABASE_STRUCTURE.md)
- [Platform Database Schema](./platform-db.sql)
- [Tenant Database Schema](./tenant-db.sql)
- [Authentication Guide](../backend/docs/api/AUTHENTICATION_GUIDE.md)
- [Backend Implementation Summary](../backend/docs/development/SUPER_ADMIN_IMPLEMENTATION_SUMMARY.md)

---

**Note**: The Super Admin user is the only user stored in the platform database. All other users (Admin, Editor, Reviewer, Author) are stored in their respective tenant databases.
