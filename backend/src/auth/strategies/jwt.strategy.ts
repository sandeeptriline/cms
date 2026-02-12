import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  tenantId: string | null; // Can be null for Super Admin
  roles?: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Try to extract from Bearer token first
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Fallback to cookie
        (request: Request) => {
          return request?.cookies?.access_token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // tenantId can be null for Super Admin
    // For tenant users, tenantId must be present
    if (payload.tenantId === null || payload.tenantId === undefined) {
      // Only allow null tenantId for Super Admin
      if (!payload.roles || !payload.roles.includes('Super Admin')) {
        throw new UnauthorizedException('Invalid token payload: tenantId required for non-Super Admin users');
      }
    }

    return {
      userId: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId, // Can be null for Super Admin
      roles: payload.roles || [],
    };
  }
}
