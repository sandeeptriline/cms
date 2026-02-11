# Automatic Tenant Provisioning

**Issue**: Tenant databases are created but privileges aren't granted automatically, requiring manual intervention.

---

## Why Manual Privilege Grants Are Needed

The tenant provisioning service tries to automatically:
1. ✅ Create the tenant database
2. ❌ Grant privileges to `cms_user` (fails silently)

**Root Cause**: MySQL requires **root/admin privileges** to grant privileges to other users. The `cms_user` account cannot grant privileges to itself.

---

## Solution 1: Use MySQL Root Connection (Recommended)

Configure the backend to use a MySQL root connection for provisioning operations.

### Step 1: Add Root Connection to `.env`

Add this to your `backend/.env` file:

```env
# MySQL Root Connection (for tenant provisioning)
MYSQL_ROOT_URL=mysql://root:your_root_password@localhost:3306
```

**Important**: Replace `your_root_password` with your actual MySQL root password.

### Step 2: Restart Backend Server

```bash
cd backend
npm run start:dev
```

### Step 3: Test Tenant Creation

Now when you create a tenant, provisioning will automatically:
- ✅ Create the database
- ✅ Grant privileges to `cms_user`
- ✅ Set tenant status to `active`

---

## Solution 2: Grant Privileges at MySQL Level (One-Time Setup)

Grant privileges to `cms_user` for all tenant databases at once:

```bash
mysql -u root -p
```

Then execute:

```sql
-- Grant privileges to all existing and future tenant databases
GRANT ALL PRIVILEGES ON `cms_tenant_%`.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;
```

**Note**: MySQL wildcard patterns (`%`) work for database names in GRANT statements, so this will apply to all current and future tenant databases.

---

## Solution 3: Configure MySQL to Allow Privilege Grants

If you want `cms_user` to be able to grant privileges, you need to grant the `GRANT OPTION` privilege:

```bash
mysql -u root -p
```

```sql
-- Grant the ability to grant privileges
GRANT GRANT OPTION ON *.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;
```

**Warning**: This gives `cms_user` significant privileges. Only use in development.

---

## Verify Automatic Provisioning

After configuring `MYSQL_ROOT_URL`, test tenant creation:

```bash
curl -X POST http://localhost:3001/api/v1/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Tenant",
    "slug": "test-tenant"
  }'
```

Check the backend logs - you should see:
```
[TenantProvisioningService] Database cms_tenant_test_tenant created successfully
[TenantProvisioningService] Privileges granted successfully for cms_tenant_test_tenant
[TenantProvisioningService] Tenant provisioned successfully
```

---

## Troubleshooting

### "MYSQL_ROOT_URL not configured" Warning

If you see this warning, add `MYSQL_ROOT_URL` to your `.env` file.

### "Access denied for user 'root'"

- Verify the root password in `MYSQL_ROOT_URL` is correct
- Ensure MySQL root user exists and has proper permissions

### Privileges Still Not Granted

1. Check backend logs for error messages
2. Verify `MYSQL_ROOT_URL` is correctly formatted
3. Test root connection manually:
   ```bash
   mysql -u root -p -e "SELECT 1;"
   ```

---

## Security Note

**Production**: In production, consider:
- Using a dedicated MySQL user with limited privileges (only CREATE DATABASE and GRANT)
- Storing `MYSQL_ROOT_URL` securely (environment variables, secrets manager)
- Not exposing root credentials in code or logs

---

**Last Updated**: 2026-02-11
