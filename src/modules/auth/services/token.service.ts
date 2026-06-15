import { Injectable, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { JwtConfig } from '../../../config/configuration';
import { IORedisKey } from '../auth.module';

export interface JwtPayload {
  sub: string;
  username: string;
  userType: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly jwtConfig: JwtConfig;
  private readonly BLACKLIST_PREFIX = 'token:blacklist:';
  private readonly REFRESH_TOKEN_PREFIX = 'token:refresh:';

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(IORedisKey) private readonly redis: Redis,
  ) {
    this.jwtConfig = this.configService.get<JwtConfig>('jwt')!;
  }

  async generateTokenPair(payload: Pick<JwtPayload, 'sub' | 'username' | 'userType'>): Promise<TokenPair> {
    const jti = this.generateJti();

    const accessTokenPayload: JwtPayload = {
      ...payload,
      jti,
    };

    const refreshTokenPayload: JwtPayload = {
      ...payload,
      jti: `refresh_${jti}`,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.jwtConfig.accessTokenSecret,
        expiresIn: this.jwtConfig.accessTokenExpiresIn,
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: this.jwtConfig.refreshTokenSecret,
        expiresIn: this.jwtConfig.refreshTokenExpiresIn,
      }),
    ]);

    const accessTokenExpiresIn = this.parseExpiresIn(this.jwtConfig.accessTokenExpiresIn);
    const refreshTokenExpiresIn = this.parseExpiresIn(this.jwtConfig.refreshTokenExpiresIn);

    await this.redis.setex(
      `${this.REFRESH_TOKEN_PREFIX}${payload.sub}`,
      refreshTokenExpiresIn,
      refreshToken,
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    };
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.jwtConfig.accessTokenSecret,
      });

      await this.checkBlacklist('access', payload.jti!);

      return payload;
    } catch (error) {
      this.logger.warn(`Access token 验证失败: ${error.message}`);
      throw new UnauthorizedException('访问令牌无效或已过期');
    }
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.jwtConfig.refreshTokenSecret,
      });

      await this.checkBlacklist('refresh', payload.jti!);

      const storedToken = await this.redis.get(`${this.REFRESH_TOKEN_PREFIX}${payload.sub}`);
      if (storedToken !== token) {
        throw new UnauthorizedException('刷新令牌已失效，请重新登录');
      }

      return payload;
    } catch (error) {
      this.logger.warn(`Refresh token 验证失败: ${error.message}`);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken);

    const newJti = this.generateJti();
    const newAccessTokenPayload: JwtPayload = {
      sub: payload.sub,
      username: payload.username,
      userType: payload.userType,
      jti: newJti,
    };

    const newRefreshTokenPayload: JwtPayload = {
      sub: payload.sub,
      username: payload.username,
      userType: payload.userType,
      jti: `refresh_${newJti}`,
    };

    const [newAccessToken, newRefreshToken] = await Promise.all([
      this.jwtService.signAsync(newAccessTokenPayload, {
        secret: this.jwtConfig.accessTokenSecret,
        expiresIn: this.jwtConfig.accessTokenExpiresIn,
      }),
      this.jwtService.signAsync(newRefreshTokenPayload, {
        secret: this.jwtConfig.refreshTokenSecret,
        expiresIn: this.jwtConfig.refreshTokenExpiresIn,
      }),
    ]);

    const accessTokenExpiresIn = this.parseExpiresIn(this.jwtConfig.accessTokenExpiresIn);
    const refreshTokenExpiresIn = this.parseExpiresIn(this.jwtConfig.refreshTokenExpiresIn);

    await this.addToBlacklist('refresh', payload.jti!, refreshTokenExpiresIn);

    await this.redis.setex(
      `${this.REFRESH_TOKEN_PREFIX}${payload.sub}`,
      refreshTokenExpiresIn,
      newRefreshToken,
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    };
  }

  async revokeTokens(userId: string, accessTokenJti?: string, refreshToken?: string): Promise<void> {
    const accessTokenExpiresIn = this.parseExpiresIn(this.jwtConfig.accessTokenExpiresIn);
    const refreshTokenExpiresIn = this.parseExpiresIn(this.jwtConfig.refreshTokenExpiresIn);

    if (accessTokenJti) {
      await this.addToBlacklist('access', accessTokenJti, accessTokenExpiresIn);
    }

    if (refreshToken) {
      try {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
          secret: this.jwtConfig.refreshTokenSecret,
        });
        await this.addToBlacklist('refresh', payload.jti!, refreshTokenExpiresIn);
      } catch (e) {
        // ignore invalid token
      }
    }

    await this.redis.del(`${this.REFRESH_TOKEN_PREFIX}${userId}`);
  }

  private async addToBlacklist(type: 'access' | 'refresh', jti: string, ttl: number): Promise<void> {
    await this.redis.setex(`${this.BLACKLIST_PREFIX}${type}:${jti}`, ttl, '1');
  }

  private async checkBlacklist(type: 'access' | 'refresh', jti: string): Promise<void> {
    const exists = await this.redis.exists(`${this.BLACKLIST_PREFIX}${type}:${jti}`);
    if (exists) {
      throw new UnauthorizedException('令牌已被吊销，请重新登录');
    }
  }

  private generateJti(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhdw])$/);
    if (!match) return 7200;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
      w: 604800,
    };

    return value * (multipliers[unit] || 3600);
  }
}
