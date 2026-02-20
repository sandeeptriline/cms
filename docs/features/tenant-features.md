# Tenant Features – Available Capabilities

This document describes the **available tenant-related features** in the CMS platform: what a tenant is, how it is managed from the Control Plane, and what capabilities each tenant has.

---

## Table of Contents

1. [Tenant Model](#1-tenant-model)
2. [Control Plane: Tenant Management (Super Admin)](#2-control-plane-tenant-management-super-admin)
3. [Tenant Provisioning](#3-tenant-provisioning)
4. [Tenant Detail: Tabs & Capabilities](#4-tenant-detail-tabs--capabilities)
5. [Tenant-Scoped Features (Tenant Dashboard)](#5-tenant-scoped-features-tenant-dashboard)
6. [APIs Summary](#6-apis-summary)
7. [References](#7-references)

---

## 1. Tenant Model

Each **tenant** is an isolated logical boundary with its own data, users, and configuration.

### Tenant Properties

| Property | Description |
|----------|-------------|
| **id** | UUID. Unique tenant identifier. |
| **name** | Display name (e.g. "Acme Corporation"). |
| **slug** | URL-friendly identifier (e.g. `acme-corp`). Unique, lowercase letters, numbers, hyphens. |
| **db_name** | Dedicated database name (e.g. `cms_tenant_acme_corp`). Unique. |
| **parent_id** | Optional. For hierarchy: parent tenant UUID. |
| **shard_id** | Shard where the tenant’s database is hosted. |
| **status** | `provisioning` \| `active` \| `suspended` \| `deleted`. |
| **config** | JSON. Tenant-level settings (theme, language, etc.). |
| **feature_flags** | JSON. Per-tenant feature toggles. |
| **usage_limits** | JSON. Optional limits: `storage`, `apiCalls`, `users`. |
| **storage_used** / **storage_limit** | Storage usage and cap (bytes). |
| **api_calls_today** / **api_calls_limit** | API usage and cap. |
| **users_count** / **users_limit** | User count and cap. |
| **last_activity_at** | Last activity timestamp. |
| **provisioned_at** | When the tenant DB was provisioned. |
| **created_at** / **updated_at** | Audit timestamps. |

### Tenant Isolation

- **Data**: Tenant data lives in a **dedicated database** per tenant (`cms_tenant_<slug>`).
- **Users**: Tenant users are scoped to the tenant (tenant_users table + tenant DB).
- **Content**: Content types, entries, media, and settings are stored in the tenant DB.
- **APIs**: Tenant context is enforced via `X-Tenant-ID` (or JWT) and DB routing.

---

## 2. Control Plane: Tenant Management (Super Admin)

Super Admin manages tenants from the **Control Panel** (`/cp`).

### 2.1 Tenant List

- **Route**: `/cp/tenants`
- **Features**:
  - List all tenants (name, slug, status, created date, etc.).
  - Search/filter (if implemented in UI).
  - **Create Tenant** button → `/cp/tenants/new`.

### 2.2 Create Tenant

- **Route**: `/cp/tenants/new` (or redirect from `/cp/tenants/create`).
- **Input**: Name, slug (with optional auto-generation from name).
- **Optional (API)**: `parentId`, `config`, `featureFlags`, `usageLimits`.
- **Behaviour**:
  - Creates tenant record in the Control Plane DB with status `provisioning`.
  - Triggers **tenant provisioning** (create DB, run migrations, seed default data, create tenant DB user).
  - On success, status becomes `active`; on failure, status can be set to `suspended`.

### 2.3 Tenant Detail

- **Route**: `/cp/tenants/[id]`
- **Features**:
  - **Header**: Tenant name, status, actions (Activate, Suspend, Delete), command palette, context panel toggle.
  - **Tabs**: Overview, Users, Configuration, Analytics, Roles & Permissions (see [§4](#4-tenant-detail-tabs--capabilities)).

### 2.4 Tenant Actions (API & UI)

| Action | Description |
|--------|-------------|
| **Activate** | Set status to `active`. |
| **Suspend** | Set status to `suspended`. |
| **Delete** | Soft delete (tenant marked deleted; DB may be retained per policy). |
| **Update** | Update name, slug, config, feature flags, usage limits, etc. |

---

## 3. Tenant Provisioning

When a new tenant is created, the **Tenant Provisioning Service**:

1. **Creates** the tenant database (e.g. `cms_tenant_<slug>`).
2. **Grants** privileges to the app DB user for that database.
3. **Runs** tenant DB migrations (schema for content types, users, roles, etc.).
4. **Seeds** default data (roles, permissions, optional default content types).
5. **Creates** a dedicated DB user for the tenant (optional; for external or direct DB access).
6. **Updates** tenant record: status → `active`, `provisioned_at`, and optionally stores DB user/password.

On failure, tenant status is set to `suspended` and errors are logged.

---

## 4. Tenant Detail: Tabs & Capabilities

From `/cp/tenants/[id]`, Super Admin has these tabs:

| Tab | Description |
|-----|-------------|
| **Overview** | Summary: tenant info, status, key metrics, quick actions. |
| **Users** | List tenant users; create, edit, delete users; assign roles; reset password; open user in context panel. |
| **Configuration** | Tenant-level configuration (e.g. settings, feature flags, DB connection info if exposed). |
| **Analytics** | Tenant usage/analytics (e.g. API calls, storage, activity). |
| **Roles & Permissions** | Manage tenant roles and permissions; create/edit roles; assign permissions. |

Additional UI:

- **Command palette**: Quick actions (e.g. create user, view users, view settings, activate/suspend tenant).
- **Context panel**: Side panel with details for the selected user or tenant.

---

## 5. Tenant-Scoped Features (Tenant Dashboard)

After logging in as a **tenant user** (not Super Admin), users access the **Tenant Dashboard** (`/dashboard`). All of the following are **scoped to that tenant**.

### 5.1 Content & Structure

- **Content** (`/dashboard`): Default landing; content overview.
- **Projects** (`/dashboard/settings/projects`): Manage projects (grouping for data model, flows, etc.).
- **Data Model** (`/dashboard/settings/projects/[projectId]/data-model`): Define content types and structure.
- **Data Model Manager** (`/dashboard/settings/projects/[projectId]/data-model-manager`): Manage content types and entries (CRUD).
- **Flows** (`/dashboard/settings/projects/[projectId]/flows`): Workflow/automation (if implemented).

### 5.2 Users & Access

- **User Directory** (`/dashboard/users`): List and manage tenant users (Admin).
- **Roles** (`/dashboard/roles`): Tenant-level roles (if exposed).
- **Access Policies** (`/dashboard/settings/access-policies`): Per-tenant access rules (if implemented).

### 5.3 Settings (Tenant-Level)

- **Settings** (`/dashboard/settings`): General tenant settings.
- **Appearance**: Theme, design tokens.
- **Bookmarks**, **Translations**, **AI**: If implemented.
- **Marketplace** / **Extensions**: Tenant-level extensions/themes.
- **System Logs**, **Report Bug**, **Request Feature**: Support/debug (if implemented).

### 5.4 Other Sections (Placeholders / Future)

- **File Library** (`/dashboard/files`): Media library and uploads.
- **Explore**: Search/explore content.
- **Insights**: Analytics and reporting.
- **Documentation**: In-app docs.

Access to these sections is **role-based** (Admin, Editor, Reviewer, Author, API Consumer) as defined in the requirements.

---

## 6. APIs Summary

### Tenants (Control Plane – Super Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tenants` | Create tenant (triggers provisioning). |
| `GET` | `/api/tenants` | List all tenants. |
| `GET` | `/api/tenants/:id` | Get tenant by ID. |
| `GET` | `/api/tenants/slug/:slug` | Get tenant by slug. |
| `PATCH` | `/api/tenants/:id` | Update tenant. |
| `PATCH` | `/api/tenants/:id/activate` | Activate tenant. |
| `PATCH` | `/api/tenants/:id/suspend` | Suspend tenant. |
| `DELETE` | `/api/tenants/:id` | Soft delete tenant. |

### Tenant Users (Tenant-Scoped or Cross-Tenant for Super Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tenant-users` | List tenant users (Super Admin: all tenants; filters: tenantId, email, status, role). |
| `GET` | `/api/tenant-users/tenant/:tenantId/users` | List users for one tenant. |
| `GET` | `/api/tenant-users/tenant/:tenantId/roles` | List roles for one tenant. |
| `POST` | `/api/tenant-users/tenant/:tenantId/users` | Create tenant user. |
| `PUT` | `/api/tenant-users/tenant/:tenantId/users/:userId` | Update tenant user. |
| `DELETE` | `/api/tenant-users/tenant/:tenantId/users/:userId` | Delete tenant user. |
| Roles CRUD | `/api/tenant-users/tenant/:tenantId/roles` | Create/update/delete roles; assign permissions. |

(Exact paths may vary; see backend controllers and Swagger.)

### Tenant-Scoped APIs (With `X-Tenant-ID` or JWT tenant context)

- **Projects**, **Content Types**, **Content Entries**, **Flows**, **Permissions**, etc., are all tenant-scoped when the request carries a tenant context.

---

## 7. References

- **Architecture**: [Enterprise Headless CMS – Core Control Plane Database](../core/enterprise_headless_cms_core_db_architecture.md)
- **Requirements**: [CMS for Website – Requirements Document](../core/requirements.md) (Multi-Tenant Architecture, Users & Access, Tenant Provisioning, etc.)
- **SQL setup**: `docs/sql-scripts/enterprise-core-db-setup.sql`, `enterprise-core-db-seed.sql`
- **Backend**: `backend/src/tenants/`, `backend/src/tenant-users/`, `backend/src/tenants/provisioning/`
- **Frontend CP**: `frontend/app/cp/tenants/`, `frontend/app/cp/tenant-users/` (if present)
- **Frontend Dashboard**: `frontend/app/dashboard/` (tenant-scoped UI)

---

*Last updated: 2026. Align with code and product for the single source of truth.*
