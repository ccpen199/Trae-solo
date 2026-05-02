import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueStatus } from '@hospital/shared';

interface QueuePosition {
  queueNumber: number;
  displayNumber: string;
  position: number;
  aheadCount: number;
  estimatedWaitTime: number;
}

@Injectable()
export class QueueEngineService {
  private readonly logger = new Logger(QueueEngineService.name);
  private readonly CONSULTATION_TIME_MINUTES = 15;

  constructor(private prisma: PrismaService) {}

  async addToQueue(
    registrationId: string,
    doctorId: string,
    departmentId: string,
    isPriority: boolean = false,
    priorityReason?: string,
  ) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new NotFoundException('挂号记录不存在');
    }

    const existingQueueItem = await this.prisma.queueItem.findUnique({
      where: { registrationId },
    });

    if (existingQueueItem) {
      throw new ConflictException('已在队列中');
    }

    const today = this.normalizeDate(new Date());

    const maxQueueNumber = await this.prisma.queueItem.aggregate({
      where: {
        doctorId,
        queueDate: today,
      },
      _max: {
        queueNumber: true,
      },
    });

    const nextQueueNumber = (maxQueueNumber._max.queueNumber || 0) + 1;
    const displayNumber = this.generateDisplayNumber(departmentId, nextQueueNumber);

    const waitingCount = await this.prisma.queueItem.count({
      where: {
        doctorId,
        queueDate: today,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.CALLED],
        },
      },
    });

    let sortOrder = waitingCount + 1;
    if (isPriority) {
      const priorityCount = await this.prisma.queueItem.count({
        where: {
          doctorId,
          queueDate: today,
          isPriority: true,
          status: QueueStatus.WAITING,
        },
      });
      sortOrder = priorityCount + 1;
    }

    const queueItem = await this.prisma.queueItem.create({
      data: {
        registrationId,
        doctorId,
        departmentId,
        queueDate: today,
        queueNumber: nextQueueNumber,
        displayNumber,
        status: QueueStatus.WAITING,
        sortOrder,
        isPriority,
        priorityReason,
      },
    });

    await this.prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
        queueNumber: nextQueueNumber,
      },
    });

    this.logger.log(
      `患者 ${registration.patientId} 加入队列，队列号: ${displayNumber}，医生: ${doctorId}`,
    );

    return queueItem;
  }

  async callNextPatient(
    doctorId: string,
    calledBy: string,
  ) {
    const today = this.normalizeDate(new Date());

    const waitingPatients = await this.prisma.queueItem.findMany({
      where: {
        doctorId,
        queueDate: today,
        status: QueueStatus.WAITING,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { isPriority: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    if (waitingPatients.length === 0) {
      return null;
    }

    const nextPatient = waitingPatients[0];

    const updatedQueueItem = await this.prisma.queueItem.update({
      where: { id: nextPatient.id },
      data: {
        status: QueueStatus.CALLED,
        calledAt: new Date(),
        calledBy,
      },
    });

    await this.prisma.registration.update({
      where: { id: nextPatient.registrationId },
      data: {
        status: 'IN_CONSULTATION',
        consultationStartTime: new Date(),
      },
    });

    this.logger.log(
      `叫号: ${nextPatient.displayNumber}，医生: ${doctorId}，操作人: ${calledBy}`,
    );

    return updatedQueueItem;
  }

  async callSpecificPatient(
    queueItemId: string,
    calledBy: string,
  ) {
    const queueItem = await this.prisma.queueItem.findUnique({
      where: { id: queueItemId },
    });

    if (!queueItem) {
      throw new NotFoundException('队列项不存在');
    }

    if (queueItem.status !== QueueStatus.WAITING) {
      throw new ConflictException('该患者状态无法叫号');
    }

    const updatedQueueItem = await this.prisma.queueItem.update({
      where: { id: queueItemId },
      data: {
        status: QueueStatus.CALLED,
        calledAt: new Date(),
        calledBy,
      },
    });

    await this.prisma.registration.update({
      where: { id: queueItem.registrationId },
      data: {
        status: 'IN_CONSULTATION',
        consultationStartTime: new Date(),
      },
    });

    this.logger.log(
      `叫号: ${queueItem.displayNumber}，操作人: ${calledBy}`,
    );

    return updatedQueueItem;
  }

  async skipPatient(
    queueItemId: string,
    operatorId: string,
  ) {
    const queueItem = await this.prisma.queueItem.findUnique({
      where: { id: queueItemId },
    });

    if (!queueItem) {
      throw new NotFoundException('队列项不存在');
    }

    if (queueItem.status !== QueueStatus.CALLED && queueItem.status !== QueueStatus.WAITING) {
      throw new ConflictException('该患者状态无法跳过');
    }

    const today = this.normalizeDate(new Date());

    const maxSortOrder = await this.prisma.queueItem.aggregate({
      where: {
        doctorId: queueItem.doctorId,
        queueDate: today,
      },
      _max: {
        sortOrder: true,
      },
    });

    const updatedQueueItem = await this.prisma.queueItem.update({
      where: { id: queueItemId },
      data: {
        status: QueueStatus.SKIPPED,
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
      },
    });

    this.logger.log(
      `跳过患者: ${queueItem.displayNumber}，操作人: ${operatorId}`,
    );

    return updatedQueueItem;
  }

  async startConsultation(
    queueItemId: string,
    operatorId: string,
  ) {
    const queueItem = await this.prisma.queueItem.findUnique({
      where: { id: queueItemId },
    });

    if (!queueItem) {
      throw new NotFoundException('队列项不存在');
    }

    if (queueItem.status !== QueueStatus.CALLED) {
      throw new ConflictException('该患者未被叫号');
    }

    const updatedQueueItem = await this.prisma.queueItem.update({
      where: { id: queueItemId },
      data: {
        status: QueueStatus.IN_CONSULTATION,
        consultationStartTime: new Date(),
      },
    });

    this.logger.log(
      `开始就诊: ${queueItem.displayNumber}，操作人: ${operatorId}`,
    );

    return updatedQueueItem;
  }

  async completeConsultation(
    queueItemId: string,
    operatorId: string,
  ) {
    const queueItem = await this.prisma.queueItem.findUnique({
      where: { id: queueItemId },
      include: { registration: true },
    });

    if (!queueItem) {
      throw new NotFoundException('队列项不存在');
    }

    if (queueItem.status !== QueueStatus.IN_CONSULTATION && queueItem.status !== QueueStatus.CALLED) {
      throw new ConflictException('该患者状态无法完成就诊');
    }

    const updatedQueueItem = await this.prisma.queueItem.update({
      where: { id: queueItemId },
      data: {
        status: QueueStatus.COMPLETED,
        consultationEndTime: new Date(),
      },
    });

    if (queueItem.registration) {
      await this.prisma.registration.update({
        where: { id: queueItem.registrationId },
        data: {
          status: 'COMPLETED',
          consultationEndTime: new Date(),
        },
      });
    }

    this.logger.log(
      `完成就诊: ${queueItem.displayNumber}，操作人: ${operatorId}`,
    );

    return updatedQueueItem;
  }

  async getQueuePosition(
    registrationId: string,
  ): Promise<QueuePosition> {
    const queueItem = await this.prisma.queueItem.findUnique({
      where: { registrationId },
    });

    if (!queueItem) {
      throw new NotFoundException('不在队列中');
    }

    const today = this.normalizeDate(new Date());

    const aheadCount = await this.prisma.queueItem.count({
      where: {
        doctorId: queueItem.doctorId,
        queueDate: today,
        status: QueueStatus.WAITING,
        sortOrder: {
          lt: queueItem.sortOrder,
        },
      },
    });

    const position = aheadCount + 1;
    const estimatedWaitTime = aheadCount * this.CONSULTATION_TIME_MINUTES;

    return {
      queueNumber: queueItem.queueNumber,
      displayNumber: queueItem.displayNumber,
      position,
      aheadCount,
      estimatedWaitTime,
    };
  }

  async getDoctorQueue(
    doctorId: string,
    date?: Date,
  ) {
    const queueDate = date ? this.normalizeDate(date) : this.normalizeDate(new Date());

    return this.prisma.queueItem.findMany({
      where: {
        doctorId,
        queueDate,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { isPriority: 'desc' },
        { createdAt: 'asc' },
      ],
      include: {
        registration: {
          include: {
            patient: true,
          },
        },
      },
    });
  }

  async getDepartmentQueue(
    departmentId: string,
    date?: Date,
  ) {
    const queueDate = date ? this.normalizeDate(date) : this.normalizeDate(new Date());

    const doctors = await this.prisma.doctor.findMany({
      where: {
        departmentId,
        isActive: true,
      },
      include: { user: true },
    });

    const results = [];

    for (const doctor of doctors) {
      const queue = await this.prisma.queueItem.findMany({
        where: {
          doctorId: doctor.id,
          queueDate,
        },
        orderBy: [
          { sortOrder: 'asc' },
          { isPriority: 'desc' },
          { createdAt: 'asc' },
        ],
        include: {
          registration: {
            include: {
              patient: true,
            },
          },
        },
      });

      const waitingCount = queue.filter((q) => q.status === QueueStatus.WAITING).length;
      const calledCount = queue.filter((q) => q.status === QueueStatus.CALLED).length;
      const completedCount = queue.filter((q) => q.status === QueueStatus.COMPLETED).length;

      results.push({
        doctorId: doctor.id,
        doctorName: doctor.user?.name || '',
        queue,
        waitingCount,
        calledCount,
        completedCount,
      });
    }

    return results;
  }

  private generateDisplayNumber(departmentId: string, queueNumber: number): string {
    const prefix = departmentId.slice(0, 2).toUpperCase();
    return `${prefix}${String(queueNumber).padStart(3, '0')}`;
  }

  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  async getQueueStatistics(
    doctorId: string,
    date?: Date,
  ) {
    const queueDate = date ? this.normalizeDate(date) : this.normalizeDate(new Date());

    const queue = await this.prisma.queueItem.findMany({
      where: {
        doctorId,
        queueDate,
      },
    });

    const stats = {
      total: queue.length,
      waiting: 0,
      called: 0,
      inConsultation: 0,
      completed: 0,
      skipped: 0,
      averageConsultationTime: 0,
    };

    let totalConsultationTime = 0;
    let consultationCount = 0;

    for (const item of queue) {
      switch (item.status) {
        case QueueStatus.WAITING:
          stats.waiting++;
          break;
        case QueueStatus.CALLED:
          stats.called++;
          break;
        case QueueStatus.IN_CONSULTATION:
          stats.inConsultation++;
          break;
        case QueueStatus.COMPLETED:
          stats.completed++;
          if (item.consultationStartTime && item.consultationEndTime) {
            const duration = (item.consultationEndTime.getTime() - item.consultationStartTime.getTime()) / (1000 * 60);
            totalConsultationTime += duration;
            consultationCount++;
          }
          break;
        case QueueStatus.SKIPPED:
          stats.skipped++;
          break;
      }
    }

    if (consultationCount > 0) {
      stats.averageConsultationTime = Math.round(totalConsultationTime / consultationCount);
    }

    return stats;
  }
}
