import { Injectable, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthType } from '@prisma/client';
import { BusinessException } from '@/common/exceptions/business.exception';
import { YueShengshiAuthAdapter } from './adapters/yueshengshi.adapter';
import { FaceRecognitionAdapter } from './adapters/face-recognition.adapter';
import { SocialCardAdapter } from './adapters/social-card.adapter';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    realName: string | null;
    phoneNumber: string | null;
    authType: AuthType;
    isVerified: boolean;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private yueShengshiAdapter: YueShengshiAuthAdapter,
    private faceRecognitionAdapter: FaceRecognitionAdapter,
    private socialCardAdapter: SocialCardAdapter,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async loginWithYueShengshi(code: string): Promise<AuthResult> {
    this.logger.log('粤省事登录', 'AuthService');
    const authData = await this.yueShengshiAdapter.authenticate(code);
    return this.processAuth(AuthType.YUE_SHENGSHI, authData.openId, authData);
  }

  async loginWithFaceRecognition(faceImage: string, idCardNumber: string): Promise<AuthResult> {
    this.logger.log('人脸识别登录', 'AuthService');
    const result = await this.faceRecognitionAdapter.verify(faceImage, idCardNumber);
    if (!result.verified) {
      throw new UnauthorizedException('人脸识别验证失败');
    }
    return this.processAuth(AuthType.FACE_RECOGNITION, idCardNumber, {
      idCardNumber,
      realName: result.realName,
    });
  }

  async loginWithSocialCardNFC(nfcData: string): Promise<AuthResult> {
    this.logger.log('社保卡NFC登录', 'AuthService');
    const cardData = await this.socialCardAdapter.readCard(nfcData);
    return this.processAuth(AuthType.SOCIAL_CARD_NFC, cardData.cardNumber, {
      socialCardNo: cardData.cardNumber,
      idCardNumber: cardData.idCardNumber,
      realName: cardData.realName,
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('刷新令牌无效');
      }
      return this.generateTokens(user);
    } catch (e) {
      throw new UnauthorizedException('刷新令牌已过期');
    }
  }

  private async processAuth(
    authType: AuthType,
    openId: string,
    extraData: Partial<{
      idCardNumber: string;
      realName: string;
      phoneNumber: string;
      socialCardNo: string;
    }>,
  ): Promise<AuthResult> {
    let user = await this.prisma.user.findFirst({
      where: { authType, authOpenId: openId },
    });

    if (!user && extraData.idCardNumber) {
      user = await this.prisma.user.findFirst({
        where: { idCardNumber: extraData.idCardNumber },
      });
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          authType,
          authOpenId: openId,
          idCardNumber: extraData.idCardNumber,
          realName: extraData.realName,
          phoneNumber: extraData.phoneNumber,
          socialCardNo: extraData.socialCardNo,
          isVerified: true,
          verifiedAt: new Date(),
        },
      });
      this.logger.log(`新用户注册: ${user.id}`, 'AuthService');
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          authType,
          authOpenId: openId,
          realName: extraData.realName || user.realName,
          idCardNumber: extraData.idCardNumber || user.idCardNumber,
          socialCardNo: extraData.socialCardNo || user.socialCardNo,
          isVerified: true,
          verifiedAt: new Date(),
          lastLoginAt: new Date(),
        },
      });
    }

    return this.generateTokens(user);
  }

  private async generateTokens(user: any): Promise<AuthResult> {
    const payload = {
      sub: user.id,
      authType: user.authType,
      isVerified: user.isVerified,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        realName: user.realName,
        phoneNumber: user.phoneNumber,
        authType: user.authType,
        isVerified: user.isVerified,
      },
    };
  }
}
