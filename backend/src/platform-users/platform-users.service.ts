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
   * Create Super Admin (only if none exists)
   */
  async createSuperAdmin(data: {
    email: string;
    password: string;
    name?: string;
  }) {
    // Check if Super Admin already exists
    const exists = await this.superAdminExists();
    if (exists) {
      throw new BadRequestException('Super Admin already exists. Only one Super Admin is allowed.');
    }

    // Hash password
    const saltRounds = parseInt(
      this.configService.get<string>('BCRYPT_ROUNDS', '10'),
      10,
    ) || 10;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    // Get or create "Super Admin" role
    let superAdminRole = await this.prisma.roles.findUnique({
      where: { name: 'Super Admin' },
    });

    if (!superAdminRole) {
      superAdminRole = await this.prisma.roles.create({
        data: {
          id: uuidv4(),
          name: 'Super Admin',
          description: 'System-wide control - Manage all tenants, system configuration, platform-level settings',
          is_system: true,
        },
      });
    }

    // Create Super Admin user
    const userId = uuidv4();
    const user = await this.prisma.users.create({
      data: {
        id: userId,
        email: data.email,
        password_hash: passwordHash,
        name: data.name || null,
        status: 1, // Active
      },
    });

    // Assign Super Admin role
    await this.prisma.user_roles.create({
      data: {
        id: uuidv4(),
        user_id: userId,
        role_id: superAdminRole.id,
      },
    });

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
   * Update Super Admin
   */
  async updateSuperAdmin(id: string, data: {
    email?: string;
    name?: string;
    password?: string;
  }) {
    const updateData: any = {};

    if (data.email) {
      updateData.email = data.email;
    }
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.password) {
      const saltRounds = parseInt(
        this.configService.get<string>('BCRYPT_ROUNDS', '10'),
        10,
      ) || 10;
      updateData.password_hash = await bcrypt.hash(data.password, saltRounds);
    }

    return this.prisma.users.update({
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
  }
}
