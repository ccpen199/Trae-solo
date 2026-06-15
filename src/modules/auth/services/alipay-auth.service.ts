import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { nanoid } from 'nanoid';
import Redis from 'ioredis';
import { AlipayConfig } from '../../../config/configuration';
import { IORedisKey } from '../auth.module';
import { ThirdPartyAccount, ThirdPartyPlatform } from '../entities/third-party-account.entity';
import { User, UserType } from '../entities/user.entity';
import { Sm4Util } from '../../../common/utils/sm4.util';

export type AlipayQrStatus = 'pending' | 'scanned' | 'confirmed' | 'expired';

export interface AlipayQrResult {
  scene: string;
  qrUrl: string;
  expiresIn: number;
}

export interface AlipayPollResult {
  status: AlipayQrStatus;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
}

export interface AlipayUserInfo {
  openId: string;
  unionId?: string;
  userId?: string;
  realName?: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  rawData: Record<string, unknown>;
}

@Injectable()
export class AlipayAuthService {
  private readonly logger = new Logger(AlipayAuthService.name);
  private readonly alipayConfig: AlipayConfig;
  private readonly QR_SCENE_PREFIX = 'alipay:qr:scene:';
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
    this.alipayConfig = this.configService.get<AlipayConfig>('alipay')!;
  }

  async generateQrCode(): Promise<AlipayQrResult> {
    const scene = nanoid(32);
    const qrUrl = `https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?app_id=${this.alipayConfig.appId}&scope=auth_userinfo&redirect_uri=${encodeURIComponent(this.alipayConfig.qrCallback)}&state=${scene}`;

    await this.redis.hset(
      `${this.QR_SCENE_PREFIX}${scene}`,
      {
        status: 'pending',
        createdAt: Date.now().toString(),
      },
    );
    await this.redis.expire(`${this.QR_SCENE_PREFIX}${scene}`, this.QR_EXPIRES);

    this.logger.log(`生成支付宝扫码二维码: scene=${scene}`);

    return {
      scene,
      qrUrl,
      expiresIn: this.QR_EXPIRES,
    };
  }

  async pollQrStatus(scene: string): Promise<AlipayPollResult> {
    const data = await this.redis.hgetall(`${this.QR_SCENE_PREFIX}${scene}`);

    if (!data || !data.status) {
      return { status: 'expired' };
    }

    const status = data.status as AlipayQrStatus;
    const createdAt = parseInt(data.createdAt || '0', 10);

    if (Date.now() - createdAt > this.QR_EXPIRES * 1000) {
      await this.redis.del(`${this.QR_SCENE_PREFIX}${scene}`);
      return { status: 'expired' };
    }

    const result: AlipayPollResult = { status };
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

  async handleCallback(authCode: string, state: string): Promise<void> {
    const sceneKey = `${this.QR_SCENE_PREFIX}${state}`;
    const exists = await this.redis.exists(sceneKey);

    if (!exists) {
      this.logger.warn(`支付宝回调场景值不存在: state=${state}`);
      return;
    }

    try {
      await this.redis.hset(sceneKey, { status: 'scanned' });

      const userInfo = await this.exchangeCodeForUserInfo(authCode);
      const { user } = await this.findOrCreateUser(userInfo);

      await this.redis.hset(sceneKey, {
        status: 'confirmed',
        userId: user.id,
      });

      this.logger.log(`支付宝扫码登录成功: userId=${user.id}, scene=${state}`);
    } catch (error) {
      this.logger.error(`支付宝回调处理失败: ${error.message}`);
      await this.redis.hset(sceneKey, { status: 'expired' });
    }
  }

  async loginWithAuthCode(authCode: string): Promise<{ user: User; isNew: boolean }> {
    const userInfo = await this.exchangeCodeForUserInfo(authCode);
    return this.findOrCreateUser(userInfo);
  }

  private async exchangeCodeForUserInfo(authCode: string): Promise<AlipayUserInfo> {
    try {
      this.logger.log(`开始通过authCode换取支付宝用户信息`);

      const tokenUrl = 'https://openapi.alipay.com/gateway.do';
      const tokenParams = {
        app_id: this.alipayConfig.appId,
        method: 'alipay.system.oauth.token',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString(),
        version: '1.0',
        grant_type: 'authorization_code',
        code: authCode,
      };

      const signedParams = this.signParams(tokenParams);
      const tokenResponse = await firstValueFrom(this.httpService.post(tokenUrl, null, { params: signedParams }));

      const tokenData = tokenResponse.data?.alipay_system_oauth_token_response;
      if (!tokenData || tokenData.code) {
        throw new Error(tokenData?.msg || '支付宝获取token失败');
      }

      const {
        access_token: accessToken,
        user_id: userId,
        refresh_token: refreshToken,
        expires_in: expiresIn,
      } = tokenData;

      const userInfoParams = {
        app_id: this.alipayConfig.appId,
        method: 'alipay.user.info.share',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString(),
        version: '1.0',
        auth_token: accessToken,
      };

      const signedUserInfoParams = this.signParams(userInfoParams);
      const userInfoResponse = await firstValueFrom(
        this.httpService.post(tokenUrl, null, { params: signedUserInfoParams }),
      );

      const userData = userInfoResponse.data?.alipay_user_info_share_response;
      if (!userData || userData.code) {
        throw new Error(userData?.msg || '支付宝获取用户信息失败');
      }

      return {
        openId: userId || userData.user_id,
        userId: userId,
        realName: userData.real_name,
        nickname: userData.nick_name,
        avatar: userData.avatar,
        phone: userData.phone,
        email: userData.email,
        rawData: { tokenData, userData },
      };
    } catch (error) {
      this.logger.error(`支付宝用户信息获取失败: ${error.message}`);

      if (process.env.NODE_ENV === 'development') {
        return this.generateMockUserInfo(authCode);
      }

      throw new HttpException('支付宝认证失败，请稍后重试', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  private signParams(params: Record<string, string>): Record<string, string> {
    const sortedKeys = Object.keys(params).sort();
    const signContent = sortedKeys.map((key) => `${key}=${params[key]}`).join('&');

    const { createSign } = require('crypto');
    const sign = createSign('RSA-SHA256');
    sign.update(signContent);
    const signature = sign.sign(this.alipayConfig.privateKey, 'base64');

    return { ...params, sign: signature };
  }

  private generateMockUserInfo(authCode: string): AlipayUserInfo {
    this.logger.warn('使用模拟数据进行支付宝认证（开发环境）');
    return {
      openId: `ali_open_${authCode}_${Date.now()}`,
      unionId: `ali_union_${Date.now()}`,
      userId: `2088${Math.floor(100000000000000 + Math.random() * 900000000000000)}`,
      realName: '李四',
      nickname: '支付宝用户',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alipay',
      phone: `137${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: 'lisi@example.com',
      rawData: { mock: true, authCode },
    };
  }

  private async findOrCreateUser(userInfo: AlipayUserInfo): Promise<{ user: User; isNew: boolean }> {
    let thirdPartyAccount = await this.thirdPartyAccountRepo.findOne({
      where: { platform: 'alipay' as ThirdPartyPlatform, openId: userInfo.openId },
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

      if (!user && userInfo.email) {
        user = await this.userRepo.findOne({ where: { email: userInfo.email } });
      }

      if (!user) {
        user = this.userRepo.create({
          username: `ali_${userInfo.openId.substring(0, 20)}`,
          realName: userInfo.realName || userInfo.nickname,
          phone: userInfo.phone ? this.sm4Util.encrypt(userInfo.phone) : null,
          email: userInfo.email,
          avatar: userInfo.avatar,
          status: 'active',
          userType: 'natural' as UserType,
        });
        user = await this.userRepo.save(user);
        isNew = true;
        this.logger.log(`创建新支付宝用户: userId=${user.id}`);
      }

      if (thirdPartyAccount) {
        thirdPartyAccount.userId = user.id;
        thirdPartyAccount.user = user;
      } else {
        thirdPartyAccount = this.thirdPartyAccountRepo.create({
          platform: 'alipay',
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
