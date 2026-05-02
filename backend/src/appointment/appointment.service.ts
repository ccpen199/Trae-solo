import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Appointment } from '@prisma/client';
import { AppointmentStatus, RegistrationStatus, PaymentStatus } from '@hospital/shared';
import { SlotEngineService } from '../engines/slot-engine.service';

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    private prisma: PrismaService,
    private slotEngine: SlotEngineService,
  ) {}

  async findAll(): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
        schedule: true,
        slot: true,
        registration: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Appointment> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
        schedule: true,
        slot: true,
        registration: true,
        payment: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }

    return appointment;
  }

  async findByPatient(patientId: string): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: { include: { user: true } },
        department: true,
        schedule: true,
        slot: true,
        registration: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDoctor(doctorId: string, startDate?: Date, endDate?: Date): Promise<Appointment[]> {
    const where: any = { doctorId };

    if (startDate) {
      where.appointmentDate = { gte: startDate };
    }
    if (endDate) {
      where.appointmentDate = { ...where.appointmentDate, lte: endDate };
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        department: true,
        schedule: true,
        slot: true,
        registration: true,
        payment: true,
      },
      orderBy: [{ appointmentDate: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(data: {
    patientId: string;
    doctorId: string;
    departmentId: string;
    scheduleId: string;
    slotId: string;
    appointmentDate: Date;
    notes?: string;
  }): Promise<Appointment> {
    const slot = await this.prisma.timeSlot.findUnique({
      where: { id: data.slotId },
      include: { schedule: true },
    });

    if (!slot) {
      throw new NotFoundException('号源不存在');
    }

    const slotAvailability = await this.slotEngine.checkSlotAvailability(data.slotId);
    if (!slotAvailability.available) {
      if (slotAvailability.status === 'LOCKED' && slotAvailability.lockedBy !== data.patientId) {
        throw new ConflictException('号源已被其他用户锁定');
      }
      if (slotAvailability.status === 'BOOKED') {
        throw new ConflictException('号源已被预约');
      }
    }

    const existingAppointment = await this.prisma.appointment.findFirst({
      where: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        appointmentDate: data.appointmentDate,
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED] },
      },
    });

    if (existingAppointment) {
      throw new ConflictException('您已预约该医生同一天的号源');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        departmentId: data.departmentId,
        scheduleId: data.scheduleId,
        slotId: data.slotId,
        appointmentDate: data.appointmentDate,
        status: AppointmentStatus.PENDING,
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

    await this.slotEngine.bookSlot(data.slotId, appointment.id, data.patientId);

    this.logger.log(`预约创建成功: 患者 ${data.patientId}，医生 ${data.doctorId}，日期 ${data.appointmentDate}`);

    return appointment;
  }

  async cancel(id: string, cancelReason: string, userId: string): Promise<Appointment> {
    const appointment = await this.findById(id);

    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED
    ) {
      throw new ConflictException('该预约状态无法取消');
    }

    const cancelledAppointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelReason,
        cancelledAt: new Date(),
      },
      include: {
        slot: true,
        registration: true,
      },
    });

    if (appointment.slotId) {
      await this.slotEngine.releaseSlot(appointment.slotId);
    }

    if (cancelledAppointment.registration) {
      await this.prisma.registration.update({
        where: { id: cancelledAppointment.registration.id },
        data: { status: RegistrationStatus.CANCELLED },
      });
    }

    this.logger.log(`预约 ${id} 已取消，原因: ${cancelReason}，操作人: ${userId}`);

    return this.findById(id);
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    const appointment = await this.findById(id);

    if (appointment.status === status) {
      return appointment;
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id },
      data: { status },
    });

    this.logger.log(`预约 ${id} 状态更新为: ${status}`);

    return updatedAppointment;
  }

  async getStatistics(date?: Date): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    checkedIn: number;
    inConsultation: number;
    completed: number;
    cancelled: number;
    noShow: number;
  }> {
    const normalizedDate = date ? this.normalizeDate(date) : this.normalizeDate(new Date());

    const where: any = {
      appointmentDate: {
        gte: normalizedDate,
        lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
      },
    };

    const stats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      checkedIn: 0,
      inConsultation: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
    };

    const appointments = await this.prisma.appointment.findMany({ where });

    stats.total = appointments.length;

    for (const appointment of appointments) {
      switch (appointment.status) {
        case AppointmentStatus.PENDING:
          stats.pending++;
          break;
        case AppointmentStatus.CONFIRMED:
          stats.confirmed++;
          break;
        case AppointmentStatus.CHECKED_IN:
          stats.checkedIn++;
          break;
        case AppointmentStatus.IN_CONSULTATION:
          stats.inConsultation++;
          break;
        case AppointmentStatus.COMPLETED:
          stats.completed++;
          break;
        case AppointmentStatus.CANCELLED:
          stats.cancelled++;
          break;
        case AppointmentStatus.NO_SHOW:
          stats.noShow++;
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
