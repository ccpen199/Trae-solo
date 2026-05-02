import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@hospital/shared';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private prisma: PrismaService) {}

  async createNotification(params: {
    type: NotificationType;
    title: string;
    content: string;
    recipientId?: string;
    recipientType?: string;
    entityId?: string;
    entityType?: string;
    metadata?: any;
  }): Promise<any> {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          type: params.type,
          title: params.title,
          content: params.content,
          recipientId: params.recipientId,
          recipientType: params.recipientType,
          entityId: params.entityId,
          entityType: params.entityType,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
          isRead: false,
        },
      });

      this.logger.log(
        `通知已创建: 类型 ${params.type}，接收者 ${params.recipientId || '全部'}`,
      );

      return notification;
    } catch (error) {
      this.logger.error('创建通知失败', error);
      return null;
    }
  }

  async getUserNotifications(userId: string, unreadOnly?: boolean): Promise<any[]> {
    const where: any = {
      OR: [
        { recipientId: userId },
        { recipientType: 'ALL' },
        { recipientType: 'USER' },
      ],
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        OR: [
          { recipientId: userId },
          { recipientType: 'ALL' },
          { recipientType: 'USER' },
        ],
        isRead: false,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<any> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('通知不存在');
    }

    if (notification.recipientId && notification.recipientId !== userId) {
      throw new Error('无权限操作此通知');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        OR: [
          { recipientId: userId },
          { recipientType: 'ALL' },
          { recipientType: 'USER' },
        ],
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }

  async notifyAppointmentCreated(appointment: any, patient: any): Promise<void> {
    await this.createNotification({
      type: NotificationType.APPOINTMENT_CONFIRMED,
      title: '预约成功',
      content: `您已成功预约 ${appointment.doctor.user.name} 医生的 ${appointment.appointmentDate} ${appointment.timeSlot.startTime} 时段号源，请按时就诊。`,
      recipientId: patient.id,
      recipientType: 'PATIENT',
      entityId: appointment.id,
      entityType: 'Appointment',
      metadata: {
        doctor: appointment.doctor.user.name,
        department: appointment.department.name,
        date: appointment.appointmentDate,
        time: `${appointment.timeSlot.startTime}-${appointment.timeSlot.endTime}`,
      },
    });
  }

  async notifyRegistrationCreated(registration: any, patient: any): Promise<void> {
    await this.createNotification({
      type: NotificationType.REGISTRATION_SUCCESS,
      title: '挂号成功',
      content: `您已成功挂号，医生: ${registration.doctor.user.name}，科室: ${registration.department.name}，候诊号: ${registration.queueNumber}`,
      recipientId: patient.id,
      recipientType: 'PATIENT',
      entityId: registration.id,
      entityType: 'Registration',
      metadata: {
        doctor: registration.doctor.user.name,
        department: registration.department.name,
        queueNumber: registration.queueNumber,
      },
    });
  }

  async notifyCheckIn(registration: any, patient: any): Promise<void> {
    await this.createNotification({
      type: NotificationType.CHECK_IN_SUCCESS,
      title: '签到成功',
      content: `您已成功签到，候诊号: ${registration.queueNumber}，请耐心等待叫号。`,
      recipientId: patient.id,
      recipientType: 'PATIENT',
      entityId: registration.id,
      entityType: 'Registration',
      metadata: {
        queueNumber: registration.queueNumber,
        doctor: registration.doctor?.user?.name,
      },
    });
  }

  async notifyQueueCalled(queueItem: any, patient: any): Promise<void> {
    await this.createNotification({
      type: NotificationType.QUEUE_CALLED,
      title: '请您就诊',
      content: `您的号码 ${queueItem.queueNumber} 已被叫到，请立即前往诊室就诊。`,
      recipientId: patient.id,
      recipientType: 'PATIENT',
      entityId: queueItem.id,
      entityType: 'QueueItem',
      metadata: {
        queueNumber: queueItem.queueNumber,
        position: queueItem.position,
      },
    });
  }

  async notifyRefundCompleted(refund: any, patient: any): Promise<void> {
    await this.createNotification({
      type: NotificationType.REFUND_COMPLETED,
      title: '退款成功',
      content: `您的退款申请已处理完成，退款金额: ¥${refund.amount.toFixed(2)}`,
      recipientId: patient.id,
      recipientType: 'PATIENT',
      entityId: refund.id,
      entityType: 'Refund',
      metadata: {
        amount: refund.amount,
        reason: refund.reason,
      },
    });
  }

  async notifyAppointmentCancelled(appointment: any, patient: any, reason: string): Promise<void> {
    await this.createNotification({
      type: NotificationType.APPOINTMENT_CANCELLED,
      title: '预约已取消',
      content: `您的预约已取消，原因: ${reason}`,
      recipientId: patient.id,
      recipientType: 'PATIENT',
      entityId: appointment.id,
      entityType: 'Appointment',
      metadata: {
        reason,
        appointmentDate: appointment.appointmentDate,
      },
    });
  }

  async notifySystemMessage(title: string, content: string, recipientType?: string): Promise<void> {
    await this.createNotification({
      type: NotificationType.SYSTEM,
      title,
      content,
      recipientType: recipientType || 'ALL',
    });
  }
}
