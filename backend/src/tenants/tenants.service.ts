import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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

  async create(createTenantDto: CreateTenantDto) {
    // Check if slug already exists
    const existing = await this.prisma.tenants.findUnique({
      where: { slug: createTenantDto.slug },
    });

    if (existing) {
      throw new ConflictException(`Tenant with slug "${createTenantDto.slug}" already exists`);
    }

    // Generate database name
    const dbName = `cms_tenant_${createTenantDto.slug.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Create tenant
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

    let tenant;
    try {
      tenant = await this.prisma.tenants.create({
        data: tenantData,
      });
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }

    // Provision tenant database asynchronously
    // Don't await - let it run in background
    setImmediate(() => {
      this.provisioningService.provisionTenant(tenant.id, dbName).catch((error) => {
        console.error(`Failed to provision tenant ${tenant.id}:`, error);
        // Status will be updated to suspended by provisioning service on failure
      }).then(() => {
        console.log(`Tenant ${tenant.id} provisioning completed`);
      });
    });

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
}
