# Backend Setup Guide

**Last Updated**: 2026-02-13

---

## Prerequisites

- Node.js 20.x LTS or higher
- MySQL 8.0+ installed locally
- Git

---

## 1. Environment Setup

### 1.1 Create `.env` File

Create `backend/.env` file:

```env
# Database Configuration
DATABASE_URL=mysql://root:YOUR_ROOT_PASSWORD@localhost:3306/cms_platform
TENANT_DATABASE_PREFIX=cms_tenant_
MYSQL_ROOT_URL=mysql://root:YOUR_ROOT_PASSWORD@localhost:3306

# JWT Authentication
JWT_SECRET=change-this-to-a-random-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=change-this-to-a-different-random-secret-key
JWT_REFRESH_EXPIRES_IN=30d

# Application
NODE_ENV=development
PORT=3001
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:3000

# Platform Admin
PLATFORM_ADMIN_EMAIL=admin@example.com
PLATFORM_ADMIN_PASSWORD=ChangeThisPassword123!

# Storage (Development)
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=./storage/uploads

# Email (Development)
EMAIL_PROVIDER=console
```

**Note**: If your MySQL password contains special characters, URL encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`

### 1.2 Verify Environment Variables

```bash
cd backend
npm run env:check  # If script exists
```

---

## 2. Database Setup

### 2.1 Create Platform Database

```bash
# On Ubuntu/Debian, use: sudo mysql (not mysql -u root -p)
mysql -u root -p

# Create database
CREATE DATABASE cms_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Exit
EXIT;
```

### 2.2 Run Database Schema

```bash
# From project root
mysql -u root -p cms_platform < docs/core/platform-db.sql
```

### 2.3 Test Database Connection

```bash
cd backend
npm run start:dev
```

Check for connection errors in the console.

---

## 3. Install Dependencies

```bash
cd backend
npm install
```

---

## 4. Prisma Setup

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations (if using Prisma migrations)
npx prisma migrate dev
```

---

## 5. Start Development Server

```bash
cd backend
npm run start:dev
```

Server runs on: `http://localhost:3001`

### Port Conflict Resolution

If port 3001 is already in use:

```bash
# Find and kill process
lsof -ti:3001 | xargs kill

# Or use different port in .env
PORT=3002
```

---

## 6. Create Super Admin

### Option 1: Via API

```bash
curl -X POST http://localhost:3001/api/v1/auth/platform-admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "ChangeThisPassword123!",
    "name": "Super Admin"
  }'
```

### Option 2: Via Script

```bash
cd backend/scripts
chmod +x create-super-admin.sh
./create-super-admin.sh
```

---

## 7. Verify Setup

### 7.1 Check Server Health

```bash
curl http://localhost:3001/api/v1/health
```

### 7.2 Access Swagger Documentation

Open: `http://localhost:3001/api/docs`

### 7.3 Test Authentication

```bash
# Login
curl -X POST http://localhost:3001/api/v1/auth/platform-admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "ChangeThisPassword123!"
  }'
```

---

## 8. Common Setup Issues

### MySQL Authentication Error (Ubuntu/Debian)

**Problem**: `Access denied for user 'root'@'localhost'`

**Solution**: Use `sudo mysql` instead of `mysql -u root -p`

```bash
sudo mysql
```

### Database Connection Error

**Check**:
1. MySQL is running: `sudo systemctl status mysql`
2. DATABASE_URL in `.env` is correct
3. Database exists: `SHOW DATABASES;`

### Port Already in Use

**Solution**: Kill process or change PORT in `.env`

```bash
lsof -ti:3001 | xargs kill
```

---

## 9. Next Steps

After setup:
1. ✅ Create Super Admin user
2. ✅ Test API endpoints via Swagger
3. ✅ Create first tenant
4. ✅ Setup tenant permissions

See [API Documentation](./api/SWAGGER_GUIDE.md) for API usage.

---

**Last Updated**: 2026-02-13
