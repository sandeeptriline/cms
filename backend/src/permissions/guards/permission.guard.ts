import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../permissions.service';
import {
  PERMISSION_KEY,
  RequirePermission,
  RequireAnyPermission,
  RequireAllPermissions,
} from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get permission requirement from decorator
    const permissionMetadata = this.reflector.getAllAndOverride<any>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permission requirement, allow access
    if (!permissionMetadata) {
      return true;
    }

    // Get user from request (set by JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const userId = user.userId;

    // Handle different permission requirement types
    if (typeof permissionMetadata === 'string') {
      // Single permission requirement
      const hasPermission = await this.permissionsService.hasPermission(
        userId,
        permissionMetadata,
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Permission denied: ${permissionMetadata} required`,
        );
      }

      return true;
    }

    if (permissionMetadata.type === 'any') {
      // Any of the permissions
      const hasAny = await this.permissionsService.hasAnyPermission(
        userId,
        permissionMetadata.permissions,
      );

      if (!hasAny) {
        throw new ForbiddenException(
          `Permission denied: One of [${permissionMetadata.permissions.join(', ')}] required`,
        );
      }

      return true;
    }

    if (permissionMetadata.type === 'all') {
      // All permissions required
      const hasAll = await this.permissionsService.hasAllPermissions(
        userId,
        permissionMetadata.permissions,
      );

      if (!hasAll) {
        throw new ForbiddenException(
          `Permission denied: All of [${permissionMetadata.permissions.join(', ')}] required`,
        );
      }

      return true;
    }

    // Unknown permission requirement type
    return false;
  }
}
