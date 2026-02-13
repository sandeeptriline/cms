# Settings Menu Structure - Development Story

**Date**: 2026-02-13  
**Status**: Planning  
**Reference**: Directus Settings Menu Structure

---

## Overview

Settings menu structure for Tenant Admin panel, matching Directus's hierarchical navigation. Provides access to configuration, management, and administrative features organized into logical sections.

---

## Settings Menu Items (13 Items)

### 1. Data Model
**Path**: `/dashboard/settings/data-model`  
**Purpose**: Manage content schemas and field definitions  
**Features**: Create/edit content types, define fields, configure relationships, validation rules

### 2. Flows
**Path**: `/dashboard/settings/flows`  
**Purpose**: Configure approval workflows and automation  
**Features**: Custom workflows, workflow steps, approvers, conditions, templates

### 3. User Roles
**Path**: `/dashboard/roles`  
**Purpose**: Manage roles and role assignments  
**Features**: List roles, create/edit roles, assign users, role hierarchy

### 4. Access Policies
**Path**: `/dashboard/settings/access-policies`  
**Purpose**: Fine-grained permission management  
**Features**: Custom policies, content type permissions, field-level permissions, API policies

### 5. Settings
**Path**: `/dashboard/settings`  
**Purpose**: General tenant configuration  
**Features**: Project details, API settings, media settings, localization, feature flags, usage limits

### 6. Appearance
**Path**: `/dashboard/settings/appearance`  
**Purpose**: Theme and branding configuration  
**Features**: Branding, theme selection, design tokens, component styling, theme management

### 7. Bookmarks
**Path**: `/dashboard/settings/bookmarks`  
**Purpose**: Save frequently accessed views and filters  
**Features**: Create bookmarks, save searches, organize by collection, share bookmarks

### 8. Translations
**Path**: `/dashboard/settings/translations`  
**Purpose**: Multi-language content management  
**Features**: Manage locales, add/remove languages, translation status, fallback rules

### 9. Marketplace
**Path**: `/dashboard/settings/marketplace`  
**Purpose**: Browse and install extensions, themes, schemas  
**Features**: Browse extensions, install themes/schemas/components, manage installed items

### 10. Extensions
**Path**: `/dashboard/settings/extensions`  
**Purpose**: Manage installed extensions and plugins  
**Features**: List extensions, enable/disable, configure, update, remove, logs

### 11. System Logs
**Path**: `/dashboard/settings/system-logs`  
**Purpose**: View system activity and audit trails  
**Features**: Activity logs, audit trail, API logs, error logs, searchable/filterable

### 12. Report Bug
**Path**: `/dashboard/settings/report-bug`  
**Purpose**: Submit bug reports and issues  
**Features**: Bug report form, attach screenshots/logs, categorize, track status

### 13. Request Feature
**Path**: `/dashboard/settings/request-feature`  
**Purpose**: Submit feature requests  
**Features**: Feature request form, describe use case, vote, track status, roadmap

---

## Menu Organization

**Primary Sidebar (Icon-only, 52px, Purple #6644FF)**:
- Content (Folder) → Dashboard/Content management
- File Library (Image) → Media management
- Explore (Search) → Search and discovery
- Insights (BarChart2) → Analytics and reports
- Documentation (FileText) → Help and docs
- User Directory (Users) → User management
- Extensions (Puzzle) → Extensions management
- Settings (Settings) → **Activates Settings submenu**

**Secondary Sidebar (Settings Submenu, 220px, Light Gray #F8F9FC)**:
```
Settings Section:
  • Data Model
  • Flows
  • User Roles
  • Access Policies
─────────────────
Configuration Section:
  • Settings (General)
  • Appearance
  • Bookmarks
  • Translations
  • AI
─────────────────
Extensions Section:
  • Marketplace
  • Extensions
─────────────────
System Section:
  • System Logs
  • Report Bug
  • Request Feature
─────────────────
Info:
  • CMS Platform 1.0.0
```

**Visual Structure**:
- Primary sidebar: Fixed 52px, purple background, icon-only with tooltips on hover
- Secondary sidebar: 220px, light gray background, full menu items with icons and text
- Active state: Purple background (#EDE9FE) with purple text (#6644FF)
- Dividers: Light gray horizontal lines (h-px bg-gray-200) between sections
- Auto-expand: Secondary sidebar automatically expands when Settings icon is active

---

## Access Control

- **Admin**: Full access to all 13 settings items
- **Editor**: Appearance, Bookmarks, Report Bug, Request Feature
- **Reviewer**: Flows (view), Bookmarks, Report Bug, Request Feature
- **Author**: Bookmarks, Report Bug, Request Feature
- **API Consumer**: No settings access (API-only users)

---

## Implementation Status

### ✅ Completed
- Primary icon sidebar structure (matches Directus)
- Secondary sidebar with Settings submenu
- Settings menu items (13 items with dividers)
- Data Model page implementation
- User Roles page implementation
- Menu auto-expand on Settings pages

### 🚧 In Progress
- Flows page
- Access Policies page
- Settings (General) page

### 📋 Pending
- Appearance, Bookmarks, Translations, AI
- Marketplace, Extensions
- System Logs, Report Bug, Request Feature

---

## Requirements Mapping

- **Data Model**: Section 4.1 - Content Modeling
- **Flows**: Section 5.2 - Workflow Management
- **User Roles**: Section 3.1 - User Roles, Section 3.2 - Access Control
- **Access Policies**: Section 3.2 - Access Control (Custom Roles, Field-Level Permissions)
- **Settings**: Section 2.5 - Tenant Configuration
- **Appearance**: Section 9.2 - Theme Library
- **Translations**: Section 8.1 - Localization
- **Marketplace**: Section 9.1 - Content Type Library, Section 9.2 - Theme Library
- **Extensions**: Section 10 - Integrations & Extensibility

---

**Last Updated**: 2026-02-13  
**Status**: Implementation In Progress
