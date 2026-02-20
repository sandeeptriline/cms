import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtRefreshPayload {
  sub: string; // user id
  email: string;
  tenantId: string | null; // Can be null for Super Admin
  roles?: string[]; // User roles (for validation)
  tokenId: string; // refresh token ID
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') || 'your-refresh-secret',
    });
  }

  async validate(payload: JwtRefreshPayload) {
    if (!payload.sub || !payload.email || !payload.tokenId) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    if (payload.tenantId === null || payload.tenantId === undefined) {
      const isSuperAdmin = payload.roles?.some((r: string) =>
        ['Super Admin', 'super_admin'].includes(r),
      );
      if (!isSuperAdmin) {
        throw new UnauthorizedException('Invalid refresh token payload: tenantId required for non-Super Admin users');
      }
    }

    return {
      userId: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId, // Can be null for Super Admin
      tokenId: payload.tokenId,
    };
  }
}
