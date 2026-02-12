# MySQL Wildcard GRANT Issue

**Date**: 2026-02-12

---

## Issue: Wildcard GRANT Statement Fails

When trying to grant privileges to all tenant databases using a wildcard:

```sql
GRANT ALL PRIVILEGES ON cms_tenant_*.* TO 'cms_user'@'localhost';
```

**Error**: MySQL doesn't support wildcards (`*`) in database names for GRANT statements.

---

## Solution

### Option 1: Automatic Privilege Granting (Recommended)

The CMS backend automatically grants privileges to each tenant database when it's created during tenant provisioning. This is handled by the `TenantProvisioningService.grantPrivileges()` method.

**What you need to do:**
1. Only grant privileges to the platform database:
   ```sql
   GRANT ALL PRIVILEGES ON cms_platform.* TO 'cms_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. Ensure `MYSQL_ROOT_URL` is configured in `backend/.env`:
   ```env
   MYSQL_ROOT_URL=mysql://root:YOUR_ROOT_PASSWORD@localhost:3306
   ```

3. When a tenant is created, the backend will automatically:
   - Create the tenant database (`cms_tenant_*`)
   - Grant privileges to `cms_user` for that specific database
   - Run migrations
   - Set up default data

### Option 2: Manual Privilege Granting (If Needed)

If you need to manually grant privileges to an existing tenant database:

```sql
-- Login as root
sudo mysql

-- Grant privileges to a specific tenant database
GRANT ALL PRIVILEGES ON `cms_tenant_example_tenant`.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;
```

### Option 3: Grant Privileges to All Existing Tenant Databases

If you have multiple existing tenant databases and want to grant privileges to all of them:

```sql
-- Login as root
sudo mysql

-- Get list of tenant databases
SELECT SCHEMA_NAME 
FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME LIKE 'cms_tenant_%';

-- Then grant privileges to each one individually:
GRANT ALL PRIVILEGES ON `cms_tenant_tenant1`.* TO 'cms_user'@'localhost';
GRANT ALL PRIVILEGES ON `cms_tenant_tenant2`.* TO 'cms_user'@'localhost';
-- ... repeat for each tenant database
FLUSH PRIVILEGES;
```

Or use a script:

```bash
#!/bin/bash
# Grant privileges to all existing tenant databases

mysql -u root -p <<EOF
$(mysql -u root -p -N -e "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME LIKE 'cms_tenant_%';" | while read db; do
  echo "GRANT ALL PRIVILEGES ON \`$db\`.* TO 'cms_user'@'localhost';"
done)
FLUSH PRIVILEGES;
EOF
```

---

## How It Works in the Backend

The `TenantProvisioningService` handles privilege granting automatically:

1. **During Tenant Creation**: When a new tenant is created via `POST /api/v1/tenants`
2. **Uses Root Connection**: If `MYSQL_ROOT_URL` is configured, uses root privileges to grant access
3. **Per-Database**: Grants privileges to the specific tenant database (not a wildcard)

**Code Location**: `backend/src/tenants/provisioning/tenant-provisioning.service.ts`

```typescript
private async grantPrivileges(dbName: string): Promise<void> {
  // Uses MYSQL_ROOT_URL if available
  // Grants privileges to specific database: GRANT ALL PRIVILEGES ON `dbName`.* TO 'cms_user'@'localhost'
}
```

---

## Initial Setup

For initial setup, you only need to:

1. **Create the user**:
   ```sql
   CREATE USER 'cms_user'@'localhost' IDENTIFIED BY 'Admin123';
   ```

2. **Grant platform database privileges**:
   ```sql
   GRANT ALL PRIVILEGES ON cms_platform.* TO 'cms_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **Configure root URL in `.env`** (for automatic tenant provisioning):
   ```env
   MYSQL_ROOT_URL=mysql://root:YOUR_ROOT_PASSWORD@localhost:3306
   ```

That's it! Tenant databases will be granted privileges automatically when created.

---

## Verification

To verify privileges are granted correctly:

```sql
-- Check privileges for cms_user
SHOW GRANTS FOR 'cms_user'@'localhost';

-- Test connection to a tenant database
mysql -u cms_user -p'Admin123' -e "USE cms_tenant_example; SELECT 1;"
```

---

**Last Updated**: 2026-02-12
