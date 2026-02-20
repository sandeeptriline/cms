import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new tenant',
    description: 'Creates a new tenant and automatically provisions a dedicated database. The tenant will be in PROVISIONING status initially.',
  })
  @ApiBody({
    type: CreateTenantDto,
    description: 'Tenant creation data',
    examples: {
      basic: {
        summary: 'Basic tenant',
        value: {
          name: 'Acme Corporation',
          slug: 'acme-corp',
        },
      },
      withConfig: {
        summary: 'Tenant with configuration',
        value: {
          name: 'Acme Corporation',
          slug: 'acme-corp',
          config: { theme: 'default', language: 'en' },
          featureFlags: { analytics: true },
          usageLimits: { storage: 1000, apiCalls: 10000, users: 50 },
        },
      },
      withParent: {
        summary: 'Sub-tenant (child tenant)',
        value: {
          name: 'Acme Subsidiary',
          slug: 'acme-subsidiary',
          parentId: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Tenant created successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Tenant with this slug already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Tenant with slug "acme-corp" already exists' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all tenants',
    description: 'Returns a list of all tenants in the platform.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all tenants',
    type: [TenantResponseDto],
  })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get tenant by ID',
    description: 'Returns tenant details by UUID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Tenant UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant found',
    type: TenantResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Tenant not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get tenant by slug',
    description: 'Returns tenant details by slug (URL-friendly identifier).',
  })
  @ApiParam({
    name: 'slug',
    description: 'Tenant slug',
    example: 'acme-corp',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant found',
    type: TenantResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Tenant not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  findBySlug(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update tenant',
    description: 'Updates tenant information. Only provided fields will be updated.',
  })
  @ApiParam({
    name: 'id',
    description: 'Tenant UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateTenantDto,
    description: 'Tenant update data',
    examples: {
      updateName: {
        summary: 'Update tenant name',
        value: {
          name: 'Updated Company Name',
        },
      },
      updateConfig: {
        summary: 'Update configuration',
        value: {
          config: { theme: 'dark', language: 'fr' },
        },
      },
      updateStatus: {
        summary: 'Update status',
        value: {
          status: 'active',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant updated successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Tenant not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Slug already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Tenant with slug "new-slug" already exists' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activate tenant',
    description: 'Activates a tenant, changing its status to ACTIVE.',
  })
  @ApiParam({
    name: 'id',
    description: 'Tenant UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant activated',
    type: TenantResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Tenant not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  activate(@Param('id') id: string) {
    return this.tenantsService.activate(id);
  }

  @Patch(':id/suspend')
  @ApiOperation({
    summary: 'Suspend tenant',
    description: 'Suspends a tenant, changing its status to SUSPENDED.',
  })
  @ApiParam({
    name: 'id',
    description: 'Tenant UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant suspended',
    type: TenantResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Tenant not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  suspend(@Param('id') id: string) {
    return this.tenantsService.suspend(id);
  }

  @Post(':id/reset-db')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset tenant database structure',
    description:
      'Drops all tables in the tenant database and recreates them from the Composable Content Graph v2 schema. All tenant data is permanently lost. Use when the tenant DB has wrong or missing structure.',
  })
  @ApiParam({
    name: 'id',
    description: 'Tenant UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant database reset successfully',
    schema: { type: 'object', properties: { message: { type: 'string' } } },
  })
  @ApiResponse({
    status: 400,
    description: 'Tenant not found or has no database',
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  async resetTenantDb(@Param('id') id: string) {
    return this.tenantsService.resetTenantDb(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete tenant',
    description: 'Soft deletes a tenant. The tenant database is not removed, but the tenant is marked as deleted.',
  })
  @ApiParam({
    name: 'id',
    description: 'Tenant UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Tenant deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Tenant not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
