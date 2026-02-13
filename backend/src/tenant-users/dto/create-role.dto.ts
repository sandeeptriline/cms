import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Role name',
    example: 'Content Manager',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'Role name is required' })
  @MaxLength(50, { message: 'Role name must be at most 50 characters' })
  name: string;

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
