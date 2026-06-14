import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, LoggerService } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SmsProvider } from './providers/sms.provider';
import { WechatProvider } from './providers/wechat.provider';
import { InAppProvider } from './providers/in-app.provider';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Processor('notification')
export class NotificationConsumer extends WorkerHost {
  constructor(
    private notificationService: NotificationService,
    private smsProvider: SmsProvider,
    private wechatProvider: WechatProvider,
    private inAppProvider: InAppProvider,
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { notificationId, channel } = job.data;
    this.logger.log(`处理通知: job=${job.id} channel=${channel}`, 'NotificationConsumer');

    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { user: true },
    });
    if (!notification) return { skipped: true, reason: 'notification not found' };

    try {
      let result: { success: boolean; message?: string };
      switch (channel as NotificationChannel) {
        case NotificationChannel.SMS:
          result = await this.smsProvider.send(notification.user.phoneNumber || '', notification.content);
          break;
        case NotificationChannel.WECHAT:
          result = await this.wechatProvider.send(notification.userId, notification.title, notification.content);
          break;
        case NotificationChannel.IN_APP:
          result = await this.inAppProvider.send(notification.userId, notification);
          break;
        case NotificationChannel.EMAIL:
          result = { success: true, message: 'email provider not implemented' };
          break;
        default:
          result = { success: false, message: 'unknown channel' };
      }

      if (result.success) {
        await this.notificationService.updateSendStatus(notificationId, NotificationStatus.SENT);
      } else {
        await this.notificationService.updateSendStatus(
          notificationId,
          NotificationStatus.FAILED,
          result.message,
        );
      }

      return result;
    } catch (error: any) {
      this.logger.error(`通知发送失败: ${error.message}`, error.stack, 'NotificationConsumer');
      await this.notificationService.updateSendStatus(
        notificationId,
        NotificationStatus.FAILED,
        error.message,
      );
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`通知任务完成: job=${job.id}`, 'NotificationConsumer');
  }
}
