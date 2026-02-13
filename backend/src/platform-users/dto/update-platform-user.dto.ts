import { IsEmail, IsOptional, IsString, MinLength, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePlatformUserDto {
  @ApiPropertyOptional({
    description: 'User email address',
    example: 'admin@platform.com',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsOptional()
  email?: string;

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
  })
  @IsOptional()
  status?: number;

  @ApiPropertyOptional({
    description: 'Array of role IDs to assign to the user. If provided, replaces all existing roles.',
    example: ['role-id-1', 'role-id-2'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  roleIds?: string[];
}

export class ChangePasswordDto {
  @ApiPropertyOptional({
    description: 'Current password (required for verification)',
    example: 'CurrentPassword123!',
  })
  @IsString()
  @IsOptional()
  currentPassword?: string;

  @ApiPropertyOptional({
    description: 'New password (minimum 8 characters)',
    example: 'NewSecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  newPassword: string;
}
