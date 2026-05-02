import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleType } from '@hospital/shared';

interface ScheduleConflict {
  type: 'TIME_OVERLAP' | 'DOCTOR_UNAVAILABLE' | 'ROOM_CONFLICT' | 'SLOT_EXCEEDED';
  message: string;
  conflictingScheduleId?: string;
  details: {
    startTime: string;
    endTime: string;
    date: Date;
  };
}

@Injectable()
export class ScheduleConflictEngineService {
  private readonly logger = new Logger(ScheduleConflictEngineService.name);

  constructor(private prisma: PrismaService) {}

  async checkScheduleConflict(
    doctorId: string,
    date: Date,
    type: ScheduleType,
    startTime: string,
    endTime: string,
    roomNumber?: string,
    excludeScheduleId?: string,
  ): Promise<{ hasConflict: boolean; conflicts: ScheduleConflict[] }> {
    const conflicts: ScheduleConflict[] = [];

    const dateOnly = this.normalizeDate(date);

    const existingSchedules = await this.prisma.schedule.findMany({
      where: {
        doctorId,
        date: dateOnly,
        id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
        isActive: true,
      },
    });

    for (const schedule of existingSchedules) {
      const timeConflict = this.checkTimeOverlap(
        startTime,
        endTime,
        schedule.startTime,
        schedule.endTime,
      );

      if (timeConflict) {
        conflicts.push({
          type: 'TIME_OVERLAP',
          message: `与现有排班时间冲突: ${schedule.startTime} - ${schedule.endTime}`,
          conflictingScheduleId: schedule.id,
          details: {
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            date: schedule.date,
          },
        });
      }

      const typeConflict = this.checkScheduleTypeConflict(type, schedule.type);
      if (typeConflict) {
        conflicts.push({
          type: 'TIME_OVERLAP',
          message: `与现有排班类型冲突: ${this.getScheduleTypeName(schedule.type)}`,
          conflictingScheduleId: schedule.id,
          details: {
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            date: schedule.date,
          },
        });
      }
    }

    if (roomNumber) {
      const roomConflicts = await this.checkRoomConflict(
        dateOnly,
        startTime,
        endTime,
        roomNumber,
        excludeScheduleId,
      );
      conflicts.push(...roomConflicts);
    }

    const doctorConflicts = await this.checkDoctorUnavailability(
      doctorId,
      dateOnly,
      startTime,
      endTime,
    );
    conflicts.push(...doctorConflicts);

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  private checkTimeOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    const [s1h, s1m] = start1.split(':').map(Number);
    const [e1h, e1m] = end1.split(':').map(Number);
    const [s2h, s2m] = start2.split(':').map(Number);
    const [e2h, e2m] = end2.split(':').map(Number);

    const t1s = s1h * 60 + s1m;
    const t1e = e1h * 60 + e1m;
    const t2s = s2h * 60 + s2m;
    const t2e = e2h * 60 + e2m;

    return !(t1e <= t2s || t1s >= t2e);
  }

  private checkScheduleTypeConflict(
    newType: ScheduleType,
    existingType: ScheduleType,
  ): boolean {
    if (newType === ScheduleType.FULL_DAY) {
      return true;
    }

    if (existingType === ScheduleType.FULL_DAY) {
      return true;
    }

    return newType === existingType;
  }

  private getScheduleTypeName(type: ScheduleType): string {
    const names: Record<ScheduleType, string> = {
      [ScheduleType.MORNING]: '上午',
      [ScheduleType.AFTERNOON]: '下午',
      [ScheduleType.EVENING]: '晚上',
      [ScheduleType.FULL_DAY]: '全天',
    };
    return names[type] || type;
  }

  private async checkRoomConflict(
    date: Date,
    startTime: string,
    endTime: string,
    roomNumber: string,
    excludeScheduleId?: string,
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];

    const roomSchedules = await this.prisma.schedule.findMany({
      where: {
        roomNumber,
        date,
        id: excludeScheduleId ? { not: excludeScheduleId } : undefined,
        isActive: true,
      },
    });

    for (const schedule of roomSchedules) {
      if (this.checkTimeOverlap(startTime, endTime, schedule.startTime, schedule.endTime)) {
        conflicts.push({
          type: 'ROOM_CONFLICT',
          message: `诊室 ${roomNumber} 已被占用: ${schedule.startTime} - ${schedule.endTime}`,
          conflictingScheduleId: schedule.id,
          details: {
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            date: schedule.date,
          },
        });
      }
    }

