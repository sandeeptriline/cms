# Project CRUD Implementation Plan - Final Comprehensive

## Overview

Add Project as a parent level between Tenant and Data Model, following the strict hierarchy:
**Tenant → Project → Data Model → Form Elements**

**Status**: The database structure already fully supports this (21 tables with proper project relationships). This plan outlines the complete implementation to make Projects fully functional in both backend and frontend.

**Key Finding**: Complete database analysis revealed that **all 21 tables** are already correctly structured with proper `project_id` relationships. No database migrations are needed - only code and UI changes are required.

---

## 1. Database Structure Analysis

Based on the actual tenant database dump (`cms_tenant_auth_test_tenant_1`), here's the complete structure:

### 1.1 Tables with `project_id NOT NULL` (Required - 15 tables)

These tables **require** a project and will be deleted when a project is deleted (CASCADE):

1. **`api_keys`** - API keys scoped to projects
2. **`content_types`** - Data models
3. **`flows`** - Automation flows
4. **`locales`** - Project-specific locales
5. **`media_assets`** - Media files
6. **`media_folders`** - Media folder structure
7. **`permissions`** - Collection permissions (scoped to project collections)
8. **`project_members`** - User-project associations
9. **`relations`** - Collection relationships (project-scoped)
10. **`rest_schema_cache`** - REST API schema cache
11. **`shares`** - Shared content items
12. **`themes`** - Project themes
13. **`theme_assignments`** - Theme-to-entry assignments
14. **`webhooks`** - Webhook configurations
15. **`workflows`** - Workflow definitions

**Foreign Keys**: All have `ON DELETE CASCADE` to `projects.id`

### 1.2 Tables with `project_id NULL` (Optional - 6 tables)

These tables use `project_id` for filtering but can exist without it:

1. **`activity`** - Activity logs (for faster filtering) - `ON DELETE SET NULL`
2. **`comments`** - Comments on items (for faster filtering) - `ON DELETE SET NULL`
3. **`form_elements`** - Form field types (NULL = system elements) - `ON DELETE CASCADE`
4. **`presets`** - Saved views (can be project-specific or global) - `ON DELETE CASCADE`
5. **`revisions`** - Content revisions (for faster filtering) - `ON DELETE SET NULL`
6. **`settings`** - **Special case**: NULL = tenant-level, NOT NULL = project-level - `ON DELETE CASCADE`

**Special Handling**:
- **`settings`**: Dual-mode table - `project_id IS NULL` = tenant settings, `project_id IS NOT NULL` = project settings
- **`form_elements`**: `project_id IS NULL` = system elements (available to all projects), `project_id = ?` = project-specific

### 1.3 Tables with Indirect Project Relationship (5 tables)

These tables don't have `project_id` but are linked via other tables:

1. **`fields`** - Via `content_type_id` → `content_types.project_id`
2. **`content_entries`** - Via `content_type_id` → `content_types.project_id`
3. **`content_versions`** - Via `entry_id` → `content_entries` → `content_types.project_id`
4. **`operations`** - Via `flow_id` → `flows.project_id`
5. **`workflow_instances`** - Via `workflow_id` → `workflows.project_id`

### 1.4 Foreign Key Relationships

All foreign keys are properly configured:

- **CASCADE DELETE**: Most tables (deleted when project deleted)
- **SET NULL**: `activity`, `comments`, `revisions` (optional filtering fields)
- **Unique Constraints**: 
  - `content_types`: `uk_content_types_project_collection` (project_id, collection)
  - `form_elements`: `uk_form_elements_project_key` (project_id, key) - allows NULL
  - `locales`: `uk_locales_project_code` (project_id, code)
  - `settings`: `uk_settings_project` (project_id) - allows NULL

### 1.5 Database Verification Status ✅

**Status**: All tables are correctly structured. **No migrations required.**

