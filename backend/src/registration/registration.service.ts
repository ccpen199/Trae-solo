import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Registration } from '@prisma/client';
import { RegistrationStatus, AppointmentStatus, PaymentStatus, PaymentMethod } from '@hospital/shared';
import { QueueEngineService } from '../engines/queue-engine.service';

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    private prisma: PrismaService,
    private queueEngine: QueueEngineService,
  ) {}

  async findAll(): Promise<Registration[]> {
    return this.prisma.registration.findMany({
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
        schedule: true,
        slot: true,
        appointment: true,
        payment: true,
        queueItem: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Registration> {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
        schedule: true,
        slot: true,
        appointment: true,
        payment: true,
        queueItem: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('挂号记录不存在');
    }

    return registration;
  }

  async findByPatient(patientId: string): Promise<Registration[]> {
    return this.prisma.registration.findMany({
      where: { patientId },
      include: {
        doctor: { include: { user: true } },
        department: true,
        schedule: true,
        slot: true,
        payment: true,
        queueItem: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDoctor(doctorId: string, date?: Date): Promise<Registration[]> {
    const where: any = { doctorId };

    if (date) {
      const normalizedDate = this.normalizeDate(date);
      where.registrationDate = {
        gte: normalizedDate,
        lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    return this.prisma.registration.findMany({
      where,
      include: {
        patient: true,
        department: true,
        schedule: true,
        slot: true,
        payment: true,
        queueItem: true,
      },
      orderBy: [{ registrationDate: 'asc' }, { queueNumber: 'asc' }],
    });
  }

  async findByQueueNumber(doctorId: string, queueNumber: number, date?: Date): Promise<Registration | null> {
    const normalizedDate = date ? this.normalizeDate(date) : this.normalizeDate(new Date());

    return this.prisma.registration.findFirst({
      where: {
        doctorId,
        queueNumber,
        registrationDate: {
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
    });
  }

  async createFromAppointment(appointmentId: string): Promise<Registration> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: true,
        department: true,
        schedule: true,
        slot: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new ConflictException('预约已取消，无法挂号');
    }

    const existingRegistration = await this.prisma.registration.findFirst({
      where: { appointmentId },
    });

    if (existingRegistration) {
      throw new ConflictException('该预约已创建挂号记录');
    }

    const normalizedDate = this.normalizeDate(appointment.appointmentDate);

    const maxQueueNumber = await this.prisma.registration.aggregate({
      where: {
        doctorId: appointment.doctorId,
        registrationDate: {
          gte: normalizedDate,
          lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      _max: { queueNumber: true },
    });

    const queueNumber = (maxQueueNumber._max.queueNumber || 0) + 1;

    const registration = await this.prisma.registration.create({
      data: {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        departmentId: appointment.departmentId,
        scheduleId: appointment.scheduleId,
        slotId: appointment.slotId,
        registrationDate: appointment.appointmentDate,
        queueNumber,
        status: RegistrationStatus.PENDING,
        registrationType: 'ONLINE',
        fee: appointment.doctor?.consultationFee || 50,
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
        schedule: true,
        slot: true,
        appointment: true,
      },
    });

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.CONFIRMED },
    });

    this.logger.log(
      `挂号创建成功: 患者 ${appointment.patientId}，医生 ${appointment.doctorId}，队列号 ${queueNumber}`,
    );

    return registration;
  }

  async createOnSite(data: {
    patientId: string;
    doctorId: string;
    departmentId: string;
    scheduleId: string;
    slotId: string;
    registrationDate: Date;
    fee: number;
    isInsurance?: boolean;
    notes?: string;
  }): Promise<Registration> {
    const normalizedDate = this.normalizeDate(data.registrationDate);

    const maxQueueNumber = await this.prisma.registration.aggregate({
      where: {
        doctorId: data.doctorId,
        registrationDate: {
          gte: normalizedDate,
          lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      _max: { queueNumber: true },
    });

    const queueNumber = (maxQueueNumber._max.queueNumber || 0) + 1;

    const registration = await this.prisma.registration.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        departmentId: data.departmentId,
        scheduleId: data.scheduleId,
        slotId: data.slotId,
        registrationDate: data.registrationDate,
        queueNumber,
        status: RegistrationStatus.PENDING,
        registrationType: 'ON_SITE',
        fee: data.fee,
        isInsurance: data.isInsurance || false,
        notes: data.notes,
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
        schedule: true,
        slot: true,
      },
    });

    this.logger.log(
      `现场挂号创建成功: 患者 ${data.patientId}，医生 ${data.doctorId}，队列号 ${queueNumber}`,
    );

    return registration;
  }

  async updateStatus(id: string, status: RegistrationStatus): Promise<Registration> {
    const registration = await this.findById(id);

    if (registration.status === status) {
      return registration;
    }

    const updatedRegistration = await this.prisma.registration.update({
      where: { id },
      data: { status },
    });

    this.logger.log(`挂号 ${id} 状态更新为: ${status}`);

    return updatedRegistration;
  }

  async cancel(id: string, userId: string): Promise<Registration> {
    const registration = await this.findById(id);

    if (
      registration.status === RegistrationStatus.CANCELLED ||
      registration.status === RegistrationStatus.REFUNDED ||
      registration.status === RegistrationStatus.COMPLETED
    ) {
      throw new ConflictException('该挂号状态无法取消');
    }

    if (registration.queueItem) {
      throw new ConflictException('患者已在队列中，无法取消挂号');
    }

    const cancelledRegistration = await this.prisma.registration.update({
      where: { id },
      data: { status: RegistrationStatus.CANCELLED },
    });

    if (registration.appointmentId) {
      await this.prisma.appointment.update({
        where: { id: registration.appointmentId },
        data: { status: AppointmentStatus.CANCELLED },
      });
    }

    this.logger.log(`挂号 ${id} 已取消，操作人: ${userId}`);

    return this.findById(id);
  }

  async getStatistics(date?: Date): Promise<{
    total: number;
    pending: number;
    paid: number;
    checkedIn: number;
    inConsultation: number;
    completed: number;
    cancelled: number;
    refunded: number;
    totalFee: number;
  }> {
    const normalizedDate = date ? this.normalizeDate(date) : this.normalizeDate(new Date());

    const where: any = {
      registrationDate: {
        gte: normalizedDate,
        lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
      },
    };

    const stats = {
      total: 0,
      pending: 0,
      paid: 0,
      checkedIn: 0,
      inConsultation: 0,
      completed: 0,
      cancelled: 0,
      refunded: 0,
      totalFee: 0,
    };

    const registrations = await this.prisma.registration.findMany({ where });

    stats.total = registrations.length;

    for (const registration of registrations) {
      stats.totalFee += registration.fee.toNumber();

      switch (registration.status) {
        case RegistrationStatus.PENDING:
          stats.pending++;
          break;
        case RegistrationStatus.PAID:
          stats.paid++;
          break;
        case RegistrationStatus.CHECKED_IN:
          stats.checkedIn++;
          break;
        case RegistrationStatus.IN_CONSULTATION:
          stats.inConsultation++;
          break;
        case RegistrationStatus.COMPLETED:
          stats.completed++;
          break;
        case RegistrationStatus.CANCELLED:
          stats.cancelled++;
          break;
        case RegistrationStatus.REFUNDED:
          stats.refunded++;
          break;
      }
    }

    return stats;
  }

  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }
}
