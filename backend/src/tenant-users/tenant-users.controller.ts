import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { TenantUsersService } from './tenant-users.service';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import { UpdateTenantUserDto } from './dto/update-tenant-user.dto';
import { TenantUserFiltersDto } from './dto/tenant-user-filters.dto';
import { TenantUserResponseDto } from './dto/tenant-user-response.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('tenant-users')
@Controller('tenant-users')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth('JWT-auth')
export class TenantUsersController {
  constructor(private readonly tenantUsersService: TenantUsersService) {}

  @Get()
  @RequirePermission('user:read')
  @ApiOperation({
    summary: 'Get all tenant users (Super Admin)',
    description:
      'Retrieve all users across all tenants. Only accessible by Super Admin. Supports filtering by tenant, email, status, and role. Results are paginated.',
  })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Filter by tenant ID' })
  @ApiQuery({ name: 'email', required: false, description: 'Filter by email (partial match)' })
  @ApiQuery({ name: 'status', required: false, enum: [1, 0, -1], description: '1 = active, 0 = inactive, -1 = deleted' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role name' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'List of tenant users with pagination',
    schema: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: { $ref: '#/components/schemas/TenantUserResponseDto' },
        },
        total: { type: 'number', example: 100 },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Permission denied - user:read permission required',
  })
  async getAll(@Query() filters: TenantUserFiltersDto) {
    return this.tenantUsersService.getAllTenantUsers(filters);
  }

  @Get('tenant/:tenantId/roles')
  @RequirePermission('user:read')
  @ApiOperation({
    summary: 'Get roles for a specific tenant',
    description: 'Retrieve all roles available in a specific tenant. Only accessible by Super Admin.',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of roles for the tenant',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Permission denied - user:read permission required',
  })
  async getTenantRoles(@Param('tenantId') tenantId: string) {
    return this.tenantUsersService.getTenantRoles(tenantId);
  }

  @Get('tenant/:tenantId/roles/:roleId/permissions')
  @RequirePermission('user:read')
  @ApiOperation({
    summary: 'Get permissions for a specific role',
    description: 'Retrieve all permissions assigned to a role in a tenant. Only accessible by Super Admin.',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'roleId',
    description: 'Role ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of permissions for the role',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          resource: { type: 'string' },
          action: { type: 'string' },
          category: { type: 'string' },
          description: { type: 'string', nullable: true },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant or role not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Permission denied - user:read permission required',
  })
  async getRolePermissions(
    @Param('tenantId') tenantId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.tenantUsersService.getRolePermissions(tenantId, roleId);
  }

  @Get('tenant/:tenantId/permissions')
  @RequirePermission('role:read')
  @ApiOperation({
    summary: 'Get all available permissions for a tenant',
    description: 'Retrieve all permissions available in a tenant. Only accessible by Super Admin or Tenant Admin.',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all permissions',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          resource: { type: 'string' },
          action: { type: 'string' },
          category: { type: 'string' },
          description: { type: 'string', nullable: true },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Permission denied - role:read permission required',
  })
  async getAllPermissions(@Param('tenantId') tenantId: string) {
    return this.tenantUsersService.getAllPermissions(tenantId);
  }

  @Post('tenant/:tenantId/roles')
  @RequirePermission('role:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new role in a tenant',
    description: 'Create a new role in a tenant. Only accessible by Super Admin or Tenant Admin.',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Role name already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Permission denied - role:create permission required',
  })
  async createRole(
    @Param('tenantId') tenantId: string,
    @Body() createDto: CreateRoleDto,
  ) {
    return this.tenantUsersService.createRole(tenantId, createDto);
  }

  @Put('tenant/:tenantId/roles/:roleId')
  @RequirePermission('role:update')
  @ApiOperation({
    summary: 'Update a role in a tenant',
    description: 'Update role name or description. Only accessible by Super Admin or Tenant Admin.',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'roleId',
    description: 'Role ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Permission denied - role:update permission required',
  })
  async updateRole(
    @Param('tenantId') tenantId: string,
    @Param('roleId') roleId: string,
    @Body() updateDto: UpdateRoleDto,
  ) {
    return this.tenantUsersService.updateRole(tenantId, roleId, updateDto);
  }

  @Delete('tenant/:tenantId/roles/:roleId')
  @RequirePermission('role:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a role from a tenant',
    description: 'Delete a role. Cannot delete system roles or roles assigned to users. Only accessible by Super Admin or Tenant Admin.',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'roleId',
    description: 'Role ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Role deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete system role or role assigned to users',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Permission denied - role:delete permission required',
  })
  async deleteRole(
    @Param('tenantId') tenantId: string,
    @Param('roleId') roleId: string,
  ) {
    await this.tenantUsersService.deleteRole(tenantId, roleId);
  }

  @Post('tenant/:tenantId/roles/:roleId/permissions')
  @RequirePermission('role:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign permissions to a role',
    description: 'Assign permissions to a role. Replaces all existing permissions. Only accessible by Super Admin or Tenant Admin.',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'roleId',
    description: 'Role ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions assigned successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid permission IDs',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Permission denied - role:update permission required',
  })
  async assignPermissions(
    @Param('tenantId') tenantId: string,
    @Param('roleId') roleId: string,
    @Body() assignDto: AssignPermissionsDto,
  ) {
    await this.tenantUsersService.assignPermissionsToRole(tenantId, roleId, assignDto.permissionIds);
    return { message: 'Permissions assigned successfully' };
  }

  @Get('tenant/:tenantId')
  @RequirePermission('user:read')
  @ApiOperation({
    summary: 'Get users for a specific tenant',
    description: 'Retrieve all users belonging to a specific tenant. Only accessible by Super Admin. Supports filtering by status and email.',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({ name: 'status', required: false, enum: [1, 0, -1], description: 'Filter by status: 1 = active, 0 = inactive, -1 = deleted' })
  @ApiQuery({ name: 'email', required: false, description: 'Filter by email (partial match)' })
  @ApiResponse({
    status: 200,
    description: 'List of users for the tenant',
    type: [TenantUserResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Permission denied - user:read permission required',
  })
  async getByTenant(
    @Param('tenantId') tenantId: string,
    @Query('status') status?: string,
    @Query('email') email?: string,
  ) {
    // Only create filters object if we have actual filter values
    let filters: { status?: number; email?: string } | undefined = undefined;
    
    // Parse status if provided (query params come as strings)
    if (status !== undefined && status !== null && status !== '') {
      const parsedStatus = Number(status);
      if (!isNaN(parsedStatus)) {
        filters = filters || {};
        filters.status = parsedStatus;
      }
    }
    
    if (email) {
      filters = filters || {};
      filters.email = email;
    }
    
    return this.tenantUsersService.getTenantUsers(tenantId, filters);
  }

  @Get('tenant/:tenantId/user/:userId')
  @RequirePermission('user:read')
  @ApiOperation({
    summary: 'Get a specific tenant user',
    description: 'Retrieve details of a specific user in a tenant. Only accessible by Super Admin.',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User details',
    type: TenantUserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant or user not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Permission denied - user:read permission required',
  })
  async getOne(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    return this.tenantUsersService.getTenantUser(tenantId, userId);
  }

  @Post('tenant/:tenantId')
  @RequirePermission('user:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new tenant user',
    description:
      'Create a new user in a specific tenant. Only accessible by Super Admin. Password will be hashed automatically.',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: TenantUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or user already exists',
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Permission denied - user:create permission required',
  })
  async create(
    @Param('tenantId') tenantId: string,
    @Body() createDto: CreateTenantUserDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tenantUsersService.createTenantUser(tenantId, createDto, user.userId);
  }

  @Put('tenant/:tenantId/user/:userId')
  @RequirePermission('user:update')
  @ApiOperation({
    summary: 'Update a tenant user',
    description:
      'Update user information in a specific tenant. Only accessible by Super Admin. Password will be hashed if provided.',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: TenantUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or email already exists',
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant or user not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Permission denied - user:update permission required',
  })
  async update(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() updateDto: UpdateTenantUserDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tenantUsersService.updateTenantUser(tenantId, userId, updateDto, user.userId);
  }

  @Delete('tenant/:tenantId/user/:userId')
  @RequirePermission('user:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft delete a tenant user',
    description:
      'Soft delete a user from a specific tenant by setting their status to -1 (deleted). Only accessible by Super Admin. The user record is preserved but marked as deleted and will be excluded from normal queries.',
  })
  @ApiParam({
    name: 'tenantId',
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant or user not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Permission denied - user:delete permission required',
  })
  async delete(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
  ) {
    await this.tenantUsersService.deleteTenantUser(tenantId, userId);
  }
}
