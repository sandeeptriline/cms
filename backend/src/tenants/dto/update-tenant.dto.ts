import { PartialType } from '@nestjs/swagger';
import { CreateTenantDto } from './create-tenant.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { tenants_status } from '@prisma/client';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @ApiPropertyOptional({
    description: 'Tenant status',
    enum: tenants_status,
    example: tenants_status.active,
  })
  @IsOptional()
  @IsEnum(tenants_status)
  status?: tenants_status;
}
