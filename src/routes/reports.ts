import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { AuthRequest, authenticate, requireAdmin, getOrganizationId, getUserId, getUserRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { sendSuccess } from '../utils/response';
import { getConsumptionSummary } from '../engines/consumption.engine';
import { getAttendanceStatistics } from '../engines/attendance.engine';
import { ScheduleStatus, PaymentStatus, UserRole } from '../config/constants';
import logger from '../utils/logger';

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get(
  '/dashboard',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const userId = getUserId(req);
    const userRole = getUserRole(req);

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const [
      todaySchedules,
      todayAttendances,
      todayConsumptions,
      monthConsumptions,
      activeEnrollments,
      pendingRenewals,
      activeTeachers,
      activeCourses,
    ] = await Promise.all([
      prisma.schedule.count({
        where: {
          organizationId,
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
          status: {
            in: [ScheduleStatus.CONFIRMED, ScheduleStatus.COMPLETED],
          },
        },
      }),
      prisma.attendance.count({
        where: {
          organizationId,
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      prisma.consumption.aggregate({
        where: {
          organizationId,
          consumedAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        _sum: {
          hoursConsumed: true,
          totalAmount: true,
        },
        _count: true,
      }),
      prisma.consumption.aggregate({
        where: {
          organizationId,
          consumedAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: {
          hoursConsumed: true,
          totalAmount: true,
        },
        _count: true,
      }),
      prisma.enrollment.count({
        where: {
          organizationId,
          status: 'ACTIVE',
        },
      }),
      prisma.enrollment.count({
        where: {
          organizationId,
          status: 'ACTIVE',
          OR: [
            { remainingHours: { lte: 5 } },
            { endDate: { lte: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000) } },
          ],
        },
      }),
      prisma.user.count({
        where: {
          organizationId,
          role: UserRole.TEACHER,
          isActive: true,
        },
      }),
      prisma.course.count({
        where: {
          organizationId,
          isActive: true,
        },
      }),
    ]);

    const dashboard = {
      today: {
        schedules: todaySchedules,
        attendances: todayAttendances,
        consumptions: todayConsumptions._count,
        hoursConsumed: Number(todayConsumptions._sum.hoursConsumed || 0),
        revenue: Number(todayConsumptions._sum.totalAmount || 0),
      },
      currentMonth: {
        consumptions: monthConsumptions._count,
        hoursConsumed: Number(monthConsumptions._sum.hoursConsumed || 0),
        revenue: Number(monthConsumptions._sum.totalAmount || 0),
      },
      overview: {
        activeEnrollments,
        pendingRenewals,
        activeTeachers,
        activeCourses,
      },
    };

    sendSuccess(res, dashboard);
  })
);

router.get(
  '/consumption',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : startOfMonth(new Date());
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : endOfMonth(new Date());

    const summary = await getConsumptionSummary(organizationId, startDate, endDate);

    sendSuccess(res, {
      period: {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      },
      ...summary,
    });
  })
);

router.get(
  '/attendance',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const courseId = req.query.courseId as string | undefined;
    const teacherId = req.query.teacherId as string | undefined;

    const stats = await getAttendanceStatistics(organizationId, startDate, endDate, courseId, teacherId);

    sendSuccess(res, {
      period: startDate && endDate ? {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      } : null,
      ...stats,
    });
  })
);

