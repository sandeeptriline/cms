import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    
    // If tenant is already set by guard, use it
    if (request.tenant) {
      return next.handle();
    }

    // Otherwise, try to extract tenant from headers
    const tenantId = request.headers['x-tenant-id'];
    const tenantSlug = request.headers['x-tenant-slug'];

    if (tenantId) {
      const tenant = await this.prisma.tenants.findUnique({
        where: { id: tenantId },
      });
      if (tenant) {
        request.tenant = tenant;
        request.tenantId = tenant.id;
        request.tenantDbName = tenant.db_name;
      }
    } else if (tenantSlug) {
      const tenant = await this.prisma.tenants.findUnique({
        where: { slug: tenantSlug },
      });
      if (tenant) {
        request.tenant = tenant;
        request.tenantId = tenant.id;
        request.tenantDbName = tenant.db_name;
      }
    }

    return next.handle();
  }
}
