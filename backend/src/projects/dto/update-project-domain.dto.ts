import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateProjectDomainDto {
  @IsString()
  @IsOptional()
  primary_domain?: string;

  @IsString()
  @IsOptional()
  api_domain?: string;

  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;
}
