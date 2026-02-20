import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateComponentDto } from './dto/create-component.dto';
import { UpdateComponentDto } from './dto/update-component.dto';
import { CreateComponentFieldDto } from './dto/create-component-field.dto';
import { UpdateComponentFieldDto } from './dto/update-component-field.dto';

export interface ComponentFieldResponse {
  id: string;
  component_id: string;
  name: string;
  type: string;
  config: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface ComponentResponse {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  config: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  fields: ComponentFieldResponse[];
}

type ComponentFieldRow = {
  id: string;
  component_id: string;
  name: string;
  type: string;
  config: unknown;
  created_at: Date;
  updated_at: Date;
  sort_order?: number;
};

@Injectable()
export class ComponentsService {
  constructor(
    private prisma: PrismaService,
    private tenantPrisma: TenantPrismaService,
  ) {}

  /** Fetch fields for a component. Uses sort_order if the column exists, otherwise ORDER BY name. */
  private async getFieldsForComponent(
    client: { $queryRawUnsafe: any; $executeRawUnsafe?: any },
    componentId: string,
  ): Promise<ComponentFieldRow[]> {
    try {
      const rows = await client.$queryRawUnsafe(
        `SELECT id, component_id, name, type, config, created_at, updated_at
         FROM component_fields WHERE component_id = ? ORDER BY COALESCE(sort_order, 0) ASC, name ASC`,
        componentId,
      );
      return rows as ComponentFieldRow[];
    } catch (err: any) {
      if (err?.message?.includes('sort_order')) {
        const rows = await client.$queryRawUnsafe(
          `SELECT id, component_id, name, type, config, created_at, updated_at
           FROM component_fields WHERE component_id = ? ORDER BY name ASC`,
          componentId,
        );
        return rows as ComponentFieldRow[];
      }
      throw err;
    }
  }

  async findAll(tenantId: string, projectId: string): Promise<ComponentResponse[]> {
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
        name: string;
        slug: string;
        config: unknown;
        created_at: Date;
        updated_at: Date;
      }>>(
        `SELECT id, project_id, name, slug, config, created_at, updated_at
         FROM components WHERE project_id = ? ORDER BY name ASC`,
        projectId,
      );

