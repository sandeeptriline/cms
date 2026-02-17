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
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FlowsService } from './flows.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import { TenantId } from '../tenants/decorators/tenant.decorator';

@ApiTags('flows')
@Controller('flows')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
@ApiBearerAuth('JWT-auth')
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  @Get()
  @RequirePermission('flow:read')
  @ApiOperation({
    summary: 'Get all flows',
    description: 'Retrieve all flows for the current tenant and project. Requires flow:read permission.',
  })
  @ApiQuery({ name: 'projectId', description: 'Project ID (required)', required: true })
  @ApiResponse({
    status: 200,
    description: 'List of flows',
  })
  async findAll(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
  ) {
    if (!projectId) {
      throw new BadRequestException('projectId query parameter is required');
    }
    return this.flowsService.findAll(tenantId, projectId);
  }

  @Get(':id')
  @RequirePermission('flow:read')
  @ApiOperation({
    summary: 'Get a flow by ID',
    description: 'Retrieve a single flow. Requires flow:read permission.',
  })
  @ApiParam({ name: 'id', description: 'Flow ID' })
  @ApiQuery({ name: 'projectId', description: 'Project ID (required)', required: true })
  @ApiResponse({
    status: 200,
    description: 'Flow details',
  })
  @ApiResponse({ status: 404, description: 'Flow not found' })
  async findOne(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    if (!projectId) {
      throw new BadRequestException('projectId query parameter is required');
    }
    return this.flowsService.findOne(tenantId, projectId, id);
  }

  @Post()
  @RequirePermission('flow:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new flow',
    description: 'Create a new flow. Requires flow:create permission.',
  })
  @ApiResponse({
    status: 201,
    description: 'Flow created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @TenantId() tenantId: string,
    @Body() createDto: CreateFlowDto,
  ) {
    return this.flowsService.create(tenantId, createDto);
  }

  @Patch(':id')
  @RequirePermission('flow:update')
  @ApiOperation({
    summary: 'Update a flow',
    description: 'Update flow properties. Requires flow:update permission.',
  })
  @ApiParam({ name: 'id', description: 'Flow ID' })
  @ApiQuery({ name: 'projectId', description: 'Project ID (required)', required: true })
  @ApiResponse({
    status: 200,
    description: 'Flow updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Flow not found' })
  async update(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateFlowDto,
  ) {
    if (!projectId) {
      throw new BadRequestException('projectId query parameter is required');
    }
    return this.flowsService.update(tenantId, projectId, id, updateDto);
  }

  @Delete(':id')
  @RequirePermission('flow:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a flow',
    description: 'Delete a flow. Requires flow:delete permission.',
  })
  @ApiParam({ name: 'id', description: 'Flow ID' })
  @ApiQuery({ name: 'projectId', description: 'Project ID (required)', required: true })
  @ApiResponse({
    status: 200,
    description: 'Flow deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Flow not found' })
  async remove(
    @TenantId() tenantId: string,
    @Query('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    if (!projectId) {
      throw new BadRequestException('projectId query parameter is required');
    }
    return this.flowsService.remove(tenantId, projectId, id);
  }
}
