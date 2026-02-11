# How to Start Server and Run Tests

## ⚠️ Important Note

**Cursor may not automatically authorize network commands.** You may need to manually start the server in your terminal.

---

## 🚀 Step-by-Step Testing Instructions

### Step 1: Start the Backend Server

**Open a terminal** and run:

```bash
cd /home/sandeep/Documents/NextJs/triline/cms/backend
npm run start:dev
```

**Wait for the server to start.** You should see:
```
🚀 Backend API is running on: http://localhost:3001/api/v1
📚 Swagger documentation: http://localhost:3001/api/docs
```

**Keep this terminal open** - the server needs to keep running.

---

### Step 2: Verify Server is Running

**Open a NEW terminal** and check server status:

```bash
cd /home/sandeep/Documents/NextJs/triline/cms/backend
./scripts/check-server.sh
```

Or manually check:
```bash
curl http://localhost:3001/api/v1/health
```

Expected: Should return a response (even if 404, that means server is running).

---

### Step 3: Run Tests

**In the same terminal** (or another new one):

**Option A: Automated Test Script**
```bash
cd /home/sandeep/Documents/NextJs/triline/cms/backend
./scripts/test-auth.sh
```

**Option B: Swagger UI**
1. Open browser: http://localhost:3001/api/docs
2. Click "Authorize" button
3. Enter tenant ID in `tenant-id` field
4. Test endpoints interactively

**Option C: Manual curl**
See `QUICK_TEST_GUIDE.md` for curl commands.

---

## 🔍 Troubleshooting

### Server Won't Start

1. **Check for errors** in the terminal output
2. **Verify .env file exists**:
   ```bash
   ls -la backend/.env
   ```
3. **Check database connection**:
   ```bash
   cd backend
   npx prisma db pull
   ```
4. **Check port is available**:
   ```bash
   lsof -ti:3001
   ```
   If something is using port 3001, kill it or change PORT in .env

### Server Starts But Tests Fail

1. **Wait 5-10 seconds** after server starts (compilation time)
2. **Check server logs** for errors
3. **Verify tenant exists**:
   ```bash
   curl http://localhost:3001/api/v1/tenants
   ```
4. **Check tenant is provisioned** (wait 5-10 seconds after creating tenant)

### "Connection Refused" Error

- Server is not running
- Start server: `npm run start:dev`
- Wait for "Backend API is running" message

### "Tenant not found" Error

- Create a tenant first:
  ```bash
  curl -X POST http://localhost:3001/api/v1/tenants \
    -H "Content-Type: application/json" \
    -d '{"name": "Test Tenant", "slug": "test-tenant"}'
  ```
- Wait 5-10 seconds for provisioning
- Use the tenant ID in tests

---

## 📋 Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run start:dev` | Start development server |
| `./scripts/check-server.sh` | Check if server is running |
| `./scripts/test-auth.sh` | Run automated auth tests |
| `curl http://localhost:3001/api/v1/health` | Quick server check |

---

## 🎯 Expected Test Results

When tests pass, you should see:
- ✅ Tenant Creation: PASS
- ✅ User Registration: PASS
- ✅ User Login: PASS
- ✅ Protected Endpoint: PASS
- ✅ Token Refresh: PASS
- ✅ Invalid Credentials: PASS
- ✅ Missing Tenant Header: PASS
- ✅ Logout: PASS

---

**Last Updated**: 2026-02-11
