# Directus Menu System - Complete Story

## Overview

Directus uses a **three-layer navigation architecture**:
1. **Primary Sidebar** (Icon-only, 52px width) - Fixed left
2. **Secondary Sidebar** (Full menu, 220px width) - Fixed left, shows context-specific content
3. **Main Content Area** - Dynamic content based on route

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
- **File**: `components/layout/Sidebar.jsx`
- **Width**: 52px (fixed)
- **Position**: Fixed left (z-index: 50)
- **Background**: Purple (#6644FF)

### Structure

```javascript
// Data source: data/mock.js -> sidebarNavItems
const sidebarNavItems = [
  { id: "content", icon: "Folder", label: "Content", path: "/content" },
  { id: "files", icon: "Image", label: "File Library", path: "/files" },
  { id: "explore", icon: "Search", label: "Explore", path: "/explore" },
  { id: "insights", icon: "BarChart2", label: "Insights", path: "/insights" },
  { id: "documentation", icon: "FileText", label: "Documentation", path: "/documentation" },
  { id: "users", icon: "Users", label: "User Directory", path: "/users" },
  { id: "extensions", icon: "Puzzle", label: "Extensions", path: "/extensions" },
  { id: "settings", icon: "Settings", label: "Settings", path: "/settings" }
];
```

### How It Works

1. **Active State Detection**:
   ```javascript
   const isActive = (path) => location.pathname.startsWith(path);
   ```
   - Simple check: Does current URL start with the icon's path?
   - Example: `/content/places` → Content icon is active
   - Example: `/settings/data-model` → Settings icon is active

2. **Click Behavior**:
   ```javascript
   onClick={() => navigate(item.path)}
   ```
   - Navigates to the base path (e.g., `/content`, `/settings`)
   - Uses React Router's `navigate()` function
   - URL changes immediately

3. **Visual Feedback**:
   - Active: `bg-white/20 text-white`
   - Inactive: `text-white/70 hover:bg-white/10`

4. **Tooltips**:
   - Show on hover (right side)
   - Display the `label` property

### Bottom Navigation
- Notifications (Bell icon)
- Profile (User icon)
- Same behavior as main icons

---

## 2. Secondary Sidebar (Submenu)

### Location
- **File**: `components/layout/SecondarySidebar.jsx`
- **Width**: 220px (fixed)
- **Position**: Fixed left at 52px (z-index: 40)
- **Background**: Light gray (#F8F9FC)

### Key Concept: **Content is Controlled by Page Components**

Each page component decides what to show in the secondary sidebar by passing `secondarySidebarItems` prop to `MainLayout`.

### Structure

```javascript
// MainLayout receives secondarySidebarItems from page component
<MainLayout
  secondarySidebarItems={collections}  // ← Passed from ContentPage
  showSecondarySidebar={true}
>
  {/* Page content */}
</MainLayout>
```

### How Different Pages Control Secondary Sidebar

#### A. Content Page (`/content`)
```javascript
// ContentPage.jsx
return (
  <MainLayout
    secondarySidebarItems={collections}  // ← Shows content collections
    // ...
  >
```

**Secondary Sidebar Shows**:
- List of content collections (Places, Pages, Form Submissions, etc.)
- Each collection has: `id`, `name`, `icon`, `color`, `itemCount`

**Active State**:
```javascript
const active = location.pathname.includes(item.id);
```
- Checks if URL includes the collection ID
- Example: `/content/places` → "Places" is active

**Click Behavior**:
```javascript
navigate(item.path || `/content/${item.id}`)
```
- Navigates to `/content/{collectionId}`
- URL changes to show specific collection

#### B. Settings Page (`/settings`)
```javascript
// SettingsPage.jsx
return (
  <MainLayout
    secondarySidebarItems={settingsNavItems}  // ← Shows settings menu
    // ...
  >
```

**Secondary Sidebar Shows**:
- Settings submenu items (Data Model, Flows, User Roles, etc.)
- Includes dividers for visual grouping
- 13 items total with sections

**Active State**:
- Same pattern: `location.pathname.includes(item.id)`
- Example: `/settings/data-model` → "Data Model" is active

#### C. Files Page (`/files`)
```javascript
// FilesPage.jsx
const sidebarItems = [
  { id: 'file_library', name: 'File Library', icon: 'Image', hasChildren: true },
  ...fileFolders.map(f => ({ ...f, indent: true })),
  { id: 'divider1', divider: true },
  ...fileNavItems.map(f => ({ ...f, icon: f.id === 'recent_files' ? 'Clock' : 'File' }))
];

return (
  <MainLayout
    secondarySidebarItems={sidebarItems}  // ← Shows file folders
    // ...
  >
```

**Secondary Sidebar Shows**:
- File Library (expandable)
- Folders (Public, Private, Uploads, System)
- Navigation items (All Files, My Files, Recent Files)

#### D. Other Pages
- **Users Page**: Shows user roles/filters
- **Insights Page**: Shows dashboard items
- **Documentation Page**: Empty sidebar (`secondarySidebarItems={[]}`)

### Secondary Sidebar Features

1. **Search Functionality**:
   ```javascript
   const filteredItems = items.filter(item =>
     item.name?.toLowerCase().includes(searchQuery.toLowerCase())
   );
   ```
   - Filters items by name as you type
   - Real-time filtering

2. **Expandable Items**:
   ```javascript
   const hasChildren = item.hasChildren;
   const isExpanded = expandedItems[item.id];
   
   if (hasChildren) {
     toggleExpand(item.id);  // Toggle expand/collapse
   } else {
     navigate(item.path);    // Navigate if no children
   }
   ```
   - Items with `hasChildren: true` can expand
   - Shows children when expanded
   - Uses local state to track expanded items

3. **Indentation**:
   - Items with `indent: true` are indented (ml-4)
   - Used for nested/hierarchical items

4. **Dividers**:
   ```javascript
   if (item.divider) {
     return <div className="h-px bg-gray-200 my-2 mx-2" />;
   }
   ```
   - Visual separators between sections
   - Rendered as horizontal lines

5. **Item Count Badges**:
   - Shows `itemCount` if > 0
   - Example: "Form Submissions (5)"

---

## 3. Relationship Between Primary and Secondary Sidebars

### The Flow

1. **User clicks Primary Icon** (e.g., Content icon)
   - URL changes to `/content`
   - React Router matches route → Renders `ContentPage` component
   - `ContentPage` passes `collections` to `MainLayout` as `secondarySidebarItems`
   - Secondary sidebar displays collections

2. **User clicks Secondary Sidebar Item** (e.g., "Places")
   - URL changes to `/content/places`
   - React Router matches route → Still renders `ContentPage` (with `collectionId` param)
   - Secondary sidebar item "Places" becomes active (URL includes "places")
   - Main content shows Places collection data

3. **User clicks Different Primary Icon** (e.g., Settings)
   - URL changes to `/settings`
   - React Router matches route → Renders `SettingsPage` component
   - `SettingsPage` passes `settingsNavItems` to `MainLayout`
   - Secondary sidebar **switches content** to show settings menu
   - Previous content (collections) is replaced

### Key Insight

**The secondary sidebar content is NOT determined by the primary sidebar directly.**
**It's determined by which PAGE COMPONENT is currently rendered.**

- `/content` → `ContentPage` → Shows collections
- `/settings` → `SettingsPage` → Shows settings menu
- `/files` → `FilesPage` → Shows file folders

---

## 4. Route Mapping

### Route Configuration (`App.js`)

```javascript
<Routes>
  {/* Content Routes */}
  <Route path="/content/:collectionId?" element={<ContentPage />} />
  <Route path="/content" element={<ContentPage />} />
  
  {/* Settings Routes */}
  <Route path="/settings/*" element={<SettingsPage />} />
  
  {/* Files Routes */}
  <Route path="/files/*" element={<FilesPage />} />
  
  {/* Other Routes */}
  <Route path="/users/*" element={<UsersPage />} />
  <Route path="/insights/*" element={<InsightsPage />} />
  <Route path="/explore/*" element={<ContentPage />} />
  <Route path="/extensions/*" element={<SettingsPage />} />
  <Route path="/documentation/*" element={<MainLayout>...</MainLayout>} />
</Routes>
```

### URL Patterns

| Primary Icon | Base Path | Secondary Item Click | Result URL | Page Component |
|-------------|-----------|---------------------|------------|----------------|
| Content | `/content` | "Places" | `/content/places` | `ContentPage` |
| Content | `/content` | "Pages" | `/content/pages` | `ContentPage` |
| Settings | `/settings` | "Data Model" | `/settings/data-model` | `SettingsPage` |
| Settings | `/settings` | "User Roles" | `/settings/user-roles` | `SettingsPage` |
| Files | `/files` | "Public" | `/files/public` | `FilesPage` |

### Route Parameters

- **Content**: Uses optional param `:collectionId?`
  - `/content` → Shows default collection
  - `/content/places` → Shows Places collection

- **Settings**: Uses wildcard `/*`
  - `/settings` → Shows default settings view
  - `/settings/data-model` → Shows Data Model view
  - `/settings/user-roles` → Shows User Roles view

---

## 5. Active State Detection

### Primary Sidebar Icons

```javascript
const isActive = (path) => location.pathname.startsWith(path);
```

**Examples**:
- Current URL: `/content/places`
- Content icon (`/content`): ✅ Active (starts with `/content`)
- Settings icon (`/settings`): ❌ Not active

- Current URL: `/settings/data-model`
- Settings icon (`/settings`): ✅ Active (starts with `/settings`)
- Content icon (`/content`): ❌ Not active

### Secondary Sidebar Items

```javascript
const active = location.pathname.includes(item.id);
```

**Examples**:
- Current URL: `/content/places`
- Item ID: `"places"` → ✅ Active (URL includes "places")
- Item ID: `"pages"` → ❌ Not active

- Current URL: `/settings/data-model`
- Item ID: `"data_model"` → ✅ Active (URL includes "data_model")
- Item ID: `"flows"` → ❌ Not active

**Note**: This is a simple string inclusion check. More specific matching could be done if needed.

---

## 6. Navigation Flow Examples

### Example 1: Navigating to Content Collection

1. **User clicks "Content" icon** (Primary Sidebar)
   ```
   URL: / → /content
   Route: Matches <Route path="/content" />
   Component: ContentPage renders
   Secondary Sidebar: Shows collections (from ContentPage)
   ```

2. **User clicks "Places"** (Secondary Sidebar)
   ```
   URL: /content → /content/places
   Route: Matches <Route path="/content/:collectionId?" />
   Component: ContentPage renders (with collectionId="places")
   Secondary Sidebar: "Places" becomes active
   Main Content: Shows Places collection data
   ```

### Example 2: Switching to Settings

1. **User clicks "Settings" icon** (Primary Sidebar)
   ```
   URL: /content/places → /settings
   Route: Matches <Route path="/settings/*" />
   Component: SettingsPage renders (replaces ContentPage)
   Secondary Sidebar: Switches to settingsNavItems (from SettingsPage)
   Main Content: Shows Settings default view
   ```

2. **User clicks "Data Model"** (Secondary Sidebar)
   ```
   URL: /settings → /settings/data-model
   Route: Still matches <Route path="/settings/*" />
   Component: SettingsPage renders (same component, different view)
   Secondary Sidebar: "Data Model" becomes active
   Main Content: Shows Data Model view
   ```

### Example 3: Expandable Items

1. **User clicks "Form Submissions"** (hasChildren: true)
   ```
   Action: Toggles expand (doesn't navigate)
   State: expandedItems["form_submissions"] = true
   UI: Shows children items (indented)
   ```

2. **User clicks child item**
   ```
   URL: /content → /content/{childId}
   Action: Navigates to child path
   ```

---

## 7. Header (Top Menu)

### Location
- **File**: `components/layout/Header.jsx`
- **Height**: 56px (fixed)
- **Position**: Sticky top (z-index: 30)

### Props (Passed from Page Components)

```javascript
headerProps={{
  title: 'Places',                    // Main title
  subtitle: 'Content',                 // Subtitle (small, uppercase)
  breadcrumb: true,                    // Show breadcrumb section
  icon: 'MapPin',                     // Icon name (from lucide-react)
  iconColor: '#F59E0B',               // Icon background color
  itemCount: 1,                        // Item count badge
  showLayoutOptions: true,             // Show layout toggle buttons
  showAddButton: true,                 // Show "Add" button
  showSearch: true,                    // Show search bar
  searchPlaceholder: 'Search...',      // Search placeholder
  rightContent: <CustomComponent />    // Custom right-side content
}}
```

### Dynamic Content

- **Title/Subtitle**: Changes based on current page/collection
- **Icon**: Matches the current context (collection icon, settings icon, etc.)
- **Item Count**: Shows number of items in current view
- **Actions**: Context-specific buttons (Add, Search, Filter, Layout options)

---

## 8. Key Design Patterns

### Pattern 1: Page Components Control Secondary Sidebar

**Not**: Primary sidebar determines secondary sidebar content
**Instead**: Each page component decides what to show

```javascript
// ContentPage.jsx
<MainLayout secondarySidebarItems={collections} />

// SettingsPage.jsx
<MainLayout secondarySidebarItems={settingsNavItems} />

// FilesPage.jsx
<MainLayout secondarySidebarItems={fileFolders} />
```

### Pattern 2: Simple Active State Detection

**Primary Icons**: `pathname.startsWith(path)`
**Secondary Items**: `pathname.includes(item.id)`

No complex logic, just string matching.

### Pattern 3: Route-Based Component Rendering

- Route determines which page component renders
- Page component determines secondary sidebar content
- URL determines active states

### Pattern 4: Props-Driven Layout

- `MainLayout` receives all configuration via props
- No internal state management for sidebar content
- Completely controlled by parent components

---

## 9. Data Flow Diagram

```
User Action
    │
    ├─ Click Primary Icon
    │   │
    │   ├─ Navigate to /content
    │   │   │
    │   │   └─ React Router → ContentPage
    │   │       │
    │   │       └─ Pass collections to MainLayout
    │   │           │
    │   │           └─ Secondary Sidebar shows collections
    │   │
    │   └─ Navigate to /settings
    │       │
    │       └─ React Router → SettingsPage
    │           │
    │           └─ Pass settingsNavItems to MainLayout
    │               │
    │               └─ Secondary Sidebar shows settings menu
    │
    └─ Click Secondary Item
        │
        ├─ Navigate to /content/places
        │   │
        │   └─ React Router → ContentPage (with collectionId)
        │       │
        │       └─ Secondary Sidebar: "Places" becomes active
        │
        └─ Navigate to /settings/data-model
            │
            └─ React Router → SettingsPage
                │
                └─ Secondary Sidebar: "Data Model" becomes active
```

---

## 10. Implementation Checklist

To replicate this system:

- [x] Create Primary Sidebar (icon-only, 52px)
- [x] Create Secondary Sidebar (full menu, 220px)
- [x] Create MainLayout component that accepts `secondarySidebarItems` prop
- [x] Implement simple active state detection (`startsWith`, `includes`)
- [x] Each page component passes its own `secondarySidebarItems`
- [x] Route configuration matches URL patterns
- [x] Navigation uses router's `navigate()` function
- [x] Support expandable items with local state
- [x] Support dividers for visual grouping
- [x] Support search/filter in secondary sidebar
- [x] Header receives props from page components

---

## Summary

**The Directus menu system is elegant because:**

1. **Separation of Concerns**: Primary sidebar handles top-level navigation, secondary sidebar handles context-specific navigation
2. **Page-Driven Content**: Each page component controls what appears in the secondary sidebar
3. **Simple Active States**: Basic string matching, no complex logic
4. **Flexible Routing**: Wildcard routes allow nested navigation
5. **Props-Based**: Everything is controlled via props, making it predictable and testable

**Key Takeaway**: The relationship between primary and secondary sidebars is **indirect** - they're connected through the page component that renders based on the current route.
