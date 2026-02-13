import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PlatformUsersService {
  private readonly logger = new Logger(PlatformUsersService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Check if Super Admin exists
   */
  async superAdminExists(): Promise<boolean> {
    try {
      const superAdmin = await this.prisma.users.findFirst({
        where: {
          user_roles: {
            some: {
              role: {
                name: 'Super Admin',
              },
            },
          },
        },
      });
      return !!superAdmin;
    } catch (error) {
      this.logger.error('Error checking Super Admin existence:', error);
      return false;
    }
  }

  /**
   * Get Super Admin user
   */
  async getSuperAdmin() {
    return this.prisma.users.findFirst({
      where: {
        user_roles: {
          some: {
            role: {
              name: 'Super Admin',
            },
          },
        },
      },
      include: {
        user_roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Authenticate platform user (Super Admin)
   */
  async authenticate(email: string, password: string) {
    const user = await this.prisma.users.findUnique({
      where: { email },
      include: {
        user_roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.status !== 1) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    return user;
  }

  /**
   * Get all platform users
   */
  async getAll() {
    return this.prisma.users.findMany({
      include: {
        user_roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  /**
   * Get platform user by ID
   */
  async getById(id: string) {
    return this.prisma.users.findUnique({
      where: { id },
      include: {
        user_roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Create platform user
   */
  async create(data: {
    email: string;
    password: string;
    name?: string;
    status?: number;
    roleIds?: string[];
  }) {
    // Check if user with email already exists
    const existing = await this.prisma.users.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const saltRounds = parseInt(
      this.configService.get<string>('BCRYPT_ROUNDS', '10'),
      10,
    ) || 10;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    // Create user
    const userId = uuidv4();
    const user = await this.prisma.users.create({
      data: {
        id: userId,
        email: data.email,
        password_hash: passwordHash,
        name: data.name || null,
        status: data.status ?? 1, // Default to active
      },
    });

    // Assign roles if provided
    if (data.roleIds && data.roleIds.length > 0) {
      // Verify all roles exist
      const roles = await this.prisma.roles.findMany({
        where: {
          id: {
            in: data.roleIds,
          },
        },
      });

      if (roles.length !== data.roleIds.length) {
        throw new BadRequestException('One or more roles not found');
      }

      // Assign roles
      await Promise.all(
        data.roleIds.map((roleId) =>
          this.prisma.user_roles.create({
            data: {
              id: uuidv4(),
              user_id: userId,
              role_id: roleId,
            },
          }),
        ),
      );
    }

    return this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Update platform user
   */
  async update(id: string, data: {
    email?: string;
    name?: string;
    password?: string;
    status?: number;
    roleIds?: string[];
  }) {
    // Check if user exists
    const user = await this.prisma.users.findUnique({
      where: { id },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const updateData: any = {};

    if (data.email && data.email !== user.email) {
      // Check if email is already taken by another user
      const existing = await this.prisma.users.findUnique({
        where: { email: data.email },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('Email is already taken');
      }
      updateData.email = data.email;
    }

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.password) {
      const saltRounds = parseInt(
        this.configService.get<string>('BCRYPT_ROUNDS', '10'),
        10,
      ) || 10;
      updateData.password_hash = await bcrypt.hash(data.password, saltRounds);
    }

    // Update user
    const updated = await this.prisma.users.update({
      where: { id },
      data: updateData,
      include: {
        user_roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Update roles if provided
    if (data.roleIds !== undefined) {
      // Remove all existing roles
      await this.prisma.user_roles.deleteMany({
        where: { user_id: id },
      });

      // Assign new roles
      if (data.roleIds.length > 0) {
        // Verify all roles exist
        const roles = await this.prisma.roles.findMany({
          where: {
            id: {
              in: data.roleIds,
            },
          },
        });

        if (roles.length !== data.roleIds.length) {
          throw new BadRequestException('One or more roles not found');
        }

        // Assign roles
        await Promise.all(
          data.roleIds.map((roleId) =>
            this.prisma.user_roles.create({
              data: {
                id: uuidv4(),
                user_id: id,
                role_id: roleId,
              },
            }),
          ),
        );
      }

      // Reload user with updated roles
      return this.prisma.users.findUnique({
        where: { id },
        include: {
          user_roles: {
            include: {
              role: true,
            },
          },
        },
      });
    }

    return updated;
  }

  /**
   * Delete platform user (soft delete by setting status to 0)
   */
  async delete(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Soft delete by setting status to 0
    return this.prisma.users.update({
      where: { id },
      data: { status: 0 },
      include: {
        user_roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Get all platform roles
   */
  async getRoles() {
    return this.prisma.roles.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }
}
