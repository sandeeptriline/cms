import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantPermissionsService {
  private readonly logger = new Logger(TenantPermissionsService.name);

  constructor(
    private tenantPrisma: TenantPrismaService,
    private prisma: PrismaService,
  ) {}

  /**
   * Get tenant database name from tenant ID
   */
  private async getTenantDbName(tenantId: string): Promise<string> {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
      select: { db_name: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    return tenant.db_name;
  }

  /**
   * Check if a user has a specific permission in a tenant
   * @param userId User ID
   * @param tenantId Tenant ID
   * @param permission Permission name (e.g., "content_entry:create")
   * @returns true if user has the permission, false otherwise
   */
  async hasPermission(
    userId: string,
    tenantId: string,
    permission: string,
  ): Promise<boolean> {
    try {
      const dbName = await this.getTenantDbName(tenantId);

      return await this.tenantPrisma.withTenant(dbName, async (client) => {
        const userRoles = await client.$queryRawUnsafe<Array<{ role_id: string }>>(
          `SELECT role_id FROM user_roles WHERE user_id = ?`,
          userId,
        );

        if (userRoles.length === 0) {
          return false;
        }

        const roleIds = userRoles.map((ur) => ur.role_id);
        const rolePlaceholders = roleIds.map(() => '?').join(',');

        // v2 schema: no role_permissions; permissions table has (role_id, resource_type, action)
        const hasRolePermissions = (await client.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'role_permissions'`
        )) as Array<{ count: bigint }>;
        if (Number(hasRolePermissions[0]?.count || 0) === 0) {
          // v2: Tenant Admin has all permissions; otherwise check permissions table (resource_type, action)
          const roleNames = (await client.$queryRawUnsafe<Array<{ name: string }>>(
            `SELECT r.name FROM roles r WHERE r.id IN (${rolePlaceholders})`,
            ...roleIds,
          )) as Array<{ name: string }>;
          if (roleNames.some((r) => r.name === 'Tenant Admin')) {
            return true;
          }
          const [resource, action] = permission.includes(':') ? permission.split(':') : [permission, '*'];
          const v2Result = (await client.$queryRawUnsafe<Array<{ count: bigint }>>(
            `SELECT COUNT(*) as count FROM permissions 
             WHERE role_id IN (${rolePlaceholders}) AND resource_type = ? AND (action = ? OR action = '*')`,
            ...roleIds,
            resource,
            action,
          )) as Array<{ count: bigint }>;
          return Number(v2Result[0]?.count || 0) > 0;
        }

        // Legacy: role_permissions + user_role_permissions (permission definitions)
        const result = (await client.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*) as count
           FROM role_permissions rp
           INNER JOIN user_role_permissions tp ON rp.permission_id = tp.id
           WHERE rp.role_id IN (${rolePlaceholders})
             AND tp.name = ?`,
          ...roleIds,
          permission,
        )) as Array<{ count: bigint }>;

        return Number(result[0]?.count || 0) > 0;
      });
    } catch (error) {
      this.logger.error(
        `Error checking tenant permission: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Check if a user has any of the specified permissions
   * @param userId User ID
   * @param tenantId Tenant ID
   * @param permissions Array of permission names
   * @returns true if user has at least one permission, false otherwise
   */
  async hasAnyPermission(
    userId: string,
    tenantId: string,
    permissions: string[],
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, tenantId, permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a user has all of the specified permissions
   * @param userId User ID
   * @param tenantId Tenant ID
   * @param permissions Array of permission names
   * @returns true if user has all permissions, false otherwise
   */
  async hasAllPermissions(
    userId: string,
    tenantId: string,
    permissions: string[],
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, tenantId, permission))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get all permissions for a user in a tenant
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Array of permission names
   */
  async getUserPermissions(
    userId: string,
    tenantId: string,
  ): Promise<string[]> {
    try {
      const dbName = await this.getTenantDbName(tenantId);

      return await this.tenantPrisma.withTenant(dbName, async (client) => {
        const userRoles = await client.$queryRawUnsafe<Array<{ role_id: string }>>(
          `SELECT role_id FROM user_roles WHERE user_id = ?`,
          userId,
        );

        if (userRoles.length === 0) {
          return [];
        }

        const roleIds = userRoles.map((ur) => ur.role_id);
        const rolePlaceholders = roleIds.map(() => '?').join(',');

        const hasRolePermissions = (await client.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'role_permissions'`
        )) as Array<{ count: bigint }>;
        if (Number(hasRolePermissions[0]?.count || 0) === 0) {
          const roleNames = (await client.$queryRawUnsafe<Array<{ name: string }>>(
            `SELECT r.name FROM roles r WHERE r.id IN (${rolePlaceholders})`,
            ...roleIds,
          )) as Array<{ name: string }>;
          if (roleNames.some((r) => r.name === 'Tenant Admin')) {
            return this.getV2TenantAdminPermissionList();
          }
          const rows = (await client.$queryRawUnsafe<Array<{ resource_type: string; action: string }>>(
            `SELECT DISTINCT resource_type, action FROM permissions WHERE role_id IN (${rolePlaceholders}) ORDER BY resource_type, action`,
            ...roleIds,
          )) as Array<{ resource_type: string; action: string }>;
          return rows.map((r) => `${r.resource_type}:${r.action}`);
        }

        const permissions = (await client.$queryRawUnsafe<Array<{ name: string }>>(
          `SELECT DISTINCT tp.name
           FROM role_permissions rp
           INNER JOIN user_role_permissions tp ON rp.permission_id = tp.id
           WHERE rp.role_id IN (${rolePlaceholders})
           ORDER BY tp.name`,
          ...roleIds,
        )) as Array<{ name: string }>;
        return permissions.map((p) => p.name);
      });
    } catch (error) {
      this.logger.error(
        `Error getting user permissions: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Get all permissions for a role in a tenant
   * @param roleId Role ID
   * @param tenantId Tenant ID
   * @returns Array of permission names
   */
  async getRolePermissions(roleId: string, tenantId: string): Promise<string[]> {
    try {
      const dbName = await this.getTenantDbName(tenantId);

      return await this.tenantPrisma.withTenant(dbName, async (client) => {
        const hasRolePermissions = (await client.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'role_permissions'`
        )) as Array<{ count: bigint }>;
        if (Number(hasRolePermissions[0]?.count || 0) === 0) {
          const rows = (await client.$queryRawUnsafe<Array<{ resource_type: string; action: string }>>(
            `SELECT resource_type, action FROM permissions WHERE role_id = ? ORDER BY resource_type, action`,
            roleId,
          )) as Array<{ resource_type: string; action: string }>;
          return rows.map((r) => `${r.resource_type}:${r.action}`);
        }

        const permissions = (await client.$queryRawUnsafe<Array<{ name: string }>>(
          `SELECT tp.name
           FROM role_permissions rp
           INNER JOIN user_role_permissions tp ON rp.permission_id = tp.id
           WHERE rp.role_id = ?
           ORDER BY tp.name`,
          roleId,
        )) as Array<{ name: string }>;
        return permissions.map((p) => p.name);
      });
    } catch (error) {
      this.logger.error(
        `Error getting role permissions: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /** Permission list returned for Tenant Admin in v2 (no role_permissions table). */
  private getV2TenantAdminPermissionList(): string[] {
    const resources = ['content_type', 'content_entry', 'collection', 'project', 'flow', 'form_element', 'tenant_user'];
    const actions = ['read', 'create', 'update', 'delete'];
    const list: string[] = [];
    for (const r of resources) {
      for (const a of actions) {
        list.push(`${r}:${a}`);
      }
    }
    return list;
  }
}
