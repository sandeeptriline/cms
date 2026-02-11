# MySQL Root Authentication Fix

## Problem

```
ERROR 1698 (28000): Access denied for user 'root'@'localhost'
```

This happens when MySQL root user uses `auth_socket` plugin instead of password authentication (common on Linux).

---

## Quick Fix: Use Sudo

The easiest solution is to use `sudo mysql` instead of `mysql -u root -p`:

```bash
# Instead of: mysql -u root -p
sudo mysql

# Or for scripts:
sudo mysql database_name < schema.sql
```

---

## Permanent Fix: Enable Password Authentication

If you want to use password authentication:

### Option 1: Change Root to Use Password (Recommended for Development)

```sql
-- Connect with sudo
sudo mysql

-- Change root authentication
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Sandeep@123!';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify
SELECT user, host, plugin FROM mysql.user WHERE user='root';

-- Exit
EXIT;
```

Now you can use: `mysql -u root -p`

---

### Option 2: Create Dedicated User (Recommended for Production)

```sql
-- Connect with sudo
sudo mysql

-- Create CMS user with password
CREATE USER 'cms_user'@'localhost' IDENTIFIED BY 'Sandeep@123!';

-- Grant privileges
GRANT ALL PRIVILEGES ON cms_platform.* TO 'cms_user'@'localhost';
GRANT ALL PRIVILEGES ON cms_tenant_*.* TO 'cms_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify
SELECT user, host, plugin FROM mysql.user WHERE user='cms_user';

-- Exit
EXIT;
```

Then update `backend/.env`:
```env
DATABASE_URL=mysql://cms_user:Sandeep%40123%21@localhost:3306/cms_platform
MYSQL_ROOT_URL=mysql://cms_user:Sandeep%40123%21@localhost:3306
```

---

## For Migration Script

The migration script now auto-detects which authentication method works:
- Tries password authentication first
- Falls back to `sudo mysql` if password fails
- Shows which method it's using

If both fail, run manually:
```bash
sudo mysql cms_tenant_auth_test_tenant_1 < ../docs/tenant-db.sql
```

---

**Last Updated**: 2026-02-11
