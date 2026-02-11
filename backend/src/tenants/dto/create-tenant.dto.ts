import { IsString, IsOptional, IsObject, IsUUID, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Tenant name',
    example: 'Acme Corporation',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Tenant slug (URL-friendly identifier)',
    example: 'acme-corp',
    minLength: 2,
    maxLength: 100,
    pattern: '^[a-z0-9-]+$',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiPropertyOptional({
    description: 'Parent tenant ID (for tenant hierarchy)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Tenant configuration (JSON object)',
    example: { theme: 'default', language: 'en' },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Feature flags for the tenant',
    example: { analytics: true, advancedSearch: false },
  })
  @IsOptional()
  @IsObject()
  featureFlags?: Record<string, boolean>;

  @ApiPropertyOptional({
    description: 'Usage limits for the tenant',
    example: { storage: 1000, apiCalls: 10000, users: 50 },
  })
  @IsOptional()
  @IsObject()
  usageLimits?: {
    storage?: number;
    apiCalls?: number;
    users?: number;
  };
}
