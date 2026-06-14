import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

export interface CreateNotificationOptions {
  userId: string;
  applicationId?: string;
  title: string;
  content: string;
  channels: NotificationChannel[] | string[];
  templateCode?: string;
  params?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('notification') private notificationQueue: Queue,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async createNotification(options: CreateNotificationOptions) {
    this.logger.log(`创建通知: user=${options.userId} title=${options.title}`, 'NotificationService');

    const notifications = [];
    for (const channel of options.channels) {
      const notif = await this.prisma.notification.create({
        data: {
          userId: options.userId,
          applicationId: options.applicationId,
          title: options.title,
          content: options.content,
          channel: channel as NotificationChannel,
          templateCode: options.templateCode,
          params: options.params,
          status: NotificationStatus.PENDING,
        },
      });
      notifications.push(notif);

      await this.notificationQueue.add(
        'send',
        { notificationId: notif.id, channel },
        { removeOnComplete: true, attempts: 3 },
      );
    }

    return notifications;
  }

  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, status: { notIn: [NotificationStatus.READ] } },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, status: { in: [NotificationStatus.PENDING, NotificationStatus.SENT] } },
    });
  }

  async updateSendStatus(notificationId: string, status: NotificationStatus, failureReason?: string) {
    const data: any = { status };
    if (status === NotificationStatus.SENT) data.sentAt = new Date();
    if (failureReason) data.failureReason = failureReason;
    return this.prisma.notification.update({ where: { id: notificationId }, data });
  }
}
