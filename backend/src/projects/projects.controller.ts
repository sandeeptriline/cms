import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import { TenantId } from '../tenants/decorators/tenant.decorator';

@Controller('projects')
@UseGuards(TenantGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * GET /projects - Get all projects
   */
  @Get()
  findAll(@TenantId() tenantId: string) {
    console.log('[ProjectsController] GET /projects called with tenantId:', tenantId);
    return this.projectsService.findAll(tenantId);
  }

  /**
   * GET /projects/:id/affected-counts - Get counts of records that will be deleted
   * NOTE: This must come before @Get(':id') to avoid route conflicts
   */
  @Get(':id/affected-counts')
  getAffectedCounts(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.projectsService.getAffectedRecordCounts(tenantId, id);
  }

  /**
   * GET /projects/:id - Get project by ID
   */
  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.projectsService.findOne(tenantId, id);
  }

  /**
   * POST /projects - Create project
   */
  @Post()
  create(
    @TenantId() tenantId: string,
    @Body() createDto: CreateProjectDto,
  ) {
    return this.projectsService.create(tenantId, createDto);
  }

  /**
   * PATCH /projects/:id - Update project
   */
  @Patch(':id')
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(tenantId, id, updateDto);
  }

  /**
   * DELETE /projects/:id - Delete project
   */
  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.projectsService.remove(tenantId, id);
  }
}
