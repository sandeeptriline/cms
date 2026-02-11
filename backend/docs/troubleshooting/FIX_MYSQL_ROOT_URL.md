# Fix MYSQL_ROOT_URL with Special Characters

## Issue

Your password `Sandeep@123!` contains special characters (`@` and `!`) that need to be URL-encoded in the connection string.

## Current (Incorrect)

```env
MYSQL_ROOT_URL=mysql://root:Sandeep@123!@localhost:3306
```

**Problem**: The `@` in the password is interpreted as the separator between credentials and hostname.

## Correct Format

```env
MYSQL_ROOT_URL=mysql://root:Sandeep%40123%21@localhost:3306
```

**URL Encoding**:
- `@` → `%40`
- `!` → `%21`

## Quick Reference

| Character | URL Encoded |
|-----------|-------------|
| `@` | `%40` |
| `!` | `%21` |
| `#` | `%23` |
| `$` | `%24` |
| `%` | `%25` |
| `&` | `%26` |
| `+` | `%2B` |
| `=` | `%3D` |
| `?` | `%3F` |

## Update Your .env

Change this line in `backend/.env`:

```env
# Before (incorrect)
MYSQL_ROOT_URL=mysql://root:Sandeep@123!@localhost:3306

# After (correct)
MYSQL_ROOT_URL=mysql://root:Sandeep%40123%21@localhost:3306
```

## Verify

After updating, restart your backend server:

```bash
cd backend
npm run start:dev
```

Check the logs - you should see:
```
[TenantProvisioningService] Using MySQL root connection for privilege grants
```

When you create a new tenant, it should automatically grant privileges without manual intervention.

---

**Last Updated**: 2026-02-11
