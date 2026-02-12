import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

/**
 * Decorator to require a specific permission
 * Usage: @RequirePermission('tenant:create')
 */
export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);

/**
 * Decorator to require any of the specified permissions
 * Usage: @RequireAnyPermission(['tenant:create', 'tenant:update'])
 */
export const RequireAnyPermission = (permissions: string[]) =>
  SetMetadata(PERMISSION_KEY, { type: 'any', permissions });

/**
 * Decorator to require all of the specified permissions
 * Usage: @RequireAllPermissions(['tenant:read', 'tenant:update'])
 */
export const RequireAllPermissions = (permissions: string[]) =>
  SetMetadata(PERMISSION_KEY, { type: 'all', permissions });
