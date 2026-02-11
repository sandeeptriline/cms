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
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
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
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(TenantGuard) // Require tenant context
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account in the specified tenant. Returns JWT tokens for immediate authentication.',
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
  @UseGuards(TenantGuard) // Require tenant context
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with email and password. Returns JWT access and refresh tokens.',
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
  async login(
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
  @UseGuards(TenantGuard) // Require tenant context
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate new access and refresh tokens using a valid refresh token.',
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
    const tenantId = (request as any).tenantId;
    if (!tenantId) {
      throw new Error('Tenant context is required. Provide X-Tenant-ID or X-Tenant-Slug header.');
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
    description: 'Returns the authenticated user\'s information based on the JWT token.',
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
    return {
      id: user.userId,
      email: user.email,
      tenantId: user.tenantId,
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
