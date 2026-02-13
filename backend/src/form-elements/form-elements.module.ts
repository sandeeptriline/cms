import { Module } from '@nestjs/common';
import { FormElementsController } from './form-elements.controller';
import { FormElementsService } from './form-elements.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [PrismaModule, PermissionsModule],
  controllers: [FormElementsController],
  providers: [FormElementsService],
  exports: [FormElementsService],
})
export class FormElementsModule {}
