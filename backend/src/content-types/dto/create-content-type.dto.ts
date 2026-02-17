import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFieldDto {
  @ApiProperty({ description: 'Field name/key (unique within content type)', example: 'title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  field: string;

  @ApiProperty({ description: 'Field type', example: 'string', enum: ['string', 'text', 'integer', 'float', 'boolean', 'json', 'uuid', 'datetime', 'date', 'time', 'timestamp', 'file', 'files', 'm2o', 'o2m', 'm2m'] })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ description: 'UI interface/widget', example: 'input' })
  @IsString()
  @IsOptional()
  interface?: string;

  @ApiPropertyOptional({ description: 'Field options/configuration', example: { placeholder: 'Enter title' } })
  @IsOptional()
  options?: any;

  @ApiPropertyOptional({ description: 'Validation rules', example: { required: true, minLength: 3 } })
  @IsOptional()
  validation?: any;

  @ApiPropertyOptional({ description: 'Is field required', example: false })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional({ description: 'Is field hidden', example: false })
  @IsBoolean()
  @IsOptional()
  hidden?: boolean;

  @ApiPropertyOptional({ description: 'Is field readonly', example: false })
  @IsBoolean()
  @IsOptional()
  readonly?: boolean;

  @ApiPropertyOptional({ description: 'Sort order', example: 1 })
  @IsOptional()
  sort?: number;

  @ApiPropertyOptional({ description: 'Field note/description', example: 'The main title of the content' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateContentTypeDto {
  @ApiProperty({ description: 'Project ID (required)', example: '389a0749-434d-49e6-9b05-7173dd086afe' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: 'Content type name', example: 'Blog Post' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Collection name (unique identifier)', example: 'blog_posts' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  collection: string;

  @ApiPropertyOptional({ description: 'Icon name', example: 'article' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ description: 'Is singleton (single item per collection)', example: false })
  @IsBoolean()
  @IsOptional()
  singleton?: boolean;

  @ApiPropertyOptional({ description: 'Collection description/note', example: 'Blog posts for the website' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ description: 'Is hidden from sidebar', example: false })
  @IsBoolean()
  @IsOptional()
  hidden?: boolean;

  @ApiPropertyOptional({ description: 'Initial fields for the content type', type: [CreateFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldDto)
  @IsOptional()
  fields?: CreateFieldDto[];
}
