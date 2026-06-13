import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertEntity } from '../../database/entities/alert.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { HomeEntity } from '../../database/entities/home.entity';
import { NotificationChannel, AlertSeverity } from '@iot/shared';
import { CacheService } from '../redis/cache.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(HomeEntity) private readonly homeRepo: Repository<HomeEntity>,
    private readonly cache: CacheService,
  ) {}

  async dispatchNotification(alert: AlertEntity) {
    const results: any[] = [];
    const recipients = await this.getRecipients(alert.homeId, alert.severity);

    for (const channel of alert.channels) {
      for (const recipient of recipients) {
        try {
          const result = await this.sendThroughChannel(channel, recipient, alert);
          results.push({
            channel,
            recipientId: recipient.id,
            sentAt: new Date(),
            success: result.success,
            error: result.error,
          });
          if (!result.success) {
            this.logger.warn(`Failed to send [${channel}] to ${recipient.username}: ${result.error}`);
          }
        } catch (err: any) {
          results.push({
            channel,
            recipientId: recipient.id,
            sentAt: new Date(),
            success: false,
            error: err.message,
          });
        }
      }
    }

    return results;
  }

  async sendCustomNotification(
    userIds: string[],
    channels: NotificationChannel[],
    title: string,
    content: string,
    extra?: Record<string, any>,
  ) {
    const results: any[] = [];
    const users = await this.userRepo.findByIds(userIds);

    for (const user of users) {
      for (const channel of channels) {
        try {
          const alert = {
            id: 'custom_' + Date.now(),
            title,
            message: content,
            severity: AlertSeverity.INFO,
            homeId: '',
            data: extra || {},
            channels,
          } as AlertEntity;
          const result = await this.sendThroughChannel(channel, user, alert);
          results.push({ userId: user.id, channel, success: result.success });
        } catch (err: any) {
          results.push({ userId: user.id, channel, success: false, error: err.message });
        }
      }
    }
    return results;
  }

  private async getRecipients(homeId: string, severity: AlertSeverity): Promise<UserEntity[]> {
    const home = await this.homeRepo.findOne({ where: { id: homeId } });
    if (!home) return [];

    const memberIds = [home.ownerId, ...home.members.map(m => m.userId)];
    const users = await this.userRepo.findByIds(memberIds);

    if (severity === AlertSeverity.CRITICAL || severity === AlertSeverity.ERROR) {
      return users;
    }

    return users.filter(u => {
      const settings = u.notificationSettings || {};
      return settings.push !== false || settings.inApp !== false;
    });
  }

  private async sendThroughChannel(
    channel: NotificationChannel,
    user: UserEntity,
    alert: AlertEntity,
  ): Promise<{ success: boolean; error?: string }> {
    const payload = {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      content: alert.message,
      data: alert.data,
      userId: user.id,
      timestamp: Date.now(),
    };

    switch (channel) {
      case NotificationChannel.IN_APP:
        await this.cache.publish(`user:${user.id}:notifications`, payload);
        await this.cache.set(
          `notification:${user.id}:${alert.id}`,
          payload,
          86400 * 7,
        );
        return { success: true };

      case NotificationChannel.PUSH:
        this.logger.log(`[PUSH] Sending to ${user.username}: ${alert.title}`);
        return { success: true };

      case NotificationChannel.EMAIL:
        if (!user.email) return { success: false, error: 'No email configured' };
        this.logger.log(`[EMAIL] Sending to ${user.email}: ${alert.title}`);
        return { success: true };

      case NotificationChannel.SMS:
        if (!user.phone) return { success: false, error: 'No phone configured' };
        this.logger.log(`[SMS] Sending to ${user.phone}: ${alert.title}`);
        return { success: true };

      case NotificationChannel.WEBHOOK:
        if (process.env.ALERT_WEBHOOK_URL) {
          try {
            const response = await fetch(process.env.ALERT_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (response.ok) return { success: true };
            return { success: false, error: `HTTP ${response.status}` };
          } catch (err: any) {
            return { success: false, error: err.message };
          }
        }
        return { success: false, error: 'No webhook URL configured' };

      case NotificationChannel.WECHAT:
        this.logger.log(`[WECHAT] Sending to ${user.username}: ${alert.title}`);
        return { success: true };

      default:
        return { success: false, error: `Unknown channel: ${channel}` };
    }
  }

  async getUserNotifications(userId: string, limit = 50) {
    const keys = await this.cache.getClient().keys(`notification:${userId}:*`);
    const notifications: any[] = [];
    for (const key of keys.slice(0, limit)) {
      const data = await this.cache.get<any>(key);
      if (data) notifications.push(data);
    }
    return notifications.sort((a, b) => b.timestamp - a.timestamp);
  }
}
