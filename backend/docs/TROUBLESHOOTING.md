# Backend Troubleshooting Guide

**Last Updated**: 2026-02-13

---

## Common Issues & Solutions

### 1. MySQL Authentication Issues

#### Problem: `Access denied for user 'root'@'localhost'` on Ubuntu/Debian

**Cause**: MySQL uses `auth_socket` authentication by default on Linux

**Solution**: Use `sudo mysql` instead of `mysql -u root -p`

```bash
# Correct way
sudo mysql

# For scripts
sudo mysql database_name < schema.sql
```

**Permanent Fix**: Enable password authentication (if needed)

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

---

### 2. Database Connection Errors

#### Problem: Cannot connect to database

**Check**:
1. MySQL is running: `sudo systemctl status mysql`
2. DATABASE_URL in `.env` is correct
3. Database exists: `SHOW DATABASES;`
4. User has permissions

**Solution**:
```bash
# Verify MySQL is running
sudo systemctl start mysql

# Check database exists
mysql -u root -p -e "SHOW DATABASES;"

# Verify connection string in .env
cat backend/.env | grep DATABASE_URL
```

---

### 3. Login Issues

#### Problem: Super Admin login fails

**Check**:
1. Super Admin user exists in database
2. Password is correct
3. User status is active (status = 1)

**Solution**:
```sql
-- Check user exists
USE cms_platform;
SELECT id, email, status FROM users WHERE email = 'admin@example.com';

-- Activate user if needed
UPDATE users SET status = 1 WHERE email = 'admin@example.com';
```

---

### 4. Tenant Database Not Created

#### Problem: Tenant provisioning fails

**Check**:
1. MYSQL_ROOT_URL in `.env` is correct
2. MySQL root user has CREATE DATABASE permission
3. Database name follows pattern: `cms_tenant_<tenant_id>`

**Solution**:
```bash
# Check MYSQL_ROOT_URL in .env
cat backend/.env | grep MYSQL_ROOT_URL

# Verify root permissions
mysql -u root -p -e "SHOW GRANTS FOR 'root'@'localhost';"
```

---

### 5. Missing Tables

#### Problem: Tables not found in database

**Solution**: Run database schema

```bash
# Platform database
mysql -u root -p cms_platform < docs/core/platform-db.sql

# Tenant database (if needed)
mysql -u root -p cms_tenant_<tenant_id> < docs/core/tenant-db.sql
```

---

### 6. Port Already in Use

#### Problem: `EADDRINUSE: address already in use :::3001`

**Solution**:
```bash
# Find and kill process
lsof -ti:3001 | xargs kill

# Or use different port
# Update PORT in backend/.env
PORT=3002
```

---

### 7. Tenant Status Issues

#### Problem: Tenant shows as suspended or inactive

**Check**:
```sql
USE cms_platform;
SELECT id, name, status FROM tenants WHERE id = '<tenant_id>';
```

**Solution**:
```sql
-- Activate tenant
UPDATE tenants SET status = 'active' WHERE id = '<tenant_id>';
```

---

### 8. Permission Issues

#### Problem: Tenant user permissions not working

**Check**:
1. Permissions tables exist in tenant database
2. Permissions are seeded
3. Role permissions are assigned

**Solution**: Run tenant permissions setup

```bash
cd backend/scripts
./setup-tenant-permissions.sh <tenant_db_name>
```

---

### 9. MySQL Wildcard Grant Issue

#### Problem: Cannot grant privileges on `cms_tenant_%` databases

**Solution**: Grant privileges individually or use root user

```sql
-- Grant for existing tenant
GRANT ALL PRIVILEGES ON `cms_tenant_<tenant_id>`.* TO 'user'@'localhost';

-- Or use root user in MYSQL_ROOT_URL (recommended for development)
```

---

### 10. Environment Variable Issues

#### Problem: Environment variables not loading

**Check**:
1. `.env` file exists in `backend/` directory
2. File is named exactly `.env` (not `.env.local` or `.env.example`)
3. No syntax errors in `.env` file

**Solution**:
```bash
# Verify .env file exists
ls -la backend/.env

# Check for syntax errors
cat backend/.env
```

---

## Getting Help

1. **Check backend logs**: Look for error messages and stack traces
2. **Check database**: Verify data exists and structure is correct
3. **Check environment**: Verify all required variables are set
4. **Review documentation**: Check relevant docs in this folder

---

**Last Updated**: 2026-02-13
