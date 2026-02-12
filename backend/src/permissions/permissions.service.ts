import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Check if a user has a specific permission
   * @param userId User ID
   * @param permission Permission name (e.g., "tenant:create")
   * @returns true if user has the permission, false otherwise
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      // Get user's roles
      const userRoles = await this.prisma.user_roles.findMany({
        where: { user_id: userId },
        include: {
          role: {
            include: {
              role_permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      // Check if any of the user's roles has the permission
      for (const userRole of userRoles) {
        const hasPermission = userRole.role.role_permissions.some(
          (rp) => rp.permission.name === permission,
        );

        if (hasPermission) {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Error checking permission: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Check if a user has any of the specified permissions
   * @param userId User ID
   * @param permissions Array of permission names
   * @returns true if user has at least one permission, false otherwise
   */
  async hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a user has all of the specified permissions
   * @param userId User ID
   * @param permissions Array of permission names
   * @returns true if user has all permissions, false otherwise
   */
  async hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get all permissions for a user
   * @param userId User ID
   * @returns Array of permission names
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const userRoles = await this.prisma.user_roles.findMany({
        where: { user_id: userId },
        include: {
          role: {
            include: {
              role_permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      const permissions = new Set<string>();

      for (const userRole of userRoles) {
        for (const rp of userRole.role.role_permissions) {
          permissions.add(rp.permission.name);
        }
      }

      return Array.from(permissions);
    } catch (error) {
      this.logger.error(`Error getting user permissions: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Get all permissions for a role
   * @param roleId Role ID
   * @returns Array of permission names
   */
  async getRolePermissions(roleId: string): Promise<string[]> {
    try {
      const role = await this.prisma.roles.findUnique({
        where: { id: roleId },
        include: {
          role_permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!role) {
        return [];
      }

      return role.role_permissions.map((rp) => rp.permission.name);
    } catch (error) {
      this.logger.error(`Error getting role permissions: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Get all available permissions
   * @returns Array of all permissions
   */
  async getAllPermissions() {
    return this.prisma.permissions.findMany({
      orderBy: [
        { category: 'asc' },
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });
  }

  /**
   * Assign permission to role
   * @param roleId Role ID
   * @param permissionId Permission ID
   */
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    await this.prisma.role_permissions.create({
      data: {
        id: this.generateUUID(),
        role_id: roleId,
        permission_id: permissionId,
      },
    });
  }

  /**
   * Remove permission from role
   * @param roleId Role ID
   * @param permissionId Permission ID
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await this.prisma.role_permissions.deleteMany({
      where: {
        role_id: roleId,
        permission_id: permissionId,
      },
    });
  }

  /**
   * Assign multiple permissions to role
   * @param roleId Role ID
   * @param permissionIds Array of permission IDs
   */
  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void> {
    const data = permissionIds.map((permissionId) => ({
      id: this.generateUUID(),
      role_id: roleId,
      permission_id: permissionId,
    }));

    await this.prisma.role_permissions.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * Generate UUID
   */
  private generateUUID(): string {
    return uuidv4();
  }
}
