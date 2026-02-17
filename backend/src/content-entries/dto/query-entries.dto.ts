import { IsString, IsOptional, IsNumber, IsArray, Min, Max, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryEntriesDto {
  @ApiPropertyOptional({ description: 'Project ID for scoping', example: '3c1337b1-29f8-421d-91d1-1a332262c4eb' })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Content Type ID for scoping', example: '2711d876-4def-4d2a-b3de-8defbd9cd135' })
  @IsUUID()
  @IsOptional()
  contentTypeId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', example: 'published', enum: ['draft', 'review', 'approved', 'published'] })
  @IsEnum(['draft', 'review', 'approved', 'published'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Full-text search query', example: 'search term' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 25, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort field', example: 'title' })
  @IsString()
  @IsOptional()
  sort?: string;

  @ApiPropertyOptional({ description: 'Sort order', example: 'asc', enum: ['asc', 'desc'] })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Fields to include in response', example: ['id', 'title', 'status'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fields?: string[];
}
