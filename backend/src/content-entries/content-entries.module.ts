import { Module } from '@nestjs/common';
import { ContentEntriesController } from './content-entries.controller';
import { ContentEntriesService } from './content-entries.service';
import { FieldValidatorService } from './validators/field-validator.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ContentTypesModule } from '../content-types/content-types.module';

@Module({
  imports: [PrismaModule, ContentTypesModule],
  controllers: [ContentEntriesController],
  providers: [ContentEntriesService, FieldValidatorService],
  exports: [ContentEntriesService, FieldValidatorService],
})
export class ContentEntriesModule {}
