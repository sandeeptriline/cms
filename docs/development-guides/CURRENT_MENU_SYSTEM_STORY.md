# Current CMS Menu System - Complete Story

## Overview

Our CMS uses a **three-layer navigation architecture** (inspired by Directus):
1. **Primary Sidebar** (Icon-only, 52px width) - Fixed left, role-based icons
2. **Secondary Sidebar** (Full menu, 220px width) - Fixed left, context-specific content
3. **Main Content Area** - Dynamic content based on route

**Key Difference from Directus**: Our system has **dual user contexts**:
- **Super Admin** (Platform-level): Uses `/cp` routes
- **Tenant Users** (Tenant-level): Uses `/dashboard` routes

---

## Architecture

### Layout Structure

```
┌─────────┬──────────────┬─────────────────────────────┐
│ Primary │  Secondary   │      Main Content           │
│ Sidebar │   Sidebar    │      + Header               │
│ (52px)  │   (220px)    │                             │
│         │              │                             │
│ Icons   │  Submenu     │  Page Content               │
│ Only    │  Items       │                             │
└─────────┴──────────────┴─────────────────────────────┘
```

**Total left margin when both sidebars visible: 272px (52 + 220)**

---

## 1. Primary Sidebar (Icon Menu)

### Location
- **File**: `frontend/components/layout/sidebar.tsx`
- **Width**: 52px (fixed)
- **Position**: Fixed left (z-index: 50)
- **Background**: Purple (#6644FF)

### Dual Context System

Our system supports two distinct user types with different menu structures:

#### A. Super Admin (Platform Admin)
- **Base Path**: `/cp`
- **Icon Items**: Dashboard, Tenants, Platform Users, Settings
- **Data Source**: `superAdminIconItems` from `menu-items.ts`

```typescript
export const superAdminIconItems: IconSidebarItem[] = [
  { icon: LayoutDashboard, href: '/cp', title: 'Dashboard' },
  { icon: Building2, href: '/cp/tenants', title: 'Tenants' },
  { icon: Users, href: '/cp/platform-users', title: 'Platform Users' },
  { icon: Settings, href: '/cp/settings', title: 'Settings' },
]
```

#### B. Tenant Users
- **Base Path**: `/dashboard`
- **Icon Items**: Content, File Library, Explore, Insights, Documentation, User Directory, Extensions, Settings
- **Data Source**: `getTenantUserIconItems(userRoles)` - **Dynamic based on user roles**
- **Role-Based Filtering**: Only shows icons user has access to

```typescript
export function getTenantUserIconItems(userRoles?: string[]): IconSidebarItem[] {
  const allItems: IconSidebarItem[] = [
    { icon: Folder, href: '/dashboard', title: 'Content', requiredRoles: [ROLES.ADMIN, ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR] },
    { icon: Image, href: '/dashboard/files', title: 'File Library', requiredRoles: [ROLES.ADMIN, ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR] },
    { icon: Search, href: '/dashboard/explore', title: 'Explore', requiredRoles: [ROLES.ADMIN, ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR] },
    { icon: BarChart2, href: '/dashboard/insights', title: 'Insights', requiredRoles: [ROLES.ADMIN, ROLES.EDITOR, ROLES.REVIEWER] },
    { icon: FileText, href: '/dashboard/documentation', title: 'Documentation', requiredRoles: [ROLES.ADMIN, ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR] },
    { icon: Users, href: '/dashboard/users', title: 'User Directory', requiredRoles: [ROLES.ADMIN] },
    { icon: Puzzle, href: '/dashboard/extensions', title: 'Extensions', requiredRoles: [ROLES.ADMIN] },
    { icon: Settings, href: '/dashboard/settings', title: 'Settings', requiredRoles: [ROLES.ADMIN] },
  ]
  
  // Filter by user roles
  return allItems.filter((item) => {
    if (!item.requiredRoles || item.requiredRoles.length === 0) return true
    return item.requiredRoles.some((requiredRole) =>
      userRoles.some((userRole) => userRole.toLowerCase() === requiredRole.toLowerCase())
    )
  })
}
```

### How It Works

1. **User Type Detection**:
   ```typescript
   const isPlatformAdmin = isSuperAdmin(user?.roles) || pathname?.startsWith('/cp')
   ```
   - Checks if user has Super Admin role OR is on `/cp` routes
   - Determines which icon set to show

2. **Active State Detection**:
   ```typescript
   const isActive = pathname?.startsWith(item.href) || false
   ```
   - Simple check: Does current URL start with the icon's href?
   - Example: `/dashboard/settings/data-model` → Settings icon is active
   - Example: `/cp/tenants/abc123` → Tenants icon is active

3. **Click Behavior**:
   ```typescript
   onClick={() => {
     router.push(item.href)
     // Auto-expand sidebar when clicking primary icon
     if (isCollapsed) {
       onToggle()
     }
   }}
   ```
   - Navigates to the base path (e.g., `/dashboard`, `/cp/tenants`)
   - Uses Next.js Router's `push()` function
   - Auto-expands sidebar if collapsed

4. **Visual Feedback**:
   - Active: `bg-white/20 text-white`
   - Inactive: `text-white/70 hover:bg-white/10 hover:text-white`

5. **Tooltips**:
   - Show on hover (right side)
   - Display the `title` property

### Bottom Navigation
- **Notifications** (Bell icon) - Always visible
- **User Profile** (User icon with initials) - Dropdown menu with:
  - Profile/Settings link
  - Logout option
  - User info display

---

## 2. Secondary Sidebar (Submenu)

### Location
- **File**: `frontend/components/layout/sidebar.tsx` (embedded in Sidebar component)
- **Width**: 220px (fixed)
- **Position**: Fixed left at 52px (z-index: 40)
- **Background**: Light gray (#F8F9FC)

### Key Concept: **Hybrid Approach**

Our implementation uses a **hybrid approach**:

1. **Props-Based** (Like Directus): Page components can pass `secondarySidebarItems` via `DashboardLayout`
2. **Fallback Logic**: If no items provided, sidebar uses internal logic to determine content

### Current Implementation

#### A. When `secondarySidebarItems` Prop is Provided

```typescript
// Page component passes items
<DashboardLayout 
  secondarySidebarItems={collections}  // ← From page component
>
```

**Secondary Sidebar Shows**:
- Items from the prop
- Supports: `id`, `name`, `path`, `href`, `icon`, `color`, `itemCount`, `hasChildren`, `children`, `indent`, `divider`

**Active State**:
```typescript
const isActive = pathname?.includes(item.id) || 
               (itemHref && pathname?.startsWith(itemHref)) ||
               false
```

**Click Behavior**:
```typescript
if (itemHref) {
  router.push(itemHref)
} else if (item.id) {
  router.push(`${basePath}/${item.id}`)
}
```

#### B. Fallback: Settings Page Auto-Detection

**If no `secondarySidebarItems` provided AND on Settings page**:

```typescript
// Fallback: Show settings submenu if on settings page
(pathname?.startsWith('/dashboard/settings') || pathname?.startsWith('/cp/settings')) && !isPlatformAdmin
  ? settingsSubmenuItems.filter(/* by roles */)
  : navigation  // Show main navigation items
```

**Secondary Sidebar Shows**:
- Settings submenu items (13 items with dividers)
- Filtered by user roles
- Only for tenant users (not Super Admin)

**Settings Submenu Structure**:
```typescript
export const settingsSubmenuItems: SettingsMenuItem[] = [
  // Settings Section
  { id: 'data_model', name: 'Data Model', path: '/dashboard/settings/data-model', icon: Database, section: 'settings' },
  { id: 'flows', name: 'Flows', path: '/dashboard/settings/flows', icon: GitBranch, section: 'settings' },
  { id: 'user_roles', name: 'User Roles', path: '/dashboard/settings/user-roles', icon: Shield, section: 'settings' },
  { id: 'access_policies', name: 'Access Policies', path: '/dashboard/settings/access-policies', icon: Lock, section: 'settings' },
  { id: 'divider1', divider: true },
  // Configuration Section
  { id: 'settings_main', name: 'Settings', path: '/dashboard/settings', icon: Settings, section: 'configuration' },
  { id: 'appearance', name: 'Appearance', path: '/dashboard/settings/appearance', icon: Palette, section: 'configuration' },
  // ... more items
]
```

#### C. Fallback: Main Navigation Items

**If no `secondarySidebarItems` provided AND NOT on Settings page**:

```typescript
// Show main navigation menu items
navigation.map((item) => {
  // Render as Link components
})
```

**Secondary Sidebar Shows**:
- Main navigation items (from `superAdminMenuItems` or `getTenantUserMenuItems`)
- Based on user type and roles

### Secondary Sidebar Features

1. **Icon Support**:
   - String names (e.g., `"Database"`) → Mapped to Lucide React icons
   - React components → Used directly
   - Fallback to `Folder` icon if not found

2. **Expandable Items** (Planned):
   - Items with `hasChildren: true` can expand
   - Currently navigates (expand functionality needs state management)

3. **Indentation**:
   - Items with `indent: true` are indented (ml-4)
   - Used for nested/hierarchical items

4. **Dividers**:
   ```typescript
   if (item.divider) {
     return <div className="h-px bg-gray-200 my-2 mx-2" />
   }
   ```
   - Visual separators between sections

5. **Item Count Badges**:
   - Shows `itemCount` if > 0
   - Example: "Form Submissions (5)"

6. **Search** (UI Present, Not Yet Functional):
   - Global search input in secondary sidebar header
   - Placeholder: "Global Search"
   - Keyboard shortcut hint: "Ctrl+K"

---

## 3. Relationship Between Primary and Secondary Sidebars

### The Flow

#### Scenario 1: Tenant User on Content Page

1. **User clicks "Content" icon** (Primary Sidebar)
   ```
   URL: /dashboard → /dashboard (or stays same)
   Route: Matches /dashboard
   Component: DashboardPage renders
   Secondary Sidebar: Shows main navigation (fallback, no secondarySidebarItems passed)
   ```

2. **User clicks "Settings" icon** (Primary Sidebar)
   ```
   URL: /dashboard → /dashboard/settings
   Route: Matches /dashboard/settings/*
   Component: SettingsPage renders
   Secondary Sidebar: Auto-detects Settings page → Shows settingsSubmenuItems (fallback)
   ```

#### Scenario 2: Super Admin on Tenants Page

1. **User clicks "Tenants" icon** (Primary Sidebar)
   ```
   URL: /cp → /cp/tenants
   Route: Matches /cp/tenants
   Component: CpTenantsPage renders
   Secondary Sidebar: Shows main navigation (fallback, no secondarySidebarItems passed)
   ```

2. **User clicks specific tenant** (Main Content)
   ```
   URL: /cp/tenants → /cp/tenants/{tenantId}
   Route: Matches /cp/tenants/[id]
   Component: CpTenantDetailPage renders
   Secondary Sidebar: Still shows main navigation (no secondarySidebarItems passed)
   ```

### Current State vs. Intended Design

**Current State**:
- Most page components **do NOT pass `secondarySidebarItems`**
- Sidebar relies on fallback logic:
  - Settings pages → Shows settings submenu
  - Other pages → Shows main navigation items

**Intended Design** (Like Directus):
- Each page component should pass its own `secondarySidebarItems`
- Content page → Pass content types/collections
- Settings page → Pass settings menu (already working via fallback)
- Files page → Pass file folders
- etc.

**Gap**: Content page should pass content types, but currently doesn't.

---

## 4. Route Mapping

### Route Structure (Next.js App Router)

#### Super Admin Routes (`/cp`)

```
/cp                          → CpDashboardPage
/cp/tenants                  → CpTenantsPage
/cp/tenants/[id]             → CpTenantDetailPage
/cp/tenants/[id]/edit        → CpTenantEditPage
/cp/tenants/new              → CpTenantNewPage
/cp/platform-users           → CpPlatformUsersPage
/cp/platform-users/[id]      → CpPlatformUserDetailPage
/cp/settings                 → CpSettingsPage
```

#### Tenant User Routes (`/dashboard`)

```
/dashboard                   → DashboardPage (Content Types)
/dashboard/users             → TenantUsersPage
/dashboard/roles             → TenantRolesPage
/dashboard/settings          → SettingsPage (default)
/dashboard/settings/data-model → DataModelPage
/dashboard/settings/flows    → (Not yet implemented)
/dashboard/settings/user-roles → (Not yet implemented)
/dashboard/files             → (Not yet implemented)
/dashboard/explore           → (Not yet implemented)
/dashboard/insights         → (Not yet implemented)
/dashboard/documentation     → (Not yet implemented)
/dashboard/extensions        → (Not yet implemented)
```

### URL Patterns

| Primary Icon | Base Path | Secondary Item Click | Result URL | Page Component |
|-------------|-----------|---------------------|------------|----------------|
| Content | `/dashboard` | (Main nav item) | `/dashboard/users` | `TenantUsersPage` |
| Settings | `/dashboard/settings` | "Data Model" | `/dashboard/settings/data-model` | `DataModelPage` |
| Settings | `/dashboard/settings` | "User Roles" | `/dashboard/settings/user-roles` | (Not implemented) |
| Tenants | `/cp/tenants` | (Tenant card) | `/cp/tenants/{id}` | `CpTenantDetailPage` |

### Route Parameters

- **Tenant Detail**: Uses dynamic route `[id]`
  - `/cp/tenants/abc123` → Shows tenant with ID `abc123`
  - `/cp/tenants/abc123/edit` → Edit page for tenant

- **Settings**: Uses nested routes
  - `/dashboard/settings` → Default settings view
  - `/dashboard/settings/data-model` → Data Model view
  - `/dashboard/settings/user-roles` → User Roles view

---

## 5. Active State Detection

### Primary Sidebar Icons

```typescript
const isActive = pathname?.startsWith(item.href) || false
```

**Examples**:
- Current URL: `/dashboard/settings/data-model`
- Content icon (`/dashboard`): ✅ Active (starts with `/dashboard`)
- Settings icon (`/dashboard/settings`): ✅ Active (starts with `/dashboard/settings`)

**Note**: Multiple icons can be active if one path is a prefix of another. This is expected behavior.

### Secondary Sidebar Items

**When using `secondarySidebarItems` prop**:
```typescript
const isActive = pathname?.includes(item.id) || 
               (itemHref && pathname?.startsWith(itemHref)) ||
               false
```

**Examples**:
- Current URL: `/dashboard/settings/data-model`
- Item ID: `"data_model"` → ✅ Active (URL includes "data_model")
- Item path: `/dashboard/settings/data-model` → ✅ Active (URL starts with path)

**When using fallback (Settings submenu)**:
```typescript
const isActive = pathname === item.path || pathname?.startsWith(item.path + '/')
```

**Examples**:
- Current URL: `/dashboard/settings/data-model`
- Item path: `/dashboard/settings/data-model` → ✅ Active (exact match)
- Item path: `/dashboard/settings` → ❌ Not active (not exact match, and URL has more)

---

## 6. Navigation Flow Examples

### Example 1: Tenant Admin Navigating to Data Model

1. **User clicks "Settings" icon** (Primary Sidebar)
   ```
   URL: /dashboard → /dashboard/settings
   Route: Matches /dashboard/settings/*
   Component: SettingsPage renders (or redirects to data-model)
   Secondary Sidebar: Auto-detects Settings → Shows settingsSubmenuItems
   Primary Icon: Settings icon becomes active
   ```

2. **User clicks "Data Model"** (Secondary Sidebar)
   ```
   URL: /dashboard/settings → /dashboard/settings/data-model
   Route: Matches /dashboard/settings/data-model
   Component: DataModelPage renders
   Secondary Sidebar: "Data Model" becomes active
   Main Content: Shows content types management
   ```

### Example 2: Super Admin Navigating to Tenant Detail

1. **User clicks "Tenants" icon** (Primary Sidebar)
   ```
   URL: /cp → /cp/tenants
   Route: Matches /cp/tenants
   Component: CpTenantsPage renders
   Secondary Sidebar: Shows main navigation (fallback)
   Primary Icon: Tenants icon becomes active
   ```

2. **User clicks tenant card** (Main Content)
   ```
   URL: /cp/tenants → /cp/tenants/{tenantId}
   Route: Matches /cp/tenants/[id]
   Component: CpTenantDetailPage renders
   Secondary Sidebar: Still shows main navigation
   Main Content: Shows tenant detail with tabs (Overview, Users, Roles & Permissions)
   ```

### Example 3: Role-Based Menu Filtering

1. **Editor user logs in**
   ```
   User Roles: ["Editor"]
   Icon Items: Filtered by requiredRoles
   Result: Only "Content" icon shown (Editor has access)
   Settings icon: Hidden (Editor doesn't have ADMIN role)
   ```

2. **Admin user logs in**
   ```
   User Roles: ["Admin"]
   Icon Items: Filtered by requiredRoles
   Result: All icons shown (Admin has access to all)
   ```

---

## 7. Header (Top Menu)

### Location
- **File**: `frontend/components/layout/header.tsx`
- **Height**: Variable (based on content)
- **Position**: Sticky top (within main content area)

### Props (Passed from Page Components)

```typescript
<DashboardLayout 
  title="Data Model"              // Main title
  subtitle="Settings"             // Subtitle (optional)
  icon={<Database />}             // Icon component
  itemCount={5}                   // Item count badge
  showActions={true}              // Show action buttons
/>
```

### Dynamic Content

- **Title/Subtitle**: Set by each page component
- **Icon**: React component passed as prop
- **Item Count**: Shows number of items in current view
- **Actions**: Context-specific buttons (handled by Header component)

---

## 8. Key Design Patterns

### Pattern 1: Dual User Context

**Super Admin** (`/cp`):
- Platform-level management
- Manages tenants, platform users
- Different icon set and menu structure

**Tenant Users** (`/dashboard`):
- Tenant-level management
- Manages tenant-specific content, users, settings
- Role-based access control

### Pattern 2: Role-Based Menu Filtering

```typescript
// Icons filtered by user roles
const filteredIcons = allIcons.filter(item => {
  if (!item.requiredRoles) return true
  return item.requiredRoles.some(role => 
    userRoles.some(userRole => userRole.toLowerCase() === role.toLowerCase())
  )
})
```

- Icons only show if user has required role
- Menu items filtered the same way
- Permissions can be added in future

### Pattern 3: Hybrid Secondary Sidebar

**Two Approaches**:
1. **Props-Based** (Preferred): Page components pass `secondarySidebarItems`
2. **Fallback Logic**: Sidebar auto-detects and shows appropriate content

**Current State**: Mostly using fallback (Settings page detection)

### Pattern 4: Simple Active State Detection

**Primary Icons**: `pathname.startsWith(href)`
**Secondary Items**: `pathname.includes(id)` OR `pathname.startsWith(path)`

No complex logic, just string matching.

---

## 9. Data Flow Diagram

```
User Action
    │
    ├─ Click Primary Icon
    │   │
    │   ├─ Super Admin: Navigate to /cp/{section}
    │   │   │
    │   │   └─ React Router → Cp{Section}Page
    │   │       │
    │   │       └─ (Currently) No secondarySidebarItems passed
    │   │           │
    │   │           └─ Secondary Sidebar: Shows main navigation (fallback)
    │   │
    │   └─ Tenant User: Navigate to /dashboard/{section}
    │       │
    │       └─ React Router → {Section}Page
    │           │
    │           ├─ Settings Page?
    │           │   │
    │           │   └─ Secondary Sidebar: Auto-shows settingsSubmenuItems
    │           │
    │           └─ Other Page?
    │               │
    │               └─ Secondary Sidebar: Shows main navigation (fallback)
    │
    └─ Click Secondary Item
        │
        ├─ Navigate to /dashboard/settings/data-model
        │   │
        │   └─ React Router → DataModelPage
        │       │
        │       └─ Secondary Sidebar: "Data Model" becomes active
        │
        └─ Navigate to /cp/tenants/{id}
            │
            └─ React Router → CpTenantDetailPage
                │
                └─ Secondary Sidebar: Still shows main navigation
```

---

## 10. Current Implementation Status

### ✅ Implemented

- [x] Primary sidebar (icon-only, 52px)
- [x] Secondary sidebar (full menu, 220px)
- [x] Dual user context (Super Admin vs Tenant Users)
- [x] Role-based icon filtering
- [x] Active state detection (simple string matching)
- [x] Settings page auto-detection (fallback)
- [x] Settings submenu (13 items with dividers)
- [x] Main navigation fallback
- [x] Tooltips on primary icons
- [x] User profile dropdown
- [x] Auto-expand on icon click
- [x] Support for `secondarySidebarItems` prop

### ⚠️ Partially Implemented

- [ ] **Content Types in Secondary Sidebar**: Content page should pass content types, but currently doesn't
- [ ] **Expandable Items**: UI supports it, but state management not implemented
- [ ] **Search Functionality**: UI present, but not functional
- [ ] **File Folders**: Files page not implemented yet
- [ ] **Other Secondary Sidebar Content**: Most pages don't pass `secondarySidebarItems`

### 🔄 Planned / Not Yet Implemented

- [ ] Content page passing content types to secondary sidebar
- [ ] Files page with file folders in secondary sidebar
- [ ] Explore page with search results
- [ ] Insights page with dashboard items
- [ ] Expandable items with state management
- [ ] Global search functionality
- [ ] Breadcrumb navigation in header

---

## 11. Differences from Directus

### What's Different

1. **Dual User Context**: We have Super Admin and Tenant Users with different routes
2. **Role-Based Filtering**: Icons and menu items filtered by user roles
3. **Fallback Logic**: Secondary sidebar has fallback when no props provided
4. **Next.js App Router**: Uses Next.js routing instead of React Router
5. **TypeScript**: Fully typed implementation

### What's Similar

1. **Three-Layer Architecture**: Primary + Secondary + Main Content
2. **Props-Based Secondary Sidebar**: Can pass `secondarySidebarItems` from page components
3. **Simple Active States**: String matching for active detection
4. **Visual Design**: Matches Directus styling (purple primary, gray secondary)
5. **Icon-Only Primary**: Same 52px icon-only sidebar

---

## 12. Next Steps to Complete Implementation

### Priority 1: Content Page Secondary Sidebar

**Current**: Content page shows main navigation in secondary sidebar
**Should**: Content page should pass content types/collections

```typescript
// frontend/app/dashboard/page.tsx
<DashboardLayout 
  secondarySidebarItems={contentTypes.map(ct => ({
    id: ct.id,
    name: ct.name,
    path: `/dashboard/content/${ct.collection}`,
    icon: ct.icon || 'Folder',
    color: '#6644FF',
    itemCount: ct.itemCount || 0,
  }))}
>
```

### Priority 2: Other Pages

- **Files Page**: Pass file folders and navigation items
- **Users Page**: Pass user roles/filters (if needed)
- **Explore Page**: Pass search categories
- **Insights Page**: Pass dashboard items

### Priority 3: Enhancements

- **Expandable Items**: Implement state management for expand/collapse
- **Global Search**: Make search functional
- **Breadcrumbs**: Add breadcrumb navigation in header
- **Keyboard Shortcuts**: Implement Ctrl+K for search

---

## Summary

**Our current menu system**:

1. **Architecture**: Three-layer (Primary + Secondary + Main Content) ✅
2. **Dual Context**: Super Admin (`/cp`) and Tenant Users (`/dashboard`) ✅
3. **Role-Based**: Icons and items filtered by user roles ✅
4. **Active States**: Simple string matching ✅
5. **Secondary Sidebar**: Hybrid approach (props + fallback) ⚠️
6. **Settings Integration**: Auto-detects and shows settings submenu ✅
7. **Content Integration**: **Not yet implemented** - Content page should pass content types ❌

**Key Gap**: Most page components don't pass `secondarySidebarItems`, relying on fallback logic. To match Directus behavior, each page should control its secondary sidebar content.