**Verification Checklist**:
- ✅ `projects` table exists with correct structure
- ✅ 15 tables have `project_id NOT NULL` with CASCADE DELETE
- ✅ 6 tables have `project_id NULL` for optional filtering
- ✅ All foreign keys are properly defined
- ✅ All indexes are in place
- ✅ Unique constraints allow proper scoping
- ✅ Default project already exists in database
- ✅ All existing data already assigned to projects

---

## 2. Current State Analysis

### 2.1 Backend Status ⚠️ (Partially Implemented)

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

**Services Needing Updates** (19 total):
- **15 services** for NOT NULL tables (require `projectId` parameter)
- **4 services** for optional tables (filter by `projectId` when provided)

### 2.2 Frontend Status ❌ (Not Implemented)

**Current Frontend Behavior**:
- Data Model page (`/dashboard/settings/data-model`) doesn't show project selection
- No project management pages
- No project context/state management
- No project selection in navigation
- Breadcrumbs don't include project level

**Pages Needing Updates** (10 total):
- All project-scoped settings pages need project context
- Navigation and breadcrumbs need project level

---

## 3. Implementation Plan

### Phase 1: Database Verification ✅ (Complete - No Changes Needed)

**Status**: All tables are correctly structured. No migrations required.

**Action**: Verify existing data is correctly assigned (already confirmed).

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

  // Relationships
  contentTypes              ContentType[]
  formElements              FormElement[]
  apiKeys                   ApiKey[]
  flows                     Flow[]
  locales                   Locale[]
  mediaAssets               MediaAsset[]
  mediaFolders              MediaFolder[]
  permissions               Permission[]
  projectMembers            ProjectMember[]
  relations                 Relation[]
  restSchemaCache           RestSchemaCache?
  shares                    Share[]
  themes                    Theme[]
  themeAssignments          ThemeAssignment[]
  webhooks                  Webhook[]
  workflows                 Workflow[]
  settings                  Settings?

  @@map("projects")
}
```

#### 2.2 Create Project DTOs

**File**: `backend/src/projects/dto/create-project.dto.ts`
```typescript
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string; // Auto-generated from name if not provided

  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @IsObject()
  @IsOptional()
  feature_flags?: Record<string, any>;
}
```

**File**: `backend/src/projects/dto/update-project.dto.ts`
```typescript
import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @IsObject()
  @IsOptional()
  feature_flags?: Record<string, any>;
}
```

#### 2.3 Create Project Service

**File**: `backend/src/projects/projects.service.ts`

**Methods**:
```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  // Get all projects for a tenant
  async findAll(tenantId: string): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: {
        // Add tenant filtering if needed
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Get project by ID
  async findOne(tenantId: string, projectId: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    return project;
  }

  // Create new project
  async create(tenantId: string, createDto: CreateProjectDto): Promise<Project> {
    // Auto-generate slug if not provided
    const slug = createDto.slug || this.generateSlug(createDto.name);

    // Check if slug already exists
    const existing = await this.prisma.project.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new BadRequestException(`Project with slug "${slug}" already exists`);
    }

    return this.prisma.project.create({
      data: {
        name: createDto.name,
        slug,
        config: createDto.config || {},
        feature_flags: createDto.feature_flags || {},
      },
    });
  }

  // Update project
  async update(
    tenantId: string,
    projectId: string,
    updateDto: UpdateProjectDto,
  ): Promise<Project> {
    await this.findOne(tenantId, projectId); // Verify exists

    const updateData: any = {};
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.slug !== undefined) updateData.slug = updateDto.slug;
    if (updateDto.config !== undefined) updateData.config = updateDto.config;
    if (updateDto.feature_flags !== undefined) updateData.feature_flags = updateDto.feature_flags;

    return this.prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });
  }

  // Delete project
  async remove(tenantId: string, projectId: string): Promise<void> {
    // Check if it's the only project (prevent deletion)
    const projectCount = await this.prisma.project.count();
    if (projectCount <= 1) {
      throw new BadRequestException('Cannot delete the only project');
    }

    // Get counts of affected records (for warning)
    const affectedCounts = await this.getAffectedRecordCounts(projectId);

    // Delete project (CASCADE DELETE will handle dependent tables)
    await this.prisma.project.delete({
      where: { id: projectId },
    });
  }

  // Get default project (first project or create one)
  async getDefaultProject(tenantId: string): Promise<Project> {
    const projects = await this.findAll(tenantId);
    if (projects.length > 0) {
      return projects[0];
    }

    // Create default project if none exists
    return this.create(tenantId, {
      name: 'Default Project',
      slug: 'default',
    });
  }

  // Helper: Generate slug from name
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Helper: Get counts of records that will be deleted
  private async getAffectedRecordCounts(projectId: string) {
    // Count records in each dependent table
    // This is for showing warning to user before deletion
    return {
      contentTypes: await this.prisma.contentType.count({ where: { projectId } }),
      flows: await this.prisma.flow.count({ where: { projectId } }),
      // ... count other tables
    };
  }
}
```

#### 2.4 Create Project Controller

**File**: `backend/src/projects/projects.controller.ts`

**Endpoints**:
```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('projects')
@UseGuards(TenantGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // GET /projects - Get all projects
  @Get()
  findAll(@TenantId() tenantId: string): Promise<Project[]> {
    return this.projectsService.findAll(tenantId);
  }

  // GET /projects/:id - Get project by ID
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string): Promise<Project> {
    return this.projectsService.findOne(tenantId, id);
  }

  // POST /projects - Create project
  @Post()
  create(
    @TenantId() tenantId: string,
    @Body() createDto: CreateProjectDto,
  ): Promise<Project> {
    return this.projectsService.create(tenantId, createDto);
  }

  // PATCH /projects/:id - Update project
  @Patch(':id')
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateProjectDto,
  ): Promise<Project> {
    return this.projectsService.update(tenantId, id, updateDto);
  }

  // DELETE /projects/:id - Delete project
  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.projectsService.remove(tenantId, id);
  }
}
```

#### 2.5 Create Projects Module

**File**: `backend/src/projects/projects.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
```

#### 2.6 Update All Project-Scoped Services

**Priority: High** - Content Types Service (required for data models)

**File**: `backend/src/content-types/content-types.service.ts`

**Current Issue**: `projectId` is optional with fallback to first project

**Changes Required**:
```typescript
// BEFORE
async getContentTypes(tenantId: string, projectId?: string) {
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

// AFTER
async getContentTypes(tenantId: string, projectId: string) {
  if (!projectId) {
    throw new BadRequestException('projectId is required');
  }
  // Verify project exists
  await this.projectsService.findOne(tenantId, projectId);
  // No fallback - projectId is required
  return this.prisma.contentType.findMany({
    where: { projectId },
    // ...
  });
}
```

**All Methods to Update**:
- `getContentTypes()` - Require `projectId`
- `createContentType()` - Require `projectId` in DTO
- `updateContentType()` - Verify `projectId` matches
- `deleteContentType()` - Verify `projectId` matches

**Services to Update** (15 services for NOT NULL tables):

1. **Content Types Service** - Change `projectId?: string` → `projectId: string` (required)
2. **Flows Service** - Ensure all methods require `projectId`, filter by `project_id`
3. **Locales Service** - Filter by `project_id`, ensure project context
4. **Media Service** - Filter `media_assets` and `media_folders` by `project_id`
5. **Permissions Service** - Filter by `project_id`, permissions scoped to project collections
6. **API Keys Service** - Filter by `project_id`, ensure project context
7. **Webhooks Service** - Filter by `project_id`
8. **Workflows Service** - Filter by `project_id`
9. **Themes Service** - Filter by `project_id`
10. **Relations Service** - Filter by `project_id`
11. **Shares Service** - Filter by `project_id`
12. **Project Members Service** - Filter by `project_id`
13. **REST Schema Cache Service** - Filter by `project_id`
14. **Form Elements Service** - Filter by `project_id IS NULL OR project_id = ?` (system + project-specific)
15. **Settings Service** - Handle both NULL (tenant-level) and NOT NULL (project-level) settings

**Services for Optional Project Tables** (4 services):

- **Activity Service**: Filter by `project_id` when provided (optional)
- **Comments Service**: Filter by `project_id` when provided (optional)
- **Presets Service**: Filter by `project_id` when provided (optional)
- **Revisions Service**: Filter by `project_id` when provided (optional)

**Form Elements Service Special Logic**:
```typescript
async getFormElements(tenantId: string, projectId: string) {
  return this.prisma.formElement.findMany({
    where: {
      OR: [
        { projectId: null }, // System elements
        { projectId }, // Project-specific elements
      ],
      isActive: true,
    },
    orderBy: { sortOrder: 'asc' },
  });
}
```

**Settings Service Special Logic**:
```typescript
async getSettings(tenantId: string, projectId?: string) {
  if (projectId) {
    // Get project-level settings
    return this.prisma.settings.findUnique({
      where: { projectId },
    });
  } else {
    // Get tenant-level settings (project_id IS NULL)
    return this.prisma.settings.findUnique({
      where: { projectId: null },
    });
  }
}
```

---

### Phase 3: Frontend API Client

#### 3.1 Create Projects API Client

**File**: `frontend/lib/api/projects.ts`

```typescript
import { apiClient } from './client';

export interface Project {
  id: string;
  name: string;
  slug: string;
  cloned_from_platform_theme_id?: string;
  config?: Record<string, any>;
  feature_flags?: Record<string, any>;
  created_at: string;
  updated_at: string;
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
  async getAll(): Promise<Project[]> {
    const response = await apiClient.get<Project[]>('/projects');
    return response.data;
  },

  async getById(id: string): Promise<Project> {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response.data;
  },

  async create(data: CreateProjectDto): Promise<Project> {
    const response = await apiClient.post<Project>('/projects', data);
    return response.data;
  },

  async update(id: string, data: UpdateProjectDto): Promise<Project> {
    const response = await apiClient.patch<Project>(`/projects/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  },
};
```

#### 3.2 Update Content Types API

**File**: `frontend/lib/api/content-types.ts`

**Changes**:
- Add `projectId` parameter to all methods
- Update `getAll()` to require `projectId`
- Update `create()` to require `projectId` in DTO

```typescript
// BEFORE
export const contentTypesApi = {
  async getAll(): Promise<ContentType[]> {
    // ...
  },
  async create(data: CreateContentTypeDto): Promise<ContentType> {
    // ...
  },
};

// AFTER
export const contentTypesApi = {
  async getAll(projectId: string): Promise<ContentType[]> {
    const response = await apiClient.get<ContentType[]>(`/content-types?projectId=${projectId}`);
    return response.data;
  },
  async create(projectId: string, data: CreateContentTypeDto): Promise<ContentType> {
    const response = await apiClient.post<ContentType>('/content-types', {
      ...data,
      projectId,
    });
    return response.data;
  },
};
```

---

### Phase 4: Frontend Project Context & State Management

#### 4.1 Create Project Context

**File**: `frontend/contexts/project-context.tsx`

```typescript
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectsApi, Project, CreateProjectDto, UpdateProjectDto } from '@/lib/api/projects';

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  loading: boolean;
  error: string | null;
  setCurrentProject: (project: Project | null) => void;
  loadProjects: () => Promise<void>;
  createProject: (data: CreateProjectDto) => Promise<Project>;
  updateProject: (id: string, data: UpdateProjectDto) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const PROJECT_STORAGE_KEY = 'current_project_id';

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load projects from API
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectsApi.getAll();
      setProjects(data);

      // Restore current project from localStorage
      const savedProjectId = localStorage.getItem(PROJECT_STORAGE_KEY);
      if (savedProjectId) {
        const project = data.find((p) => p.id === savedProjectId);
        if (project) {
          setCurrentProjectState(project);
          return;
        }
      }

      // Auto-select first project if none selected
      if (data.length > 0 && !currentProject) {
        setCurrentProjectState(data[0]);
        localStorage.setItem(PROJECT_STORAGE_KEY, data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  // Set current project
  const setCurrentProject = useCallback((project: Project | null) => {
    setCurrentProjectState(project);
    if (project) {
      localStorage.setItem(PROJECT_STORAGE_KEY, project.id);
    } else {
      localStorage.removeItem(PROJECT_STORAGE_KEY);
    }
  }, []);

  // Create project
  const createProject = useCallback(async (data: CreateProjectDto): Promise<Project> => {
    const project = await projectsApi.create(data);
    await loadProjects();
    setCurrentProject(project);
    return project;
  }, [loadProjects, setCurrentProject]);

  // Update project
  const updateProject = useCallback(async (id: string, data: UpdateProjectDto): Promise<Project> => {
    const project = await projectsApi.update(id, data);
    await loadProjects();
    if (currentProject?.id === id) {
      setCurrentProject(project);
    }
    return project;
  }, [loadProjects, setCurrentProject, currentProject]);

  // Delete project
  const deleteProject = useCallback(async (id: string): Promise<void> => {
    await projectsApi.delete(id);
    await loadProjects();
    if (currentProject?.id === id) {
      // Switch to first available project
      const remaining = projects.filter((p) => p.id !== id);
      if (remaining.length > 0) {
        setCurrentProject(remaining[0]);
      } else {
        setCurrentProject(null);
      }
    }
  }, [loadProjects, setCurrentProject, currentProject, projects]);

  // Refresh projects
  const refreshProjects = useCallback(async () => {
    await loadProjects();
  }, [loadProjects]);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        loading,
        error,
        setCurrentProject,
        loadProjects,
        createProject,
        updateProject,
        deleteProject,
        refreshProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextType {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
```

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
- Delete project button (with confirmation showing affected records)
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
  ├─ Projects          ← NEW (first item)
  ├─ ─────────────────  (divider)
  ├─ Data Model        (now project-scoped)
  ├─ Flows             (now project-scoped)
  ├─ Media             (now project-scoped)
  ├─ Permissions       (now project-scoped)
  ├─ API Keys          (now project-scoped)
  ├─ Webhooks          (now project-scoped)
  ├─ Workflows         (now project-scoped)
  ├─ Themes            (now project-scoped)
  ├─ Locales           (now project-scoped)
  ├─ ─────────────────  (divider)
  ├─ User Roles
  ├─ Access Policies
  └─ ...
```

#### 6.2 Update Settings Submenu

**File**: `frontend/components/layout/menu-items.ts`

**Changes**:
- Add "Projects" as first item in settings submenu
- Update project-scoped items to show project context
- Add project indicator/badge

#### 6.3 Update Breadcrumbs

**File**: `frontend/components/layout/breadcrumbs.tsx` (if exists)

**Current Breadcrumb**:
```
Dashboard > Settings > Data Model
```

**New Breadcrumb**:
```
Dashboard > Settings > Projects > [Project Name] > Data Model
```

Or Simplified:
```
Dashboard > Settings > [Project Name] > Data Model
```

---

### Phase 7: Frontend UI - Route Structure Updates

#### 7.1 New Route Structure

**Recommended Structure** (Project in URL - Option 1):

```
/dashboard/settings/projects                          → Projects list
/dashboard/settings/projects/[projectId]/data-model   → Data Model (project-scoped)
/dashboard/settings/projects/[projectId]/flows        → Flows (project-scoped)
/dashboard/settings/projects/[projectId]/media         → Media (project-scoped)
/dashboard/settings/projects/[projectId]/permissions  → Permissions (project-scoped)
/dashboard/settings/projects/[projectId]/api-keys     → API Keys (project-scoped)
/dashboard/settings/projects/[projectId]/webhooks     → Webhooks (project-scoped)
/dashboard/settings/projects/[projectId]/workflows   → Workflows (project-scoped)
/dashboard/settings/projects/[projectId]/themes       → Themes (project-scoped)
/dashboard/settings/projects/[projectId]/locales       → Locales (project-scoped)
/dashboard/settings/projects/[projectId]/settings      → Project Settings
/dashboard/settings                                    → Tenant Settings (project_id = NULL)
```

**Recommendation**: **Option 1** (Project in URL) - Cleaner, more RESTful, better for bookmarking

#### 7.2 Update Route Guards

**File**: `frontend/middleware.ts` or route guards

**Changes**:
- Verify project exists and user has access
- Redirect to project selection if project invalid
- Auto-select default project if none in URL

---

### Phase 8: Update All Project-Scoped Pages

**Pages Requiring Project Context** (10 pages):

1. **Data Model Page** (`frontend/app/dashboard/settings/data-model/page.tsx`)
   - Filter content types by current project
   - Show project selector
   - Update API calls to include `projectId`

2. **Flows Page** (`frontend/app/dashboard/settings/flows/page.tsx`)
   - Filter flows by current project
   - Show project selector

3. **Media Library** (`frontend/app/dashboard/files/page.tsx`)
   - Filter media by current project
   - Show project selector

4. **Permissions Page** (`frontend/app/dashboard/settings/access-policies/page.tsx`)
   - Filter permissions by current project
   - Show project selector

5. **API Keys Page** (`frontend/app/dashboard/settings/api-keys/page.tsx`)
   - Filter API keys by current project
   - Show project selector

6. **Webhooks Page** (`frontend/app/dashboard/settings/webhooks/page.tsx`)
   - Filter webhooks by current project
   - Show project selector

7. **Workflows Page** (`frontend/app/dashboard/settings/workflows/page.tsx`)
   - Filter workflows by current project
   - Show project selector

8. **Themes Page** (`frontend/app/dashboard/settings/themes/page.tsx`)
   - Filter themes by current project
   - Show project selector

9. **Locales Page** (`frontend/app/dashboard/settings/locales/page.tsx`)
   - Filter locales by current project
   - Show project selector

10. **Settings Page** (`frontend/app/dashboard/settings/page.tsx`)
    - **Special**: Show project-level settings when project selected
    - Show tenant-level settings when project is NULL
    - Allow switching between tenant and project context
    - Project settings override tenant settings where applicable

---

### Phase 9: Form Elements Project Scoping

#### 9.1 Update Form Elements API

**File**: `frontend/lib/api/form-elements.ts`

**Changes**:
- Filter form elements by `project_id` (or `project_id IS NULL`)
- Show system elements + project-specific elements

```typescript
export const formElementsApi = {
  async getAll(projectId: string): Promise<FormElement[]> {
    const response = await apiClient.get<FormElement[]>(
      `/form-elements?projectId=${projectId}`
    );
    return response.data;
  },
};
```

#### 9.2 Update Add Field Modal

**File**: `frontend/app/dashboard/settings/data-model/components/add-field-modal.tsx`

**Changes**:
- Filter available form elements by current project
- Show project-specific form elements
- Use `useProject()` hook to get current project

---

## 4. Implementation Priority

### High Priority (Core Functionality) - Week 1-2

1. **Project CRUD APIs** (Backend)
   - Project Service & Controller
   - Project DTOs
   - Project Module

2. **Project Context** (Frontend)
   - Project Context Provider
   - Project API Client
   - localStorage integration

3. **Content Types Service Update** (Backend)
   - Make `projectId` required
   - Remove fallback logic
   - Add validation

4. **Data Model Page Updates** (Frontend)
   - Add project selector
   - Filter by project
   - Update API calls

5. **Project Switcher Component** (Frontend)
   - Dropdown component
   - Header/sidebar integration

### Medium Priority (Project-Scoped Features) - Week 3-4

6. **Flows Service and Page**
   - Backend service update
   - Frontend page update

7. **Media Service and Page**
   - Backend service update
   - Frontend page update

8. **Permissions Service and Page**
   - Backend service update
   - Frontend page update

9. **Form Elements Filtering**
   - Backend service update
   - Frontend API update
   - Add Field Modal update

### Low Priority (Optional Features) - Week 5+

10. **API Keys, Webhooks, Workflows, Themes, Locales Pages**
    - Backend service updates
    - Frontend page updates

11. **Settings Page** (tenant vs project)
    - Dual-mode implementation
    - Context switching

12. **Activity/Comments/Revisions Filtering**
    - Optional filtering by project

---

## 5. Project Deletion Safety

### Before Deleting a Project

1. **Check if it's the only project** (prevent deletion)
   ```typescript
   const projectCount = await this.prisma.project.count();
   if (projectCount <= 1) {
     throw new BadRequestException('Cannot delete the only project');
   }
   ```

2. **Warn user about CASCADE DELETE** affecting 15 tables:
   - api_keys
   - content_types
   - flows
   - locales
   - media_assets
   - media_folders
   - permissions
   - project_members
   - relations
   - rest_schema_cache
   - shares
   - themes
   - theme_assignments
   - webhooks
   - workflows

3. **Show count of affected records** for each table

4. **Require explicit confirmation** with project name typed

**Frontend Implementation**:
```typescript
const handleDelete = async (project: Project) => {
  // Get affected counts
  const counts = await getAffectedCounts(project.id);
  
  // Show confirmation dialog with counts
  const confirmed = await showDeleteConfirmation({
    projectName: project.name,
    affectedCounts: counts,
  });
  
  if (confirmed) {
    await projectsApi.delete(project.id);
  }
};
```

---

## 6. Settings Table Special Handling

### Settings Table Dual-Mode

**Database Structure**:
- `project_id IS NULL` = Tenant-level settings
- `project_id IS NOT NULL` = Project-level settings
- Unique constraint: `uk_settings_project` (one settings record per project)

**Backend Implementation**:
```typescript
async getSettings(tenantId: string, projectId?: string) {
  if (projectId) {
    // Get project-level settings
    return this.prisma.settings.findUnique({
      where: { projectId },
    });
  } else {
    // Get tenant-level settings
    return this.prisma.settings.findUnique({
      where: { projectId: null },
    });
  }
}
```

**Frontend Implementation**:
- Settings page should show both tenant and project settings
- Allow switching between tenant and project context
- Project settings override tenant settings where applicable
- Show clear indication of which level is being edited

---

## 7. Files Summary

### Backend (New - 5 files)

- `backend/src/projects/projects.module.ts`
- `backend/src/projects/projects.controller.ts`
- `backend/src/projects/projects.service.ts`
- `backend/src/projects/dto/create-project.dto.ts`
- `backend/src/projects/dto/update-project.dto.ts`

### Backend (Modified - 19 services)

**High Priority**:
- `backend/src/content-types/content-types.service.ts`
- `backend/src/content-types/content-types.controller.ts`

**Medium Priority**:
- `backend/src/flows/flows.service.ts`
- `backend/src/media/media.service.ts`
- `backend/src/permissions/permissions.service.ts`
- `backend/src/form-elements/form-elements.service.ts`

**Low Priority**:
- `backend/src/api-keys/api-keys.service.ts`
- `backend/src/webhooks/webhooks.service.ts`
- `backend/src/workflows/workflows.service.ts`
- `backend/src/themes/themes.service.ts`
- `backend/src/locales/locales.service.ts`
- `backend/src/relations/relations.service.ts`
- `backend/src/shares/shares.service.ts`
- `backend/src/project-members/project-members.service.ts`
- `backend/src/rest-schema-cache/rest-schema-cache.service.ts`
- `backend/src/settings/settings.service.ts`
- `backend/src/activity/activity.service.ts` (optional)
- `backend/src/comments/comments.service.ts` (optional)
- `backend/src/presets/presets.service.ts` (optional)
- `backend/src/revisions/revisions.service.ts` (optional)

### Frontend (New - 6 files)

- `frontend/lib/api/projects.ts`
- `frontend/contexts/project-context.tsx`
- `frontend/app/dashboard/settings/projects/page.tsx`
- `frontend/app/dashboard/settings/projects/components/create-project-modal.tsx`
- `frontend/app/dashboard/settings/projects/components/edit-project-modal.tsx`
- `frontend/components/project-switcher.tsx`

### Frontend (Modified - 10+ pages)

**High Priority**:
- `frontend/lib/api/content-types.ts`
- `frontend/app/dashboard/settings/data-model/page.tsx`
- `frontend/app/dashboard/settings/data-model/components/add-field-modal.tsx`

**Medium Priority**:
- `frontend/lib/api/form-elements.ts`
- `frontend/app/dashboard/settings/flows/page.tsx`
- `frontend/app/dashboard/files/page.tsx`
- `frontend/app/dashboard/settings/access-policies/page.tsx`

**Low Priority**:
- `frontend/app/dashboard/settings/api-keys/page.tsx`
- `frontend/app/dashboard/settings/webhooks/page.tsx`
- `frontend/app/dashboard/settings/workflows/page.tsx`
- `frontend/app/dashboard/settings/themes/page.tsx`
- `frontend/app/dashboard/settings/locales/page.tsx`
- `frontend/app/dashboard/settings/page.tsx` (special: dual-mode)

**Navigation**:
- `frontend/components/layout/menu-items.ts`
- `frontend/components/layout/breadcrumbs.tsx`
- `frontend/components/layout/header.tsx`

---

## 8. Success Criteria

### 8.1 Functional Requirements

- [ ] Users can create projects
- [ ] Users can edit projects
- [ ] Users can delete projects (with safety checks)
- [ ] Users can switch between projects
- [ ] All 15 project-scoped tables properly filtered
- [ ] Form elements show system + project-specific elements
- [ ] Settings handle both tenant and project levels
- [ ] Navigation shows project context
- [ ] Breadcrumbs include project level
- [ ] Default project auto-selected on first use

### 8.2 UI/UX Requirements

- [ ] Project switcher is easily accessible
- [ ] Current project is clearly visible
- [ ] Navigation flow is intuitive
- [ ] Empty states are helpful
- [ ] Error states are clear
- [ ] Project deletion shows affected records count
- [ ] Settings page clearly shows tenant vs project mode

### 8.3 Technical Requirements

- [ ] All API endpoints work correctly
- [ ] Database relationships are correct (already verified)
- [ ] Performance is acceptable
- [ ] No data loss during project deletion
- [ ] Project context persists across page navigation
- [ ] All 19 services properly handle project context

---

## 9. Implementation Timeline

### Week 1-2: High Priority (Core Functionality)

**Days 1-2**: Backend Project CRUD
- Create Project Service, Controller, DTOs, Module
- Test all endpoints

**Days 3-4**: Frontend Project Context
- Create Project Context Provider
- Create Project API Client
- Integrate with Auth Context

**Days 5-6**: Content Types Service Update
- Make `projectId` required
- Remove fallback logic
- Update all methods

**Days 7-8**: Data Model Page Updates
- Add project selector
- Filter by project
- Update API calls

**Days 9-10**: Project Switcher & Navigation
- Create Project Switcher component
- Update menu structure
- Update breadcrumbs

### Week 3-4: Medium Priority

**Days 11-14**: Flows, Media, Permissions
- Update backend services
- Update frontend pages

**Days 15-16**: Form Elements Filtering
- Update backend service
- Update frontend API
- Update Add Field Modal

### Week 5+: Low Priority

**Days 17+**: Remaining Features
- API Keys, Webhooks, Workflows, Themes, Locales
- Settings page dual-mode
- Activity/Comments/Revisions filtering

**Total Estimated Time**: 3-4 weeks for high + medi