import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlatformUserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'admin@platform.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'User full name',
    example: 'Super Admin',
  })
  name?: string | null;

  @ApiProperty({
    description: 'User status: 1 = active, 0 = inactive',
    example: 1,
  })
  status: number;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  avatar?: string | null;

  @ApiProperty({
    description: 'User roles (should be ["Super Admin"])',
    example: ['Super Admin'],
    type: [String],
  })
  roles: string[];

  @ApiPropertyOptional({
    description: 'Last login timestamp',
    example: '2026-02-12T10:00:00Z',
  })
  lastLoginAt?: Date | null;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2026-02-12T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated timestamp',
    example: '2026-02-12T10:00:00Z',
  })
  updatedAt: Date;
}
