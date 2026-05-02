import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Schedule, Doctor, Department } from '@prisma/client';
import { ScheduleType } from '@hospital/shared';
import { ScheduleConflictEngineService } from '../engines/schedule-conflict-engine.service';
import { SlotEngineService } from '../engines/slot-engine.service';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    private prisma: PrismaService,
    private conflictEngine: ScheduleConflictEngineService,
    private slotEngine: SlotEngineService,
  ) {}

  async findAll(): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: { isActive: true },
      include: {
        doctor: { include: { user: true, department: true } },
        department: true,
        slots: true,
      },
      orderBy: [{ date: 'desc' }, { type: 'asc' }],
    });
  }

  async findById(id: string): Promise<Schedule> {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        doctor: { include: { user: true, department: true } },
        department: true,
        slots: true,
        appointments: { include: { patient: true } },
      },
    });

    if (!schedule) {
      throw new NotFoundException('排班不存在');
    }

    return schedule;
  }

  async findByDoctor(doctorId: string, startDate?: Date, endDate?: Date): Promise<Schedule[]> {
    const where: any = {
      doctorId,
      isActive: true,
    };

    if (startDate) {
      where.date = { gte: startDate };
    }
    if (endDate) {
      where.date = { ...where.date, lte: endDate };
    }

    return this.prisma.schedule.findMany({
      where,
      include: {
        doctor: { include: { user: true } },
        department: true,
        slots: true,
      },
      orderBy: [{ date: 'asc' }, { type: 'asc' }],
    });
  }

  async findByDepartment(departmentId: string, startDate?: Date, endDate?: Date): Promise<Schedule[]> {
    const where: any = {
      departmentId,
      isActive: true,
    };

    if (startDate) {
      where.date = { gte: startDate };
    }
    if (endDate) {
      where.date = { ...where.date, lte: endDate };
    }

    return this.prisma.schedule.findMany({
      where,
      include: {
        doctor: { include: { user: true } },
        department: true,
        slots: true,
      },
      orderBy: [{ date: 'asc' }, { doctorId: 'asc' }, { type: 'asc' }],
    });
  }

  async create(data: {
    doctorId: string;
    departmentId: string;
    date: Date;
    type: ScheduleType;
    startTime: string;
    endTime: string;
    totalSlots: number;
    roomNumber?: string;
  }): Promise<Schedule> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: data.doctorId },
      include: { user: true },
    });

    if (!doctor) {
      throw new NotFoundException('医生不存在');
    }

    const department = await this.prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department) {
      throw new NotFoundException('科室不存在');
    }

    const conflicts = await this.conflictEngine.checkConflicts(
      data.doctorId,
      data.date,
      data.type,
      data.startTime,
      data.endTime,
    );

    if (conflicts.length > 0) {
      throw new ConflictException({
        message: '排班冲突',
        conflicts,
        suggestions: this.conflictEngine.getConflictSuggestions(conflicts),
      });
    }

    const schedule = await this.prisma.schedule.create({
      data: {
        doctorId: data.doctorId,
        departmentId: data.departmentId,
        date: data.date,
        type: data.type,
        startTime: data.startTime,
        endTime: data.endTime,
        totalSlots: data.totalSlots,
        availableSlots: data.totalSlots,
        roomNumber: data.roomNumber,
      },
      include: {
        doctor: { include: { user: true } },
        department: true,
      },
    });

    await this.slotEngine.generateTimeSlots(
      schedule.id,
      data.startTime,
      data.endTime,
      data.totalSlots,
    );

    this.logger.log(
      `排班创建成功: 医生 ${doctor.user?.name}，日期 ${data.date.toISOString().split('T')[0]}，时段 ${data.type}`,
    );

    return this.findById(schedule.id);
  }

  async update(
    id: string,
    data: Partial<{
      date: Date;
      type: ScheduleType;
      startTime: string;
      endTime: string;
      totalSlots: number;
      roomNumber: string;
      isActive: boolean;
    }>,
  ): Promise<Schedule> {
    const schedule = await this.findById(id);

    if (data.date || data.type || data.startTime || data.endTime) {
      const appointmentsCount = await this.prisma.appointment.count({
        where: { scheduleId: id },
      });

      if (appointmentsCount > 0) {
        throw new ConflictException(`该排班已有 ${appointmentsCount} 个预约，无法修改时间`);
      }
    }

    if (data.date || data.type || data.startTime || data.endTime) {
      const conflicts = await this.conflictEngine.checkConflicts(
        schedule.doctorId,
        data.date || schedule.date,
        data.type || schedule.type,
        data.startTime || schedule.startTime,
        data.endTime || schedule.endTime,
        id,
      );

      if (conflicts.length > 0) {
        throw new ConflictException({
          message: '排班冲突',
          conflicts,
          suggestions: this.conflictEngine.getConflictSuggestions(conflicts),
        });
      }
    }

    const updatedSchedule = await this.prisma.schedule.update({
      where: { id },
      data,
      include: {
        doctor: { include: { user: true } },
        department: true,
        slots: true,
      },
    });

    this.logger.log(`排班 ${id} 更新成功`);

    return updatedSchedule;
  }

  async delete(id: string): Promise<void> {
    const schedule = await this.findById(id);

    const appointmentsCount = await this.prisma.appointment.count({
      where: { scheduleId: id },
    });

    if (appointmentsCount > 0) {
      throw new ConflictException(`该排班已有 ${appointmentsCount} 个预约，无法删除`);
    }

    await this.prisma.timeSlot.deleteMany({
      where: { scheduleId: id },
    });

    await this.prisma.schedule.delete({
      where: { id },
    });

    this.logger.log(`排班 ${id} 已删除`);
  }

  async softDelete(id: string): Promise<Schedule> {
    return this.update(id, { isActive: false });
  }

  async getAvailableSchedules(
    departmentId: string,
    doctorId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<(Schedule & { doctor: Doctor & { user: any }; department: Department })[]> {
    const where: any = {
      departmentId,
      isActive: true,
      availableSlots: { gt: 0 },
    };

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (startDate) {
      where.date = { gte: startDate };
    }
    if (endDate) {
      where.date = { ...where.date, lte: endDate };
    }

    return this.prisma.schedule.findMany({
      where,
      include: {
        doctor: { include: { user: true, department: true } },
        department: true,
        slots: {
          where: { status: 'AVAILABLE' },
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: [{ date: 'asc' }, { doctorId: 'asc' }, { type: 'asc' }],
    });
  }

  async getStatistics(date?: Date): Promise<{
    total: number;
    active: number;
    byType: { type: string; count: number }[];
    totalSlots: number;
    availableSlots: number;
    bookedSlots: number;
  }> {
    const normalizedDate = date ? this.normalizeDate(date) : this.normalizeDate(new Date());

    const where: any = {
      date: {
        gte: normalizedDate,
        lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
      },
    };

    const total = await this.prisma.schedule.count({ where });
    const active = await this.prisma.schedule.count({ where: { ...where, isActive: true } });

    const byType = await this.prisma.schedule.groupBy({
      by: ['type'],
      _count: { id: true },
      _sum: { totalSlots: true, availableSlots: true },
      where,
    });

    const totalSlots = byType.reduce((sum, item) => sum + (item._sum.totalSlots || 0), 0);
    const availableSlots = byType.reduce((sum, item) => sum + (item._sum.availableSlots || 0), 0);
    const bookedSlots = totalSlots - availableSlots;

    return {
      total,
      active,
      byType: byType.map((item) => ({
        type: item.type,
        count: item._count.id,
      })),
      totalSlots,
      availableSlots,
      bookedSlots,
    };
  }

  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }
}
