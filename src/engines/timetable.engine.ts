import { PrismaClient } from '@prisma/client';
import { TimetableConflictError, NotFoundError } from '../utils/errors';
import { config } from '../config';
import { ScheduleStatus, UserRole } from '../config/constants';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface TimeSlot {
  date: Date;
  startTime: string;
  endTime: string;
}

export interface ScheduleCandidate {
  courseId: string;
  teacherId: string;
  classroomId?: string;
  timeSlots: TimeSlot[];
  duration: number;
  maxStudents?: number;
}

export interface ConflictInfo {
  type: 'TEACHER' | 'CLASSROOM' | 'TIME' | 'STUDENT';
  entityId: string;
  entityName: string;
  conflictEntityId: string;
  conflictEntityName: string;
  timeRange: {
    date: string;
    start: string;
    end: string;
  };
}

export interface ConflictDetectionResult {
  hasConflict: boolean;
  conflicts: ConflictInfo[];
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function timeOverlaps(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = parseTime(start1);
  const e1 = parseTime(end1);
  const s2 = parseTime(start2);
  const e2 = parseTime(end2);
  
  return s1 < e2 && s2 < e1;
}

function datesAreSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export async function checkTeacherConflict(
  teacherId: string,
  organizationId: string,
  date: Date,
  startTime: string,
  endTime: string,
  excludeScheduleId?: string
): Promise<ConflictInfo | null> {
  const schedules = await prisma.schedule.findMany({
    where: {
      organizationId,
      teacherId,
      date: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lte: new Date(date.setHours(23, 59, 59, 999)),
      },
      status: {
        in: [ScheduleStatus.DRAFT, ScheduleStatus.CONFIRMED],
      },
      ...(excludeScheduleId ? { id: { not: excludeScheduleId } } : {}),
    },
    include: {
      teacher: true,
    },
  });

  for (const schedule of schedules) {
    if (timeOverlaps(startTime, endTime, schedule.startTime, schedule.endTime)) {
      return {
        type: 'TEACHER',
        entityId: teacherId,
        entityName: schedule.teacher.realName || schedule.teacher.username,
        conflictEntityId: schedule.id,
        conflictEntityName: `${schedule.teacher.realName} - ${schedule.date.toISOString().slice(0, 10)} ${schedule.startTime}-${schedule.endTime}`,
        timeRange: {
          date: schedule.date.toISOString().slice(0, 10),
          start: schedule.startTime,
          end: schedule.endTime,
        },
      };
    }
  }

  return null;
}

export async function checkClassroomConflict(
  classroomId: string | null | undefined,
  organizationId: string,
  date: Date,
  startTime: string,
  endTime: string,
  excludeScheduleId?: string
): Promise<ConflictInfo | null> {
  if (!classroomId) {
    return null;
  }

  const schedules = await prisma.schedule.findMany({
    where: {
      organizationId,
      classroomId,
      date: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lte: new Date(date.setHours(23, 59, 59, 999)),
      },
      status: {
        in: [ScheduleStatus.DRAFT, ScheduleStatus.CONFIRMED],
      },
      ...(excludeScheduleId ? { id: { not: excludeScheduleId } } : {}),
    },
    include: {
      classroom: true,
    },
  });

  for (const schedule of schedules) {
    if (timeOverlaps(startTime, endTime, schedule.startTime, schedule.endTime)) {
      return {
        type: 'CLASSROOM',
        entityId: classroomId,
        entityName: schedule.classroom?.name || '未知教室',
        conflictEntityId: schedule.id,
        conflictEntityName: `${schedule.classroom?.name} - ${schedule.date.toISOString().slice(0, 10)} ${schedule.startTime}-${schedule.endTime}`,
        timeRange: {
          date: schedule.date.toISOString().slice(0, 10),
          start: schedule.startTime,
          end: schedule.endTime,
        },
      };
    }
  }

  return null;
}

