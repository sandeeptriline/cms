# Project CRUD Implementation Plan

## Overview

Add Project as a parent level between Tenant and Data Model, following the strict hierarchy:
**Tenant → Project → Data Model → Form Elements**

Currently, the database structure already supports this (projects table exists, content_types has project_id), but the UI/UX doesn't reflect this hierarchy. This plan outlines the implementation to make Projects fully functional in the application.

---

## 1. Current State Analysis

### 1.1 Database Structure ✅ (Already Exists)

**Projects Table** (`tenant-db.sql`):
```sql
CREATE TABLE IF NOT EXISTS projects (
    id                            CHAR(36)     NOT NULL PRIMARY KEY,
    name                          VARCHAR(255) NOT NULL,
    slug                          VARCHAR(100) NOT NULL,
    cloned_from_platform_theme_id CHAR(36)     NULL,
    config                        JSON         NULL,
    feature_flags                 JSON         NULL,
    created_at                    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_projects_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Content Types Table** (Already has project_id - REQUIRED):
```sql
CREATE TABLE IF NOT EXISTS content_types (
    id                CHAR(36)     NOT NULL PRIMARY KEY,
    project_id        CHAR(36)     NOT NULL,  -- ✅ Already exists, REQUIRED
    name              VARCHAR(100) NOT NULL,
    collection        VARCHAR(100) NOT NULL,
    ...
    CONSTRAINT fk_content_types_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
**Status**: ✅ `project_id` is `NOT NULL` (required) - **No changes needed**. Content types MUST belong to a project.

**Form Elements Table** (Already has project_id - NULLABLE):
```sql
CREATE TABLE IF NOT EXISTS form_elements (
    id                  CHAR(36)     NOT NULL PRIMARY KEY,
    project_id          CHAR(36)     NULL,  -- ✅ Already exists, NULLABLE
    ...
    CONSTRAINT fk_form_elements_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
**Status**: ✅ `project_id` is `NULL` (nullable) - **Already correct, no migration needed**.
- System form elements: `project_id = NULL` (available to all projects) ✅
- Project-specific form elements: `project_id = <project_id>` (scoped to project) ✅

### 1.2 Backend Status ⚠️ (Partially Implemented)

**Current Backend Behavior**:
- `ContentTypesService.getContentTypes()` accepts `projectId?: string` (optional parameter) ⚠️
- Falls back to first project if not specified (workaround)
- Filters content types by `project_id`
- **Issue**: Should require `projectId` instead of optional (to enforce strict hierarchy)

**Missing Backend APIs**:
- ❌ No Project CRUD endpoints
- ❌ No Project service
- ❌ No Project controller
- ❌ No Project DTOs

### 1.3 Frontend Status ❌ (Not Implemented)

**Current Frontend Behavior**:
- Data Model page (`/dashboard/settings/data-model`) doesn't show project selection
- No project management pages
- No project context/state management
- No project selection in navigation
- Breadcrumbs don't include project level

---

## 2. Implementation Plan

### Phase 1: Database Verification & Updates

#### 1.1 Verify Database Structure ✅ (Already Correct)

**Content Types Table**:
- ✅ `project_id` is `NOT NULL` (required) - **No changes needed**
- ✅ Foreign key constraint exists
- ✅ Index exists on `project_id`

**Form Elements Table**:
- ✅ `project_id` is `NULL` (nullable) - **Already correct, no migration needed**
- ✅ Foreign key constraint exists (allows NULL values)
- ✅ Index exists on `project_id`
- ✅ System elements use `project_id = NULL`
- ✅ Project-specific elements use `project_id = <project_id>`

**Verification SQL** (Run to confirm):
```sql
-- Verify content_types structure
DESCRIBE content_types;
-- Expected: project_id CHAR(36) NOT NULL

-- Verify form_elements structure
DESCRIBE form_elements;
-- Expected: project_id CHAR(36) NULL

-- Check existing data
SELECT 
    'content_types' as table_name,
    COUNT(*) as total,
    COUNT(project_id) as with_project_id,
    COUNT(*) - COUNT(project_id) as without_project_id
FROM content_types
UNION ALL
SELECT 
    'form_elements' as table_name,
    COUNT(*) as total,
    COUNT(project_id) as with_project_id,
    COUNT(*) - COUNT(project_id) as without_project_id
FROM form_elements;
```

**No Migration Needed**: Both tables are already correctly structured! ✅

#### 1.2 Verify Other Tables ✅ (All Correct)

**Tables with project_id**:
- ✅ `content_types` - `project_id NOT NULL` (required)
- ✅ `form_elements` - `project_id NULL` (nullable, for system elements)

**Tables with indirect project relationship**:
- ✅ `fields` - Has `content_type_id` → `content_types.project_id` (indirect)
- ✅ `content_entries` - Has `content_type_id` → `content_types.project_id` (indirect)

**All tables are correctly structured!** ✅

#### 1.3 Default Project Creation

**Ensure default project exists**:
```sql
-- Check if default project exists
SELECT * FROM projects WHERE slug = 'default' LIMIT 1;

-- If not, create default project
INSERT INTO projects (id, name, slug, config, feature_flags, created_at, updated_at)
VALUES (
    UUID(),
    'Default Project',
    'default',
    JSON_OBJECT(),
    JSON_OBJECT(),
    NOW(),
    NOW()
);
```

---

### Phase 2: Backend Implementation

#### 2.1 Create Project Entity/Model

**File**: `backend/src/projects/project.entity.ts` (if using TypeORM) or update Prisma schema

**Prisma Schema Update** (`backend/prisma/schema.prisma`):
```prisma
model Project {
  id                        String   @id @default(uuid())
  name                      String
  slug                      String   @unique
  cloned_from_platform_theme_id String?
  config                    Json?
  feature_flags             Json?
  createdAt                 DateTime @default(now()) @map("created_at")
  updatedAt                 DateTime @updatedAt @map("updated_at")

  contentTypes              ContentType[]
  formElements              FormElement[]

  @@map("projects")
}
```

#### 2.2 Create Project DTOs

**File**: `backend/src/projects/dto/create-project.dto.ts`
```typescript
export class CreateProjectDto {
  name: string;
  slug?: string; // Auto-generated from name if not provided
  config?: Record<string, any>;
  feature_flags?: Record<string, any>;
}
```

**File**: `backend/src/projects/dto/update-project.dto.ts`
```typescript
export class UpdateProjectDto {
  name?: string;
  slug?: string;
  config?: Record<string, any>;
  feature_flags?: Record<string, any>;
}
```

#### 2.3 Create Project Service

**File**: `backend/src/projects/projects.service.ts`

**Methods**:
```typescript
@Injectable()
export class ProjectsService {
  // Get all projects for a tenant
  async findAll(tenantId: string): Promise<Project[]>
  
  // Get project by ID
  async findOne(tenantId: string, projectId: string): Promise<Project>
  
  // Create new project
  async create(tenantId: string, createDto: CreateProjectDto): Promise<Project>
  
  // Update project
  async update(tenantId: string, projectId: string, updateDto: UpdateProjectDto): Promise<Project>
  
  // Delete project
  async remove(tenantId: string, projectId: string): Promise<void>
  
  // Get default project (first project or create one)
  async getDefaultProject(tenantId: string): Promise<Project>
}
```

#### 2.4 Create Project Controller

**File**: `backend/src/projects/projects.controller.ts`

**Endpoints**:
```typescript
@Controller('projects')
@UseGuards(TenantGuard)
export class ProjectsController {
  // GET /projects - Get all projects
  @Get()
  findAll(@TenantId() tenantId: string): Promise<Project[]>
  
  // GET /projects/:id - Get project by ID
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<Project>
  
  // POST /projects - Create project
  @Post()
  create(@TenantId() tenantId: string, @Body() createDto: CreateProjectDto): Promise<Project>
  
  // PATCH /projects/:id - Update project
  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() updateDto: UpdateProjectDto): Promise<Project>
  
  // DELETE /projects/:id - Delete project
  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<void>
}
```

#### 2.5 Update Content Types Service

**File**: `backend/src/content-types/content-types.service.ts`

**Current Issue**: `projectId` is optional with fallback to first project

**Changes Required**:
- ✅ Change `getContentTypes(tenantId: string, projectId?: string)` to `getContentTypes(tenantId: string, projectId: string)` (required)
- ❌ Remove fallback logic (no more auto-selecting first project)
- ✅ Update `createContentType()` to require `projectId` in DTO
- ✅ Update `updateContentType()` to verify `projectId` matches
- ✅ Update `deleteContentType()` to verify `projectId` matches
- ✅ Add validation: throw error if `projectId` is not provided

**Before**:
```typescript
async getContentTypes(tenantId: string, projectId?: string) {
  // Falls back to first project if not specified
  let projectIdToUse = projectId;
  if (!projectIdToUse) {
    const defaultProject = await client.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM projects ORDER BY created_at ASC LIMIT 1`
    );
    if (defaultProject.length === 0) {
      return [];
    }
    projectIdToUse = defaultProject[0].id;
  }
  // ...
}
```

**After**:
```typescript
async getContentTypes(tenantId: string, projectId: string) {
  if (!projectId) {
    throw new BadRequestException('projectId is required');
  }
  // No fallback - projectId is required
  // ...
}
```

#### 2.6 Update Form Elements Service

**File**: `backend/src/form-elements/form-elements.service.ts` (if exists)

**Changes**:
- Filter form elements by `project_id` (or `project_id IS NULL` for system elements)
- Ensure project-scoped form elements are only visible in their project

---

### Phase 3: Frontend API Client

#### 3.1 Create Projects API Client

**File**: `frontend/lib/api/projects.ts`

```typescript
export interface Project {
  id: string;
  name: string;
  slug: string;
  cloned_from_platform_theme_id?: string;
  config?: Record<string, any>;
  feature_flags?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectDto {
  name: string;
  slug?: string;
  config?: Record<string, any>;
  feature_flags?: Record<string, any>;
}

export interface UpdateProjectDto {
  name?: string;
  slug?: string;
  config?: Record<string, any>;
  feature_flags?: Record<string, any>;
}

export const projectsApi = {
  async getAll(): Promise<Project[]>
  async getById(id: string): Promise<Project>
  async create(data: CreateProjectDto): Promise<Project>
  async update(id: string, data: UpdateProjectDto): Promise<Project>
  async delete(id: string): Promise<void>
}
```

#### 3.2 Update Content Types API

**File**: `frontend/lib/api/content-types.ts`

**Changes**:
- Add `projectId` parameter to all methods
- Update `getAll()` to require `projectId`
- Update `create()` to require `projectId` in DTO

---

### Phase 4: Frontend Project Context & State Management

#### 4.1 Create Project Context

**File**: `frontend/contexts/project-context.tsx`

```typescript
interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  loading: boolean;
  setCurrentProject: (project: Project | null) => void;
  loadProjects: () => Promise<void>;
  createProject: (data: CreateProjectDto) => Promise<Project>;
  updateProject: (id: string, data: UpdateProjectDto) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
}

export function ProjectProvider({ children }: { children: React.ReactNode })
export function useProject(): ProjectContextType
```

**Features**:
- Store current project in localStorage/sessionStorage
- Load projects on mount
- Provide project context to all child components
- Auto-select default project if none selected

#### 4.2 Update Auth Context (if needed)

**File**: `frontend/contexts/auth-context.tsx`

**Changes**:
- Ensure project context is available after authentication
- Load default project after tenant selection

---

### Phase 5: Frontend UI - Project Management Pages

#### 5.1 Create Projects List Page

**File**: `frontend/app/dashboard/settings/projects/page.tsx`

**Features**:
- List all projects
- Create new project button
- Edit project button
- Delete project button (with confirmation)
- Project selection/switcher
- Search/filter projects

**Route**: `/dashboard/settings/projects`

#### 5.2 Create Project Create/Edit Modal

**File**: `frontend/app/dashboard/settings/projects/components/create-project-modal.tsx`
**File**: `frontend/app/dashboard/settings/projects/components/edit-project-modal.tsx`

**Form Fields**:
- Name (required)
- Slug (auto-generated from name, editable)
- Config (JSON editor, optional)
- Feature Flags (JSON editor, optional)

#### 5.3 Create Project Switcher Component

**File**: `frontend/components/project-switcher.tsx`

**Features**:
- Dropdown/select to switch between projects
- Show current project name
- Quick access to project settings
- Display in header or sidebar

---

### Phase 6: Frontend UI - Navigation Updates

#### 6.1 Update Menu Structure

**Current Structure**:
```
Settings
  ├─ Data Model
  ├─ Flows
  ├─ User Roles
  └─ ...
```

**New Structure**:
```
Settings
  ├─ Projects          ← NEW
  ├─ Data Model        ← Now under project
  ├─ Flows             ← Now under project
  ├─ User Roles
  └─ ...
```

#### 6.2 Update Settings Submenu

**File**: `frontend/components/layout/menu-items.ts`

**Changes**:
- Add "Projects" as first item in settings submenu
- Update "Data Model" to show project context
- Add project indicator/badge

#### 6.3 Update Data Model Page

**File**: `frontend/app/dashboard/settings/data-model/page.tsx`

**Changes**:
- Add project selector at top
- Filter content types by selected project
- Show project name in breadcrumbs
- Update API calls to include `projectId`

#### 6.4 Update Breadcrumbs

**File**: `frontend/components/layout/breadcrumbs.tsx` (if exists)

**Current Breadcrumb**:
```
Dashboard > Settings > Data Model
```

**New Breadcrumb**:
```
Dashboard > Settings > [Project Name] > Data Model
```

**Or**:
```
Dashboard > Settings > Projects > [Project Name] > Data Model
```

---

### Phase 7: Frontend UI - Route Structure Updates

#### 7.1 New Route Structure

**Current Routes**:
```
/dashboard/settings/data-model
/dashboard/settings/flows
```

**New Routes** (Option 1 - Project in URL):
```
/dashboard/settings/projects
/dashboard/settings/projects/[projectId]/data-model
/dashboard/settings/projects/[projectId]/flows
```

**New Routes** (Option 2 - Project in Context):
```
/dashboard/settings/projects
/dashboard/settings/data-model?projectId=xxx
/dashboard/settings/flows?projectId=xxx
```

**Recommendation**: **Option 1** (Project in URL) - Cleaner, more RESTful, better for bookmarking

#### 7.2 Update Route Guards

**File**: `frontend/middleware.ts` or route guards

**Changes**:
- Verify project exists and user has access
- Redirect to project selection if project invalid
- Auto-select default project if none in URL

---

### Phase 8: Frontend UI - Secondary Sidebar Updates

#### 8.1 Update Data Model Page Secondary Sidebar

**File**: `frontend/app/dashboard/settings/data-model/page.tsx`

**Current**: Shows list of data models
**New**: Shows list of data models filtered by current project

**Changes**:
- Filter `contentTypes` by `currentProject.id`
- Show project name in sidebar header
- Add project switcher in sidebar

#### 8.2 Update Other Settings Pages

**Pages to Update**:
- Flows page
- Any other project-scoped pages

---

### Phase 9: Form Elements Project Scoping

#### 9.1 Update Form Elements API

**File**: `frontend/lib/api/form-elements.ts`

**Changes**:
- Filter form elements by `project_id` (or `project_id IS NULL`)
- Show system elements + project-specific elements

#### 9.2 Update Add Field Modal

**File**: `frontend/app/dashboard/settings/data-model/components/add-field-modal.tsx`

**Changes**:
- Filter available form elements by current project
- Show project-specific form elements

---

### Phase 10: Testing & Validation

#### 10.1 Database Tests
- [ ] Verify project CRUD operations
- [ ] Verify content types are project-scoped
- [ ] Verify form elements project scoping
- [ ] Test cascade deletes

#### 10.2 Backend API Tests
- [ ] Test all project endpoints
- [ ] Test project-scoped content types
- [ ] Test project-scoped form elements
- [ ] Test permissions/access control

#### 10.3 Frontend Tests
- [ ] Test project creation/editing
- [ ] Test project switching
- [ ] Test data model filtering by project
- [ ] Test breadcrumbs
- [ ] Test navigation flow

---

## 3. Database Dependencies

### 3.1 Tables Affected ✅ (All Correct)

| Table | Current State | Changes Needed |
|-------|--------------|----------------|
| `projects` | ✅ Exists | None (already correct) |
| `content_types` | ✅ Has `project_id NOT NULL` | None (already correct) |
| `form_elements` | ✅ Has `project_id NULL` | None (already correct) |
| `fields` | ✅ Has `content_type_id` | None (indirect via content_type) |
| `content_entries` | ✅ Has `content_type_id` | None (indirect via content_type) |

### 3.2 Foreign Key Relationships ✅ (All Exist)

**Existing**:
- ✅ `content_types.project_id` → `projects.id` (CASCADE DELETE, NOT NULL)
- ✅ `form_elements.project_id` → `projects.id` (CASCADE DELETE, NULL allowed)

**No changes needed** - All foreign keys are correctly defined.

### 3.3 Indexes ✅ (All Exist)

**Existing**:
- ✅ `idx_content_types_project` on `content_types(project_id)`
- ✅ `idx_form_elements_project` on `form_elements(project_id)`

**No changes needed** - All indexes are correctly defined.

### 3.4 Summary

**Database Structure Status**: ✅ **Fully Ready**
- All tables have correct `project_id` columns
- All foreign keys are properly defined
- All indexes are in place
- **No database migrations needed** - structure is already correct!

**Note**: The only change needed is in the **backend service** to make `projectId` required instead of optional.

---

## 4. UI/UX Impact Analysis

### 4.1 Menu Structure

**Primary Sidebar** (Icon Menu):
- No changes needed ✅

**Secondary Sidebar** (Submenu):
- Add "Projects" as first item in Settings submenu
- Show project name/indicator
- Add project switcher

**Settings Submenu Structure**:
```
Settings
  ├─ Projects          ← NEW (first item)
  ├─ ─────────────────  (divider)
  ├─ Data Model        (now project-scoped)
  ├─ Flows             (now project-scoped)
  ├─ User Roles
  ├─ Access Policies
  └─ ...
```

### 4.2 Page Structure

**New Pages**:
1. `/dashboard/settings/projects` - Projects list page
2. `/dashboard/settings/projects/[projectId]/data-model` - Data Model (project-scoped)
3. `/dashboard/settings/projects/[projectId]/flows` - Flows (project-scoped)

**Updated Pages**:
1. `/dashboard/settings/data-model` → Redirect to project-scoped version
2. All project-scoped settings pages

### 4.3 Breadcrumbs

**Current**:
```
Dashboard > Settings > Data Model
```

**New**:
```
Dashboard > Settings > Projects > [Project Name] > Data Model
```

**Or Simplified**:
```
Dashboard > Settings > [Project Name] > Data Model
```

### 4.4 Header Updates

**Add Project Switcher**:
- Dropdown in header showing current project
- Quick switch between projects
- Link to project settings

**Project Indicator**:
- Show project name/badge in header
- Visual indicator of current project context

### 4.5 Navigation Flow

**User Journey**:
1. User logs in → Default project selected
2. User navigates to Settings → Sees project in context
3. User clicks "Projects" → Sees all projects
4. User selects project → Context switches
5. User navigates to Data Model → Sees project-scoped data models
6. User creates data model → Automatically assigned to current project

### 4.6 Empty States

**No Projects**:
- Show "Create your first project" message
- Provide create project button

**No Data Models in Project**:
- Show "No data models in [Project Name]" message
- Provide create data model button

---

## 5. Implementation Order

### Step 1: Database Verification (1 day)
1. Verify `form_elements` table structure
2. Add `project_id` if missing
3. Create default project if needed
4. Run migrations

### Step 2: Backend APIs (2-3 days)
1. Create Project entity/DTOs
2. Create Project service
3. Create Project controller
4. Update Content Types service
5. Update Form Elements service (if exists)
6. Test all endpoints

### Step 3: Frontend API Client (0.5 day)
1. Create projects API client
2. Update content types API
3. Test API calls

### Step 4: Project Context (1 day)
1. Create Project context/provider
2. Integrate with auth context
3. Add project state management
4. Test context usage

### Step 5: Project Management UI (2 days)
1. Create projects list page
2. Create project create/edit modals
3. Create project switcher component
4. Test CRUD operations

### Step 6: Navigation Updates (1-2 days)
1. Update settings submenu
2. Update breadcrumbs
3. Update route structure
4. Add project to URLs
5. Test navigation flow

### Step 7: Data Model Page Updates (1 day)
1. Add project selector
2. Filter by project
3. Update API calls
4. Test filtering

### Step 8: Form Elements Updates (1 day)
1. Update form elements API
2. Filter by project
3. Update add field modal
4. Test project scoping

### Step 9: Testing & Polish (2 days)
1. End-to-end testing
2. Fix bugs
3. UI polish
4. Documentation

**Total Estimated Time**: 10-12 days

---

## 6. Migration Strategy

### 6.1 Existing Data

**Scenario**: Existing content types without explicit project assignment

**Solution**:
1. Create default project if doesn't exist
2. Assign all existing content types to default project
3. Update `content_types.project_id` to default project ID

**SQL**:
```sql
-- Create default project if doesn't exist
INSERT INTO projects (id, name, slug, created_at, updated_at)
SELECT UUID(), 'Default Project', 'default', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE slug = 'default');

-- Assign existing content types to default project
UPDATE content_types ct
SET project_id = (SELECT id FROM projects WHERE slug = 'default' LIMIT 1)
WHERE project_id IS NULL OR project_id = '';
```

### 6.2 User Experience

**First Time Users**:
- Auto-create default project
- Auto-select default project
- Show welcome message with project creation option

**Existing Users**:
- Migrate existing data to default project
- Show migration notice
- Allow project creation/management

---

## 7. Questions & Decisions Needed

### 7.1 Route Structure
- **Question**: Should project be in URL path or query parameter?
- **Recommendation**: URL path (`/projects/[projectId]/data-model`)
- **Reason**: Cleaner, more RESTful, better for bookmarking

### 7.2 Project Selection
- **Question**: Should project be selectable per-page or global context?
- **Recommendation**: Global context (stored in context/localStorage)
- **Reason**: Better UX, consistent across pages

### 7.3 Default Project
- **Question**: Should we auto-create default project or require explicit creation?
- **Recommendation**: Auto-create on first use
- **Reason**: Better UX, no friction for new users

### 7.4 Form Elements Scoping
- **Question**: Should form elements be project-scoped or tenant-scoped?
- **Recommendation**: Hybrid (system elements tenant-scoped, custom elements project-scoped)
- **Reason**: Flexibility, system elements available everywhere

### 7.5 Permissions
- **Question**: Should project access be permission-controlled?
- **Recommendation**: Yes, but start simple (all users see all projects)
- **Reason**: Future-proof, can add permissions later

---

## 8. Success Criteria

### 8.1 Functional Requirements
- [ ] Users can create projects
- [ ] Users can edit projects
- [ ] Users can delete projects
- [ ] Users can switch between projects
- [ ] Data models are project-scoped
- [ ] Form elements are project-scoped (where applicable)
- [ ] Navigation shows project context
- [ ] Breadcrumbs include project level

### 8.2 UI/UX Requirements
- [ ] Project switcher is easily accessible
- [ ] Current project is clearly visible
- [ ] Navigation flow is intuitive
- [ ] Empty states are helpful
- [ ] Error states are clear

### 8.3 Technical Requirements
- [ ] All API endpoints work correctly
- [ ] Database relationships are correct
- [ ] Performance is acceptable
- [ ] No data loss during migration
- [ ] Backward compatibility maintained (where possible)

---

## 9. Files to Create/Modify

### Backend Files

**New Files**:
- `backend/src/projects/projects.module.ts`
- `backend/src/projects/projects.controller.ts`
- `backend/src/projects/projects.service.ts`
- `backend/src/projects/dto/create-project.dto.ts`
- `backend/src/projects/dto/update-project.dto.ts`
- `backend/src/projects/entities/project.entity.ts` (if TypeORM)

**Modified Files**:
- `backend/src/content-types/content-types.service.ts`
- `backend/src/content-types/content-types.controller.ts`
- `backend/src/form-elements/form-elements.service.ts` (if exists)
- `backend/prisma/schema.prisma` (if using Prisma)

### Frontend Files

**New Files**:
- `frontend/lib/api/projects.ts`
- `frontend/contexts/project-context.tsx`
- `frontend/app/dashboard/settings/projects/page.tsx`
- `frontend/app/dashboard/settings/projects/components/create-project-modal.tsx`
- `frontend/app/dashboard/settings/projects/components/edit-project-modal.tsx`
- `frontend/components/project-switcher.tsx`

**Modified Files**:
- `frontend/lib/api/content-types.ts`
- `frontend/lib/api/form-elements.ts`
- `frontend/app/dashboard/settings/data-model/page.tsx`
- `frontend/components/layout/menu-items.ts`
- `frontend/components/layout/breadcrumbs.tsx` (if exists)
- `frontend/components/layout/header.tsx`
- `frontend/app/dashboard/settings/data-model/components/add-field-modal.tsx`

### Database Files

**New Files**:
- `docs/sql-scripts/add-project-id-to-form-elements.sql` (if needed)
- `docs/sql-scripts/migrate-existing-data-to-default-project.sql`

**Modified Files**:
- `docs/core/tenant-db.sql` (documentation only)

---

## 10. Next Steps

1. **Review this plan** with team
2. **Make decisions** on open questions
3. **Start with Phase 1** (Database verification)
4. **Implement incrementally** following the order
5. **Test thoroughly** at each phase
6. **Document changes** as you go

---

**Last Updated**: 2026-02-13
**Status**: Planning
**Priority**: High
