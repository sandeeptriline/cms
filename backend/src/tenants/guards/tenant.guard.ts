import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { tenants_status } from '@prisma/client';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extract tenant identifier from various sources
    const tenantIdentifier = this.extractTenantId(request);
    
    if (!tenantIdentifier) {
      throw new BadRequestException('Tenant identifier is required (X-Tenant-ID header or X-Tenant-Slug header)');
    }

    // Fetch tenant from database (by ID or slug)
    let tenant;
    if (request._tenantSlug) {
      tenant = await this.prisma.tenants.findUnique({
        where: { slug: request._tenantSlug },
      });
      delete request._tenantSlug;
    } else {
      tenant = await this.prisma.tenants.findUnique({
        where: { id: tenantIdentifier },
      });
    }

    if (!tenant) {
      throw new UnauthorizedException('Tenant not found');
    }

    // Check tenant status
    if (tenant.status === tenants_status.suspended) {
      throw new UnauthorizedException('Tenant is suspended');
    }

    if (tenant.status === tenants_status.deleted) {
      throw new UnauthorizedException('Tenant has been deleted');
    }

    if (tenant.status === tenants_status.provisioning) {
      throw new UnauthorizedException('Tenant is still being provisioned');
    }

    // Attach tenant to request for use in controllers/services
    request.tenant = tenant;
    request.tenantId = tenant.id;
    request.tenantDbName = tenant.db_name;

    return true;
  }

  private extractTenantId(request: any): string | null {
    // Priority order:
    // 1. Header: X-Tenant-ID
    // 2. Query parameter: tenantId
    // 3. Header: X-Tenant-Slug (will be resolved to ID in canActivate)
    
    const tenantId = request.headers['x-tenant-id'] || request.query?.tenantId;
    if (tenantId) {
      return tenantId;
    }

    const tenantSlug = request.headers['x-tenant-slug'];
    if (tenantSlug) {
      // Store slug for resolution in canActivate
      request._tenantSlug = tenantSlug;
      return tenantSlug;
    }

    return null;
  }
}
