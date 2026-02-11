# Reference Documentation

**Last Updated**: 2026-02-11

---

## Overview

This section contains references to shared project documentation and design specifications that are relevant for admin panel development.

---

## 📚 Shared Documentation

### Core Requirements
- **[Requirements](../docs/requirements.md)** - Complete functional requirements
- **[Platform Requirements](../docs/platform-requirements.md)** - Technical specifications
- **[Decisions Summary](../docs/decisions-summary.md)** - Key technical decisions

### Design & UI
- **[UI Design](../docs/UI-DESIGN.md)** - Complete UI design specification (Directus-inspired)
- **[Project Structure](../docs/project-structure.md)** - Project structure and organization

### Development
- **[Development Phases](../docs/development-phases-backend-frontend.md)** - Overall development roadmap
- **[Development Readiness](../docs/development-readiness.md)** - Pre-development checklist
- **[Start Here](../docs/START-HERE.md)** - Getting started guide

### Database
- **[Platform Database Schema](../docs/platform-db.sql)** - Platform database structure
- **[Tenant Database Schema](../docs/tenant-db.sql)** - Tenant database structure

### Configuration
- **[Backend Environment Template](../docs/env-template-backend.md)** - Backend env variables
- **[Frontend Environment Template](../docs/env-template-frontend.md)** - Frontend env variables

---

## 🎨 UI Design Reference

The admin panel follows the design patterns specified in **[UI-DESIGN.md](../../../docs/UI-DESIGN.md)**:

### Key Design Principles
- **Clarity**: One primary action per screen
- **Consistency**: Reuse patterns across screens
- **Role-aware**: UI adapts to user roles
- **Layman-first**: Plain language, no technical jargon
- **Reference**: Directus Admin Panel patterns

### Technology Stack
- **Framework**: Next.js 16 (App Router)
- **UI Library**: Radix UI
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Tables**: TanStack Table
- **Editor**: Tiptap

---

## 📋 Quick Links

### For Developers
- [UI Design Specification](../../../docs/UI-DESIGN.md) - Complete UI/UX guide
- [Requirements](../../../docs/requirements.md) - Feature requirements
- [Project Structure](../../../docs/project-structure.md) - Code organization

### For Designers
- [UI Design Specification](../../../docs/UI-DESIGN.md) - Design patterns and components
- [Platform Requirements](../../../docs/platform-requirements.md) - Technical constraints

---

**Note**: All shared documentation is located in the root `docs/` folder. This reference section provides quick access to relevant documents for admin panel development.
