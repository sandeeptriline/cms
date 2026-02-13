import { IsString, IsOptional, IsBoolean, IsNumber, IsObject, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFormElementDto {
  @ApiPropertyOptional({ description: 'Display name', example: 'Text' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Category grouping', example: 'basic' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({ description: 'Icon name', example: 'Aa' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ description: 'Icon color', example: '#4CAF50' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  icon_color?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Small or long text like title or description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Interface configuration JSON', example: { component: 'input', type: 'text' } })
  @IsObject()
  @IsOptional()
  interface?: any;

  @ApiPropertyOptional({ description: 'Available variants JSON', example: [{ key: 'short', name: 'Short text' }] })
  @IsOptional()
  variants?: any;

  @ApiPropertyOptional({ description: 'Default variant key', example: 'short' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  default_variant?: string;

  @ApiPropertyOptional({ description: 'Validation rules JSON', example: { minLength: 0, maxLength: 255 } })
  @IsOptional()
  validation_rules?: any;

  @ApiPropertyOptional({ description: 'Default settings JSON', example: { required: false, unique: false } })
  @IsOptional()
  default_settings?: any;

  @ApiPropertyOptional({ description: 'Available settings array JSON', example: ['required', 'unique', 'private'] })
  @IsOptional()
  available_settings?: any;

  @ApiPropertyOptional({ description: 'Supports conditional logic', example: true })
  @IsBoolean()
  @IsOptional()
  supports_conditions?: boolean;

  @ApiPropertyOptional({ description: 'Supports translations', example: true })
  @IsBoolean()
  @IsOptional()
  supports_translations?: boolean;

  @ApiPropertyOptional({ description: 'Supports relations', example: false })
  @IsBoolean()
  @IsOptional()
  supports_relations?: boolean;

  @ApiPropertyOptional({ description: 'Is system element (cannot delete)', example: true })
  @IsBoolean()
  @IsOptional()
  is_system?: boolean;

  @ApiPropertyOptional({ description: 'Is active', example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Sort order', example: 1 })
  @IsNumber()
  @IsOptional()
  sort_order?: number;
}
