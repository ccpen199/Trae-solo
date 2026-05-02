import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError, ErrorCode } from '../utils/errors';
import { AttendanceStatus, ScheduleStatus, UserRole } from '../config/constants';
import logger from '../utils/logger';
import { processConsumption } from './consumption.engine';

const prisma = new PrismaClient();

export interface AttendanceCreateParams {
  scheduleId: string;
  studentId: string;
  organizationId: string;
  status: AttendanceStatus;
  checkInTime?: Date;
  checkOutTime?: Date;
  notes?: string;
  isMakeup?: boolean;
}

export interface BatchAttendanceParams {
  scheduleId: string;
  organizationId: string;
  attendances: Array<{
    studentId: string;
    status: AttendanceStatus;
    notes?: string;
  }>;
}

export interface AttendanceStatistics {
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  leaveEarly: number;
  makeup: number;
  attendanceRate: number;
}

export async function validateAttendanceCreate(
  params: AttendanceCreateParams
): Promise<void> {
  const { scheduleId, studentId, organizationId } = params;

  const schedule = await prisma.schedule.findFirst({
    where: {
      id: scheduleId,
      organizationId,
    },
    include: {
      course: true,
    },
  });

  if (!schedule) {
    throw new NotFoundError('课表不存在');
  }

  if (schedule.status === ScheduleStatus.CANCELLED) {
    throw new BadRequestError('课表已取消，无法记录考勤');
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      organizationId,
      courseId: schedule.courseId,
      status: 'ACTIVE',
    },
  });

  if (!enrollment) {
    throw new BadRequestError(
      '学员未报名该课程或报名已失效',
      ErrorCode.ENROLLMENT_INACTIVE
    );
  }

  const existingAttendance = await prisma.attendance.findFirst({
    where: {
      scheduleId,
      studentId,
      organizationId,
    },
  });

  if (existingAttendance) {
    throw new BadRequestError(
      '该学员在本课表已存在考勤记录',
      ErrorCode.DUPLICATE_ATTENDANCE
    );
  }
}

export async function createAttendance(
  params: AttendanceCreateParams
) {
  await validateAttendanceCreate(params);

  const schedule = await prisma.schedule.findFirstOrThrow({
    where: {
      id: params.scheduleId,
      organizationId: params.organizationId,
    },
  });

  const enrollment = await prisma.enrollment.findFirstOrThrow({
    where: {
      studentId: params.studentId,
      organizationId: params.organizationId,
      courseId: schedule.courseId,
    },
  });

  const attendance = await prisma.attendance.create({
    data: {
      organizationId: params.organizationId,
      scheduleId: params.scheduleId,
      studentId: params.studentId,
      enrollmentId: enrollment.id,
      status: params.status,
      checkInTime: params.checkInTime,
      checkOutTime: params.checkOutTime,
      notes: params.notes,
      isMakeup: params.isMakeup || false,
    },
    include: {
      student: true,
      schedule: {
        include: {
          course: true,
          teacher: true,
        },
      },
    },
  });

  if (
    params.status !== AttendanceStatus.LEAVE &&
    params.status !== AttendanceStatus.ABSENT
  ) {
    try {
      await processConsumption({
        attendanceId: attendance.id,
        organizationId: params.organizationId,
      });
    } catch (error) {
      logger.warn('课消处理失败，考勤记录已创建', {
        attendanceId: attendance.id,
        error: (error as Error).message,
      });
    }
  }

  logger.info('考勤记录创建成功', {
    attendanceId: attendance.id,
    scheduleId: params.scheduleId,
    studentId: params.studentId,
    status: params.status,
  });

  return attendance;
}

export async function batchCreateAttendance(
  params: BatchAttendanceParams
): Promise<{
  success: Array<{ studentId: string; attendanceId: string }>;
  failed: Array<{ studentId: string; reason: string }>;
}> {
  const { scheduleId, organizationId, attendances } = params;

  const success: Array<{ studentId: string; attendanceId: string }> = [];
  const failed: Array<{ studentId: string; reason: string }> = [];

  for (const attendanceData of attendances) {
    try {
      const attendance = await createAttendance({
        scheduleId,
        studentId: attendanceData.studentId,
        organizationId,
        status: attendanceData.status,
        notes: attendanceData.notes,
      });

      success.push({
        studentId: attendanceData.studentId,
        attendanceId: attendance.id,
      });
    } catch (error) {
      failed.push({
        studentId: attendanceData.studentId,
        reason: (error as Error).message,
      });
    }
  }

  logger.info('批量考勤处理完成', {
    scheduleId,
    organizationId,
    total: attendances.length,
    success: success.length,
    failed: failed.length,
  });

  return { success, failed };
}

