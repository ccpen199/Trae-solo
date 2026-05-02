import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrationStatus, QueueStatus, AppointmentStatus } from '@hospital/shared';

@Injectable()
export class ConsultationService {
  private readonly logger = new Logger(ConsultationService.name);

  constructor(private prisma: PrismaService) {}

  async startConsultation(registrationId: string, operatorId: string): Promise<any> {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
        queueItem: true,
        appointment: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('挂号记录不存在');
    }

    if (registration.status === RegistrationStatus.IN_CONSULTATION) {
      throw new ConflictException('已在就诊中');
    }

    if (registration.status === RegistrationStatus.COMPLETED) {
      throw new ConflictException('就诊已完成');
    }

    if (registration.status !== RegistrationStatus.CHECKED_IN) {
      throw new ConflictException('请先完成签到');
    }

    const updatedRegistration = await this.prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: RegistrationStatus.IN_CONSULTATION,
        consultationStartTime: new Date(),
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
      },
    });

    if (registration.queueItem) {
      await this.prisma.queueItem.update({
        where: { id: registration.queueItem.id },
        data: {
          status: QueueStatus.IN_CONSULTATION,
          consultationStartTime: new Date(),
        },
      });
    }

    if (registration.appointmentId) {
      await this.prisma.appointment.update({
        where: { id: registration.appointmentId },
        data: { status: AppointmentStatus.IN_CONSULTATION },
      });
    }

    this.logger.log(
      `开始就诊: 患者 ${registration.patientId}，医生 ${registration.doctorId}`,
    );

    return updatedRegistration;
  }

  async completeConsultation(
    registrationId: string,
    operatorId: string,
    notes?: string,
  ): Promise<any> {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
        queueItem: true,
        appointment: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('挂号记录不存在');
    }

    if (registration.status === RegistrationStatus.COMPLETED) {
      throw new ConflictException('就诊已完成');
    }

    if (
      registration.status !== RegistrationStatus.IN_CONSULTATION &&
      registration.status !== RegistrationStatus.CHECKED_IN
    ) {
      throw new ConflictException('就诊状态不正确');
    }

    const updatedRegistration = await this.prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: RegistrationStatus.COMPLETED,
        consultationEndTime: new Date(),
        notes: notes || registration.notes,
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
      },
    });

    if (registration.queueItem) {
      await this.prisma.queueItem.update({
        where: { id: registration.queueItem.id },
        data: {
          status: QueueStatus.COMPLETED,
          consultationEndTime: new Date(),
        },
      });
    }

    if (registration.appointmentId) {
      await this.prisma.appointment.update({
        where: { id: registration.appointmentId },
        data: { status: AppointmentStatus.COMPLETED },
      });
    }

    this.logger.log(
      `完成就诊: 患者 ${registration.patientId}，医生 ${registration.doctorId}`,
    );

    return updatedRegistration;
  }

  async getOngoingConsultations(doctorId?: string): Promise<any[]> {
    const where: any = {
      status: RegistrationStatus.IN_CONSULTATION,
    };

    if (doctorId) {
      where.doctorId = doctorId;
    }

    return this.prisma.registration.findMany({
      where,
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
        queueItem: true,
      },
      orderBy: { consultationStartTime: 'asc' },
    });
  }

  async getTodayConsultations(date?: Date): Promise<any[]> {
    const normalizedDate = date ? this.normalizeDate(date) : this.normalizeDate(new Date());

    return this.prisma.registration.findMany({
      where: {
        registrationDate: {
          gte: normalizedDate,
          lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
        },
        status: {
          in: [
            RegistrationStatus.CHECKED_IN,
            RegistrationStatus.IN_CONSULTATION,
            RegistrationStatus.COMPLETED,
          ],
        },
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
        queueItem: true,
      },
      orderBy: [
        { queueNumber: 'asc' },
        { registrationDate: 'asc' },
      ],
    });
  }

  async getStatistics(date?: Date): Promise<{
    total: number;
    checkedIn: number;
    inConsultation: number;
    completed: number;
    averageDuration: number;
  }> {
    const normalizedDate = date ? this.normalizeDate(date) : this.normalizeDate(new Date());

    const registrations = await this.prisma.registration.findMany({
      where: {
        registrationDate: {
          gte: normalizedDate,
          lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
        },
        status: {
          notIn: [RegistrationStatus.PENDING, RegistrationStatus.CANCELLED, RegistrationStatus.REFUNDED],
        },
      },
    });

    const stats = {
      total: registrations.length,
      checkedIn: 0,
      inConsultation: 0,
      completed: 0,
      averageDuration: 0,
    };

    let totalDuration = 0;
    let durationCount = 0;

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
          if (registration.consultationStartTime && registration.consultationEndTime) {
            const duration =
              (registration.consultationEndTime.getTime() - registration.consultationStartTime.getTime()) /
              (1000 * 60);
            totalDuration += duration;
            durationCount++;
          }
          break;
      }
    }

    if (durationCount > 0) {
      stats.averageDuration = Math.round(totalDuration / durationCount);
    }

    return stats;
  }

  async getDoctorStatistics(doctorId: string, date?: Date): Promise<{
    total: number;
    checkedIn: number;
    inConsultation: number;
    completed: number;
    averageDuration: number;
  }> {
    const normalizedDate = date ? this.normalizeDate(date) : this.normalizeDate(new Date());

    const registrations = await this.prisma.registration.findMany({
      where: {
        doctorId,
        registrationDate: {
          gte: normalizedDate,
          lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
        },
        status: {
          notIn: [RegistrationStatus.PENDING, RegistrationStatus.CANCELLED, RegistrationStatus.REFUNDED],
        },
      },
    });

    const stats = {
      total: registrations.length,
      checkedIn: 0,
      inConsultation: 0,
      completed: 0,
      averageDuration: 0,
    };

    let totalDuration = 0;
    let durationCount = 0;

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
          if (registration.consultationStartTime && registration.consultationEndTime) {
            const duration =
              (registration.consultationEndTime.getTime() - registration.consultationStartTime.getTime()) /
              (1000 * 60);
            totalDuration += duration;
            durationCount++;
          }
          break;
      }
    }

    if (durationCount > 0) {
      stats.averageDuration = Math.round(totalDuration / durationCount);
    }

    return stats;
  }

  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }
}
