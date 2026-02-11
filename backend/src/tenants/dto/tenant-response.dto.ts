import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { tenants_status } from '@prisma/client';

export class TenantResponseDto {
  @ApiProperty({
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Parent tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  parentId?: string | null;

  @ApiProperty({
    description: 'Tenant name',
    example: 'Acme Corporation',
  })
  name: string;

  @ApiProperty({
    description: 'Tenant slug',
    example: 'acme-corp',
  })
  slug: string;

  @ApiProperty({
    description: 'Tenant database name',
    example: 'cms_tenant_acme_corp',
  })
  dbName: string;

  @ApiPropertyOptional({
    description: 'Database host',
    example: 'localhost',
  })
  dbHost?: string | null;

  @ApiPropertyOptional({
    description: 'Database connection string',
  })
  dbConnection?: string | null;

  @ApiProperty({
    description: 'Tenant status',
    enum: tenants_status,
    example: tenants_status.active,
  })
  status: tenants_status;

  @ApiPropertyOptional({
    description: 'Tenant configuration',
    example: { theme: 'default', language: 'en' },
  })
  config?: any;

  @ApiPropertyOptional({
    description: 'Feature flags',
    example: { analytics: true, advancedSearch: false },
  })
  featureFlags?: any;

  @ApiPropertyOptional({
    description: 'Usage limits',
    example: { storage: 1000, apiCalls: 10000, users: 50 },
  })
  usageLimits?: any;

  @ApiPropertyOptional({
    description: 'Storage used (in bytes)',
    example: '0',
  })
  storageUsed?: string | null;

  @ApiPropertyOptional({
    description: 'Storage limit (in bytes)',
    example: '1073741824',
  })
  storageLimit?: string | null;

  @ApiPropertyOptional({
    description: 'API calls today',
    example: 0,
  })
  apiCallsToday?: number | null;

  @ApiPropertyOptional({
    description: 'API calls limit',
    example: 10000,
  })
  apiCallsLimit?: number | null;

  @ApiPropertyOptional({
    description: 'Users count',
    example: 5,
  })
  usersCount?: number | null;

  @ApiPropertyOptional({
    description: 'Users limit',
    example: 50,
  })
  usersLimit?: number | null;

  @ApiPropertyOptional({
    description: 'Last activity timestamp',
    example: '2026-02-11T10:00:00.000Z',
  })
  lastActivityAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Provisioned timestamp',
    example: '2026-02-11T10:00:00.000Z',
  })
  provisionedAt?: Date | null;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2026-02-11T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated timestamp',
    example: '2026-02-11T10:00:00.000Z',
  })
  updatedAt: Date;
}
