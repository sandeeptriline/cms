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
        // Get user's roles in this tenant
        const userRoles = await client.$queryRawUnsafe<Array<{ role_id: string }>>(
          `SELECT role_id FROM user_roles WHERE user_id = ?`,
          userId,
        );

        if (userRoles.length === 0) {
          return false;
        }

        // Get role IDs
        const roleIds = userRoles.map((ur) => ur.role_id);
        const rolePlaceholders = roleIds.map(() => '?').join(',');

        // Check if any of the user's roles has the permission
        const result = await client.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*) as count
           FROM role_permissions rp
           INNER JOIN user_role_permissions tp ON rp.permission_id = tp.id
           WHERE rp.role_id IN (${rolePlaceholders})
             AND tp.name = ?`,
          ...roleIds,
          permission,
        );

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
        // Get user's roles
        const userRoles = await client.$queryRawUnsafe<Array<{ role_id: string }>>(
          `SELECT role_id FROM user_roles WHERE user_id = ?`,
          userId,
        );

        if (userRoles.length === 0) {
          return [];
        }

        // Get role IDs
        const roleIds = userRoles.map((ur) => ur.role_id);
        const rolePlaceholders = roleIds.map(() => '?').join(',');

        // Get all permissions for user's roles
        const permissions = await client.$queryRawUnsafe<
          Array<{ name: string }>
        >(
          `SELECT DISTINCT tp.name
           FROM role_permissions rp
           INNER JOIN user_role_permissions tp ON rp.permission_id = tp.id
           WHERE rp.role_id IN (${rolePlaceholders})
           ORDER BY tp.name`,
          ...roleIds,
        );

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
        const permissions = await client.$queryRawUnsafe<Array<{ name: string }>>(
          `SELECT tp.name
           FROM role_permissions rp
           INNER JOIN user_role_permissions tp ON rp.permission_id = tp.id
           WHERE rp.role_id = ?
           ORDER BY tp.name`,
          roleId,
        );

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
}
