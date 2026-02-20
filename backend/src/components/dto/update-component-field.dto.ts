import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateComponentFieldDto {
  @ApiPropertyOptional({ description: 'Field name (API key)', example: 'title' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Field type', example: 'string' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Is required' })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional({ description: 'Field config (JSON)' })
  @IsOptional()
  config?: Record<string, any>;
}
