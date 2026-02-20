import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { tenants_status } from '@prisma/client';
import { TenantProvisioningService } from './provisioning/tenant-provisioning.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TenantsService {
  constructor(
    private prisma: PrismaService,
    private provisioningService: TenantProvisioningService,
  ) {}

  /** Default Free plan ID for self-signup (must match enterprise-core-db-seed.sql) */
  static readonly FREE_PLAN_ID = 'd0000000-0001-0001-0001-000000000000';

  async create(
    createTenantDto: CreateTenantDto,
    options?: { skipProvisioning?: boolean; planId?: string },
  ) {
    // Check if slug already exists
    const existing = await this.prisma.tenants.findUnique({
      where: { slug: createTenantDto.slug },
    });

    if (existing) {
      throw new ConflictException(`Tenant with slug "${createTenantDto.slug}" already exists`);
    }

    // Generate database name
    const dbName = `cms_tenant_${createTenantDto.slug.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const tenantData: any = {
      id: uuidv4(),
      name: createTenantDto.name,
      slug: createTenantDto.slug,
      db_name: dbName,
      status: tenants_status.provisioning,
      config: createTenantDto.config || {},
      feature_flags: createTenantDto.featureFlags || {},
      usage_limits: createTenantDto.usageLimits || {},
    };

    if (createTenantDto.parentId) {
      tenantData.parent_id = createTenantDto.parentId;
    }

    // Default to Free plan when planId not provided (SaaS self-signup)
    const planId = options?.planId ?? createTenantDto.planId ?? TenantsService.FREE_PLAN_ID;
    tenantData.plan_id = planId;

    // Enterprise: require shard_id (DB has NOT NULL). Use active shard or first shard.
    if (!tenantData.shard_id) {
      const defaultShard =
        (await this.prisma.shards.findFirst({ where: { status: 'active' } })) ??
        (await this.prisma.shards.findFirst({ orderBy: { id: 'asc' } }));
      if (!defaultShard) {
        throw new BadRequestException(
          'No shard available. Run docs/sql-scripts/enterprise-core-db-seed.sql to insert a default shard.',
        );
      }
      tenantData.shard_id = defaultShard.id;
    }

    let tenant;
    try {
      tenant = await this.prisma.tenants.create({
        data: tenantData,
      });
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }

    // Register tenant admin in core tenant_users when adminUserId is provided
    if (createTenantDto.adminUserId) {
      try {
        const platformUser = await this.prisma.users.findUnique({
          where: { id: createTenantDto.adminUserId },
        });
        if (!platformUser) {
          throw new BadRequestException(
            `Admin user "${createTenantDto.adminUserId}" not found in platform users`,
          );
        }
        await this.prisma.tenant_users.create({
          data: {
            id: uuidv4(),
            tenant_id: tenant.id,
            user_id: createTenantDto.adminUserId,
            status: 'active',
          },
        });
      } catch (err: any) {
        if (err instanceof BadRequestException) throw err;
        console.error('Failed to register tenant admin in tenant_users:', err?.message);
        // Don't fail tenant creation; log and continue
      }
    }

    // Provision tenant database (async in background unless skipProvisioning was used by caller)
    if (!options?.skipProvisioning) {
      setImmediate(async () => {
        try {
          await this.provisioningService.provisionTenant(tenant.id, dbName);
          console.log(`✅ Tenant ${tenant.id} (${dbName}) provisioning completed successfully`);
        } catch (error: any) {
          console.error(`❌ Failed to provision tenant ${tenant.id} (${dbName}):`, error.message);
          console.error('Error details:', error);
        }
      });
    }

    return tenant;
  }

  async findAll() {
    return this.prisma.tenants.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id },
      include: {
        other_tenants: true, // children
        tenants: true, // parent
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found`);
    }

    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug "${slug}" not found`);
    }

    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    const tenant = await this.findOne(id);

    // Check slug uniqueness if slug is being updated
    if (updateTenantDto.slug && updateTenantDto.slug !== tenant.slug) {
      const existing = await this.prisma.tenants.findUnique({
        where: { slug: updateTenantDto.slug },
      });

      if (existing) {
        throw new ConflictException(`Tenant with slug "${updateTenantDto.slug}" already exists`);
      }
    }

    return this.prisma.tenants.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async remove(id: string) {
    const tenant = await this.findOne(id);

    // Soft delete: set status to DELETED
    return this.prisma.tenants.update({
      where: { id },
      data: { status: tenants_status.deleted },
    });
  }

  async activate(id: string) {
    return this.update(id, { status: tenants_status.active });
  }

  async suspend(id: string) {
    return this.update(id, { status: tenants_status.suspended });
  }

  /**
   * Reset tenant database to Composable Content Graph v2 structure.
   * Drops all tables in the tenant DB and recreates them from tenant-db-init-v2.sql.
   * All data in the tenant database is permanently lost.
   */
  async resetTenantDb(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.provisioningService.resetTenantDbToV2(id);
    return { message: 'Tenant database has been reset to v2 structure.' };
  }
}
