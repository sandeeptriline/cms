# CMS Documentation

This folder contains all project documentation for the Triline CMS platform.

## 🚀 Getting Started

**New to this project?** Start here: [START-HERE.md](./START-HERE.md)

This guide will help you understand what's ready and what decisions need to be made before starting development.

## Documents

### [Requirements Document](./requirements.md)
Complete functional requirements specification covering:
- Multi-tenant architecture
- User management and access control
- Content modeling and lifecycle
- Workflow management
- Media and asset management
- API design and delivery
- Localization and SEO
- Theme system
- Integrations and extensibility
- Platform capabilities
- Main features summary

### [Platform Requirements](./platform-requirements.md)
Technical platform requirements and specifications:
- Technology stack (Next.js latest, NestJS latest, MySQL 8)
- UI framework (Radix UI)
- Version requirements
- Development environment setup
- Deployment requirements
- Performance and security requirements
- Browser support and accessibility

### [UI Design Document](./UI-DESIGN.md)
Comprehensive UI design specification:
- Design principles and reference (Directus-inspired)
- Application structure and layout
- Platform admin UI (Super Admin)
- Tenant admin UI
- Component specifications
- Directus API reference alignment
- Technology stack (Radix UI, Next.js, Tailwind CSS)

### [Development Readiness](./development-readiness.md)
Pre-development checklist and readiness assessment:
- Documentation status
- Technical decisions needed
- Development environment setup
- Project structure recommendations
- Environment variables templates
- Missing items checklist

### Database Schemas
- [Platform Database](./platform-db.sql) - Multi-tenant platform schema
- [Tenant Database](./tenant-db.sql) - Per-tenant database schema

### Project Structure
- [Project Structure](./project-structure.md) - Detailed folder structure and organization
- [Decisions Summary](./decisions-summary.md) - All technical decisions made

### Environment Variables
- [Backend Template](./env-template-backend.md) - NestJS environment variables
- [Frontend Template](./env-template-frontend.md) - Next.js environment variables

### Technical Explanations
- [Prisma Usage Explanation](./prisma-usage-explanation.md) - Why Prisma is recommended for this CMS
- [Local MySQL Setup](./local-mysql-setup.md) - Guide for setting up MySQL locally

## Quick Reference

### Key Concepts

- **Headless CMS**: Content management without frontend rendering
- **API-First**: All functionality exposed via APIs
- **Multi-Tenant**: Multiple isolated customers on one platform
- **Schema-Driven**: Flexible content type definitions
- **Workflow-Enabled**: Configurable approval processes

### Core Principles

1. Tenant isolation is mandatory
2. All operations are tenant-scoped
3. APIs are the primary interface
4. Security and permissions at every layer
5. Versioning and audit trails throughout

### Technology Stack

- **Frontend**: Next.js (Latest) + React 19 + Radix UI + Tailwind CSS
- **Backend**: NestJS (Latest) + TypeScript
- **Database**: MySQL 8.0+
- **UI Components**: Radix UI Primitives
- **Design Reference**: Directus Admin Panel

---

**Last Updated**: 2026
