# Manual Permissions Seeding Instructions

**Date**: 2026-02-12

---

## Prerequisites

Before seeding permissions, ensure:

1. ✅ Platform database (`cms_platform`) exists
2. ✅ `permissions` table exists
3. ✅ `role_permissions` table exists
4. ✅ `roles` table exists
5. ✅ "Super Admin" role exists

---

## Step-by-Step Instructions

### Step 1: Verify Database and Tables Exist

```bash
cd /home/sandeep/Documents/NextJs/triline/cms/backend

# Check if database exists
sudo mysql -e "SHOW DATABASES LIKE 'cms_platform';"

# Check if permissions table exists
sudo mysql -e "USE cms_platform; SHOW TABLES LIKE 'permissions';"

# Check if role_permissions table exists
sudo mysql -e "USE cms_platform; SHOW TABLES LIKE 'role_permissions';"

# Check if Super Admin role exists
sudo mysql -e "USE cms_platform; SELECT id, name FROM roles WHERE name = 'Super Admin';"
```

**Expected Output**:
- Database should show: `cms_platform`
- Tables should show: `permissions` and `role_permissions`
- Super Admin role should show: one row with id and name

---

### Step 2: Create Database and Tables (If Not Exist)

If database or tables don't exist, run:

```bash
cd /home/sandeep/Documents/NextJs/triline/cms/backend

# Create database (if needed)
sudo mysql -e "CREATE DATABASE IF NOT EXISTS cms_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Create tables (run platform-db.sql)
sudo mysql cms_platform < ../docs/platform-db.sql
```

**Note**: This will create all tables including `permissions` and `role_permissions`.

---

### Step 3: Verify Super Admin Role Exists

```bash
cd /home/sandeep/Documents/NextJs/triline/cms/backend

# Check if Super Admin role exists
sudo mysql -e "USE cms_platform; SELECT id, name FROM roles WHERE name = 'Super Admin';"
```

**If Super Admin role doesn't exist**, create it:

```bash
sudo mysql cms_platform << 'EOF'
INSERT INTO roles (id, name, description, is_system, created_at, updated_at)
VALUES (UUID(), 'Super Admin', 'System-wide administrator with full access', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=name;
SELECT id, name FROM roles WHERE name = 'Super Admin';
EOF
```

---

### Step 4: Seed Permissions

Run the seed SQL script:

```bash
cd /home/sandeep/Documents/NextJs/triline/cms/backend

# Seed all permissions
sudo mysql cms_platform < scripts/seed-permissions.sql
```

**Expected Output**: No errors (script runs silently if successful)

---

### Step 5: Verify Permissions Were Seeded

```bash
cd /home/sandeep/Documents/NextJs/triline/cms/backend

# Count total permissions
sudo mysql -e "USE cms_platform; SELECT COUNT(*) as total_permissions FROM permissions;"

# List permissions by category
sudo mysql -e "USE cms_platform; SELECT category, COUNT(*) as count FROM permissions GROUP BY category ORDER BY category;"

# Show sample permissions
sudo mysql -e "USE cms_platform; SELECT name, resource, action, category FROM permissions ORDER BY category, resource, action LIMIT 10;"
```

**Expected Output**:
- Total permissions: ~33 permissions
- Categories: tenant_management, user_management, theme_management, etc.

---

### Step 6: Verify Super Admin Has All Permissions

```bash
cd /home/sandeep/Documents/NextJs/triline/cms/backend

# Count permissions assigned to Super Admin
sudo mysql -e "USE cms_platform; SELECT COUNT(*) as super_admin_permissions FROM role_permissions rp JOIN roles r ON rp.role_id = r.id WHERE r.name = 'Super Admin';"

# Show sample permissions assigned to Super Admin
sudo mysql -e "USE cms_platform; SELECT p.name, p.resource, p.action FROM role_permissions rp JOIN roles r ON rp.role_id = r.id JOIN permissions p ON rp.permission_id = p.id WHERE r.name = 'Super Admin' ORDER BY p.category, p.resource, p.action LIMIT 10;"
```

