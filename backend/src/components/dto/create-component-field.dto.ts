import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateComponentFieldDto {
  @ApiProperty({ description: 'Field name (API key)', example: 'title' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Field type', example: 'string' })
  @IsString()
  @MaxLength(100)
  type: string;

  @ApiPropertyOptional({ description: 'Is required', default: false })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional({ description: 'Field config (JSON)' })
  @IsOptional()
  config?: Record<string, any>;
}
