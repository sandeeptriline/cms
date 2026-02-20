import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCollectionFieldDto {
  @ApiProperty({ description: 'Field name', example: 'title' })
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
  is_required?: boolean;

  @ApiPropertyOptional({ description: 'Field config (JSON)' })
  @IsOptional()
  config?: Record<string, any>;
}

export class CreateCollectionDto {
  @ApiProperty({ description: 'Project ID' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'Collection name', example: 'Blog Post' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Collection slug (unique per project)', example: 'blog_posts' })
  @IsString()
  @MaxLength(255)
  slug: string;

  @ApiPropertyOptional({ description: 'Dataset ID' })
  @IsString()
  @IsOptional()
  datasetId?: string;

  @ApiPropertyOptional({ description: 'Config (JSON)' })
  @IsOptional()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Initial fields' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCollectionFieldDto)
  @IsOptional()
  fields?: CreateCollectionFieldDto[];
}