**Expected Output**:
- Super Admin permissions count should match total permissions count (~33)
- Should show permissions like: `tenant:create`, `tenant:read`, `user:create`, etc.

---

## Complete Command Sequence

Here's the complete sequence to run manually:

```bash
# Navigate to backend directory
cd /home/sandeep/Documents/NextJs/triline/cms/backend

# Step 1: Create database (if needed)
sudo mysql -e "CREATE DATABASE IF NOT EXISTS cms_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Step 2: Create tables (if needed)
sudo mysql cms_platform < ../docs/platform-db.sql

# Step 3: Create Super Admin role (if needed)
sudo mysql cms_platform << 'EOF'
INSERT INTO roles (id, name, description, is_system, created_at, updated_at)
VALUES (UUID(), 'Super Admin', 'System-wide administrator with full access', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=name;
EOF

# Step 4: Seed permissions
sudo mysql cms_platform < scripts/seed-permissions.sql

# Step 5: Verify
sudo mysql -e "USE cms_platform; SELECT COUNT(*) as total_permissions FROM permissions;"
sudo mysql -e "USE cms_platform; SELECT COUNT(*) as super_admin_permissions FROM role_permissions rp JOIN roles r ON rp.role_id = r.id WHERE r.name = 'Super Admin';"
```

---

## Troubleshooting

### Issue: "Table 'permissions' doesn't exist"

**Solution**: Run platform-db.sql first:
```bash
sudo mysql cms_platform < ../docs/platform-db.sql
```

### Issue: "Super Admin role not found"

**Solution**: Create the role:
```bash
sudo mysql cms_platform << 'EOF'
INSERT INTO roles (id, name, description, is_system, created_at, updated_at)
VALUES (UUID(), 'Super Admin', 'System-wide administrator with full access', 1, NOW(), NOW());
EOF
```

### Issue: "Duplicate entry" errors

**Solution**: This is normal if permissions already exist. The script uses `INSERT` which will fail on duplicates. You can safely ignore these errors, or check if permissions are already seeded:
```bash
sudo mysql -e "USE cms_platform; SELECT COUNT(*) FROM permissions;"
```

### Issue: "Access denied" for sudo mysql

**Solution**: 
- If you have `auth_socket` authentication, `sudo mysql` should work without password
- If it asks for password, enter your system sudo password
- Alternative: Use root password directly:
  ```bash
  mysql -u root -p'Sandeep@123!' cms_platform < scripts/seed-permissions.sql
  ```

---

## Verification Checklist

After running all steps, verify:

- [ ] Database `cms_platform` exists
- [ ] `permissions` table exists and has ~33 rows
- [ ] `role_permissions` table exists
- [ ] "Super Admin" role exists
- [ ] Super Admin has all permissions assigned (~33 role_permissions entries)
- [ ] Permissions are categorized correctly (tenant_management, user_management, etc.)

---

## Expected Results

### Permissions Count by Category

After seeding, you should have:

- **Tenant Management**: 8 permissions
- **User Management**: 5 permissions
- **Theme Management**: 5 permissions
- **Schema Template Management**: 4 permissions
- **Library Item Management**: 4 permissions
- **Platform Configuration**: 4 permissions
- **System Administration**: 3 permissions

**Total**: ~33 permissions

### Super Admin Permissions

Super Admin should have **all** permissions assigned (same count as total permissions).

---

## Next Steps

After successful seeding:

1. **Regenerate Prisma Client**:
   ```bash
   cd backend
   npx prisma generate
   ```

2. **Test Permission System**:
   - Start backend server
   - Login as Super Admin
   - Verify permissions are working

3. **Create Super Admin User** (if not done):
   ```bash
   sudo mysql cms_platform < scripts/create-super-admin.sql
   ```

---

## Related Documentation

- [Permissions Setup](./PERMISSIONS_SETUP.md) - Full setup guide
- [Platform Database Setup](./PLATFORM_DATABASE_SETUP.md) - Database setup
- [Create Super Admin](./CREATE_SUPER_ADMIN.md) - Super Admin creation

---

**Status**: Ready to Execute Manually
