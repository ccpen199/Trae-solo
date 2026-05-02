import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus, RegistrationStatus, QueueStatus, WorkflowTransition, WORKFLOW_TRANSITIONS } from '@hospital/shared';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(private prisma: PrismaService) {}

  async canTransition(
    entityType: 'appointment' | 'registration' | 'queue',
    currentStatus: string,
    targetStatus: string,
    userRole: string,
  ): Promise<{ canTransition: boolean; reason?: string }> {
    const transitions = WORKFLOW_TRANSITIONS[entityType];
    if (!transitions) {
      return { canTransition: false, reason: '不支持的实体类型' };
    }

    const transition = transitions.find(
      (t) => t.from === currentStatus && t.to === targetStatus,
    );

    if (!transition) {
      return {
        canTransition: false,
        reason: `不允许从 ${currentStatus} 转换到 ${targetStatus}`,
      };
    }

    if (!transition.allowedRoles.includes(userRole)) {
      return {
        canTransition: false,
        reason: `角色 ${userRole} 没有权限执行此操作`,
      };
    }

    return { canTransition: true };
  }

  async transitionAppointment(
    appointmentId: string,
    targetStatus: AppointmentStatus,
    operatorId: string,
    operatorRole: string,
  ): Promise<any> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new BadRequestException('预约记录不存在');
    }

    const check = await this.canTransition(
      'appointment',
      appointment.status,
      targetStatus,
      operatorRole,
    );

    if (!check.canTransition) {
      throw new BadRequestException(check.reason);
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: targetStatus,
        updatedAt: new Date(),
        cancelledAt:
          targetStatus === AppointmentStatus.CANCELLED ? new Date() : undefined,
      },
    });

    this.logger.log(
      `工作流转换: 预约 ${appointmentId} 从 ${appointment.status} 到 ${targetStatus}，操作者 ${operatorId}`,
    );

    return updated;
  }

  async transitionRegistration(
    registrationId: string,
    targetStatus: RegistrationStatus,
    operatorId: string,
    operatorRole: string,
  ): Promise<any> {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new BadRequestException('挂号记录不存在');
    }

    const check = await this.canTransition(
      'registration',
      registration.status,
      targetStatus,
      operatorRole,
    );

    if (!check.canTransition) {
      throw new BadRequestException(check.reason);
    }

    const updated = await this.prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: targetStatus,
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `工作流转换: 挂号 ${registrationId} 从 ${registration.status} 到 ${targetStatus}，操作者 ${operatorId}`,
    );

    return updated;
  }

  async transitionQueueItem(
    queueItemId: string,
    targetStatus: QueueStatus,
    operatorId: string,
    operatorRole: string,
  ): Promise<any> {
    const queueItem = await this.prisma.queueItem.findUnique({
      where: { id: queueItemId },
    });

    if (!queueItem) {
      throw new BadRequestException('队列项不存在');
    }

    const check = await this.canTransition(
      'queue',
      queueItem.status,
      targetStatus,
      operatorRole,
    );

    if (!check.canTransition) {
      throw new BadRequestException(check.reason);
    }

    const updated = await this.prisma.queueItem.update({
      where: { id: queueItemId },
      data: {
        status: targetStatus,
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `工作流转换: 队列 ${queueItemId} 从 ${queueItem.status} 到 ${targetStatus}，操作者 ${operatorId}`,
    );

    return updated;
  }

  getWorkflowDefinition(entityType: 'appointment' | 'registration' | 'queue'): WorkflowTransition[] {
    return WORKFLOW_TRANSITIONS[entityType] || [];
  }

  getAllWorkflowDefinitions(): Record<string, WorkflowTransition[]> {
    return WORKFLOW_TRANSITIONS;
  }
}
