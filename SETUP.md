# Setup Guide

**Version:** 1.0  
**Date:** 2026

---

## Prerequisites

- **Node.js**: 20.x LTS or higher (use nvm to manage versions)
- **MySQL**: 8.0+ installed locally
- **npm**: Comes with Node.js

---

## Quick Setup

### 1. Switch to Node.js 20+

```bash
# Using nvm
source ~/.nvm/nvm.sh
nvm use 20
# or
nvm install 20 && nvm use 20

# Verify version
node --version  # Should show v20.x.x or higher
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Setup Database

```bash
# Login to MySQL
mysql -u root -p

# Create platform database
CREATE DATABASE cms_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 4. Configure Environment Variables

#### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials
```

Update `DATABASE_URL` in `.env`:
```env
DATABASE_URL=mysql://root:your_password@localhost:3306/cms_platform
```

#### Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local if needed (defaults should work)
```

### 5. Setup Prisma

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 6. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
source ~/.nvm/nvm.sh  # If needed
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
source ~/.nvm/nvm.sh  # If needed
npm run dev
```

### 7. Access Applications

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **Health Check**: http://localhost:3001/api/v1/health

---

## Troubleshooting

### Node.js Version Issues

If you see version errors:
```bash
source ~/.nvm/nvm.sh
nvm use 20
node --version  # Verify it's 20+
```

### Database Connection Issues

1. Check MySQL is running:
   ```bash
   sudo systemctl status mysql  # Linux
   brew services list | grep mysql  # macOS
   ```

2. Verify database exists:
   ```bash
   mysql -u root -p -e "SHOW DATABASES;"
   ```

3. Check connection string in `.env`:
   ```env
   DATABASE_URL=mysql://username:password@localhost:3306/cms_platform
   ```

### Port Already in Use

If port 3000 or 3001 is in use:
```bash
# Find process using port
lsof -i :3000
lsof -i :3001

# Kill process or change port in .env
```

### Prisma Issues

```bash
# Regenerate Prisma client
cd backend
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

---

## Next Steps

After setup is complete:

1. ✅ Verify both servers are running
2. ✅ Test API health endpoint
3. ✅ Check frontend loads correctly
4. Proceed to **Phase 1: Multi-Tenant Core**

See [Development Phases](./docs/development-phases-backend-frontend.md) for next steps.

---

**Last Updated**: 2026
