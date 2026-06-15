import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

@Injectable()
export class GuangdongCloudAdapter {
  private baseUrl: string;
  private appKey: string;
  private appSecret: string;

  constructor(
    private configService: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {
    this.baseUrl = this.configService.get('GUANGDONG_CLOUD_BASE_URL', 'https://api.gd.gov.cn');
    this.appKey = this.configService.get('GUANGDONG_CLOUD_APP_KEY', '');
    this.appSecret = this.configService.get('GUANGDONG_CLOUD_APP_SECRET', '');
  }

  private generateSignature(params: Record<string, any>): string {
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');
    return crypto.createHmac('sha256', this.appSecret).update(sorted).digest('hex');
  }

  async syncApplicationToCloud(
    application: any,
  ): Promise<{ success: boolean; cloudId?: string; message?: string }> {
    this.logger.log(
      `同步办件到广东省政务云: ${application.applicationNo}`,
      'GuangdongCloudAdapter',
    );
    try {
      const timestamp = Date.now().toString();
      const payload = {
        appKey: this.appKey,
        timestamp,
        bizId: application.applicationNo,
        bizType: 'APPLICATION',
        data: JSON.stringify({
          applicationNo: application.applicationNo,
          serviceItemId: application.serviceItemId,
          status: application.status,
          userId: application.userId,
          createdAt: application.createdAt,
        }),
      };
      payload['signature'] = this.generateSignature(payload);
      return { success: true, cloudId: `GD-${application.applicationNo}`, message: '模拟同步成功' };
    } catch (error: any) {
      this.logger.error(`省政务云同步失败: ${error.message}`, 'GuangdongCloudAdapter');
      return { success: false, message: error.message };
    }
  }

  async syncCertificateToCloud(certificate: any): Promise<{ success: boolean; message?: string }> {
    this.logger.log(`同步证照到广东省政务云: ${certificate.certNo}`, 'GuangdongCloudAdapter');
    return { success: true, message: '模拟证照同步成功' };
  }

  async queryCloudServiceItems(category?: string): Promise<any[]> {
    this.logger.log(
      `从省政务云查询事项列表: category=${category || 'all'}`,
      'GuangdongCloudAdapter',
    );
    return [
      { itemCode: 'GD001', itemName: '省级事项示例1', category: category || '民生服务' },
      { itemCode: 'GD002', itemName: '省级事项示例2', category: category || '民生服务' },
    ];
  }

  async getAccessToken(): Promise<string> {
    const timestamp = Date.now().toString();
    const params = { appKey: this.appKey, timestamp, grantType: 'client_credentials' };
    const signature = this.generateSignature(params);
    return `mock-gd-token-${timestamp}-${signature.substring(0, 16)}`;
  }
}
