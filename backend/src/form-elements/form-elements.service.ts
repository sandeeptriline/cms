import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateFormElementDto } from './dto/create-form-element.dto';
import { UpdateFormElementDto } from './dto/update-form-element.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FormElementsService {
  private readonly logger = new Logger(FormElementsService.name);

  constructor(
    private prisma: PrismaService,
    private tenantPrisma: TenantPrismaService,
  ) {}

  /**
   * Get all form elements for a tenant
   * System elements (project_id = NULL) are available to all projects
   * Custom elements (project_id = specific UUID) are project-specific
   */
  async getFormElements(tenantId: string, projectId?: string) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Build query: system elements (NULL) OR project-specific elements
      let query = `
        SELECT 
          id, project_id, name, \`key\`, type, category, icon, icon_color, description,
          interface, variants, default_variant, validation_rules, default_settings,
          available_settings, supports_conditions, supports_translations, supports_relations,
          is_system, is_active, sort_order, usage_count, created_by, created_at, updated_at
        FROM form_elements
        WHERE is_active = 1
      `;

      const params: any[] = [];

      if (projectId) {
        // Include system elements (NULL) and project-specific elements
        query += ` AND (project_id IS NULL OR project_id = ?)`;
        params.push(projectId);
      } else {
        // Only system elements if no project specified
        query += ` AND project_id IS NULL`;
      }

      query += ` ORDER BY sort_order ASC, name ASC`;

      const formElements = await client.$queryRawUnsafe<Array<{
        id: string;
        project_id: string | null;
        name: string;
        key: string;
        type: string;
        category: string | null;
        icon: string | null;
        icon_color: string | null;
        description: string | null;
        interface: any;
        variants: any;
        default_variant: string | null;
        validation_rules: any;
        default_settings: any;
        available_settings: any;
        supports_conditions: number;
        supports_translations: number;
        supports_relations: number;
        is_system: number;
        is_active: number;
        sort_order: number;
        usage_count: number;
        created_by: string | null;
        created_at: Date;
        updated_at: Date;
      }>>(query, ...params);

      return formElements.map((fe) => ({
        ...fe,
        project_id: fe.project_id || null,
        supports_conditions: fe.supports_conditions === 1,
        supports_translations: fe.supports_translations === 1,
        supports_relations: fe.supports_relations === 1,
        is_system: fe.is_system === 1,
        is_active: fe.is_active === 1,
        interface: typeof fe.interface === 'string' ? JSON.parse(fe.interface) : fe.interface,
        variants: fe.variants ? (typeof fe.variants === 'string' ? JSON.parse(fe.variants) : fe.variants) : null,
        validation_rules: fe.validation_rules ? (typeof fe.validation_rules === 'string' ? JSON.parse(fe.validation_rules) : fe.validation_rules) : null,
        default_settings: fe.default_settings ? (typeof fe.default_settings === 'string' ? JSON.parse(fe.default_settings) : fe.default_settings) : null,
        available_settings: fe.available_settings ? (typeof fe.available_settings === 'string' ? JSON.parse(fe.available_settings) : fe.available_settings) : null,
      }));
    });
  }

  /**
   * Get a form element by ID
   */
  async getFormElementById(tenantId: string, formElementId: string) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const result = await client.$queryRawUnsafe<Array<{
        id: string;
        project_id: string | null;
        name: string;
        key: string;
        type: string;
        category: string | null;
        icon: string | null;
        icon_color: string | null;
        description: string | null;
        interface: any;
        variants: any;
        default_variant: string | null;
        validation_rules: any;
        default_settings: any;
        available_settings: any;
        supports_conditions: number;
        supports_translations: number;
        supports_relations: number;
        is_system: number;
        is_active: number;
        sort_order: number;
        usage_count: number;
        created_by: string | null;
        created_at: Date;
        updated_at: Date;
      }>>(
        `SELECT 
          id, project_id, name, \`key\`, type, category, icon, icon_color, description,
          interface, variants, default_variant, validation_rules, default_settings,
          available_settings, supports_conditions, supports_translations, supports_relations,
          is_system, is_active, sort_order, usage_count, created_by, created_at, updated_at
        FROM form_elements
        WHERE id = ?`,
        formElementId
      );

      if (result.length === 0) {
        throw new NotFoundException('Form element not found');
      }

      const fe = result[0];
      return {
        ...fe,
        project_id: fe.project_id || null,
        supports_conditions: fe.supports_conditions === 1,
        supports_translations: fe.supports_translations === 1,
        supports_relations: fe.supports_relations === 1,
        is_system: fe.is_system === 1,
        is_active: fe.is_active === 1,
        interface: typeof fe.interface === 'string' ? JSON.parse(fe.interface) : fe.interface,
        variants: fe.variants ? (typeof fe.variants === 'string' ? JSON.parse(fe.variants) : fe.variants) : null,
        validation_rules: fe.validation_rules ? (typeof fe.validation_rules === 'string' ? JSON.parse(fe.validation_rules) : fe.validation_rules) : null,
        default_settings: fe.default_settings ? (typeof fe.default_settings === 'string' ? JSON.parse(fe.default_settings) : fe.default_settings) : null,
        available_settings: fe.available_settings ? (typeof fe.available_settings === 'string' ? JSON.parse(fe.available_settings) : fe.available_settings) : null,
      };
    });
  }

  /**
   * Create a new form element
   */
  async createFormElement(tenantId: string, createDto: CreateFormElementDto, userId?: string) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Check if key already exists for this project (or system if project_id is null)
      const existing = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM form_elements 
         WHERE \`key\` = ? AND (project_id = ? OR (project_id IS NULL AND ? IS NULL))`,
        createDto.key,
        createDto.project_id || null,
        createDto.project_id || null
      );

      if (existing.length > 0) {
        throw new BadRequestException(`Form element with key "${createDto.key}" already exists`);
      }

      // Validate project_id if provided
      if (createDto.project_id) {
        const project = await client.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM projects WHERE id = ?`,
          createDto.project_id
        );
        if (project.length === 0) {
          throw new NotFoundException('Project not found');
        }
      }

      const id = uuidv4();
      const now = new Date();

      await client.$executeRawUnsafe(
        `INSERT INTO form_elements (
          id, project_id, name, \`key\`, type, category, icon, icon_color, description,
          interface, variants, default_variant, validation_rules, default_settings,
          available_settings, supports_conditions, supports_translations, supports_relations,
          is_system, is_active, sort_order, usage_count, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        createDto.project_id || null,
        createDto.name,
        createDto.key,
        createDto.type,
        createDto.category || null,
        createDto.icon || null,
        createDto.icon_color || null,
        createDto.description || null,
        JSON.stringify(createDto.interface),
        createDto.variants ? JSON.stringify(createDto.variants) : null,
        createDto.default_variant || null,
        createDto.validation_rules ? JSON.stringify(createDto.validation_rules) : null,
        createDto.default_settings ? JSON.stringify(createDto.default_settings) : null,
        createDto.available_settings ? JSON.stringify(createDto.available_settings) : null,
        createDto.supports_conditions ? 1 : 0,
        createDto.supports_translations ? 1 : 0,
        createDto.supports_relations ? 1 : 0,
        createDto.is_system !== false ? 1 : 0, // Default to system if not specified
        createDto.is_active !== false ? 1 : 0, // Default to active
        createDto.sort_order || 0,
        0, // usage_count
        userId || null,
        now,
        now
      );

      return this.getFormElementById(tenantId, id);
    });
  }

  /**
   * Update a form element
   */
  async updateFormElement(
    tenantId: string,
    formElementId: string,
    updateDto: UpdateFormElementDto,
  ) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Check if form element exists
      const existing = await client.$queryRawUnsafe<Array<{ id: string; is_system: number }>>(
        `SELECT id, is_system FROM form_elements WHERE id = ?`,
        formElementId
      );

      if (existing.length === 0) {
        throw new NotFoundException('Form element not found');
      }

      // System elements cannot be modified (except is_active)
      if (existing[0].is_system === 1 && updateDto.is_system === false) {
        throw new BadRequestException('Cannot modify system form element');
      }

      // Build update query dynamically
      const updates: string[] = [];
      const params: any[] = [];

      if (updateDto.name !== undefined) {
        updates.push('name = ?');
        params.push(updateDto.name);
      }
      if (updateDto.category !== undefined) {
        updates.push('category = ?');
        params.push(updateDto.category || null);
      }
      if (updateDto.icon !== undefined) {
        updates.push('icon = ?');
        params.push(updateDto.icon || null);
      }
      if (updateDto.icon_color !== undefined) {
        updates.push('icon_color = ?');
        params.push(updateDto.icon_color || null);
      }
      if (updateDto.description !== undefined) {
        updates.push('description = ?');
        params.push(updateDto.description || null);
      }
      if (updateDto.interface !== undefined) {
        updates.push('interface = ?');
        params.push(JSON.stringify(updateDto.interface));
      }
      if (updateDto.variants !== undefined) {
        updates.push('variants = ?');
        params.push(updateDto.variants ? JSON.stringify(updateDto.variants) : null);
      }
      if (updateDto.default_variant !== undefined) {
        updates.push('default_variant = ?');
        params.push(updateDto.default_variant || null);
      }
      if (updateDto.validation_rules !== undefined) {
        updates.push('validation_rules = ?');
        params.push(updateDto.validation_rules ? JSON.stringify(updateDto.validation_rules) : null);
      }
      if (updateDto.default_settings !== undefined) {
        updates.push('default_settings = ?');
        params.push(updateDto.default_settings ? JSON.stringify(updateDto.default_settings) : null);
      }
      if (updateDto.available_settings !== undefined) {
        updates.push('available_settings = ?');
        params.push(updateDto.available_settings ? JSON.stringify(updateDto.available_settings) : null);
      }
      if (updateDto.supports_conditions !== undefined) {
        updates.push('supports_conditions = ?');
        params.push(updateDto.supports_conditions ? 1 : 0);
      }
      if (updateDto.supports_translations !== undefined) {
        updates.push('supports_translations = ?');
        params.push(updateDto.supports_translations ? 1 : 0);
      }
      if (updateDto.supports_relations !== undefined) {
        updates.push('supports_relations = ?');
        params.push(updateDto.supports_relations ? 1 : 0);
      }
      if (updateDto.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(updateDto.is_active ? 1 : 0);
      }
      if (updateDto.sort_order !== undefined) {
        updates.push('sort_order = ?');
        params.push(updateDto.sort_order);
      }

      if (updates.length === 0) {
        return this.getFormElementById(tenantId, formElementId);
      }

      updates.push('updated_at = ?');
      params.push(new Date());
      params.push(formElementId);

      await client.$executeRawUnsafe(
        `UPDATE form_elements SET ${updates.join(', ')} WHERE id = ?`,
        ...params
      );

      return this.getFormElementById(tenantId, formElementId);
    });
  }

  /**
   * Delete a form element
   */
  async deleteFormElement(tenantId: string, formElementId: string) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Check if form element exists and is not system
      const existing = await client.$queryRawUnsafe<Array<{ id: string; is_system: number; usage_count: number }>>(
        `SELECT id, is_system, usage_count FROM form_elements WHERE id = ?`,
        formElementId
      );

      if (existing.length === 0) {
        throw new NotFoundException('Form element not found');
      }

      if (existing[0].is_system === 1) {
        throw new BadRequestException('Cannot delete system form element');
      }

      if (existing[0].usage_count > 0) {
        throw new BadRequestException(`Cannot delete form element: it is used in ${existing[0].usage_count} field(s)`);
      }

      await client.$executeRawUnsafe(
        `DELETE FROM form_elements WHERE id = ?`,
        formElementId
      );

      return { message: 'Form element deleted successfully' };
    });
  }
}
