# CMS V2 — UI Design Document

UI design specification for the CMS admin, mapping all features from [requirements.md](./requirements.md) to screens and components. 

**Design Reference**: [Directus Admin Panel](https://directus.io/)  
**Sandbox Reference**: [Directus Sandbox](https://sandbox.directus.io/admin/getting-started/get-started)  
**UI Framework**: [Radix UI](https://www.radix-ui.com/)

Design patterns align with modern headless CMS admin UIs such as Directus Admin (sidebar navigation, collection-based content, role-based views, settings panels).

---

## 1. Design Principles & Reference

| Principle | Description |
|-----------|-------------|
| **Clarity** | One primary action per screen; clear hierarchy (navigation → list → detail). |
| **Consistency** | Reuse patterns: list + filters + bulk actions; form layout (sections, validation); empty states and loading. |
| **Role-aware** | UI adapts to role (Super Admin, Admin, Editor, Reviewer, Author, API Consumer); hide or disable irrelevant actions. |
| **Layman-first** | Non-technical users can build and edit their website without knowing "schema", "collection", or "API". Use plain language, guided wizards, and drag-and-drop; hide advanced options behind "Advanced" or "Developer" where needed. See §1.1 below. |
| **Reference** | [Directus Admin](https://directus.io/): sidebar modules, collection list/detail, field-based forms, settings, and API/keys management inspire layout and interaction patterns. [Directus Sandbox](https://sandbox.directus.io/admin/getting-started/get-started) serves as primary UI reference. |

### 1.2 Technology Stack

**Frontend Framework:**
- **Next.js**: Latest version (16.x+) with App Router
- **React**: React 19 (via Next.js)

**UI Component Library:**
- **Radix UI**: [radix-ui.com](https://www.radix-ui.com/) - Headless, accessible primitives
  - @radix-ui/react-dialog
  - @radix-ui/react-dropdown-menu
  - @radix-ui/react-popover
  - @radix-ui/react-select
  - @radix-ui/react-tabs
  - @radix-ui/react-tooltip
  - @radix-ui/react-checkbox
  - @radix-ui/react-switch
  - @radix-ui/react-slider
  - @radix-ui/themes (optional)

**Styling:**
- **Tailwind CSS**: Utility-first CSS framework
- **CSS Variables**: For theming (light/dark mode)

**Additional Libraries:**
- **Lucide React**: Icons
- **React Hook Form**: Form handling
- **Zod**: Validation
- **TanStack Table**: Data tables
- **Tiptap**: Rich text editor

### 1.1 Layman-Friendly UX (No-Code / Low-Code)

- **Plain language**: Prefer “Pages”, “Blocks”, “Menu”, “Site settings” over “Content types”, “Collections”, “Schema”. Use “Add block” instead of “Create entry” where the user is building a page.
- **Guided flows**: First-time project setup = step wizard (Pick a theme → Name your site → Add your first page). Empty states always offer one clear next action (e.g. “Add your first page” with a template picker).
- **Templates first**: When creating a page, show **templates** (Home, Landing, Contact, Blog listing) with previews; user picks one, then edits. No need to “choose a content type” unless in advanced mode.
- **Visual page building**: Offer a **drag-and-drop page builder**: canvas + block palette (from Library). Add sections (Hero, Features, CTA, Footer) by drag; reorder by drag; edit inline (click to edit text, replace image). See §5.5 Drag-and-Drop.
- **Safe defaults**: Sensible defaults for every choice (e.g. default theme, default menu, auto-save). “Publish” is explicit; drafts are clearly labeled.
- **Progressive disclosure**: Simple mode by default (pages, blocks, media, menu). “Content model”, “API keys”, “Webhooks” under **Settings → Advanced** or a “Developer” area for power users.

---

## 2. Application Structure

### 2.1 Entry Points

| Screen | Purpose | CMS-V2 ref |
|--------|--------|------------|
| **Platform login** | Super Admin / platform operator login (optional SSO). | §3.2 SSO, 2FA |
| **Tenant login** | Tenant admin/login (email/password, SSO, 2FA). | §3.2 |
| **Tenant onboarding** | First-time setup after tenant provisioning (wizard: project, theme clone, admin user). | §2.4 Tenant Provisioning |

### 2.2 Shell Layout (Post-login)

- **Top bar**: Logo, tenant/project switcher (if multi-project), global search, notifications bell, user menu (profile, preferences, logout).
- **Sidebar**: Module navigation (collapsible). For **Tenant**, layman-friendly labels: “Dashboard”, “Pages”, “Blocks” (Library), “Media”, “Menu”, “Site settings”; optional “Library” (templates + blocks). “Users”, “Content model”, “API” under “Settings” or “Advanced”. Items vary by role.
- **Main area**: Breadcrumb + page title, then content (list, form, dashboard, or **page builder** canvas).
- **Optional right panel**: Field help, version history, or comments (contextual).

---

## 3. Platform Admin UI (Super Admin)

*Only for platform operators. One database (platform); tenant-scoped data accessed via tenant selector.*

### 3.1 Dashboard

| Element | Purpose | CMS-V2 ref |
|---------|--------|------------|
| Tenant count, status breakdown | At-a-glance tenant health. | §2.1 Tenant Model |
| Provisioning queue | List of tenants in “provisioning” with progress or errors. | §2.4 Tenant Provisioning |
| Usage summary | Aggregate storage, API calls, active users across tenants. | §2.5 Tenant Configuration (quotas) |
| Quick actions | “Create tenant”, “View tenant”, links to Libraries / Themes. | §2.4 |

### 3.2 Tenant Management

| Screen / Component | Purpose | CMS-V2 ref |
|--------------------|--------|------------|
| **Tenant list** | Table: name, slug, status, db_name, usage (storage, API, users), last activity. Filters: status, search. Actions: Create, View, Suspend, Activate, Delete. | §2.1, §2.2, §2.5 |
| **Tenant create** | Form: name, slug, (optional parent for hierarchy), config, feature flags, usage limits. Submit → start provisioning. | §2.4, §2.3 Tenant Hierarchy |
| **Tenant detail** | Tabs: Overview (config, limits, usage), Hierarchy (parent/children), Feature flags, Usage history (charts/tables), Activity log. Actions: Edit, Suspend, Delete. | §2.4, §2.5 |
| **Tenant hierarchy** | Tree or list of parent–child tenants; link to “shared resources at parent” if applicable. | §2.3 Tenant Hierarchy |

### 3.3 Library (Platform) — Schema, Content & Component Library

Unified **Library** for platform: three browsable areas (Schema, Content, Component) so operators can manage what tenants can use when building sites.

| Area | Purpose | Screens / Components | CMS-V2 ref |
|------|--------|----------------------|------------|
| **Schema Library** | Reusable content type definitions (the “shape” of content). | **Schema list**: Cards/list of templates (Page, Section, Menu, Card, Blog, Event, etc.) with category (page, layout, navigation, block, form, blog, settings). **Drag-drop** to reorder in theme bundles. **Schema editor**: Name, icon, category; **Fields** list with **drag-drop reorder**; field type (text, rich text, media, boolean, number, date), validation, default. Relationships (one-to-one, one-to-many) with visual link. | §9.1 Content Type Library, §4.1 |
| **Content Library** | Predefined page/content templates (actual default content + structure). | **Content templates list**: e.g. Home, Landing, Legal, Contact, 404. Filter by type (page, post, etc.). **Drag-drop** to reorder in theme. **Content template editor**: Name, slug; pick schema template; **default content** (form or JSON); preview thumbnail. Used when user “starts from template” when creating a page. | §9.1 Pages (Home, Landing, Legal, Error) |
| **Component Library** | Reusable UI blocks (Hero, Card, Tabs, Accordion, CTA, Footer). | **Component list**: Filter by type (section, block, form) and category (hero, footer, cta, pricing, testimonial). **Drag-drop** to reorder in theme bundles. **Component editor**: Name, slug, category; default_structure (layout + placeholder content); preview image; tags. Tenant users **drag these onto the page builder** canvas. | §9.1 Layout structures, Content blocks |

**Unified Library UI (Platform):**

- **Sidebar**: Tabs or subsections — “Schema”, “Content templates”, “Components”.
- **List view**: Card grid or table; search; category/type filters; **drag handles** for sort order when used in theme bundles.
- **Editor**: Single layout for all three: basic meta (name, slug, category, icon) + type-specific area (schema fields vs default content vs component structure). **Drag-drop** for field order (schema) and block order (components).
- **Theme bundles**: When editing a theme, “Add from Library” opens a **drag-drop** list: drag schema templates and library items into “Included in this theme” with order.

### 3.4 Theme Library (Platform)

| Screen / Component | Purpose | CMS-V2 ref |
|--------------------|--------|------------|
| **Theme list** | Cards or table: name, version, preview image, design tokens summary, downloads/rating. Create, Edit, Duplicate, Preview. | §9.2 Theme Library |
| **Theme editor** | **Identity**: name, slug, version. **Design tokens**: colors, typography, spacing. **Component variants**: buttons, cards, forms. **Presets**: page/section presets. **Bundles**: linked schema templates + library items (drag-order). Export (JSON/API). | §9.2.1–9.2.4 |
| **Theme preview** | Read-only preview (iframe or mock) with sample content. | §9.2.4 |

### 3.5 Platform Settings (Optional)

| Screen / Component | Purpose | CMS-V2 ref |
|--------------------|--------|------------|
| Extensions | List enabled/disabled extensions; configure. | §10 Integrations |
| Translations | System UI strings by language. | — |
| Migrations | List applied migrations (read-only). | — |

---

## 4. Tenant Admin UI

*Per-tenant database. User sees only their tenant’s data. Project switcher when tenant has multiple projects.*

### 4.1 Dashboard (Tenant)

| Element | Purpose | CMS-V2 ref |
|---------|--------|------------|
| Project cards / switcher | List projects; “Create project” (empty or “Clone theme”). | §2.1 (projects) |
| **Primary CTA (layman)** | “Create your first page” or “Add a page” → opens **template picker** (Home, Landing, Contact, Blank) then **page builder**. No “content type” choice. | §5.1, §9.1 |
| Content summary | Counts by collection (e.g. Pages, Posts); draft vs published. | §4.2 Content Lifecycle |
| Pending workflow items | Entries in “review” or assigned to me. | §5.2 Workflow Management |
| Recent activity | Last edits, publishes, logins. | §3.2 Audit logs |
| Quick create | “New page”, “New post”, etc. (by content type). For laymen: “New page” defaults to template picker + page builder. | §5.1 Content Management |

### 4.2 Projects

| Screen / Component | Purpose | CMS-V2 ref |
|--------------------|--------|------------|
| **Project list** | Name, slug, theme (if cloned), last updated. Create, Enter project. | §2.1 |
| **Create project** | **Option A**: Clone theme — select platform theme, name/slug; creates project with predefined structure. **Option B**: Empty project — name, slug; define schemas later. | §9.2.3 Theme cloning |
| **Project settings** | Name, slug, config, feature flags; optional default theme, default locale. | §2.5 Tenant Configuration (tenant-level settings) |

### 4.3 Library (Tenant) — Schema, Content & Components

Tenant-facing **Library** for the current project: browse and use schemas, content templates, and components. Layman sees “Blocks” and “Page templates”; advanced users can see “Content types” and “Schema”.

| Area | Purpose | Screens / Components | Layman-friendly |
|------|--------|----------------------|-----------------|
| **Schema Library** | Content types available in this project (from theme clone or custom). | **List**: “Content types” (Pages, Posts, Menu items, etc.) with icon and count. **Drag-drop** to reorder in nav/settings. **Editor**: Add/edit fields with **drag-drop** field order; field type picker (Text, Long text, Image, Link, etc.). | Show as “What your site can have” (Pages, Posts, Menus) with simple names; “Edit fields” under Advanced. |
| **Content Library** | Ready-made page/content templates to start from. | **Templates gallery**: Cards with preview — “Home”, “Landing”, “Contact”, “Blog listing”, “Legal”. **Drag** a template onto “New page” to create page from template. **Template editor** (admin): default content and structure. | Primary way to create a page: “Start from template” → pick Home / Contact / etc. → edit. |
| **Component Library** | Blocks/sections to add to pages (Hero, Features, CTA, Cards, etc.). | **Block palette**: Categorized (Headers, Content, Call to action, Footer). Each block = **draggable card** with icon + name. Used in **Page builder**: drag from palette onto canvas; **drag on canvas** to reorder or nest. **Component editor** (admin): default layout and placeholder content. | Shown as “Blocks” in page builder sidebar; “Add block” → drag Hero, Text, Image, etc. onto page. |

**Unified Library UI (Tenant):**

- **Sidebar entry**: “Library” with sub-items “Page templates”, “Blocks” (and optionally “Content types” for advanced).
- **Page templates**: Grid of templates; “Use this template” creates a new page with default content; user then edits in page builder or form.
- **Blocks**: Same blocks used in the **Page builder** block palette; optionally browsable in Library for preview and “Add to page”.
- **Drag-drop**: Reorder templates in lists; reorder fields in content type; in page builder, drag blocks from palette to canvas and reorder on canvas (see §5.5).

### 4.4 Users & Roles

| Screen / Component | Purpose | CMS-V2 ref |
|--------------------|--------|------------|
| **User list** | Table: name, email, roles, status, last login. Filters: role, status. Invite, Edit, Deactivate. | §3.1 User Roles |
| **User create/edit** | Email, name, avatar, password (or “Invite”), roles (multi-select), status. Optional: SSO provider, 2FA status, preferences (language, theme). | §3.1, §3.2 SSO, 2FA |
| **Role list** | Name, description, user count. Create, Edit (non-system). | §3.2 Custom roles |
| **Role editor** | Name, description. **Permissions**: per collection, actions (create, read, update, delete, share); optional field-level; filter rules (e.g. “read only if status = published”). | §3.2 RBAC, Field-level permissions |
| **Project members** | Per-project: list users with optional project-level role override. Add/remove members. | §2.1 Users and roles |

### 4.5 Content Model (Schema Builder)

| Screen / Component | Purpose | CMS-V2 ref |
|--------------------|--------|------------|
| **Content types list** | Collections (content types) in current project. Create from scratch or from platform schema template. | §4.1 Content Modeling |
| **Content type editor** | Name, collection code, icon. **Fields**: add field (text, rich text, media, boolean, number, date, relationship). For each: key, type, interface (widget), validation, default, required. **Relationships**: one-to-one, one-to-many (with reverse field). Reusable components as field groups. | §4.1 |
| **Fields & relations** | Same as above; can be separate “Fields” and “Relations” tabs if using normalized fields/relations tables. | §4.1 |

### 4.6 Content (Collections & Entries) & Page Builder

| Screen / Component | Purpose | CMS-V2 ref |
|--------------------|--------|------------|
| **Collection list** | Table/cards for a content type. Columns configurable (title, status, updated, author). Filters: status, type, tags; full-text search. Bulk actions: Publish, Unpublish, Delete, Change status. Sort, pagination. | §5.1, §11.1 Search & Discovery |
| **Entry create/edit** | Form built from content type fields. Sections/groups; rich text, media picker, date picker, relation picker. **Status**: Draft / Review / Published (or workflow state). Auto-save draft; Save, Submit for review, Publish. Duplicate, Delete. | §5.1, §4.2 Content Lifecycle |
| **Page builder (visual editor)** | **Layman-friendly**: Canvas (visual page) + left **block palette** (from Component Library). **Drag blocks** from palette onto canvas; **drag on canvas** to reorder or nest (e.g. Section → Rows → Blocks). Inline edit: click text to edit, click image to replace (opens media picker). Device preview (desktop/tablet/mobile). Undo/redo. Saves as structured content (blocks/sections) linked to content type. | §5.1, §9.1 Content blocks |
| **“Start from template”** | When creating a page: choose “Blank” or a **Content Library** template (Home, Landing, Contact). Template pre-fills page builder canvas or form. | §9.1 |
| **Version history** | List of versions (date, author, optional name); diff view; “Restore this version”. | §4.2 Version history and rollback |
| **Scheduled publish/unpublish** | Date/time pickers on entry; list view filter “Scheduled”. | §4.2 Scheduled publish/unpublish |
| **Preview** | Preview button: open draft in new tab (preview URL). | §4.2 Preview support |

### 4.7 Workflows

| Screen / Component | Purpose | CMS-V2 ref |
|--------------------|--------|------------|
| **Workflow list** | Workflows for project (optionally per content type). Create, Edit, Set default. | §5.2 Workflow Management |
| **Workflow editor** | Name, optional content type. **Steps**: add steps (e.g. “Draft → Review”, “Review → Approved”); assign reviewer role or users. Save. | §5.2 Configurable, multi-level |
| **Workflow inbox** | List entries in “review” (or “pending”); filter by assigned to me / all. Open entry; **Approve** or **Reject** (with rejection reason). Comments thread. | §5.2 Comments and rejection reasons |
| **Workflow audit** | Per entry or global: timeline of state changes, approver, comments. | §5.2 Workflow audit trail |

### 4.8 Media Library

| Screen / Component | Purpose | CMS-V2 ref |
|--------------------|--------|------------|
| **Folder tree** | Sidebar: folders per project; create, rename, move. | §6.1 Asset Management, folder-based |
| **Asset grid/list** | Thumbnails or list; upload (drag-drop, multi-file). Filters: type (image/video/document), folder, tags. Search. Select for bulk: delete, move, edit metadata. | §6.1 Upload, metadata |
| **Asset detail** | Preview, filename, type, size, dimensions. **Metadata**: title, alt text, tags, description. Usage: “Used in X entries”. Versions: list of transforms (resize, crop). | §6.1 Metadata, versioning, usage |
| **Upload** | Drag-drop zone; progress; optional folder selection. | §6.1 |
| **Image transform** | Crop, resize, format; save as new “version” or preset. | §6.2 Media Optimization |

### 4.9 Themes (Tenant)

| Screen / Component | Purpose | CMS-V2 ref |
|--------------------|--------|------------|
| **Theme list** | Themes for current project. “Add from platform library” (clone), Create custom, Edit, Duplicate. | §9.2.3 Multiple themes per site |
| **Theme editor** | If cloned: show platform_theme_id; **Customizations**: override design tokens, variants, presets. If custom: full token/variant/preset editor. Version history. | §9.2.3 Theme inheritance and overrides, version history |
| **Theme assignment** | Per page (entry) or site-wide: dropdown “Theme” (site default vs per-page override). | §9.2.3 Theme assignment per page |
| **Theme delivery** | Read-only: “API endpoint” / “JSON config URL” for frontend. | §9.2.4 Theme configuration via API |

### 4.10 Localization & SEO

| Screen / Component | Purpose | CMS-V2 ref |
|--------------------|--------|------------|
| **Locales** | List locales (code, name, default, fallback). Add, Edit, Set default. | §8.1 Localization |
| **Entry locale switcher** | In entry form: tabs or dropdown per locale; locale-specific fields. Fallback indicator. | §8.1 Locale-specific fields, fallback |
| **Translation workflow** | Optional: “Mark for translation”, “Translated” status per locale (if workflow supports it). | §8.1 Translation workflow |
| **SEO panel (per entry)** | In entry form or tab: meta title, meta description, Open Graph (image, title, description), canonical URL, structured data (JSON-LD). Per locale. | §8.2 SEO Management |

### 4.11 API Keys & Environments

| Screen / Component | Purpose | CMS-V2 ref |
|--------------------|--------|------------|
| **API keys list** | Per project: name, scope (draft/published), environment (Dev, QA, Prod), last used, expires. Create, Revoke. On create: show key once (copy). | §7.1 Authentication, §7.2 Environments |
| **API key create** | Name, scope (draft vs published), environment, optional expiry, optional permissions/rate limit. | §7.1, §7.2 |
| **Environments** | List Dev, QA, Prod (or custom); link to keys and docs (REST/GraphQL base URL). | §7.2 Environment separation |

### 4.12 Settings (Tenant / Project)

| Screen / Component | Purpose | CMS-V2 ref |
|--------------------|--------|------------|
| **Project settings** | Project name, descriptor, URL, logo, colors, public note; auth (login attempts, password policy); storage (default folder, transform presets); default language; custom CSS. | §2.5 Tenant Configuration |
| **Feature flags** | Toggle features per project (if applicable). | §2.5 Feature flags |
| **Webhooks** | List: name, URL, method, collections/actions, status. Create, Edit, Test. | §10 Webhooks |
| **Notifications** | In-app: list notifications (inbox/archived); mark read. Email: optional email notification settings. | §11.3 Notifications |

### 4.13 Search & Discovery

| Screen / Component | Purpose | CMS-V2 ref |
|--------------------|--------|------------|
| **Global search** | Top-bar search: full-text across collections (entries, assets). Results grouped by collection; click to open. | §11.1 Full-text search |
| **Collection filters** | In list views: filters by status, type, tags, date range. | §11.1 Filters by status, type, tags |

### 4.14 Import / Export

| Screen / Component | Purpose | CMS-V2 ref |
|--------------------|--------|------------|
| **Import** | Choose collection; upload CSV or JSON; map columns to fields; preview; run import. | §11.2 CSV / JSON import |
| **Export** | Choose collection, format (CSV/JSON), filters; download. | §11.2 Content export |
| **Backup / restore** | If in scope: trigger backup, list backups, restore (admin only). | §11.2 Backup and restore |

### 4.15 Notifications & Activity

| Screen / Component | Purpose | CMS-V2 ref |
|--------------------|--------|------------|
| **Notification bell** | Dropdown: unread in-app notifications (e.g. “X requested review”, “Y published”). Mark read, link to item. | §11.3 In-app notifications |
| **Activity log** | List actions (create, update, delete, login) with user, collection, item, date, IP. Filter by user, collection, action. | §3.2 User activity and audit logs |

### 4.16 Integrations & Extensibility

| Screen / Component | Purpose | CMS-V2 ref |
|--------------------|--------|------------|
| **Webhooks** | See §4.11 Settings. | §10 Webhooks |
| **Extensions / plugins** | If tenant can enable: list available extensions; enable/disable; configure (per extension UI). | §10 Plugin/extension support |
| **CI/CD** | Optional: “Build trigger” URL or webhook for static site build. | §10 CI/CD build triggers |

---

## 5. UI Components (Reusable)

| Component | Use |
|-----------|-----|
| **Sidebar nav** | Module list; active state; collapse; role-based visibility. Optional **drag-drop** to reorder nav items (user preference). |
| **Data table** | Sortable columns, row select, bulk actions, pagination, column visibility. Optional **drag handles** to reorder rows (e.g. menu items, workflow steps). |
| **Filters bar** | Filter chips/dropdowns (status, type, date, user); clear all. |
| **Form layout** | Sections/groups; required indicator; inline validation; save/cancel. |
| **Rich text editor** | WYSIWYG or markdown; image/media embed. |
| **Media picker** | Modal: browse folders, search, select one/many; **drag-drop** files to upload or to add to entry; crop for images if needed. |
| **Relation picker** | Search/list other collection; single or multi select. |
| **Status badge** | Draft, Review, Approved, Published (and custom workflow states). |
| **Empty state** | Illustration + “No items yet” + primary action (e.g. Create first entry). |
| **Confirm dialog** | Delete, Publish, Revoke key, etc. |
| **Toasts** | Success/error after save, publish, delete. |
| **Block palette** | List of blocks (from Component Library) with icon + name; **draggable** into page builder canvas. Categories collapsible (Headers, Content, CTA, etc.). |
| **Page builder canvas** | Drop zones for sections/rows/blocks; **drag-drop** to add, reorder, nest; inline edit on click; drag handle on hover. |

### 5.5 Drag-and-Drop (Patterns)

Use **drag-and-drop** so laymen can build and reorder without forms or “move up/down” buttons. Every list that has a meaningful order should support drag where possible.

| Where | What is draggable | Behavior |
|-------|-------------------|----------|
| **Page builder** | Blocks from **block palette** | Drag block from sidebar onto canvas; drop between sections or inside a section. Reorder blocks by dragging on canvas; optional nest (e.g. drag into two-column layout). |
| **Page builder** | Sections / blocks **on canvas** | Drag handle (e.g. left edge or bar) to reorder; drop indicator (line or zone) shows target. |
| **Library (Schema)** | Fields in content type | Drag to reorder fields in schema editor; order defines form and API. |
| **Library (Theme bundles)** | Schema templates, content templates, components | Drag from “Available” into “Included in theme”; drag within “Included” to set order. |
| **Library (Tenant)** | Content types, block list | Drag to reorder “Content types” in nav; drag blocks in component list for default order in palette. |
| **Media library** | Files in upload area | Drag files from desktop into upload zone or folder. Drag assets between folders to move. |
| **Menu / Navigation** | Menu items | Drag to reorder; drag to indent/outdent for hierarchy. |
| **Workflow editor** | Steps | Drag to reorder approval steps. |
| **Dashboard / Presets** | Cards or widgets | Optional: drag to reorder dashboard widgets; save layout. |

**Accessibility:** Provide keyboard fallback for every drag (e.g. “Move up” / “Move down” buttons, or arrow keys in list). Announce reorder to screen readers (“Moved to position 2”).

---

## 6. Role-Based Visibility (Summary)

| Role | Platform UI | Tenant UI (typical) |
|------|--------------|----------------------|
| **Super Admin** | Full: tenants, usage, schema library, theme library, extensions. | Can impersonate or access any tenant. |
| **Admin** | — | Projects, users, roles, content types, workflows, themes, settings, API keys, webhooks. |
| **Editor** | — | Content (all), media, workflows (submit/approve if allowed), themes (view). No schema or user management. |
| **Reviewer** | — | Workflow inbox, content (read + approve/reject), comments. |
| **Author** | — | Content (create/edit drafts), media (upload). No publish, no settings. |
| **API Consumer** | — | Read-only API; no admin UI or limited “docs/keys” view. |

---

## 7. Responsive & Accessibility

- **Breakpoints**: Sidebar collapses to hamburger on small screens; tables allow horizontal scroll or card layout.
- **Keyboard**: Full navigation and primary actions (save, cancel, delete) via keyboard; focus order and focus trap in modals.
- **Screen readers**: Labels, ARIA where needed, status announcements (e.g. “Entry saved”).
- **Contrast**: Meet WCAG AA for text and interactive elements.

---

## 8. Reference

- **Feature source**: [CMS-V2.md](./CMS-V2.md)  
- **Admin UI reference**: [Directus Admin](https://sandbox.directus.io/admin/login) — login, sidebar modules, collection list/detail, form layout, settings, and API/keys patterns.

---

## 9. Directus Guides (Summary)

Summary of [Directus Docs → Guides](https://directus.io/docs/guides) for alignment with this UI design.

### Overview

- **Data Engine**: APIs, realtime, auth, automations (flows).  
- **Data Studio**: Web app for data — Explore, Editor, Insights, Files.  
- Use cases: Backend-as-a-Service, Headless CMS, internal tools, data/analytics.  
- [Getting Started → Overview](https://directus.io/docs/getting-started/overview)

### Connect & Auth

- Auth: **Authorization: Bearer &lt;token&gt;**, session cookies, or query param (avoid in production).  
- Token types: static (long-lived), standard/session (short-lived, refresh).  
- [Connect → Authentication](https://directus.io/docs/guides/connect/authentication)

### Content — Collection Explorer

- One page = one **collection**; browse, filter, search; can show related fields.  
- **Filtering**: custom filters, AND/OR groups, dynamic variables (`$CURRENT_USER`, `$CURRENT_ROLE`, `$NOW`, etc.).  
- **Layouts**: choose how to view the collection (table, cards, calendar, map, kanban); depends on data model.  
- **Batch edit**: select multiple items, edit fields in bulk.  
- **Bookmarks**: saved views (layout, visible fields, sort, filter) — Settings → Bookmarks.  
- [Content → Explore](https://directus.io/docs/guides/content/explore)

### Content — Item Editor

- Form for a single item; fields come from collection data model.  
- **Create**: “+” in header; **singletons** open item page directly.  
- **Duplicate**: “Save as Copy” in options.  
- **Archive**: header action (requires archive field).  
- **Revisions**: sidebar “Revisions” — compare, revert.  
- **Comments**: sidebar; @ to tag users.  
- **Shares**: sidebar “Shares” → New Share (name, password, role, dates, max uses); copy/send link.  
- [Content → Editor](https://directus.io/docs/guides/content/editor)

### Content — Layouts

- **Table**: default; resize columns, add/remove/sort columns, **drag-and-drop** to reorder columns; manual sort (drag items) if sort field configured.  
- **Cards**: image, title/subtitle template, card size; good for files/users.  
- **Calendar**: datetime field(s); start/end, display template.  
- **Map**: geospatial field; basemap, clustering.  
- **Kanban**: group by status field; **drag-and-drop** items between columns; add/edit/delete status panels.  
- [Content → Layouts](https://directus.io/docs/guides/content/layouts)

### Files

- **Files** module = folder tree + file list; create folders, upload.  
- **Upload**: drag from desktop, click to select, or “Import from URL”; multiple files; any file type.  
- [Files → Upload](https://directus.io/docs/guides/files/upload)

### Automate — Flows

- **Flows**: one trigger + operations + data chain.  
- Fields: name, status, icon, description, color; activity/log tracking.  
- **Logs**: per run; trigger payload/accountability, each operation options/payload.  
- [Automate → Flows](https://directus.io/docs/guides/automate/flows)

### Data Model — Collections

- **Collections** = database tables + Directus metadata (icon, display template, hidden, singleton, etc.).  
- **Create**: name (immutable), primary key type (auto-increment, UUID, manual string).  
- **Config**: content versioning, live preview, accountability (revisions + activity), **sort field** (enables manual drag sort in table), duplication settings, archive settings.  
- **System collections**: e.g. `directus_activity`, `directus_files`, `directus_flows`, `directus_users`, etc.  
- [Data Model → Collections](https://directus.io/docs/guides/data-model/collections)

### Alignment with this UI

| Directus concept      | This doc equivalent                          |
|-----------------------|----------------------------------------------|
| Collection Explorer   | §4.6 Collection list + filters + layouts     |
| Item Editor           | §4.6 Entry create/edit + Revisions, Comments |
| Bookmarks             | §4.12 Presets (saved views)                  |
| Layouts (table, card, calendar, map, kanban) | §5 Data table; consider card/calendar/map/kanban for tenant content |
| Shares                | §4.12 Shares (temporary links)               |
| Flows                 | §4.7 Workflows + §4.16 Webhooks / automation |
| Files + Upload        | §4.8 Media Library + drag-drop upload       |
| Data Model / Collections | §4.5 Content Model, §4.3 Library (Schema) |

---

## 10. Directus API Reference (Summary)

Summary of the [Directus API Reference](https://directus.io/docs/api) (v11.1.0+) for aligning CMS delivery APIs.

### Overview

- **RESTful API** — Integrated per project; **adapts as you change the project** (schema, permissions).
- **Auth** — [Access tokens, cookies, or sessions](https://directus.io/docs/guides/auth/tokens-cookies). Data is private by default; public role can expose data without auth.
- **Other interfaces** — **GraphQL** and [Directus SDK](https://directus.io/docs/guides/connect/sdk) (JavaScript/TypeScript).
- **Dynamic API** — REST endpoints and GraphQL schema are **generated from the connected database**. Input/output depend on your schema and permissions.

### Main API Areas (from docs)

| Area | Purpose |
|------|--------|
| Activity | List/retrieve activity actions. |
| Assets | Served/transformed assets. |
| Authentication | Login, logout, refresh, password request/reset, OAuth. |
| Collections | CRUD collection metadata. |
| Comments | Item comments. |
| Dashboards | Insights dashboards. |
| Extensions | Extension config. |
| Fields | Field config. |
| Files | Upload, download, file metadata. |
| Flows | Automation flows. |
| Folders | File folder structure. |
| **Items** | **Core content CRUD** per collection. |
| Metrics | Analytics. |
| Notifications | User notifications. |
| Operations | Flow operations. |
| Panels | Dashboard panels. |
| Permissions | Role permissions. |
| Policies | Access policies. |
| Presets | Bookmarks / saved views. |
| Relations | Relationship config. |
| Revisions | Item revision history. |
| Roles | Roles. |
| Schema | Schema snapshot. |
| Server | Server info. |
| Settings | Project settings. |
| Shares | Share links. |
| Translations | UI translations. |
| Users | User CRUD, register. |
| Utilities | Utils. |
| Versions | Content versions. |

### Authentication ([API → Authentication](https://directus.io/docs/api/authentication))

| Endpoint | Method | Purpose |
|----------|--------|--------|
| Login | `POST /auth/login` | Body: `email`, `password`; optional `mode` (json/cookie), `otp` (MFA). Returns `access_token`, `expires`, `refresh_token`. |
| Logout | `POST /auth/logout` | Body: `refresh_token` (optional if cookie). Invalidates session. |
| Refresh | `POST /auth/refresh` | Body: `refresh_token`, `mode`. Returns new access + refresh tokens. |
| Password request | `POST /auth/password/request` | Body: `email`; optional `reset_url`. |
| Password reset | `POST /auth/password/reset` | Body: `token`, `password`. |
| OAuth providers | `GET /auth/oauth` | List configured auth providers. |
| OAuth login | `GET /auth/oauth/{provider}` | Query: `redirect`. Starts OAuth flow. |

### Items ([API → Items](https://directus.io/docs/api/items))

Items = individual records in a collection. REST base: `/items/{collection}`.

| Operation | REST | Query / body |
|-----------|------|----------------|
| List | `GET /items/{collection}` | `fields`, `limit`, `offset`, `meta`, `sort` (CSV; `-` DESC, `?` random), `filter`, `search`, `backlink`. |
| Create one | `POST /items/{collection}` | Body: item object. |
| Create many | `POST /items/{collection}` | Body: `data` array. |
| Retrieve one | `GET /items/{collection}/{id}` | `fields`, `meta`, `version` (content version key). |
| Update one | `PATCH /items/{collection}/{id}` | Body: partial item. |
| Update many | `PATCH /items/{collection}` | Body: `data`, `keys`. |
| Delete one | `DELETE /items/{collection}/{id}` | — |
| Delete many | `DELETE /items/{collection}` | Body: array of IDs or `{ keys }` / `{ query }`. |
| Singleton read | `GET /items/{collection}/singleton` | `version`, `fields`, `meta`. |
| Singleton update | `PATCH /items/{collection}/singleton` | Body: partial item. |

Responses: `200` with `data` (object or array); `meta` may include `total_count`, `filter_count`. `401` Unauthorized, `404` Not Found.

### Alignment with CMS V2 §7 (Content Delivery & APIs)

- **REST and/or GraphQL** — Directus provides both; our CMS can mirror.
- **Auth (API keys, OAuth, JWT)** — Directus: tokens + OAuth; we have API keys + optional JWT.
- **Filtering, sort, pagination** — Directus: `filter`, `sort`, `limit`, `offset`, `search`; same pattern for our content APIs.
- **Draft vs published** — Directus: content versions + permissions; we use `status` and optional `version` query.
- **Rate limiting** — We have `api_rate_limits` in schema; Directus supports configurable limits.
