# Frontend Setup Guide

**Last Updated**: 2026-02-13

---

## Prerequisites

- Node.js 20.x LTS or higher
- npm or yarn
- Backend API running (see [Backend Setup](../../backend/docs/SETUP_GUIDE.md))

---

## 1. Install Dependencies

```bash
cd frontend
npm install
```

---

## 2. Environment Configuration

### 2.1 Create `.env.local` File

Create `frontend/.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000

# App Configuration
NEXT_PUBLIC_APP_NAME=CMS Platform
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_SUPPORTED_LOCALES=en,fr,es,de

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_GRAPQL=true
NEXT_PUBLIC_ENABLE_SSO=false

# Development
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_MOCK_API=false
```

### 2.2 Verify Environment Variables

Ensure `NEXT_PUBLIC_API_URL` points to your backend API.

---

## 3. Start Development Server

```bash
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:3000`

---

## 4. Verify Setup

### 4.1 Check Frontend

- Open `http://localhost:3000`
- Verify page loads without errors

### 4.2 Test API Connection

- Check browser console for API connection errors
- Verify API calls are being made to correct URL

---

## 5. Common Setup Issues

### Port Already in Use

**Problem**: Port 3000 already in use

**Solution**: 
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or use different port
PORT=3002 npm run dev
```

### API Connection Error

**Problem**: Cannot connect to backend API

**Check**:
1. Backend server is running on port 3001
2. `NEXT_PUBLIC_API_URL` in `.env.local` is correct
3. CORS is configured in backend

**Solution**:
```bash
# Verify backend is running
curl http://localhost:3001/api/v1/health

# Check .env.local
cat frontend/.env.local | grep NEXT_PUBLIC_API_URL
```

### Build Errors

**Problem**: TypeScript or build errors

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

---

## 6. Next Steps

After setup:
1. ✅ Verify frontend loads
2. ✅ Test login functionality
3. ✅ Verify API integration
4. ✅ Review [API Documentation](./api/API_CLIENT.md)

---

**Last Updated**: 2026-02-13
