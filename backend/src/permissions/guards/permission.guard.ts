import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../permissions.service';
import { TenantPermissionsService } from '../tenant-permissions.service';
import {
  PERMISSION_KEY,
  RequirePermission,
  RequireAnyPermission,
  RequireAllPermissions,
} from '../decorators/require-permission.decorator';

// Type definitions for permission metadata
type PermissionMetadata =
  | string // Single permission
  | { type: 'any'; permissions: string[] } // Any of permissions
  | { type: 'all'; permissions: string[] }; // All permissions

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
    private tenantPermissionsService: TenantPermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get permission requirement from decorator
    const permissionMetadata = this.reflector.getAllAndOverride<PermissionMetadata>(
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
    const tenantId = user.tenantId;

    // Super Admin bypass: Super Admin has all permissions
    if (tenantId === null && user.roles?.includes('Super Admin')) {
      return true;
    }

    // Determine if this is a platform or tenant permission
    // Platform permissions: tenant:*, theme:*, platform:*, user:* (for cross-tenant)
    // Tenant permissions: content_*, media:*, page:*, block:*, etc.
    const isPlatformPermission = this.isPlatformPermission(permissionMetadata);

    // Handle different permission requirement types
    if (typeof permissionMetadata === 'string') {
      // Single permission requirement
      let hasPermission: boolean;

      if (isPlatformPermission) {
        // Platform-level permission (Super Admin only)
        if (tenantId !== null) {
          throw new ForbiddenException(
            `Permission denied: ${permissionMetadata} is a platform-level permission`,
          );
        }
        hasPermission = await this.permissionsService.hasPermission(
          userId,
          permissionMetadata,
        );
      } else {
        // Tenant-level permission
        if (tenantId === null) {
          // Super Admin accessing tenant permission - allow (Super Admin has all permissions)
          hasPermission = true;
        } else {
          hasPermission = await this.tenantPermissionsService.hasPermission(
            userId,
            tenantId,
            permissionMetadata,
          );
        }
      }

      if (!hasPermission) {
        throw new ForbiddenException(
          `Permission denied: ${permissionMetadata} required`,
        );
      }

      return true;
    }

    // Type guard for object metadata
    if (typeof permissionMetadata === 'object' && permissionMetadata !== null) {
      if ('type' in permissionMetadata && permissionMetadata.type === 'any') {
        // Any of the permissions
        let hasAny: boolean;

        // Check if all are platform permissions or all are tenant permissions
        const allPlatform = permissionMetadata.permissions.every((p) =>
          this.isPlatformPermission(p),
        );

        if (allPlatform) {
          if (tenantId !== null) {
            throw new ForbiddenException(
              `Permission denied: Platform-level permissions required`,
            );
          }
          hasAny = await this.permissionsService.hasAnyPermission(
            userId,
            permissionMetadata.permissions,
          );
        } else {
          if (tenantId === null) {
            // Super Admin - has all permissions
            hasAny = true;
          } else {
            hasAny = await this.tenantPermissionsService.hasAnyPermission(
              userId,
              tenantId,
              permissionMetadata.permissions,
            );
          }
        }

        if (!hasAny) {
          throw new ForbiddenException(
            `Permission denied: One of [${permissionMetadata.permissions.join(', ')}] required`,
          );
        }

        return true;
      }

      if ('type' in permissionMetadata && permissionMetadata.type === 'all') {
        // All permissions required
        let hasAll: boolean;

        const allPlatform = permissionMetadata.permissions.every((p) =>
          this.isPlatformPermission(p),
        );

        if (allPlatform) {
          if (tenantId !== null) {
            throw new ForbiddenException(
              `Permission denied: Platform-level permissions required`,
            );
          }
          hasAll = await this.permissionsService.hasAllPermissions(
            userId,
            permissionMetadata.permissions,
          );
        } else {
          if (tenantId === null) {
            // Super Admin - has all permissions
            hasAll = true;
          } else {
            hasAll = await this.tenantPermissionsService.hasAllPermissions(
              userId,
              tenantId,
              permissionMetadata.permissions,
            );
          }
        }

        if (!hasAll) {
          throw new ForbiddenException(
            `Permission denied: All of [${permissionMetadata.permissions.join(', ')}] required`,
          );
        }

        return true;
      }
    }

    // Unknown permission requirement type
    throw new ForbiddenException('Invalid permission requirement');
  }

  /**
   * Determine if a permission is platform-level or tenant-level
   * Platform permissions: tenant:*, theme:*, platform:*, schema_template:*, library_item:*
   * Tenant permissions: content_*, media:*, page:*, block:*, user:*, role:*, etc.
   */
  private isPlatformPermission(permission: string | { type: string; permissions: string[] }): boolean {
    if (typeof permission === 'string') {
      const platformPrefixes = ['tenant:', 'theme:', 'platform:', 'schema_template:', 'library_item:'];
      return platformPrefixes.some((prefix) => permission.startsWith(prefix));
    }
    // For object metadata, check first permission as indicator
    if (permission.permissions && permission.permissions.length > 0) {
      return this.isPlatformPermission(permission.permissions[0]);
    }
    return false;
  }
}
