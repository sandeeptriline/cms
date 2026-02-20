import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormElementDto } from './dto/create-form-element.dto';
import { UpdateFormElementDto } from './dto/update-form-element.dto';
import { v4 as uuidv4 } from 'uuid';

/** Row shape from platform DB form_elements (cms_platform) */
interface FormElementRow {
  id: string;
  name: string;
  key: string;
  type: string;
  category: string | null;
  icon: string | null;
  icon_color: string | null;
  description: string | null;
  interface: unknown;
  variants: unknown;
  default_variant: string | null;
  validation_rules: unknown;
  default_settings: unknown;
  available_settings: unknown;
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
}

@Injectable()
export class FormElementsService {
  private readonly logger = new Logger(FormElementsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all form elements from platform DB (cms_platform.form_elements).
   * Optional filter: category, is_active (default true).
   */
  async getFormElements(tenantId: string, _projectId?: string) {
    const query = `
      SELECT
        id, name, \`key\`, type, category, icon, icon_color, description,
        interface, variants, default_variant, validation_rules, default_settings,
        available_settings, supports_conditions, supports_translations, supports_relations,
        is_system, is_active, sort_order, usage_count, created_by, created_at, updated_at
      FROM form_elements
      WHERE is_active = 1
      ORDER BY sort_order ASC, name ASC
    `;
    const rows = await this.prisma.$queryRawUnsafe<FormElementRow[]>(query);
    return rows.map((fe) => this.mapRow(fe));
  }

  /**
   * Get a form element by ID from platform DB.
   */
  async getFormElementById(tenantId: string, formElementId: string) {
    const rows = await this.prisma.$queryRawUnsafe<FormElementRow[]>(
      `SELECT
        id, name, \`key\`, type, category, icon, icon_color, description,
        interface, variants, default_variant, validation_rules, default_settings,
        available_settings, supports_conditions, supports_translations, supports_relations,
        is_system, is_active, sort_order, usage_count, created_by, created_at, updated_at
      FROM form_elements
      WHERE id = ?`,
      formElementId
    );
    if (rows.length === 0) {
      throw new NotFoundException('Form element not found');
    }
    return this.mapRow(rows[0]);
  }

  /**
   * Create a new form element in platform DB.
   */
  async createFormElement(tenantId: string, createDto: CreateFormElementDto, userId?: string) {
    const existing = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM form_elements WHERE \`key\` = ?`,
      createDto.key
    );
    if (existing.length > 0) {
      throw new BadRequestException(`Form element with key "${createDto.key}" already exists`);
    }

    const id = uuidv4();
    const now = new Date();

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO form_elements (
        id, name, \`key\`, type, category, icon, icon_color, description,
        interface, variants, default_variant, validation_rules, default_settings,
        available_settings, supports_conditions, supports_translations, supports_relations,
        is_system, is_active, sort_order, usage_count, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      createDto.name,
      createDto.key,
      createDto.type,
      createDto.category ?? null,
      createDto.icon ?? null,
      createDto.icon_color ?? null,
      createDto.description ?? null,
      JSON.stringify(createDto.interface),
      createDto.variants ? JSON.stringify(createDto.variants) : null,
      createDto.default_variant ?? null,
      createDto.validation_rules ? JSON.stringify(createDto.validation_rules) : null,
      createDto.default_settings ? JSON.stringify(createDto.default_settings) : null,
      createDto.available_settings ? JSON.stringify(createDto.available_settings) : null,
      createDto.supports_conditions ? 1 : 0,
      createDto.supports_translations ? 1 : 0,
      createDto.supports_relations ? 1 : 0,
      createDto.is_system !== false ? 1 : 0,
      createDto.is_active !== false ? 1 : 0,
      createDto.sort_order ?? 0,
      0,
      userId ?? null,
      now,
      now
    );

    return this.getFormElementById(tenantId, id);
  }

  /**
   * Update a form element in platform DB.
   */
  async updateFormElement(
    tenantId: string,
    formElementId: string,
    updateDto: UpdateFormElementDto,
  ) {
    const existing = await this.prisma.$queryRawUnsafe<Array<{ id: string; is_system: number }>>(
      `SELECT id, is_system FROM form_elements WHERE id = ?`,
      formElementId
    );
    if (existing.length === 0) {
      throw new NotFoundException('Form element not found');
    }
    if (existing[0].is_system === 1 && updateDto.is_system === false) {
      throw new BadRequestException('Cannot modify system form element');
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (updateDto.name !== undefined) { updates.push('name = ?'); params.push(updateDto.name); }
    if (updateDto.category !== undefined) { updates.push('category = ?'); params.push(updateDto.category ?? null); }
    if (updateDto.icon !== undefined) { updates.push('icon = ?'); params.push(updateDto.icon ?? null); }
    if (updateDto.icon_color !== undefined) { updates.push('icon_color = ?'); params.push(updateDto.icon_color ?? null); }
    if (updateDto.description !== undefined) { updates.push('description = ?'); params.push(updateDto.description ?? null); }
    if (updateDto.interface !== undefined) { updates.push('interface = ?'); params.push(JSON.stringify(updateDto.interface)); }
    if (updateDto.variants !== undefined) { updates.push('variants = ?'); params.push(updateDto.variants ? JSON.stringify(updateDto.variants) : null); }
    if (updateDto.default_variant !== undefined) { updates.push('default_variant = ?'); params.push(updateDto.default_variant ?? null); }
    if (updateDto.validation_rules !== undefined) { updates.push('validation_rules = ?'); params.push(updateDto.validation_rules ? JSON.stringify(updateDto.validation_rules) : null); }
    if (updateDto.default_settings !== undefined) { updates.push('default_settings = ?'); params.push(updateDto.default_settings ? JSON.stringify(updateDto.default_settings) : null); }
    if (updateDto.available_settings !== undefined) { updates.push('available_settings = ?'); params.push(updateDto.available_settings ? JSON.stringify(updateDto.available_settings) : null); }
    if (updateDto.supports_conditions !== undefined) { updates.push('supports_conditions = ?'); params.push(updateDto.supports_conditions ? 1 : 0); }
    if (updateDto.supports_translations !== undefined) { updates.push('supports_translations = ?'); params.push(updateDto.supports_translations ? 1 : 0); }
    if (updateDto.supports_relations !== undefined) { updates.push('supports_relations = ?'); params.push(updateDto.supports_relations ? 1 : 0); }
    if (updateDto.is_active !== undefined) { updates.push('is_active = ?'); params.push(updateDto.is_active ? 1 : 0); }
    if (updateDto.sort_order !== undefined) { updates.push('sort_order = ?'); params.push(updateDto.sort_order); }

    if (updates.length === 0) {
      return this.getFormElementById(tenantId, formElementId);
    }

    updates.push('updated_at = ?');
    params.push(new Date());
    params.push(formElementId);

    await this.prisma.$executeRawUnsafe(
      `UPDATE form_elements SET ${updates.join(', ')} WHERE id = ?`,
      ...params
    );
    return this.getFormElementById(tenantId, formElementId);
  }

  /**
   * Delete a form element from platform DB (only non-system and usage_count = 0).
   */
  async deleteFormElement(tenantId: string, formElementId: string) {
    const existing = await this.prisma.$queryRawUnsafe<Array<{ id: string; is_system: number; usage_count: number }>>(
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

    await this.prisma.$executeRawUnsafe(
      `DELETE FROM form_elements WHERE id = ?`,
      formElementId
    );
    return { message: 'Form element deleted successfully' };
  }

  private mapRow(fe: FormElementRow) {
    return {
      ...fe,
      supports_conditions: fe.supports_conditions === 1,
      supports_translations: fe.supports_translations === 1,
      supports_relations: fe.supports_relations === 1,
      is_system: fe.is_system === 1,
      is_active: fe.is_active === 1,
      interface: typeof fe.interface === 'string' ? JSON.parse(fe.interface) : fe.interface,
      variants: fe.variants ? (typeof fe.variants === 'string' ? JSON.parse(fe.variants as string) : fe.variants) : null,
      validation_rules: fe.validation_rules ? (typeof fe.validation_rules === 'string' ? JSON.parse(fe.validation_rules as string) : fe.validation_rules) : null,
      default_settings: fe.default_settings ? (typeof fe.default_settings === 'string' ? JSON.parse(fe.default_settings as string) : fe.default_settings) : null,
      available_settings: fe.available_settings ? (typeof fe.available_settings === 'string' ? JSON.parse(fe.available_settings as string) : fe.available_settings) : null,
    };
  }
}
