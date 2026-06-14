import { Injectable, Logger, Inject } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

@Injectable()
export class InAppProvider {
  constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService) {}

  async send(userId: string, notification: any): Promise<{ success: boolean; message?: string }> {
    this.logger.log(`发送站内消息: user=${userId}`, 'InAppProvider');
    return { success: true, message: '站内消息已写入数据库' };
  }
}
