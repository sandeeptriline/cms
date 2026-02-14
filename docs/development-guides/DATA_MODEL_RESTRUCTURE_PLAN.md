# Data Model Page Restructure Plan

## Current Structure

### Current Pages:
1. **Listing Page**: `/dashboard/settings/data-model`
   - Shows a table with all data models
   - Has "Create Data Model" button
   - Each row has actions (View Fields, Add Field, Edit, Delete)
   - Clicking "View Fields" navigates to fields page

2. **Fields View Page**: `/dashboard/settings/data-model/[id]/fields`
   - Shows details of a specific data model
   - Displays all fields in a table
   - Has "Add new field" button
   - Has "Back" button to return to listing

### Current Navigation:
- Settings menu → "Data Model" → Shows listing page
- From listing, click "View Fields" → Shows fields page

---

## Desired Structure

### New Navigation Flow:
1. **Settings Menu** → "Data Model" (main menu item)
   - **Secondary Sidebar** shows:
     - **"+ Create Data Model"** item with icon (Plus icon) at the top, before all data models
     - Each Data Model as a submenu item (title only, no icon)
     - Submenu items are dynamically loaded from API
     - Clicking a submenu item shows that data model's fields view
     - Clicking "+ Create Data Model" opens the create modal

2. **Main Content Area**:
   - When on `/dashboard/settings/data-model` (no ID):
     - Show empty state OR redirect to first data model OR show a default view
   - When on `/dashboard/settings/data-model/[id]`:
     - Show the fields view for that specific data model (current fields page)
     - **Edit button** in header to edit the data model
     - Edit modal includes **Delete button** for deleting the data model

### Visual Structure:
```
┌─────────────────────────────────────────────────────────┐
│ Primary Sidebar │ Secondary Sidebar │ Main Content       │
│                 │                   │                    │
│ [Settings Icon] │ Data Model        │ [Data Model View]  │
│                 │ [+ Create]        │ [Edit] [Add Field] │
│                 │ ├─ Article        │                    │
│                 │ ├─ Page           │                    │
│                 │ ├─ Product        │                    │
│                 │ └─ Category       │                    │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Update Data Model Listing Page

**File**: `frontend/app/dashboard/settings/data-model/page.tsx`

**Changes**:
1. **Load Data Models** and convert them to `SecondarySidebarItem[]` format
2. **Pass to DashboardLayout** via `secondarySidebarItems` prop
3. **Handle routing**:
   - If no data models exist: Show empty state with "Create Data Model" button
   - If data models exist but no ID in URL: 
     - Option A: Redirect to first data model
     - Option B: Show a default overview page
     - Option C: Show empty state with list (current behavior but without table)
4. **Remove the table view** (or keep it as a fallback/alternative view)
5. **Keep "Create Data Model" button** in the header

**Code Structure**:
```typescript
// Load data models
const [contentTypes, setContentTypes] = useState<ContentType[]>([])
const [createModalOpen, setCreateModalOpen] = useState(false)

// Convert to sidebar items with "+ Create Data Model" at the top
const sidebarItems: SecondarySidebarItem[] = [
  {
    id: 'create-data-model',
    name: 'Create Data Model',
    href: '#', // Special item, handled via onClick
    icon: 'Plus', // Plus icon from lucide-react
    // onClick handler will open create modal
  },
  // Divider (optional)
  ...(contentTypes.length > 0 ? [{
    id: 'divider',
    name: '',
    divider: true,
  }] : []),
  // Data model items
  ...contentTypes.map(ct => ({
    id: ct.id,
    name: ct.name,
    href: `/dashboard/settings/data-model/${ct.id}`,
    // No icon for submenu items (title only)
  }))
]

// Handle create item click
const handleSidebarItemClick = (item: SecondarySidebarItem) => {
  if (item.id === 'create-data-model') {
    setCreateModalOpen(true)
  } else if (item.href && item.href !== '#') {
    router.push(item.href)
  }
}

// Pass to layout
<DashboardLayout
  secondarySidebarItems={sidebarItems}
  onSidebarItemClick={handleSidebarItemClick}
  ...
>
```

---

### Phase 2: Update Fields View Page

**File**: `frontend/app/dashboard/settings/data-model/[id]/fields/page.tsx`

**Changes**:
1. **Load all data models** and pass as `secondarySidebarItems` to show in sidebar (including "+ Create Data Model" item)
2. **Highlight active data model** in sidebar (should work automatically via active state logic)
3. **Remove "Back" button** (navigation now via sidebar)
4. **Add "Edit" button** in the header next to "Add new field" button
   - Opens edit modal for the current data model
5. **Add "Delete" button** in the edit modal
   - Shows delete confirmation
   - After deletion, redirect appropriately
6. **Keep all field management functionality** (add, edit, delete fields)

**Code Structure**:
```typescript
// Load all data models for sidebar
const [allContentTypes, setAllContentTypes] = useState<ContentType[]>([])

// Load current data model
const [contentType, setContentType] = useState<ContentType | null>(null)

