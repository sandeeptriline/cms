import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import { UpdateTenantUserDto } from './dto/update-tenant-user.dto';
import { TenantUserFiltersDto } from './dto/tenant-user-filters.dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface TenantUserSummary {
  id: string;
  email: string;
  name: string | null;
  status: number; // 1 = active, 0 = inactive, -1 = deleted
  avatar?: string | null;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  roles?: string[];
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TenantUsersService {
  private readonly logger = new Logger(TenantUsersService.name);

  constructor(
    private prisma: PrismaService,
    private tenantPrisma: TenantPrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Get all users across all tenants (for Super Admin)
   * Aggregates users from all active tenant databases
   */
  async getAllTenantUsers(
    filters?: TenantUserFiltersDto,
  ): Promise<{ users: TenantUserSummary[]; total: number }> {
    this.logger.debug(`Getting all tenant users with filters: ${JSON.stringify(filters)}`);

    // Get tenants to query
    let tenants;
    if (filters?.tenantId) {
      // Filter by specific tenant
      const tenant = await this.prisma.tenants.findUnique({
        where: { id: filters.tenantId },
      });
      tenants = tenant ? [tenant] : [];
    } else {
      // Get all active tenants
      tenants = await this.prisma.tenants.findMany({
        where: { status: 'active' },
      });
    }

    if (tenants.length === 0) {
      return { users: [], total: 0 };
    }

    // Query each tenant database
    const allUsers: TenantUserSummary[] = [];

    for (const tenant of tenants) {
      try {
        const users = await this.tenantPrisma.withTenant(
          tenant.db_name,
          async (client) => {
            // Build query with filters
            let query = `SELECT 
              u.id, 
              u.email, 
              u.name, 
              u.status, 
              u.avatar,
              u.last_login_at,
              u.created_at,
              u.updated_at
            FROM users u
            WHERE 1=1`;
            
            // Exclude deleted users by default (unless explicitly filtering for deleted)
            if (filters?.status === undefined || filters.status !== -1) {
              query += ` AND u.status != -1`;
            }

            const params: any[] = [];

            // Apply filters
            if (filters?.email) {
              query += ` AND u.email LIKE ?`;
              params.push(`%${filters.email}%`);
            }

            if (filters?.status !== undefined) {
              // Status: 1 = active, 0 = inactive, -1 = deleted
              query += ` AND u.status = ?`;
              params.push(filters.status);
            }

            // If filtering by role, need to join with user_roles and roles
            if (filters?.role) {
              query += ` AND EXISTS (
                SELECT 1 FROM user_roles ur
                INNER JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = u.id AND r.name = ?
              )`;
              params.push(filters.role);
            }

            query += ` ORDER BY u.created_at DESC`;

            const result = await client.$queryRawUnsafe<Array<{
              id: string;
              email: string;
              name: string | null;
              status: string | number;
              avatar: string | null;
              last_login_at: Date | null;
              created_at: Date;
              updated_at: Date;
            }>>(query, ...params);

            // Get roles for each user
            const usersWithRoles = await Promise.all(
              result.map(async (user) => {
                try {
                  const roles = await client.$queryRawUnsafe<Array<{ name: string }>>(
                    `SELECT r.name 
                     FROM roles r 
                     INNER JOIN user_roles ur ON r.id = ur.role_id 
                     WHERE ur.user_id = ?`,
                    user.id,
                  );
                  return {
                    ...user,
                    roles: roles.map((r) => r.name),
                  };
                } catch (error) {
                  // Roles table might not exist, return empty array
                  return {
                    ...user,
                    roles: [],
                  };
                }
              }),
            );

            return usersWithRoles;
          },
        );

        // Add tenant information to each user
        allUsers.push(
          ...users.map((user) => ({
            id: user.id,
            email: user.email,
            name: user.name,
            status: typeof user.status === 'string' ? Number(user.status) : user.status,
            avatar: user.avatar,
            roles: user.roles || [],
            lastLoginAt: user.last_login_at,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
            tenantId: tenant.id,
            tenantName: tenant.name,
            tenantSlug: tenant.slug,
          })),
        );
      } catch (error) {
        // Tenant database might not exist or be accessible, skip it
        this.logger.warn(
          `Could not query tenant ${tenant.name} (${tenant.db_name}): ${error.message}`,
        );
        continue;
      }
    }

    // Apply pagination
    const total = allUsers.length;
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = allUsers.slice(startIndex, endIndex);

    this.logger.log(`Found ${total} tenant users across ${tenants.length} tenants`);

    return {
      users: paginatedUsers,
      total,
    };
  }

  /**
   * Get all roles for a specific tenant
   */
  async getTenantRoles(tenantId: string): Promise<Array<{ id: string; name: string; description: string | null }>> {
    this.logger.debug(`Getting roles for tenant: ${tenantId}`);

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const roles = await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      try {
        // Check if 'name' column exists in roles table
        const columnCheck = await client.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*) as count FROM information_schema.columns 
           WHERE table_schema = DATABASE() AND table_name = 'roles' AND column_name = 'name'`
        );

        if (Number(columnCheck[0]?.count) === 0) {
          this.logger.warn(
            `Roles table exists but 'name' column is missing in tenant database: ${tenant.db_name}. ` +
            `This tenant database may need to be updated with the latest schema.`
          );
          // Return empty array - roles cannot be used without name column
          return [];
        }

        // Normal query with name column
        const result = await client.$queryRawUnsafe<Array<{
          id: string;
          name: string;
          description: string | null;
        }>>(
          `SELECT id, name, description FROM roles ORDER BY name ASC`
        );
        return result;
      } catch (error) {
        this.logger.error(
          `Error fetching roles from tenant database ${tenant.db_name}: ${error.message}`,
          error.stack,
        );
        // Return empty array instead of throwing to prevent breaking the UI
        return [];
      }
    });

    return roles;
  }

  /**
   * Get all permissions for a specific role in a tenant (with full details)
   */
  async getRolePermissions(
    tenantId: string,
    roleId: string,
  ): Promise<Array<{
    id: string;
    name: string;
    resource: string;
    action: string;
    category: string;
    description: string | null;
  }>> {
    this.logger.debug(`Getting permissions for role ${roleId} in tenant ${tenantId}`);

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const permissions = await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      try {
        const result = await client.$queryRawUnsafe<Array<{
          id: string;
          name: string;
          resource: string;
          action: string;
          category: string;
          description: string | null;
        }>>(
          `SELECT 
            tp.id,
            tp.name,
            tp.resource,
            tp.action,
            tp.category,
            tp.description
           FROM role_permissions rp
           INNER JOIN user_role_permissions tp ON rp.permission_id = tp.id
           WHERE rp.role_id = ?
           ORDER BY tp.category, tp.resource, tp.action`,
          roleId,
        );
        return result;
      } catch (error) {
        this.logger.error(
          `Error fetching role permissions from tenant database ${tenant.db_name}: ${error.message}`,
          error.stack,
        );
        return [];
      }
    });

    return permissions;
  }

  /**
   * Get users for a specific tenant
   */
  async getTenantUsers(
    tenantId: string,
    filters?: { status?: number; email?: string },
  ): Promise<TenantUserSummary[]> {
    this.logger.debug(`Getting users for tenant: ${tenantId}, filters: ${JSON.stringify(filters || {})}`);

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    this.logger.debug(`Tenant found: ${tenant.name} (${tenant.db_name})`);

    try {
      const users = await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
        // Build query with filters
        // When filters is undefined or has no status, return ALL users (including deleted)
        let query = `SELECT 
          id, 
          email, 
          name, 
          status, 
          avatar,
          last_login_at,
          created_at,
          updated_at
        FROM users`;
        
        const params: any[] = [];
        const conditions: string[] = [];

        // Apply status filter only if explicitly provided
        if (filters && filters.status !== undefined) {
          conditions.push(`status = ?`);
          params.push(filters.status);
        }
        // If no status filter, we return ALL users (no status condition added)

        // Apply email filter
        if (filters && filters.email) {
          conditions.push(`email LIKE ?`);
          params.push(`%${filters.email}%`);
        }

        // Build WHERE clause only if we have conditions
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += ` ORDER BY created_at DESC`;

        this.logger.debug(`Executing query for tenant ${tenant.db_name}: ${query}`);
        this.logger.debug(`Query params: ${JSON.stringify(params)}`);
        this.logger.debug(`Filters received: ${JSON.stringify(filters || 'undefined')}`);

        // Execute query - Prisma handles empty params array correctly
        let result: Array<{
          id: string;
          email: string;
          name: string | null;
          status: number;
          avatar: string | null;
          last_login_at: Date | null;
          created_at: Date;
          updated_at: Date;
        }>;

        try {
          // Always use the same call pattern - Prisma handles empty params correctly
          result = await client.$queryRawUnsafe<Array<{
            id: string;
            email: string;
            name: string | null;
            status: number;
            avatar: string | null;
            last_login_at: Date | null;
            created_at: Date;
            updated_at: Date;
          }>>(query, ...params);
        } catch (queryError: any) {
          this.logger.error(`Query execution error for tenant ${tenant.db_name}: ${queryError.message}`);
          this.logger.error(`Query: ${query}`);
          this.logger.error(`Params: ${JSON.stringify(params)}`);
          this.logger.error(`Error stack: ${queryError.stack}`);
          throw queryError;
        }

        this.logger.debug(`Query returned ${result.length} users`);

        if (result.length === 0) {
          // Try a simple count query to verify database connection and table existence
          try {
            const countResult = await client.$queryRawUnsafe<Array<{ count: bigint }>>(
              `SELECT COUNT(*) as count FROM users`
            );
            const totalCount = Number(countResult[0]?.count || 0);
            this.logger.warn(`No users found in tenant ${tenant.db_name} with query: ${query}`);
            this.logger.warn(`But total users in database: ${totalCount}`);
            if (totalCount > 0) {
              this.logger.error(`Query returned 0 results but database has ${totalCount} users! This indicates a query issue.`);
            }
          } catch (countError: any) {
            this.logger.error(`Error checking user count: ${countError.message}`);
          }
          return [];
        }

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        result.map(async (user) => {
          try {
            const roles = await client.$queryRawUnsafe<Array<{ name: string }>>(
              `SELECT r.name 
               FROM roles r 
               INNER JOIN user_roles ur ON r.id = ur.role_id 
               WHERE ur.user_id = ?`,
              user.id,
            );
            return {
              ...user,
              roles: roles.map((r) => r.name),
            };
          } catch (error) {
            this.logger.warn(`Error fetching roles for user ${user.id}: ${error.message}`);
            return {
              ...user,
              roles: [],
            };
          }
        }),
      );

      this.logger.debug(`Returning ${usersWithRoles.length} users with roles`);
      return usersWithRoles;
    });

    // Add tenant information
    const finalUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      status: typeof user.status === 'string' ? Number(user.status) : user.status,
      avatar: user.avatar,
      roles: user.roles || [],
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
    }));

      this.logger.debug(`Final result: ${finalUsers.length} users for tenant ${tenantId}`);
      return finalUsers;
    } catch (error: any) {
      this.logger.error(`Error getting users for tenant ${tenantId}: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      // Re-throw to let the controller handle it
      throw error;
    }
  }

  /**
   * Get a specific user by ID
   */
  async getTenantUser(tenantId: string, userId: string): Promise<TenantUserSummary> {
    this.logger.debug(`Getting user ${userId} from tenant ${tenantId}`);

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const user = await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const result = await client.$queryRawUnsafe<Array<{
        id: string;
        email: string;
        name: string | null;
        status: number; // 1 = active, 0 = inactive, -1 = deleted
        avatar: string | null;
        last_login_at: Date | null;
        created_at: Date;
        updated_at: Date;
      }>>(`SELECT 
        id, 
        email, 
        name, 
        status, 
        avatar,
        last_login_at,
        created_at,
        updated_at
      FROM users
      WHERE id = ?
      LIMIT 1`, userId);

      if (!result || result.length === 0) {
        return null;
      }

      // Get roles
      try {
        const roles = await client.$queryRawUnsafe<Array<{ name: string }>>(
          `SELECT r.name 
           FROM roles r 
           INNER JOIN user_roles ur ON r.id = ur.role_id 
           WHERE ur.user_id = ?`,
          userId,
        );
        return {
          ...result[0],
          roles: roles.map((r) => r.name),
        };
      } catch (error) {
        return {
          ...result[0],
          roles: [],
        };
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: typeof user.status === 'string' ? Number(user.status) : user.status,
      avatar: user.avatar,
      roles: user.roles || [],
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
    };
  }

  /**
   * Create user in tenant database
   */
  async createTenantUser(
    tenantId: string,
    createDto: CreateTenantUserDto,
    createdBy?: string,
  ): Promise<TenantUserSummary> {
    this.logger.debug(`Creating user in tenant ${tenantId}: ${createDto.email}`);

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if user already exists
    const existing = await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const result = await client.$queryRawUnsafe<Array<{ email: string }>>(
        `SELECT email FROM users WHERE email = ? LIMIT 1`,
        createDto.email,
      );
      return result[0];
    });

    if (existing) {
      throw new BadRequestException('User with this email already exists in this tenant');
    }

    // Hash password
    const saltRounds =
      parseInt(this.configService.get<string>('BCRYPT_ROUNDS', '10'), 10) || 10;
    const passwordHash = await bcrypt.hash(createDto.password, saltRounds);

    // Create user
    const userId = uuidv4();
    const status = createDto.status !== undefined ? createDto.status : 1; // Default to 1 (active)

    await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      await client.$executeRawUnsafe(
        `INSERT INTO users (id, email, password_hash, name, status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        userId,
        createDto.email,
        passwordHash,
        createDto.name || null,
        status,
      );

      // Assign roles if provided
      if (createDto.roleIds && createDto.roleIds.length > 0) {
        // Verify roles exist
        const rolePlaceholders = createDto.roleIds.map(() => '?').join(',');
        const existingRoles = await client.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM roles WHERE id IN (${rolePlaceholders})`,
          ...createDto.roleIds,
        );

        if (existingRoles.length !== createDto.roleIds.length) {
          throw new BadRequestException('One or more role IDs are invalid');
        }

        // Insert user roles
        // Check if updated_at and updated_by columns exist
        const hasUpdatedColumns = await client.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = DATABASE() 
           AND TABLE_NAME = 'user_roles' 
           AND COLUMN_NAME IN ('updated_at', 'updated_by')`
        );
        const hasColumns = Number(hasUpdatedColumns[0]?.count || 0) === 2;

        for (const roleId of createDto.roleIds) {
          const userRoleId = uuidv4();
          if (hasColumns) {
            await client.$executeRawUnsafe(
              `INSERT INTO user_roles (id, user_id, role_id, created_at, updated_at, updated_by) 
               VALUES (?, ?, ?, NOW(), NOW(), ?)`,
              userRoleId,
              userId,
              roleId,
              createdBy || null,
            );
          } else {
            await client.$executeRawUnsafe(
              `INSERT INTO user_roles (id, user_id, role_id, created_at) 
               VALUES (?, ?, ?, NOW())`,
              userRoleId,
              userId,
              roleId,
            );
          }
        }
      }
    });

    this.logger.log(`User created successfully: ${userId} in tenant ${tenantId}`);

    // Return created user
    return this.getTenantUser(tenantId, userId);
  }

  /**
   * Update user in tenant database
   */
  async updateTenantUser(
    tenantId: string,
    userId: string,
    updateDto: UpdateTenantUserDto,
    updatedBy?: string,
  ): Promise<TenantUserSummary> {
    this.logger.debug(`Updating user ${userId} in tenant ${tenantId}`);

    // Verify user exists
    await this.getTenantUser(tenantId, userId);

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check email uniqueness if email is being updated
    if (updateDto.email) {
      const existing = await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
        const result = await client.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1`,
          updateDto.email,
          userId,
        );
        return result[0];
      });

      if (existing) {
        throw new BadRequestException('User with this email already exists in this tenant');
      }
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    if (updateDto.email) {
      updates.push('email = ?');
      params.push(updateDto.email);
    }

    if (updateDto.name !== undefined) {
      updates.push('name = ?');
      params.push(updateDto.name || null);
    }

    if (updateDto.status !== undefined) {
      updates.push('status = ?');
      params.push(updateDto.status);
    }

    if (updateDto.password) {
      const saltRounds =
        parseInt(this.configService.get<string>('BCRYPT_ROUNDS', '10'), 10) || 10;
      const passwordHash = await bcrypt.hash(updateDto.password, saltRounds);
      updates.push('password_hash = ?');
      params.push(passwordHash);
    }

    await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Update user fields if any
      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        params.push(userId);
        await client.$executeRawUnsafe(
          `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
          ...params,
        );
      }

      // Update roles if provided
      if (updateDto.roleIds !== undefined) {
        // Delete existing roles
        await client.$executeRawUnsafe(
          `DELETE FROM user_roles WHERE user_id = ?`,
          userId,
        );

        // Assign new roles if any
        if (updateDto.roleIds.length > 0) {
          // Verify roles exist
          const rolePlaceholders = updateDto.roleIds.map(() => '?').join(',');
          const existingRoles = await client.$queryRawUnsafe<Array<{ id: string }>>(
            `SELECT id FROM roles WHERE id IN (${rolePlaceholders})`,
            ...updateDto.roleIds,
          );

          if (existingRoles.length !== updateDto.roleIds.length) {
            throw new BadRequestException('One or more role IDs are invalid');
          }

          // Check if updated_at and updated_by columns exist
          const hasUpdatedColumns = await client.$queryRawUnsafe<Array<{ count: bigint }>>(
            `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = 'user_roles' 
             AND COLUMN_NAME IN ('updated_at', 'updated_by')`
          );
          const hasColumns = Number(hasUpdatedColumns[0]?.count || 0) === 2;

          // Insert new user roles
          for (const roleId of updateDto.roleIds) {
            const userRoleId = uuidv4();
            if (hasColumns) {
              await client.$executeRawUnsafe(
                `INSERT INTO user_roles (id, user_id, role_id, created_at, updated_at, updated_by) 
                 VALUES (?, ?, ?, NOW(), NOW(), ?)`,
                userRoleId,
                userId,
                roleId,
                updatedBy || null,
              );
            } else {
              await client.$executeRawUnsafe(
                `INSERT INTO user_roles (id, user_id, role_id, created_at) 
                 VALUES (?, ?, ?, NOW())`,
                userRoleId,
                userId,
                roleId,
              );
            }
          }
        }
      }
    });

    this.logger.log(`User updated successfully: ${userId} in tenant ${tenantId}`);

    return this.getTenantUser(tenantId, userId);
  }

  /**
   * Soft delete user from tenant database (set status to -1)
   */
  async deleteTenantUser(tenantId: string, userId: string): Promise<void> {
    this.logger.debug(`Soft deleting user ${userId} from tenant ${tenantId}`);

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if user exists and get current status
    const userCheck = await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const result = await client.$queryRawUnsafe<Array<{
        id: string;
        status: number;
      }>>(
        `SELECT id, status FROM users WHERE id = ? LIMIT 1`,
        userId
      );
      return result[0];
    });

    if (!userCheck) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already deleted
    if (userCheck.status === -1) {
      throw new BadRequestException('User is already deleted');
    }

    // Soft delete: Update status to -1 instead of deleting the record
    await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      await client.$executeRawUnsafe(
        `UPDATE users SET status = -1, updated_at = NOW() WHERE id = ?`,
        userId
      );
    });

    this.logger.log(`User soft deleted successfully: ${userId} from tenant ${tenantId}`);
  }

  /**
   * Create a new role in tenant database
   */
  async createRole(
    tenantId: string,
    createDto: { name: string; description?: string },
  ): Promise<{ id: string; name: string; description: string | null }> {
    this.logger.debug(`Creating role "${createDto.name}" in tenant ${tenantId}`);

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const roleId = uuidv4();

    await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Check if role name already exists
      const existing = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM roles WHERE name = ? LIMIT 1`,
        createDto.name,
      );

      if (existing.length > 0) {
        throw new BadRequestException(`Role with name "${createDto.name}" already exists`);
      }

      // Create role
      await client.$executeRawUnsafe(
        `INSERT INTO roles (id, name, description, created_at, updated_at) 
         VALUES (?, ?, ?, NOW(), NOW())`,
        roleId,
        createDto.name,
        createDto.description || null,
      );
    });

    this.logger.log(`Role created successfully: ${createDto.name} in tenant ${tenantId}`);

    return {
      id: roleId,
      name: createDto.name,
      description: createDto.description || null,
    };
  }

  /**
   * Update a role in tenant database
   */
  async updateRole(
    tenantId: string,
    roleId: string,
    updateDto: { name?: string; description?: string },
  ): Promise<{ id: string; name: string; description: string | null }> {
    this.logger.debug(`Updating role ${roleId} in tenant ${tenantId}`);

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Check if role exists
      const existing = await client.$queryRawUnsafe<Array<{ id: string; name: string }>>(
        `SELECT id, name FROM roles WHERE id = ? LIMIT 1`,
        roleId,
      );

      if (existing.length === 0) {
        throw new NotFoundException('Role not found');
      }

      // If name is being updated, check for duplicates
      if (updateDto.name && updateDto.name !== existing[0].name) {
        const duplicate = await client.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM roles WHERE name = ? AND id != ? LIMIT 1`,
          updateDto.name,
          roleId,
        );

        if (duplicate.length > 0) {
          throw new BadRequestException(`Role with name "${updateDto.name}" already exists`);
        }
      }

      // Build update query
      const updates: string[] = []
      const params: any[] = []

      if (updateDto.name !== undefined) {
        updates.push('name = ?')
        params.push(updateDto.name)
      }

      if (updateDto.description !== undefined) {
        updates.push('description = ?')
        params.push(updateDto.description)
      }

      if (updates.length > 0) {
        updates.push('updated_at = NOW()')
        params.push(roleId)

        await client.$executeRawUnsafe(
          `UPDATE roles SET ${updates.join(', ')} WHERE id = ?`,
          ...params,
        )
      }
    });

    // Return updated role
    const updated = await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const result = await client.$queryRawUnsafe<Array<{
        id: string;
        name: string;
        description: string | null;
      }>>(
        `SELECT id, name, description FROM roles WHERE id = ? LIMIT 1`,
        roleId,
      );
      return result[0];
    });

    if (!updated) {
      throw new NotFoundException('Role not found after update');
    }

    this.logger.log(`Role updated successfully: ${roleId} in tenant ${tenantId}`);

    return updated;
  }

  /**
   * Delete a role from tenant database
   */
  async deleteRole(tenantId: string, roleId: string): Promise<void> {
    this.logger.debug(`Deleting role ${roleId} from tenant ${tenantId}`);

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Check if role exists
      const existing = await client.$queryRawUnsafe<Array<{ id: string; name: string }>>(
        `SELECT id, name FROM roles WHERE id = ? LIMIT 1`,
        roleId,
      );

      if (existing.length === 0) {
        throw new NotFoundException('Role not found');
      }

      // Check if role is system role (cannot be deleted)
      // System roles typically have is_system flag or specific names
      // For now, we'll check if it's one of the default roles
      const systemRoleNames = ['Admin', 'Editor', 'Reviewer', 'Author', 'API Consumer'];
      if (systemRoleNames.includes(existing[0].name)) {
        throw new BadRequestException(`Cannot delete system role "${existing[0].name}"`);
      }

      // Check if role is assigned to any users
      const userCount = await client.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?`,
        roleId,
      );

      if (Number(userCount[0]?.count || 0) > 0) {
        throw new BadRequestException(
          `Cannot delete role "${existing[0].name}" because it is assigned to users. Remove the role from all users first.`,
        );
      }

      // Delete role permissions first (cascade should handle this, but explicit is better)
      await client.$executeRawUnsafe(
        `DELETE FROM role_permissions WHERE role_id = ?`,
        roleId,
      );

      // Delete role
      await client.$executeRawUnsafe(
        `DELETE FROM roles WHERE id = ?`,
        roleId,
      );
    });

    this.logger.log(`Role deleted successfully: ${roleId} from tenant ${tenantId}`);
  }

  /**
   * Assign permissions to a role
   */
  async assignPermissionsToRole(
    tenantId: string,
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    this.logger.debug(`Assigning ${permissionIds.length} permissions to role ${roleId} in tenant ${tenantId}`);

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Verify role exists
      const roleExists = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM roles WHERE id = ? LIMIT 1`,
        roleId,
      );

      if (roleExists.length === 0) {
        throw new NotFoundException('Role not found');
      }

      // Verify all permissions exist
      if (permissionIds.length > 0) {
        const placeholders = permissionIds.map(() => '?').join(',');
        const existingPermissions = await client.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM user_role_permissions WHERE id IN (${placeholders})`,
          ...permissionIds,
        );

        if (existingPermissions.length !== permissionIds.length) {
          throw new BadRequestException('One or more permission IDs are invalid');
        }
      }

      // Remove existing permissions (replace all)
      await client.$executeRawUnsafe(
        `DELETE FROM role_permissions WHERE role_id = ?`,
        roleId,
      );

      // Assign new permissions
      if (permissionIds.length > 0) {
        for (const permissionId of permissionIds) {
          await client.$executeRawUnsafe(
            `INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at) 
             VALUES (UUID(), ?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE updated_at = NOW()`,
            roleId,
            permissionId,
          );
        }
      }
    });

    this.logger.log(`Permissions assigned successfully to role ${roleId} in tenant ${tenantId}`);
  }

  /**
   * Get all available permissions in a tenant
   */
  async getAllPermissions(tenantId: string): Promise<Array<{
    id: string;
    name: string;
    resource: string;
    action: string;
    category: string;
    description: string | null;
  }>> {
    this.logger.debug(`Getting all permissions for tenant ${tenantId}`);

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const permissions = await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      try {
        const result = await client.$queryRawUnsafe<Array<{
          id: string;
          name: string;
          resource: string;
          action: string;
          category: string;
          description: string | null;
        }>>(
          `SELECT id, name, resource, action, category, description 
           FROM user_role_permissions 
           ORDER BY category, resource, action`,
        );
        return result;
      } catch (error) {
        this.logger.error(
          `Error fetching permissions from tenant database ${tenant.db_name}: ${error.message}`,
          error.stack,
        );
        return [];
      }
    });

    return permissions;
  }
}
