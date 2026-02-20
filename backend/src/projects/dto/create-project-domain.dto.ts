import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateProjectDomainDto {
  @IsString()
  primary_domain: string;

  @IsString()
  api_domain: string;

  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;
}
