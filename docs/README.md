# CMS Documentation

This folder contains all project documentation for the Triline CMS platform.

## 🚀 Getting Started

**New to this project?** Start here: [development-guides/START-HERE.md](./development-guides/START-HERE.md)

---

## 📚 Core Documentation

### Requirements & Design
- **[requirements.md](./core/requirements.md)** - Complete functional requirements specification
- **[UI-DESIGN.md](./core/UI-DESIGN.md)** - UI design specification (Directus-inspired)
- **[CMS-V2.docx](./core/CMS-V2.docx)** - Original requirements document

### Database Schemas
- **[platform-db.sql](./core/platform-db.sql)** - Platform database schema (multi-tenant core)
- **[tenant-db.sql](./core/tenant-db.sql)** - Tenant database schema (per-tenant)

---

## 📖 Development Guides

### Status & Planning
- **[DEVELOPMENT_STATUS.md](./development-guides/DEVELOPMENT_STATUS.md)** - Current implementation status and next steps
- **[START-HERE.md](./development-guides/START-HERE.md)** - Getting started guide for new developers

### Setup & Configuration
- **[SETUP_GUIDE.md](./development-guides/SETUP_GUIDE.md)** - Complete setup instructions (database, environment, dependencies)
- **[TROUBLESHOOTING.md](./development-guides/TROUBLESHOOTING.md)** - Common issues and solutions

---

## 📚 Reference Documentation

- **[PERMISSIONS_SYSTEMS_EXPLAINED.md](./reference/PERMISSIONS_SYSTEMS_EXPLAINED.md)** - Tenant vs Platform permissions
- **[PLATFORM_ROLES_REFERENCE.md](./reference/PLATFORM_ROLES_REFERENCE.md)** - Platform roles and permissions reference
- **[development-phases-backend-frontend.md](./reference/development-phases-backend-frontend.md)** - Development phases roadmap
- **[project-structure.md](./reference/project-structure.md)** - Project folder structure
- **[decisions-summary.md](./reference/decisions-summary.md)** - Technical decisions made
- **[platform-requirements.md](./reference/platform-requirements.md)** - Technology stack and requirements
- **[prisma-usage-explanation.md](./reference/prisma-usage-explanation.md)** - Why Prisma was chosen

---

## 🗂️ SQL Scripts

### Platform
- **[platform-roles-seed.sql](./sql-scripts/platform-roles-seed.sql)** - Platform roles seeding

### Tenant
- **[tenant-role-permissions-tables.sql](./sql-scripts/tenant-role-permissions-tables.sql)** - Permissions tables
- **[tenant-permissions-seed.sql](./sql-scripts/tenant-permissions-seed.sql)** - Permissions seeding
- **[tenant-roles-seed.sql](./sql-scripts/tenant-roles-seed.sql)** - Roles seeding
- **[tenant-role-permissions-assign.sql](./sql-scripts/tenant-role-permissions-assign.sql)** - Assign permissions to roles
- **[update-user-roles-table.sql](./sql-scripts/update-user-roles-table.sql)** - Update user_roles table
- **[update-role-permissions-table.sql](./sql-scripts/update-role-permissions-table.sql)** - Update role_permissions table

**Note**: Main database schemas (`platform-db.sql` and `tenant-db.sql`) are in [Core Documentation](./core/).

---

## 🎯 Quick Reference

### Key Concepts
- **Headless CMS**: Content management without frontend rendering
- **API-First**: All functionality exposed via APIs
- **Multi-Tenant**: Multiple isolated customers on one platform
- **Schema-Driven**: Flexible content type definitions
- **Workflow-Enabled**: Configurable approval processes

### Technology Stack
- **Frontend**: Next.js 16 + React 19 + Radix UI + Tailwind CSS
- **Backend**: NestJS + TypeScript
- **Database**: MySQL 8.0+
- **ORM**: Prisma

### Core Principles
1. Tenant isolation is mandatory
2. All operations are tenant-scoped
3. APIs are the primary interface
4. Security and permissions at every layer
5. Versioning and audit trails throughout

---

## 📋 Documentation Structure

```
docs/
├── core/ (5 files)
│   ├── requirements.md
│   ├── UI-DESIGN.md
│   ├── CMS-V2.docx
│   ├── platform-db.sql
│   └── tenant-db.sql
│
├── development-guides/ (4 files)
│   ├── DEVELOPMENT_STATUS.md
│   ├── SETUP_GUIDE.md
│   ├── TROUBLESHOOTING.md
│   └── START-HERE.md
│
├── reference/ (7 files)
│   ├── PERMISSIONS_SYSTEMS_EXPLAINED.md
│   ├── PLATFORM_ROLES_REFERENCE.md
│   ├── development-phases-backend-frontend.md
│   ├── project-structure.md
│   ├── decisions-summary.md
│   ├── platform-requirements.md
│   └── prisma-usage-explanation.md
│
└── sql-scripts/ (7 files)
    ├── platform-roles-seed.sql
    ├── tenant-role-permissions-tables.sql
    ├── tenant-permissions-seed.sql
    ├── tenant-roles-seed.sql
    ├── tenant-role-permissions-assign.sql
    ├── update-user-roles-table.sql
    └── update-role-permissions-table.sql
```

**Total: 24 files** organized in 4 folders

---

## 🔍 Finding Information

| What you need | Document |
|---------------|----------|
| **Setup instructions** | [development-guides/SETUP_GUIDE.md](./development-guides/SETUP_GUIDE.md) |
| **Current status** | [development-guides/DEVELOPMENT_STATUS.md](./development-guides/DEVELOPMENT_STATUS.md) |
| **Troubleshooting** | [development-guides/TROUBLESHOOTING.md](./development-guides/TROUBLESHOOTING.md) |
| **Requirements** | [core/requirements.md](./core/requirements.md) |
| **UI Design** | [core/UI-DESIGN.md](./core/UI-DESIGN.md) |
| **Database schema** | [core/platform-db.sql](./core/platform-db.sql), [core/tenant-db.sql](./core/tenant-db.sql) |
| **Permissions** | [reference/PERMISSIONS_SYSTEMS_EXPLAINED.md](./reference/PERMISSIONS_SYSTEMS_EXPLAINED.md) |
| **Platform roles** | [reference/PLATFORM_ROLES_REFERENCE.md](./reference/PLATFORM_ROLES_REFERENCE.md) |
| **Tech stack** | [reference/platform-requirements.md](./reference/platform-requirements.md) |
| **Why Prisma** | [reference/prisma-usage-explanation.md](./reference/prisma-usage-explanation.md) |

---

**Last Updated**: 2026-02-13
