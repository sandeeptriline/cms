import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEntryDto {
  @ApiPropertyOptional({ description: 'Field values as key-value pairs (partial updates)', example: { title: 'Updated Title' } })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Entry status', example: 'published', enum: ['draft', 'review', 'approved', 'published'] })
  @IsEnum(['draft', 'review', 'approved', 'published'])
  @IsOptional()
  status?: 'draft' | 'review' | 'approved' | 'published';

  @ApiPropertyOptional({ description: 'Entry title', example: 'Updated Entry Title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Entry slug', example: 'updated-entry-title' })
  @IsString()
  @IsOptional()
  slug?: string;
}
