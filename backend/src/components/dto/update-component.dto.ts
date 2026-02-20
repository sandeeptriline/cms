import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateComponentDto {
  @ApiPropertyOptional({ description: 'Component name', example: 'SEO Block' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Component slug (unique per project)', example: 'seo_block' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'Config (JSON)' })
  @IsOptional()
  config?: Record<string, any>;
}
