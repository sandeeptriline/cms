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
import { FormElementsService } from './form-elements.service';
import { CreateFormElementDto } from './dto/create-form-element.dto';
import { UpdateFormElementDto } from './dto/update-form-element.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../permissions/guards/permission.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import { TenantId } from '../tenants/decorators/tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('form-elements')
@Controller('form-elements')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
@ApiBearerAuth('JWT-auth')
export class FormElementsController {
  constructor(private readonly formElementsService: FormElementsService) {}

  @Get()
  @RequirePermission('form_element:read')
  @ApiOperation({
    summary: 'Get all form elements',
    description: 'Retrieve all form elements for the current tenant. System elements (project_id = NULL) are available to all projects. Requires form_element:read permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of form elements',
  })
  async getFormElements(@TenantId() tenantId: string) {
    return this.formElementsService.getFormElements(tenantId);
  }

  @Get(':id')
  @RequirePermission('form_element:read')
  @ApiOperation({
    summary: 'Get a form element by ID',
    description: 'Retrieve a single form element. Requires form_element:read permission.',
  })
  @ApiParam({ name: 'id', description: 'Form element ID' })
  @ApiResponse({
    status: 200,
    description: 'Form element details',
  })
  @ApiResponse({ status: 404, description: 'Form element not found' })
  async getFormElementById(
    @TenantId() tenantId: string,
    @Param('id') formElementId: string,
  ) {
    return this.formElementsService.getFormElementById(tenantId, formElementId);
  }

  @Post()
  @RequirePermission('form_element:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new form element',
    description: 'Create a new custom form element. System elements are seeded. Requires form_element:create permission.',
  })
  @ApiResponse({
    status: 201,
    description: 'Form element created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate key' })
  async createFormElement(
    @TenantId() tenantId: string,
    @Body() createDto: CreateFormElementDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.formElementsService.createFormElement(tenantId, createDto, user?.userId);
  }

  @Put(':id')
  @RequirePermission('form_element:update')
  @ApiOperation({
    summary: 'Update a form element',
    description: 'Update a form element. System elements can only have is_active modified. Requires form_element:update permission.',
  })
  @ApiParam({ name: 'id', description: 'Form element ID' })
  @ApiResponse({
    status: 200,
    description: 'Form element updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Form element not found' })
  @ApiResponse({ status: 400, description: 'Cannot modify system element' })
  async updateFormElement(
    @TenantId() tenantId: string,
    @Param('id') formElementId: string,
    @Body() updateDto: UpdateFormElementDto,
  ) {
    return this.formElementsService.updateFormElement(tenantId, formElementId, updateDto);
  }

  @Delete(':id')
  @RequirePermission('form_element:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a form element',
    description: 'Delete a custom form element. System elements cannot be deleted. Requires form_element:delete permission.',
  })
  @ApiParam({ name: 'id', description: 'Form element ID' })
  @ApiResponse({
    status: 200,
    description: 'Form element deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Form element not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete system element or element in use' })
  async deleteFormElement(
    @TenantId() tenantId: string,
    @Param('id') formElementId: string,
  ) {
    return this.formElementsService.deleteFormElement(tenantId, formElementId);
  }
}
