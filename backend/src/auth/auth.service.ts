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
import { PrismaService } from '../prisma/prisma.service';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { v4 as uuidv4 } from 'uuid';

export interface TokenPayload {
  sub: string; // user id
  email: string;
  tenantId: string;
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
  ) {}

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
        `SELECT email FROM users WHERE email = ? LIMIT 1`,
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
         VALUES (?, ?, ?, ?, 'active', NOW(), NOW())`,
        userId,
        registerDto.email,
        passwordHash,
        registerDto.name || null,
      );
    });

    // Generate tokens
    return this.generateTokens(userId, registerDto.email, tenantId);
  }

  /**
   * Login user
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

    // Check user status
    if (user.status !== 'active') {
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
    return this.generateTokens(user.id, user.email, tenantId, roles, user.name);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string, tenantId: string): Promise<AuthResponse> {
    try {
      const payload = jwt.verify(
        refreshToken,
        this.configService.get<string>('JWT_REFRESH_SECRET') || 'your-refresh-secret',
      ) as any;

      // Get user from tenant database
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
          status: string;
        }>>(
          `SELECT id, email, name, status FROM users WHERE id = ? LIMIT 1`,
          payload.sub,
        );
        return result[0];
      });

      if (!user || user.status !== 'active') {
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
      return this.generateTokens(user.id, user.email, tenantId, roles, user.name);
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
    tenantId: string,
    roles: string[] = [],
    name: string | null = null,
  ): Promise<AuthResponse> {
    const payload: TokenPayload = {
      sub: userId,
      email,
      tenantId,
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
      },
    };
  }

  /**
   * Validate user (for guards)
   */
  async validateUser(userId: string, tenantId: string) {
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
        status: string;
      }>>(
        `SELECT id, email, name, status FROM users WHERE id = ? LIMIT 1`,
        userId,
      );
      return result[0];
    });

    if (!user || user.status !== 'active') {
      return null;
    }

    return user;
  }
}
