# Platform Database Setup Guide

**Last Updated**: 2026-02-12

---

## Overview

This guide explains how to set up the platform database (`cms_platform`) with all required tables, including the newly added `users`, `roles`, and `user_roles` tables for Super Admin functionality.

---

## Prerequisites

- MySQL 8.0+ installed and running
- MySQL root access (or user with CREATE DATABASE and CREATE TABLE privileges)
- Access to the `docs/platform-db.sql` file

---

## Method 1: Using the Setup Script (Recommended)

### Step 1: Navigate to Backend Directory

```bash
cd backend/scripts
```

### Step 2: Run the Setup Script

**Option A: Using MySQL root password**
```bash
./setup-platform-database.sh --root-password "your_password"
```

**Option B: Using sudo (for auth_socket authentication)**
```bash
./setup-platform-database.sh --use-sudo
```

**Option C: Interactive password prompt**
```bash
./setup-platform-database.sh
# Enter password when prompted
```

### Step 3: Verify Tables Were Created

```bash
mysql -u root -p -D cms_platform -e "SHOW TABLES;"
```

You should see tables including:
- `tenants`
- `users` (Super Admin)
- `roles`
- `user_roles`
- `tenant_usage`
- `platform_search_index`
- `schema_templates`
- `library_items`
- `themes`
- And more...

---

## Method 2: Manual SQL Execution

### Step 1: Create Database (if not exists)

```bash
mysql -u root -p
```

```sql
CREATE DATABASE IF NOT EXISTS cms_platform 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE cms_platform;
```

### Step 2: Run SQL File

**Option A: From command line**
```bash
mysql -u root -p cms_platform < docs/platform-db.sql
```

**Option B: From MySQL prompt**
```sql
SOURCE /path/to/docs/platform-db.sql;
```

### Step 3: Verify Tables

```sql
SHOW TABLES;
```

---

## Creating Super Admin User

After the tables are created, create a Super Admin user:

```bash
cd backend/scripts
sudo mysql cms_platform < create-super-admin.sql
```

Or edit the SQL file first to change email/password hash, then run it.

---

## Next Steps

1. **Regenerate Prisma Client:**
   ```bash
   cd backend
   npx prisma generate
   ```

2. **Start Backend Server:**
   ```bash
   npm run start:dev
   ```

3. **Test Super Admin Login:**
   ```bash
   curl -X POST http://localhost:3001/api/v1/auth/platform-admin/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@platform.com", "password": "admin@123"}'
   ```

---

## Related Documentation

- [Create Super Admin Guide](./CREATE_SUPER_ADMIN.md)
- [Platform Database Schema](../../../docs/platform-db.sql)
