import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlatformUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'admin@platform.com',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiPropertyOptional({
    description: 'User full name',
    example: 'Platform Admin',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'User status: 1 = active, 0 = inactive',
    example: 1,
    enum: [1, 0],
    default: 1,
  })
  @IsOptional()
  status?: number;

  @ApiPropertyOptional({
    description: 'Array of role IDs to assign to the user',
    example: ['role-id-1', 'role-id-2'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  roleIds?: string[];
}
