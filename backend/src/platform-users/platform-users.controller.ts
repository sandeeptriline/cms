import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PlatformUsersService } from './platform-users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import {
  UpdatePlatformUserDto,
  ChangePasswordDto,
} from './dto/update-platform-user.dto';
import { CreatePlatformUserDto } from './dto/create-platform-user.dto';
import { PlatformUserResponseDto } from './dto/platform-user-response.dto';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';

@ApiTags('platform-users')
@Controller('platform-users')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class PlatformUsersController {
  constructor(private readonly platformUsersService: PlatformUsersService) {}

  /**
   * Get all platform users
   */
  @Get()
  @RequirePermission('user:read')
  @ApiOperation({
    summary: 'Get all platform users',
    description: 'Returns a list of all platform users with their roles. Only accessible by users with user:read permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of platform users',
    type: [PlatformUserResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async getAll(): Promise<PlatformUserResponseDto[]> {
    const users = await this.platformUsersService.getAll();
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      avatar: user.avatar || null,
      roles: user.platform_user_roles.map((pur) => pur.role.name),
      lastLoginAt: (user as any).last_login_at || null,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));
  }

  /**
   * Get platform roles
   */
  @Get('roles')
  @RequirePermission('user:read')
  @ApiOperation({
    summary: 'Get all platform roles',
    description: 'Returns a list of all available platform roles for assignment to users.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of platform roles',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          is_system: { type: 'boolean' },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' },
        },
      },
    },
  })
  async getRoles() {
    return this.platformUsersService.getRoles();
  }

  /**
   * Get platform user by ID
   */
  @Get(':id')
  @RequirePermission('user:read')
  @ApiOperation({
    summary: 'Get platform user by ID',
    description: 'Returns a specific platform user by their ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Platform user retrieved successfully',
    type: PlatformUserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getById(@Param('id') id: string): Promise<PlatformUserResponseDto> {
    const user = await this.platformUsersService.getById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      avatar: user.avatar || null,
      roles: user.platform_user_roles.map((pur) => pur.role.name),
      lastLoginAt: (user as any).last_login_at || null,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  /**
   * Create platform user
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('user:create')
  @ApiOperation({
    summary: 'Create platform user',
    description: 'Creates a new platform user with optional role assignments.',
  })
  @ApiResponse({
    status: 201,
    description: 'Platform user created successfully',
    type: PlatformUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data or email already exists',
  })
  async create(@Body() createDto: CreatePlatformUserDto): Promise<PlatformUserResponseDto> {
    const user = await this.platformUsersService.create({
      email: createDto.email,
      password: createDto.password,
      name: createDto.name,
      status: createDto.status,
      roleIds: createDto.roleIds,
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      avatar: user.avatar || null,
      roles: user.platform_user_roles.map((pur) => pur.role.name),
      lastLoginAt: (user as any).last_login_at || null,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  /**
   * Update platform user
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('user:update')
  @ApiOperation({
    summary: 'Update platform user',
    description: 'Updates a platform user. Can update email, name, status, and roles.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Platform user updated successfully',
    type: PlatformUserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePlatformUserDto,
  ): Promise<PlatformUserResponseDto> {
    const user = await this.platformUsersService.update(id, {
      email: updateDto.email,
      name: updateDto.name,
      status: updateDto.status,
      roleIds: updateDto.roleIds,
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      avatar: user.avatar || null,
      roles: user.platform_user_roles.map((pur) => pur.role.name),
      lastLoginAt: (user as any).last_login_at || null,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  /**
   * Delete platform user (soft delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('user:delete')
  @ApiOperation({
    summary: 'Delete platform user',
    description: 'Soft deletes a platform user by setting status to 0 (inactive).',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Platform user deleted successfully',
    type: PlatformUserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async delete(@Param('id') id: string): Promise<PlatformUserResponseDto> {
    const user = await this.platformUsersService.delete(id);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      avatar: user.avatar || null,
      roles: user.platform_user_roles.map((pur) => pur.role.name),
      lastLoginAt: (user as any).last_login_at || null,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @RequirePermission('platform:read')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the profile information of the currently authenticated platform user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: PlatformUserResponseDto,
  })
  async getMe(@CurrentUser() user: CurrentUserPayload): Promise<PlatformUserResponseDto> {
    const platformUser = await this.platformUsersService.getById(user.userId);
    if (!platformUser) {
      throw new NotFoundException('User not found');
    }
    return {
      id: platformUser.id,
      email: platformUser.email,
      name: platformUser.name,
      status: platformUser.status,
      avatar: platformUser.avatar || null,
      roles: platformUser.platform_user_roles.map((pur) => pur.role.name),
      lastLoginAt: (platformUser as any).last_login_at || null,
      createdAt: platformUser.created_at,
      updatedAt: platformUser.updated_at,
    };
  }

  /**
   * Update current user profile
   */
  @Put('me')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('platform:update')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Updates the profile information (email, name) of the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: PlatformUserResponseDto,
  })
  async updateMe(
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateDto: UpdatePlatformUserDto,
  ): Promise<PlatformUserResponseDto> {
    const updated = await this.platformUsersService.update(user.userId, {
      email: updateDto.email,
      name: updateDto.name,
    });
    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      status: updated.status,
      avatar: updated.avatar || null,
      roles: updated.platform_user_roles.map((pur) => pur.role.name),
      lastLoginAt: (updated as any).last_login_at || null,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  }

  /**
   * Change current user password
   */
  @Put('me/password')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('platform:update')
  @ApiOperation({
    summary: 'Change current user password',
    description: 'Changes the password of the currently authenticated user. Optionally requires current password for verification.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password changed successfully',
        },
      },
    },
  })
  async changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const platformUser = await this.platformUsersService.getById(user.userId);
    if (!platformUser) {
      throw new NotFoundException('User not found');
    }

    // If current password is provided, verify it
    if (changePasswordDto.currentPassword) {
      const isValid = await bcrypt.compare(
        changePasswordDto.currentPassword,
        platformUser.password_hash,
      );
      if (!isValid) {
        throw new BadRequestException('Current password is incorrect');
      }
    }

    // Update password
    await this.platformUsersService.update(user.userId, {
      password: changePasswordDto.newPassword,
    });

    return { message: 'Password changed successfully' };
  }
}
