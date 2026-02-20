import { Module } from '@nestjs/common';
import { ContentNodesService } from './content-nodes.service';
import { ContentNodesController } from './content-nodes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { CollectionsModule } from '../collections/collections.module';

@Module({
  imports: [PrismaModule, PermissionsModule, CollectionsModule],
  controllers: [ContentNodesController],
  providers: [ContentNodesService],
  exports: [ContentNodesService],
})
export class ContentNodesModule {}
