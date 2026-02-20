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
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ComponentsService } from './components.service';
import { CreateComponentDto } from './dto/create-component.dto';
import { UpdateComponentDto } from './dto/update-component.dto';
import { CreateComponentFieldDto } from './dto/create-component-field.dto';
import { UpdateComponentFieldDto } from './dto/update-component-field.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import { TenantId } from '../tenants/decorators/tenant.decorator';

@ApiTags('components')
@Controller('components')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class ComponentsController {
  constructor(private readonly componentsService: ComponentsService) {}

  @Get()
  @RequirePermission('content_type:read')
  @ApiOperation({ summary: 'Get all components for a project (v2)' })
  async getComponents(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
  ) {
    if (!projectId) throw new BadRequestException('projectId query parameter is required');
    return this.componentsService.findAll(tenantId, projectId);
  }

  @Get(':id')
  @RequirePermission('content_type:read')
  @ApiOperation({ summary: 'Get component by ID' })
  @ApiParam({ name: 'id' })
  async getComponentById(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.componentsService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermission('content_type:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create component (v2)' })
  async create(
    @TenantId() tenantId: string,
    @Body() dto: CreateComponentDto,
  ) {
    return this.componentsService.create(tenantId, dto);
  }

  @Put(':id')
  @RequirePermission('content_type:update')
  @ApiOperation({ summary: 'Update component' })
  @ApiParam({ name: 'id' })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateComponentDto,
  ) {
    return this.componentsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('content_type:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete component' })
  @ApiParam({ name: 'id' })
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.componentsService.remove(tenantId, id);
  }

  @Post(':id/fields')
  @RequirePermission('content_type:update')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add field to component' })
  @ApiParam({ name: 'id' })
  async addField(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: CreateComponentFieldDto,
  ) {
    return this.componentsService.addField(tenantId, id, dto);
  }

  @Put(':id/fields/order')
  @RequirePermission('content_type:update')
  @ApiOperation({ summary: 'Update component field order' })
  @ApiParam({ name: 'id' })
  async updateFieldOrder(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() fieldOrders: Array<{ id: string; sort: number }>,
  ) {
    return this.componentsService.updateFieldOrder(tenantId, id, fieldOrders);
  }

  @Put(':id/fields/:fieldId')
  @RequirePermission('content_type:update')
  @ApiOperation({ summary: 'Update component field' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'fieldId' })
  async updateField(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateComponentFieldDto,
  ) {
    return this.componentsService.updateField(tenantId, id, fieldId, dto);
  }

  @Delete(':id/fields/:fieldId')
  @RequirePermission('content_type:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete component field' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'fieldId' })
  async removeField(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
  ) {
    return this.componentsService.removeField(tenantId, id, fieldId);
  }
}
