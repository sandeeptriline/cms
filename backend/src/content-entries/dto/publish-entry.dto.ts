import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PublishEntryDto {
  @ApiPropertyOptional({ description: 'Scheduled publish date/time (immediate if not provided)', example: '2026-02-20T10:00:00Z' })
  @IsDateString()
  @IsOptional()
  publishAt?: Date;

  @ApiPropertyOptional({ description: 'Scheduled unpublish date/time', example: '2026-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  unpublishAt?: Date;
}
