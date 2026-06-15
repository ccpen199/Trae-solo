import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { JwtConfig } from '../../config/configuration';

export interface RefreshJwtPayload {
  sub: string;
  username: string;
  type: 'access' | 'refresh';
  permissions?: string[];
  roles?: string[];
}

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'refresh-jwt') {
  constructor(configService: ConfigService) {
    const jwtConfig = configService.get<JwtConfig>('jwt');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig?.refreshTokenSecret || 'nx_gov_jwt_refresh_secret_key_2024',
    });
  }

  validate(payload: RefreshJwtPayload): RefreshJwtPayload {
    return {
      sub: payload.sub,
      username: payload.username,
      type: payload.type || 'refresh',
      permissions: payload.permissions || [],
      roles: payload.roles || [],
    };
  }
}
