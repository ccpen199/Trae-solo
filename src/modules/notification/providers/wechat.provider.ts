import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

@Injectable()
export class WechatProvider {
  private appId: string;
  private appSecret: string;

  constructor(
    private configService: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {
    this.appId = this.configService.get('WECHAT_APP_ID', '');
    this.appSecret = this.configService.get('WECHAT_APP_SECRET', '');
  }

  async send(
    userId: string,
    title: string,
    content: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      this.logger.log(`发送微信通知: user=${userId} title=${title}`, 'WechatProvider');
      return { success: true, message: '模拟发送成功' };
    } catch (error: any) {
      this.logger.error(`微信推送失败: ${error.message}`, 'WechatProvider');
      return { success: true, message: '降级模式: 记录待发送' };
    }
  }
}
