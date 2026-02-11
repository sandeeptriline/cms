# UI Design Reference

**Last Updated**: 2026-02-11  
**Source**: [UI-DESIGN.md](../../../docs/UI-DESIGN.md)

---

## Overview

This document extracts key UI design information from the main UI Design specification for quick reference during admin panel development.

---

## Design Principles

| Principle | Description |
|-----------|-------------|
| **Clarity** | One primary action per screen; clear hierarchy |
| **Consistency** | Reuse patterns: list + filters + bulk actions |
| **Role-aware** | UI adapts to role (Super Admin, Admin, Editor, etc.) |
| **Layman-first** | Plain language, no technical jargon |
| **Reference** | Directus Admin Panel patterns |

---

## Technology Stack

### Frontend Framework
- **Next.js**: 16.x+ with App Router
- **React**: React 19

### UI Components
- **Radix UI**: Headless, accessible primitives
  - @radix-ui/react-dialog
  - @radix-ui/react-dropdown-menu
  - @radix-ui/react-popover
  - @radix-ui/react-select
  - @radix-ui/react-tabs
  - @radix-ui/react-tooltip
  - @radix-ui/react-checkbox
  - @radix-ui/react-switch

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **CSS Variables**: For theming (light/dark mode)

### Additional Libraries
- **Lucide React**: Icons
- **React Hook Form**: Form handling
- **Zod**: Validation
- **TanStack Table**: Data tables
- **Tiptap**: Rich text editor

---

## Application Structure

### Entry Points

| Screen | Purpose |
|--------|---------|
| **Platform login** | Super Admin login |
| **Tenant login** | Tenant admin/login |
| **Tenant onboarding** | First-time setup wizard |

### Shell Layout (Post-login)

- **Top bar**: Logo, tenant switcher, global search, notifications, user menu
- **Sidebar**: Module navigation (collapsible)
  - Tenant: "Dashboard", "Pages", "Blocks", "Media", "Menu", "Site settings"
  - Advanced: "Users", "Content model", "API" under "Settings"
- **Main area**: Breadcrumb + page title + content
- **Optional right panel**: Field help, version history, comments

---

## Layman-Friendly UX

### Plain Language
- Use "Pages" instead of "Content types"
- Use "Blocks" instead of "Collections"
- Use "Add block" instead of "Create entry"

### Guided Flows
- First-time setup = step wizard
- Empty states offer clear next actions
- Templates first when creating content

### Visual Page Building
- Drag-and-drop page builder
- Canvas + block palette
- Inline editing

### Progressive Disclosure
- Simple mode by default
- Advanced features under "Settings → Advanced"

---

## Platform Admin UI (Super Admin)

### Dashboard
- Tenant count and status breakdown
- Provisioning queue
- Usage summary
- Quick actions

### Tenant Management
- Tenant list with filters
- Create/Edit tenant forms
- Tenant detail view
- Status management (activate/suspend)

---

## Tenant Admin UI

### Dashboard
- Content statistics
- Recent activity
- Quick actions
- Status overview

### Pages
- Page list with filters
- Page editor (visual builder)
- Template selection
- Preview mode

### Blocks (Library)
- Block library browser
- Block editor
- Reusable components

### Media
- Media library (grid/list view)
- Upload interface
- Folder organization
- Media preview

### Menu
- Menu builder
- Drag-and-drop navigation
- Menu items management

### Site Settings
- General settings
- Theme configuration
- SEO settings
- Localization

---

## Component Patterns

### List Views
- Table with filters
- Search functionality
- Bulk actions
- Pagination
- Sorting

### Form Views
- Section-based layout
- Field validation
- Inline help
- Save/Cancel actions

### Detail Views
- Tabs for different sections
- Action buttons
- Status indicators
- Related items

---

## Role-Based UI

### Super Admin
- Platform-level features
- Tenant management
- System settings

### Tenant Admin
- Full tenant access
- User management
- Settings configuration

### Editor
- Content creation/editing
- Media management
- Limited settings

### Author
- Content creation only
- No settings access

---

## Design Reference

- **Primary Reference**: [Directus Admin Panel](https://directus.io/)
- **Sandbox**: [Directus Sandbox](https://sandbox.directus.io/admin/getting-started/get-started)
- **UI Framework**: [Radix UI](https://www.radix-ui.com/)

---

## Full Documentation

For complete UI design specification, see:
**[UI-DESIGN.md](../../../docs/UI-DESIGN.md)**

---

**See Also**:
- [Requirements Reference](../reference/README.md)
- [Development Phases](../development/ADMIN_PANEL_PHASES.md)
