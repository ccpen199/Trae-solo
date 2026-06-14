import { Injectable, Logger, Inject } from '@nestjs/common';
import * as crypto from 'crypto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

@Injectable()
export class SocialCardAdapter {
  constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService) {}

  async readCard(
    nfcData: string,
  ): Promise<{ cardNumber: string; idCardNumber: string; realName: string }> {
    try {
      this.logger.log(`解析社保卡NFC数据: dataLen=${nfcData.length}`, 'SocialCardAdapter');
      const hash = crypto.createHash('md5').update(nfcData).digest('hex');
      return {
        cardNumber: `GD${hash.substring(0, 12).toUpperCase()}`,
        idCardNumber: '440100199001011234',
        realName: '演示用户',
      };
    } catch (error: any) {
      this.logger.error(`社保卡NFC解析失败: ${error.message}`, 'SocialCardAdapter');
      throw error;
    }
  }
}
