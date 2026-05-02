import { PrismaClient, Decimal } from '@prisma/client';
import { NotFoundError, BadRequestError, ErrorCode } from '../utils/errors';
import { AttendanceStatus } from '../config/constants';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface ConsumptionParams {
  attendanceId: string;
  organizationId: string;
}

export interface ConsumptionResult {
  consumptionId: string;
  enrollmentId: string;
  hoursConsumed: number;
  remainingHours: number;
  totalAmount: number;
}

export interface RenewalCheckResult {
  needsRenewal: boolean;
  enrollmentId: string;
  studentId: string;
  remainingHours: number;
  remainingDays: number;
  thresholdHours: number;
  thresholdDays: number;
}

export function calculateHoursFromDuration(durationMinutes: number): Decimal {
  const hours = durationMinutes / 60;
  return new Decimal(hours.toFixed(2));
}

export async function getPricePerHour(
  enrollmentId: string,
  organizationId: string
): Promise<Decimal> {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      organizationId,
    },
    include: {
      coursePackage: true,
      course: true,
    },
  });

  if (!enrollment) {
    throw new NotFoundError('报名记录不存在');
  }

  if (enrollment.coursePackage) {
    const pricePerHour = enrollment.coursePackage.price.div(enrollment.coursePackage.totalHours);
    return pricePerHour;
  }

  if (enrollment.course.defaultPrice.greaterThan(0)) {
    return enrollment.course.defaultPrice;
  }

  return new Decimal(0);
}

export async function validateEnrollmentForConsumption(
  enrollmentId: string,
  organizationId: string,
  requiredHours: Decimal
): Promise<void> {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      organizationId,
    },
  });

  if (!enrollment) {
    throw new NotFoundError('报名记录不存在');
  }

  if (enrollment.status !== 'ACTIVE') {
    throw new BadRequestError(
      '报名状态无效，无法消耗课时',
      ErrorCode.ENROLLMENT_INACTIVE
    );
  }

  const now = new Date();
  if (enrollment.endDate < now) {
    throw new BadRequestError(
      '报名已过期，无法消耗课时',
      ErrorCode.ENROLLMENT_EXPIRED
    );
  }

  if (enrollment.remainingHours < requiredHours.toNumber()) {
    throw new BadRequestError(
      `课时不足。剩余: ${enrollment.remainingHours}, 需要: ${requiredHours.toNumber()}`,
      ErrorCode.INSUFFICIENT_HOURS,
      {
        remainingHours: enrollment.remainingHours,
        requiredHours: requiredHours.toNumber(),
      }
    );
  }
}

