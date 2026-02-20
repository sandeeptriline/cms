import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { PrismaService } from '../prisma/prisma.service';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { PlatformUsersService } from '../platform-users/platform-users.service';
import { TenantsService } from '../tenants/tenants.service';
import { TenantProvisioningService } from '../tenants/provisioning/tenant-provisioning.service';
import { TenantUsersService } from '../tenant-users/tenant-users.service';
import { TENANT_ADMIN_ROLE_ID } from '../constants/tenant-defaults';
import { v4 as uuidv4 } from 'uuid';

export interface TokenPayload {
  sub: string; // user id
  email: string;
  tenantId: string | null; // Can be null for Super Admin
  tenantSlug?: string | null; // URL-friendly tenant slug for tenant users
  roles?: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    roles?: string[];
    tenantId?: string | null; // Can be null for Super Admin
    tenantSlug?: string | null; // URL-friendly tenant slug for tenant users
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private tenantPrisma: TenantPrismaService,
    private platformUsersService: PlatformUsersService,
    private tenantsService: TenantsService,
    private provisioningService: TenantProvisioningService,
    private tenantUsersService: TenantUsersService,
  ) {}

  /** Resolve platform role names from platform_user_roles (enterprise) or user_roles (legacy) */
  private getPlatformRoleNames(user: {
    platform_user_roles?: { role: { name: string } }[];
    user_roles?: { role: { name: string } }[];
  }): string[] {
    if (user.platform_user_roles?.length) {
      return user.platform_user_roles.map((pur) => pur.role.name);
    }
    if (user.user_roles?.length) {
      return user.user_roles.map((ur) => ur.role.name);
    }
    return [];
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto, tenantId: string): Promise<AuthResponse> {
    // Get tenant to access tenant database
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    // Check if user already exists in tenant database
    const existingUser = await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Use raw query since we don't have Prisma schema for tenant DB yet
      const result = await client.$queryRawUnsafe<Array<{ email: string }>>(
        `SELECT email FROM users WHERE email = ? AND status != -1 LIMIT 1`,
        registerDto.email,
      );
      return result[0];
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const saltRounds = parseInt(
      this.configService.get<string>('BCRYPT_ROUNDS', '10'),
      10,
    ) || 10;
    const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

    // Create user in tenant database
    const userId = uuidv4();
    await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      await client.$executeRawUnsafe(
        `INSERT INTO users (id, email, password_hash, name, status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
        userId,
        registerDto.email,
        passwordHash,
        registerDto.name || null,
      );
    });

    // Generate tokens (tenant already loaded above)
    return this.generateTokens(userId, registerDto.email, tenantId, [], registerDto.name ?? null, tenant.slug);
  }

  /**
   * Self-signup: register as a new tenant (SaaS). Creates platform user, tenant with Free plan,
   * tenant_users link, provisions tenant DB, and tenant user for login. Returns tokens for tenant portal.
   */
  async registerTenant(dto: RegisterTenantDto): Promise<AuthResponse> {
    this.logger.debug(`Tenant signup: ${dto.slug} / ${dto.email}`);

    const existingSlug = await this.prisma.tenants.findUnique({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      throw new BadRequestException(`Organization slug "${dto.slug}" is already taken`);
    }

    const platformUser = await this.platformUsersService.create({
      email: dto.email,
      password: dto.password,
      name: dto.adminName ?? dto.name,
    });

    const tenant = await this.tenantsService.create(
      {
        name: dto.name,
        slug: dto.slug,
        adminUserId: platformUser.id,
      },
      { skipProvisioning: true, planId: TenantsService.FREE_PLAN_ID },
    );

    try {
      await this.provisioningService.provisionTenant(tenant.id, tenant.db_name);
    } catch (err: any) {
      this.logger.error(`Provisioning failed for tenant ${tenant.id}: ${err?.message}`);
      throw new BadRequestException(
        'Tenant could not be provisioned. Please try again or contact support.',
      );
    }

    const createdUser = await this.tenantUsersService.createTenantUser(tenant.id, {
      email: dto.email,
      password: dto.password,
      name: dto.adminName ?? dto.name,
      roleIds: [TENANT_ADMIN_ROLE_ID],
    });

    this.logger.log(`Tenant registered: ${dto.slug}, user ${createdUser.id}`);

    return this.generateTokens(
      createdUser.id,
      dto.email,
      tenant.id,
      createdUser.roles ?? [],
      createdUser.name ?? null,
      dto.slug,
    );
  }

  /**
   * Platform Admin Login (Super Admin)
   * No tenant ID required
   */
  async platformAdminLogin(loginDto: LoginDto): Promise<AuthResponse> {
    this.logger.debug(`Platform Admin login attempt for email: ${loginDto.email}`);

    const user = await this.platformUsersService.authenticate(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      this.logger.warn(`Platform Admin login failed: Invalid credentials for ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const roles = this.getPlatformRoleNames(user);
    if (!roles?.length) {
      this.logger.warn(`Platform Admin login failed: User ${user.id} has no roles assigned`);
      throw new UnauthorizedException('User is not a Super Admin');
    }
    const superAdminNames = ['Super Admin', 'super_admin'];
    if (!roles.some((r) => superAdminNames.includes(r))) {
      this.logger.warn(
        `Platform Admin login failed: User ${user.id} does not have Super Admin role. Current roles: ${roles.join(', ')}`,
      );
      throw new UnauthorizedException('User is not a Super Admin');
    }

    // Update last login
    await this.prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    this.logger.log(`Platform Admin login successful for user: ${user.email}`);

    // Generate tokens with tenantId: null for Super Admin
    return this.generateTokens(user.id, user.email, null, roles, user.name);
  }

  /**
   * Tenant User Login by Email Only
   * Searches across all tenant databases to find the user
   * No tenant ID required
   */
  async loginByEmail(loginDto: LoginDto): Promise<AuthResponse> {
    this.logger.debug(`Email-only login attempt for: ${loginDto.email}`);

    // Get all active tenants
    const tenants = await this.prisma.tenants.findMany({
      where: {
        status: 'active',
      },
    });

    if (tenants.length === 0) {
      throw new BadRequestException('No active tenants found');
    }

    // Search for user across all tenant databases
    const foundUsers: Array<{
      tenantId: string;
      tenantName: string;
      tenantSlug: string;
      dbName: string;
      user: {
        id: string;
        email: string;
        password_hash: string;
        name: string | null;
        status: string | number;
      };
    }> = [];

    // Query each tenant database for the email
    for (const tenant of tenants) {
      try {
        const user = await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
          const result = await client.$queryRawUnsafe<Array<{
            id: string;
            email: string;
            password_hash: string;
            name: string | null;
            status: string | number;
          }>>(
            `SELECT id, email, password_hash, name, status FROM users WHERE email = ? AND status != -1 LIMIT 1`,
            loginDto.email,
          );
          return result[0];
        });

        if (user) {
          foundUsers.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            tenantSlug: tenant.slug,
            dbName: tenant.db_name,
            user,
          });
        }
      } catch (error) {
        // Tenant database might not exist or be accessible, skip it
        this.logger.warn(`Could not query tenant ${tenant.name} (${tenant.db_name}): ${error.message}`);
        continue;
      }
    }

    // If no user found in any tenant
    if (foundUsers.length === 0) {
      this.logger.warn(`Email-only login failed: User not found for ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // If user found in multiple tenants, require tenant ID
    if (foundUsers.length > 1) {
      const tenantNames = foundUsers.map((f) => f.tenantName).join(', ');
      this.logger.warn(
        `Email ${loginDto.email} found in multiple tenants: ${tenantNames}. Tenant ID required.`,
      );
      throw new BadRequestException(
        `Email exists in multiple tenants. Please provide tenant ID or use tenant-specific login. Found in: ${tenantNames}`,
      );
    }

    // User found in exactly one tenant
    const found = foundUsers[0];
    const user = found.user;

    // Check user status (1 = active, 0 = inactive)
    // Handle number (1), string ('1'), and string ('active') for backward compatibility
    const isActive = typeof user.status === 'number'
      ? user.status === 1
      : user.status === 'active' || user.status === '1';
    if (!isActive) {
      throw new UnauthorizedException('User account is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);
    if (!isPasswordValid) {
      this.logger.warn(`Email-only login failed: Invalid password for ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.tenantPrisma.withTenant(found.dbName, async (client) => {
      await client.$executeRawUnsafe(`UPDATE users SET last_login_at = NOW() WHERE id = ?`, user.id);
    });

    // Get user roles
    const roles: string[] = [];
    try {
      const userRoles = await this.tenantPrisma.withTenant(found.dbName, async (client) => {
        const result = await client.$queryRawUnsafe<Array<{ name: string }>>(
          `SELECT r.name FROM roles r 
           INNER JOIN user_roles ur ON r.id = ur.role_id 
           WHERE ur.user_id = ?`,
          user.id,
        );
        return result;
      });
      roles.push(...userRoles.map((r) => r.name));
    } catch (error) {
      // Roles table might not exist yet, that's okay
      this.logger.warn('Could not fetch user roles:', error.message);
    }

    this.logger.log(
      `Email-only login successful for ${loginDto.email} in tenant ${found.tenantName}`,
    );

    // Generate tokens
    return this.generateTokens(user.id, user.email, found.tenantId, roles, user.name, found.tenantSlug);
  }

  /**
   * Tenant User Login
   * Requires tenant ID
   */
  async login(loginDto: LoginDto, tenantId: string): Promise<AuthResponse> {
    // Get tenant to access tenant database
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    // Find user in tenant database
    const user = await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const result = await client.$queryRawUnsafe<Array<{
        id: string;
        email: string;
        password_hash: string;
        name: string | null;
        status: string;
      }>>(
        `SELECT id, email, password_hash, name, status FROM users WHERE email = ? LIMIT 1`,
        loginDto.email,
      );
      return result[0];
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check user status (1 = active, 0 = inactive)
    // Handle number (1), string ('1'), and string ('active') for backward compatibility
    const isActive = typeof user.status === 'number'
      ? user.status === 1
      : user.status === 'active' || user.status === '1';
    if (!isActive) {
      throw new UnauthorizedException('User account is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      await client.$executeRawUnsafe(
        `UPDATE users SET last_login_at = NOW() WHERE id = ?`,
        user.id,
      );
    });

    // Get user roles (if roles table exists)
    const roles: string[] = [];
    try {
      const userRoles = await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
        const result = await client.$queryRawUnsafe<Array<{ name: string }>>(
          `SELECT r.name FROM roles r 
           INNER JOIN user_roles ur ON r.id = ur.role_id 
           WHERE ur.user_id = ?`,
          user.id,
        );
        return result;
      });
      roles.push(...userRoles.map((r) => r.name));
    } catch (error) {
      // Roles table might not exist yet, that's okay
      this.logger.warn('Could not fetch user roles:', error.message);
    }

    // Generate tokens
    return this.generateTokens(user.id, user.email, tenantId, roles, user.name, tenant.slug);
  }

  /**
   * Refresh access token
   * Supports both platform users (Super Admin) and tenant users
   */
  async refreshToken(refreshToken: string, tenantId: string | null): Promise<AuthResponse> {
    try {
      const payload = jwt.verify(
        refreshToken,
        this.configService.get<string>('JWT_REFRESH_SECRET') || 'your-refresh-secret',
      ) as any;

      // If tenantId is null, check platform database (Super Admin)
      if (tenantId === null) {
        const user = await this.prisma.users.findUnique({
          where: { id: payload.sub },
          include: {
            platform_user_roles: { include: { role: true } },
            user_roles: { include: { role: true } },
          },
        });

        if (!user || user.status !== 1) {
          throw new UnauthorizedException('User not found or inactive');
        }

        const roles = this.getPlatformRoleNames(user);
        return this.generateTokens(user.id, user.email, null, roles, user.name);
      }

      // Otherwise, check tenant database (regular user)
      const tenant = await this.prisma.tenants.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new BadRequestException('Tenant not found');
      }

      const user = await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
        const result = await client.$queryRawUnsafe<Array<{
          id: string;
          email: string;
          name: string | null;
          status: number | string;
        }>>(
          `SELECT id, email, name, status FROM users WHERE id = ? AND status != -1 LIMIT 1`,
          payload.sub,
        );
        return result[0];
      });

      // Check user status (1 = active, 0 = inactive)
      const isActive = typeof user.status === 'number'
      ? user.status === 1
      : user.status === 'active' || user.status === '1';
      if (!user || !isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Get user roles
      const roles: string[] = [];
      try {
        const userRoles = await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
          const result = await client.$queryRawUnsafe<Array<{ name: string }>>(
            `SELECT r.name FROM roles r 
             INNER JOIN user_roles ur ON r.id = ur.role_id 
             WHERE ur.user_id = ?`,
            user.id,
          );
          return result;
        });
        roles.push(...userRoles.map((r) => r.name));
      } catch (error) {
        // Roles might not exist
      }

      // Generate new tokens
      return this.generateTokens(user.id, user.email, tenantId, roles, user.name, tenant.slug);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(
    userId: string,
    email: string,
    tenantId: string | null, // Can be null for Super Admin
    roles: string[] = [],
    name: string | null = null,
    tenantSlug: string | null = null, // URL-friendly tenant slug when tenant user
  ): Promise<AuthResponse> {
    const payload: TokenPayload = {
      sub: userId,
      email,
      tenantId: tenantId || null,
      tenantSlug: tenantSlug || null,
      roles,
    };

    const accessTokenExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');
    const refreshTokenExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');

    // Generate access token using NestJS JWT service
    // JwtService from @nestjs/jwt accepts payload and options
    const accessToken = this.jwtService.sign(payload as any, {
      expiresIn: accessTokenExpiresIn,
    } as any);

    // Generate refresh token with different secret using jsonwebtoken directly
    const refreshTokenPayload: any = { ...payload, tokenId: uuidv4() };
    const refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'your-refresh-secret';
    // Use type assertion to work around jsonwebtoken type issues with expiresIn
    const refreshToken = jwt.sign(refreshTokenPayload, refreshTokenSecret, {
      expiresIn: refreshTokenExpiresIn,
    } as any);

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
        name,
        roles,
        tenantId: tenantId || null,
        tenantSlug: tenantSlug || null,
      },
    };
  }

  /**
   * Validate user (for guards)
   * Supports both platform users (Super Admin) and tenant users
   */
  async validateUser(userId: string, tenantId: string | null) {
    // If tenantId is null, check platform database (Super Admin)
    if (tenantId === null) {
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
      });
      // Check status: 1 = active, 0 = inactive
      // Check if user is active (handle number 1, string '1', and string 'active')
      if (!user) return null;
      const isActive = typeof user.status === 'number'
        ? user.status === 1
        : user.status === 'active' || user.status === '1';
      return isActive ? user : null;
    }

    // Otherwise, check tenant database (regular user)
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return null;
    }

    const user = await this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      const result = await client.$queryRawUnsafe<Array<{
        id: string;
        email: string;
        name: string | null;
        status: number | string; // Can be TINYINT(1) or VARCHAR
      }>>(
        `SELECT id, email, name, status FROM users WHERE id = ? LIMIT 1`,
        userId,
      );
      return result[0];
    });

    // Check status: 1 = active, 0 = inactive (or 'active' string for backward compatibility)
    const isActive = typeof user.status === 'number'
      ? user.status === 1
      : user.status === 'active' || user.status === '1';
    if (!user || !isActive) {
      return null;
    }

    return user;
  }
}
