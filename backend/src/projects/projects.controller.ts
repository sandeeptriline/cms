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
import { CreateProjectDomainDto } from './dto/create-project-domain.dto';
import { UpdateProjectDomainDto } from './dto/update-project-domain.dto';
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
   * GET /projects/:id/domains - Get all domains for a project
   */
  @Get(':id/domains')
  findProjectDomains(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.projectsService.findProjectDomains(tenantId, id);
  }

  /**
   * POST /projects/:id/domains - Create a project domain
   */
  @Post(':id/domains')
  createProjectDomain(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() createDto: CreateProjectDomainDto,
  ) {
    return this.projectsService.createProjectDomain(tenantId, id, createDto);
  }

  /**
   * PATCH /projects/:id/domains/:domainId - Update a project domain
   */
  @Patch(':id/domains/:domainId')
  updateProjectDomain(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('domainId') domainId: string,
    @Body() updateDto: UpdateProjectDomainDto,
  ) {
    return this.projectsService.updateProjectDomain(tenantId, id, domainId, updateDto);
  }

  /**
   * DELETE /projects/:id/domains/:domainId - Delete a project domain
   */
  @Delete(':id/domains/:domainId')
  removeProjectDomain(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('domainId') domainId: string,
  ) {
    return this.projectsService.removeProjectDomain(tenantId, id, domainId);
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