export async function processConsumption(
  params: ConsumptionParams
): Promise<ConsumptionResult> {
  const { attendanceId, organizationId } = params;

  const attendance = await prisma.attendance.findFirst({
    where: {
      id: attendanceId,
      organizationId,
    },
    include: {
      enrollment: true,
      schedule: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!attendance) {
    throw new NotFoundError('考勤记录不存在');
  }

  const existingConsumption = await prisma.consumption.findFirst({
    where: {
      attendanceId,
      organizationId,
    },
  });

  if (existingConsumption) {
    throw new BadRequestError(
      '该考勤记录已存在课消记录',
      ErrorCode.DUPLICATE_ATTENDANCE
    );
  }

  if (
    attendance.status === AttendanceStatus.LEAVE ||
    attendance.status === AttendanceStatus.ABSENT
  ) {
    logger.info('跳过课消计算，考勤状态为请假或缺勤', {
      attendanceId,
      status: attendance.status,
    });
    throw new BadRequestError(
      `考勤状态为 ${attendance.status}，不消耗课时`,
      ErrorCode.BAD_REQUEST
    );
  }

  const durationMinutes = attendance.schedule?.duration || 60;
  const hoursConsumed = calculateHoursFromDuration(durationMinutes);

  await validateEnrollmentForConsumption(
    attendance.enrollmentId,
    organizationId,
    hoursConsumed
  );

  const pricePerHour = await getPricePerHour(
    attendance.enrollmentId,
    organizationId
  );

  const totalAmount = hoursConsumed.mul(pricePerHour);

  const enrollment = await prisma.enrollment.update({
    where: { id: attendance.enrollmentId },
    data: {
      remainingHours: {
        decrement: hoursConsumed.toNumber(),
      },
      usedHours: {
        increment: hoursConsumed.toNumber(),
      },
    },
  });

  const consumption = await prisma.consumption.create({
    data: {
      organizationId,
      attendanceId: attendance.id,
      enrollmentId: attendance.enrollmentId,
      studentId: attendance.studentId,
      scheduleId: attendance.scheduleId,
      hoursConsumed,
      pricePerHour,
      totalAmount,
      consumedAt: new Date(),
    },
  });

  logger.info('课消处理完成', {
    consumptionId: consumption.id,
    attendanceId,
    enrollmentId: attendance.enrollmentId,
    hoursConsumed: hoursConsumed.toNumber(),
    totalAmount: totalAmount.toNumber(),
  });

  return {
    consumptionId: consumption.id,
    enrollmentId: attendance.enrollmentId,
    hoursConsumed: hoursConsumed.toNumber(),
    remainingHours: enrollment.remainingHours,
    totalAmount: totalAmount.toNumber(),
  };
}

export async function checkRenewalNeeded(
  organizationId: string,
  thresholdHours: number = 5,
  thresholdDays: number = 14
): Promise<RenewalCheckResult[]> {
  const now = new Date();
  const thresholdDate = new Date(now.getTime() + thresholdDays * 24 * 60 * 60 * 1000);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      organizationId,
      status: 'ACTIVE',
      OR: [
        {
          remainingHours: {
            lte: thresholdHours,
          },
        },
        {
          endDate: {
            lte: thresholdDate,
          },
        },
      ],
    },
    include: {
      student: {
        select: {
          id: true,
          realName: true,
          phone: true,
        },
      },
      course: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const results: RenewalCheckResult[] = [];

  for (const enrollment of enrollments) {
    const remainingDays = Math.max(
      0,
      Math.ceil((enrollment.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    const needsRenewal =
      enrollment.remainingHours <= thresholdHours || remainingDays <= thresholdDays;

    if (needsRenewal) {
      results.push({
        needsRenewal: true,
        enrollmentId: enrollment.id,
        studentId: enrollment.studentId,
        remainingHours: enrollment.remainingHours,
        remainingDays,
        thresholdHours,
        thresholdDays,
      });
    }
  }

  logger.info('续费检查完成', {
    organizationId,
    totalChecked: enrollments.length,
    needsRenewal: results.length,
  });

  return results;
}

export async function getConsumptionSummary(
  organizationId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalConsumptions: number;
  totalHours: number;
  totalAmount: number;
  byCourse: Array<{
    courseId: string;
    courseName: string;
    count: number;
    hours: number;
    amount: number;
  }>;
  byTeacher: Array<{
    teacherId: string;
    teacherName: string;
    count: number;
    hours: number;
    amount: number;
  }>;
}> {
  const consumptions = await prisma.consumption.findMany({
    where: {
      organizationId,
      consumedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      schedule: {
        include: {
          course: true,
          teacher: true,
        },
      },
    },
  });

  let totalHours = 0;
  let totalAmount = 0;

  const courseMap = new Map<string, {
    courseId: string;
    courseName: string;
    count: number;
    hours: number;
    amount: number;
  }>();

  const teacherMap = new Map<string, {
    teacherId: string;
    teacherName: string;
    count: number;
    hours: number;
    amount: number;
  }>();

  for (const consumption of consumptions) {
    const hours = Number(consumption.hoursConsumed);
    const amount = Number(consumption.totalAmount);

    totalHours += hours;
    totalAmount += amount;

    if (consumption.schedule?.course) {
      const course = consumption.schedule.course;
      const existing = courseMap.get(course.id) || {
        courseId: course.id,
        courseName: course.name,
        count: 0,
        hours: 0,
        amount: 0,
      };
      existing.count++;
      existing.hours += hours;
      existing.amount += amount;
      courseMap.set(course.id, existing);
    }

    if (consumption.schedule?.teacher) {
      const teacher = consumption.schedule.teacher;
      const existing = teacherMap.get(teacher.id) || {
        teacherId: teacher.id,
        teacherName: teacher.realName || teacher.username,
        count: 0,
        hours: 0,
        amount: 0,
      };
      existing.count++;
      existing.hours += hours;
      existing.amount += amount;
      teacherMap.set(teacher.id, existing);
    }
  }

  return {
    totalConsumptions: consumptions.length,
    totalHours,
    totalAmount,
    byCourse: Array.from(courseMap.values()),
    byTeacher: Array.from(teacherMap.values()),
  };
}

export class ConsumptionEngine {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async processConsumption(params: ConsumptionParams): Promise<ConsumptionResult> {
    return processConsumption(params);
  }

  async checkRenewalNeeded(
    organizationId: string,
    thresholdHours?: number,
    thresholdDays?: number
  ): Promise<RenewalCheckResult[]> {
    return checkRenewalNeeded(
      organizationId,
      thresholdHours,
      thresholdDays
    );
  }

  async validateEnrollment(
    enrollmentId: string,
    organizationId: string,
    hours: number
  ): Promise<void> {
    await validateEnrollmentForConsumption(
      enrollmentId,
      organizationId,
      new Decimal(hours)
    );
  }
}

export const consumptionEngine = new ConsumptionEngine();

export default {
  calculateHoursFromDuration,
  getPricePerHour,
  validateEnrollmentForConsumption,
  processConsumption,
  checkRenewalNeeded,
  getConsumptionSummary,
  ConsumptionEngine,
  consumptionEngine,
};
