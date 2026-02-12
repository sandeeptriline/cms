# How to Create Backend .env File

**Last Updated**: 2026-02-12

---

## Quick Start

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create `.env` file**:
   ```bash
   cp ../docs/env-template-backend.md .env
   # Or create manually
   touch .env
   ```

3. **Edit `.env` file** with your actual values

---

## Step-by-Step Guide

### Step 1: Create the File

```bash
cd /home/sandeep/Documents/NextJs/triline/cms/backend
touch .env
```

Or copy from template:
```bash
# The template is in docs/env-template-backend.md
# Copy the content from that file to backend/.env
```

### Step 2: Add Required Variables

Open `backend/.env` in your editor and add the following:

#### 1. Database Configuration

```env
# Main database connection (for cms_platform)
# Format: mysql://username:password@host:port/database
DATABASE_URL=mysql://cms_user:password@localhost:3306/cms_platform

# Tenant database prefix (used for tenant database naming)
TENANT_DATABASE_PREFIX=cms_tenant_

# Connection pool settings
DB_POOL_MIN=2
DB_POOL_MAX=10
```

**Important**: 
- Replace `cms_user` with your MySQL username
- Replace `password` with your MySQL password
- If using root user: `mysql://root:your_password@localhost:3306/cms_platform`
- If password contains special characters, URL-encode them:
  - `@` → `%40`
  - `!` → `%21`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`
  - `&` → `%26`
  - `*` → `%2A`
  - `+` → `%2B`
  - `,` → `%2C`
  - `/` → `%2F`
  - `:` → `%3A`
  - `;` → `%3B`
  - `=` → `%3D`
  - `?` → `%3F`
  - `[` → `%5B`
  - `]` → `%5D`

#### 2. MySQL Root Connection (Required for Tenant Provisioning)

```env
# MySQL Root Connection (for tenant provisioning - database creation and privilege grants)
# This is required for automatic tenant provisioning
# Format: mysql://root:password@localhost:3306
MYSQL_ROOT_URL=mysql://root:your_root_password@localhost:3306
```

**Important**:
- This is used by `TenantProvisioningService` to create tenant databases
- If using `auth_socket` authentication, you can use `--use-sudo` flag in scripts instead
- URL-encode special characters in password (see above)

**Example with special characters**:
```env
# Password: Sandeep@123!
MYSQL_ROOT_URL=mysql://root:Sandeep%40123%21@localhost:3306
```

#### 3. JWT Authentication

```env
# JWT Secret (change to a random string, minimum 32 characters)
JWT_SECRET=change-this-to-a-random-secret-key-min-32-chars

# JWT Expiration (7 days)
JWT_EXPIRES_IN=7d

# JWT Refresh Secret (different from JWT_SECRET)
JWT_REFRESH_SECRET=change-this-to-a-different-random-secret-key

# JWT Refresh Token Expiration (30 days)
JWT_REFRESH_EXPIRES_IN=30d
```

**Generate secure secrets**:
```bash
# Generate random secret (32+ characters)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### 4. Application Settings

```env
# Environment
NODE_ENV=development

# Server Port
PORT=3001

# API Prefix
API_PREFIX=/api/v1

# CORS Origin (frontend URL)
CORS_ORIGIN=http://localhost:3000

# Application URLs
APP_URL=http://localhost:3000
API_URL=http://localhost:3001
```

#### 5. Platform Admin (Optional - for initial setup)

```env
# Platform Admin credentials (used for creating first Super Admin)
PLATFORM_ADMIN_EMAIL=admin@example.com
PLATFORM_ADMIN_PASSWORD=ChangeThisPassword123!
```

#### 6. Security

```env
# Session Secret
SESSION_SECRET=change-this-session-secret

# Bcrypt Rounds (for password hashing)
BCRYPT_ROUNDS=10
```

#### 7. File Storage (Development)

```env
# Storage Type: 'local' for development, 's3' for production
STORAGE_TYPE=local

# Local storage path
STORAGE_LOCAL_PATH=./storage/uploads
```

#### 8. Email Configuration (Development)

```env
# Email Provider: 'console' for development (logs to console)
EMAIL_PROVIDER=console

# For production, configure one of these:
# SENDGRID_API_KEY=your_sendgrid_key
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASSWORD=your_app_password
```

#### 9. Logging

