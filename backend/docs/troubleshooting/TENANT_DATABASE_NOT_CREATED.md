# Tenant Database Not Created

**Last Updated**: 2026-02-12

---

## Issue

When creating a tenant, the `db_name` is stored in the `tenants` table, but the actual MySQL database is not created.

**Symptoms:**
- Tenant record exists in `cms_platform.tenants` table
- `db_name` field has value like `cms_tenant_test_tenant_2`
- But MySQL database `cms_tenant_test_tenant_2` does not exist
- Tenant status remains `provisioning` or becomes `suspended`

---

## Root Cause

The tenant provisioning service requires **MySQL root/admin privileges** to create databases. The regular `cms_user` typically only has privileges on `cms_platform.*` and does not have `CREATE DATABASE` privilege.

---

## Solution

### Option 1: Configure MYSQL_ROOT_URL (Recommended)

Add `MYSQL_ROOT_URL` to your `backend/.env` file:

```env
# MySQL root connection for tenant provisioning
# Format: mysql://root:password@host:port
# Note: URL-encode special characters in password
MYSQL_ROOT_URL=mysql://root:YOUR_ROOT_PASSWORD@localhost:3306
```

**If your root password has special characters**, URL-encode them:
- `@` → `%40`
- `!` → `%21`
- `#` → `%23`
- etc.

**Example:**
```env
# Password: Sandeep@123!
MYSQL_ROOT_URL=mysql://root:Sandeep%40123%21@localhost:3306
```

### Option 2: Grant CREATE DATABASE Privilege to cms_user

If you prefer not to use root, grant `CREATE DATABASE` privilege to `cms_user`:

```sql
-- Login as root
sudo mysql

-- Grant CREATE DATABASE privilege
GRANT CREATE ON *.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;

-- Verify
SHOW GRANTS FOR 'cms_user'@'localhost';
```

**⚠️ Security Note**: This gives `cms_user` the ability to create any database. Only do this in development.

### Option 3: Manually Create Database

If provisioning fails, you can manually create the database:

```sql
-- Login as root
sudo mysql

-- Create the database
CREATE DATABASE `cms_tenant_test_tenant_2` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Grant privileges to cms_user
GRANT ALL PRIVILEGES ON `cms_tenant_test_tenant_2`.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;
```

Then manually run the tenant schema:

```bash
# Option 1: From backend directory (use ../docs/)
cd /home/sandeep/Documents/NextJs/triline/cms/backend
sudo mysql cms_tenant_test_tenant_2 < ../docs/tenant-db.sql

# Option 2: From project root (use docs/)
cd /home/sandeep/Documents/NextJs/triline/cms
sudo mysql cms_tenant_test_tenant_2 < docs/tenant-db.sql

# Option 3: Use absolute path
sudo mysql cms_tenant_test_tenant_2 < /home/sandeep/Documents/NextJs/triline/cms/docs/tenant-db.sql
```

---

## Verification

### Step 1: Check Backend Logs

When creating a tenant, check the backend console logs for:

```
✅ Success:
[TenantProvisioningService] Starting provisioning for tenant...
[TenantProvisioningService] Using MySQL root connection for database creation
[TenantProvisioningService] Database cms_tenant_xxx created successfully
[TenantProvisioningService] Tenant xxx provisioned successfully

❌ Failure:
[TenantProvisioningService] Failed to create database: Access denied
[TenantProvisioningService] MYSQL_ROOT_URL not configured...
```

### Step 2: Check Database Exists

```bash
# List all databases
sudo mysql -e "SHOW DATABASES LIKE 'cms_tenant_%';"

# Or check specific database
sudo mysql -e "SHOW DATABASES LIKE 'cms_tenant_test_tenant_2';"
```

### Step 3: Check Tenant Status

```bash
sudo mysql -e "USE cms_platform; SELECT id, name, slug, db_name, status FROM tenants WHERE slug = 'test-tenant-2';"
```

**Status values:**
- `provisioning` - Still being created
- `active` - Successfully provisioned
- `suspended` - Provisioning failed

---

## Troubleshooting

### Issue: "MYSQL_ROOT_URL not configured" Warning

**Solution**: Add `MYSQL_ROOT_URL` to `backend/.env` file.

### Issue: "Access denied" Error

**Possible causes:**
1. Wrong root password in `MYSQL_ROOT_URL`
2. Root user doesn't exist or can't connect
3. MySQL authentication plugin issue

**Solution:**
```bash
# Test root connection
sudo mysql -u root -p

# If that works, check MYSQL_ROOT_URL format
# Make sure password is URL-encoded if it has special characters
```

### Issue: Database Created But Tables Missing

**Solution**: The schema creation step may have failed. Check logs and manually run:

```bash
# From project root
cd /home/sandeep/Documents/NextJs/triline/cms
sudo mysql cms_tenant_xxx < docs/tenant-db.sql

# Or from backend directory
cd /home/sandeep/Documents/NextJs/triline/cms/backend
sudo mysql cms_tenant_xxx < ../docs/tenant-db.sql
```

### Issue: Provisioning Runs But Database Not Created

**Check:**
1. Backend logs for errors
2. `MYSQL_ROOT_URL` is correctly set
3. Root password is correct and URL-encoded
4. MySQL server is running

---

## Testing

After fixing the issue, test tenant creation:

```bash
# Create a test tenant via API
curl -X POST http://localhost:3001/api/v1/tenants \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Tenant",
    "slug": "test-tenant"
  }'

# Check if database was created
sudo mysql -e "SHOW DATABASES LIKE 'cms_tenant_test_tenant';"

# Check tenant status
sudo mysql -e "USE cms_platform; SELECT name, db_name, status FROM tenants WHERE slug = 'test-tenant';"
```

---

## Related Documentation

- [Environment File Setup](../setup/CREATE_ENV_FILE.md)
- [MySQL User Setup](../troubleshooting/MYSQL_USER_SETUP.md)
- [Automatic Provisioning](../troubleshooting/AUTOMATIC_PROVISIONING.md)
