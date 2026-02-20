# Tenant User Features – Dashboard Pages, Features & Actions

This document describes what **tenant users** (users who belong to a tenant, not Super Admin) can see and do in the **Tenant Dashboard** (`/dashboard`). It covers frontend pages, features, and actions only (no APIs).

---

## Table of Contents

1. [Overview & Access](#1-overview--access)
2. [Left Navigation (Sections)](#2-left-navigation-sections)
3. [Content](#3-content)
4. [Settings](#4-settings)
5. [User Directory](#5-user-directory)
6. [Roles & Permissions](#6-roles--permissions)
7. [Pages by Role](#7-pages-by-role)
8. [Coming Soon / Placeholder Pages](#8-coming-soon--placeholder-pages)

---

## 1. Overview & Access

- **Base URL**: `/dashboard`
- **Who**: Users who log in as **tenant users** (tenant context). Super Admin is redirected to `/cp`.
- **Layout**: Fixed left icon bar (52px) + expandable sidebar (220px) with section sub-menus, header with title and breadcrumb below it, main content area.
- **Role-based visibility**: Menu items and pages are shown or hidden based on user roles (Admin, Editor, Reviewer, Author, API Consumer). See [§7](#7-pages-by-role).

---

## 2. Left Navigation (Sections)

The left bar shows **section icons**. The expandable sidebar shows **sub-items** for the active section.

| Section        | Path                  | Sub-menu (expanded sidebar)                          |
|----------------|-----------------------|------------------------------------------------------|
| Content        | `/dashboard`          | Content (overview)                                  |
| File Library   | `/dashboard/files`    | Media Library, Uploads                               |
| Explore        | `/dashboard/explore`  | Explore                                             |
| Insights       | `/dashboard/insights` | Insights                                            |
| Documentation  | `/dashboard/documentation` | Documentation                                  |
| User Directory | `/dashboard/users`    | User Directory, Roles                                |
| Extensions     | `/dashboard/extensions` | Installed, Marketplace                            |
| Settings       | `/dashboard/settings`| Full settings tree (see [§4](#4-settings))          |

---

## 3. Content

### 3.1 Content (Home) – `/dashboard`

- **Purpose**: Landing page for tenant dashboard. Lists **content types** for the tenant (from content-types API; may show empty state if endpoint not implemented).
- **Features**:
  - Table of content types: Name, Collection, Fields count, Status (Active/Hidden).
  - Checkbox selection (per row and select all).
  - Row click / selection (no navigation to content type detail on this page; content types are managed under Settings → Data Model).
- **Actions**:
  - Select one or multiple content types (bulk actions not implemented on this page in current code).
- **Note**: If the content-types API returns 404, an empty state message is shown. Content type creation is under **Settings → Projects → [Project] → Data Model**.

---

## 4. Settings

**Path**: `/dashboard/settings`  
**Access**: Admin only. Non-admins are redirected to `/dashboard`.

Settings is the hub for project-scoped and tenant-level configuration. The **current project** (from project context) is used for project-scoped routes.

### 4.1 Settings Hub – `/dashboard/settings`

- **Purpose**: Entry page with cards linking to all settings areas.
- **Sections**:
  - **Settings**: Data Model, Flows, User Roles, Access Policies.
  - **Configuration**: Settings (general), Appearance, Bookmarks, Translations, AI.
  - **Extensions**: Marketplace, Extensions.
  - **System**: System Logs, Report Bug, Request Feature.
- **Actions**: Click a card to go to the corresponding page. Project-scoped links use the current project ID when a project is selected.

---

### 4.2 Projects – `/dashboard/settings/projects`

- **Purpose**: List and manage **projects** (grouping for data model, flows, locales, etc.).
- **Features**:
  - Table: Name, Slug, Status, Created.
  - Current project can be selected (project context).
- **Actions**:
  - **Create Project** – Opens create modal (name, slug). On success, list refreshes and new project can be set as current.
  - **Edit** – Opens edit modal for the project (name, slug, etc.). On success, list refreshes.
  - **Delete** – Opens delete confirmation; shows affected counts (e.g. content types, entries) before confirming. On success, list refreshes.
- **URL**: `?action=create` opens the create modal on load.

---

### 4.3 Data Model – `/dashboard/settings/projects/[projectId]/data-model`

- **Purpose**: Define **content types** (data models) and their **fields** for the selected project.
- **Features**:
  - **Sidebar**: “Data Model” label with **+** (create data model), then list of content types. Selecting one shows its field list in the main area.
  - **Main area**: For the selected content type – list of fields with type, key, required, hidden. Drag handle to reorder fields (drag-and-drop).
- **Actions**:
  - **Create Data Model** – Opens modal to create a new content type (name, collection, icon, singleton, etc.). On success, new type appears in sidebar and is selected.
  - **Edit content type** – Edit name, collection, icon, singleton, “hidden from sidebar”.
  - **Add Field** – Opens modal to add a field (type: text, number, boolean, date, relation, dynamic zone, etc.). On success, field list refreshes.
  - **Edit Field** – Edit field label, key, type, required, hidden, etc.
  - **Delete Field** – With confirmation. On success, field list refreshes.
  - **Reorder Fields** – Drag-and-drop to change field order; order can be saved.
- **Guards**: Requires valid project and project context; redirects or shows error if project not found.

---

### 4.4 Data Model Manager – `/dashboard/settings/projects/[projectId]/data-model-manager`

- **Purpose**: Manage **content type entries** (actual content) per content type.
- **Features**:
  - **Sidebar**: “Data Model Manager” label, then list of content types. Clicking one navigates to that content type’s entries.
  - **Main area**: Either list of entries for the selected content type, or empty state / singleton editor.
- **Actions** (on entries list):
  - **Create Entry** – Navigate to create page: `/dashboard/settings/projects/[projectId]/data-model-manager/[contentTypeId]/create`.
  - **Filter** (UI present; behaviour depends on backend).
  - **Per entry**: **Edit** (navigate to entry edit), **Delete** (confirmation dialog), **Publish** (publish dialog).
- **Singleton content types**: Show a single “Edit Entry” button that navigates to the singleton editor (route may be `.../edit`).

---

### 4.5 Content Type Entries List – `/dashboard/settings/projects/[projectId]/data-model-manager/[contentTypeId]`

- **Purpose**: List entries for one content type, or singleton placeholder.
- **Features**:
  - Back link to Data Model Manager.
  - Table of entries (visible fields from schema, e.g. first 5 non-hidden).
  - Pagination/sort (page, limit, sort, order) if supported by backend.
- **Actions**:
  - **Create Entry** – Link to create page.
  - **Delete** – Confirmation dialog; on confirm, entry is deleted and list refreshes.
  - **Publish** – Publish dialog; on confirm, entry is published and list refreshes.
  - **Row/Edit** – Navigate to entry detail/edit: `.../data-model-manager/[contentTypeId]/[entryId]`.

---

### 4.6 Create Entry – `/dashboard/settings/projects/[projectId]/data-model-manager/[contentTypeId]/create`

- **Purpose**: Create a new entry for the content type (form built from content type fields).
- **Features**: Form with fields per content type schema.
- **Actions**: Submit to create; on success, redirect to list or to the new entry’s edit page.

---

### 4.7 Edit Entry – `/dashboard/settings/projects/[projectId]/data-model-manager/[contentTypeId]/[entryId]`

- **Purpose**: View and edit a single entry.
- **Features**: Form with fields per content type schema; entry ID in URL.
- **Actions**: Save changes; delete entry; possibly publish/unpublish.

---

### 4.8 Flows – `/dashboard/settings/projects/[projectId]/flows`

- **Purpose**: List and manage **flows** (workflows/automation) for the project.
- **Features**: Table of flows (name, description, status, etc.).
- **Actions**: Create flow, Edit flow, Delete flow (with confirmation). Implemented with flows API.

---

### 4.9 Access Policies – `/dashboard/settings/projects/[projectId]/access-policies`

- **Status**: **Coming soon.** Page shows an alert that fine-grained permissions and custom policies will be available here.
- **Access**: Admin only; project guard applied.

---

### 4.10 Locales (Translations) – `/dashboard/settings/projects/[projectId]/locales`

- **Status**: **Coming soon.** Page shows an alert that multi-language content and locales will be managed here.
- **Access**: Admin only; project guard applied.

---

### 4.11 Settings (General) – `/dashboard/settings`

- Same as Settings Hub (§4.1); the “Settings” card in Configuration points to this page (current page).

---

### 4.12 Appearance – `/dashboard/settings/appearance`

- **Status**: **Coming soon.** Alert: themes, branding, and design tokens will be configurable here.
- **Access**: Admin only.

---

### 4.13 Bookmarks – `/dashboard/settings/bookmarks`

- **Status**: **Coming soon.** Placeholder for saving frequently accessed views and filters.
- **Access**: Admin only.

---

### 4.14 AI – `/dashboard/settings/ai`

- **Status**: **Coming soon.** Placeholder for AI configuration.
- **Access**: Admin only.

---

### 4.15 Marketplace – `/dashboard/settings/marketplace`

- **Status**: Placeholder or minimal (theme/marketplace).
- **Access**: Admin only.

---

### 4.16 Extensions – `/dashboard/settings/extensions`

- **Status**: Placeholder or minimal (extensions list).
- **Access**: Admin only.

---

### 4.17 System Logs – `/dashboard/settings/system-logs`

- **Status**: **Coming soon.** Placeholder for system/audit logs.
- **Access**: Admin only.

---

### 4.18 Report Bug – `/dashboard/settings/report-bug`

- **Status**: **Coming soon.** Placeholder for bug reporting.
- **Access**: Admin only.

---

### 4.19 Request Feature – `/dashboard/settings/request-feature`

- **Status**: **Coming soon.** Placeholder for feature requests.
- **Access**: Admin only.

---

## 5. User Directory

**Path**: `/dashboard/users`  
**Access**: **Admin** only.

- **Purpose**: List and manage **tenant users** (users belonging to the same tenant).
- **Features**:
  - Table: Email, Name, Roles, Status (Active/Inactive/Deleted), Last login, Created. Checkbox per row and select all.
  - Search by email or name.
  - Status filter: All, Active, Inactive.
- **Actions**:
  - **Create User** – Opens create-user modal (email, name, password, roles). On success, list refreshes.
  - **Edit** – Opens edit-user modal (email, name, status, roles). On success, list refreshes.
  - **Reset Password** – Opens reset-password modal. On success, toast confirmation.
  - **Activate / Deactivate** – Single or bulk. Updates status and refreshes list.
  - **Delete** – Single or bulk. Confirmation; on success, list refreshes.
- **Dependencies**: Tenant ID from auth context; tenant users API.

---

## 6. Roles & Permissions

**Path**: `/dashboard/roles`  
**Access**: **Admin** only.

- **Purpose**: Manage **tenant roles** and their **permissions** (tenant-level RBAC).
- **Features**:
  - List of roles with name, description, permission count. Expand/collapse per role to see permissions.
  - Loads roles for the current tenant; can load permission count (or full permissions) per role.
- **Actions**:
  - **Create Role** – Opens create-role modal (name, description). On success, list refreshes.
  - **Edit Role** – Opens edit-role modal. On success, list refreshes.
  - **Manage Permissions** – Opens modal to assign permissions to the role (checkboxes per permission). On success, list refreshes.
  - **Delete Role** – With confirmation. On success, list refreshes.
- **Note**: Uses the same `RolesPermissionsTab` logic as in CP tenant detail (roles and permissions for this tenant).

---

## 7. Pages by Role

Menu items are filtered by role. Only sections the user is allowed to see appear in the left nav.

| Role          | Content | File Library | Explore | Insights | Documentation | User Directory | Extensions | Settings |
|---------------|---------|--------------|---------|----------|----------------|----------------|------------|----------|
| Admin         | ✓       | ✓            | ✓       | ✓        | ✓              | ✓              | ✓          | ✓        |
| Editor        | ✓       | ✓            | ✓       | ✓        | ✓              | —              | —          | —        |
| Reviewer      | ✓       | ✓            | ✓       | ✓        | ✓              | —              | —          | —        |
| Author        | ✓       | ✓            | ✓       | —        | ✓              | —              | —          | —        |
| API Consumer  | —       | —            | —       | —        | —              | —              | —          | —        |

- **Settings**: All settings sub-pages (Projects, Data Model, Flows, User Roles, Access Policies, Appearance, Bookmarks, Translations, AI, Marketplace, Extensions, System Logs, Report Bug, Request Feature) are **Admin** only. Non-admins are redirected from `/dashboard/settings` to `/dashboard`.
- **User Directory** and **Roles**: Admin only.
- **Insights**: Admin, Editor, Reviewer (not Author).

---

## 8. Coming Soon / Placeholder Pages

These pages exist in the app but show a “Coming soon” (or similar) message and do not yet provide full functionality:

| Page                 | Path                                                                 | Note                          |
|----------------------|----------------------------------------------------------------------|-------------------------------|
| File Library         | `/dashboard/files`                                                  | Section exists; page may be placeholder. |
| Explore              | `/dashboard/explore`                                                | Section exists; page may be placeholder. |
| Insights             | `/dashboard/insights`                                               | Section exists; page may be placeholder. |
| Documentation        | `/dashboard/documentation`                                         | Section exists; page may be placeholder. |
| Extensions           | `/dashboard/extensions`                                             | Section exists; page may be placeholder. |
| Access Policies      | `/dashboard/settings/projects/[projectId]/access-policies`         | “Coming soon” alert.          |
| Locales              | `/dashboard/settings/projects/[projectId]/locales`                  | “Coming soon” alert.          |
| Appearance           | `/dashboard/settings/appearance`                                   | “Coming soon” alert.          |
| Bookmarks            | `/dashboard/settings/bookmarks`                                    | “Coming soon” alert.          |
| AI                   | `/dashboard/settings/ai`                                           | “Coming soon” alert.          |
| System Logs          | `/dashboard/settings/system-logs`                                   | “Coming soon” alert.          |
| Report Bug           | `/dashboard/settings/report-bug`                                    | “Coming soon” alert.          |
| Request Feature      | `/dashboard/settings/request-feature`                               | “Coming soon” alert.          |

---

## Summary: Implemented vs Placeholder

**Fully implemented (pages with real features and actions):**

- **Content** (`/dashboard`) – Content types list (depends on content-types API).
- **Settings hub** (`/dashboard/settings`) – Links to all settings.
- **Projects** – Create, edit, delete projects; affected counts on delete.
- **Data Model** – Create/edit content types; add/edit/delete/reorder fields.
- **Data Model Manager** – List content types; list entries per type; create/edit/delete/publish entries; singleton placeholder.
- **Flows** – List, create, edit, delete flows (project-scoped).
- **User Directory** – List tenant users; create, edit, delete, activate/deactivate, reset password; search and status filter.
- **Roles & Permissions** – List roles; create, edit, delete roles; manage permissions per role.

**Placeholder / coming soon:**

- File Library, Explore, Insights, Documentation, Extensions (main section pages).
- Access Policies, Locales, Appearance, Bookmarks, AI, System Logs, Report Bug, Request Feature (settings sub-pages).

---

*Last updated: 2026. Reflects current frontend under `frontend/app/dashboard/` and `frontend/lib/utils/menu-items.ts`.*
