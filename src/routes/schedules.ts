import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest, authenticate, requireTeacher, requireAdmin, getOrganizationId, getUserId, getUserRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';
import { NotFoundError, BadRequestError, ValidationError } from '../utils/errors';
import { timetableEngine, detectAllConflicts, suggestAlternativeSlots } from '../engines/timetable.engine';
import { notificationEngine } from '../engines/notification.engine';
import { ScheduleStatus, UserRole } from '../config/constants';
import logger from '../utils/logger';

const prisma = new PrismaClient();
const router = Router();

const createScheduleSchema = z.object({
  courseId: z.string().min(1, '课程ID不能为空'),
  teacherId: z.string().min(1, '教师ID不能为空'),
  classroomId: z.string().optional(),
  date: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, '开始时间格式应为 HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, '结束时间格式应为 HH:MM'),
  duration: z.coerce.number().min(1, '时长至少1分钟'),
  maxStudents: z.coerce.number().min(1, '最大人数至少1人').optional(),
  notes: z.string().optional(),
  isRecurring: z.coerce.boolean().optional(),
  recurringRule: z.string().optional(),
});

const updateScheduleSchema = z.object({
  teacherId: z.string().optional(),
  classroomId: z.string().nullable().optional(),
  date: z.coerce.date().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, '开始时间格式应为 HH:MM').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, '结束时间格式应为 HH:MM').optional(),
  duration: z.coerce.number().min(1, '时长至少1分钟').optional(),
  maxStudents: z.coerce.number().min(1, '最大人数至少1人').optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
});

const detectConflictSchema = z.object({
  teacherId: z.string().min(1, '教师ID不能为空'),
  classroomId: z.string().optional(),
  date: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, '开始时间格式应为 HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, '结束时间格式应为 HH:MM'),
  excludeScheduleId: z.string().optional(),
});

const suggestSlotsSchema = z.object({
  teacherId: z.string().min(1, '教师ID不能为空'),
  classroomId: z.string().optional(),
  baseDate: z.coerce.date(),
  preferredStartTime: z.string().regex(/^\d{2}:\d{2}$/, '开始时间格式应为 HH:MM'),
  durationMinutes: z.coerce.number().min(30, '时长至少30分钟'),
  daysToCheck: z.coerce.number().min(1).max(30).optional(),
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
    const status = req.query.status as ScheduleStatus | undefined;
    const teacherId = req.query.teacherId as string | undefined;
    const courseId = req.query.courseId as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const where: Record<string, unknown> = {
      organizationId,
    };

    if (userRole === UserRole.TEACHER) {
      where.teacherId = userId;
    } else if (userRole === UserRole.STUDENT || userRole === UserRole.PARENT) {
      where.attendances = {
        some: {
          studentId: userRole === UserRole.PARENT ? undefined : userId,
        },
      };
    }

    if (status) {
      where.status = status;
    }
    if (teacherId) {
      where.teacherId = teacherId;
    }
    if (courseId) {
      where.courseId = courseId;
    }
    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const total = await prisma.schedule.count({ where });

    const schedules = await prisma.schedule.findMany({
      where,
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
        attendances: {
          include: {
            student: {
              select: {
                id: true,
                realName: true,
                phone: true,
              },
            },
          },
        },
        _count: {
          select: { attendances: true },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    sendPaginated(res, schedules, { page, pageSize, total });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;

    const schedule = await prisma.schedule.findFirst({
      where: {
        id,
        organizationId,
      },
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
        attendances: {
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
        },
        notifications: true,
      },
    });

    if (!schedule) {
      throw new NotFoundError('课表不存在');
    }

    sendSuccess(res, schedule);
  })
);

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const validated = createScheduleSchema.parse(req.body);

    const schedule = await timetableEngine.validateAndCreateSchedule(organizationId, {
      ...validated,
    });

    logger.info('课表创建成功', {
      scheduleId: schedule.id,
      organizationId,
    });

    sendCreated(res, schedule);
  })
);

router.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;
    const validated = updateScheduleSchema.parse(req.body);

    const schedule = await timetableEngine.updateSchedule(id, organizationId, validated);

    logger.info('课表更新成功', {
      scheduleId: id,
      organizationId,
    });

    sendSuccess(res, schedule);
  })
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;

    const schedule = await prisma.schedule.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        attendances: {
          include: {
            consumption: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundError('课表不存在');
    }

    if (schedule.attendances.some(a => a.consumption)) {
      throw new BadRequestError('课表已有课消记录，无法删除');
    }

    await prisma.schedule.update({
      where: { id },
      data: {
        status: ScheduleStatus.CANCELLED,
      },
    });

    logger.info('课表已取消', {
      scheduleId: id,
      organizationId,
    });

    sendSuccess(res, { message: '课表已取消', scheduleId: id });
  })
);

router.post(
  '/:id/confirm',
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;

    const schedule = await prisma.schedule.update({
      where: {
        id,
        organizationId,
      },
      data: {
        status: ScheduleStatus.CONFIRMED,
      },
      include: {
        course: true,
        teacher: true,
        classroom: true,
      },
    });

    logger.info('课表已确认', {
      scheduleId: id,
      organizationId,
    });

    sendSuccess(res, schedule);
  })
);

router.post(
  '/:id/send-reminder',
  requireTeacher,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const { id } = req.params;
    const reminderMinutes = parseInt(req.body.reminderMinutes as string) || 60;

    const results = await notificationEngine.createScheduleReminder({
      organizationId,
      scheduleId: id,
      reminderMinutes,
    });

    logger.info('课表提醒已发送', {
      scheduleId: id,
      organizationId,
      count: results.length,
    });

    sendSuccess(res, {
      message: `已发送 ${results.length} 条提醒`,
      notifications: results,
    });
  })
);

router.post(
  '/detect-conflict',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const validated = detectConflictSchema.parse(req.body);

    const result = await detectAllConflicts(
      organizationId,
      validated.teacherId,
      validated.date,
      validated.startTime,
      validated.endTime,
      validated.classroomId,
      validated.excludeScheduleId
    );

    sendSuccess(res, {
      hasConflict: result.hasConflict,
      conflicts: result.conflicts,
    });
  })
);

router.post(
  '/suggest-slots',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const validated = suggestSlotsSchema.parse(req.body);

    const suggestions = await suggestAlternativeSlots(
      organizationId,
      validated.teacherId,
      validated.baseDate,
      validated.preferredStartTime,
      validated.durationMinutes,
      validated.classroomId,
      validated.daysToCheck
    );

    sendSuccess(res, {
      suggestions: suggestions.map(s => ({
        date: s.date.toISOString().slice(0, 10),
        startTime: s.startTime,
        endTime: s.endTime,
        score: s.score,
      })),
    });
  })
);

export default router;
