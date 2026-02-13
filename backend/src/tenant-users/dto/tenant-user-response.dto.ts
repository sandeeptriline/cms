import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TenantUserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'User name',
    example: 'John Doe',
  })
  name?: string | null;

  @ApiProperty({
    description: 'User status: 1 = active, 0 = inactive, -1 = deleted',
    example: 1,
  })
  status: number;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  avatar?: string | null;

  @ApiProperty({
    description: 'Tenant ID this user belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  tenantId: string;

  @ApiProperty({
    description: 'Tenant name',
    example: 'Acme Corporation',
  })
  tenantName: string;

  @ApiProperty({
    description: 'Tenant slug',
    example: 'acme-corporation',
  })
  tenantSlug: string;

  @ApiPropertyOptional({
    description: 'User roles',
    example: ['Admin', 'Editor'],
    type: [String],
  })
  roles?: string[];

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
