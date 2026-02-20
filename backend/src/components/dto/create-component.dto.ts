import { IsString, IsOptional, IsArray, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateComponentFieldDto {
  @ApiProperty({ description: 'Field name', example: 'title' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Field type', example: 'string' })
  @IsString()
  @MaxLength(100)
  type: string;

  @ApiPropertyOptional({ description: 'Field config (JSON)' })
  @IsOptional()
  config?: Record<string, any>;
}

export class CreateComponentDto {
  @ApiProperty({ description: 'Project ID' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'Component name', example: 'SEO Block' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Component slug (unique per project)', example: 'seo_block' })
  @IsString()
  @MaxLength(255)
  slug: string;

  @ApiPropertyOptional({ description: 'Config (JSON)' })
  @IsOptional()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Initial fields' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateComponentFieldDto)
  fields?: CreateComponentFieldDto[];
}
