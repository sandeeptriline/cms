# MySQL Connection Fix

## Issue

Prisma is getting "Access denied for user 'root'@'localhost'" error.

## Root Cause

MySQL on Linux often uses `auth_socket` plugin for root user instead of password authentication. This means:
- Command-line MySQL with password won't work
- phpMyAdmin might work because it uses different authentication
- Prisma needs password-based authentication

## Solutions

### Solution 1: Create Dedicated MySQL User (Recommended)

Create a dedicated user for the CMS project with password authentication:

```sql
-- Connect to MySQL (use sudo if needed)
sudo mysql

-- Create user
CREATE USER 'cms_user'@'localhost' IDENTIFIED BY 'Sandeep@123!';

-- Grant privileges to platform database
GRANT ALL PRIVILEGES ON cms_platform.* TO 'cms_user'@'localhost';

-- Note: Tenant databases (cms_tenant_*) will be created dynamically
-- Privileges for tenant databases will be granted when they are created
-- For now, we grant privileges to platform database only

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
```

---

### Solution 2: Change Root Authentication Method

**⚠️ Warning**: This changes how root user authenticates. Use with caution.

```sql
-- Connect to MySQL
sudo mysql

-- Change root to use password authentication
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Sandeep@123!';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify
SELECT user, host, plugin FROM mysql.user WHERE user='root';

-- Exit
EXIT;
```

---

### Solution 3: Use Existing MySQL User

If you have another MySQL user that works with password authentication:

1. Find the user:
   ```sql
   sudo mysql -e "SELECT user, host, plugin FROM mysql.user;"
   ```

2. Update `.env` with that user's credentials:
   ```env
   DATABASE_URL=mysql://username:password@localhost:3306/cms_platform
   ```

---

## Testing Connection

After applying a solution, test the connection:

```bash
cd backend

# Test with Prisma
npx prisma db pull

# Or test with Node.js
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ Connected!'); prisma.\$disconnect(); });"
```

---

## Recommended Approach

**Use Solution 1** (dedicated user) because:
- ✅ More secure (not using root)
- ✅ Better for production
- ✅ Easier to manage permissions
- ✅ No changes to root authentication

---

**Last Updated**: 2026