      const result: ComponentResponse[] = [];
      for (const row of rows) {
        const fields = await this.getFieldsForComponent(client, row.id);
        result.push(this.toResponse(row, fields));
      }
      return result;
    });
  }

  async findOne(tenantId: string, componentId: string): Promise<ComponentResponse> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const rows = await client.$queryRawUnsafe<Array<{
        id: string;
        project_id: string;
        name: string;
        slug: string;
        config: unknown;
        created_at: Date;
        updated_at: Date;
      }>>(
        `SELECT id, project_id, name, slug, config, created_at, updated_at
         FROM components WHERE id = ?`,
        componentId,
      );
      if (rows.length === 0) throw new NotFoundException('Component not found');

      const fields = await this.getFieldsForComponent(client, componentId);
      return this.toResponse(rows[0], fields);
    });
  }

  async create(tenantId: string, dto: CreateComponentDto): Promise<ComponentResponse> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const projectCheck = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM projects WHERE id = ?`,
        dto.projectId,
      );
      if (projectCheck.length === 0) throw new NotFoundException('Project not found');

      const existing = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM components WHERE project_id = ? AND slug = ?`,
        dto.projectId,
        dto.slug,
      );
      if (existing.length > 0) {
        throw new BadRequestException(`Component with slug "${dto.slug}" already exists`);
      }

      const id = uuidv4();
      const configJson = dto.config ? JSON.stringify(dto.config) : null;
      await client.$executeRawUnsafe(
        `INSERT INTO components (id, project_id, name, slug, config, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        id,
        dto.projectId,
        dto.name,
        dto.slug,
        configJson,
      );

      if (dto.fields && dto.fields.length > 0) {
        for (const f of dto.fields) {
          const fieldId = uuidv4();
          const fieldConfig = f.config ? JSON.stringify(f.config) : null;
          await client.$executeRawUnsafe(
            `INSERT INTO component_fields (id, component_id, name, type, config, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            fieldId,
            id,
            f.name,
            f.type,
            fieldConfig,
          );
        }
      }

      return this.findOne(tenantId, id);
    });
  }

  async update(tenantId: string, componentId: string, dto: UpdateComponentDto): Promise<ComponentResponse> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const existing = await client.$queryRawUnsafe<Array<{ id: string; project_id: string }>>(
        `SELECT id, project_id FROM components WHERE id = ?`,
        componentId,
      );
      if (existing.length === 0) throw new NotFoundException('Component not found');

      const updates: string[] = [];
      const params: any[] = [];
      if (dto.name !== undefined) {
        updates.push('name = ?');
        params.push(dto.name);
      }
      if (dto.slug !== undefined) {
        const projectId = existing[0].project_id;
        const dup = await client.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM components WHERE project_id = ? AND slug = ? AND id != ?`,
          projectId,
          dto.slug,
          componentId,
        );
        if (dup.length > 0) throw new BadRequestException(`Slug "${dto.slug}" already exists`);
        updates.push('slug = ?');
        params.push(dto.slug);
      }
      if (dto.config !== undefined) {
        updates.push('config = ?');
        params.push(JSON.stringify(dto.config));
      }
      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        params.push(componentId);
        await client.$executeRawUnsafe(
          `UPDATE components SET ${updates.join(', ')} WHERE id = ?`,
          ...params,
        );
      }
      return this.findOne(tenantId, componentId);
    });
  }

  async remove(tenantId: string, componentId: string): Promise<{ success: boolean }> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const existing = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM components WHERE id = ?`,
        componentId,
      );
      if (existing.length === 0) throw new NotFoundException('Component not found');

      await client.$executeRawUnsafe(`DELETE FROM component_fields WHERE component_id = ?`, componentId);
      await client.$executeRawUnsafe(`DELETE FROM components WHERE id = ?`, componentId);
      return { success: true };
    });
  }

  async addField(
    tenantId: string,
    componentId: string,
    dto: CreateComponentFieldDto,
  ): Promise<ComponentResponse> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const comp = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM components WHERE id = ?`,
        componentId,
      );
      if (comp.length === 0) throw new NotFoundException('Component not found');

      const existing = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM component_fields WHERE component_id = ? AND name = ?`,
        componentId,
        dto.name,
      );
      if (existing.length > 0) throw new BadRequestException(`Field "${dto.name}" already exists`);

      const fieldId = uuidv4();
      const config: Record<string, unknown> = { ...(dto.config || {}), required: !!dto.required };
      const configJson = JSON.stringify(config);
      try {
        const maxSort = await client.$queryRawUnsafe<Array<{ max_sort: number }>>(
          `SELECT MAX(COALESCE(sort_order, 0)) AS max_sort FROM component_fields WHERE component_id = ?`,
          componentId,
        );
        const nextSort = (maxSort[0]?.max_sort ?? -1) + 1;
        await client.$executeRawUnsafe(
          `INSERT INTO component_fields (id, component_id, name, type, config, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          fieldId,
          componentId,
          dto.name,
          dto.type,
          configJson,
          nextSort,
        );
      } catch (err: any) {
        if (err?.message?.includes('sort_order')) {
          await client.$executeRawUnsafe(
            `INSERT INTO component_fields (id, component_id, name, type, config, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            fieldId,
            componentId,
            dto.name,
            dto.type,
            configJson,
          );
        } else {
          throw err;
        }
      }
      return this.findOne(tenantId, componentId);
    });
  }

  async updateField(
    tenantId: string,
    componentId: string,
    fieldId: string,
    dto: UpdateComponentFieldDto,
  ): Promise<ComponentResponse> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const comp = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM components WHERE id = ?`,
        componentId,
      );
      if (comp.length === 0) throw new NotFoundException('Component not found');

      const rows = await client.$queryRawUnsafe<Array<{ id: string; config: unknown }>>(
        `SELECT id, config FROM component_fields WHERE component_id = ? AND id = ?`,
        componentId,
        fieldId,
      );
      if (rows.length === 0) throw new NotFoundException('Component field not found');

      const updates: string[] = [];
      const params: any[] = [];
      if (dto.name !== undefined) {
        const dup = await client.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM component_fields WHERE component_id = ? AND name = ? AND id != ?`,
          componentId,
          dto.name,
          fieldId,
        );
        if (dup.length > 0) throw new BadRequestException(`Field "${dto.name}" already exists`);
        updates.push('name = ?');
        params.push(dto.name);
      }
      if (dto.type !== undefined) {
        updates.push('type = ?');
        params.push(dto.type);
      }
      if (dto.required !== undefined || dto.config !== undefined) {
        const currentConfig = rows[0].config != null
          ? (typeof rows[0].config === 'string' ? JSON.parse(rows[0].config as string) : rows[0].config) as Record<string, unknown>
          : {};
        const merged = { ...currentConfig, ...(dto.config || {}) };
        if (dto.required !== undefined) merged.required = dto.required;
        updates.push('config = ?');
        params.push(JSON.stringify(merged));
      }
      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        params.push(fieldId);
        await client.$executeRawUnsafe(
          `UPDATE component_fields SET ${updates.join(', ')} WHERE id = ?`,
          ...params,
        );
      }
      return this.findOne(tenantId, componentId);
    });
  }

  async removeField(
    tenantId: string,
    componentId: string,
    fieldId: string,
  ): Promise<ComponentResponse> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const comp = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM components WHERE id = ?`,
        componentId,
      );
      if (comp.length === 0) throw new NotFoundException('Component not found');

      const result = await client.$executeRawUnsafe(
        `DELETE FROM component_fields WHERE component_id = ? AND id = ?`,
        componentId,
        fieldId,
      );
      if (typeof result === 'number' && result === 0) {
        throw new NotFoundException('Component field not found');
      }
      return this.findOne(tenantId, componentId);
    });
  }

  async updateFieldOrder(
    tenantId: string,
    componentId: string,
    fieldOrders: Array<{ id: string; sort: number }>,
  ): Promise<ComponentResponse> {
    const tenant = await this.prisma.tenants.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const comp = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM components WHERE id = ?`,
        componentId,
      );
      if (comp.length === 0) throw new NotFoundException('Component not found');

      try {
        for (const fo of fieldOrders) {
          await client.$executeRawUnsafe(
            `UPDATE component_fields SET sort_order = ?, updated_at = NOW() WHERE id = ? AND component_id = ?`,
            fo.sort,
            fo.id,
            componentId,
          );
        }
      } catch (err: any) {
        if (err?.message?.includes('sort_order')) {
          // Column missing; skip reorder
        } else {
          throw err;
        }
      }
      return this.findOne(tenantId, componentId);
    });
  }

  private toResponse(
    row: { id: string; project_id: string; name: string; slug: string; config: unknown; created_at: Date; updated_at: Date },
    fields: ComponentFieldRow[],
  ): ComponentResponse {
    const config = row.config != null ? (typeof row.config === 'string' ? JSON.parse(row.config as string) : row.config) as Record<string, unknown> : null;
    return {
      id: row.id,
      project_id: row.project_id,
      name: row.name,
      slug: row.slug,
      config,
      created_at: row.created_at,
      updated_at: row.updated_at,
      fields: fields.map((f) => ({
        id: f.id,
        component_id: f.component_id,
        name: f.name,
        type: f.type,
        config: f.config != null ? (typeof f.config === 'string' ? JSON.parse(f.config as string) : f.config) as Record<string, unknown> : null,
        created_at: f.created_at,
        updated_at: f.updated_at,
      })),
    };
  }
}