export async function updateAttendanceStatus(
  attendanceId: string,
  organizationId: string,
  status: AttendanceStatus,
  notes?: string
) {
  const attendance = await prisma.attendance.findFirst({
    where: {
      id: attendanceId,
      organizationId,
    },
    include: {
      consumption: true,
    },
  });

  if (!attendance) {
    throw new NotFoundError('考勤记录不存在');
  }

  if (attendance.consumption &&
    (status === AttendanceStatus.LEAVE || status === AttendanceStatus.ABSENT)) {
    throw new BadRequestError(
      '已产生课消记录，无法修改为请假或缺勤状态',
      ErrorCode.INVALID_STATUS_TRANSITION
    );
  }

  const updated = await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      status,
      notes: notes || attendance.notes,
    },
    include: {
      student: true,
      schedule: {
        include: {
          course: true,
          teacher: true,
        },
      },
    },
  });

  if (
    !attendance.consumption &&
    status !== AttendanceStatus.LEAVE &&
    status !== AttendanceStatus.ABSENT
  ) {
    try {
      await processConsumption({
        attendanceId,
        organizationId,
      });
    } catch (error) {
      logger.warn('状态更新后课消处理失败', {
        attendanceId,
        error: (error as Error).message,
      });
    }
  }

  logger.info('考勤状态更新成功', {
    attendanceId,
    oldStatus: attendance.status,
    newStatus: status,
  });

  return updated;
}

export async function getAttendanceStatistics(
  organizationId: string,
  startDate?: Date,
  endDate?: Date,
  courseId?: string,
  teacherId?: string
): Promise<AttendanceStatistics> {
  const where: Record<string, unknown> = {
    organizationId,
  };

  if (startDate && endDate) {
    where.schedule = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };
  }

  if (courseId) {
    where.schedule = {
      ...(where.schedule as object),
      courseId,
    };
  }

  if (teacherId) {
    where.schedule = {
      ...(where.schedule as object),
      teacherId,
    };
  }

  const attendances = await prisma.attendance.findMany({
    where,
  });

  const total = attendances.length;
  const present = attendances.filter(a => a.status === AttendanceStatus.PRESENT).length;
  const absent = attendances.filter(a => a.status === AttendanceStatus.ABSENT).length;
  const late = attendances.filter(a => a.status === AttendanceStatus.LATE).length;
  const leave = attendances.filter(a => a.status === AttendanceStatus.LEAVE).length;
  const leaveEarly = attendances.filter(a => a.status === AttendanceStatus.LEAVE_EARLY).length;
  const makeup = attendances.filter(a => a.status === AttendanceStatus.MAKEUP).length;

  const validForRate = total - leave;
  const attendanceRate = validForRate > 0
    ? ((present + late + leaveEarly + makeup) / validForRate) * 100
    : 0;

  return {
    total,
    present,
    absent,
    late,
    leave,
    leaveEarly,
    makeup,
    attendanceRate: Math.round(attendanceRate * 100) / 100,
  };
}

export async function getScheduleAttendanceList(
  scheduleId: string,
  organizationId: string
) {
  const attendances = await prisma.attendance.findMany({
    where: {
      scheduleId,
      organizationId,
    },
    include: {
      student: {
        select: {
          id: true,
          realName: true,
          phone: true,
          studentProfile: true,
        },
      },
      consumption: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return attendances;
}

export class AttendanceEngine {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createAttendance(params: AttendanceCreateParams) {
    return createAttendance(params);
  }

  async batchCreateAttendance(params: BatchAttendanceParams) {
    return batchCreateAttendance(params);
  }

  async updateAttendanceStatus(
    attendanceId: string,
    organizationId: string,
    status: AttendanceStatus,
    notes?: string
  ) {
    return updateAttendanceStatus(attendanceId, organizationId, status, notes);
  }

  async getStatistics(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
    courseId?: string,
    teacherId?: string
  ): Promise<AttendanceStatistics> {
    return getAttendanceStatistics(organizationId, startDate, endDate, courseId, teacherId);
  }
}

export const attendanceEngine = new AttendanceEngine();

export default {
  validateAttendanceCreate,
  createAttendance,
  batchCreateAttendance,
  updateAttendanceStatus,
  getAttendanceStatistics,
  getScheduleAttendanceList,
  AttendanceEngine,
  attendanceEngine,
};
