import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FieldResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  field: string;

  @ApiProperty()
  type: string;

  @ApiPropertyOptional()
  interface?: string;

  @ApiPropertyOptional()
  options?: any;

  @ApiPropertyOptional()
  validation?: any;

  @ApiProperty()
  required: boolean;

  @ApiProperty()
  hidden: boolean;

  @ApiProperty()
  readonly: boolean;

  @ApiPropertyOptional()
  sort?: number;

  @ApiPropertyOptional()
  note?: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class ContentTypeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  project_id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  collection: string;

  @ApiPropertyOptional()
  icon?: string;

  @ApiProperty()
  is_system: boolean;

  @ApiProperty()
  singleton: boolean;

  @ApiPropertyOptional()
  note?: string;

  @ApiProperty()
  hidden: boolean;

  @ApiPropertyOptional({ type: [FieldResponseDto] })
  fields?: FieldResponseDto[];

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
