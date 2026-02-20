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

  /** Role names that count as Super Admin (platform_roles or legacy roles) */
  private readonly SUPER_ADMIN_NAMES = ['Super Admin', 'super_admin'];

  private hasSuperAdminRole(user: {
    platform_user_roles?: { role: { name: string } }[];
    user_roles?: { role: { name: string } }[];
  }): boolean {
    const fromPlatform = user.platform_user_roles?.some((pur) =>
      this.SUPER_ADMIN_NAMES.includes(pur.role.name),
    );
    if (fromPlatform) return true;
    return user.user_roles?.some((ur) => this.SUPER_ADMIN_NAMES.includes(ur.role.name)) ?? false;
  }

  /**
   * Check if Super Admin exists (platform_roles or legacy user_roles)
   */
  async superAdminExists(): Promise<boolean> {
    try {
      const users = await this.prisma.users.findMany({
        where: { status: 1 },
        include: {
          platform_user_roles: { include: { role: true } },
        },
      });
      return users.some((u) => this.hasSuperAdminRole(u));
    } catch (error) {
      this.logger.error('Error checking Super Admin existence:', error);
      return false;
    }
  }

  /**
   * Get Super Admin user (platform_roles or legacy user_roles)
   */
  async getSuperAdmin() {
    const users = await this.prisma.users.findMany({
      where: { status: 1 },
      include: {
        platform_user_roles: { include: { role: true } },
      },
    });
    return users.find((u) => this.hasSuperAdminRole(u)) ?? null;
  }

  /**
   * Authenticate platform user (Super Admin) – supports platform_roles and legacy user_roles
   */
  async authenticate(email: string, password: string) {
    const user = await this.prisma.users.findUnique({
      where: { email },
      include: {
        platform_user_roles: { include: { role: true } },
      },
    });

    if (!user || user.status !== 1) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    if (!this.hasSuperAdminRole(user)) {
      return null;
    }

    return user;
  }

  /**
   * Get all platform users (include platform_roles and legacy roles)
   */
  async getAll() {
    return this.prisma.users.findMany({
      include: {
        platform_user_roles: { include: { role: true } },
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
        platform_user_roles: { include: { role: true } },
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

    // Assign platform roles if provided
    if (data.roleIds && data.roleIds.length > 0) {
      const roles = await this.prisma.platform_roles.findMany({
        where: { id: { in: data.roleIds } },
      });
      if (roles.length !== data.roleIds.length) {
        throw new BadRequestException('One or more roles not found');
      }
      await Promise.all(
        data.roleIds.map((roleId) =>
          this.prisma.platform_user_roles.create({
            data: { user_id: userId, role_id: roleId },
          }),
        ),
      );
    }

    return this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        platform_user_roles: { include: { role: true } },
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
        platform_user_roles: { include: { role: true } },
      },
    });

    // Update platform roles if provided
    if (data.roleIds !== undefined) {
      await this.prisma.platform_user_roles.deleteMany({
        where: { user_id: id },
      });
      if (data.roleIds.length > 0) {
        const roles = await this.prisma.platform_roles.findMany({
          where: { id: { in: data.roleIds } },
        });
        if (roles.length !== data.roleIds.length) {
          throw new BadRequestException('One or more roles not found');
        }
        await Promise.all(
          data.roleIds.map((roleId) =>
            this.prisma.platform_user_roles.create({
              data: { user_id: id, role_id: roleId },
            }),
          ),
        );
      }
      return this.prisma.users.findUnique({
        where: { id },
        include: {
          platform_user_roles: { include: { role: true } },
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
        platform_user_roles: { include: { role: true } },
      },
    });
  }

  /**
   * Get all platform roles (for assignment to platform users)
   */
  async getRoles() {
    return this.prisma.platform_roles.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
