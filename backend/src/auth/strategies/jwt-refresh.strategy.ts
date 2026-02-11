import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtRefreshPayload {
  sub: string; // user id
  email: string;
  tenantId: string;
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
    if (!payload.sub || !payload.email || !payload.tenantId || !payload.tokenId) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      tokenId: payload.tokenId,
    };
  }
}
