import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { v4 as uuidv4 } from 'uuid';

export interface Flow {
  id: string;
  project_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  status: string;
  trigger: string | null;
  accountability: string | null;
  options: Record<string, any> | null;
  operation: string | null;
  date_created: Date;
  user_created: string | null;
}

@Injectable()
export class FlowsService {
  private readonly logger = new Logger(FlowsService.name);

  constructor(
    private prisma: PrismaService,
    private tenantPrisma: TenantPrismaService,
  ) {}

  /**
   * Get all flows for a tenant and project
   */
  async findAll(tenantId: string, projectId: string): Promise<Flow[]> {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Verify project exists
      const project = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM projects WHERE id = ?`,
        projectId
      );
      if (project.length === 0) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      // Get flows
      const flows = await client.$queryRawUnsafe<Array<{
        id: string;
        project_id: string;
        name: string;
        icon: string | null;
        color: string | null;
        description: string | null;
        status: string;
        trigger: string | null;
        accountability: string | null;
        options: string | null;
        operation: string | null;
        date_created: Date;
        user_created: string | null;
      }>>(
        `SELECT 
          id, project_id, name, icon, color, description, status,
          \`trigger\`, accountability, options, operation, date_created, user_created
        FROM flows 
        WHERE project_id = ?
        ORDER BY date_created DESC`,
        projectId
      );

      // Parse JSON fields
      return flows.map(flow => ({
        ...flow,
        options: flow.options != null ? (typeof flow.options === 'string' ? JSON.parse(flow.options) : flow.options) : null,
      }));
    });
  }

  /**
   * Get a single flow by ID
   */
  async findOne(tenantId: string, projectId: string, flowId: string): Promise<Flow> {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Verify project exists
      const project = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM projects WHERE id = ?`,
        projectId
      );
      if (project.length === 0) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      // Get flow
      const flows = await client.$queryRawUnsafe<Array<{
        id: string;
        project_id: string;
        name: string;
        icon: string | null;
        color: string | null;
        description: string | null;
        status: string;
        trigger: string | null;
        accountability: string | null;
        options: string | null;
        operation: string | null;
        date_created: Date;
        user_created: string | null;
      }>>(
        `SELECT 
          id, project_id, name, icon, color, description, status,
          \`trigger\`, accountability, options, operation, date_created, user_created
        FROM flows 
        WHERE id = ? AND project_id = ?`,
        flowId,
        projectId
      );

      if (flows.length === 0) {
        throw new NotFoundException(`Flow with ID ${flowId} not found`);
      }

      const flow = flows[0];
      return {
        ...flow,
        options: flow.options != null ? (typeof flow.options === 'string' ? JSON.parse(flow.options) : flow.options) : null,
      };
    });
  }

  /**
   * Create a new flow
   */
  async create(tenantId: string, createDto: CreateFlowDto): Promise<Flow> {
    // Validate projectId is provided
    if (!createDto.projectId) {
      throw new BadRequestException('projectId is required');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Verify project exists
      const project = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM projects WHERE id = ?`,
        createDto.projectId
      );
      if (project.length === 0) {
        throw new NotFoundException(`Project with ID ${createDto.projectId} not found`);
      }

      const flowId = uuidv4();
      const status = createDto.status || 'active';

      // Create flow
      await client.$executeRawUnsafe(
        `INSERT INTO flows 
        (id, project_id, name, icon, color, description, status, \`trigger\`, accountability, options, operation, date_created, user_created)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
        flowId,
        createDto.projectId,
        createDto.name,
        createDto.icon || null,
        createDto.color || null,
        createDto.description || null,
        status,
        createDto.trigger || null,
        createDto.accountability || null,
        createDto.options ? JSON.stringify(createDto.options) : null,
        createDto.operation || null,
        null // user_created - can be set from request context later
      );

      return this.findOne(tenantId, createDto.projectId, flowId);
    });
  }

  /**
   * Update a flow
   */
  async update(
    tenantId: string,
    projectId: string,
    flowId: string,
    updateDto: UpdateFlowDto,
  ): Promise<Flow> {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Verify project exists
      const project = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM projects WHERE id = ?`,
        projectId
      );
      if (project.length === 0) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      // Verify flow exists and belongs to project
      await this.findOne(tenantId, projectId, flowId);

      // Build update query
      const updates: string[] = [];
      const params: any[] = [];

      if (updateDto.name !== undefined) {
        updates.push('name = ?');
        params.push(updateDto.name);
      }
      if (updateDto.icon !== undefined) {
        updates.push('icon = ?');
        params.push(updateDto.icon || null);
      }
      if (updateDto.color !== undefined) {
        updates.push('color = ?');
        params.push(updateDto.color || null);
      }
      if (updateDto.description !== undefined) {
        updates.push('description = ?');
        params.push(updateDto.description || null);
      }
      if (updateDto.status !== undefined) {
        updates.push('status = ?');
        params.push(updateDto.status);
      }
      if (updateDto.trigger !== undefined) {
        updates.push('`trigger` = ?');
        params.push(updateDto.trigger || null);
      }
      if (updateDto.accountability !== undefined) {
        updates.push('accountability = ?');
        params.push(updateDto.accountability || null);
      }
      if (updateDto.options !== undefined) {
        updates.push('options = ?');
        params.push(updateDto.options ? JSON.stringify(updateDto.options) : null);
      }
      if (updateDto.operation !== undefined) {
        updates.push('operation = ?');
        params.push(updateDto.operation || null);
      }

      if (updates.length === 0) {
        // No updates, return existing flow
        return this.findOne(tenantId, projectId, flowId);
      }

      params.push(flowId, projectId);

      await client.$executeRawUnsafe(
        `UPDATE flows SET ${updates.join(', ')} WHERE id = ? AND project_id = ?`,
        ...params
      );

      return this.findOne(tenantId, projectId, flowId);
    });
  }

  /**
   * Delete a flow
   */
  async remove(tenantId: string, projectId: string, flowId: string): Promise<void> {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantPrisma.withTenant(tenant.db_name, async (client) => {
      // Verify project exists
      const project = await client.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM projects WHERE id = ?`,
        projectId
      );
      if (project.length === 0) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      // Verify flow exists and belongs to project
      await this.findOne(tenantId, projectId, flowId);

      // Delete flow (CASCADE DELETE will handle operations)
      await client.$executeRawUnsafe(
        `DELETE FROM flows WHERE id = ? AND project_id = ?`,
        flowId,
        projectId
      );
    });
  }
}
