import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import {
  Notification,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  User,
  MasterWaybill,
} from '../entities';
import { NotificationRequest } from '../types';
import { numberGenerator } from './NumberGeneratorService';

export class NotificationService {
  private notificationRepo: Repository<Notification>;

  private static readonly TYPE_DISPLAY_MAP: Record<NotificationType, string> = {
    [NotificationType.SYSTEM]: '系统通知',
    [NotificationType.STATUS_CHANGE]: '状态变更',
    [NotificationType.TODO]: '待办通知',
    [NotificationType.APPROVAL]: '审批通知',
    [NotificationType.COMMENT]: '评论通知',
    [NotificationType.REMINDER]: '提醒',
    [NotificationType.EXCEPTION]: '异常通知',
    [NotificationType.INFO]: '信息通知',
  };

  constructor() {
    this.notificationRepo = AppDataSource.getRepository(Notification);
  }

  async createNotification(
    user: User,
    waybill: MasterWaybill | null,
    title: string,
    content?: string,
    options?: Partial<{
      type: NotificationType;
      channel: NotificationChannel;
      priority: NotificationPriority;
      actionUrl: string;
      actionText: string;
      relatedEntityType: string;
      relatedEntityId: string;
    }>
  ): Promise<Notification> {
    const notification = new Notification();
    notification.type = options?.type || NotificationType.SYSTEM;
    notification.typeDisplay = NotificationService.getNotificationTypeDisplay(notification.type);
    notification.channel = options?.channel || NotificationChannel.IN_APP;
    notification.priority = options?.priority || NotificationPriority.NORMAL;
    notification.recipientId = user.id;
    notification.recipientName = user.name;
    notification.recipientRole = user.role;

    if (waybill) {
      notification.masterWaybillId = waybill.id;
    }
    if (options?.relatedEntityType) {
      notification.relatedEntityType = options.relatedEntityType;
    }
    if (options?.relatedEntityId) {
      notification.relatedEntityId = options.relatedEntityId;
    }

    notification.title = title;
    notification.content = content;
    notification.shortContent = content?.substring(0, 100);
    notification.isRead = false;
    notification.isClicked = false;
    notification.isDeleted = false;
    notification.sendStatus = 'pending';
    notification.retryCount = 0;

    if (options?.actionUrl) {
      notification.actionUrl = options.actionUrl;
    }
    if (options?.actionText) {
      notification.actionText = options.actionText;
    }

    return this.notificationRepo.save(notification);
  }

  async createNotificationFromRequest(request: NotificationRequest, user: User): Promise<Notification> {
    const notification = new Notification();
    notification.type = (request.type as NotificationType) || NotificationType.SYSTEM;
    notification.typeDisplay = NotificationService.getNotificationTypeDisplay(notification.type);
    notification.channel = (request.channel as NotificationChannel) || NotificationChannel.IN_APP;
    notification.priority = (request.priority as NotificationPriority) || NotificationPriority.NORMAL;
    notification.recipientId = user.id;
    notification.recipientName = user.name;
    notification.recipientRole = user.role;
    notification.masterWaybillId = request.waybillId;
    notification.title = request.title;
    notification.content = request.content;
    notification.shortContent = request.content?.substring(0, 100);
    notification.actionUrl = request.actionUrl;
    notification.actionText = request.actionText;
    notification.isRead = false;
    notification.isClicked = false;
    notification.isDeleted = false;
    notification.sendStatus = 'pending';
    notification.retryCount = 0;

    return this.notificationRepo.save(notification);
  }

  static getNotificationTypeDisplay(type: NotificationType): string {
    return this.TYPE_DISPLAY_MAP[type] || type;
  }

  async getUserNotifications(
    userId: string,
    options?: Partial<{
      isRead: boolean;
      type: NotificationType;
      page: number;
      pageSize: number;
    }>
  ): Promise<{ items: Notification[]; total: number }> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: Record<string, any> = {
      recipientId: userId,
      isDeleted: false,
    };

    if (options?.isRead !== undefined) {
      where.isRead = options.isRead;
    }
    if (options?.type) {
      where.type = options.type;
    }

    const [items, total] = await this.notificationRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return { items, total };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: {
        recipientId: userId,
        isRead: false,
        isDeleted: false,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, recipientId: userId },
    });

    if (!notification) {
      return null;
    }

    notification.isRead = true;
    notification.readAt = new Date();
    notification.readBy = userId;

    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update(
      { recipientId: userId, isRead: false, isDeleted: false },
      { isRead: true, readAt: new Date(), readBy: userId }
    );
  }

  async markAsClicked(notificationId: string, userId: string): Promise<Notification | null> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, recipientId: userId },
    });

    if (!notification) {
      return null;
    }

    notification.isClicked = true;
    notification.clickedAt = new Date();

    return this.notificationRepo.save(notification);
  }

  async softDelete(notificationId: string, userId: string): Promise<boolean> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, recipientId: userId },
    });

    if (!notification) {
      return false;
    }

    notification.isDeleted = true;
    notification.deletedAt = new Date();

    await this.notificationRepo.save(notification);
    return true;
  }

  async createStatusChangeNotifications(
    waybill: MasterWaybill,
    fromStatus: string,
    toStatus: string,
    users: User[]
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const user of users) {
      const notification = await this.createNotification(
        user,
        waybill,
        `运单 ${waybill.masterNo} 状态已变更`,
        `运单状态从 ${fromStatus} 变更为 ${toStatus}`,
        {
          type: NotificationType.STATUS_CHANGE,
          priority: NotificationPriority.NORMAL,
          actionUrl: `/waybills/${waybill.id}`,
          actionText: '查看详情',
        }
      );
      notifications.push(notification);
    }

    return notifications;
  }

  async createTodoNotification(user: User, waybill: MasterWaybill, todoTitle: string): Promise<Notification> {
    return this.createNotification(
      user,
      waybill,
      `您有新的待办任务`,
      todoTitle,
      {
        type: NotificationType.TODO,
        priority: NotificationPriority.HIGH,
        actionUrl: `/todos`,
        actionText: '处理待办',
      }
    );
  }

  async createExceptionNotification(
    user: User,
    waybill: MasterWaybill,
    exceptionType: string,
    description: string
  ): Promise<Notification> {
    return this.createNotification(
      user,
      waybill,
      `运单 ${waybill.masterNo} 发生异常`,
      `异常类型: ${exceptionType}\n${description}`,
      {
        type: NotificationType.EXCEPTION,
        priority: NotificationPriority.URGENT,
        actionUrl: `/waybills/${waybill.id}`,
        actionText: '查看异常详情',
      }
    );
  }
}
