import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest, authenticate, requireTeacher, requireAdmin, getOrganizationId, getUserId, getUserRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { attendanceEngine, batchCreateAttendance, getAttendanceStatistics } from '../engines/attendance.engine';
import { notificationEngine } from '../engines/notification.engine';
import { AttendanceStatus, UserRole } from '../config/constants';
import logger from '../utils/logger';

const prisma = new PrismaClient();
const router = Router();

const attendanceStatusValues = Object.values(AttendanceStatus);

const createAttendanceSchema = z.object({
  scheduleId: z.string().min(1, '课表ID不能为空'),
  studentId: z.string().min(1, '学员ID不能为空'),
  status: z.enum(attendanceStatusValues as [string, ...string[]]),
  notes: z.string().optional(),
  isMakeup: z.coerce.boolean().default(false),
});

const batchAttendanceSchema = z.object({
  scheduleId: z.string().min(1, '课表ID不能为空'),
  attendances: z.array(
    z.object({
      studentId: z.string().min(1, '学员ID不能为空'),
      status: z.enum(attendanceStatusValues as [string, ...string[]]),
      notes: z.string().optional(),
    })
  ).min(1, '考勤列表不能为空'),
});

const updateAttendanceSchema = z.object({
  status: z.enum(attendanceStatusValues as [string, ...string[]]).optional(),
  notes: z.string().optional(),
});

const statisticsSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  courseId: z.string().optional(),
  teacherId: z.string().optional(),
});

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const userId = getUserId(req);
    const userRole = getUserRole(req);

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const status = req.query.status as AttendanceStatus | undefined;
    const scheduleId = req.query.scheduleId as string | undefined;
    const studentId = req.query.studentId as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const where: Record<string, unknown> = {
      organizationId,
    };

    if (userRole === UserRole.STUDENT) {
      where.studentId = userId;
    } else if (userRole === UserRole.TEACHER) {
      where.schedule = {
        teacherId: userId,
      };
    }

    if (status) {
      where.status = status;
    }
    if (scheduleId) {
      where.scheduleId = scheduleId;
    }
    if (studentId) {
      where.studentId = studentId;
    }
    if (startDate && endDate) {
      where.schedule = {
        ...(where.schedule as object),
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    const total = await prisma.attendance.count({ where });

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            realName: true,
            phone: true,
            studentProfile: true,
          },
        },
        schedule: {
          include: {
            course: true,
            teacher: {
              select: {
                id: true,
                realName: true,
                phone: true,
              },
            },
            classroom: true,
          },
        },
        consumption: true,
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    sendPaginated(res, attendances, { page, pageSize, total });
  })
);

router.get(
  '/statistics',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const userId = getUserId(req);
    const userRole = getUserRole(req);

    const params = statisticsSchema.parse(req.query);

    let teacherId = params.teacherId;
    if (userRole === UserRole.TEACHER) {
      teacherId = userId;
    }

    const stats = await getAttendanceStatistics(
      organizationId,
      params.startDate,
      params.endDate,
      params.courseId,
      teacherId
    );

    sendSuccess(res, stats);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;

    const attendance = await prisma.attendance.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        student: {
          select: {
            id: true,
            realName: true,
            phone: true,
            email: true,
            avatar: true,
            studentProfile: true,
          },
        },
        enrollment: true,
        schedule: {
          include: {
            course: true,
            teacher: {
              select: {
                id: true,
                realName: true,
                phone: true,
                teacherProfile: true,
              },
            },
            classroom: true,
          },
        },
        consumption: true,
      },
    });

    if (!attendance) {
      throw new NotFoundError('考勤记录不存在');
    }

    sendSuccess(res, attendance);
  })
);

router.post(
  '/',
  requireTeacher,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const validated = createAttendanceSchema.parse(req.body);

    const attendance = await attendanceEngine.createAttendance({
      ...validated,
      organizationId,
    });

    try {
      await notificationEngine.createAttendanceNotice(organizationId, attendance.id);
    } catch (error) {
      logger.warn('考勤通知发送失败', {
        attendanceId: attendance.id,
        error: (error as Error).message,
      });
    }

    logger.info('考勤记录创建成功', {
      attendanceId: attendance.id,
      organizationId,
      scheduleId: validated.scheduleId,
      studentId: validated.studentId,
      status: validated.status,
    });

    sendCreated(res, attendance);
  })
);

router.post(
  '/batch',
  requireTeacher,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const validated = batchAttendanceSchema.parse(req.body);

    const result = await batchCreateAttendance({
      ...validated,
      organizationId,
    });

    for (const successItem of result.success) {
      try {
        await notificationEngine.createAttendanceNotice(organizationId, successItem.attendanceId);
      } catch (error) {
        logger.warn('考勤通知发送失败', {
          attendanceId: successItem.attendanceId,
          error: (error as Error).message,
        });
      }
    }

    logger.info('批量考勤处理完成', {
      organizationId,
      scheduleId: validated.scheduleId,
      total: validated.attendances.length,
      success: result.success.length,
      failed: result.failed.length,
    });

    sendSuccess(res, {
      message: `批量考勤处理完成：成功 ${result.success.length} 条，失败 ${result.failed.length} 条`,
      success: result.success,
      failed: result.failed,
    });
  })
);

router.put(
  '/:id',
  requireTeacher,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;
    const validated = updateAttendanceSchema.parse(req.body);

    const attendance = await prisma.attendance.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!attendance) {
      throw new NotFoundError('考勤记录不存在');
    }

    const updated = await attendanceEngine.updateAttendanceStatus(
      id,
      organizationId,
      validated.status || attendance.status,
      validated.notes
    );

    try {
      await notificationEngine.createAttendanceNotice(organizationId, id);
    } catch (error) {
      logger.warn('考勤通知发送失败', {
        attendanceId: id,
        error: (error as Error).message,
      });
    }

    logger.info('考勤记录更新成功', {
      attendanceId: id,
      organizationId,
      oldStatus: attendance.status,
      newStatus: validated.status,
    });

    sendSuccess(res, updated);
  })
);

router.get(
  '/schedule/:scheduleId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const { scheduleId } = req.params;

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
      orderBy: { createdAt: 'asc' },
    });

    sendSuccess(res, attendances);
  })
);

export default router;
