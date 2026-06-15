import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { NxGovApiConfig } from '../../../config/configuration';
import { ThirdPartyAccount, ThirdPartyPlatform } from '../entities/third-party-account.entity';
import { User, UserType } from '../entities/user.entity';
import { Sm4Util } from '../../../common/utils/sm4.util';

export interface NxGovUserInfo {
  openId: string;
  unionId?: string;
  realName: string;
  idCard: string;
  phone?: string;
  email?: string;
  avatar?: string;
  userType?: 'natural' | 'legal';
  rawData: Record<string, unknown>;
}

@Injectable()
export class NxGovAuthService {
  private readonly logger = new Logger(NxGovAuthService.name);
  private readonly nxGovConfig: NxGovApiConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly sm4Util: Sm4Util,
    @InjectRepository(ThirdPartyAccount)
    private readonly thirdPartyAccountRepo: Repository<ThirdPartyAccount>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    this.nxGovConfig = this.configService.get<NxGovApiConfig>('nxGovApi')!;
  }

  async authenticate(code: string): Promise<{ user: User; isNew: boolean }> {
    const userInfo = await this.exchangeCodeForUserInfo(code);
    return this.findOrCreateUser(userInfo);
  }

  private async exchangeCodeForUserInfo(code: string): Promise<NxGovUserInfo> {
    try {
      this.logger.log(`开始通过code换取宁夏政务用户信息, code=${code.substring(0, 10)}...`);

      const tokenUrl = `${this.nxGovConfig.url}/oauth2/token`;
      const tokenResponse = await firstValueFrom(
        this.httpService.post(tokenUrl, {
          grant_type: 'authorization_code',
          code,
          app_id: this.nxGovConfig.appId,
          app_secret: this.nxGovConfig.appSecret,
        }),
      );

      const { access_token: accessToken, openid: openId, unionid: unionId } = tokenResponse.data;

      const userInfoUrl = `${this.nxGovConfig.url}/oauth2/userinfo`;
      const userInfoResponse = await firstValueFrom(
        this.httpService.post(userInfoUrl, {
          access_token: accessToken,
          openid: openId,
        }),
      );

      const data = userInfoResponse.data;

      return {
        openId,
        unionId: unionId || data.unionid,
        realName: data.real_name || data.name,
        idCard: data.id_card || data.idcard,
        phone: data.phone || data.mobile,
        email: data.email,
        avatar: data.avatar || data.headimgurl,
        userType: data.user_type === 'legal' ? 'legal' : 'natural',
        rawData: data,
      };
    } catch (error) {
      this.logger.error(`宁夏政务认证失败: ${error.message}`);

      if (process.env.NODE_ENV === 'development') {
        return this.generateMockUserInfo(code);
      }

      throw new HttpException('宁夏政务认证失败，请稍后重试', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  private generateMockUserInfo(code: string): NxGovUserInfo {
    this.logger.warn('使用模拟数据进行宁夏政务认证（开发环境）');
    const mockIdCard = `64010119900101${Math.floor(1000 + Math.random() * 9000)}`;
    const mockPhone = `139${Math.floor(10000000 + Math.random() * 90000000)}`;

    return {
      openId: `nx_gov_${code}_${Date.now()}`,
      unionId: `nx_union_${Date.now()}`,
      realName: '张三',
      idCard: mockIdCard,
      phone: mockPhone,
      email: 'zhangsan@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
      userType: 'natural',
      rawData: { mock: true, code },
    };
  }

  private async findOrCreateUser(userInfo: NxGovUserInfo): Promise<{ user: User; isNew: boolean }> {
    let thirdPartyAccount = await this.thirdPartyAccountRepo.findOne({
      where: { platform: 'nx_gov' as ThirdPartyPlatform, openId: userInfo.openId },
      relations: ['user'],
    });

    if (thirdPartyAccount?.user) {
      this.logger.log(`用户已存在: userId=${thirdPartyAccount.userId}`);
      return { user: thirdPartyAccount.user, isNew: false };
    }

    let user = thirdPartyAccount?.user;
    let isNew = false;

    if (!user) {
      if (userInfo.idCard) {
        user = await this.userRepo
          .createQueryBuilder('u')
          .where('u.id_card = :idCard', { idCard: this.sm4Util.encrypt(userInfo.idCard) })
          .getOne();
      }

      if (!user && userInfo.phone) {
        user = await this.userRepo
          .createQueryBuilder('u')
          .where('u.phone = :phone', { phone: this.sm4Util.encrypt(userInfo.phone) })
          .getOne();
      }

      if (!user) {
        user = this.userRepo.create({
          username: `nx_${userInfo.openId.substring(0, 20)}`,
          realName: userInfo.realName,
          idCard: userInfo.idCard ? this.sm4Util.encrypt(userInfo.idCard) : null,
          phone: userInfo.phone ? this.sm4Util.encrypt(userInfo.phone) : null,
          email: userInfo.email,
          avatar: userInfo.avatar,
          status: 'active',
          userType: (userInfo.userType as UserType) || 'natural',
        });
        user = await this.userRepo.save(user);
        isNew = true;
        this.logger.log(`创建新用户: userId=${user.id}`);
      } else {
        this.logger.log(`通过身份证/手机号找到已有用户: userId=${user.id}`);
      }

      if (thirdPartyAccount) {
        thirdPartyAccount.userId = user.id;
        thirdPartyAccount.user = user;
      } else {
        thirdPartyAccount = this.thirdPartyAccountRepo.create({
          platform: 'nx_gov',
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
