import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateCollectionDto, CreateCollectionFieldDto } from './dto/create-collection.dto';
import { UpdateCollectionDto, UpdateCollectionFieldDto } from './dto/update-collection.dto';
import { v4 as uuidv4 } from 'uuid';

/** Response shape compatible with content-types (tenant portal) */
export interface CollectionResponse {
  id: string;
  project_id: string;
  dataset_id: string | null;
  name: string;
  slug: string;
  collection: string; // alias for slug
  config: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
  fields: Array<{
    id: string;
    collection_id: string;
    name: string;
    field: string; // alias for name
    type: string;
    is_required: boolean;
    config: Record<string, any> | null;
    created_at: Date;
    updated_at: Date;
  }>;
}

@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);

  constructor(
    private prisma: PrismaService,
    private tenantPrisma: TenantPrismaService,
  ) {}

  async findAll(tenantId: string, projectId: string): Promise<CollectionResponse[]> {
    if (!projectId) throw new BadRequestException('projectId is required');

    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const projects = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM projects WHERE id = ?`,
        projectId,
      );
      if (projects.length === 0) throw new NotFoundException(`Project ${projectId} not found`);

      const rows = await client.$queryRawUnsafe<Array<{
        id: string;
        project_id: string;
        dataset_id: string | null;
        name: string;
        slug: string;
        config: any;
        created_at: Date;
        updated_at: Date;
      }>>(
        `SELECT id, project_id, dataset_id, name, slug, config, created_at, updated_at
         FROM collections WHERE project_id = ? ORDER BY name ASC`,
        projectId,
      );

      const result: CollectionResponse[] = [];
      for (const row of rows) {
        const fields = await this.getFieldsForCollection(client, row.id);
        result.push(this.toResponse(row, fields));
      }
      return result;
    });
  }

  async findOne(tenantId: string, collectionId: string): Promise<CollectionResponse> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const rows = await client.$queryRawUnsafe<Array<{
        id: string;
        project_id: string;
        dataset_id: string | null;
        name: string;
        slug: string;
        config: any;
        created_at: Date;
        updated_at: Date;
      }>>(
        `SELECT id, project_id, dataset_id, name, slug, config, created_at, updated_at
         FROM collections WHERE id = ?`,
        collectionId,
      );
      if (rows.length === 0) throw new NotFoundException('Collection not found');

      const fields = await this.getFieldsForCollection(client, collectionId);
      return this.toResponse(rows[0], fields);
    });
  }

  /** Fetch fields for a collection. Uses sort_order if the column exists, otherwise ORDER BY name. */
  private async getFieldsForCollection(
    client: { $queryRawUnsafe: any },
    collectionId: string,
  ): Promise<Array<{ id: string; collection_id: string; name: string; type: string; is_required: number; config: any; created_at: Date; updated_at: Date }>> {
    type FieldRow = { id: string; collection_id: string; name: string; type: string; is_required: number; config: any; created_at: Date; updated_at: Date };
    try {
      const rows = await client.$queryRawUnsafe(
        `SELECT id, collection_id, name, type, is_required, config, created_at, updated_at
         FROM fields WHERE collection_id = ? ORDER BY COALESCE(sort_order, 0) ASC, name ASC`,
        collectionId,
      );
      return rows as FieldRow[];
    } catch (err: any) {
      if (err?.message?.includes('sort_order')) {
        const rows = await client.$queryRawUnsafe(
          `SELECT id, collection_id, name, type, is_required, config, created_at, updated_at
           FROM fields WHERE collection_id = ? ORDER BY name ASC`,
          collectionId,
        );
        return rows as FieldRow[];
      }
      throw err;
    }
  }

  async create(tenantId: string, dto: CreateCollectionDto): Promise<CollectionResponse> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const projectCheck = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM projects WHERE id = ?`,
        dto.projectId,
      );
      if (projectCheck.length === 0) throw new NotFoundException('Project not found');

      const existing = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM collections WHERE project_id = ? AND slug = ?`,
        dto.projectId,
        dto.slug,
      );
      if (existing.length > 0) {
        throw new BadRequestException(`Collection with slug "${dto.slug}" already exists`);
      }

      const id = uuidv4();
      const configJson = dto.config ? JSON.stringify(dto.config) : null;
      await client.$executeRawUnsafe(
        `INSERT INTO collections (id, project_id, dataset_id, name, slug, config, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        id,
        dto.projectId,
        dto.datasetId || null,
        dto.name,
        dto.slug,
        configJson,
      );

      if (dto.fields && dto.fields.length > 0) {
        for (const f of dto.fields) {
          const fieldId = uuidv4();
          const fieldConfig = f.config ? JSON.stringify(f.config) : null;
          await client.$executeRawUnsafe(
            `INSERT INTO fields (id, collection_id, name, type, is_required, config, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            fieldId,
            id,
            f.name,
            f.type,
            f.is_required ? 1 : 0,
            fieldConfig,
          );
        }
      }

      return this.findOne(tenantId, id);
    });
  }

  async update(
    tenantId: string,
    collectionId: string,
    dto: UpdateCollectionDto,
  ): Promise<CollectionResponse> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const existing = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM collections WHERE id = ?`,
        collectionId,
      );
      if (existing.length === 0) throw new NotFoundException('Collection not found');

      const updates: string[] = [];
      const params: any[] = [];
      if (dto.name !== undefined) {
        updates.push('name = ?');
        params.push(dto.name);
      }
      if (dto.slug !== undefined) {
        const proj = await client.$queryRawUnsafe<Array<{ project_id: string }>>(
          `SELECT project_id FROM collections WHERE id = ?`,
          collectionId,
        );
        const projectId = proj[0]?.project_id;
        if (projectId) {
          const dup = await client.$queryRawUnsafe<Array<{ id: string }>>(
            `SELECT id FROM collections WHERE project_id = ? AND slug = ? AND id != ?`,
            projectId,
            dto.slug,
            collectionId,
          );
          if (dup.length > 0) throw new BadRequestException(`Slug "${dto.slug}" already exists`);
        }
        updates.push('slug = ?');
        params.push(dto.slug);
      }
      if (dto.datasetId !== undefined) {
        updates.push('dataset_id = ?');
        params.push(dto.datasetId);
      }
      if (dto.config !== undefined) {
        updates.push('config = ?');
        params.push(JSON.stringify(dto.config));
      }
      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        params.push(collectionId);
        await client.$executeRawUnsafe(
          `UPDATE collections SET ${updates.join(', ')} WHERE id = ?`,
          ...params,
        );
      }
      return this.findOne(tenantId, collectionId);
    });
  }

  async remove(tenantId: string, collectionId: string): Promise<{ success: boolean }> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const existing = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM collections WHERE id = ?`,
        collectionId,
      );
      if (existing.length === 0) throw new NotFoundException('Collection not found');

      const hasEntries = await client.$queryRawUnsafe<Array<{ c: bigint }>>(
        `SELECT COUNT(*) as c FROM content_nodes WHERE schema_ref_id = ? AND node_type = 'entry'`,
        collectionId,
      );
      if (Number(hasEntries[0]?.c ?? 0) > 0) {
        throw new BadRequestException('Cannot delete collection with existing entries. Delete entries first.');
      }

      await client.$executeRawUnsafe(`DELETE FROM fields WHERE collection_id = ?`, collectionId);
      await client.$executeRawUnsafe(`DELETE FROM collections WHERE id = ?`, collectionId);
      return { success: true };
    });
  }

  async addField(
    tenantId: string,
    collectionId: string,
    dto: CreateCollectionFieldDto,
  ): Promise<CollectionResponse> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const coll = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM collections WHERE id = ?`,
        collectionId,
      );
      if (coll.length === 0) throw new NotFoundException('Collection not found');

      const existing = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM fields WHERE collection_id = ? AND name = ?`,
        collectionId,
        dto.name,
      );
      if (existing.length > 0) throw new BadRequestException(`Field "${dto.name}" already exists`);

      const fieldId = uuidv4();
      const configJson = dto.config ? JSON.stringify(dto.config) : null;
      try {
        const maxSort = await client.$queryRawUnsafe<Array<{ max_sort: number | null }>>(
          `SELECT MAX(COALESCE(sort_order, 0)) AS max_sort FROM fields WHERE collection_id = ?`,
          collectionId,
        );
        const nextSort = (maxSort[0]?.max_sort ?? -1) + 1;
        await client.$executeRawUnsafe(
          `INSERT INTO fields (id, collection_id, name, type, is_required, config, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          fieldId,
          collectionId,
          dto.name,
          dto.type,
          dto.is_required ? 1 : 0,
          configJson,
          nextSort,
        );
      } catch (err: any) {
        if (err?.message?.includes('sort_order')) {
          await client.$executeRawUnsafe(
            `INSERT INTO fields (id, collection_id, name, type, is_required, config, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            fieldId,
            collectionId,
            dto.name,
            dto.type,
            dto.is_required ? 1 : 0,
            configJson,
          );
        } else {
          throw err;
        }
      }
      return this.findOne(tenantId, collectionId);
    });
  }

  async updateField(
    tenantId: string,
    collectionId: string,
    fieldId: string,
    dto: UpdateCollectionFieldDto,
  ): Promise<CollectionResponse> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const existing = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM fields WHERE id = ? AND collection_id = ?`,
        fieldId,
        collectionId,
      );
      if (existing.length === 0) throw new NotFoundException('Field not found');

      const updates: string[] = [];
      const params: any[] = [];
      if (dto.name !== undefined) {
        updates.push('name = ?');
        params.push(dto.name);
      }
      if (dto.type !== undefined) {
        updates.push('type = ?');
        params.push(dto.type);
      }
      if (dto.is_required !== undefined) {
        updates.push('is_required = ?');
        params.push(dto.is_required ? 1 : 0);
      }
      if (dto.config !== undefined) {
        updates.push('config = ?');
        params.push(JSON.stringify(dto.config));
      }
      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        params.push(fieldId);
        await client.$executeRawUnsafe(
          `UPDATE fields SET ${updates.join(', ')} WHERE id = ?`,
          ...params,
        );
      }
      return this.findOne(tenantId, collectionId);
    });
  }

  async removeField(
    tenantId: string,
    collectionId: string,
    fieldId: string,
  ): Promise<CollectionResponse> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const existing = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM fields WHERE id = ? AND collection_id = ?`,
        fieldId,
        collectionId,
      );
      if (existing.length === 0) throw new NotFoundException('Field not found');

      await client.$executeRawUnsafe(`DELETE FROM fields WHERE id = ?`, fieldId);
      return this.findOne(tenantId, collectionId);
    });
  }

  async updateFieldOrder(
    tenantId: string,
    collectionId: string,
    fieldOrders: Array<{ id: string; sort: number }>,
  ): Promise<CollectionResponse> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const coll = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM collections WHERE id = ?`,
        collectionId,
      );
      if (coll.length === 0) throw new NotFoundException('Collection not found');

      try {
        for (const fo of fieldOrders) {
          await client.$executeRawUnsafe(
            `UPDATE fields SET sort_order = ?, updated_at = NOW() WHERE id = ? AND collection_id = ?`,
            fo.sort,
            fo.id,
            collectionId,
          );
        }
      } catch (err: any) {
        if (err?.message?.includes('sort_order')) {
          this.logger.warn('fields.sort_order column missing; run tenant-db-add-field-sort-order-v2.sql to enable field ordering');
        } else {
          throw err;
        }
      }
      return this.findOne(tenantId, collectionId);
    });
  }

  private toResponse(
    row: { id: string; project_id: string; dataset_id: string | null; name: string; slug: string; config: any; created_at: Date; updated_at: Date },
    fields: Array<{ id: string; collection_id: string; name: string; type: string; is_required: number; config: any; sort_order?: number; created_at: Date; updated_at: Date }>,
  ): CollectionResponse {
    const config = row.config != null ? (typeof row.config === 'string' ? JSON.parse(row.config) : row.config) : null;
    return {
      id: row.id,
      project_id: row.project_id,
      dataset_id: row.dataset_id,
      name: row.name,
      slug: row.slug,
      collection: row.slug,
      config,
      created_at: row.created_at,
      updated_at: row.updated_at,
      fields: fields.map((f) => ({
        id: f.id,
        collection_id: f.collection_id,
        name: f.name,
        field: f.name,
        type: f.type,
        is_required: f.is_required === 1,
        config: f.config != null ? (typeof f.config === 'string' ? JSON.parse(f.config) : f.config) : null,
        created_at: f.created_at,
        updated_at: f.updated_at,
      })),
    };
  }
}
