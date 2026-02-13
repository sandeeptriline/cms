import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { TenantsModule } from './tenants/tenants.module';
import { AuthModule } from './auth/auth.module';
import { PermissionsModule } from './permissions/permissions.module';
import { TenantUsersModule } from './tenant-users/tenant-users.module';
import { PlatformUsersModule } from './platform-users/platform-users.module';
import { ContentTypesModule } from './content-types/content-types.module';
import { FormElementsModule } from './form-elements/form-elements.module';

@Module({
  imports: [
    PrismaModule,
    TenantsModule,
    AuthModule,
    PermissionsModule,
    TenantUsersModule,
    PlatformUsersModule,
    ContentTypesModule,
    FormElementsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
