import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateContentTypeDto, CreateFieldDto } from './dto/create-content-type.dto';
import { UpdateContentTypeDto } from './dto/update-content-type.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DataModelsService {
  private readonly logger = new Logger(DataModelsService.name);

  constructor(
    private prisma: PrismaService,
    private tenantPrisma: TenantPrismaService,
  ) {}

  /**
   * Get all data models for a tenant
   */
  async getContentTypes(tenantId: string, projectId?: string) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Get default project if not specified
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

      // Get data models with fields
      const contentTypes = await client.$queryRawUnsafe<Array<{
        id: string;
        project_id: string;
        name: string;
        collection: string;
        icon: string | null;
        is_system: number;
        singleton: number;
        note: string | null;
        hidden: number;
        created_at: Date;
        updated_at: Date;
      }>>(
        `SELECT 
          id, project_id, name, collection, icon, is_system, 
          singleton, note, hidden, created_at, updated_at
        FROM content_types 
        WHERE project_id = ?
        ORDER BY name ASC`,
        projectIdToUse
      );

      // Get fields for each content type
      const contentTypesWithFields = await Promise.all(
        contentTypes.map(async (ct) => {
          const fields = await client.$queryRawUnsafe<Array<{
            id: string;
            field: string;
            type: string;
            interface: string | null;
            options: any;
            validation: any;
            required: number;
            hidden: number;
            readonly: number;
            sort: number | null;
            note: string | null;
            created_at: Date;
            updated_at: Date;
          }>>(
            `SELECT 
              id, field, type, interface, options, validation,
              required, hidden, readonly, sort, note, created_at, updated_at
            FROM fields 
            WHERE content_type_id = ?
            ORDER BY sort ASC, field ASC`,
            ct.id
          );

          return {
            ...ct,
            is_system: ct.is_system === 1,
            singleton: ct.singleton === 1,
            hidden: ct.hidden === 1,
            fields: fields.map(f => ({
              ...f,
              required: f.required === 1,
              hidden: f.hidden === 1,
              readonly: f.readonly === 1,
            })),
          };
        })
      );

      return contentTypesWithFields;
    });
  }

  /**
   * Get a single data model by ID
   */
  async getContentTypeById(tenantId: string, contentTypeId: string) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const contentTypes = await client.$queryRawUnsafe<Array<{
        id: string;
        project_id: string;
        name: string;
        collection: string;
        icon: string | null;
        is_system: number;
        singleton: number;
        note: string | null;
        hidden: number;
        created_at: Date;
        updated_at: Date;
      }>>(
        `SELECT 
          id, project_id, name, collection, icon, is_system, 
          singleton, note, hidden, created_at, updated_at
        FROM content_types 
        WHERE id = ?`,
        contentTypeId
      );

      if (contentTypes.length === 0) {
        throw new NotFoundException('Content type not found');
      }

      const ct = contentTypes[0];

      // Get fields
      const fields = await client.$queryRawUnsafe<Array<any>>(
        `SELECT 
          id, field, type, interface, options, validation,
          required, hidden, readonly, sort, note, created_at, updated_at
        FROM fields 
        WHERE content_type_id = ?
        ORDER BY sort ASC, field ASC`,
        ct.id
      );

      return {
        ...ct,
        is_system: ct.is_system === 1,
        singleton: ct.singleton === 1,
        hidden: ct.hidden === 1,
        fields: fields.map(f => ({
          ...f,
          required: f.required === 1,
          hidden: f.hidden === 1,
          readonly: f.readonly === 1,
        })),
      };
    });
  }

  /**
   * Create a new data model
   */
  async createContentType(tenantId: string, createDto: CreateContentTypeDto) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Get default project, or create one if none exists
      let defaultProject = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM projects ORDER BY created_at ASC LIMIT 1`
      );
      
      let projectId: string;
      if (defaultProject.length === 0) {
        // Create default project if none exists
        projectId = uuidv4();
        await client.$executeRawUnsafe(
          `INSERT INTO projects (id, name, slug, config, feature_flags, created_at, updated_at)
           VALUES (?, ?, ?, '{}', '{}', NOW(), NOW())`,
          projectId,
          'Default Project',
          'default'
        );
        this.logger.log(`Default project created for tenant ${tenantId}`);
      } else {
        projectId = defaultProject[0].id;
      }

      // Check if collection already exists
      const existing = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM content_types WHERE project_id = ? AND collection = ?`,
        projectId,
        createDto.collection
      );

      if (existing.length > 0) {
        throw new BadRequestException(`Data model with collection "${createDto.collection}" already exists`);
      }

      // Create data model
      const contentTypeId = uuidv4();
      await client.$executeRawUnsafe(
        `INSERT INTO content_types 
        (id, project_id, name, collection, icon, singleton, note, hidden, is_system, \`schema\`, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, '{}', NOW(), NOW())`,
        contentTypeId,
        projectId,
        createDto.name,
        createDto.collection,
        createDto.icon || null,
        createDto.singleton ? 1 : 0,
        createDto.note || null,
        createDto.hidden ? 1 : 0
      );

      // Create fields if provided
      if (createDto.fields && createDto.fields.length > 0) {
        for (const fieldDto of createDto.fields) {
          await this.createFieldInternal(client, contentTypeId, fieldDto);
        }
      }

      // Return created data model
      return this.getContentTypeById(tenantId, contentTypeId);
    });
  }

  /**
   * Update a data model
   */
  async updateContentType(
    tenantId: string,
    contentTypeId: string,
    updateDto: UpdateContentTypeDto,
  ) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Check if data model exists
      const existing = await client.$queryRawUnsafe<Array<{ id: string; is_system: number }>>(
        `SELECT id, is_system FROM content_types WHERE id = ?`,
        contentTypeId
      );

      if (existing.length === 0) {
        throw new NotFoundException('Data model not found');
      }

      if (existing[0].is_system === 1) {
        throw new BadRequestException('Cannot modify system data models');
      }

      // Build update query
      const updates: string[] = [];
      const params: any[] = [];

      if (updateDto.name !== undefined) {
        updates.push('name = ?');
        params.push(updateDto.name);
      }
      if (updateDto.collection !== undefined) {
        // Check if new collection name is unique
        const duplicate = await client.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM content_types WHERE collection = ? AND id != ?`,
          updateDto.collection,
          contentTypeId
        );
        if (duplicate.length > 0) {
          throw new BadRequestException(`Data model with collection "${updateDto.collection}" already exists`);
        }
        updates.push('collection = ?');
        params.push(updateDto.collection);
      }
      if (updateDto.icon !== undefined) {
        updates.push('icon = ?');
        params.push(updateDto.icon || null);
      }
      if (updateDto.singleton !== undefined) {
        updates.push('singleton = ?');
        params.push(updateDto.singleton ? 1 : 0);
      }
      if (updateDto.note !== undefined) {
        updates.push('note = ?');
        params.push(updateDto.note || null);
      }
      if (updateDto.hidden !== undefined) {
        updates.push('hidden = ?');
        params.push(updateDto.hidden ? 1 : 0);
      }

      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        params.push(contentTypeId);

        await client.$executeRawUnsafe(
          `UPDATE content_types SET ${updates.join(', ')} WHERE id = ?`,
          ...params
        );
      }

      return this.getContentTypeById(tenantId, contentTypeId);
    });
  }

  /**
   * Delete a data model
   */
  async deleteContentType(tenantId: string, contentTypeId: string) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Check if data model exists and is not system
      const existing = await client.$queryRawUnsafe<Array<{ id: string; is_system: number }>>(
        `SELECT id, is_system FROM content_types WHERE id = ?`,
        contentTypeId
      );

      if (existing.length === 0) {
        throw new NotFoundException('Data model not found');
      }

      if (existing[0].is_system === 1) {
        throw new BadRequestException('Cannot delete system data models');
      }

      // Check if content entries exist
      const entries = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM content_entries WHERE content_type_id = ? LIMIT 1`,
        contentTypeId
      );

      if (entries.length > 0) {
        throw new BadRequestException('Cannot delete data model with existing entries. Please delete all entries first.');
      }

      // Delete fields (cascade)
      await client.$executeRawUnsafe(
        `DELETE FROM fields WHERE content_type_id = ?`,
        contentTypeId
      );

      // Delete data model
      await client.$executeRawUnsafe(
        `DELETE FROM content_types WHERE id = ?`,
        contentTypeId
      );

      return { success: true, message: 'Data model deleted successfully' };
    });
  }

  /**
   * Create a field for a data model
   */
  async createField(
    tenantId: string,
    contentTypeId: string,
    fieldDto: CreateFieldDto,
  ) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      await this.createFieldInternal(client, contentTypeId, fieldDto);
      return this.getContentTypeById(tenantId, contentTypeId);
    });
  }

  /**
   * Internal method to create a field (renamed to avoid conflict)
   */
  private async createFieldInternal(client: any, contentTypeId: string, fieldDto: CreateFieldDto) {

    // Check if field already exists
    const existing = await client.$queryRawUnsafe(
      `SELECT id FROM fields WHERE content_type_id = ? AND field = ?`,
      contentTypeId,
      fieldDto.field
    ) as Array<{ id: string }>;

    if (existing.length > 0) {
      throw new BadRequestException(`Field "${fieldDto.field}" already exists in this content type`);
    }

    const fieldId = uuidv4();
    const sortOrder = fieldDto.sort ?? 0;

    await client.$executeRawUnsafe(
      `INSERT INTO fields 
      (id, content_type_id, field, type, interface, options, validation, 
       required, hidden, readonly, sort, note, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      fieldId,
      contentTypeId,
      fieldDto.field,
      fieldDto.type,
      fieldDto.interface || null,
      fieldDto.options ? JSON.stringify(fieldDto.options) : null,
      fieldDto.validation ? JSON.stringify(fieldDto.validation) : null,
      fieldDto.required ? 1 : 0,
      fieldDto.hidden ? 1 : 0,
      fieldDto.readonly ? 1 : 0,
      sortOrder,
      fieldDto.note || null
    );

    return { id: fieldId, ...fieldDto };
  }

  /**
   * Update a field in a data model
   */
  async updateField(
    tenantId: string,
    contentTypeId: string,
    fieldId: string,
    updateDto: UpdateFieldDto,
  ) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Verify data model exists
      const contentType = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM content_types WHERE id = ?`,
        contentTypeId
      );

      if (contentType.length === 0) {
        throw new NotFoundException('Data model not found');
      }

      // Verify field exists
      const existingField = await client.$queryRawUnsafe<Array<{ id: string; field: string }>>(
        `SELECT id, field FROM fields WHERE id = ? AND content_type_id = ?`,
        fieldId,
        contentTypeId
      );

      if (existingField.length === 0) {
        throw new NotFoundException('Field not found');
      }

      // If field name is being changed, check for duplicates
      if (updateDto.field && updateDto.field !== existingField[0].field) {
        const duplicate = await client.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM fields WHERE content_type_id = ? AND field = ? AND id != ?`,
          contentTypeId,
          updateDto.field,
          fieldId
        );

        if (duplicate.length > 0) {
          throw new BadRequestException(`Field "${updateDto.field}" already exists in this content type`);
        }
      }

      // Build update query
      const updates: string[] = [];
      const params: any[] = [];

      if (updateDto.field !== undefined) {
        updates.push('field = ?');
        params.push(updateDto.field);
      }
      if (updateDto.type !== undefined) {
        updates.push('type = ?');
        params.push(updateDto.type);
      }
      if (updateDto.interface !== undefined) {
        updates.push('interface = ?');
        params.push(updateDto.interface || null);
      }
      if (updateDto.options !== undefined) {
        updates.push('options = ?');
        params.push(updateDto.options ? JSON.stringify(updateDto.options) : null);
      }
      if (updateDto.validation !== undefined) {
        updates.push('validation = ?');
        params.push(updateDto.validation ? JSON.stringify(updateDto.validation) : null);
      }
      if (updateDto.required !== undefined) {
        updates.push('required = ?');
        params.push(updateDto.required ? 1 : 0);
      }
      if (updateDto.hidden !== undefined) {
        updates.push('hidden = ?');
        params.push(updateDto.hidden ? 1 : 0);
      }
      if (updateDto.readonly !== undefined) {
        updates.push('readonly = ?');
        params.push(updateDto.readonly ? 1 : 0);
      }
      if (updateDto.sort !== undefined) {
        updates.push('sort = ?');
        params.push(updateDto.sort);
      }
      if (updateDto.note !== undefined) {
        updates.push('note = ?');
        params.push(updateDto.note || null);
      }

      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        params.push(fieldId, contentTypeId);

        await client.$executeRawUnsafe(
          `UPDATE fields SET ${updates.join(', ')} WHERE id = ? AND content_type_id = ?`,
          ...params
        );
      }

      // Get and return the updated field
      type FieldRow = {
        id: string;
        field: string;
        type: string;
        interface: string | null;
        options: string | null;
        validation: string | null;
        required: number;
        hidden: number;
        readonly: number;
        sort: number | null;
        note: string | null;
        created_at: Date;
        updated_at: Date;
      };

      const updatedField = await client.$queryRawUnsafe<FieldRow[]>(
        `SELECT * FROM fields WHERE id = ? AND content_type_id = ?`,
        fieldId,
        contentTypeId
      );

      if (updatedField.length === 0) {
        throw new NotFoundException('Field not found after update');
      }

      const field: FieldRow = updatedField[0];
      return {
        id: field.id,
        field: field.field,
        type: field.type,
        interface: field.interface || undefined,
        options: field.options ? JSON.parse(field.options) : undefined,
        validation: field.validation ? JSON.parse(field.validation) : undefined,
        required: field.required === 1,
        hidden: field.hidden === 1,
        readonly: field.readonly === 1,
        sort: field.sort || undefined,
        note: field.note || undefined,
        created_at: field.created_at,
        updated_at: field.updated_at,
      };
    });
  }

  /**
   * Delete a field from a content type
   */
  async deleteField(
    tenantId: string,
    contentTypeId: string,
    fieldId: string,
  ) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Verify data model exists
      const contentType = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM content_types WHERE id = ?`,
        contentTypeId
      );

      if (contentType.length === 0) {
        throw new NotFoundException('Data model not found');
      }

      // Verify field exists
      const field = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM fields WHERE id = ? AND content_type_id = ?`,
        fieldId,
        contentTypeId
      );

      if (field.length === 0) {
        throw new NotFoundException('Field not found');
      }

      // Delete the field
      await client.$executeRawUnsafe(
        `DELETE FROM fields WHERE id = ? AND content_type_id = ?`,
        fieldId,
        contentTypeId
      );

      return { success: true, message: 'Field deleted successfully' };
    });
  }

  /**
   * Update field order for a data model
   */
  async updateFieldOrder(
    tenantId: string,
    contentTypeId: string,
    fieldOrders: Array<{ id: string; sort: number }>,
  ) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Verify data model exists
      const contentType = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM content_types WHERE id = ?`,
        contentTypeId
      );

      if (contentType.length === 0) {
        throw new NotFoundException('Data model not found');
      }

      // Update each field's sort order
      for (const fieldOrder of fieldOrders) {
        await client.$executeRawUnsafe(
          `UPDATE fields SET sort = ?, updated_at = NOW() WHERE id = ? AND content_type_id = ?`,
          fieldOrder.sort,
          fieldOrder.id,
          contentTypeId
        );
      }

      return { success: true, message: 'Field order updated successfully' };
    });
  }
}
