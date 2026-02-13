# Troubleshooting Guide

**Last Updated**: 2026-02-13

---

## Common Issues & Solutions

### 1. MySQL Authentication Issues

#### Problem: `Access denied for user 'root'@'localhost'` on Ubuntu/Debian

**Cause**: MySQL uses `auth_socket` authentication by default on Linux

**Solution**: Use `sudo mysql` instead of `mysql -u root -p`

```bash
# Correct way (uses system user authentication)
sudo mysql

# Then run your SQL commands
USE cms_platform;
SHOW TABLES;
```

**Note**: If you need password authentication, you can change the authentication method:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

---

### 2. User Account Activation

#### Problem: User cannot login - "Invalid credentials" or "Account not active"

**Check user status:**
```sql
-- In tenant database
USE cms_tenant_<tenant_id>;
SELECT id, email, status FROM users WHERE email = 'user@example.com';
```

**Status values:**
- `1` = Active (can login)
- `0` = Inactive (cannot login)
- `-1` = Deleted (soft delete)

**Activate user:**
```sql
UPDATE users SET status = 1 WHERE email = 'user@example.com';
```

**Or use the activation script:**
```bash
cd backend/scripts
chmod +x activate-user.sh
./activate-user.sh <tenant_db_name> <user_email>
```

---

### 3. Database Schema Issues

#### Problem: Missing columns or tables in tenant database

**Check tables:**
```sql
USE cms_tenant_<tenant_id>;
SHOW TABLES;
SHOW COLUMNS FROM roles;
```

**Common fixes:**

1. **Missing `name` column in `roles` table:**
```sql
ALTER TABLE roles ADD COLUMN name VARCHAR(50) NOT NULL AFTER id;
```

2. **Table name mismatch (`tenant_permissions` vs `user_role_permissions`):**
```sql
-- Check current table name
SHOW TABLES LIKE '%permissions%';

-- If using old name, rename it
RENAME TABLE tenant_permissions TO user_role_permissions;
```

3. **Missing columns in `user_roles` table:**
```sql
ALTER TABLE user_roles 
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN updated_by CHAR(36) NULL;
```

**Run setup script to fix all issues:**
```bash
cd backend/scripts
./setup-tenant-permissions.sh <tenant_db_name>
```

---

### 4. API Filter Issues

#### Problem: "All" filter returns empty array

**Check backend logs:**
- Verify query is executing correctly
- Check if users exist in database
- Verify database connection

**Common causes:**
1. Empty filters object being passed incorrectly
2. Query parameter parsing issues
3. Database connection issues

**Solution**: Ensure filters are `undefined` when no filter is selected, not an empty object `{}`

---

### 5. Permission Validation Errors

#### Problem: `Each permission ID must be a valid UUID`

**Cause**: UUID validation too strict (expecting UUID v4)

**Solution**: Backend validation accepts any valid UUID format (not just v4)

**Check permission IDs:**
```sql
SELECT id FROM user_role_permissions LIMIT 5;
```

MySQL's `UUID()` function doesn't guarantee v4 format, so validation was relaxed.

---

### 6. Password Validation Errors

#### Problem: `password must be longer than or equal to 8 characters`

**Solution**: Password validation has been removed from frontend for testing. Backend still validates minimum length.

**For testing**: Backend `LoginDto` has `MinLength(1)` for development.

---

### 7. TypeScript Compilation Errors

#### Problem: `Unable to resolve signature of parameter decorator`

**Cause**: Using `@Type()` decorator on `@Query()` parameter

**Solution**: Use manual parsing instead:
```typescript
@Query('status') status?: string  // Accept as string
// Then parse manually in method body
```

---

### 8. Empty Query Results

#### Problem: Query returns 0 results but users exist in database

**Check:**
1. Database connection is correct
2. Query is executing (check backend logs)
3. Users exist in the correct database
4. Status filter is not excluding users

**Debug query:**
```sql
-- Check total users
SELECT COUNT(*) FROM users;

-- Check by status
SELECT status, COUNT(*) FROM users GROUP BY status;

-- Check specific user
SELECT * FROM users WHERE email = 'user@example.com';
```

---

## Database Verification Queries

### Check Tenant Database Structure

```sql
USE cms_tenant_<tenant_id>;

-- Check all tables
SHOW TABLES;

-- Check roles table
DESCRIBE roles;
SELECT * FROM roles;

-- Check permissions
SELECT COUNT(*) FROM user_role_permissions;
SELECT * FROM user_role_permissions LIMIT 5;

-- Check role permissions
SELECT r.name, COUNT(rp.permission_id) as permission_count 
FROM roles r 
LEFT JOIN role_permissions rp ON r.id = rp.role_id 
GROUP BY r.id, r.name;

-- Check users
SELECT id, email, name, status FROM users;
```

---

## Getting Help

1. **Check backend logs**: Look for error messages and stack traces
2. **Check database**: Verify data exists and structure is correct
3. **Check API responses**: Use browser DevTools Network tab
4. **Review documentation**: Check relevant docs in this folder

---

**Last Updated**: 2026-02-13
