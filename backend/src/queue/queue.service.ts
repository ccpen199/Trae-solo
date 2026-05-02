import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueStatus } from '@hospital/shared';
import { QueueEngineService } from '../engines/queue-engine.service';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    private prisma: PrismaService,
    private queueEngine: QueueEngineService,
  ) {}

  async findAll(): Promise<QueueItem[]> {
    return this.prisma.queueItem.findMany({
      include: {
        registration: { include: { patient: true, doctor: { include: { user: true } } },
        doctor: { include: { user: true } },
        department: true,
      },
      orderBy: [{ queueDate: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  async findById(id: string): Promise<QueueItem> {
    const queueItem = await this.prisma.queueItem.findUnique({
      where: { id },
      include: {
        registration: { include: { patient: true, doctor: { include: { user: true } } },
        doctor: { include: { user: true } },
        department: true,
      },
    });

    if (!queueItem) {
      throw new NotFoundException('队列项不存在');
    }

    return queueItem;
  }

  async addToQueue(
    registrationId: string,
    doctorId: string,
    departmentId: string,
    isPriority: boolean = false,
    priorityReason?: string,
  ): Promise<QueueItem> {
    return this.queueEngine.addToQueue(
      registrationId,
      doctorId,
      departmentId,
      isPriority,
      priorityReason,
    );
  }

  async callNextPatient(doctorId: string, calledBy: string): Promise<QueueItem | null> {
    return this.queueEngine.callNextPatient(doctorId, calledBy);
  }

  async callSpecificPatient(queueItemId: string, calledBy: string): Promise<QueueItem> {
    return this.queueEngine.callSpecificPatient(queueItemId, calledBy);
  }

  async skipPatient(queueItemId: string, operatorId: string): Promise<QueueItem> {
    return this.queueEngine.skipPatient(queueItemId, operatorId);
  }

  async startConsultation(queueItemId: string, operatorId: string): Promise<QueueItem> {
    return this.queueEngine.startConsultation(queueItemId, operatorId);
  }

  async completeConsultation(queueItemId: string, operatorId: string): Promise<QueueItem> {
    return this.queueEngine.completeConsultation(queueItemId, operatorId);
  }

  async getQueuePosition(registrationId: string): Promise<any> {
    return this.queueEngine.getQueuePosition(registrationId);
  }

  async getDoctorQueue(doctorId: string, date?: Date): Promise<QueueItem[]> {
    return this.queueEngine.getDoctorQueue(doctorId, date);
  }

  async getDepartmentQueue(departmentId: string, date?: Date): Promise<any[]> {
    return this.queueEngine.getDepartmentQueue(departmentId, date);
  }

  async updateStatus(id: string, status: QueueStatus): Promise<QueueItem> {
    const queueItem = await this.findById(id);

    if (queueItem.status === status) {
      return queueItem;
    }

    const updatedQueueItem = await this.prisma.queueItem.update({
      where: { id },
      data: { status },
      include: {
        registration: { include: { patient: true } },
        doctor: { include: { user: true } },
        department: true,
      },
    });

    this.logger.log(`队列项 ${id} 状态更新为: ${status}`);

    return updatedQueueItem;
  }

  async getStatistics(doctorId: string, date?: Date): Promise<any> {
    return this.queueEngine.getQueueStatistics(doctorId, date);
  }

  async getTodayQueues(): Promise<{
    departmentId: string;
    departmentName: string;
    doctorId: string;
    doctorName: string;
    waiting: number;
    called: number;
    inConsultation: number;
    completed: number;
    total: number;
  }[]> {
    const today = this.normalizeDate(new Date());

    const departments = await this.prisma.department.findMany({
      where: { isActive: true },
      include: {
        doctors: {
          where: { isActive: true },
          include: { user: true },
        },
      },
    });

    const results = [];

    for (const department of departments) {
      for (const doctor of department.doctors) {
        const stats = await this.queueEngine.getQueueStatistics(doctor.id, today);

        results.push({
          departmentId: department.id,
          departmentName: department.name,
          doctorId: doctor.id,
          doctorName: doctor.user?.name || '',
          waiting: stats.waiting,
          called: stats.called,
          inConsultation: stats.inConsultation,
          completed: stats.completed,
          total: stats.total,
        });
      }
    }

    return results;
  }

  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }
}
