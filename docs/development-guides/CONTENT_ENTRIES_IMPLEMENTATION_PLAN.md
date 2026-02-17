# Data Model Manager Implementation Plan

## Overview

**Terminology**:
- **Data Models** = Content Types (the schema/structure) - defined in Settings
- **Data Model Manager** = Interface for managing actual data records (entries) created from Data Models
- **Entries** = Actual data records created from Data Models

**Hierarchy**: `Tenant → Project → **Data Model Manager (Entries)**`

**Note**: Data Model Manager is a sibling to Data Model (schema builder). Both are directly under Project:
- **Data Model** (`/dashboard/projects/[projectId]/data-model`) - Schema builder for defining content types and fields
- **Data Model Manager** (`/dashboard/projects/[projectId]/data-model-manager`) - Interface for managing actual entries created from Data Models

This plan covers the complete implementation of Data Model Manager, following Strapi's UI/UX patterns, allowing users to create, read, update, and delete actual content entries based on their defined Data Models.

**Reference**: [Strapi Content Manager Documentation](https://docs.strapi.io/cms/features/content-manager)

---

## 1. Database Structure Analysis

### 1.1 Existing Tables ✅

**`content_entries`** - Entry metadata:
- `id` (CHAR(36)) - Primary key
- `content_type_id` (CHAR(36)) - Links to data model
- `status` (ENUM: draft, review, approved, published)
- `published_version_id` (CHAR(36)) - Reference to published version
- `published_at`, `scheduled_publish_at`, `scheduled_unpublish_at`
- `title`, `slug`, `search_index` - Extracted for display/search
- `created_by`, `updated_by` - User tracking
- `created_at`, `updated_at` - Timestamps

**`content_versions`** - Field values storage:
- `id` (CHAR(36)) - Primary key
- `entry_id` (CHAR(36)) - Links to content_entries
- `version_number` (INT) - Sequential version
- `data` (JSON) - **All field values stored here**
- `status` (VARCHAR(20)) - Version status
- `name`, `hash`, `delta` - Version metadata
- `created_by`, `created_at`

**`fields`** - Field definitions (already exists):
- Defines schema for each content type
- Contains validation rules, types, interfaces

### 1.2 Data Storage Architecture

**Current Entry Data**: Stored in latest `content_versions` record for each entry
**Published Entry Data**: Referenced via `content_entries.published_version_id`
**Field Values**: JSON object in `content_versions.data` with structure:
```json
{
  "field_name_1": "value",
  "field_name_2": 123,
  "field_name_3": true,
  "relation_field": "uuid-of-related-entry"
}
```

### 1.3 Project Scoping

Content entries are scoped to projects via:
- `content_entries.content_type_id` → `content_types.id`
- `content_types.project_id` → `projects.id`

**No direct `project_id` on `content_entries`** - scoped through content type.

---

## 2. Backend Implementation

### 2.1 Module Structure

```
backend/src/content-entries/
├── content-entries.module.ts
├── content-entries.service.ts
├── content-entries.controller.ts
├── dto/
│   ├── create-entry.dto.ts
│   ├── update-entry.dto.ts
│   ├── publish-entry.dto.ts
│   └── query-entries.dto.ts
└── validators/
    └── field-validator.service.ts
```

**Note**: All endpoints require `projectId` as query parameter for project scoping.

### 2.2 DTOs (Data Transfer Objects)

#### `CreateEntryDto`
```typescript
{
  contentTypeId: string;        // Required
  data: Record<string, any>;    // Field values as key-value pairs
  status?: 'draft' | 'review';  // Default: 'draft'
  title?: string;               // Auto-extracted if not provided
  slug?: string;                // Auto-generated from title if not provided
}
```

#### `UpdateEntryDto`
```typescript
{
  data?: Record<string, any>;   // Partial field updates
  status?: 'draft' | 'review' | 'approved' | 'published';
  title?: string;
  slug?: string;
}
```

#### `PublishEntryDto`
```typescript
{
  publishAt?: Date;            // Immediate if not provided
  unpublishAt?: Date;           // Optional scheduled unpublish
}
```

#### `QueryEntriesDto`
```typescript
{
  contentTypeId: string;        // Required
  status?: string;              // Filter by status
  search?: string;              // Full-text search
  page?: number;                // Pagination
  limit?: number;               // Items per page
  sort?: string;                // Sort field
  order?: 'asc' | 'desc';      // Sort order
  fields?: string[];            // Fields to include in response
}
```

### 2.3 Service Methods

#### `ContentEntriesService`

**Core CRUD**:
- `findAll(tenantId, projectId, contentTypeId, queryDto)` - List entries with filters
- `findOne(tenantId, projectId, contentTypeId, entryId)` - Get single entry with full data
- `create(tenantId, projectId, createDto)` - Create new entry
- `update(tenantId, projectId, contentTypeId, entryId, updateDto)` - Update entry
- `delete(tenantId, projectId, contentTypeId, entryId)` - Delete entry

**Content Lifecycle**:
- `publish(tenantId, projectId, contentTypeId, entryId, publishDto)` - Publish entry
- `unpublish(tenantId, projectId, contentTypeId, entryId)` - Unpublish entry
- `changeStatus(tenantId, projectId, contentTypeId, entryId, status)` - Change status

**Versioning**:
- `getVersions(tenantId, projectId, contentTypeId, entryId)` - List all versions
- `getVersion(tenantId, projectId, contentTypeId, entryId, versionId)` - Get specific version
- `revertToVersion(tenantId, projectId, contentTypeId, entryId, versionId)` - Revert to version

**Bulk Operations**:
- `bulkDelete(tenantId, projectId, contentTypeId, entryIds)` - Delete multiple
- `bulkPublish(tenantId, projectId, contentTypeId, entryIds)` - Publish multiple
- `bulkChangeStatus(tenantId, projectId, contentTypeId, entryIds, status)` - Change status for multiple

**Utilities**:
- `extractTitle(entryData, contentType)` - Extract title from entry data
- `generateSlug(title)` - Generate URL-friendly slug
- `buildSearchIndex(entryData, contentType)` - Build full-text search index
- `validateFieldValues(data, contentType)` - Validate against field rules

### 2.4 Field Validator Service

**`FieldValidatorService`** - Validates field values against field definitions:

- `validateField(field, value)` - Validate single field
- `validateEntry(data, contentType)` - Validate all fields
- `applyDefaults(data, contentType)` - Apply default values
- `transformValue(field, value)` - Transform value based on field type
- `checkRequired(data, contentType)` - Check required fields

**Validation Rules** (from `fields.validation` JSON):
- `required` - Field must have value
- `min`, `max` - Numeric/string length constraints
- `pattern` - Regex pattern for strings
- `enum` - Allowed values
- `custom` - Custom validation function

### 2.5 Controller Endpoints (All Project-Scoped)

**Base Path**: `/api/v1/content-entries`

**All endpoints require `projectId` as query parameter.**

**GET** `/` - List entries
- Query params: `projectId` (required), `contentTypeId` (required), `status`, `search`, `page`, `limit`, `sort`, `order`
- Response: `{ data: Entry[], meta: { total, page, limit } }`

**GET** `/:id` - Get single entry
- Query params: `projectId` (required), `contentTypeId` (required)
- Response: `Entry` with full field data

**POST** `/` - Create entry
- Body: `CreateEntryDto` (includes `contentTypeId`)
- Query params: `projectId` (required)
- Response: `Entry`

**PATCH** `/:id` - Update entry
- Body: `UpdateEntryDto`
- Query params: `projectId` (required), `contentTypeId` (required)
- Response: `Entry`

**DELETE** `/:id` - Delete entry
- Query params: `projectId` (required), `contentTypeId` (required)
- Response: `{ success: true }`

**POST** `/:id/publish` - Publish entry
- Body: `PublishEntryDto`
- Query params: `projectId` (required), `contentTypeId` (required)
- Response: `Entry`

**POST** `/:id/unpublish` - Unpublish entry
- Query params: `projectId` (required), `contentTypeId` (required)
- Response: `Entry`

**POST** `/:id/change-status` - Change status
- Body: `{ status: string }`
- Query params: `projectId` (required), `contentTypeId` (required)
- Response: `Entry`

**GET** `/:id/versions` - List versions
- Query params: `projectId` (required), `contentTypeId` (required)
- Response: `Version[]`

**GET** `/:id/versions/:versionId` - Get version
- Query params: `projectId` (required), `contentTypeId` (required)
- Response: `Version` with data

**POST** `/:id/revert/:versionId` - Revert to version
- Query params: `projectId` (required), `contentTypeId` (required)
- Response: `Entry`

**POST** `/bulk-delete` - Bulk delete
- Body: `{ entryIds: string[] }`
- Query params: `projectId` (required), `contentTypeId` (required)
- Response: `{ deleted: number }`

**POST** `/bulk-publish` - Bulk publish
- Body: `{ entryIds: string[] }`
- Query params: `projectId` (required), `contentTypeId` (required)
- Response: `{ published: number }`

**POST** `/bulk-change-status` - Bulk change status
- Body: `{ entryIds: string[], status: string }`
- Query params: `projectId` (required), `contentTypeId` (required)
- Response: `{ updated: number }`

### 2.6 Implementation Details

**Entry Creation Flow**:
1. Validate `contentTypeId` exists and belongs to project
2. Load content type with all fields
3. Validate field values against field definitions
4. Apply default values for missing optional fields
5. Extract title from data (or use provided)
6. Generate slug from title
7. Build search index from all text fields
8. Create `content_entries` record
9. Create initial `content_versions` record with data
10. Return entry with full data

**Entry Update Flow**:
1. Validate entry exists and belongs to content type/project
2. Load current version data
3. Merge new data with existing
4. Validate merged data
5. Extract/update title and slug
6. Update search index
7. Create new version record (increment version_number)
8. Update `content_entries` record
9. Return updated entry

**Publishing Flow**:
1. Validate entry exists
2. Ensure entry is in 'approved' or 'review' status
3. Get latest version
4. Create published version (copy of latest)
5. Update `content_entries.published_version_id`
6. Set `published_at` timestamp
7. Update status to 'published'
8. Handle scheduled publish/unpublish if provided

**Versioning**:
- Every update creates a new version
- Versions are immutable (read-only)
- Latest version = highest `version_number`
- Published version = referenced by `published_version_id`

---

## 3. Frontend Implementation

### 3.1 Route Structure (Project-Scoped)

**Base Path**: `/dashboard/projects/[projectId]/data-model-manager`

**Important Clarifications**:

1. **Data Models are created in Data Model section** (`/dashboard/projects/[projectId]/data-model`)
   - This is the schema builder where you define content types and fields
   - Data Model Manager does NOT create data models

2. **Data Model Manager uses existing Data Models** (`/dashboard/projects/[projectId]/data-model-manager`)
   - Shows list of all data models (created in Data Model section)
   - Allows creating/editing entries for those data models
   - No data model creation here - only entry management

3. **Data Model Behavior** (determined by `singleton` field):
   - **Non-Singleton** (`singleton = false`): Can have multiple entries
     - Example: "Blog Post" data model → can have 100+ blog post entries
     - Shows entries list view
     - Can create multiple entries
   - **Singleton** (`singleton = true`): Has only ONE entry
     - Example: "Homepage" data model → only one homepage entry
     - No list view (goes directly to entry editor)
     - Entry created automatically if it doesn't exist

**Route Pattern**: Single route pattern `/data-model-manager/[contentTypeId]` - check `singleton` field to determine if it shows list or editor.

**Routes** (Simplified - Same Pattern as Data Model):
- `/dashboard/projects/[projectId]/data-model-manager` - Data Model Manager page
  - Shows all data models in sidebar (same as Data Model page)
  - First data model selected by default
  - Displays selected data model's entries or entry editor
- `/dashboard/projects/[projectId]/data-model-manager/[contentTypeId]` - Data model entries/entry
  - **Non-Singleton** (`singleton = false`): Shows entries list
  - **Singleton** (`singleton = true`): Shows entry editor directly (no list view)
- `/dashboard/projects/[projectId]/data-model-manager/[contentTypeId]/create` - Create new entry (non-singleton only)
- `/dashboard/projects/[projectId]/data-model-manager/[contentTypeId]/[entryId]` - Edit entry
- `/dashboard/projects/[projectId]/data-model-manager/[contentTypeId]/[entryId]/versions` - View versions
- `/dashboard/projects/[projectId]/data-model-manager/[contentTypeId]/configurations/edit` - Configure list view (non-singleton) or edit view (singleton)
- `/dashboard/projects/[projectId]/data-model-manager/[contentTypeId]/[entryId]/configurations/edit` - Configure edit view (non-singleton)

**Key Points**:
- **Data Models are created in Data Model section** (`/dashboard/projects/[projectId]/data-model`)
- **Data Model Manager only manages entries** for existing data models
- **No data model creation** in Data Model Manager
- Routes check `singleton` field to determine behavior (list vs editor)

**Note**: All routes are project-scoped. The `projectId` is required and validated via `ProjectRouteGuard`.

**Related Route**:
- `/dashboard/projects/[projectId]/data-model` - Data Model (schema builder) - sibling to Data Model Manager

### 3.2 Menu Structure (Same as Data Model Pattern)

**Primary Menu** (Sidebar) - Project-Scoped:
```
Dashboard
├── Settings
│   └── Projects
│       └── [Project]
│           ├── Data Model → /dashboard/projects/[projectId]/data-model
│           │   ├── [Content Type 1] (first selected by default)
│           │   ├── [Content Type 2]
│           │   └── ... (dynamically generated list of all content types)
│           ├── Data Model Manager (NEW) → /dashboard/projects/[projectId]/data-model-manager
│           │   ├── [Data Model 1] (first selected by default)
│           │   │   └── → /dashboard/projects/[projectId]/data-model-manager/[id]
│           │   ├── [Data Model 2]
│           │   │   └── → /dashboard/projects/[projectId]/data-model-manager/[id]
│           │   └── ... (dynamically generated list of all content types)
│           ├── Flows
│           ├── Access Policies
│           └── Locales
```

**Menu Features** (Same Pattern as Data Model):
- Data Model Manager is a submenu item under the project (sibling to Data Model)
- Clicking "Data Model Manager" expands to show list of all data models
- Data models are shown as submenu items (indented under Data Model Manager)
- **First data model is selected by default** (same approach as Data Model)
- Currently selected data model highlighted
- Menu items dynamically generated from project's data models (created in Data Model section)
- Icons for each data model (from data model icon field)
- Both "Data Model" and "Data Model Manager" visible in project submenu
- **Note**: Non-Singleton and Singleton data models are not separated in the menu - all data models shown in one list (same as Data Model page)

### 3.3 API Client

**File**: `frontend/lib/api/content-entries.ts` (or `data-model-manager.ts`)

**Note**: All API calls require `projectId` as query parameter.

```typescript
export interface ContentEntry {
  id: string;
  contentTypeId: string;
  status: 'draft' | 'review' | 'approved' | 'published';
  title: string | null;
  slug: string | null;
  data: Record<string, any>;  // Field values
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export const contentEntriesApi = {
  getAll(projectId: string, contentTypeId: string, query?: QueryEntriesDto),
  getById(projectId: string, contentTypeId: string, entryId: string),
  create(projectId: string, data: CreateEntryDto),
  update(projectId: string, contentTypeId: string, entryId: string, data: UpdateEntryDto),
  delete(projectId: string, contentTypeId: string, entryId: string),
  publish(projectId: string, contentTypeId: string, entryId: string, data?: PublishEntryDto),
  unpublish(projectId: string, contentTypeId: string, entryId: string),
  changeStatus(projectId: string, contentTypeId: string, entryId: string, status: string),
  getVersions(projectId: string, contentTypeId: string, entryId: string),
  revertToVersion(projectId: string, contentTypeId: string, entryId: string, versionId: string),
  bulkDelete(projectId: string, contentTypeId: string, entryIds: string[]),
  bulkPublish(projectId: string, contentTypeId: string, entryIds: string[]),
  bulkChangeStatus(projectId: string, contentTypeId: string, entryIds: string[], status: string),
}
```

### 3.4 Pages & Components

#### 3.4.1 Data Model Manager Page (Same Pattern as Data Model)
**File**: `frontend/app/dashboard/projects/[projectId]/data-model-manager/page.tsx`

**Purpose**: Show content types list and entries (same pattern as Data Model page)

**Layout** (Same as Data Model Page):
- **Left Sidebar** (Secondary Sidebar):
  - "Data Model Manager" label with "+" icon button (for creating new content type - future)
  - Divider
  - List of all content types (data models) - dynamically generated
  - Each item: Icon + Name
  - First content type selected by default
  - Currently selected content type highlighted
- **Main Content Area**:
  - Shows selected data model's entries list (if non-singleton)
  - Shows singleton entry editor (if singleton)
  - Empty state if no data model selected
  - Empty state if no data models exist

**Features** (Same as Data Model):
- **Default Selection**: First data model is automatically selected on page load
- **Sidebar Navigation**: Click any data model to view its entries
- **Dynamic Generation**: Data models list generated from project's data models (created in Data Model section)
- **Icons**: Each data model shows its icon (from data model icon field)
- **No Data Model Creation**: Data models are created in Data Model section, not here
- **Empty States**: 
  - No content types: "No data models found" with "Create Data Model" button
  - No entries: "No entries found" with "Create new entry" button

**UI** (Same as Data Model Page):
- Two-column layout: Secondary Sidebar (narrow) + Main content (wide)
- Sidebar: Light background, fixed width
- Main: White background, scrollable
- Data model items in sidebar: Icon + Name (indented)
- Currently selected item highlighted

#### 3.4.2 Data Model Entries/Entry Page
**File**: `frontend/app/dashboard/projects/[projectId]/data-model-manager/[contentTypeId]/page.tsx`

**Purpose**: Handle both Non-Singleton (list) and Singleton (editor) data models (following Strapi pattern)

**Layout** (Following Strapi):
- **Left Sidebar**: Data Model Manager navigation (persistent)
- **Main Content Area**:
  - **Header**:
    - "← Back" link
    - Content type name (large title)
    - Entry count: "X entries found"
    - "Create new entry" button (top right)
  - **Search & Filters Bar**:
    - Search input (with magnifying glass icon)
    - "Filters" button (with filter icon)
  - **Table View**:
    - Checkbox column (for bulk actions)
    - Configurable columns (from field definitions)
    - Status indicators (draft = blue dot, published = green dot)
    - Actions column (Edit, Delete, Publish/Unpublish)
  - **Settings Button**: Gear icon (bottom right) for view configuration
  - **Empty State**:
    - Large icon (stacked documents)
    - "No content found" message
    - "Create new entry" button (centered)

**Features** (Following Strapi):
- **Temporary Configuration**: Quick field visibility toggle
- **Permanent Configuration**: Full view configuration (see 3.4.6)
- **Filters**: Condition-based filters (add multiple conditions)
- **Search**: Full-text search with debounce
- **Sorting**: Click column headers to sort
- **Pagination**: Page-based with items per page selector
- **Bulk Actions**: Delete, Publish, Change Status (when items selected)
- **Status Indicators**: Colored dots next to entry titles

**Breadcrumb**:
- Non-Singleton: `Dashboard > Settings > Projects > [Project Name] > Data Model Manager > [Data Model Name]`
- Singleton: `Dashboard > Settings > Projects > [Project Name] > Data Model Manager > [Data Model Name]` (no list, goes directly to editor)

#### 3.4.3 Entry Editor Page (Following Strapi Pattern)
**File**: `frontend/app/dashboard/projects/[projectId]/data-model-manager/[contentTypeId]/create/page.tsx` (Non-singleton only - create new entry)
**File**: `frontend/app/dashboard/projects/[projectId]/data-model-manager/[contentTypeId]/[entryId]/page.tsx` (Non-singleton - edit existing entry)
**File**: `frontend/app/dashboard/projects/[projectId]/data-model-manager/[contentTypeId]/page.tsx` (Singleton - no list view, shows editor directly, entry auto-created)

**Purpose**: Create/edit entries with dynamic form (following Strapi edit view pattern)

**Layout** (Following Strapi):
- **Left Sidebar**: Data Model Manager navigation (persistent)
- **Main Content Area**:
  - **Header**:
    - "← Back" link
    - "Create an entry" or "[Entry Title]" (large title)
    - Ellipsis menu (top right) with:
      - "Edit the model" (link to data model editor)
      - "Configure the view" (link to view configuration)
      - "Content History" (link to versions)
      - "Delete entry" (red, with confirmation)
  - **Form Area**:
    - Dynamic form fields (arranged in grid based on field width)
    - Field labels with required indicator (*)
    - Validation hints below fields (e.g., "min. 3 characters")
    - Field placeholders
    - Field descriptions/notes
  - **Right Sidebar** (ENTRY panel):
    - "Save" button (primary action)
    - Entry metadata (ID, Created, Updated, Author)
    - Status indicator
    - Publish/Unpublish toggle (if draft & publish enabled)

**Features** (Following Strapi):
- **Dynamic Form Builder**:
  - Loads content type fields with configuration
  - Generates form fields based on field types and interfaces
  - Groups fields by field groups (accordions)
  - Conditional field visibility (based on field conditions)
  - Field validation (real-time, with hints)
  - Field width configuration (half, full, fill)
- **Field Type Components** (matching Strapi interfaces):
  - Text input (with character count if maxLength)
  - Textarea (with character count)
  - Rich text editor (Tiptap with toolbar)
  - Number input (with min/max validation)
  - Boolean toggle (FALSE/TRUE with Clear button)
  - Date/DateTime picker (with calendar)
  - File/Media picker (with upload, preview, delete)
  - Relation picker (dropdown with search, "Load more", create on-the-fly)
  - Select dropdown (for enum fields)
  - JSON editor (code editor with syntax highlighting)
  - UID field (with "Regenerate" button)
  - Email field (with validation)
  - Password field (with show/hide toggle)
- **Components Support**:
  - Non-repeatable components (add/delete button)
  - Repeatable components (add entry, drag & drop reorder, delete entry)
- **Dynamic Zones Support**:
  - "Add a component to [zone name]" button
  - Component selector modal
  - Drag & drop reorder
  - Delete component
- **Relational Fields**:
  - One-choice: Dropdown with search
  - Multiple-choice: Dropdown with multi-select, drag & drop reorder
  - Status indicators (blue dot = draft, green dot = published)
  - "Load more" button for pagination
  - Click entry name to edit on-the-fly
- **Status Management**:
  - Draft & Publish toggle in right sidebar
  - Status change confirmation
  - Scheduled publish/unpublish (future)
- **Auto-save** (Future):
  - Auto-save draft every 30 seconds
  - Visual indicator (saving/saved)
  - Conflict resolution

**Breadcrumb**:
- Create: `Dashboard > Settings > Projects > [Project Name] > Data Model Manager > [Content Type] > Create an entry`
- Edit: `Dashboard > Settings > Projects > [Project Name] > Data Model Manager > [Content Type] > [Entry Title]`

#### 3.4.4 Versions Page
**File**: `frontend/app/dashboard/content/[contentTypeId]/[entryId]/versions/page.tsx`

**Purpose**: View and manage entry versions

**Features**:
- List of all versions (newest first)
- Version details (number, name, date, author)
- Compare versions (side-by-side diff)
- Revert to version (with confirmation)
- View version data

### 3.5 Dynamic Form Components

#### 3.5.1 Form Builder
**File**: `frontend/components/content/dynamic-form-builder.tsx`

**Purpose**: Generate form from content type fields

**Features**:
- Loads fields from content type
- Sorts by `sort` field
- Groups by field groups
- Renders appropriate field component per type
- Handles validation
- Manages form state

#### 3.5.2 Field Components (Following Strapi Interfaces)
**Directory**: `frontend/components/data-model-manager/fields/`

**Components** (matching Strapi field interfaces):
- `text-field.tsx` - Text input (input interface)
  - Character count if maxLength
  - Validation hints below field
- `textarea-field.tsx` - Textarea (textarea interface)
  - Character count if maxLength
  - Resizable
- `rich-text-field.tsx` - Rich text editor (wysiwyg interface, Tiptap)
  - Toolbar with formatting options
  - Media insertion
  - Link insertion
- `number-field.tsx` - Number input (numeric interface)
  - Min/max validation
  - Step control
- `boolean-field.tsx` - Boolean toggle (boolean interface)
  - FALSE/TRUE options with Clear button
  - Red highlight for FALSE, green for TRUE
- `date-field.tsx` - Date picker (date interface)
  - Calendar popup
  - Date format display
- `datetime-field.tsx` - DateTime picker (datetime interface)
  - Calendar + time picker
  - Timezone handling
- `file-field.tsx` - File upload (file interface)
  - Drag & drop upload
  - File preview
  - Delete button
- `media-field.tsx` - Media picker (media-library interface)
  - Media library browser
  - Image preview
  - Upload new media
- `relation-field.tsx` - Relation picker (relation interface)
  - Handles M2O, O2M, M2M, O2O, M2A
  - Dropdown with search
  - "Load more" pagination
  - Status indicators (draft/published dots)
  - Multi-select with drag & drop reorder
  - "Add or create a relation" placeholder
  - Click entry name to edit on-the-fly
- `select-field.tsx` - Select dropdown (select-dropdown interface)
  - For enum fields
  - Single or multi-select
- `json-field.tsx` - JSON editor (json interface)
  - Code editor with syntax highlighting
  - JSON validation
- `uid-field.tsx` - UID field (uid interface)
  - Text input with "Regenerate" button
  - Auto-generates from entry title
- `email-field.tsx` - Email input (email interface)
  - Email validation
  - Validation hints
- `password-field.tsx` - Password input (password interface)
  - Show/hide toggle (eye icon)
  - Validation hints
- `schema-field.tsx` - Schema field (single/repeatable schema)
  - Single: Non-repeatable component pattern
  - Repeatable: Repeatable component pattern
- `dynamic-zone-field.tsx` - Dynamic zone
  - "Add a component to [zone name]" button
  - Component selector modal
  - Drag & drop reorder
  - Delete component

**Each component** (Following Strapi pattern):
- Accepts field definition with interface configuration
- Handles value changes (React Hook Form integration)
- Shows validation errors (real-time)
- Displays field label with required indicator (*)
- Shows validation hints below field (e.g., "min. 3 characters")
- Displays field note/description
- Respects readonly/hidden states
- Handles conditional visibility (based on field conditions)
- Shows placeholder text
- Matches Strapi's visual design

### 3.6 UI/UX Requirements (Following Strapi Design)

#### 3.6.1 Design System (Strapi-Inspired)
- **Clean, minimal interface** matching Strapi's aesthetic
- **Two-column layout**: Fixed sidebar (narrow, light gray) + Main content (wide, white)
- **Color scheme**:
  - Primary: Purple/Blue (for actions, highlights)
  - Sidebar: Light gray background (#f6f6f9)
  - Main: White background
  - Status dots: Blue (draft), Green (published)
  - Error: Red
  - Success: Green
- **Typography**: Clear hierarchy, readable fonts
- **Icons**: Lucide icons (matching Strapi's icon style)
- **Spacing**: Consistent padding and margins
- **Responsive design**: Mobile, tablet, desktop

#### 3.6.2 User Experience (Strapi Patterns)
- **Fast loading**: Skeleton loaders, optimistic updates
- **Clear feedback**: Toasts, status indicators, validation hints
- **Intuitive navigation**: 
  - Persistent sidebar navigation
  - Breadcrumbs for deep navigation
  - "← Back" links
- **Keyboard shortcuts**:
  - Save: Cmd/Ctrl+S
  - Create: Cmd/Ctrl+N
  - Search: Cmd/Ctrl+F (in search bar)
  - Drag & drop: Space to activate, Arrow keys to move
- **Accessibility**: ARIA labels, keyboard navigation, focus management

#### 3.6.3 Status Indicators (Strapi Pattern)
- **Status dots** (in lists and relation pickers):
  - Draft: Blue dot (●)
  - Published: Green dot (●)
- **Status badges** (in table/list):
  - Draft: Gray badge
  - Review: Yellow/Orange badge
  - Approved: Blue badge
  - Published: Green badge
- **Visual indicators**:
  - Unsaved changes: Asterisk (*) or indicator
  - Auto-save status: "Saving..." / "Saved" (future)
  - Publishing status: Loading spinner
  - Scheduled publish: Clock icon

#### 3.6.4 Filtering & Search (Strapi Pattern)
- **Search bar**: Top of list view, with magnifying glass icon
- **Filters button**: Opens filter panel
- **Condition-based filters**: Add multiple conditions (AND logic)
- **Filter types**:
  - Status dropdown
  - Date range (created/updated)
  - Author filter
  - Custom field filters
- **Search**: Full-text search with debounce
- **URL query params**: Shareable filtered views

#### 3.6.5 Bulk Actions (Strapi Pattern)
- **Checkbox column**: First column in table
- **Bulk action bar**: Appears at bottom when items selected
  - Shows count: "X selected"
  - Actions: Delete, Publish, Change Status
- **Confirmation dialogs**: For destructive actions
- **Progress indicators**: For bulk operations

---

## 4. Implementation Steps

### Phase 1: Backend Foundation (Week 1)

**Step 1.1**: Create Module Structure
- [ ] Create `content-entries` module
- [ ] Create DTOs (CreateEntryDto, UpdateEntryDto, etc.)
- [ ] Set up module imports

**Step 1.2**: Implement Core Service
- [ ] Implement `findAll` with filtering
- [ ] Implement `findOne` with full data
- [ ] Implement `create` with validation
- [ ] Implement `update` with versioning
- [ ] Implement `delete`

**Step 1.3**: Implement Field Validator
- [ ] Create `FieldValidatorService`
- [ ] Implement field validation logic
- [ ] Implement default value application
- [ ] Implement value transformation

**Step 1.4**: Implement Controller
- [ ] Create controller with all endpoints
- [ ] Add guards (JwtAuthGuard, TenantGuard, PermissionGuard)
- [ ] Add Swagger documentation
- [ ] Test all endpoints

**Step 1.5**: Content Lifecycle
- [ ] Implement `publish` method
- [ ] Implement `unpublish` method
- [ ] Implement `changeStatus` method
- [ ] Handle scheduled publish/unpublish

**Step 1.6**: Versioning
- [ ] Implement version creation on update
- [ ] Implement `getVersions` method
- [ ] Implement `getVersion` method
- [ ] Implement `revertToVersion` method

**Step 1.7**: Bulk Operations
- [ ] Implement `bulkDelete`
- [ ] Implement `bulkPublish`
- [ ] Implement `bulkChangeStatus`

### Phase 2: Frontend Foundation (Week 2)

**Step 2.1**: API Client
- [ ] Create `content-entries.ts` API client (or `data-model-manager.ts`)
- [ ] Implement all API methods (all require `projectId`)
- [ ] Add error handling
- [ ] Add TypeScript types

**Step 2.2**: Route Structure (Project-Scoped, Simplified)
- [ ] Create `/dashboard/projects/[projectId]/data-model-manager` route (main page with sidebar)
  - Shows list of all data models (from Data Model section)
  - First data model selected by default
- [ ] Create `/dashboard/projects/[projectId]/data-model-manager/[contentTypeId]` route
  - Handle both Non-Singleton (show list) and Singleton (show editor)
  - Check `singleton` field to determine behavior
  - For Singleton: Auto-create entry if it doesn't exist
- [ ] Create `/dashboard/projects/[projectId]/data-model-manager/[contentTypeId]/create` route (non-singleton only)
- [ ] Create `/dashboard/projects/[projectId]/data-model-manager/[contentTypeId]/[entryId]` route (non-singleton)
- [ ] Create configuration routes:
  - `/dashboard/projects/[projectId]/data-model-manager/[contentTypeId]/configurations/edit` (list view for non-singleton, edit view for singleton)
  - `/dashboard/projects/[projectId]/data-model-manager/[contentTypeId]/[entryId]/configurations/edit` (edit view for non-singleton)
- [ ] Add `ProjectRouteGuard` to all routes
- [ ] **Important**: Data models are created in `/dashboard/projects/[projectId]/data-model` (schema builder)
- [ ] **Important**: Data Model Manager only manages entries, does NOT create data models

**Step 2.3**: Menu Integration (Same Pattern as Data Model)
- [ ] Update menu items to include "Data Model Manager" under project submenu
- [ ] Add "Data Model Manager" as sibling to "Data Model" in project submenu
- [ ] Implement same menu expansion pattern as Data Model:
  - Clicking "Data Model Manager" shows list of content types as submenu items
  - First content type selected by default
  - Content types shown as indented submenu items
- [ ] Dynamically generate content types list (same as Data Model)
- [ ] Add icons for content types (from data model icon field)
- [ ] Highlight currently selected content type
- [ ] Ensure both "Data Model" and "Data Model Manager" are visible in project submenu
- [ ] Use same SecondarySidebarItem pattern as Data Model page

**Step 2.4**: Breadcrumb Integration
- [ ] Update breadcrumb component
- [ ] Add "Settings" to breadcrumb
- [ ] Add "Projects" to breadcrumb
- [ ] Add project name to breadcrumb
- [ ] Add "Data Model Manager" to breadcrumb
- [ ] Add content type name to breadcrumb
- [ ] Add entry title to breadcrumb (when editing)

**Step 2.5**: Data Model Manager Page (Same Pattern as Data Model)
- [ ] Create page with same structure as Data Model page
- [ ] Implement secondary sidebar (left) with content types list
- [ ] Use SecondarySidebarItem pattern (same as Data Model)
- [ ] Add "Data Model Manager" label with "+" icon button (future: create content type)
- [ ] Dynamically generate content types list in sidebar
- [ ] **Set first content type as selected by default** (same as Data Model)
- [ ] Display selected content type's entries list (main area)
- [ ] Add empty state if no content types exist
- [ ] Add empty state if no entries for selected content type
- [ ] Handle content type selection (click sidebar item)
- [ ] Match Data Model page's UI/UX exactly (reference for UI/UX)

### Phase 3: Entries List (Week 2-3, Following Strapi Pattern)

**Step 3.1**: Data Model Entries/Entry Page
- [ ] Create list page with Strapi layout
- [ ] Implement two-column layout (sidebar + main)
- [ ] Add header (Back link, title, entry count, Create button)
- [ ] Implement table view with configurable columns
- [ ] Add status indicators (blue/green dots)
- [ ] Add action buttons (Edit, Delete, Publish/Unpublish)
- [ ] Add settings button (gear icon)

**Step 3.2**: Filtering & Search (Strapi Pattern)
- [ ] Add search bar (with magnifying glass icon)
- [ ] Add "Filters" button
- [ ] Implement filter panel (condition-based)
- [ ] Add status filter
- [ ] Add date range filter
- [ ] Add author filter
- [ ] Implement filter logic (AND conditions)

**Step 3.3**: Sorting & Pagination (Strapi Pattern)
- [ ] Implement column header sorting (click to sort)
- [ ] Add sort indicators (arrows)
- [ ] Implement pagination (page-based)
- [ ] Add items per page selector
- [ ] Add page navigation

**Step 3.4**: Bulk Actions (Strapi Pattern)
- [ ] Add checkbox column (first column)
- [ ] Implement bulk selection
- [ ] Add bulk action bar (bottom, appears on selection)
- [ ] Add bulk delete
- [ ] Add bulk publish
- [ ] Add bulk change status
- [ ] Show selection count

**Step 3.5**: List View Configuration
- [ ] Create configuration page (Settings + View sections)
- [ ] Implement Settings section (enable search, filters, bulk actions, etc.)
- [ ] Implement View section (drag & drop field arrangement)
- [ ] Add field edit modal (label, enable sort)
- [ ] Save configuration (persistent)
- [ ] Implement temporary configuration (quick toggle)

**Step 3.6**: Empty State
- [ ] Add empty state (large icon, message, Create button)
- [ ] Match Strapi's empty state design

### Phase 4: Entry Editor (Week 3-4, Following Strapi Pattern)

**Step 4.1**: Dynamic Form Builder
- [ ] Create `DynamicFormBuilder` component
- [ ] Load fields from content type with view configuration
- [ ] Generate form structure (respecting field order and width)
- [ ] Handle field groups (accordions)
- [ ] Handle conditional field visibility
- [ ] Integrate with React Hook Form

**Step 4.2**: Field Components (Strapi Interfaces)
- [ ] Create base field component
- [ ] Implement text field (input interface)
- [ ] Implement textarea field (textarea interface)
- [ ] Implement number field (numeric interface)
- [ ] Implement boolean field (boolean interface - FALSE/TRUE toggle)
- [ ] Implement date field (date interface)
- [ ] Implement datetime field (datetime interface)
- [ ] Implement file field (file interface)
- [ ] Implement media field (media-library interface)
- [ ] Implement relation field (relation interface - M2O, O2M, M2M)
- [ ] Implement select field (select-dropdown interface)
- [ ] Implement JSON field (json interface)
- [ ] Implement UID field (uid interface with Regenerate button)
- [ ] Implement email field (email interface)
- [ ] Implement password field (password interface with show/hide)
- [ ] Implement schema field (single/repeatable)
- [ ] Implement dynamic zone field

**Step 4.3**: Entry Editor Page (Strapi Layout)
- [ ] Create entry editor page with two-column layout
- [ ] Add header (Back link, title, ellipsis menu)
- [ ] Integrate dynamic form builder (main area)
- [ ] Add right sidebar (ENTRY panel with Save button)
- [ ] Add status management (draft/publish toggle)
- [ ] Add entry metadata display

**Step 4.4**: Rich Text Editor (Tiptap)
- [ ] Integrate Tiptap editor (wysiwyg interface)
- [ ] Configure toolbar (formatting, lists, links, etc.)
- [ ] Handle media insertion (opens media picker)
- [ ] Handle link insertion
- [ ] Match Strapi's rich text editor appearance

**Step 4.5**: Validation (Strapi Pattern)
- [ ] Implement field-level validation (real-time)
- [ ] Show validation errors below fields
- [ ] Show validation hints (e.g., "min. 3 characters")
- [ ] Prevent save on errors
- [ ] Highlight invalid fields

**Step 4.6**: Components & Dynamic Zones
- [ ] Implement non-repeatable components (add/delete)
- [ ] Implement repeatable components (add entry, reorder, delete)
- [ ] Implement dynamic zones (add component, selector, reorder, delete)
- [ ] Add drag & drop reordering (keyboard accessible)

**Step 4.7**: Relational Fields (Strapi Pattern)
- [ ] Implement one-choice relation (dropdown with search)
- [ ] Implement multiple-choice relation (multi-select, reorder)
- [ ] Add status indicators (blue/green dots)
- [ ] Add "Load more" pagination
- [ ] Add "Add or create a relation" placeholder
- [ ] Implement on-the-fly editing (click entry name)

**Step 4.8**: Edit View Configuration
- [ ] Create edit view configuration page
- [ ] Add Settings section (Entry title dropdown)
- [ ] Add View section (drag & drop field arrangement)
- [ ] Add field edit modal (label, description, placeholder, editable, size)
- [ ] Save configuration

**Step 4.9**: Ellipsis Menu
- [ ] Add ellipsis menu (top right)
- [ ] Add "Edit the model" link
- [ ] Add "Configure the view" link
- [ ] Add "Content History" link
- [ ] Add "Delete entry" option (red, with confirmation)

### Phase 5: Advanced Features (Week 4-5)

**Step 5.1**: Versioning UI
- [ ] Create versions page
- [ ] Display version list
- [ ] Add version comparison
- [ ] Add revert functionality

**Step 5.2**: Auto-save
- [ ] Implement auto-save logic
- [ ] Add save indicator
- [ ] Handle conflicts
- [ ] Add manual save option

**Step 5.3**: Status Workflow
- [ ] Add status change confirmation
- [ ] Add workflow validation
- [ ] Add status history

**Step 5.4**: Search & Indexing
- [ ] Implement search index building
- [ ] Add full-text search
- [ ] Add search highlighting

**Step 5.5**: Permissions
- [ ] Check create permissions
- [ ] Check update permissions
- [ ] Check delete permissions
- [ ] Check publish permissions
- [ ] Hide/disable actions based on permissions

### Phase 6: Polish & Optimization (Week 5)

**Step 6.1**: Performance
- [ ] Optimize queries (indexes)
- [ ] Add pagination limits
- [ ] Implement lazy loading
- [ ] Add caching (future)

**Step 6.2**: Error Handling
- [ ] Add comprehensive error messages
- [ ] Handle network errors
- [ ] Handle validation errors
- [ ] Add retry logic

**Step 6.3**: Testing
- [ ] Test all CRUD operations
- [ ] Test validation
- [ ] Test versioning
- [ ] Test bulk operations
- [ ] Test permissions

**Step 6.4**: Documentation
- [ ] Update API documentation
- [ ] Add code comments
- [ ] Create user guide (future)

---

## 5. Technical Considerations

### 5.1 Field Value Storage

**Current Approach**: Store all field values in `content_versions.data` as JSON

**Pros**:
- Flexible schema (no migration needed for new fields)
- Easy to version (entire object)
- Simple queries for full entry

**Cons**:
- Harder to query individual fields
- No type safety at database level
- Potential JSON size limits

**Alternative** (Future): Consider separate `field_values` table for better querying:
```sql
CREATE TABLE field_values (
  id CHAR(36) PRIMARY KEY,
  entry_id CHAR(36) NOT NULL,
  field_id CHAR(36) NOT NULL,
  value JSON,
  ...
)
```

### 5.2 Validation Strategy

**Client-side**: Real-time validation using field rules
**Server-side**: Re-validate on save/publish
**Database**: Constraints where possible (NOT NULL, etc.)

### 5.3 Performance

**Indexes**:
- `content_entries.content_type_id` ✅ (exists)
- `content_entries.status` ✅ (exists)
- `content_entries.published_at` ✅ (exists)
- `content_versions.entry_id` ✅ (exists)

**Query Optimization**:
- Use pagination for large lists
- Load only necessary fields
- Cache content type definitions
- Use database indexes effectively

### 5.4 Security

**Permissions**:
- Check `content_entry:create` permission
- Check `content_entry:read` permission
- Check `content_entry:update` permission
- Check `content_entry:delete` permission
- Check `content_entry:publish` permission

**Validation**:
- Validate all field values
- Sanitize user input
- Prevent SQL injection (using parameterized queries)
- Prevent XSS (sanitize output)

### 5.5 Scalability

**Future Considerations**:
- Implement search index (Elasticsearch/Algolia)
- Add caching layer (Redis)
- Implement CDN for media
- Add queue for bulk operations
- Implement webhooks for entry events

---

## 6. Success Criteria

### 6.1 Functional Requirements
- ✅ Users can create entries for any content type
- ✅ Users can edit entries with dynamic forms
- ✅ Users can delete entries
- ✅ Users can publish/unpublish entries
- ✅ Users can filter and search entries
- ✅ Users can perform bulk operations
- ✅ Field validation works correctly
- ✅ Versioning works correctly
- ✅ Auto-save works correctly

### 6.2 Non-Functional Requirements
- ✅ Page load time < 2 seconds
- ✅ Form validation feedback < 100ms
- ✅ Auto-save completes < 1 second
- ✅ Responsive on mobile/tablet/desktop
- ✅ Accessible (WCAG 2.1 AA)
- ✅ Works with 1000+ entries per content type

---

## 7. Future Enhancements

### 7.1 Short-term (Next Sprint)
- [ ] Entry duplication
- [ ] Entry preview
- [ ] Scheduled publish/unpublish UI
- [ ] Export entries (CSV/JSON)
- [ ] Import entries (CSV/JSON)

### 7.2 Medium-term (Next Quarter)
- [ ] Comments on entries
- [ ] Activity log UI
- [ ] Advanced search (filters)
- [ ] Saved views/filters
- [ ] Entry templates
- [ ] Workflow integration

### 7.3 Long-term (Future)
- [ ] GraphQL API
- [ ] Real-time collaboration
- [ ] Content staging
- [ ] Multi-language support
- [ ] Content scheduling calendar
- [ ] Analytics dashboard

---

## 8. Dependencies

### 8.1 Backend Dependencies
- ✅ `content-types` service (for field definitions)
- ✅ `projects` service (for project validation)
- ✅ `permissions` service (for access control)
- ✅ `users` service (for user tracking)

### 8.2 Frontend Dependencies
- ✅ `content-types` API client
- ✅ `projects` context
- ✅ `auth` context
- ✅ Form library (React Hook Form)
- ✅ Rich text editor (Tiptap)
- ✅ UI components (shadcn/ui)

### 8.3 New Dependencies Needed
- [ ] Tiptap (rich text editor)
- [ ] Date picker library
- [ ] File upload library
- [ ] JSON editor library
- [ ] Diff library (for version comparison)

---

## 9. Estimated Timeline

**Total**: 5 weeks (1 developer, full-time)

- **Week 1**: Backend Foundation
- **Week 2**: Frontend Foundation + Entries List
- **Week 3**: Entry Editor + Field Components
- **Week 4**: Advanced Features
- **Week 5**: Polish & Testing

**Note**: Timeline assumes existing infrastructure (auth, permissions, etc.) is in place.

---

## 10. Notes

- **Data Models = Content Types** (defined in Settings > Projects > [Project] > Data Model)
- **Data Model Manager = Content Manager** (interface for managing entries)
- **Entries = Actual data records** created from Data Models
- Field values stored in JSON format in `content_versions.data`
- **All entries are project-scoped** via content type (content_type_id → content_types.project_id)
- All frontend routes are project-scoped: `/dashboard/projects/[projectId]/data-model-manager/...`
- All backend endpoints require `projectId` as query parameter
- Versioning is automatic on every update
- Publishing creates a published version snapshot
- **UI/UX follows Strapi's Content Manager patterns** (see [Strapi Documentation](https://docs.strapi.io/cms/features/content-manager))
- **Menu Behavior**: Clicking "Data Model Manager" expands to show list of content types (same pattern as Data Model)
- **Default Selection**: First content type is automatically selected by default (same as Data Model)
- **Secondary Sidebar**: Uses same SecondarySidebarItem pattern as Data Model page
- Two-column layout: Secondary sidebar (content types list) + Main content area (entries)
- Data models shown as flat list in sidebar (not separated into Non-Singleton and Singleton)
- List view and edit view are configurable (per content type)
- **Menu Structure**: Data Model Manager appears in Settings > Projects > [Project] submenu, as sibling to Data Model

---

**Document Version**: 2.0  
**Last Updated**: 2026-02-17  
**Author**: AI Assistant  
**Status**: Updated for Project Scoping & Strapi UI/UX  
**Reference**: [Strapi Content Manager](https://docs.strapi.io/cms/features/content-manager)
