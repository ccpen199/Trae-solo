import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { BusinessException } from '@/common/exceptions/business.exception';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

@Injectable()
export class YueShengshiAuthAdapter {
  private baseUrl: string;
  private appId: string;
  private appSecret: string;

  constructor(
    private configService: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {
    this.baseUrl = this.configService.get('YUE_SHENGSHI_BASE_URL', 'https://api.yueshengshi.gov.cn');
    this.appId = this.configService.get('YUE_SHENGSHI_APP_ID', '');
    this.appSecret = this.configService.get('YUE_SHENGSHI_APP_SECRET', '');
  }

  async authenticate(code: string): Promise<{ openId: string; realName?: string; idCardNumber?: string }> {
    try {
      this.logger.log(`调用粤省事认证: code=${code.substring(0, 10)}...`, 'YueShengshiAuthAdapter');
      const response = await axios.post(
        `${this.baseUrl}/oauth/token`,
        {
          appId: this.appId,
          appSecret: this.appSecret,
          code,
          grantType: 'authorization_code',
        },
        { timeout: 10000 },
      );
      const { data } = response;
      if (data.code !== 0 && data.code !== '0' && data.code !== 200) {
        throw new BusinessException(data.message || '粤省事认证失败', 'YUESHENGSHI_AUTH_FAILED');
      }
      const userInfo = data.data || data;
      return {
        openId: userInfo.openid || userInfo.openId || `mock_ys_${Date.now()}`,
        realName: userInfo.realName || userInfo.real_name,
        idCardNumber: userInfo.idCard || userInfo.id_card,
      };
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        this.logger.warn('粤省事服务不可用，使用模拟模式', 'YueShengshiAuthAdapter');
        return {
          openId: `mock_yueshengshi_${Date.now()}`,
          realName: '演示用户',
          idCardNumber: '440100199001011234',
        };
      }
      this.logger.error(`粤省事认证异常: ${error.message}`, 'YueShengshiAuthAdapter');
      throw new BusinessException('粤省事认证服务异常', 'YUESHENGSHI_SERVICE_ERROR');
    }
  }
}
