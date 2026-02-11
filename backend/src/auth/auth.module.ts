import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    ConfigModule, // Add ConfigModule for ConfigService injection
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN', '7d');
        return {
          secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
          signOptions: {
            expiresIn: expiresIn as any, // StringValue type from jsonwebtoken is complex, using any for compatibility
          },
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    TenantsModule, // For TenantGuard
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    TenantPrismaService,
  ],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