// State for modals
const [editModalOpen, setEditModalOpen] = useState(false)
const [createModalOpen, setCreateModalOpen] = useState(false)

// Convert to sidebar items with "+ Create Data Model" at the top
const sidebarItems: SecondarySidebarItem[] = [
  {
    id: 'create-data-model',
    name: 'Create Data Model',
    href: '#',
    icon: 'Plus',
  },
  ...(allContentTypes.length > 0 ? [{
    id: 'divider',
    name: '',
    divider: true,
  }] : []),
  ...allContentTypes.map(ct => ({
    id: ct.id,
    name: ct.name,
    href: `/dashboard/settings/data-model/${ct.id}`,
  }))
]

// Handle sidebar item clicks
const handleSidebarItemClick = (item: SecondarySidebarItem) => {
  if (item.id === 'create-data-model') {
    setCreateModalOpen(true)
  } else if (item.href && item.href !== '#') {
    router.push(item.href)
  }
}

<DashboardLayout
  secondarySidebarItems={sidebarItems}
  onSidebarItemClick={handleSidebarItemClick}
  ...
>
  {/* Header with Edit button */}
  <div className="flex items-center justify-between mb-6">
    <div>...</div>
    <div className="flex gap-2">
      <Button onClick={() => setEditModalOpen(true)}>
        <Edit className="h-4 w-4 mr-2" />
        Edit Data Model
      </Button>
      <Button onClick={handleAddField}>
        <Plus className="h-4 w-4 mr-2" />
        Add new field
      </Button>
    </div>
  </div>

  {/* Edit Modal with Delete button */}
  <EditContentTypeModal
    open={editModalOpen}
    onOpenChange={setEditModalOpen}
    contentType={contentType}
    showDeleteButton={true} // New prop to show delete in modal
    onSuccess={handleEditSuccess}
    onDelete={handleDelete}
  />
</DashboardLayout>
```

---

### Phase 3: Handle Edge Cases

1. **No Data Models**:
   - Show empty state on main page
   - Sidebar shows only "Data Model" parent (no submenu items)
   - "Create Data Model" button visible

2. **Data Model Deleted**:
   - After deletion, redirect to `/dashboard/settings/data-model`
   - If other data models exist, redirect to first one
   - Update sidebar items

3. **Data Model Created**:
   - After creation, redirect to new data model's fields page
   - Refresh sidebar items to include new data model

4. **Active State**:
   - Sidebar should highlight the currently viewed data model
   - Active state logic: `pathname?.includes(item.id)` should work

---

### Phase 4: Optional Enhancements

1. **Icons for Data Models**:
   - If data model has an icon, show it in sidebar (optional)
   - User requested "title only", so icons might not be needed

2. **Sorting**:
   - Sort data models alphabetically in sidebar
   - Or by creation date, or custom sort order

3. **Search/Filter**:
   - Add search box in sidebar to filter data models (future enhancement)

4. **Create Button Location**:
   - ✅ **Added to sidebar** as "+ Create Data Model" with Plus icon at the top
   - Keep in main content header as well (optional, for consistency)

---

## File Changes Summary

### Files to Modify:

1. **`frontend/app/dashboard/settings/data-model/page.tsx`**
   - Remove table view (or make it optional)
   - Load data models and convert to sidebar items
   - Pass `secondarySidebarItems` to `DashboardLayout`
   - Handle empty state and routing

2. **`frontend/app/dashboard/settings/data-model/[id]/fields/page.tsx`**
   - Load all data models for sidebar (including "+ Create Data Model" item)
   - Pass `secondarySidebarItems` to `DashboardLayout`
   - Remove "Back" button
   - Add "Edit Data Model" button in header
   - Integrate edit modal with delete functionality
   - Keep field management functionality

3. **`frontend/app/dashboard/settings/data-model/components/edit-content-type-modal.tsx`**
   - Add "Delete" button in the modal footer
   - Handle delete confirmation
   - Add `showDeleteButton` prop to conditionally show delete button
   - Add `onDelete` callback prop for delete action

### Files to Create (if needed):

- None (reusing existing components)

### Files to Delete:

- None (keeping existing structure, just changing navigation)

---

## Routing Structure

### Current Routes:
- `/dashboard/settings/data-model` → Listing page
- `/dashboard/settings/data-model/[id]/fields` → Fields view

### New Routes (same structure, different behavior):
- `/dashboard/settings/data-model` → 
  - If no data models: Empty state
  - If data models exist: Redirect to first OR show overview
- `/dashboard/settings/data-model/[id]` → Fields view (same as before)
- `/dashboard/settings/data-model/[id]/fields` → Fields view (keep for backward compatibility, or redirect to `/[id]`)

**Note**: We might want to simplify routing:
- `/dashboard/settings/data-model/[id]` → Fields view (remove `/fields` suffix)

---

## User Experience Flow

### Scenario 1: User visits Data Model for first time (no data models)
1. Navigate to Settings → Data Model
2. See empty state: "No data models. Create your first data model."
3. Click "Create Data Model"
4. After creation, redirect to new data model's fields page
5. Sidebar now shows the new data model as submenu item

### Scenario 2: User has existing data models
1. Navigate to Settings → Data Model
2. Sidebar shows:
   - "+ Create Data Model" item with Plus icon at the top
   - All data models as submenu items below
3. Click a data model from sidebar
4. Main content shows that data model's fields
5. Active data model is highlighted in sidebar
6. Header shows "Edit Data Model" and "Add new field" buttons

### Scenario 3: User creates new data model
1. From any data model view, click "+ Create Data Model" from sidebar (with Plus icon)
2. Create modal opens
3. After creation:
   - Redirect to new data model's fields page
   - Sidebar refreshes to show new item
   - New item is highlighted as active

### Scenario 5: User edits a data model
1. From data model fields view, click "Edit Data Model" button in header
2. Edit modal opens with current data model details
3. User can modify fields and save
4. After save, data model is updated and view refreshes

### Scenario 6: User deletes a data model from edit modal
1. From data model fields view, click "Edit Data Model" button
2. Edit modal opens
3. Click "Delete" button in the edit modal footer
4. Delete confirmation dialog appears
5. After confirmation:
   - Data model is deleted
   - If other data models exist: Redirect to first data model
   - If no data models: Redirect to `/dashboard/settings/data-model` (empty state)
   - Sidebar refreshes to remove deleted item

### Scenario 4: User deletes a data model
1. From data model view, click delete
2. Confirm deletion
3. After deletion:
   - If other data models exist: Redirect to first data model
   - If no data models: Redirect to `/dashboard/settings/data-model` (empty state)
   - Sidebar refreshes to remove deleted item

---

## Technical Considerations

### 1. Sidebar Item Format
```typescript
interface SecondarySidebarItem {
  id: string              // Data model ID or special ID like 'create-data-model'
  name: string            // Data model name or "Create Data Model"
  href?: string           // `/dashboard/settings/data-model/${id}` or '#' for special items
  icon?: string           // Icon name (e.g., 'Plus' for create button)
  divider?: boolean       // Show divider before this item
  // For data models: No icon (title only as requested)
  // For create button: Plus icon
}
```

**Special Sidebar Items**:
- **"+ Create Data Model"**: 
  - `id: 'create-data-model'`
  - `name: 'Create Data Model'`
  - `icon: 'Plus'` (from lucide-react)
  - `href: '#'` (handled via onClick)
  - Should appear at the top of the sidebar list

### 2. Active State Detection
The sidebar already has logic for active state:
```typescript
const isActive = pathname?.includes(item.id) || 
               (itemHref && pathname?.startsWith(itemHref)) ||
               false
