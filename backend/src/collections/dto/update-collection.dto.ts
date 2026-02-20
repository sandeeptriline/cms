import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCollectionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  slug?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  datasetId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  config?: Record<string, any>;
}

export class UpdateCollectionFieldDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  type?: string;

  @IsBoolean()
  @IsOptional()
  is_required?: boolean;

  @IsOptional()
  config?: Record<string, any>;
}
