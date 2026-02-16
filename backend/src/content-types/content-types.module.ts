import { Module } from '@nestjs/common';
import { ContentTypesController } from './content-types.controller';
import { DataModelsService } from './data-models.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [PrismaModule, PermissionsModule],
  controllers: [ContentTypesController],
  providers: [DataModelsService],
  exports: [DataModelsService],
})
export class ContentTypesModule {}