```
This should work automatically when we pass the correct `href`.

### 3. Data Loading
- Both pages need to load all data models for sidebar
- Consider caching or context to avoid duplicate API calls
- Or use React Query/SWR for shared state

### 4. Performance
- Load sidebar items on page mount
- Show loading state in sidebar if needed
- Consider pagination if there are many data models (future)

---

## Questions to Clarify

1. **Main page behavior**: When on `/dashboard/settings/data-model` with no ID, should we:
   - Show empty state?
   - Redirect to first data model?
   - Show a default overview page?

2. **Routing**: Should we keep `/fields` suffix or simplify to just `/[id]`?

3. **Icons**: 
   - ✅ **Confirmed**: "+ Create Data Model" has Plus icon
   - Data model submenu items: title only (no icons)

4. **Create button**: 
   - ✅ **Added to sidebar** as "+ Create Data Model" with Plus icon
   - Can also keep in header for consistency (optional)

5. **Table view**: Completely remove or keep as alternative view (toggle)?

6. **Edit and Delete functionality**:
   - ✅ **Edit button**: Added to data model view page header
   - ✅ **Delete button**: Added to edit modal footer

---

## Implementation Steps

1. ✅ Create this plan document
2. ✅ Add "+ Create Data Model" to sidebar with Plus icon
3. ✅ Add "Edit Data Model" button to fields view page
4. ✅ Add "Delete" button to edit modal
5. ⏳ Get user approval/feedback on plan
6. ⏳ Update listing page to load and pass sidebar items (including create item)
7. ⏳ Update fields page to load and pass sidebar items (including create item)
8. ⏳ Update edit modal to include delete button
9. ⏳ Test navigation flow
10. ⏳ Test edge cases (empty, create, edit, delete)
11. ⏳ Polish UI/UX

---

## Summary

**Goal**: Show all Data Models as submenu items in the left sidebar under "Data Model" menu. Clicking a submenu item shows that data model's fields view.

**Key Changes**:
- Convert data models to `SecondarySidebarItem[]` format
- Add "+ Create Data Model" item with Plus icon at the top of sidebar
- Pass to `DashboardLayout` via `secondarySidebarItems` prop
- Remove table listing (or make optional)
- Remove "Back" button from fields page
- Add "Edit Data Model" button in fields view page header
- Add "Delete" button in edit modal footer
- Handle routing and active states

**Benefits**:
- Better navigation (Directus-style)
- Quick access to all data models
- Cleaner UI (no need for table view)
- Consistent with other sections
