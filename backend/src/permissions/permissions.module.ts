import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { TenantPermissionsService } from './tenant-permissions.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PermissionsService, TenantPermissionsService],
  exports: [PermissionsService, TenantPermissionsService],
})
export class PermissionsModule {}
