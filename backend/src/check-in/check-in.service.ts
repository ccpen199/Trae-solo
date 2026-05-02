import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrationStatus, QueueStatus } from '@hospital/shared';
import { QueueEngineService } from '../engines/queue-engine.service';

@Injectable()
export class CheckInService {
  private readonly logger = new Logger(CheckInService.name);

  constructor(
    private prisma: PrismaService,
    private queueEngine: QueueEngineService,
  ) {}

  async checkIn(registrationId: string, operatorId?: string): Promise<any> {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
        payment: true,
        queueItem: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('挂号记录不存在');
    }

    if (registration.status === RegistrationStatus.CHECKED_IN) {
      throw new ConflictException('已签到，无需重复操作');
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new ConflictException('挂号已取消，无法签到');
    }

    if (registration.status === RegistrationStatus.COMPLETED) {
      throw new ConflictException('就诊已完成，无法签到');
    }

    if (registration.payment && registration.payment.status !== 'PAID') {
      throw new ConflictException('请先完成支付再签到');
    }

    const updatedRegistration = await this.prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: RegistrationStatus.CHECKED_IN,
        checkedInAt: new Date(),
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
      },
    });

    const queueItem = await this.queueEngine.addToQueue(
      registrationId,
      registration.doctorId,
      registration.departmentId,
    );

    this.logger.log(
      `签到成功: 患者 ${registration.patientId}，医生 ${registration.doctorId}，队列号 ${queueItem.queueNumber}`,
    );

    return {
      registration: updatedRegistration,
      queueItem,
    };
  }

  async checkInByQueueNumber(
    doctorId: string,
    queueNumber: number,
    operatorId?: string,
  ): Promise<any> {
    const today = this.normalizeDate(new Date());

    const registration = await this.prisma.registration.findFirst({
      where: {
        doctorId,
        queueNumber,
        registrationDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
        payment: true,
        queueItem: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('未找到对应的挂号记录');
    }

    return this.checkIn(registration.id, operatorId);
  }

  async getTodayCheckIns(date?: Date): Promise<any[]> {
    const normalizedDate = date ? this.normalizeDate(date) : this.normalizeDate(new Date());

    const registrations = await this.prisma.registration.findMany({
      where: {
        status: RegistrationStatus.CHECKED_IN,
        checkedInAt: {
          gte: normalizedDate,
          lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
        queueItem: true,
      },
      orderBy: { checkedInAt: 'asc' },
    });

    return registrations;
  }

  async getStatistics(date?: Date): Promise<{
    total: number;
    checkedIn: number;
    inQueue: number;
    inConsultation: number;
    completed: number;
    averageWaitTime: number;
  }> {
    const normalizedDate = date ? this.normalizeDate(date) : this.normalizeDate(new Date());

    const registrations = await this.prisma.registration.findMany({
      where: {
        registrationDate: {
          gte: normalizedDate,
          lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: {
        queueItem: true,
      },
    });

    const stats = {
      total: registrations.length,
      checkedIn: 0,
      inQueue: 0,
      inConsultation: 0,
      completed: 0,
      averageWaitTime: 0,
    };

    let totalWaitTime = 0;
    let waitTimeCount = 0;

    for (const registration of registrations) {
      switch (registration.status) {
        case RegistrationStatus.CHECKED_IN:
          stats.checkedIn++;
          break;
        case RegistrationStatus.IN_CONSULTATION:
          stats.inConsultation++;
          break;
        case RegistrationStatus.COMPLETED:
          stats.completed++;
          break;
      }

      if (registration.queueItem) {
        if (
          registration.queueItem.status === QueueStatus.WAITING ||
          registration.queueItem.status === QueueStatus.CALLED
        ) {
          stats.inQueue++;
        }

        if (
          registration.queueItem.calledAt &&
          registration.queueItem.createdAt
        ) {
          const waitTime =
            (registration.queueItem.calledAt.getTime() - registration.queueItem.createdAt.getTime()) /
            (1000 * 60);
          totalWaitTime += waitTime;
          waitTimeCount++;
        }
      }
    }

    if (waitTimeCount > 0) {
      stats.averageWaitTime = Math.round(totalWaitTime / waitTimeCount);
    }

    return stats;
  }

  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }
}
