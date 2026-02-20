import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CollectionsService } from '../collections/collections.service';
import { QueryContentNodesDto } from './dto/query-entries.dto';
import { v4 as uuidv4 } from 'uuid';

export interface ContentNodeEntry {
  id: string;
  projectId: string;
  collectionId: string;
  status: string;
  data: Record<string, any>;
  version: number;
  createdAt: string;
  updatedAt: string;
  title?: string | null;
  slug?: string | null;
}

@Injectable()
export class ContentNodesService {
  private readonly logger = new Logger(ContentNodesService.name);

  constructor(
    private prisma: PrismaService,
    private tenantPrisma: TenantPrismaService,
    private collectionsService: CollectionsService,
  ) {}

  async findAll(
    tenantId: string,
    projectId: string,
    collectionId: string,
    query: QueryContentNodesDto,
  ): Promise<{ data: ContentNodeEntry[]; meta: { total: number; page: number; limit: number } }> {
    if (!projectId || !collectionId) throw new BadRequestException('projectId and collectionId required');

    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      await this.ensureCollection(client, projectId, collectionId);

      const page = query.page ?? 1;
      const limit = query.limit ?? 25;
      const offset = (page - 1) * limit;
      const order = (query.order ?? 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      const sortCol = query.sort ?? 'created_at';
      const safeSort = ['created_at', 'updated_at', 'id', 'status', 'version'].includes(sortCol) ? sortCol : 'created_at';

      let where = `WHERE project_id = ? AND schema_ref_id = ? AND node_type = 'entry'`;
      const params: any[] = [projectId, collectionId];

      if (query.status) {
        where += ` AND status = ?`;
        params.push(query.status);
      }
      if (query.search) {
        where += ` AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.title')) LIKE ?`;
        params.push(`%${query.search}%`);
      }

      const countResult = await client.$queryRawUnsafe<Array<{ c: bigint }>>(
        `SELECT COUNT(*) as c FROM content_nodes ${where}`,
        ...params,
      );
      const total = Number(countResult[0]?.c ?? 0);

      const rows = await client.$queryRawUnsafe<Array<{
        id: string;
        project_id: string;
        schema_ref_id: string;
        data: any;
        status: string;
        version: number;
        created_at: Date;
        updated_at: Date;
      }>>(
        `SELECT id, project_id, schema_ref_id, data, status, version, created_at, updated_at
         FROM content_nodes ${where}
         ORDER BY ${safeSort} ${order} LIMIT ? OFFSET ?`,
        ...params,
        limit,
        offset,
      );

      const data: ContentNodeEntry[] = rows.map((r) => this.rowToEntry(r));
      return { data, meta: { total, page, limit } };
    });
  }

  async findOne(
    tenantId: string,
    projectId: string,
    collectionId: string,
    entryId: string,
  ): Promise<ContentNodeEntry> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      await this.ensureCollection(client, projectId, collectionId);

      const rows = await client.$queryRawUnsafe<Array<{
        id: string;
        project_id: string;
        schema_ref_id: string;
        data: any;
        status: string;
        version: number;
        created_at: Date;
        updated_at: Date;
      }>>(
        `SELECT id, project_id, schema_ref_id, data, status, version, created_at, updated_at
         FROM content_nodes WHERE id = ? AND project_id = ? AND schema_ref_id = ? AND node_type = 'entry'`,
        entryId,
        projectId,
        collectionId,
      );
      if (rows.length === 0) throw new NotFoundException('Entry not found');
      return this.rowToEntry(rows[0]);
    });
  }

  async create(
    tenantId: string,
    projectId: string,
    collectionId: string,
    body: { data: Record<string, any>; status?: string },
    userId?: string,
  ): Promise<ContentNodeEntry> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      await this.ensureCollection(client, projectId, collectionId);

      const id = uuidv4();
      const status = body.status ?? 'draft';
      const data = body.data ?? {};
      const dataJson = JSON.stringify(data);
      await client.$executeRawUnsafe(
        `INSERT INTO content_nodes (id, project_id, schema_ref_id, node_type, data, status, version, created_at, updated_at)
         VALUES (?, ?, ?, 'entry', ?, ?, 1, NOW(), NOW())`,
        id,
        projectId,
        collectionId,
        dataJson,
        status,
      );

      const versionId = uuidv4();
      await client.$executeRawUnsafe(
        `INSERT INTO node_versions (id, node_id, version_number, snapshot, created_at)
         VALUES (?, ?, 1, ?, NOW())`,
        versionId,
        id,
        dataJson,
      );

      return this.findOne(tenantId, projectId, collectionId, id);
    });
  }

  async update(
    tenantId: string,
    projectId: string,
    collectionId: string,
    entryId: string,
    body: { data?: Record<string, any>; status?: string },
    userId?: string,
  ): Promise<ContentNodeEntry> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const existing = await client.$queryRawUnsafe<Array<{ id: string; data: any; version: number }>>(
        `SELECT id, data, version FROM content_nodes WHERE id = ? AND project_id = ? AND schema_ref_id = ? AND node_type = 'entry'`,
        entryId,
        projectId,
        collectionId,
      );
      if (existing.length === 0) throw new NotFoundException('Entry not found');

      const currentData = typeof existing[0].data === 'string' ? JSON.parse(existing[0].data) : existing[0].data;
      const mergedData = body.data ? { ...currentData, ...body.data } : currentData;
      const dataJson = JSON.stringify(mergedData);
      const newVersion = (existing[0].version ?? 1) + 1;
      const status = body.status ?? undefined;

      if (status !== undefined) {
        await client.$executeRawUnsafe(
          `UPDATE content_nodes SET data = ?, status = ?, version = ?, updated_at = NOW() WHERE id = ?`,
          dataJson,
          status,
          newVersion,
          entryId,
        );
      } else {
        await client.$executeRawUnsafe(
          `UPDATE content_nodes SET data = ?, version = ?, updated_at = NOW() WHERE id = ?`,
          dataJson,
          newVersion,
          entryId,
        );
      }

      await client.$executeRawUnsafe(
        `INSERT INTO node_versions (id, node_id, version_number, snapshot, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        uuidv4(),
        entryId,
        newVersion,
        dataJson,
      );

      return this.findOne(tenantId, projectId, collectionId, entryId);
    });
  }

  async remove(
    tenantId: string,
    projectId: string,
    collectionId: string,
    entryId: string,
  ): Promise<void> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const r = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM content_nodes WHERE id = ? AND project_id = ? AND schema_ref_id = ? AND node_type = 'entry'`,
        entryId,
        projectId,
        collectionId,
      );
      if (r.length === 0) throw new NotFoundException('Entry not found');

      await client.$executeRawUnsafe(`DELETE FROM node_versions WHERE node_id = ?`, entryId);
      await client.$executeRawUnsafe(`DELETE FROM content_nodes WHERE id = ?`, entryId);
    });
  }

  async publish(
    tenantId: string,
    projectId: string,
    collectionId: string,
    entryId: string,
  ): Promise<ContentNodeEntry> {
    return this.update(tenantId, projectId, collectionId, entryId, { status: 'published' });
  }

  async unpublish(
    tenantId: string,
    projectId: string,
    collectionId: string,
    entryId: string,
  ): Promise<ContentNodeEntry> {
    return this.update(tenantId, projectId, collectionId, entryId, { status: 'draft' });
  }

  private async ensureCollection(client: any, projectId: string, collectionId: string): Promise<void> {
    const c = (await client.$queryRawUnsafe(
      `SELECT id FROM collections WHERE id = ? AND project_id = ?`,
      collectionId,
      projectId,
    )) as Array<{ id: string }>;
    if (c.length === 0) throw new NotFoundException('Collection not found');
  }

  private rowToEntry(r: {
    id: string;
    project_id: string;
    schema_ref_id: string;
    data: any;
    status: string;
    version: number;
    created_at: Date;
    updated_at: Date;
  }): ContentNodeEntry {
    const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data ?? {};
    return {
      id: r.id,
      projectId: r.project_id,
      collectionId: r.schema_ref_id,
      status: r.status,
      data,
      version: r.version ?? 1,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
      title: data?.title ?? null,
      slug: data?.slug ?? null,
    };
  }
}
