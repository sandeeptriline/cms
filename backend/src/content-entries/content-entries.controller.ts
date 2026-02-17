import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { TenantId } from '../tenants/decorators/tenant.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ContentEntriesService } from './content-entries.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { PublishEntryDto } from './dto/publish-entry.dto';
import { QueryEntriesDto } from './dto/query-entries.dto';

@ApiTags('Content Entries')
@ApiBearerAuth()
@Controller('content-entries')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ContentEntriesController {
  private readonly logger = new Logger(ContentEntriesController.name);

  constructor(private readonly contentEntriesService: ContentEntriesService) {}

  @Get()
  @ApiOperation({ summary: 'List entries for a content type' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiQuery({ name: 'contentTypeId', required: true, description: 'Content Type ID' })
  @ApiResponse({ status: 200, description: 'List of entries' })
  async findAll(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('contentTypeId') contentTypeId: string,
    @Query() queryDto: QueryEntriesDto,
  ) {
    this.logger.log(`[findAll] Listing entries for content type: ${contentTypeId}, project: ${projectId}`);
    return this.contentEntriesService.findAll(tenantId, projectId, contentTypeId, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single entry by ID' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiQuery({ name: 'contentTypeId', required: true, description: 'Content Type ID' })
  @ApiResponse({ status: 200, description: 'Entry details' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  async findOne(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('contentTypeId') contentTypeId: string,
    @Param('id') entryId: string,
  ) {
    this.logger.log(`[findOne] Getting entry: ${entryId}, content type: ${contentTypeId}, project: ${projectId}`);
    return this.contentEntriesService.findOne(tenantId, projectId, contentTypeId, entryId);
  }

  @Post()
  @RequirePermission('content_entry:create')
  @ApiOperation({ summary: 'Create a new entry' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiResponse({ status: 201, description: 'Entry created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Body() createDto: CreateEntryDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    this.logger.log(`[create] Creating entry for content type: ${createDto.contentTypeId}, project: ${projectId}`);
    return this.contentEntriesService.create(tenantId, projectId, createDto, user?.userId);
  }

  @Patch(':id')
  @RequirePermission('content_entry:update')
  @ApiOperation({ summary: 'Update an entry' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiQuery({ name: 'contentTypeId', required: true, description: 'Content Type ID' })
  @ApiResponse({ status: 200, description: 'Entry updated' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  async update(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('contentTypeId') contentTypeId: string,
    @Param('id') entryId: string,
    @Body() updateDto: UpdateEntryDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    this.logger.log(`[update] Updating entry: ${entryId}, content type: ${contentTypeId}, project: ${projectId}`);
    return this.contentEntriesService.update(tenantId, projectId, contentTypeId, entryId, updateDto, user?.userId);
  }

  @Delete(':id')
  @RequirePermission('content_entry:delete')
  @ApiOperation({ summary: 'Delete an entry' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiQuery({ name: 'contentTypeId', required: true, description: 'Content Type ID' })
  @ApiResponse({ status: 200, description: 'Entry deleted' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  async delete(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('contentTypeId') contentTypeId: string,
    @Param('id') entryId: string,
  ) {
    this.logger.log(`[delete] Deleting entry: ${entryId}, content type: ${contentTypeId}, project: ${projectId}`);
    return this.contentEntriesService.delete(tenantId, projectId, contentTypeId, entryId);
  }

  @Post(':id/publish')
  @RequirePermission('content_entry:publish')
  @ApiOperation({ summary: 'Publish an entry' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiQuery({ name: 'contentTypeId', required: true, description: 'Content Type ID' })
  @ApiResponse({ status: 200, description: 'Entry published' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async publish(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('contentTypeId') contentTypeId: string,
    @Param('id') entryId: string,
    @Body() publishDto: PublishEntryDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    this.logger.log(`[publish] Publishing entry: ${entryId}, content type: ${contentTypeId}, project: ${projectId}`);
    return this.contentEntriesService.publish(tenantId, projectId, contentTypeId, entryId, publishDto, user?.userId);
  }

  @Post(':id/unpublish')
  @RequirePermission('content_entry:publish')
  @ApiOperation({ summary: 'Unpublish an entry' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiQuery({ name: 'contentTypeId', required: true, description: 'Content Type ID' })
  @ApiResponse({ status: 200, description: 'Entry unpublished' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async unpublish(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('contentTypeId') contentTypeId: string,
    @Param('id') entryId: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    this.logger.log(`[unpublish] Unpublishing entry: ${entryId}, content type: ${contentTypeId}, project: ${projectId}`);
    return this.contentEntriesService.unpublish(tenantId, projectId, contentTypeId, entryId, user?.userId);
  }

  @Post(':id/change-status')
  @RequirePermission('content_entry:update')
  @ApiOperation({ summary: 'Change entry status' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiQuery({ name: 'contentTypeId', required: true, description: 'Content Type ID' })
  @ApiResponse({ status: 200, description: 'Status changed' })
  async changeStatus(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('contentTypeId') contentTypeId: string,
    @Param('id') entryId: string,
    @Body('status') status: 'draft' | 'review' | 'approved' | 'published',
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    this.logger.log(`[changeStatus] Changing status for entry: ${entryId} to ${status}, content type: ${contentTypeId}, project: ${projectId}`);
    return this.contentEntriesService.changeStatus(tenantId, projectId, contentTypeId, entryId, status, user?.userId);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'List all versions for an entry' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiQuery({ name: 'contentTypeId', required: true, description: 'Content Type ID' })
  @ApiResponse({ status: 200, description: 'List of versions' })
  async getVersions(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('contentTypeId') contentTypeId: string,
    @Param('id') entryId: string,
  ) {
    this.logger.log(`[getVersions] Getting versions for entry: ${entryId}, content type: ${contentTypeId}, project: ${projectId}`);
    return this.contentEntriesService.getVersions(tenantId, projectId, contentTypeId, entryId);
  }

  @Get(':id/versions/:versionId')
  @ApiOperation({ summary: 'Get a specific version' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiQuery({ name: 'contentTypeId', required: true, description: 'Content Type ID' })
  @ApiResponse({ status: 200, description: 'Version details' })
  @ApiResponse({ status: 404, description: 'Version not found' })
  async getVersion(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('contentTypeId') contentTypeId: string,
    @Param('id') entryId: string,
    @Param('versionId') versionId: string,
  ) {
    this.logger.log(`[getVersion] Getting version: ${versionId} for entry: ${entryId}, content type: ${contentTypeId}, project: ${projectId}`);
    return this.contentEntriesService.getVersion(tenantId, projectId, contentTypeId, entryId, versionId);
  }

  @Post(':id/revert/:versionId')
  @RequirePermission('content_entry:update')
  @ApiOperation({ summary: 'Revert entry to a specific version' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiQuery({ name: 'contentTypeId', required: true, description: 'Content Type ID' })
  @ApiResponse({ status: 200, description: 'Entry reverted' })
  @ApiResponse({ status: 404, description: 'Version not found' })
  async revertToVersion(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('contentTypeId') contentTypeId: string,
    @Param('id') entryId: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    this.logger.log(`[revertToVersion] Reverting entry: ${entryId} to version: ${versionId}, content type: ${contentTypeId}, project: ${projectId}`);
    return this.contentEntriesService.revertToVersion(tenantId, projectId, contentTypeId, entryId, versionId, user?.userId);
  }

  @Post('bulk-delete')
  @RequirePermission('content_entry:delete')
  @ApiOperation({ summary: 'Bulk delete entries' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiQuery({ name: 'contentTypeId', required: true, description: 'Content Type ID' })
  @ApiResponse({ status: 200, description: 'Entries deleted' })
  async bulkDelete(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('contentTypeId') contentTypeId: string,
    @Body('entryIds') entryIds: string[],
  ) {
    this.logger.log(`[bulkDelete] Bulk deleting ${entryIds.length} entries, content type: ${contentTypeId}, project: ${projectId}`);
    return this.contentEntriesService.bulkDelete(tenantId, projectId, contentTypeId, entryIds);
  }

  @Post('bulk-publish')
  @RequirePermission('content_entry:publish')
  @ApiOperation({ summary: 'Bulk publish entries' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiQuery({ name: 'contentTypeId', required: true, description: 'Content Type ID' })
  @ApiResponse({ status: 200, description: 'Entries published' })
  async bulkPublish(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('contentTypeId') contentTypeId: string,
    @Body('entryIds') entryIds: string[],
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    this.logger.log(`[bulkPublish] Bulk publishing ${entryIds.length} entries, content type: ${contentTypeId}, project: ${projectId}`);
    return this.contentEntriesService.bulkPublish(tenantId, projectId, contentTypeId, entryIds, user?.userId);
  }

  @Post('bulk-change-status')
  @RequirePermission('content_entry:update')
  @ApiOperation({ summary: 'Bulk change status' })
  @ApiQuery({ name: 'projectId', required: true, description: 'Project ID' })
  @ApiQuery({ name: 'contentTypeId', required: true, description: 'Content Type ID' })
  @ApiResponse({ status: 200, description: 'Status changed' })
  async bulkChangeStatus(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('contentTypeId') contentTypeId: string,
    @Body('entryIds') entryIds: string[],
    @Body('status') status: 'draft' | 'review' | 'approved' | 'published',
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    this.logger.log(`[bulkChangeStatus] Bulk changing status for ${entryIds.length} entries to ${status}, content type: ${contentTypeId}, project: ${projectId}`);
    return this.contentEntriesService.bulkChangeStatus(tenantId, projectId, contentTypeId, entryIds, status, user?.userId);
  }
}
