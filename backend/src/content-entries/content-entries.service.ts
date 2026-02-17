import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { DataModelsService } from '../content-types/data-models.service';
import { FieldValidatorService } from './validators/field-validator.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { PublishEntryDto } from './dto/publish-entry.dto';
import { QueryEntriesDto } from './dto/query-entries.dto';
import { v4 as uuidv4 } from 'uuid';

export interface ContentEntry {
  id: string;
  contentTypeId: string;
  status: 'draft' | 'review' | 'approved' | 'published';
  title: string | null;
  slug: string | null;
  data: Record<string, any>;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

@Injectable()
export class ContentEntriesService {
  private readonly logger = new Logger(ContentEntriesService.name);

  constructor(
    private prisma: PrismaService,
    private tenantPrisma: TenantPrismaService,
    private contentTypesService: DataModelsService,
    private fieldValidator: FieldValidatorService,
  ) {}

  /**
   * Get all entries for a content type with filtering
   */
  async findAll(
    tenantId: string,
    projectId: string,
    contentTypeId: string,
    queryDto: QueryEntriesDto,
  ): Promise<{ data: ContentEntry[]; meta: { total: number; page: number; limit: number } }> {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!contentTypeId) {
      throw new BadRequestException('contentTypeId is required');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Verify project and content type exist and belong together
      const project = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM projects WHERE id = ?`,
        projectId
      );
      if (project.length === 0) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      const contentType = await client.$queryRawUnsafe<Array<{
        id: string;
        project_id: string;
      }>>(
        `SELECT id, project_id FROM content_types WHERE id = ?`,
        contentTypeId
      );
      if (contentType.length === 0) {
        throw new NotFoundException(`Content type with ID ${contentTypeId} not found`);
      }
      if (contentType[0].project_id !== projectId) {
        throw new BadRequestException('Content type does not belong to the specified project');
      }

      // Build query
      const page = queryDto.page || 1;
      const limit = queryDto.limit || 25;
      const offset = (page - 1) * limit;
      const sort = queryDto.sort || 'created_at';
      const order = queryDto.order || 'desc';

      let whereClause = `WHERE ce.content_type_id = ?`;
      const params: any[] = [contentTypeId];

      // Status filter
      if (queryDto.status) {
        whereClause += ` AND ce.status = ?`;
        params.push(queryDto.status);
      }

      // Search filter
      if (queryDto.search) {
        whereClause += ` AND (ce.search_index LIKE ? OR ce.title LIKE ? OR ce.slug LIKE ?)`;
        const searchTerm = `%${queryDto.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Get total count
      const countResult = await client.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM content_entries ce ${whereClause}`,
        ...params
      );
      const total = Number(countResult[0]?.count || 0);

      // Get entries with latest version data
      const entries = await client.$queryRawUnsafe<Array<{
        id: string;
        content_type_id: string;
        status: string;
        title: string | null;
        slug: string | null;
        published_at: Date | null;
        created_by: string | null;
        updated_by: string | null;
        created_at: Date;
        updated_at: Date;
        version_data: any;
      }>>(
        `SELECT 
          ce.id,
          ce.content_type_id,
          ce.status,
          ce.title,
          ce.slug,
          ce.published_at,
          ce.created_by,
          ce.updated_by,
          ce.created_at,
          ce.updated_at,
          (
            SELECT cv.data 
            FROM content_versions cv 
            WHERE cv.entry_id = ce.id 
            ORDER BY cv.version_number DESC 
            LIMIT 1
          ) as version_data
        FROM content_entries ce
        ${whereClause}
        ORDER BY ce.${sort} ${order.toUpperCase()}
        LIMIT ? OFFSET ?`,
        ...params,
        limit,
        offset
      );

      const data = entries.map(entry => ({
        id: entry.id,
        contentTypeId: entry.content_type_id,
        status: entry.status as 'draft' | 'review' | 'approved' | 'published',
        title: entry.title,
        slug: entry.slug,
        data: typeof entry.version_data === 'string' 
          ? JSON.parse(entry.version_data) 
          : entry.version_data || {},
        publishedAt: entry.published_at?.toISOString() || null,
        createdAt: entry.created_at.toISOString(),
        updatedAt: entry.updated_at.toISOString(),
        createdBy: entry.created_by,
        updatedBy: entry.updated_by,
      }));

      return {
        data,
        meta: {
          total,
          page,
          limit,
        },
      };
    });
  }

  /**
   * Get a single entry by ID with full data
   */
  async findOne(
    tenantId: string,
    projectId: string,
    contentTypeId: string,
    entryId: string,
  ): Promise<ContentEntry> {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!contentTypeId) {
      throw new BadRequestException('contentTypeId is required');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Verify project and content type
      const project = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM projects WHERE id = ?`,
        projectId
      );
      if (project.length === 0) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      const contentType = await client.$queryRawUnsafe<Array<{
        id: string;
        project_id: string;
      }>>(
        `SELECT id, project_id FROM content_types WHERE id = ?`,
        contentTypeId
      );
      if (contentType.length === 0) {
        throw new NotFoundException(`Content type with ID ${contentTypeId} not found`);
      }
      if (contentType[0].project_id !== projectId) {
        throw new BadRequestException('Content type does not belong to the specified project');
      }

      // Get entry
      const entries = await client.$queryRawUnsafe<Array<{
        id: string;
        content_type_id: string;
        status: string;
        title: string | null;
        slug: string | null;
        published_at: Date | null;
        created_by: string | null;
        updated_by: string | null;
        created_at: Date;
        updated_at: Date;
      }>>(
        `SELECT 
          id, content_type_id, status, title, slug, published_at,
          created_by, updated_by, created_at, updated_at
        FROM content_entries 
        WHERE id = ? AND content_type_id = ?`,
        entryId,
        contentTypeId
      );

      if (entries.length === 0) {
        throw new NotFoundException(`Entry with ID ${entryId} not found`);
      }

      const entry = entries[0];

      // Get latest version data
      const versions = await client.$queryRawUnsafe<Array<{
        data: any;
      }>>(
        `SELECT data 
        FROM content_versions 
        WHERE entry_id = ? 
        ORDER BY version_number DESC 
        LIMIT 1`,
        entryId
      );

      const data = versions.length > 0
        ? (typeof versions[0].data === 'string' 
            ? JSON.parse(versions[0].data) 
            : versions[0].data)
        : {};

      return {
        id: entry.id,
        contentTypeId: entry.content_type_id,
        status: entry.status as 'draft' | 'review' | 'approved' | 'published',
        title: entry.title,
        slug: entry.slug,
        data,
        publishedAt: entry.published_at?.toISOString() || null,
        createdAt: entry.created_at.toISOString(),
        updatedAt: entry.updated_at.toISOString(),
        createdBy: entry.created_by,
        updatedBy: entry.updated_by,
      };
    });
  }

  /**
   * Create a new entry
   */
  async create(
    tenantId: string,
    projectId: string,
    createDto: CreateEntryDto,
    userId?: string,
  ): Promise<ContentEntry> {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!createDto.contentTypeId) {
      throw new BadRequestException('contentTypeId is required');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Verify project and content type
      const project = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM projects WHERE id = ?`,
        projectId
      );
      if (project.length === 0) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      // Get content type with fields for validation
      const contentType = await this.contentTypesService.getContentTypeById(
        tenantId,
        createDto.contentTypeId,
      );

      if (contentType.project_id !== projectId) {
        throw new BadRequestException('Content type does not belong to the specified project');
      }

      // Apply defaults
      let entryData = this.fieldValidator.applyDefaults(createDto.data, contentType);

      // Validate field values
      this.fieldValidator.validateEntry(entryData, contentType);

      // Extract title
      const title = createDto.title || this.extractTitle(entryData, contentType);

      // Generate slug
      const slug = createDto.slug || this.generateSlug(title);

      // Build search index
      const searchIndex = this.buildSearchIndex(entryData, contentType);

      // Create entry
      const entryId = uuidv4();
      const status = createDto.status || 'draft';
      const now = new Date();

      await client.$executeRawUnsafe(
        `INSERT INTO content_entries (
          id, content_type_id, status, title, slug, search_index,
          created_by, updated_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        entryId,
        createDto.contentTypeId,
        status,
        title || null,
        slug || null,
        searchIndex || null,
        userId || null,
        userId || null,
        now,
        now
      );

      // Create initial version
      const versionId = uuidv4();
      await client.$executeRawUnsafe(
        `INSERT INTO content_versions (
          id, entry_id, version_number, data, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        versionId,
        entryId,
        1,
        JSON.stringify(entryData),
        userId || null,
        now
      );

      // Return created entry
      return this.findOne(tenantId, projectId, createDto.contentTypeId, entryId);
    });
  }

  /**
   * Update an existing entry
   */
  async update(
    tenantId: string,
    projectId: string,
    contentTypeId: string,
    entryId: string,
    updateDto: UpdateEntryDto,
    userId?: string,
  ): Promise<ContentEntry> {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!contentTypeId) {
      throw new BadRequestException('contentTypeId is required');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Verify entry exists
      const existingEntry = await this.findOne(tenantId, projectId, contentTypeId, entryId);

      // Get content type with fields
      const contentType = await this.contentTypesService.getContentTypeById(
        tenantId,
        contentTypeId,
      );

      // Get current version data
      const currentData = existingEntry.data;

      // Merge with update data
      const updatedData = updateDto.data
        ? { ...currentData, ...updateDto.data }
        : currentData;

      // Apply defaults
      let entryData = this.fieldValidator.applyDefaults(updatedData, contentType);

      // Validate field values
      this.fieldValidator.validateEntry(entryData, contentType);

      // Extract/update title
      const title = updateDto.title !== undefined
        ? updateDto.title
        : this.extractTitle(entryData, contentType) || existingEntry.title;

      // Generate/update slug
      const slug = updateDto.slug !== undefined
        ? updateDto.slug
        : this.generateSlug(title) || existingEntry.slug;

      // Build search index
      const searchIndex = this.buildSearchIndex(entryData, contentType);

      // Update entry
      const status = updateDto.status || existingEntry.status;
      const now = new Date();

      await client.$executeRawUnsafe(
        `UPDATE content_entries 
        SET status = ?, title = ?, slug = ?, search_index = ?, 
            updated_by = ?, updated_at = ?
        WHERE id = ?`,
        status,
        title || null,
        slug || null,
        searchIndex || null,
        userId || null,
        now,
        entryId
      );

      // Get current max version number
      const versions = await client.$queryRawUnsafe<Array<{ max_version: number }>>(
        `SELECT COALESCE(MAX(version_number), 0) as max_version 
        FROM content_versions 
        WHERE entry_id = ?`,
        entryId
      );
      const nextVersion = (versions[0]?.max_version || 0) + 1;

      // Create new version
      const versionId = uuidv4();
      await client.$executeRawUnsafe(
        `INSERT INTO content_versions (
          id, entry_id, version_number, data, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        versionId,
        entryId,
        nextVersion,
        JSON.stringify(entryData),
        userId || null,
        now
      );

      // Return updated entry
      return this.findOne(tenantId, projectId, contentTypeId, entryId);
    });
  }

  /**
   * Delete an entry
   */
  async delete(
    tenantId: string,
    projectId: string,
    contentTypeId: string,
    entryId: string,
  ): Promise<{ success: boolean }> {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!contentTypeId) {
      throw new BadRequestException('contentTypeId is required');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Verify entry exists
      await this.findOne(tenantId, projectId, contentTypeId, entryId);

      // Delete entry (cascade will delete versions)
      await client.$executeRawUnsafe(
        `DELETE FROM content_entries WHERE id = ?`,
        entryId
      );

      return { success: true };
    });
  }

  // Utility methods

  /**
   * Extract title from entry data
   */
  private extractTitle(data: Record<string, any>, contentType: any): string | null {
    // Try common title fields
    const titleFields = ['title', 'name', 'heading', 'headline'];
    for (const field of titleFields) {
      if (data[field] && typeof data[field] === 'string') {
        return data[field];
      }
    }

    // Try first text field
    for (const field of contentType.fields || []) {
      if (['text', 'textarea'].includes(field.type) && data[field.field]) {
        const value = data[field.field];
        if (typeof value === 'string' && value.trim()) {
          return value.substring(0, 255); // Truncate to 255 chars
        }
      }
    }

    return null;
  }

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string | null): string | null {
    if (!title) return null;

    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Build full-text search index from entry data
   */
  private buildSearchIndex(data: Record<string, any>, contentType: any): string | null {
    const searchableFields: string[] = [];

    for (const field of contentType.fields || []) {
      if (['text', 'textarea', 'richtext', 'email'].includes(field.type)) {
        const value = data[field.field];
        if (value && typeof value === 'string') {
          // Strip HTML tags from richtext
          const text = field.type === 'richtext'
            ? value.replace(/<[^>]*>/g, ' ')
            : value;
          searchableFields.push(text);
        }
      }
    }

    return searchableFields.length > 0 ? searchableFields.join(' ') : null;
  }

  /**
   * Publish an entry
   */
  async publish(
    tenantId: string,
    projectId: string,
    contentTypeId: string,
    entryId: string,
    publishDto: PublishEntryDto,
    userId?: string,
  ): Promise<ContentEntry> {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!contentTypeId) {
      throw new BadRequestException('contentTypeId is required');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Get entry
      const entry = await this.findOne(tenantId, projectId, contentTypeId, entryId);

      // Ensure entry is in a publishable state
      if (entry.status !== 'approved' && entry.status !== 'review') {
        throw new BadRequestException(
          `Entry must be in 'approved' or 'review' status to publish. Current status: ${entry.status}`
        );
      }

      // Get latest version
      const versions = await client.$queryRawUnsafe<Array<{
        id: string;
        version_number: number;
        data: any;
      }>>(
        `SELECT id, version_number, data 
        FROM content_versions 
        WHERE entry_id = ? 
        ORDER BY version_number DESC 
        LIMIT 1`,
        entryId
      );

      if (versions.length === 0) {
        throw new NotFoundException('No version found for entry');
      }

      const latestVersion = versions[0];

      // Create published version (copy of latest)
      const publishedVersionId = uuidv4();
      const now = new Date();
      const publishAt = publishDto.publishAt || now;

      await client.$executeRawUnsafe(
        `INSERT INTO content_versions (
          id, entry_id, version_number, data, status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        publishedVersionId,
        entryId,
        latestVersion.version_number,
        typeof latestVersion.data === 'string' ? latestVersion.data : JSON.stringify(latestVersion.data),
        'published',
        userId || null,
        now
      );

      // Update entry
      await client.$executeRawUnsafe(
        `UPDATE content_entries 
        SET status = 'published', 
            published_version_id = ?,
            published_at = ?,
            scheduled_publish_at = ?,
            scheduled_unpublish_at = ?,
            updated_by = ?,
            updated_at = ?
        WHERE id = ?`,
        publishedVersionId,
        publishAt,
        publishDto.publishAt || null,
        publishDto.unpublishAt || null,
        userId || null,
        now,
        entryId
      );

      return this.findOne(tenantId, projectId, contentTypeId, entryId);
    });
  }

  /**
   * Unpublish an entry
   */
  async unpublish(
    tenantId: string,
    projectId: string,
    contentTypeId: string,
    entryId: string,
    userId?: string,
  ): Promise<ContentEntry> {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!contentTypeId) {
      throw new BadRequestException('contentTypeId is required');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Get entry
      const entry = await this.findOne(tenantId, projectId, contentTypeId, entryId);

      if (entry.status !== 'published') {
        throw new BadRequestException(`Entry is not published. Current status: ${entry.status}`);
      }

      // Update entry
      const now = new Date();
      await client.$executeRawUnsafe(
        `UPDATE content_entries 
        SET status = 'draft',
            published_version_id = NULL,
            published_at = NULL,
            scheduled_unpublish_at = NULL,
            updated_by = ?,
            updated_at = ?
        WHERE id = ?`,
        userId || null,
        now,
        entryId
      );

      return this.findOne(tenantId, projectId, contentTypeId, entryId);
    });
  }

  /**
   * Change entry status
   */
  async changeStatus(
    tenantId: string,
    projectId: string,
    contentTypeId: string,
    entryId: string,
    status: 'draft' | 'review' | 'approved' | 'published',
    userId?: string,
  ): Promise<ContentEntry> {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!contentTypeId) {
      throw new BadRequestException('contentTypeId is required');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Verify entry exists
      await this.findOne(tenantId, projectId, contentTypeId, entryId);

      // Update status
      const now = new Date();
      await client.$executeRawUnsafe(
        `UPDATE content_entries 
        SET status = ?, updated_by = ?, updated_at = ?
        WHERE id = ?`,
        status,
        userId || null,
        now,
        entryId
      );

      return this.findOne(tenantId, projectId, contentTypeId, entryId);
    });
  }

  /**
   * Get all versions for an entry
   */
  async getVersions(
    tenantId: string,
    projectId: string,
    contentTypeId: string,
    entryId: string,
  ): Promise<Array<{
    id: string;
    versionNumber: number;
    status: string | null;
    name: string | null;
    createdAt: string;
    createdBy: string | null;
  }>> {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!contentTypeId) {
      throw new BadRequestException('contentTypeId is required');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Verify entry exists
      await this.findOne(tenantId, projectId, contentTypeId, entryId);

      // Get versions
      const versions = await client.$queryRawUnsafe<Array<{
        id: string;
        version_number: number;
        status: string | null;
        name: string | null;
        created_at: Date;
        created_by: string | null;
      }>>(
        `SELECT 
          id, version_number, status, name, created_at, created_by
        FROM content_versions 
        WHERE entry_id = ? 
        ORDER BY version_number DESC`,
        entryId
      );

      return versions.map(v => ({
        id: v.id,
        versionNumber: v.version_number,
        status: v.status,
        name: v.name,
        createdAt: v.created_at.toISOString(),
        createdBy: v.created_by,
      }));
    });
  }

  /**
   * Get a specific version
   */
  async getVersion(
    tenantId: string,
    projectId: string,
    contentTypeId: string,
    entryId: string,
    versionId: string,
  ): Promise<{
    id: string;
    versionNumber: number;
    data: Record<string, any>;
    status: string | null;
    name: string | null;
    createdAt: string;
    createdBy: string | null;
  }> {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!contentTypeId) {
      throw new BadRequestException('contentTypeId is required');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Verify entry exists
      await this.findOne(tenantId, projectId, contentTypeId, entryId);

      // Get version
      const versions = await client.$queryRawUnsafe<Array<{
        id: string;
        entry_id: string;
        version_number: number;
        data: any;
        status: string | null;
        name: string | null;
        created_at: Date;
        created_by: string | null;
      }>>(
        `SELECT 
          id, entry_id, version_number, data, status, name, created_at, created_by
        FROM content_versions 
        WHERE id = ? AND entry_id = ?`,
        versionId,
        entryId
      );

      if (versions.length === 0) {
        throw new NotFoundException(`Version with ID ${versionId} not found`);
      }

      const version = versions[0];
      const data = typeof version.data === 'string'
        ? JSON.parse(version.data)
        : version.data;

      return {
        id: version.id,
        versionNumber: version.version_number,
        data,
        status: version.status,
        name: version.name,
        createdAt: version.created_at.toISOString(),
        createdBy: version.created_by,
      };
    });
  }

  /**
   * Revert entry to a specific version
   */
  async revertToVersion(
    tenantId: string,
    projectId: string,
    contentTypeId: string,
    entryId: string,
    versionId: string,
    userId?: string,
  ): Promise<ContentEntry> {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!contentTypeId) {
      throw new BadRequestException('contentTypeId is required');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Get version to revert to
      const version = await this.getVersion(tenantId, projectId, contentTypeId, entryId, versionId);

      // Get content type
      const contentType = await this.contentTypesService.getContentTypeById(
        tenantId,
        contentTypeId,
      );

      // Validate version data
      this.fieldValidator.validateEntry(version.data, contentType);

      // Update entry with version data
      const updateDto: UpdateEntryDto = {
        data: version.data,
      };

      return this.update(tenantId, projectId, contentTypeId, entryId, updateDto, userId);
    });
  }

  /**
   * Bulk delete entries
   */
  async bulkDelete(
    tenantId: string,
    projectId: string,
    contentTypeId: string,
    entryIds: string[],
  ): Promise<{ deleted: number }> {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!contentTypeId) {
      throw new BadRequestException('contentTypeId is required');
    }
    if (!entryIds || entryIds.length === 0) {
      throw new BadRequestException('entryIds array is required and must not be empty');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Verify all entries exist and belong to content type
      const placeholders = entryIds.map(() => '?').join(',');
      const entries = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM content_entries 
        WHERE id IN (${placeholders}) AND content_type_id = ?`,
        ...entryIds,
        contentTypeId
      );

      if (entries.length !== entryIds.length) {
        throw new BadRequestException('Some entries not found or do not belong to the content type');
      }

      // Delete entries (cascade will delete versions)
      await client.$executeRawUnsafe(
        `DELETE FROM content_entries 
        WHERE id IN (${placeholders}) AND content_type_id = ?`,
        ...entryIds,
        contentTypeId
      );

      return { deleted: entryIds.length };
    });
  }

  /**
   * Bulk publish entries
   */
  async bulkPublish(
    tenantId: string,
    projectId: string,
    contentTypeId: string,
    entryIds: string[],
    userId?: string,
  ): Promise<{ published: number }> {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!contentTypeId) {
      throw new BadRequestException('contentTypeId is required');
    }
    if (!entryIds || entryIds.length === 0) {
      throw new BadRequestException('entryIds array is required and must not be empty');
    }

    let published = 0;
    for (const entryId of entryIds) {
      try {
        await this.publish(tenantId, projectId, contentTypeId, entryId, {}, userId);
        published++;
      } catch (error) {
        this.logger.warn(`Failed to publish entry ${entryId}: ${error.message}`);
      }
    }

    return { published };
  }

  /**
   * Bulk change status
   */
  async bulkChangeStatus(
    tenantId: string,
    projectId: string,
    contentTypeId: string,
    entryIds: string[],
    status: 'draft' | 'review' | 'approved' | 'published',
    userId?: string,
  ): Promise<{ updated: number }> {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }
    if (!contentTypeId) {
      throw new BadRequestException('contentTypeId is required');
    }
    if (!entryIds || entryIds.length === 0) {
      throw new BadRequestException('entryIds array is required and must not be empty');
    }

    let updated = 0;
    for (const entryId of entryIds) {
      try {
        await this.changeStatus(tenantId, projectId, contentTypeId, entryId, status, userId);
        updated++;
      } catch (error) {
        this.logger.warn(`Failed to change status for entry ${entryId}: ${error.message}`);
      }
    }

    return { updated };
  }
}
