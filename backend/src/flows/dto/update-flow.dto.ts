import { IsString, IsOptional, IsObject, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFlowDto {
  @ApiPropertyOptional({ description: 'Flow name', example: 'Updated Flow Name' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Flow icon', example: 'workflow' })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  icon?: string;

  @ApiPropertyOptional({ description: 'Flow color', example: '#6644FF' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  color?: string;

  @ApiPropertyOptional({ description: 'Flow description', example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Flow status', example: 'active', enum: ['active', 'inactive'] })
  @IsString()
  @IsOptional()
  @MaxLength(16)
  status?: string;

  @ApiPropertyOptional({ description: 'Flow trigger type', example: 'manual', enum: ['manual', 'webhook', 'event', 'schedule', 'operation'] })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  trigger?: string;

  @ApiPropertyOptional({ description: 'Accountability setting', example: 'all' })
  @IsString()
  @IsOptional()
  @MaxLength(16)
  accountability?: string;

  @ApiPropertyOptional({ description: 'Trigger-specific configuration options', example: {} })
  @IsObject()
  @IsOptional()
  options?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Root operation node ID', example: '389a0749-434d-49e6-9b05-7173dd086afe' })
  @IsString()
  @IsOptional()
  operation?: string;
}
