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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto, CreateCollectionFieldDto } from './dto/create-collection.dto';
import { UpdateCollectionDto, UpdateCollectionFieldDto } from './dto/update-collection.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import { TenantId } from '../tenants/decorators/tenant.decorator';

@ApiTags('collections')
@Controller('collections')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  @RequirePermission('content_type:read')
  @ApiOperation({ summary: 'Get all collections (v2 schema)' })
  async getCollections(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
  ) {
    if (!projectId) throw new BadRequestException('projectId query parameter is required');
    return this.collectionsService.findAll(tenantId, projectId);
  }

  @Get(':id')
  @RequirePermission('content_type:read')
  @ApiOperation({ summary: 'Get collection by ID' })
  @ApiParam({ name: 'id' })
  async getCollectionById(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.collectionsService.findOne(tenantId, id);
  }

  @Post()
  @RequirePermission('content_type:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create collection (v2)' })
  @ApiResponse({ status: 201, description: 'Collection created' })
  async create(
    @TenantId() tenantId: string,
    @Body() dto: CreateCollectionDto,
  ) {
    return this.collectionsService.create(tenantId, dto);
  }

  @Put(':id')
  @RequirePermission('content_type:update')
  @ApiOperation({ summary: 'Update collection' })
  @ApiParam({ name: 'id' })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    return this.collectionsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermission('content_type:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete collection' })
  @ApiParam({ name: 'id' })
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.collectionsService.remove(tenantId, id);
  }

  @Post(':id/fields')
  @RequirePermission('content_type:update')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add field to collection' })
  @ApiParam({ name: 'id' })
  async addField(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: CreateCollectionFieldDto,
  ) {
    return this.collectionsService.addField(tenantId, id, dto);
  }

  @Put(':id/fields/order')
  @RequirePermission('content_type:update')
  @ApiOperation({ summary: 'Update field order (v2 collections)' })
  @ApiParam({ name: 'id' })
  async updateFieldOrder(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() fieldOrders: Array<{ id: string; sort: number }>,
  ) {
    return this.collectionsService.updateFieldOrder(tenantId, id, fieldOrders);
  }

  @Put(':id/fields/:fieldId')
  @RequirePermission('content_type:update')
  @ApiOperation({ summary: 'Update field' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'fieldId' })
  async updateField(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: UpdateCollectionFieldDto,
  ) {
    return this.collectionsService.updateField(tenantId, id, fieldId, dto);
  }

  @Delete(':id/fields/:fieldId')
  @RequirePermission('content_type:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete field' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'fieldId' })
  async removeField(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('fieldId') fieldId: string,
  ) {
    return this.collectionsService.removeField(tenantId, id, fieldId);
  }
}
