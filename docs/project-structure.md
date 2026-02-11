# Project Structure

**Version:** 1.0  
**Date:** 2026  
**Status:** Approved

---

## Structure Overview

```
cms/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── tenants/
│   │   ├── auth/
│   │   ├── content/
│   │   ├── media/
│   │   └── ...
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── .env
│
├── frontend/                # Next.js Admin Panel
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   └── ...
│   ├── components/
│   │   ├── ui/              # Radix UI components
│   │   ├── layout/
│   │   ├── forms/
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts           # API client
│   │   ├── auth.ts          # Auth utilities
│   │   └── utils.ts
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── .env.local
│
├── docs/                    # Documentation
│   ├── requirements.md
│   ├── platform-requirements.md
│   ├── UI-DESIGN.md
│   ├── platform-db.sql
│   ├── tenant-db.sql
│   └── ...
│
├── .gitignore
└── README.md
```

---

## Backend Structure (NestJS)

```
backend/
├── src/
│   ├── main.ts                      # Application entry point
│   ├── app.module.ts                # Root module
│   │
│   ├── common/                      # Shared utilities
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── filters/
│   │   └── pipes/
│   │
│   ├── config/                      # Configuration
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── storage.config.ts
│   │
│   ├── tenants/                     # Multi-tenant module
│   │   ├── tenants.module.ts
│   │   ├── tenants.service.ts
│   │   ├── tenants.controller.ts
│   │   ├── dto/
│   │   └── entities/
│   │
│   ├── auth/                        # Authentication & Authorization
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── refresh.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── dto/
│   │
│   ├── users/                       # User management
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   └── dto/
│   │
│   ├── roles/                       # RBAC
│   │   ├── roles.module.ts
│   │   ├── roles.service.ts
│   │   └── permissions.service.ts
│   │
│   ├── content/                     # Content management
│   │   ├── content.module.ts
│   │   ├── schemas/                 # Content type schemas
│   │   │   ├── schemas.service.ts
│   │   │   └── schemas.controller.ts
│   │   ├── entries/                  # Content entries
│   │   │   ├── entries.service.ts
│   │   │   └── entries.controller.ts
│   │   └── dto/
│   │
│   ├── workflow/                    # Workflow engine
│   │   ├── workflow.module.ts
│   │   ├── workflow.service.ts
│   │   └── dto/
│   │
│   ├── media/                       # Media management
│   │   ├── media.module.ts
│   │   ├── media.service.ts
│   │   ├── media.controller.ts
│   │   └── dto/
│   │
│   ├── themes/                      # Theme system
│   │   ├── themes.module.ts
│   │   ├── themes.service.ts
│   │   └── themes.controller.ts
│   │
│   └── api/                         # API delivery
│       ├── api.module.ts
│       ├── rest/                    # REST API
│       └── graphql/                 # GraphQL API (optional)
│
├── prisma/
│   ├── schema.prisma                # Prisma schema
│   ├── migrations/                  # Database migrations
│   └── seed.ts                      # Seed scripts
│
├── test/                            # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .eslintrc.js
├── .prettierrc
└── .env
```

---

## Frontend Structure (Next.js)

