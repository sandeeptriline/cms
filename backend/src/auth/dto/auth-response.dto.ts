import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'User full name',
    example: 'John Doe',
  })
  name?: string | null;

  @ApiPropertyOptional({
    description: 'User roles',
    example: ['admin', 'editor'],
    type: [String],
  })
  roles?: string[];

  @ApiPropertyOptional({
    description: 'Tenant ID (RETURNED in response only - NOT required for login). This is informational metadata indicating which tenant the user belongs to. null for Super Admin, tenant UUID for tenant users. Login only requires email and password.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  tenantId?: string | null;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

export class UserMeResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'Tenant ID (RETURNED in response only - NOT required for login). null for Super Admin, tenant UUID for tenant users.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  tenantId: string | null;

  @ApiPropertyOptional({
    description: 'User roles',
    example: ['admin', 'editor'],
    type: [String],
  })
  roles?: string[];
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Logout message',
    example: 'Logged out successfully',
  })
  message: string;
}
