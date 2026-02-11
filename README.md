# CMS Platform - Headless Multi-Tenant CMS

**Version:** 1.0  
**Status:** In Development  
**Started:** 2026

---

## 🚀 Project Overview

A headless, API-first, multi-tenant CMS platform built with:
- **Frontend**: Next.js 16 (React 19) + Radix UI + Tailwind CSS
- **Backend**: NestJS (Latest) + TypeScript
- **Database**: MySQL 8.0+ with Prisma ORM

---

## 📁 Project Structure

```
cms/
├── backend/          # NestJS API
├── frontend/         # Next.js Admin Panel
└── docs/             # Documentation
```

---

## 🛠️ Quick Start

### Prerequisites

- Node.js 20.x LTS or higher
- MySQL 8.0+ installed locally
- npm (package manager)

### Setup

1. **Clone repository** (or navigate to project folder)
   ```bash
   cd cms
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npx prisma migrate dev
   npx prisma generate
   npm run start:dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.local.example .env.local
   # Edit .env.local with your API URL
   npm run dev
   ```

4. **Access Applications**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Docs: http://localhost:3001/api/docs

---

## 📚 Documentation

All documentation is in the `docs/` folder:

- [Requirements](./docs/requirements.md) - Functional requirements
- [Platform Requirements](./docs/platform-requirements.md) - Tech stack
- [Project Structure](./docs/project-structure.md) - Detailed structure
- [Development Phases](./docs/development-phases-backend-frontend.md) - Phase breakdown
- [START-HERE](./docs/START-HERE.md) - Quick start guide
- [Decisions Summary](./docs/decisions-summary.md) - All technical decisions

---

## 🏗️ Development Phases

**Current Phase**: Phase 0 - Foundation & Setup

See [Development Phases](./docs/development-phases-backend-frontend.md) for complete roadmap.

---

## 🧪 Development

### Backend (NestJS)
```bash
cd backend
npm run start:dev      # Development mode
npm run build          # Build for production
npm run start:prod    # Production mode
npm run test          # Run tests
```

### Frontend (Next.js)
```bash
cd frontend
npm run dev           # Development mode
npm run build         # Build for production
npm run start         # Production mode
npm run lint          # Run ESLint
```

---

## 📦 Technology Stack

- **Frontend**: Next.js 16, React 19, Radix UI, Tailwind CSS
- **Backend**: NestJS, TypeScript, Prisma
- **Database**: MySQL 8.0+
- **Authentication**: JWT with refresh tokens
- **Storage**: Local (dev), AWS S3 (production)

---

## 🔐 Environment Variables

### Backend
See `backend/.env.example` for required variables.

### Frontend
See `frontend/.env.local.example` for required variables.

---

## 📝 License

[Your License Here]

---

## 👥 Contributing

[Contributing guidelines]

---

**Last Updated**: 2026
