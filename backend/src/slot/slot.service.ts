import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimeSlot } from '@prisma/client';
import { SlotStatus } from '@hospital/shared';
import { SlotEngineService } from '../engines/slot-engine.service';

@Injectable()
export class SlotService {
  private readonly logger = new Logger(SlotService.name);

  constructor(
    private prisma: PrismaService,
    private slotEngine: SlotEngineService,
  ) {}

  async findAll(): Promise<TimeSlot[]> {
    return this.prisma.timeSlot.findMany({
      include: {
        schedule: { include: { doctor: { include: { user: true } }, department: true },
        appointment: { include: { patient: true } },
      },
      orderBy: [{ scheduleId: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findById(id: string): Promise<TimeSlot> {
    const slot = await this.prisma.timeSlot.findUnique({
      where: { id },
      include: {
        schedule: { include: { doctor: { include: { user: true } }, department: true },
        appointment: { include: { patient: true } },
      },
    });

    if (!slot) {
      throw new NotFoundException('号源不存在');
    }

    return slot;
  }

  async findBySchedule(scheduleId: string): Promise<TimeSlot[]> {
    return this.prisma.timeSlot.findMany({
      where: { scheduleId },
      include: {
        appointment: { include: { patient: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async getAvailableBySchedule(scheduleId: string): Promise<TimeSlot[]> {
    return this.prisma.timeSlot.findMany({
      where: {
        scheduleId,
        status: SlotStatus.AVAILABLE,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async checkAvailability(slotId: string): Promise<{
    available: boolean;
    status: SlotStatus;
    lockedAt?: Date;
    lockedBy?: string;
    lockExpiresAt?: Date;
  }> {
    const result = await this.slotEngine.checkSlotAvailability(slotId);

    if (result.status === SlotStatus.LOCKED && result.lockedAt) {
      const lockExpiresAt = new Date(result.lockedAt.getTime() + 15 * 60 * 1000);
      return {
        ...result,
        lockExpiresAt,
      };
    }

    return result;
  }

  async lockSlot(slotId: string, userId: string): Promise<TimeSlot> {
    return this.slotEngine.lockSlot(slotId, userId);
  }

  async releaseSlot(slotId: string, userId?: string): Promise<TimeSlot> {
    return this.slotEngine.releaseSlot(slotId, userId);
  }

  async bookSlot(slotId: string, appointmentId: string, userId: string): Promise<TimeSlot> {
    return this.slotEngine.bookSlot(slotId, appointmentId, userId);
  }

  async getStatsBySchedule(scheduleId: string): Promise<{
    total: number;
    available: number;
    locked: number;
    booked: number;
    cancelled: number;
  }> {
    return this.slotEngine.getSlotStatsBySchedule(scheduleId);
  }

  async getStatsByDepartment(departmentId: string, date?: Date): Promise<{
    total: number;
    available: number;
    locked: number;
    booked: number;
    cancelled: number;
  }> {
    const normalizedDate = date ? this.normalizeDate(date) : this.normalizeDate(new Date());

    const where: any = {
      schedule: {
        departmentId,
        isActive: true,
        date: {
          gte: normalizedDate,
          lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    };

    const slots = await this.prisma.timeSlot.findMany({
      where,
    });

    const stats = {
      total: slots.length,
      available: 0,
      locked: 0,
      booked: 0,
      cancelled: 0,
    };

    for (const slot of slots) {
      switch (slot.status) {
        case SlotStatus.AVAILABLE:
          stats.available++;
          break;
        case SlotStatus.LOCKED:
          stats.locked++;
          break;
        case SlotStatus.BOOKED:
          stats.booked++;
          break;
        case SlotStatus.CANCELLED:
          stats.cancelled++;
          break;
      }
    }

    return stats;
  }

  async releaseExpiredLocks(): Promise<number> {
    return this.slotEngine.releaseExpiredLocks();
  }

  async updateSlotStatus(slotId: string, status: SlotStatus): Promise<TimeSlot> {
    const slot = await this.findById(slotId);

    if (slot.status === status) {
      return slot;
    }

    const updatedSlot = await this.prisma.timeSlot.update({
      where: { id: slotId },
      data: { status },
    });

    this.logger.log(`号源 ${slotId} 状态更新为: ${status}`);

    return updatedSlot;
  }

  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }
}
