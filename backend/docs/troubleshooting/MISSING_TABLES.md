# Missing Tables in Tenant Database

## Error

```
Table 'cms_tenant_<name>.users' doesn't exist
```

This means the tenant database was created, but the migrations (table creation) didn't run successfully.

---

## Quick Fix

### Step 1: Check if tables exist

```bash
cd backend
./scripts/check-tenant-tables.sh <tenant-id>
```

This will show you:
- How many tables exist
- Whether critical tables (users, projects, content_types) are present

### Step 2: Run migrations

If tables are missing, run:

```bash
cd backend
./scripts/run-tenant-migrations.sh <tenant-id>
```

Enter your MySQL root password when prompted.

### Step 3: Verify

After running migrations, check again:

```bash
./scripts/check-tenant-tables.sh <tenant-id>
```

You should see ~30 tables including:
- ✅ users
- ✅ projects
- ✅ content_types
- ✅ roles
- ✅ content_entries
- And many more...

---

## Why This Happens

1. **Database created but migrations failed**: The provisioning service created the database but the SQL migration had syntax errors (now fixed)
2. **Migration script not run**: You created the tenant before the migration script was available
3. **Partial migration**: Some tables were created but not all

---

## For Your Current Tenant

Your tenant ID: `a111e427-2a5a-4119-a235-6e988eaf412b`

Run:

```bash
cd backend
./scripts/run-tenant-migrations.sh a111e427-2a5a-4119-a235-6e988eaf412b
```

Then try logging in again at http://localhost:3000/login

---

## For Future Tenants

With the updated provisioning service, new tenants will automatically:
1. Create database ✅
2. Grant privileges ✅
3. Run migrations (create all tables) ✅
4. Setup default data ✅

No manual steps needed!

---

**Last Updated**: 2026-02-11
