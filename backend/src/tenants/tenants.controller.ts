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

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new tenant' })
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
    },
  })
  @ApiResponse({ status: 201, description: 'Tenant created successfully', type: CreateTenantDto })
  @ApiResponse({ status: 409, description: 'Tenant with this slug already exists' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiResponse({ status: 200, description: 'List of all tenants' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  @ApiResponse({ status: 200, description: 'Tenant found' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get tenant by slug' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiResponse({ status: 200, description: 'Tenant found' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tenant' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  @ApiBody({ type: UpdateTenantDto })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate tenant' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  @ApiResponse({ status: 200, description: 'Tenant activated' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  activate(@Param('id') id: string) {
    return this.tenantsService.activate(id);
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspend tenant' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  @ApiResponse({ status: 200, description: 'Tenant suspended' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  suspend(@Param('id') id: string) {
    return this.tenantsService.suspend(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tenant (soft delete)' })
  @ApiParam({ name: 'id', description: 'Tenant UUID' })
  @ApiResponse({ status: 204, description: 'Tenant deleted' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
