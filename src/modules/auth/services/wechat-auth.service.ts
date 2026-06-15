import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { nanoid } from 'nanoid';
import Redis from 'ioredis';
import { WechatConfig } from '../../../config/configuration';
import { IORedisKey } from '../auth.module';
import { ThirdPartyAccount, ThirdPartyPlatform } from '../entities/third-party-account.entity';
import { User, UserType } from '../entities/user.entity';
import { Sm4Util } from '../../../common/utils/sm4.util';

export type WechatQrStatus = 'pending' | 'scanned' | 'confirmed' | 'expired';

export interface WechatQrResult {
  scene: string;
  qrUrl: string;
  expiresIn: number;
}

export interface WechatPollResult {
  status: WechatQrStatus;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
}

export interface WechatUserInfo {
  openId: string;
  unionId?: string;
  nickname: string;
  avatar?: string;
  phone?: string;
  rawData: Record<string, unknown>;
}

@Injectable()
export class WechatAuthService {
  private readonly logger = new Logger(WechatAuthService.name);
  private readonly wechatConfig: WechatConfig;
  private readonly QR_SCENE_PREFIX = 'wechat:qr:scene:';
  private readonly QR_EXPIRES = 300;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly sm4Util: Sm4Util,
    @Inject(IORedisKey) private readonly redis: Redis,
    @InjectRepository(ThirdPartyAccount)
    private readonly thirdPartyAccountRepo: Repository<ThirdPartyAccount>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    this.wechatConfig = this.configService.get<WechatConfig>('wechat')!;
  }

  async generateQrCode(): Promise<WechatQrResult> {
    const scene = nanoid(32);
    const qrUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${this.wechatConfig.appId}&redirect_uri=${encodeURIComponent(this.wechatConfig.qrCallback)}&response_type=code&scope=snsapi_login&state=${scene}#wechat_redirect`;

    await this.redis.hset(
      `${this.QR_SCENE_PREFIX}${scene}`,
      {
        status: 'pending',
        createdAt: Date.now().toString(),
      },
    );
    await this.redis.expire(`${this.QR_SCENE_PREFIX}${scene}`, this.QR_EXPIRES);

    this.logger.log(`生成微信扫码二维码: scene=${scene}`);

    return {
      scene,
      qrUrl,
      expiresIn: this.QR_EXPIRES,
    };
  }

  async pollQrStatus(scene: string): Promise<WechatPollResult> {
    const data = await this.redis.hgetall(`${this.QR_SCENE_PREFIX}${scene}`);

    if (!data || !data.status) {
      return { status: 'expired' };
    }

    const status = data.status as WechatQrStatus;
    const createdAt = parseInt(data.createdAt || '0', 10);

    if (Date.now() - createdAt > this.QR_EXPIRES * 1000) {
      await this.redis.del(`${this.QR_SCENE_PREFIX}${scene}`);
      return { status: 'expired' };
    }

    const result: WechatPollResult = { status };
    if (status === 'confirmed') {
      result.accessToken = data.accessToken;
      result.refreshToken = data.refreshToken;
      result.userId = data.userId;
    }

    return result;
  }

  async clearSceneData(scene: string): Promise<void> {
    await this.redis.del(`${this.QR_SCENE_PREFIX}${scene}`);
  }

  async handleCallback(code: string, state: string): Promise<void> {
    const sceneKey = `${this.QR_SCENE_PREFIX}${state}`;
    const exists = await this.redis.exists(sceneKey);

    if (!exists) {
      this.logger.warn(`微信回调场景值不存在: state=${state}`);
      return;
    }

    try {
      await this.redis.hset(sceneKey, { status: 'scanned' });

      const userInfo = await this.exchangeCodeForUserInfo(code);
      const { user } = await this.findOrCreateUser(userInfo);

      const { TokenService } = require('./token.service');

      await this.redis.hset(sceneKey, {
        status: 'confirmed',
        userId: user.id,
      });

      this.logger.log(`微信扫码登录成功: userId=${user.id}, scene=${state}`);
    } catch (error) {
      this.logger.error(`微信回调处理失败: ${error.message}`);
      await this.redis.hset(sceneKey, { status: 'expired' });
    }
  }

  async loginWithCode(code: string): Promise<{ user: User; isNew: boolean }> {
    const userInfo = await this.exchangeCodeForUserInfo(code);
    return this.findOrCreateUser(userInfo);
  }

  private async exchangeCodeForUserInfo(code: string): Promise<WechatUserInfo> {
    try {
      this.logger.log(`开始通过code换取微信用户信息`);

      const tokenUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token';
      const tokenResponse = await firstValueFrom(
        this.httpService.get(tokenUrl, {
          params: {
            appid: this.wechatConfig.appId,
            secret: this.wechatConfig.appSecret,
            code,
            grant_type: 'authorization_code',
          },
        }),
      );

      const {
        access_token: accessToken,
        openid: openId,
        unionid: unionId,
        refresh_token: refreshToken,
        expires_in: expiresIn,
      } = tokenResponse.data;

      if (tokenResponse.data.errcode) {
        throw new Error(tokenResponse.data.errmsg || '微信获取token失败');
      }

      const userInfoUrl = 'https://api.weixin.qq.com/sns/userinfo';
      const userInfoResponse = await firstValueFrom(
        this.httpService.get(userInfoUrl, {
          params: {
            access_token: accessToken,
            openid: openId,
            lang: 'zh_CN',
          },
        }),
      );

      const data = userInfoResponse.data;

      if (data.errcode) {
        throw new Error(data.errmsg || '微信获取用户信息失败');
      }

      let thirdPartyAccount = await this.thirdPartyAccountRepo.findOne({
        where: { platform: 'wechat' as ThirdPartyPlatform, openId },
      });

      if (thirdPartyAccount) {
        thirdPartyAccount.accessToken = accessToken;
        thirdPartyAccount.refreshToken = refreshToken;
        thirdPartyAccount.expiresAt = new Date(Date.now() + expiresIn * 1000);
        thirdPartyAccount.rawUserInfo = data;
        await this.thirdPartyAccountRepo.save(thirdPartyAccount);
      }

      return {
        openId,
        unionId,
        nickname: data.nickname,
        avatar: data.headimgurl,
        phone: data.phone,
        rawData: data,
      };
    } catch (error) {
      this.logger.error(`微信用户信息获取失败: ${error.message}`);

      if (process.env.NODE_ENV === 'development') {
        return this.generateMockUserInfo(code);
      }

      throw new HttpException('微信认证失败，请稍后重试', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  private generateMockUserInfo(code: string): WechatUserInfo {
    this.logger.warn('使用模拟数据进行微信认证（开发环境）');
    return {
      openId: `wx_open_${code}_${Date.now()}`,
      unionId: `wx_union_${Date.now()}`,
      nickname: '微信用户',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wechat',
      phone: `138${Math.floor(10000000 + Math.random() * 90000000)}`,
      rawData: { mock: true, code },
    };
  }

  private async findOrCreateUser(userInfo: WechatUserInfo): Promise<{ user: User; isNew: boolean }> {
    let thirdPartyAccount = await this.thirdPartyAccountRepo.findOne({
      where: { platform: 'wechat' as ThirdPartyPlatform, openId: userInfo.openId },
      relations: ['user'],
    });

    if (thirdPartyAccount?.user) {
      return { user: thirdPartyAccount.user, isNew: false };
    }

    let user = thirdPartyAccount?.user;
    let isNew = false;

    if (!user) {
      if (userInfo.phone) {
        user = await this.userRepo
          .createQueryBuilder('u')
          .where('u.phone = :phone', { phone: this.sm4Util.encrypt(userInfo.phone) })
          .getOne();
      }

      if (!user) {
        user = this.userRepo.create({
          username: `wx_${userInfo.openId.substring(0, 20)}`,
          realName: userInfo.nickname,
          phone: userInfo.phone ? this.sm4Util.encrypt(userInfo.phone) : null,
          avatar: userInfo.avatar,
          status: 'active',
          userType: 'natural' as UserType,
        });
        user = await this.userRepo.save(user);
        isNew = true;
        this.logger.log(`创建新微信用户: userId=${user.id}`);
      }

      if (thirdPartyAccount) {
        thirdPartyAccount.userId = user.id;
        thirdPartyAccount.user = user;
      } else {
        thirdPartyAccount = this.thirdPartyAccountRepo.create({
          platform: 'wechat',
          openId: userInfo.openId,
          unionId: userInfo.unionId || null,
          userId: user.id,
          user,
          rawUserInfo: userInfo.rawData,
        });
      }
      await this.thirdPartyAccountRepo.save(thirdPartyAccount);
    }

    return { user, isNew };
  }
}