    return conflicts;
  }

  private async checkDoctorUnavailability(
    doctorId: string,
    date: Date,
    startTime: string,
    endTime: string,
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];

    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: doctorId },
    });

    if (!doctor) {
      return conflicts;
    }

    return conflicts;
  }

  async validateScheduleCreation(
    doctorId: string,
    date: Date,
    type: ScheduleType,
    startTime: string,
    endTime: string,
    totalSlots: number,
    roomNumber?: string,
  ): Promise<void> {
    const { hasConflict, conflicts } = await this.checkScheduleConflict(
      doctorId,
      date,
      type,
      startTime,
      endTime,
      roomNumber,
    );

    if (hasConflict) {
      const messages = conflicts.map((c) => c.message).join('; ');
      throw new ConflictException(`排班冲突: ${messages}`);
    }

    if (totalSlots < 1) {
      throw new ConflictException('号源数量不能小于1');
    }

    if (totalSlots > 100) {
      throw new ConflictException('号源数量不能超过100');
    }

    this.logger.log(`排班验证通过: 医生 ${doctorId}, 日期 ${date}`);
  }

  async checkAndResolveConflicts(
    doctorId: string,
    date: Date,
    type: ScheduleType,
    startTime: string,
    endTime: string,
    roomNumber?: string,
  ): Promise<{
    hasConflict: boolean;
    conflicts: ScheduleConflict[];
    resolutions: string[];
  }> {
    const { hasConflict, conflicts } = await this.checkScheduleConflict(
      doctorId,
      date,
      type,
      startTime,
      endTime,
      roomNumber,
    );

    const resolutions: string[] = [];

    if (!hasConflict) {
      return { hasConflict, conflicts, resolutions };
    }

    for (const conflict of conflicts) {
      switch (conflict.type) {
        case 'TIME_OVERLAP':
          resolutions.push(
            `建议调整时间为: 请选择与现有排班不重叠的时间段`,
          );
          break;
        case 'ROOM_CONFLICT':
          resolutions.push(
            `建议更换诊室或调整时间`,
          );
          break;
        case 'DOCTOR_UNAVAILABLE':
          resolutions.push(
            `该医生在此时间段不可用，请选择其他时间`,
          );
          break;
        case 'SLOT_EXCEEDED':
          resolutions.push(
            `建议减少号源数量`,
          );
          break;
      }
    }

    return { hasConflict, conflicts, resolutions };
  }

  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  async getDoctorScheduleConflicts(
    doctorId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{
    date: Date;
    conflicts: ScheduleConflict[];
  }>> {
    const results: Array<{ date: Date; conflicts: ScheduleConflict[] }> = [];

    const schedules = await this.prisma.schedule.findMany({
      where: {
        doctorId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        isActive: true,
      },
      orderBy: { date: 'asc' },
    });

    const dateMap = new Map<string, Schedule[]>();
    for (const schedule of schedules) {
      const dateKey = schedule.date.toISOString().split('T')[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(schedule);
    }

    for (const [dateKey, daySchedules] of dateMap) {
      const dayConflicts: ScheduleConflict[] = [];

      for (let i = 0; i < daySchedules.length; i++) {
        for (let j = i + 1; j < daySchedules.length; j++) {
          if (
            this.checkTimeOverlap(
              daySchedules[i].startTime,
              daySchedules[i].endTime,
              daySchedules[j].startTime,
              daySchedules[j].endTime,
            )
          ) {
            dayConflicts.push({
              type: 'TIME_OVERLAP',
              message: `排班冲突: ${daySchedules[i].startTime}-${daySchedules[i].endTime} 与 ${daySchedules[j].startTime}-${daySchedules[j].endTime} 重叠`,
              conflictingScheduleId: daySchedules[j].id,
              details: {
                startTime: daySchedules[i].startTime,
                endTime: daySchedules[i].endTime,
                date: daySchedules[i].date,
              },
            });
          }
        }
      }

      if (dayConflicts.length > 0) {
        results.push({
          date: new Date(dateKey),
          conflicts: dayConflicts,
        });
      }
    }

    return results;
  }
}
