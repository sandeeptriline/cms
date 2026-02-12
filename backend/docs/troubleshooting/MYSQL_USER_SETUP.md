# MySQL User Setup Troubleshooting

**Date**: 2026-02-12

---

## Issue: Authentication Failed for `cms_user`

If you're getting:
```
ERROR 1045 (28000): Access denied for user 'cms_user'@'localhost' (using password: YES)
```

## Issue: Password Policy Requirements

If you're getting:
```
#1819 - Your password does not satisfy the current policy requirements
```

**Solution**: MySQL 8.0+ requires passwords to meet certain criteria. Use one of the solutions below.

## Issue: User Already Exists (#1396)

If you're getting:
```
#1396 - Operation CREATE USER failed for 'cms_user'@'localhost'
```

**Solution**: The user already exists. You have two options:

### Option 1: Drop and Recreate (Recommended if you want a fresh start)

```sql
-- Login as root
sudo mysql

-- Drop existing user (this will also remove all privileges)
DROP USER IF EXISTS 'cms_user'@'localhost';

-- Create user with new password
CREATE USER 'cms_user'@'localhost' IDENTIFIED BY 'Admin@123!Secure';

-- Grant privileges
GRANT ALL PRIVILEGES ON cms_platform.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;
```

### Option 2: Update Existing User Password

```sql
-- Login as root
sudo mysql

-- Check if user exists and what hosts it's configured for
SELECT User, Host FROM mysql.user WHERE User='cms_user';

-- Update password for existing user
ALTER USER 'cms_user'@'localhost' IDENTIFIED BY 'Admin@123!Secure';

-- Ensure privileges are granted
GRANT ALL PRIVILEGES ON cms_platform.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;
```

**Note**: If you see the user exists for a different host (e.g., `'cms_user'@'%'`), you may need to update that user instead or create a separate user for `localhost`.

## Solution Steps

### Step 1: Verify User Exists

```sql
-- Login as root
sudo mysql

-- Check if user exists and what hosts it's configured for
SELECT User, Host FROM mysql.user WHERE User='cms_user';
```

**If user doesn't exist**, create it:

```sql
-- MySQL 8.0+ password policy requires:
-- - At least 8 characters
-- - Mix of uppercase, lowercase, numbers, and special characters
-- - Not a common dictionary word

-- Option 1: Use a strong password (recommended)
CREATE USER 'cms_user'@'localhost' IDENTIFIED BY 'Admin@123!Secure';

-- Option 2: If you need to use a simpler password, temporarily disable validation (development only)
SET GLOBAL validate_password.policy = LOW;
SET GLOBAL validate_password.length = 6;
CREATE USER 'cms_user'@'localhost' IDENTIFIED BY 'Admin123';
SET GLOBAL validate_password.policy = MEDIUM;  -- Restore default

FLUSH PRIVILEGES;
```

**If user already exists** (you got error #1396), see the "Issue: User Already Exists" section above.

### Step 2: Verify Password

If the user exists but authentication fails, the password might be incorrect. Reset it:

```sql
-- Login as root
sudo mysql

-- Reset password (use a strong password that meets policy requirements)
ALTER USER 'cms_user'@'localhost' IDENTIFIED BY 'Admin@123!Secure';
FLUSH PRIVILEGES;
```

**Note**: If your password contains special characters like `@` or `!`, remember to URL-encode them in your `.env` file:
- `Admin@123!Secure` → `Admin%40123%21Secure` in DATABASE_URL

### Step 3: Verify Privileges

```sql
-- Login as root
sudo mysql

-- Check privileges
SHOW GRANTS FOR 'cms_user'@'localhost';

-- If privileges are missing, grant them:
-- Note: MySQL doesn't support wildcards in GRANT statements
-- Tenant databases will be granted privileges automatically during provisioning
GRANT ALL PRIVILEGES ON cms_platform.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;
```

### Step 4: Test Connection

```bash
# Test connection (replace with your actual password)
mysql -u cms_user -p'Admin@123!Secure' -e "SELECT 'Connection successful!' as status;"

# Or use interactive password prompt (more secure)
mysql -u cms_user -p -e "SELECT 'Connection successful!' as status;"
# Enter password when prompted
```

### Step 5: Verify .env File

Make sure your `backend/.env` has the correct DATABASE_URL:

**If password is `Admin@123!Secure`** (with special characters):
```env
DATABASE_URL=mysql://cms_user:Admin%40123%21Secure@localhost:3306/cms_platform
```

**If password is `Admin123`** (simple password, requires lowered policy):
```env
DATABASE_URL=mysql://cms_user:Admin123@localhost:3306/cms_platform
```

**URL Encoding Reference**:
- `@` → `%40`
- `!` → `%21`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `*` → `%2A`
- `+` → `%2B`
- `=` → `%3D`
- `?` → `%3F`

---

## Alternative: Use Root User (Development Only)

If you prefer to use the root user for development:

```env
DATABASE_URL=mysql://root:YOUR_ROOT_PASSWORD@localhost:3306/cms_platform
```

**Warning**: Only use root in development. For production, always use a dedicated user with limited privileges.

---

## Common Issues

### Issue: User Created but Still Can't Connect

**Solution**: Make sure you're using the exact password that was set when creating the user. Passwords are case-sensitive.

### Issue: Privileges Not Applied

**Solution**: Always run `FLUSH PRIVILEGES;` after creating users or granting privileges.

### Issue: Host Mismatch

**Solution**: If you're connecting from a different host, you may need to create the user for that host:
```sql
CREATE USER 'cms_user'@'%' IDENTIFIED BY 'Admin123';
GRANT ALL PRIVILEGES ON cms_platform.* TO 'cms_user'@'%';
FLUSH PRIVILEGES;
```

---

## Quick Setup Script

**Note**: `CREATE USER IF NOT EXISTS` is not supported in MySQL. Use this script instead:

```bash
# Run as root
sudo mysql <<EOF
-- Drop user if exists (to avoid #1396 error)
DROP USER IF EXISTS 'cms_user'@'localhost';

-- Create user with strong password
CREATE USER 'cms_user'@'localhost' IDENTIFIED BY 'Admin@123!Secure';

-- Grant privileges to platform database
GRANT ALL PRIVILEGES ON cms_platform.* TO 'cms_user'@'localhost';

-- Note: Tenant databases (cms_tenant_*) will be granted privileges automatically
-- during tenant provisioning by the backend service
FLUSH PRIVILEGES;

SELECT 'User created successfully!' as status;
EOF
```

**For .env file**, use URL-encoded password:
```env
DATABASE_URL=mysql://cms_user:Admin%40123%21Secure@localhost:3306/cms_platform
```

---

**Last Updated**: 2026-02-12
