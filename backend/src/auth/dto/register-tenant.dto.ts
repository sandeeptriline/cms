import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterTenantDto {
  @ApiProperty({
    description: 'Organization / tenant name',
    example: 'Acme Corp',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'URL-friendly tenant slug (lowercase, numbers, hyphens)',
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

  @ApiProperty({
    description: 'Admin email (used for platform identity and tenant login)',
    example: 'admin@acme.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Admin password (min 6 characters)',
    example: 'SecurePassword123!',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @ApiPropertyOptional({
    description: 'Admin display name',
    example: 'Jane Doe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  adminName?: string;
}