```env
# Log Level: debug, info, warn, error
LOG_LEVEL=debug

# Log Format: json or text
LOG_FORMAT=json
```

#### 10. Rate Limiting

```env
# Rate limit time window (seconds)
RATE_LIMIT_TTL=60

# Maximum requests per time window
RATE_LIMIT_MAX=100
```

---

## Complete Example

Here's a complete `.env` file example:

```env
# Database Configuration
DATABASE_URL=mysql://cms_user:password@localhost:3306/cms_platform
TENANT_DATABASE_PREFIX=cms_tenant_
DB_POOL_MIN=2
DB_POOL_MAX=10

# MySQL Root Connection (for tenant provisioning)
MYSQL_ROOT_URL=mysql://root:your_root_password@localhost:3306

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-different-from-jwt
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

# Security
SESSION_SECRET=your-session-secret-key
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

## Verification

### 1. Check File Location

```bash
cd backend
ls -la .env
```

Should show: `.env` file exists

### 2. Check File Permissions

```bash
# .env should not be world-readable
chmod 600 .env
```

### 3. Test Database Connection

```bash
# Test DATABASE_URL connection
mysql -u cms_user -p -e "USE cms_platform; SELECT 1;"

# Test MYSQL_ROOT_URL connection
mysql -u root -p -e "SELECT 1;"
```

### 4. Verify Environment Variables Load

```bash
cd backend
node -e "require('dotenv').config(); console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');"
```

---

## Common Issues

### Issue 1: Special Characters in Password

**Problem**: Password contains `@`, `!`, `#`, etc.

**Solution**: URL-encode the password in the connection string:

```env
# Password: Sandeep@123!
# Encoded: Sandeep%40123%21
DATABASE_URL=mysql://root:Sandeep%40123%21@localhost:3306/cms_platform
```

### Issue 2: auth_socket Authentication

**Problem**: MySQL root uses `auth_socket` instead of password

**Solution**: 
- Use `--use-sudo` flag in scripts
- Or configure MySQL to use password authentication
- Or leave `MYSQL_ROOT_URL` empty and use `--use-sudo` flag

### Issue 3: Database Doesn't Exist

**Problem**: `DATABASE_URL` points to non-existent database

**Solution**: Create the database first:

```bash
mysql -u root -p -e "CREATE DATABASE cms_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Or use the setup script:
```bash
cd backend
./scripts/setup-platform-database.sh --use-sudo
```

### Issue 4: Connection Refused

**Problem**: Can't connect to MySQL

**Solution**: 
1. Check if MySQL is running:
   ```bash
   sudo systemctl status mysql  # Linux
   brew services list | grep mysql  # macOS
   ```

2. Check MySQL port:
   ```bash
   netstat -an | grep 3306
   ```

3. Verify credentials in `.env`

---

## Security Best Practices

1. **Never commit `.env` to Git**
   - Add `.env` to `.gitignore`
   - Use `.env.example` as template (without sensitive data)

2. **Use Strong Secrets**
   - JWT secrets should be 32+ characters
   - Use random strings, not predictable values
   - Generate with: `openssl rand -base64 32`

3. **Restrict File Permissions**
   ```bash
   chmod 600 .env  # Only owner can read/write
   ```

4. **Use Different Secrets for Production**
   - Never use development secrets in production
   - Use environment-specific `.env` files

5. **Rotate Secrets Regularly**
   - Change JWT secrets periodically
   - Update passwords regularly

---

## Related Documentation

- [Environment Template](../env-template-backend.md) - Full template with all variables
- [Local MySQL Setup](../../../docs/local-mysql-setup.md) - MySQL installation and setup
- [Platform Database Setup](./PLATFORM_DATABASE_SETUP.md) - Database setup guide
- [Create Super Admin](./CREATE_SUPER_ADMIN.md) - Super Admin creation

---

## Next Steps

After creating `.env` file:

1. **Setup Platform Database**:
   ```bash
   cd backend
   ./scripts/setup-platform-database.sh --use-sudo
   ```

2. **Seed Permissions**:
   ```bash
   cd backend
   ./scripts/seed-permissions.sh
   ```

3. **Create Super Admin**:
   ```bash
   cd backend
   sudo mysql cms_platform < scripts/create-super-admin.sql
   ```

4. **Start Backend Server**:
   ```bash
   cd backend
   npm run start:dev
   ```

---

**Status**: Ready to Use
