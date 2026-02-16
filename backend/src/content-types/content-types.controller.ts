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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DataModelsService } from './data-models.service';
import { CreateContentTypeDto, CreateFieldDto } from './dto/create-content-type.dto';
import { UpdateContentTypeDto } from './dto/update-content-type.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { ContentTypeResponseDto } from './dto/content-type-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import { TenantId } from '../tenants/decorators/tenant.decorator';

@ApiTags('content-types')
@Controller('content-types')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
@ApiBearerAuth('JWT-auth')
export class ContentTypesController {
  constructor(private readonly contentTypesService: DataModelsService) {}

  @Get()
  @RequirePermission('content_type:read')
  @ApiOperation({
    summary: 'Get all content types',
    description: 'Retrieve all content types for the current tenant. Requires content_type:read permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of content types',
    type: [ContentTypeResponseDto],
  })
  async getContentTypes(@TenantId() tenantId: string) {
    return this.contentTypesService.getContentTypes(tenantId);
  }

  @Get(':id')
  @RequirePermission('content_type:read')
  @ApiOperation({
    summary: 'Get a content type by ID',
    description: 'Retrieve a single content type with its fields. Requires content_type:read permission.',
  })
  @ApiParam({ name: 'id', description: 'Content type ID' })
  @ApiResponse({
    status: 200,
    description: 'Content type details',
    type: ContentTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Content type not found' })
  async getContentTypeById(
    @TenantId() tenantId: string,
    @Param('id') contentTypeId: string,
  ) {
    return this.contentTypesService.getContentTypeById(tenantId, contentTypeId);
  }

  @Post()
  @RequirePermission('content_type:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new content type',
    description: 'Create a new content type with optional fields. Requires content_type:create permission.',
  })
  @ApiResponse({
    status: 201,
    description: 'Content type created successfully',
    type: ContentTypeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate collection name' })
  async createContentType(
    @TenantId() tenantId: string,
    @Body() createDto: CreateContentTypeDto,
  ) {
    return this.contentTypesService.createContentType(tenantId, createDto);
  }

  @Put(':id')
  @RequirePermission('content_type:update')
  @ApiOperation({
    summary: 'Update a content type',
    description: 'Update content type properties. Cannot modify system content types. Requires content_type:update permission.',
  })
  @ApiParam({ name: 'id', description: 'Content type ID' })
  @ApiResponse({
    status: 200,
    description: 'Content type updated successfully',
    type: ContentTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Content type not found' })
  @ApiResponse({ status: 400, description: 'Cannot modify system content type' })
  async updateContentType(
    @TenantId() tenantId: string,
    @Param('id') contentTypeId: string,
    @Body() updateDto: UpdateContentTypeDto,
  ) {
    return this.contentTypesService.updateContentType(tenantId, contentTypeId, updateDto);
  }

  @Delete(':id')
  @RequirePermission('content_type:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a content type',
    description: 'Delete a content type. Cannot delete system content types or content types with entries. Requires content_type:delete permission.',
  })
  @ApiParam({ name: 'id', description: 'Content type ID' })
  @ApiResponse({
    status: 200,
    description: 'Content type deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Content type not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete system content type or content type with entries' })
  async deleteContentType(
    @TenantId() tenantId: string,
    @Param('id') contentTypeId: string,
  ) {
    return this.contentTypesService.deleteContentType(tenantId, contentTypeId);
  }

  @Post(':id/fields')
  @RequirePermission('content_type:update')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a field to a content type',
    description: 'Add a new field to an existing content type. Requires content_type:update permission.',
  })
  @ApiParam({ name: 'id', description: 'Content type ID' })
  @ApiResponse({
    status: 201,
    description: 'Field created successfully',
  })
  @ApiResponse({ status: 404, description: 'Content type not found' })
  @ApiResponse({ status: 400, description: 'Field already exists' })
  async createField(
    @TenantId() tenantId: string,
    @Param('id') contentTypeId: string,
    @Body() fieldDto: CreateFieldDto,
  ) {
    return this.contentTypesService.createField(tenantId, contentTypeId, fieldDto);
  }

  @Put(':id/fields/:fieldId')
  @RequirePermission('content_type:update')
  @ApiOperation({
    summary: 'Update a field',
    description: 'Update a field in a content type. Requires content_type:update permission.',
  })
  @ApiParam({ name: 'id', description: 'Content type ID' })
  @ApiParam({ name: 'fieldId', description: 'Field ID' })
  @ApiResponse({
    status: 200,
    description: 'Field updated successfully',
    type: ContentTypeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Content type or field not found' })
  @ApiResponse({ status: 400, description: 'Field name already exists' })
  async updateField(
    @TenantId() tenantId: string,
    @Param('id') contentTypeId: string,
    @Param('fieldId') fieldId: string,
    @Body() updateDto: UpdateFieldDto,
  ) {
    return this.contentTypesService.updateField(tenantId, contentTypeId, fieldId, updateDto);
  }

  @Delete(':id/fields/:fieldId')
  @RequirePermission('content_type:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a field',
    description: 'Delete a field from a content type. Requires content_type:update permission.',
  })
  @ApiParam({ name: 'id', description: 'Content type ID' })
  @ApiParam({ name: 'fieldId', description: 'Field ID' })
  @ApiResponse({
    status: 200,
    description: 'Field deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Content type or field not found' })
  async deleteField(
    @TenantId() tenantId: string,
    @Param('id') contentTypeId: string,
    @Param('fieldId') fieldId: string,
  ) {
    return this.contentTypesService.deleteField(tenantId, contentTypeId, fieldId);
  }

  @Put(':id/fields/order')
  @RequirePermission('content_type:update')
  @ApiOperation({
    summary: 'Update field order',
    description: 'Update the sort order of fields in a content type. Requires content_type:update permission.',
  })
  @ApiParam({ name: 'id', description: 'Content type ID' })
  @ApiResponse({
    status: 200,
    description: 'Field order updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Content type not found' })
  async updateFieldOrder(
    @TenantId() tenantId: string,
    @Param('id') contentTypeId: string,
    @Body() fieldOrders: Array<{ id: string; sort: number }>,
  ) {
    return this.contentTypesService.updateFieldOrder(tenantId, contentTypeId, fieldOrders);
  }
}
