import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { JwtConfig } from '../../config/configuration';

export interface JwtPayload {
  sub: string;
  username: string;
  type: 'access' | 'refresh';
  permissions?: string[];
  roles?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const jwtConfig = configService.get<JwtConfig>('jwt');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig?.accessTokenSecret || 'nx_gov_jwt_access_secret_key_2024',
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return {
      sub: payload.sub,
      username: payload.username,
      type: payload.type || 'access',
      permissions: payload.permissions || [],
      roles: payload.roles || [],
    };
  }
}
