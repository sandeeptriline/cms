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
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ContentNodesService } from './content-nodes.service';
import { QueryContentNodesDto } from './dto/query-entries.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import { TenantId } from '../tenants/decorators/tenant.decorator';

@ApiTags('content-nodes')
@Controller('content-nodes')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
export class ContentNodesController {
  constructor(private readonly contentNodesService: ContentNodesService) {}

  @Get()
  @RequirePermission('content_entry:read')
  @ApiOperation({ summary: 'List entries (v2) for a collection' })
  async findAll(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('collectionId') collectionId: string,
    @Query() query: QueryContentNodesDto,
  ) {
    if (!projectId || !collectionId) throw new BadRequestException('projectId and collectionId required');
    return this.contentNodesService.findAll(tenantId, projectId, collectionId, query);
  }

  @Get(':id')
  @RequirePermission('content_entry:read')
  @ApiOperation({ summary: 'Get one entry by ID' })
  @ApiParam({ name: 'id' })
  async findOne(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('collectionId') collectionId: string,
    @Param('id') id: string,
  ) {
    if (!projectId || !collectionId) throw new BadRequestException('projectId and collectionId required');
    return this.contentNodesService.findOne(tenantId, projectId, collectionId, id);
  }

  @Post()
  @RequirePermission('content_entry:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create entry (v2)' })
  async create(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('collectionId') collectionId: string,
    @Body() body: { data: Record<string, any>; status?: string },
  ) {
    if (!projectId || !collectionId) throw new BadRequestException('projectId and collectionId required');
    return this.contentNodesService.create(tenantId, projectId, collectionId, body);
  }

  @Put(':id')
  @RequirePermission('content_entry:update')
  @ApiOperation({ summary: 'Update entry' })
  @ApiParam({ name: 'id' })
  async update(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('collectionId') collectionId: string,
    @Param('id') id: string,
    @Body() body: { data?: Record<string, any>; status?: string },
  ) {
    if (!projectId || !collectionId) throw new BadRequestException('projectId and collectionId required');
    return this.contentNodesService.update(tenantId, projectId, collectionId, id, body);
  }

  @Delete(':id')
  @RequirePermission('content_entry:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete entry' })
  @ApiParam({ name: 'id' })
  async remove(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('collectionId') collectionId: string,
    @Param('id') id: string,
  ) {
    if (!projectId || !collectionId) throw new BadRequestException('projectId and collectionId required');
    await this.contentNodesService.remove(tenantId, projectId, collectionId, id);
  }

  @Post(':id/publish')
  @RequirePermission('content_entry:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish entry' })
  @ApiParam({ name: 'id' })
  async publish(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('collectionId') collectionId: string,
    @Param('id') id: string,
  ) {
    if (!projectId || !collectionId) throw new BadRequestException('projectId and collectionId required');
    return this.contentNodesService.publish(tenantId, projectId, collectionId, id);
  }

  @Post(':id/unpublish')
  @RequirePermission('content_entry:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpublish entry' })
  @ApiParam({ name: 'id' })
  async unpublish(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Query('collectionId') collectionId: string,
    @Param('id') id: string,
  ) {
    if (!projectId || !collectionId) throw new BadRequestException('projectId and collectionId required');
    return this.contentNodesService.unpublish(tenantId, projectId, collectionId, id);
  }
}
