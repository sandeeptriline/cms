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
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or user already exists' })
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
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
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
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
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
  @ApiOperation({ summary: 'Get current user' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Current user information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'User logout' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Logout successful' })
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