export async function detectAllConflicts(
  organizationId: string,
  teacherId: string,
  date: Date,
  startTime: string,
  endTime: string,
  classroomId?: string,
  excludeScheduleId?: string
): Promise<ConflictDetectionResult> {
  const conflicts: ConflictInfo[] = [];

  const teacherConflict = await checkTeacherConflict(
    teacherId,
    organizationId,
    new Date(date),
    startTime,
    endTime,
    excludeScheduleId
  );
  if (teacherConflict) {
    conflicts.push(teacherConflict);
  }

  const classroomConflict = await checkClassroomConflict(
    classroomId,
    organizationId,
    new Date(date),
    startTime,
    endTime,
    excludeScheduleId
  );
  if (classroomConflict) {
    conflicts.push(classroomConflict);
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

export async function validateScheduleCreate(
  organizationId: string,
  teacherId: string,
  date: Date,
  startTime: string,
  endTime: string,
  classroomId?: string
): Promise<void> {
  const teacher = await prisma.user.findFirst({
    where: {
      id: teacherId,
      organizationId,
      role: UserRole.TEACHER,
      isActive: true,
    },
  });

  if (!teacher) {
    throw new NotFoundError('教师不存在或未激活');
  }

  if (classroomId) {
    const classroom = await prisma.classroom.findFirst({
      where: {
        id: classroomId,
        organizationId,
        isActive: true,
      },
    });

    if (!classroom) {
      throw new NotFoundError('教室不存在或未激活');
    }
  }

  const conflictResult = await detectAllConflicts(
    organizationId,
    teacherId,
    date,
    startTime,
    endTime,
    classroomId
  );

  if (conflictResult.hasConflict) {
    const conflictTypes = [...new Set(conflictResult.conflicts.map(c => c.type))];
    
    throw new TimetableConflictError(
      `检测到 ${conflictResult.conflicts.length} 个冲突`,
      conflictTypes.join(','),
      conflictResult.conflicts.map(c => ({
        type: c.type,
        entityId: c.entityId,
        entityName: c.entityName,
        timeRange: {
          start: c.timeRange.start,
          end: c.timeRange.end,
        },
      }))
    );
  }

  logger.info('排课冲突检测通过', {
    organizationId,
    teacherId,
    date: date.toISOString(),
    startTime,
    endTime,
    classroomId,
  });
}

export async function suggestAlternativeSlots(
  organizationId: string,
  teacherId: string,
  baseDate: Date,
  preferredStartTime: string,
  durationMinutes: number,
  classroomId?: string,
  daysToCheck: number = 7
): Promise<Array<{ date: Date; startTime: string; endTime: string; score: number }>> {
  const suggestions: Array<{ date: Date; startTime: string; endTime: string; score: number }> = [];
  
  const workingHours = {
    start: 8,
    end: 21,
  };
  
  const preferredHour = parseInt(preferredStartTime.split(':')[0]);
  
  for (let dayOffset = 0; dayOffset < daysToCheck; dayOffset++) {
    const checkDate = new Date(baseDate);
    checkDate.setDate(checkDate.getDate() + dayOffset);
    
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        
        const endMinutes = hour * 60 + minute + durationMinutes;
        const endHour = Math.floor(endMinutes / 60);
        const endMinute = endMinutes % 60;
        
        if (endHour > workingHours.end) {
          continue;
        }
        
        const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
        
        const conflictResult = await detectAllConflicts(
          organizationId,
          teacherId,
          checkDate,
          startTime,
          endTime,
          classroomId
        );
        
        if (!conflictResult.hasConflict) {
          let score = 100;
          
          const hourDiff = Math.abs(hour - preferredHour);
          score -= hourDiff * 5;
          
          score -= dayOffset * 2;
          
          suggestions.push({
            date: checkDate,
            startTime,
            endTime,
            score: Math.max(score, 0),
          });
        }
      }
    }
  }
  
  return suggestions.sort((a, b) => b.score - a.score).slice(0, 10);
}

export class TimetableEngine {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async validateAndCreateSchedule(
    organizationId: string,
    data: {
      courseId: string;
      teacherId: string;
      classroomId?: string;
      date: Date;
      startTime: string;
      endTime: string;
      duration: number;
      maxStudents?: number;
      notes?: string;
      isRecurring?: boolean;
      recurringRule?: string;
    }
  ) {
    await validateScheduleCreate(
      organizationId,
      data.teacherId,
      data.date,
      data.startTime,
      data.endTime,
      data.classroomId
    );

    const schedule = await this.prisma.schedule.create({
      data: {
        organizationId,
        courseId: data.courseId,
        teacherId: data.teacherId,
        classroomId: data.classroomId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration,
        maxStudents: data.maxStudents || 20,
        notes: data.notes,
        isRecurring: data.isRecurring || false,
        recurringRule: data.recurringRule,
        status: ScheduleStatus.DRAFT,
      },
      include: {
        course: true,
        teacher: true,
        classroom: true,
      },
    });

    logger.info('排课创建成功', { scheduleId: schedule.id });

    return schedule;
  }

  async updateSchedule(
    scheduleId: string,
    organizationId: string,
    data: {
      teacherId?: string;
      classroomId?: string | null;
      date?: Date;
      startTime?: string;
      endTime?: string;
      status?: ScheduleStatus;
      notes?: string;
    }
  ) {
    const existingSchedule = await this.prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        organizationId,
      },
    });

    if (!existingSchedule) {
      throw new NotFoundError('课表不存在');
    }

    if (
      data.teacherId ||
      data.classroomId !== undefined ||
      data.date ||
      data.startTime ||
      data.endTime
    ) {
      const teacherId = data.teacherId || existingSchedule.teacherId;
      const classroomId = data.classroomId === undefined ? existingSchedule.classroomId : data.classroomId;
      const date = data.date || existingSchedule.date;
      const startTime = data.startTime || existingSchedule.startTime;
      const endTime = data.endTime || existingSchedule.endTime;

      await validateScheduleCreate(
        organizationId,
        teacherId,
        date,
        startTime,
        endTime,
        classroomId || undefined
      );
    }

    const schedule = await this.prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        ...data,
      },
      include: {
        course: true,
        teacher: true,
        classroom: true,
      },
    });

    logger.info('排课更新成功', { scheduleId });

    return schedule;
  }

  async getConflictsForDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    const conflicts = await this.prisma.scheduleConflict.findMany({
      where: {
        organizationId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    return conflicts;
  }
}

export const timetableEngine = new TimetableEngine();

export default {
  checkTeacherConflict,
  checkClassroomConflict,
  detectAllConflicts,
  validateScheduleCreate,
  suggestAlternativeSlots,
  TimetableEngine,
  timetableEngine,
};
