import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFieldDto {
  @ApiPropertyOptional({ description: 'Field name/key (unique within content type)', example: 'title' })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  field?: string;

  @ApiPropertyOptional({ description: 'Field type', example: 'string' })
  @IsString()
  @IsOptional()
  type?: string;

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
