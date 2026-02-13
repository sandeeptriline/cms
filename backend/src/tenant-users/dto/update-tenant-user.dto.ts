import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTenantUserDto {
  @ApiPropertyOptional({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'User password (minimum 6 characters)',
    example: 'NewSecurePassword123!',
    minLength: 6,
  })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password?: string;

  @ApiPropertyOptional({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'User status: 1 = active, 0 = inactive, -1 = deleted',
    example: 1,
    enum: [1, 0, -1],
  })
  @IsOptional()
  status?: number;

  @ApiPropertyOptional({
    description: 'Array of role IDs to assign to the user. If provided, replaces all existing roles.',
    example: ['role-id-1', 'role-id-2'],
    type: [String],
  })
  @IsOptional()
  roleIds?: string[];
}