router.get(
  '/revenue',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : startOfMonth(new Date());
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : endOfMonth(new Date());

    const payments = await prisma.payment.aggregate({
      where: {
        organizationId,
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
        status: PaymentStatus.PAID,
      },
      _sum: {
        amount: true,
        paidAmount: true,
        discount: true,
      },
      _count: true,
    });

    const paymentsByCourse = await prisma.payment.groupBy({
      by: ['enrollmentId'],
      where: {
        organizationId,
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
        status: PaymentStatus.PAID,
      },
      _sum: {
        paidAmount: true,
      },
      _count: true,
    });

    const enrollmentIds = paymentsByCourse.map(p => p.enrollmentId);
    const enrollments = await prisma.enrollment.findMany({
      where: {
        id: { in: enrollmentIds },
      },
      include: {
        course: true,
      },
    });

    const enrollmentMap = new Map(enrollments.map(e => [e.id, e]));

    const byCourse = paymentsByCourse.map(p => {
      const enrollment = enrollmentMap.get(p.enrollmentId);
      return {
        courseId: enrollment?.courseId,
        courseName: enrollment?.course?.name,
        count: p._count,
        amount: Number(p._sum.paidAmount || 0),
      };
    }).reduce((acc, curr) => {
      const existing = acc.find(a => a.courseId === curr.courseId);
      if (existing) {
        existing.count += curr.count;
        existing.amount += curr.amount;
      } else {
        acc.push(curr);
      }
      return acc;
    }, [] as Array<{ courseId?: string; courseName?: string; count: number; amount: number }>);

    sendSuccess(res, {
      period: {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      },
      total: {
        count: payments._count,
        amount: Number(payments._sum.paidAmount || 0),
        discount: Number(payments._sum.discount || 0),
      },
      byCourse: byCourse.filter(c => c.courseId),
    });
  })
);

router.get(
  '/class-occupancy',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : startOfMonth(new Date());
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : endOfMonth(new Date());

    const schedules = await prisma.schedule.findMany({
      where: {
        organizationId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: [ScheduleStatus.CONFIRMED, ScheduleStatus.COMPLETED],
        },
      },
      include: {
        course: true,
        teacher: true,
        _count: {
          select: { attendances: true },
        },
      },
    });

    const classOccupancy = schedules.map(s => ({
      scheduleId: s.id,
      courseId: s.courseId,
      courseName: s.course.name,
      teacherId: s.teacherId,
      teacherName: s.teacher.realName,
      date: format(s.date, 'yyyy-MM-dd'),
      startTime: s.startTime,
      endTime: s.endTime,
      maxStudents: s.maxStudents,
      actualStudents: s._count.attendances,
      occupancyRate: s.maxStudents > 0 ? Math.round((s._count.attendances / s.maxStudents) * 10000) / 100 : 0,
    }));

    const avgOccupancy = classOccupancy.length > 0
      ? Math.round((classOccupancy.reduce((sum, c) => sum + c.occupancyRate, 0) / classOccupancy.length) * 100) / 100
      : 0;

    sendSuccess(res, {
      period: {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      },
      averageOccupancyRate: avgOccupancy,
      totalClasses: classOccupancy.length,
      classes: classOccupancy,
    });
  })
);

router.get(
  '/renewal-analysis',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const today = new Date();

    const activeEnrollments = await prisma.enrollment.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
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
        coursePackage: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { payments: true, consumptions: true },
        },
      },
    });

    const atRiskEnrollments = activeEnrollments.filter(e =>
      e.remainingHours <= 5 || e.endDate <= new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
    );

    const atRiskSummary = {
      total: atRiskEnrollments.length,
      byReason: {
        lowHours: atRiskEnrollments.filter(e => e.remainingHours <= 5).length,
        expiringSoon: atRiskEnrollments.filter(e =>
          e.endDate <= new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
        ).length,
      },
      enrollments: atRiskEnrollments.map(e => ({
        id: e.id,
        student: e.student,
        course: e.course,
        coursePackage: e.coursePackage,
        totalHours: e.totalHours,
        remainingHours: e.remainingHours,
        usedHours: e.usedHours,
        startDate: format(e.startDate, 'yyyy-MM-dd'),
        endDate: format(e.endDate, 'yyyy-MM-dd'),
        remainingDays: Math.max(0, Math.ceil((e.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))),
        payments: e._count.payments,
        consumptions: e._count.consumptions,
      })),
    };

    sendSuccess(res, {
      asOf: format(today, 'yyyy-MM-dd'),
      atRisk: atRiskSummary,
    });
  })
);

export default router;
