import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { v4 as uuidv4 } from 'uuid';

export interface Project {
  id: string;
  name: string;
  slug: string;
  cloned_from_platform_theme_id: string | null;
  config: Record<string, any> | null;
  feature_flags: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private prisma: PrismaService,
    private tenantPrisma: TenantPrismaService,
  ) {}

  /**
   * Get all projects for a tenant
   */
  async findAll(tenantId: string): Promise<Project[]> {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      this.logger.log(`[ProjectsService] Finding all projects for tenant: ${tenantId}, db: ${tenant.db_name}`);
      
      const projects = await client.$queryRawUnsafe<Array<{
        id: string;
        name: string;
        slug: string;
        cloned_from_platform_theme_id: string | null;
        config: any;
        feature_flags: any;
        created_at: Date;
        updated_at: Date;
      }>>(
        `SELECT 
          id, name, slug, cloned_from_platform_theme_id,
          config, feature_flags, created_at, updated_at
        FROM projects 
        ORDER BY created_at ASC`
      );

      this.logger.log(`[ProjectsService] Found ${projects.length} projects:`, JSON.stringify(projects.map(p => ({ id: p.id, name: p.name, slug: p.slug }))));

      const mapped = projects.map((p) => ({
        ...p,
        config: p.config != null ? (typeof p.config === 'string' ? JSON.parse(p.config) : p.config) : null,
        feature_flags: p.feature_flags != null ? (typeof p.feature_flags === 'string' ? JSON.parse(p.feature_flags) : p.feature_flags) : null,
      }));

      this.logger.log(`[ProjectsService] Returning ${mapped.length} mapped projects`);
      return mapped;
    });
  }

  /**
   * Get project by ID
   */
  async findOne(tenantId: string, projectId: string): Promise<Project> {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const projects = await client.$queryRawUnsafe<Array<{
        id: string;
        name: string;
        slug: string;
        cloned_from_platform_theme_id: string | null;
        config: any;
        feature_flags: any;
        created_at: Date;
        updated_at: Date;
      }>>(
        `SELECT 
          id, name, slug, cloned_from_platform_theme_id,
          config, feature_flags, created_at, updated_at
        FROM projects 
        WHERE id = ?`,
        projectId
      );

      if (projects.length === 0) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      const p = projects[0];
      return {
        ...p,
        config: p.config != null ? (typeof p.config === 'string' ? JSON.parse(p.config) : p.config) : null,
        feature_flags: p.feature_flags != null ? (typeof p.feature_flags === 'string' ? JSON.parse(p.feature_flags) : p.feature_flags) : null,
      };
    });
  }

  /**
   * Create new project
   */
  async create(tenantId: string, createDto: CreateProjectDto): Promise<Project> {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Auto-generate slug if not provided
      const slug = createDto.slug || this.generateSlug(createDto.name);

      // Check if slug already exists
      const existing = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM projects WHERE slug = ?`,
        slug
      );

      if (existing.length > 0) {
        throw new BadRequestException(`Project with slug "${slug}" already exists`);
      }

      const projectId = uuidv4();
      const config = createDto.config ? JSON.stringify(createDto.config) : null;
      const featureFlags = createDto.feature_flags ? JSON.stringify(createDto.feature_flags) : null;

      await client.$executeRawUnsafe(
        `INSERT INTO projects (id, name, slug, config, feature_flags, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        projectId,
        createDto.name,
        slug,
        config,
        featureFlags
      );

      // Return created project
      return this.findOne(tenantId, projectId);
    });
  }

  /**
   * Update project
   */
  async update(
    tenantId: string,
    projectId: string,
    updateDto: UpdateProjectDto,
  ): Promise<Project> {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Verify project exists
      await this.findOne(tenantId, projectId);

      // Build update query
      const updates: string[] = [];
      const params: any[] = [];

      if (updateDto.name !== undefined) {
        updates.push('name = ?');
        params.push(updateDto.name);
      }
      if (updateDto.slug !== undefined) {
        // Check if new slug is unique
        const duplicate = await client.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM projects WHERE slug = ? AND id != ?`,
          updateDto.slug,
          projectId
        );
        if (duplicate.length > 0) {
          throw new BadRequestException(`Project with slug "${updateDto.slug}" already exists`);
        }
        updates.push('slug = ?');
        params.push(updateDto.slug);
      }
      if (updateDto.config !== undefined) {
        updates.push('config = ?');
        params.push(updateDto.config ? JSON.stringify(updateDto.config) : null);
      }
      if (updateDto.feature_flags !== undefined) {
        updates.push('feature_flags = ?');
        params.push(updateDto.feature_flags ? JSON.stringify(updateDto.feature_flags) : null);
      }

      if (updates.length === 0) {
        // No updates, return existing project
        return this.findOne(tenantId, projectId);
      }

      updates.push('updated_at = NOW()');
      params.push(projectId);

      await client.$executeRawUnsafe(
        `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
        ...params
      );

      return this.findOne(tenantId, projectId);
    });
  }

  /**
   * Delete project
   */
  async remove(tenantId: string, projectId: string): Promise<void> {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Check if it's the only project (prevent deletion)
      const projectCount = await client.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM projects`
      );

      if (Number(projectCount[0].count) <= 1) {
        throw new BadRequestException('Cannot delete the only project');
      }

      // Verify project exists
      await this.findOne(tenantId, projectId);

      // Get counts of affected records (for warning - optional, can be used in frontend)
      // Note: CASCADE DELETE will handle dependent tables automatically

      // Delete project (CASCADE DELETE will handle dependent tables)
      await client.$executeRawUnsafe(
        `DELETE FROM projects WHERE id = ?`,
        projectId
      );
    });
  }

  /**
   * Get default project (first project or create one)
   */
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

  /**
   * Get counts of records that will be deleted (for warning)
   */
  async getAffectedRecordCounts(tenantId: string, projectId: string): Promise<Record<string, number>> {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const tables = [
        'api_keys',
        'content_types',
        'flows',
        'locales',
        'media_assets',
        'media_folders',
        'permissions',
        'project_members',
        'relations',
        'rest_schema_cache',
        'shares',
        'themes',
        'theme_assignments',
        'webhooks',
        'workflows',
      ];

      const counts: Record<string, number> = {};

      for (const table of tables) {
        const result = await client.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*) as count FROM ${table} WHERE project_id = ?`,
          projectId
        );
        counts[table] = Number(result[0].count);
      }

      return counts;
    });
  }

  /**
   * Helper: Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
