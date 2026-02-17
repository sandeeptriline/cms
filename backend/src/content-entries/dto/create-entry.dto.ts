import { IsString, IsNotEmpty, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEntryDto {
  @ApiProperty({ description: 'Content Type ID (required)', example: '389a0749-434d-49e6-9b05-7173dd086afe' })
  @IsString()
  @IsNotEmpty()
  contentTypeId: string;

  @ApiProperty({ description: 'Field values as key-value pairs', example: { title: 'My Entry', content: 'Entry content' } })
  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;

  @ApiPropertyOptional({ description: 'Entry status', example: 'draft', enum: ['draft', 'review'] })
  @IsEnum(['draft', 'review'])
  @IsOptional()
  status?: 'draft' | 'review';

  @ApiPropertyOptional({ description: 'Entry title (auto-extracted if not provided)', example: 'My Entry Title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Entry slug (auto-generated from title if not provided)', example: 'my-entry-title' })
  @IsString()
  @IsOptional()
  slug?: string;
}
