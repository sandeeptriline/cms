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
    const user = request.user; // From JWT guard (if authenticated)

    // Super Admin can access any tenant or no tenant
    if (user && user.roles && user.roles.includes('Super Admin')) {
      // Super Admin can proceed without tenant context
      // Or can access any tenant if tenant ID is provided
      const tenantIdentifier = this.extractTenantId(request);
      if (tenantIdentifier) {
        // Optional: Validate tenant exists for Super Admin
        const tenant = await this.prisma.tenants.findUnique({
          where: { id: tenantIdentifier },
        });
        if (tenant) {
          request.tenant = tenant;
          request.tenantId = tenant.id;
          request.tenantDbName = tenant.db_name;
        }
      }
      // Super Admin can proceed even without tenant context
      return true;
    }

    // Regular tenant users require tenant context
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
      throw new UnauthorizedException(
        'Tenant is suspended. Please contact the administrator to activate the tenant or use PATCH /api/tenants/:id/activate to activate it.',
      );
    }

    if (tenant.status === tenants_status.deleted) {
      throw new UnauthorizedException('Tenant has been deleted and is no longer accessible.');
    }

    if (tenant.status === tenants_status.provisioning) {
      throw new UnauthorizedException(
        'Tenant is still being provisioned. Please wait a few moments and try again. The tenant will be automatically activated once provisioning is complete.',
      );
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
