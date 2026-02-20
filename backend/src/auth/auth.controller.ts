import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  AuthResponseDto,
  UserMeResponseDto,
  LogoutResponseDto,
} from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { TenantGuard } from '../tenants/guards/tenant.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('register-tenant')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Sign up as a new tenant (self-registration)',
    description:
      'Creates a new organization (tenant) with Free plan, a platform user, and an admin user in the tenant. No auth or tenant header required. Returns JWT for tenant portal login.',
  })
  @ApiBody({
    type: RegisterTenantDto,
    description: 'Tenant and admin details',
    examples: {
      signup: {
        summary: 'Tenant signup',
        value: {
          name: 'Acme Corp',
          slug: 'acme-corp',
          email: 'admin@acme.com',
          password: 'SecurePassword123!',
          adminName: 'Jane Doe',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Tenant created and logged in',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Slug taken or email already exists',
  })
  async registerTenant(
    @Body() registerTenantDto: RegisterTenantDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.registerTenant(registerTenantDto);
    this.setAuthCookies(response, result.accessToken, result.refreshToken);
    return result;
  }

  @Public()
  @UseGuards(TenantGuard)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user (within a tenant)',
    description: 'Creates a new user account in the specified tenant. Requires X-Tenant-ID or X-Tenant-Slug. Returns JWT tokens.',
  })
  @ApiBody({
    type: RegisterDto,
    description: 'User registration data',
    examples: {
      basic: {
        summary: 'Basic registration',
        value: {
          email: 'user@example.com',
          password: 'SecurePassword123!',
          name: 'John Doe',
        },
      },
      minimal: {
        summary: 'Minimal registration (name optional)',
        value: {
          email: 'user@example.com',
          password: 'SecurePassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or user already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'User with this email already exists' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiSecurity('tenant-id')
  @ApiSecurity('tenant-slug')
  async register(
    @Body() registerDto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tenantId = (request as any).tenantId;
    if (!tenantId) {
      throw new Error('Tenant context is required. Provide X-Tenant-ID or X-Tenant-Slug header.');
    }

    const result = await this.authService.register(registerDto, tenantId);

    // Set HTTP-only cookies
    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return result;
  }

  @Public()
  @Post('platform-admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Platform Admin Login (Super Admin)',
    description:
      'Authenticate Super Admin user. **No tenant ID or tenant headers required.** Only users with "Super Admin" role can login. This endpoint is for platform-level administration. Do not provide X-Tenant-ID or X-Tenant-Slug headers.',
  })
  // Note: No @ApiSecurity decorator - this endpoint does NOT require tenant headers
  @ApiBody({
    type: LoginDto,
    description: 'Super Admin login credentials',
    examples: {
      login: {
        summary: 'Super Admin login',
        value: {
          email: 'admin@platform.com',
          password: 'admin@123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns JWT tokens and user information.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or user is not a Super Admin',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: {
          type: 'string',
          example: 'Invalid credentials',
          description: 'Either email/password is incorrect or user does not have Super Admin role',
        },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async platformAdminLogin(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.platformAdminLogin(loginDto);
    this.setAuthCookies(response, result.accessToken, result.refreshToken);
    return result;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login (Email + Password)',
    description:
      'Authenticate user with email and password. Automatically finds the tenant by searching across all tenant databases. **No tenant ID required.** Returns JWT access and refresh tokens. If the email exists in multiple tenants, an error will be returned asking for tenant ID.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials',
    examples: {
      login: {
        summary: 'User login',
        value: {
          email: 'user@example.com',
          password: 'SecurePassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Email exists in multiple tenants - tenant ID required',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Email exists in multiple tenants. Please provide tenant ID or use tenant-specific login.',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.loginByEmail(loginDto);

    // Set HTTP-only cookies
    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return result;
  }

  @Public()
  @UseGuards(TenantGuard) // Require tenant context
  @Post('login/tenant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login with Tenant ID (Legacy)',
    description:
      'Legacy endpoint: Authenticate user with email, password, and tenant ID. Use `/auth/login` instead (email + password only). Returns JWT access and refresh tokens.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials',
    examples: {
      login: {
        summary: 'User login with tenant',
        value: {
          email: 'user@example.com',
          password: 'SecurePassword123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiSecurity('tenant-id')
  @ApiSecurity('tenant-slug')
  async loginWithTenant(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tenantId = (request as any).tenantId;
    if (!tenantId) {
      throw new Error('Tenant context is required. Provide X-Tenant-ID or X-Tenant-Slug header.');
    }

    const result = await this.authService.login(loginDto, tenantId);

    // Set HTTP-only cookies
    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Generate new access and refresh tokens using a valid refresh token. Works for both Super Admin (no tenant required) and tenant users (tenant context optional, extracted from token).',
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Refresh token',
    examples: {
      refresh: {
        summary: 'Refresh token',
        value: {
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid refresh token' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiSecurity('tenant-id')
  @ApiSecurity('tenant-slug')
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Extract tenantId from refresh token payload
    // The refresh token contains the original tenantId (can be null for Super Admin)
    let tenantId: string | null = null;
    
    try {
      // Try to decode the refresh token to get tenantId
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(refreshTokenDto.refreshToken) as any;
      tenantId = decoded?.tenantId || null;
    } catch (error) {
      // If decoding fails, will be handled in service
    }

    // For tenant users, also check request headers
    if (!tenantId) {
      tenantId = request.headers['x-tenant-id'] as string || (request as any).query?.tenantId || null;
    }

    const result = await this.authService.refreshToken(
      refreshTokenDto.refreshToken,
      tenantId,
    );

    // Set HTTP-only cookies
    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Get current user',
    description:
      'Returns the authenticated user\'s information based on the JWT token. Works for both Super Admin (tenantId: null) and tenant users.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Current user information',
    type: UserMeResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async getMe(@CurrentUser() user: CurrentUserPayload) {
    let tenantSlug = user.tenantSlug ?? null;
    if (user.tenantId && !tenantSlug) {
      const tenant = await this.prisma.tenants.findUnique({
        where: { id: user.tenantId },
        select: { slug: true },
      });
      tenantSlug = tenant?.slug ?? null;
    }
    return {
      id: user.userId,
      email: user.email,
      tenantId: user.tenantId,
      tenantSlug,
      roles: user.roles,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User logout',
    description: 'Logs out the user and clears authentication cookies.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async logout(@Res({ passthrough: true }) response: Response) {
    // Clear HTTP-only cookies
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');

    return { message: 'Logged out successfully' };
  }

  /**
   * Set HTTP-only cookies for tokens
   */
  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const isProduction = process.env.NODE_ENV === 'production';

    // Access token cookie (7 days)
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Refresh token cookie (30 days)
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });
  }
}
