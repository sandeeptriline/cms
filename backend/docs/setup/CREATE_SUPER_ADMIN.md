# Create Super Admin User

**Last Updated**: 2026-02-12

---

## Overview

This guide explains how to create the first Super Admin user in the platform database. The Super Admin is the only user stored in `cms_platform` and has full access to all tenants and platform features.

---

## Prerequisites

- ✅ Platform database (`cms_platform`) exists
- ✅ `users`, `roles`, and `user_roles` tables exist
- ✅ "Super Admin" role exists
- ✅ Permissions are seeded

---

## Method 1: Using SQL Script (Recommended)

### Step 1: Run the SQL Script

```bash
cd /home/sandeep/Documents/NextJs/triline/cms/backend
sudo mysql cms_platform < scripts/create-super-admin.sql
```

### Step 2: Verify Creation

```bash
sudo mysql -e "USE cms_platform; SELECT u.id, u.email, u.name, u.status, r.name as role FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name = 'Super Admin';"
```

**Expected Output**:
```
+--------------------------------------+------------------+------------------------+--------+-------------+
| id                                   | email            | name                   | status | role        |
+--------------------------------------+------------------+------------------------+--------+-------------+
| <uuid>                               | admin@example.com| Platform Administrator |      1 | Super Admin |
+--------------------------------------+------------------+------------------------+--------+-------------+
```

---

## Method 2: Manual SQL Execution

### Step 1: Generate Password Hash

First, generate a bcrypt hash for your password:

```bash
cd backend
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your_password', 10).then(console.log)"
```

**Example** (for password `admin@123`):
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin@123', 10).then(console.log)"
# Output: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

### Step 2: Create User in MySQL

```bash
sudo mysql cms_platform
```

```sql
-- Set variables
SET @admin_email = 'admin@example.com';
SET @admin_password_hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'; -- Replace with your generated hash
SET @admin_name = 'Platform Administrator';

-- Get Super Admin role ID
SET @super_admin_role_id = (SELECT id FROM roles WHERE name = 'Super Admin' LIMIT 1);

-- Create user
INSERT INTO users (id, email, password_hash, name, status, created_at, updated_at)
VALUES (UUID(), @admin_email, @admin_password_hash, @admin_name, 1, NOW(), NOW());

-- Get user ID
SET @admin_user_id = (SELECT id FROM users WHERE email = @admin_email LIMIT 1);

-- Assign Super Admin role
INSERT INTO user_roles (id, user_id, role_id, created_at, updated_at)
VALUES (UUID(), @admin_user_id, @super_admin_role_id, NOW(), NOW());

-- Verify
SELECT u.email, u.name, r.name as role 
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id 
WHERE u.email = @admin_email;
```

---

## Default Credentials

The SQL script creates a Super Admin with:

- **Email**: `admin@example.com`
- **Password**: `admin@123`
- **Name**: `Platform Administrator`

**⚠️ IMPORTANT**: Change these credentials in production!

---

## Verify Super Admin Setup

### Check User Exists

```bash
sudo mysql -e "USE cms_platform; SELECT id, email, name, status FROM users WHERE email = 'admin@example.com';"
```

### Check Role Assignment

```bash
sudo mysql -e "USE cms_platform; SELECT u.email, r.name as role FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE u.email = 'admin@example.com';"
```

### Check Permissions

```bash
sudo mysql -e "USE cms_platform; SELECT COUNT(*) as permission_count FROM role_permissions rp JOIN user_roles ur ON rp.role_id = ur.role_id JOIN users u ON ur.user_id = u.id WHERE u.email = 'admin@example.com';"
```

**Expected**: Should show ~33 permissions (all permissions)

---

## Test Login

### Using cURL

```bash
curl -X POST http://localhost:3001/api/v1/auth/platform-admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin@123"
  }'
```

### Expected Response

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

---

## Troubleshooting

### Issue: "Super Admin already exists"

**Solution**: Only one Super Admin is allowed. Check if one already exists:

```bash
sudo mysql -e "USE cms_platform; SELECT COUNT(*) FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name = 'Super Admin';"
```

If count is > 0, Super Admin already exists. Use the existing credentials or update the password.

### Issue: "Role 'Super Admin' not found"

**Solution**: Create the role first:

```bash
sudo mysql cms_platform << 'EOF'
INSERT INTO roles (id, name, description, is_system, created_at, updated_at)
VALUES (UUID(), 'Super Admin', 'System-wide administrator with full access', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=name;
EOF
```

### Issue: Login fails with "Invalid credentials"

**Solution**: 
1. Verify password hash is correct
2. Check user status is `1` (active)
3. Verify user has Super Admin role assigned

```bash
sudo mysql -e "USE cms_platform; SELECT u.email, u.status, r.name as role FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE u.email = 'admin@example.com';"
```

---

## Change Password

To change the Super Admin password:

### Method 1: Using Backend Service (Recommended)

Once the backend is running, you can use the `PlatformUsersService.updateSuperAdmin()` method.

### Method 2: Using SQL

```bash
# Generate new password hash
cd backend
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('new_password', 10).then(console.log)"

# Update in database
sudo mysql cms_platform << 'EOF'
SET @admin_email = 'admin@example.com';
SET @new_password_hash = '$2b$10$...'; -- Replace with generated hash

UPDATE users 
SET password_hash = @new_password_hash, updated_at = NOW()
WHERE email = @admin_email;
EOF
```

---

## Security Best Practices

1. **Change Default Credentials**: Never use default credentials in production
2. **Strong Password**: Use a strong, unique password
3. **Regular Rotation**: Change password periodically
4. **Limit Access**: Only create Super Admin when absolutely necessary
5. **Monitor Activity**: Log all Super Admin actions

---

## Related Documentation

- [Super Admin Architecture](../../../docs/SUPER_ADMIN_ARCHITECTURE.md)
- [Access Control Rules](../../../docs/ACCESS_CONTROL_RULES.md)
- [Platform Database Setup](./PLATFORM_DATABASE_SETUP.md)
- [Next Steps After Permissions](./NEXT_STEPS_AFTER_PERMISSIONS.md)

---

**Status**: Ready to Use
