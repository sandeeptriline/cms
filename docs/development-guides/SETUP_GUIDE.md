# Setup Guide

**Last Updated**: 2026-02-13

---

## Prerequisites

- Node.js 20.x LTS or higher
- MySQL 8.0+ installed locally
- Git
- Code editor (VS Code / Cursor)

---

## 1. Database Setup

### 1.1 Database Architecture

The CMS uses a multi-tenant database architecture:

- **Platform Database**: `cms_platform`
  - Contains platform-level data (tenants, themes, translations, etc.)
  - Contains Super Admin users
  - Defined in: [`platform-db.sql`](./platform-db.sql)

- **Tenant Databases**: `cms_tenant_<tenant_id>`
  - One database per tenant
  - Contains tenant-specific data (users, content, media, etc.)
  - Example: `cms_tenant_auth_test_tenant_1`
  - Defined in: [`tenant-db.sql`](./tenant-db.sql)

**Note**: MySQL system databases (`information_schema`, `mysql`, `performance_schema`, `sys`) are automatically excluded.

### 1.2 Install MySQL

**macOS:**
```bash
brew install mysql@8.0
brew services start mysql@8.0
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

**Windows:**
Download from [MySQL Downloads](https://dev.mysql.com/downloads/installer/)

### 1.2 Create Platform Database

```bash
# Login to MySQL
# On Ubuntu/Debian, use: sudo mysql (not mysql -u root -p)
mysql -u root -p

# Create platform database
CREATE DATABASE cms_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Exit
EXIT;
```

### 1.3 Run Database Schemas

```bash
# Platform database
mysql -u root -p cms_platform < docs/core/platform-db.sql

# Tenant databases are created automatically during tenant provisioning
```

---

## 2. Environment Variables

### 2.1 Backend Environment

Create `backend/.env`:

```env
# Database
DATABASE_URL=mysql://root:password@localhost:3306/cms_platform
TENANT_DATABASE_PREFIX=cms_tenant_
MYSQL_ROOT_URL=mysql://root:password@localhost:3306

# JWT
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

### 2.2 Frontend Environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=CMS Platform
```

---

## 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## 4. Database Migrations

```bash
# Backend - Generate Prisma client
cd backend
npx prisma generate

# Run migrations (if using Prisma migrations)
npx prisma migrate dev
```

---

## 5. Start Development Servers

### 5.1 Start Backend

```bash
cd backend
npm run start:dev
```

Backend runs on: `http://localhost:3001`

### 5.2 Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:3000`

---

## 6. Initial Setup

### 6.1 Create Super Admin

The Super Admin user is created automatically on first run, or you can create it manually:

```bash
# Via API
curl -X POST http://localhost:3001/api/v1/auth/platform-admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "ChangeThisPassword123!",
    "name": "Super Admin"
  }'
```

### 6.2 Create First Tenant

1. Login as Super Admin at `http://localhost:3000/cp/login`
2. Navigate to Tenants
3. Click "Create Tenant"
4. Fill in tenant details
5. Tenant database is created automatically

### 6.3 Setup Tenant Permissions

```bash
cd backend/scripts
chmod +x setup-tenant-permissions.sh
./setup-tenant-permissions.sh <tenant_db_name>
```

---

## 7. Verify Setup

### 7.1 Check Backend

```bash
# Health check
curl http://localhost:3001/api/v1/health

# Swagger docs
open http://localhost:3001/api/docs
```

### 7.2 Check Frontend

- Open `http://localhost:3000`
- Login as Super Admin
- Verify dashboard loads

---

## 8. Common Issues

### MySQL Authentication Error (Ubuntu/Debian)

**Problem**: `Access denied for user 'root'@'localhost'`

**Solution**: Use `sudo mysql` instead of `mysql -u root -p`

```bash
sudo mysql
```

### Database Connection Error

**Problem**: Cannot connect to database

**Solution**: 
1. Verify MySQL is running: `sudo systemctl status mysql`
2. Check DATABASE_URL in `.env`
3. Verify database exists: `SHOW DATABASES;`

### Port Already in Use

**Problem**: Port 3001 or 3000 already in use

**Solution**: 
- Change PORT in backend `.env`
- Change port in frontend `package.json` scripts

---

## 9. Next Steps

After setup:
1. ✅ Create Super Admin user
2. ✅ Create first tenant
3. ✅ Setup tenant permissions
4. ✅ Test login and basic functionality
5. ✅ Review [DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md) for next steps

---

## Database Architecture

The CMS uses a multi-tenant database architecture:

- **Platform Database**: `cms_platform`
  - Contains platform-level data (tenants, themes, translations, etc.)
  - Contains Super Admin users
  - Defined in: [`../core/platform-db.sql`](../core/platform-db.sql)

- **Tenant Databases**: `cms_tenant_<tenant_id>`
  - One database per tenant
  - Contains tenant-specific data (users, content, media, etc.)
  - Example: `cms_tenant_auth_test_tenant_1`
  - Defined in: [`../core/tenant-db.sql`](../core/tenant-db.sql)

**Note**: MySQL system databases (`information_schema`, `mysql`, `performance_schema`, `sys`) are automatically excluded.

---

**Last Updated**: 2026-02-13
