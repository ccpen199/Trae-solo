import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SlotStatus } from '@hospital/shared';

@Injectable()
export class SlotEngineService {
  private readonly logger = new Logger(SlotEngineService.name);
  private readonly LOCK_TIMEOUT_SECONDS = 15 * 60;

  constructor(private prisma: PrismaService) {}

  async lockSlot(slotId: string, userId: string) {
    const slot = await this.prisma.timeSlot.findUnique({
      where: { id: slotId },
      include: { schedule: true },
    });

    if (!slot) {
      throw new NotFoundException('号源不存在');
    }

    if (slot.status !== SlotStatus.AVAILABLE) {
      if (slot.status === SlotStatus.LOCKED) {
        if (slot.lockedBy === userId) {
          return slot;
        }
        const lockExpiry = new Date(slot.lockedAt.getTime() + this.LOCK_TIMEOUT_SECONDS * 1000);
        if (new Date() < lockExpiry) {
          throw new ConflictException('号源已被锁定，请稍后再试');
        }
        return this.prisma.timeSlot.update({
          where: { id: slotId },
          data: {
            status: SlotStatus.LOCKED,
            lockedBy: userId,
            lockedAt: new Date(),
          },
        });
      }
      throw new ConflictException('号源不可用');
    }

    const lockedSlot = await this.prisma.timeSlot.update({
      where: { id: slotId },
      data: {
        status: SlotStatus.LOCKED,
        lockedBy: userId,
        lockedAt: new Date(),
      },
    });

    await this.updateScheduleAvailableSlots(slot.scheduleId, -1);

    this.logger.log(`号源 ${slotId} 被用户 ${userId} 锁定`);

    return lockedSlot;
  }

  async releaseSlot(slotId: string, userId?: string) {
    const slot = await this.prisma.timeSlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new NotFoundException('号源不存在');
    }

    if (slot.status === SlotStatus.AVAILABLE) {
      return slot;
    }

    if (userId && slot.lockedBy !== userId) {
      throw new ConflictException('无权释放此号源');
    }

    const releasedSlot = await this.prisma.timeSlot.update({
      where: { id: slotId },
      data: {
        status: SlotStatus.AVAILABLE,
        lockedBy: null,
        lockedAt: null,
      },
    });

    await this.updateScheduleAvailableSlots(slot.scheduleId, 1);

    this.logger.log(`号源 ${slotId} 已释放`);

    return releasedSlot;
  }

  async bookSlot(slotId: string, appointmentId: string, userId: string) {
    const slot = await this.prisma.timeSlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new NotFoundException('号源不存在');
    }

    if (slot.status === SlotStatus.BOOKED) {
      throw new ConflictException('号源已被预约');
    }

    if (slot.status === SlotStatus.LOCKED && slot.lockedBy !== userId) {
      throw new ConflictException('号源已被其他用户锁定');
    }

    const bookedSlot = await this.prisma.timeSlot.update({
      where: { id: slotId },
      data: {
        status: SlotStatus.BOOKED,
        remainingCapacity: {
          decrement: 1,
        },
      },
    });

    this.logger.log(`号源 ${slotId} 已被预约，预约ID: ${appointmentId}`);

    return bookedSlot;
  }

  async checkSlotAvailability(slotId: string) {
    const slot = await this.prisma.timeSlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      return { available: false, status: SlotStatus.CANCELLED };
    }

    if (slot.status === SlotStatus.LOCKED && slot.lockedAt) {
      const lockExpiry = new Date(slot.lockedAt.getTime() + this.LOCK_TIMEOUT_SECONDS * 1000);
      if (new Date() > lockExpiry) {
        await this.releaseSlot(slotId);
        return { available: true, status: SlotStatus.AVAILABLE };
      }
      return {
        available: false,
        status: slot.status,
        lockedAt: slot.lockedAt,
        lockedBy: slot.lockedBy,
      };
    }

    return {
      available: slot.status === SlotStatus.AVAILABLE && slot.remainingCapacity > 0,
      status: slot.status,
    };
  }

  async generateTimeSlots(scheduleId: string, startTime: string, endTime: string, totalSlots: number) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new NotFoundException('排班不存在');
    }

    const existingSlots = await this.prisma.timeSlot.findMany({
      where: { scheduleId },
    });

    if (existingSlots.length > 0) {
      this.logger.warn(`排班 ${scheduleId} 已存在 ${existingSlots.length} 个号源`);
      return existingSlots;
    }

    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const totalMinutes = endMinutes - startMinutes;
    const slotDuration = Math.floor(totalMinutes / totalSlots);

    for (let i = 0; i < totalSlots; i++) {
      const slotStartMinutes = startMinutes + i * slotDuration;
      const slotEndMinutes = startMinutes + (i + 1) * slotDuration;

      const slotStartTime = `${String(Math.floor(slotStartMinutes / 60)).padStart(2, '0')}:${String(slotStartMinutes % 60).padStart(2, '0')}`;
      const slotEndTime = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, '0')}:${String(slotEndMinutes % 60).padStart(2, '0')}`;

      const slot = await this.prisma.timeSlot.create({
        data: {
          doctorId: schedule.doctorId,
          scheduleId,
          date: schedule.scheduleDate,
          startTime: slotStartTime,
          endTime: slotEndTime,
          status: SlotStatus.AVAILABLE,
        },
      });

      slots.push(slot);
    }

    this.logger.log(`为排班 ${scheduleId} 生成了 ${slots.length} 个号源`);

    return slots;
  }

  async releaseExpiredLocks(): Promise<number> {
    const expiryTime = new Date(Date.now() - this.LOCK_TIMEOUT_SECONDS * 1000);

    const expiredSlots = await this.prisma.timeSlot.findMany({
      where: {
        status: SlotStatus.LOCKED,
        lockedAt: {
          lte: expiryTime,
        },
      },
    });

    if (expiredSlots.length === 0) {
      return 0;
    }

    for (const slot of expiredSlots) {
      await this.releaseSlot(slot.id);
    }

    this.logger.log(`释放了 ${expiredSlots.length} 个过期锁定的号源`);

    return expiredSlots.length;
  }

  private async updateScheduleAvailableSlots(scheduleId: string, delta: number): Promise<void> {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      return;
    }

    const newAvailableSlots = Math.max(0, Math.min(schedule.maxPatients, schedule.availableSlots + delta));

    await this.prisma.schedule.update({
      where: { id: scheduleId },
      data: { availableSlots: newAvailableSlots },
    });
  }

  async getSlotStatsBySchedule(scheduleId: string) {
    const slots = await this.prisma.timeSlot.findMany({
      where: { scheduleId },
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
}
