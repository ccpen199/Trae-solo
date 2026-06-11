import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaClient, UserStatus, UserRole } from '@pet/db';
import { generateSmsCode, generateCacheKey } from '@pet/shared/utils';
import { SMS_CODE_CACHE_PREFIX, SMS_CODE_TTL, SMS_CODE_RESEND_INTERVAL, USER_TOKEN_CACHE_PREFIX, USER_REFRESH_TOKEN_CACHE_PREFIX } from '@pet/shared/constants';
import type { JWTPayload } from '@pet/shared/types';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto';

@Injectable()
export class AuthService {
  private readonly prisma: PrismaClient;
  private readonly redis: Map<string, { value: string; expireAt: number }>;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.prisma = new PrismaClient();
    this.redis = new Map();
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async validateUser(phone: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new UnauthorizedException('手机号或密码错误');
    }
    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('账号已被封禁');
    }
    if (user.status === UserStatus.DISABLED) {
      throw new UnauthorizedException('账号已被禁用');
    }
    const isValid = await this.comparePassword(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('手机号或密码错误');
    }
    return user;
  }

  async validateUserById(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('账号状态异常');
    }
    return user;
  }

  async login(dto: LoginDto, ip?: string) {
    const user = await this.validateUser(dto.phone, dto.password);
    const payload: JWTPayload = {
      userId: user.id,
      role: user.role as UserRole,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_TTL', '1h'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_TTL', '7d'),
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    const tokenKey = generateCacheKey(USER_TOKEN_CACHE_PREFIX, user.id);
    const refreshKey = generateCacheKey(USER_REFRESH_TOKEN_CACHE_PREFIX, user.id);

    this.setCache(tokenKey, accessToken, 3600);
    this.setCache(refreshKey, refreshToken, 7 * 24 * 3600);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
      },
    };
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existingUser) {
      throw new ConflictException('手机号已注册');
    }

    const codeKey = generateCacheKey(SMS_CODE_CACHE_PREFIX, dto.phone);
    const cachedCode = this.getCache(codeKey);
    if (!cachedCode || cachedCode !== dto.smsCode) {
      throw new BadRequestException('验证码错误或已过期');
    }

    const hashedPassword = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        password: hashedPassword,
        nickname: dto.nickname,
        isVerified: true,
      },
    });

    this.deleteCache(codeKey);

    return {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
    };
  }

  async sendSmsCode(phone: string) {
    const codeKey = generateCacheKey(SMS_CODE_CACHE_PREFIX, phone);
    const sendKey = `${codeKey}:last_send`;

    const lastSend = this.getCache(sendKey);
    if (lastSend) {
      throw new BadRequestException('发送过于频繁，请稍后再试');
    }

    const code = generateSmsCode();
    this.setCache(codeKey, code, SMS_CODE_TTL);
    this.setCache(sendKey, '1', SMS_CODE_RESEND_INTERVAL);

    return {
      sent: true,
      expireIn: SMS_CODE_TTL,
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify<JWTPayload>(dto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const refreshKey = generateCacheKey(USER_REFRESH_TOKEN_CACHE_PREFIX, payload.userId);
      const cachedToken = this.getCache(refreshKey);
      if (!cachedToken || cachedToken !== dto.refreshToken) {
        throw new UnauthorizedException('刷新令牌无效');
      }

      const user = await this.validateUserById(payload.userId);
      const newPayload: JWTPayload = {
        userId: user.id,
        role: user.role as UserRole,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: this.configService.get<string>('JWT_ACCESS_TTL', '1h'),
      });

      const tokenKey = generateCacheKey(USER_TOKEN_CACHE_PREFIX, user.id);
      this.setCache(tokenKey, accessToken, 3600);

      return {
        accessToken,
      };
    } catch {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  async logout(userId: string) {
    const tokenKey = generateCacheKey(USER_TOKEN_CACHE_PREFIX, userId);
    const refreshKey = generateCacheKey(USER_REFRESH_TOKEN_CACHE_PREFIX, userId);
    this.deleteCache(tokenKey);
    this.deleteCache(refreshKey);
    return { success: true };
  }

  private setCache(key: string, value: string, ttl: number) {
    this.redis.set(key, {
      value,
      expireAt: Date.now() + ttl * 1000,
    });
  }

  private getCache(key: string): string | null {
    const data = this.redis.get(key);
    if (!data || data.expireAt < Date.now()) {
      this.redis.delete(key);
      return null;
    }
    return data.value;
  }

  private deleteCache(key: string) {
    this.redis.delete(key);
  }
}
