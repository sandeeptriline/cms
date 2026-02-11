# CMS Database Structure

**Last Updated**: 2026-02-11

---

## Overview

The CMS platform uses a multi-tenant database architecture with strict database naming conventions to ensure isolation and prevent conflicts with other projects.

---

## Database Naming Convention

### Valid CMS Databases

The CMS **only** works with databases that follow these patterns:

1. **Platform Database**: `cms_platform`
   - Contains platform-level data (tenants, themes, translations, etc.)
   - Contains **Super Admin user** (only one Super Admin allowed in the system)
   - Defined in: [`platform-db.sql`](./platform-db.sql)

2. **Tenant Databases**: `cms_tenant_<tenant_id>`
   - One database per tenant
   - Contains tenant-specific data (users, content, media, etc.)
   - Contains tenant-level users (Admin, Editor, Reviewer, Author, etc.)
   - **Does NOT contain Super Admin** (Super Admin is only in platform database)
   - Defined in: [`tenant-db.sql`](./tenant-db.sql)
   - Example: `cms_tenant_auth_test_tenant_1`

### Excluded Databases

The following MySQL system databases are **NOT** part of the CMS and will be excluded from all operations:

- `information_schema` - MySQL system database
- `mysql` - MySQL system database
- `performance_schema` - MySQL system database
- `sys` - MySQL system database

---

## Database Validation

The CMS includes automatic validation to ensure:

1. **Database names are validated** before creation
2. **Only CMS databases are accessed** by the application
3. **Excluded databases are filtered out** from all operations

### Validation Rules

- Tenant database names must match: `cms_tenant_<tenant_id>`
- Platform database must be: `cms_platform`
- Any database not matching these patterns is rejected

---

## Backend Implementation

### Database Validator

Location: `backend/src/common/utils/database-validator.ts`

This utility provides:
- `isValidCmsDatabase(dbName)` - Check if database is valid for CMS
- `validateTenantDatabaseName(dbName)` - Validate tenant database name
- `filterCmsDatabases(dbList)` - Filter database list to CMS only
- `generateTenantDatabaseName(tenantId)` - Generate valid tenant DB name

### Usage in Services

The `TenantProvisioningService` automatically validates database names:

```typescript
// This will throw an error if dbName is not a valid CMS database
DatabaseValidator.validateTenantDatabaseName(dbName);
```

---

## Scripts

### List CMS Databases

```bash
cd backend
chmod +x scripts/list-cms-databases.sh
./scripts/list-cms-databases.sh
```

This script:
- Lists only CMS-related databases (`cms_platform` and `cms_tenant_*`)
- Shows excluded databases separately
- Helps identify databases that are not part of the CMS

---

## Troubleshooting

### Issue: Database validation errors

If you see errors like:
```
Invalid database name: "<db_name>". CMS only works with cms_platform and cms_tenant_* databases.
```

This means the CMS is correctly rejecting non-CMS databases. Ensure:
- Tenant database names follow the pattern: `cms_tenant_<tenant_id>`
- Platform database is named: `cms_platform`
- Only MySQL system databases are automatically excluded

---

## Related Documentation

- [Platform Database Schema](./platform-db.sql)
- [Tenant Database Schema](./tenant-db.sql)
- [Project Structure](./project-structure.md)
- [Development Readiness](./development-readiness.md)

---

**Note**: The CMS is designed to work only with its own databases (`cms_platform` and `cms_tenant_*`). MySQL system databases are automatically excluded from all operations.