```
frontend/
├── app/                             # Next.js App Router
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Home page
│   ├── loading.tsx                  # Loading UI
│   ├── error.tsx                    # Error UI
│   │
│   ├── (auth)/                      # Auth routes group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   └── forgot-password/
│   │
│   ├── (dashboard)/                 # Dashboard routes (protected)
│   │   ├── layout.tsx               # Dashboard layout
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── content/
│   │   │   ├── page.tsx             # Content list
│   │   │   └── [id]/
│   │   │       └── page.tsx         # Content editor
│   │   ├── schemas/
│   │   ├── media/
│   │   ├── users/
│   │   ├── settings/
│   │   └── ...
│   │
│   └── api/                         # API routes (if needed)
│       └── auth/
│           └── route.ts
│
├── components/
│   ├── ui/                          # Radix UI components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   └── ...
│   │
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── breadcrumbs.tsx
│   │
│   ├── content/
│   │   ├── content-list.tsx
│   │   ├── content-editor.tsx
│   │   ├── schema-builder.tsx
│   │   └── ...
│   │
│   ├── media/
│   │   ├── media-library.tsx
│   │   ├── media-uploader.tsx
│   │   └── ...
│   │
│   └── forms/
│       ├── login-form.tsx
│       ├── content-form.tsx
│       └── ...
│
├── lib/
│   ├── api.ts                       # API client
│   ├── auth.ts                      # Auth utilities
│   ├── utils.ts                     # Utility functions
│   └── constants.ts                 # Constants
│
├── hooks/                           # Custom React hooks
│   ├── use-auth.ts
│   ├── use-api.ts
│   └── ...
│
├── types/                           # TypeScript types
│   ├── api.ts
│   ├── content.ts
│   └── ...
│
├── public/                          # Static assets
│   ├── images/
│   └── icons/
│
├── styles/                          # Global styles
│   └── globals.css
│
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── .eslintrc.json
├── .prettierrc
└── .env.local
```

---

## Key Decisions

### Project Structure
- ✅ **Separate folders**: `backend/` and `frontend/` inside `cms/` folder
- ✅ **Not monorepo**: Simple folder structure, easier for solo developer

### Package Management
- ✅ **npm**: Standard Node.js package manager
- ✅ **No workspaces**: Separate package.json files

### Code Style
- ✅ **ESLint**: Code linting
- ✅ **Prettier**: Code formatting (recommended)

### Git Workflow
- ✅ **Branching strategy**: Feature branches, main/master branch
- ✅ **Conventional commits**: Recommended for better history

---

## Development Workflow

### Starting Development

```bash
# Terminal 1: Backend
cd backend
npm install
npm run start:dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

### Database Setup

```bash
# Backend directory
cd backend
npx prisma migrate dev
npx prisma generate
```

### Running Tests

```bash
# Backend tests
cd backend
npm run test

# Frontend tests (if configured)
cd frontend
npm run test
```

---

## Deployment Structure

### Frontend (Vercel)
- Deploy `frontend/` folder
- Environment variables in Vercel dashboard
- Automatic deployments from Git

### Backend (AWS)
- Deploy `backend/` folder
- Environment variables in AWS (ECS, Lambda, EC2)
- Database: AWS RDS (MySQL)

---

## File Naming Conventions

### Backend (NestJS)
- **Modules**: `*.module.ts`
- **Services**: `*.service.ts`
- **Controllers**: `*.controller.ts`
- **DTOs**: `*.dto.ts`
- **Entities**: `*.entity.ts` (if using TypeORM) or Prisma models

### Frontend (Next.js)
- **Pages**: `page.tsx`, `layout.tsx`
- **Components**: PascalCase, e.g., `ContentList.tsx`
- **Hooks**: `use-*.ts` or `use*.ts`
- **Utils**: `*.ts` files in `lib/`

---

## Import Paths

### Backend
```typescript
// Relative imports
import { UsersService } from '../users/users.service';

// Absolute imports (configure in tsconfig.json)
import { UsersService } from '@/users/users.service';
```

### Frontend
```typescript
// Relative imports
import { Button } from '../components/ui/button';

// Absolute imports (configure in tsconfig.json)
import { Button } from '@/components/ui/button';
```

---

## Environment Files

### Backend
- `.env` - Local development
- `.env.example` - Template (committed to Git)
- `.env.production` - Production (not committed)

### Frontend
- `.env.local` - Local development
- `.env.example` - Template (committed to Git)
- `.env.production` - Production (not committed)

---

## Next Steps

1. ✅ Project structure defined
2. Create initial project folders
3. Initialize backend (NestJS)
4. Initialize frontend (Next.js)
5. Setup Prisma in backend
6. Configure ESLint in both projects

---

**Last Updated**: 2026
