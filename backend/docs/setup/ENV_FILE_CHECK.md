# .env File Validation Checklist

**Date**: 2026-02-12

---

## Issues Found in Your .env File

### ❌ Critical Issue: MYSQL_ROOT_URL Special Characters

**Current**:
```env
MYSQL_ROOT_URL=mysql://root:Sandeep@123!@localhost:3306
```

**Problem**: The password contains special characters (`@` and `!`) that need to be URL-encoded.

**Fix**:
```env
MYSQL_ROOT_URL=mysql://root:Sandeep%40123%21@localhost:3306
```

**URL Encoding Reference**:
- `@` → `%40`
- `!` → `%21`

---

### ⚠️ Security Warning: Placeholder Secrets

**Current**:
```env
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-different-from-jwt
SESSION_SECRET=your-session-secret-key
```

**Problem**: These are placeholder values. You should use random, secure secrets.

**Fix**: Generate secure secrets:

```bash
# Generate JWT_SECRET (32+ characters)
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET (different from JWT_SECRET)
openssl rand -base64 32

# Generate SESSION_SECRET
openssl rand -base64 32
```

Then update your `.env`:
```env
JWT_SECRET=<generated-secret-1>
JWT_REFRESH_SECRET=<generated-secret-2>
SESSION_SECRET=<generated-secret-3>
```

---

### ✅ Correctly Configured

- `DATABASE_URL` - Format looks correct
- `TENANT_DATABASE_PREFIX` - Correct
- `NODE_ENV` - Correct
- `PORT` - Correct
- `CORS_ORIGIN` - Correct
- `STORAGE_TYPE` - Correct
- `EMAIL_PROVIDER` - Correct

---

## Quick Fix Commands

### 1. Fix MYSQL_ROOT_URL

```bash
cd backend

# Backup current .env
cp .env .env.backup

# Fix MYSQL_ROOT_URL (replace with your actual password encoding)
sed -i 's|MYSQL_ROOT_URL=mysql://root:Sandeep@123!@localhost:3306|MYSQL_ROOT_URL=mysql://root:Sandeep%40123%21@localhost:3306|' .env
```

### 2. Generate Secure Secrets

```bash
# Generate secrets
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
echo "SESSION_SECRET=$(openssl rand -base64 32)"
```

Then manually update these values in `.env`.

---

## Complete Fixed .env Example

```env
# Database Configuration
DATABASE_URL=mysql://cms_user:password@localhost:3306/cms_platform
TENANT_DATABASE_PREFIX=cms_tenant_
DB_POOL_MIN=2
DB_POOL_MAX=10

# MySQL Root Connection (URL-encoded password)
MYSQL_ROOT_URL=mysql://root:Sandeep%40123%21@localhost:3306

# JWT Authentication (use generated secrets)
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<generate-different-secret>
JWT_REFRESH_EXPIRES_IN=30d

# Application
NODE_ENV=development
PORT=3001
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:3000
APP_URL=http://localhost:3000
API_URL=http://localhost:3001

# Platform Admin
PLATFORM_ADMIN_EMAIL=admin@example.com
PLATFORM_ADMIN_PASSWORD=ChangeThisPassword123!

# Security (use generated secret)
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
BCRYPT_ROUNDS=10

# File Storage
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=./storage/uploads

# Email
EMAIL_PROVIDER=console

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

---

## Validation Checklist

- [ ] `MYSQL_ROOT_URL` has URL-encoded password (special characters encoded)
- [ ] `JWT_SECRET` is a random 32+ character string (not placeholder)
- [ ] `JWT_REFRESH_SECRET` is different from `JWT_SECRET` (not placeholder)
- [ ] `SESSION_SECRET` is a random string (not placeholder)
- [ ] `DATABASE_URL` uses correct username and password
- [ ] All required variables are present
- [ ] File permissions are secure (`chmod 600 .env`)

---

## Test Your Configuration

### 1. Test Database Connection

```bash
# Test DATABASE_URL
mysql -u cms_user -p -e "USE cms_platform; SELECT 1;"

# Test MYSQL_ROOT_URL (after URL encoding fix)
mysql -u root -p'Sandeep@123!' -e "SELECT 1;"
```

### 2. Test Environment Loading

```bash
cd backend
node -e "require('dotenv').config(); console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✓' : 'Missing ✗');"
```

---

## Related Documentation

- [Create .env File](./CREATE_ENV_FILE.md) - Complete guide
- [Environment Template](../../../docs/env-template-backend.md) - Full template
- [Local MySQL Setup](../../../docs/local-mysql-setup.md) - MySQL configuration

---

**Status**: Issues Identified - Fix Required
