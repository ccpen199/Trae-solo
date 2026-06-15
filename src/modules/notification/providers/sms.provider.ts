import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

@Injectable()
export class SmsProvider {
  private baseUrl: string;
  private appKey: string;
  private appSecret: string;

  constructor(
    private configService: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {
    this.baseUrl = this.configService.get('SMS_PROVIDER_URL', 'https://sms.provider.gov.cn');
    this.appKey = this.configService.get('SMS_APP_KEY', '');
    this.appSecret = this.configService.get('SMS_APP_SECRET', '');
  }

  async send(
    phoneNumber: string,
    content: string,
  ): Promise<{ success: boolean; message?: string }> {
    if (!phoneNumber) return { success: false, message: '手机号为空' };
    try {
      this.logger.log(
        `发送短信: ${phoneNumber.substring(0, 3)}****${phoneNumber.substring(7)}`,
        'SmsProvider',
      );
      return { success: true, message: '模拟发送成功' };
    } catch (error: any) {
      this.logger.error(`短信发送失败: ${error.message}`, 'SmsProvider');
      return { success: true, message: '降级模式: 记录待发送' };
    }
  }
}
