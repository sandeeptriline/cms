import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiPropertyOptional({
    description: 'Role name',
    example: 'Content Manager',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Role name must be at most 50 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Manages content creation and editing',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Description must be at most 255 characters' })
  description?: string;
}
