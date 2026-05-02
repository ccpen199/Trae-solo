import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest, authenticate, getOrganizationId, getUserId, getUserRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { sendSuccess, sendPaginated } from '../utils/response';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { notificationEngine } from '../engines/notification.engine';
import { NotificationStatus, NotificationType, UserRole } from '../config/constants';
import logger from '../utils/logger';

const prisma = new PrismaClient();
const router = Router();

const markReadSchema = z.object({
  notificationIds: z.array(z.string()).min(1, '通知ID列表不能为空'),
});

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const userId = getUserId(req);

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;
    const unreadFirst = req.query.unreadFirst !== 'false';

    const result = await notificationEngine.getUserNotifications(userId, organizationId, {
      status,
      type,
      page,
      pageSize,
      unreadFirst,
    });

    sendPaginated(res, result.notifications, {
      page,
      pageSize,
      total: result.pagination.total,
    });
  })
);

router.get(
  '/unread-count',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const userId = getUserId(req);

    const count = await prisma.notification.count({
      where: {
        userId,
        organizationId,
        status: NotificationStatus.PENDING,
      },
    });

    sendSuccess(res, {
      unreadCount: count,
    });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const organizationId = getOrganizationId(req);
    const userId = getUserId(req);
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
        organizationId,
      },
      include: {
        schedule: {
          include: {
            course: true,
            teacher: true,
            classroom: true,
          },
        },
      },
    });

    if (!notification) {
      throw new NotFoundError('通知不存在');
    }

    sendSuccess(res, notification);
  })
);

router.post(
  '/:id/read',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = getUserId(req);
    const { id } = req.params;

    const notification = await notificationEngine.markAsRead(id, userId);

    logger.info('通知已标记为已读', {
      notificationId: id,
      userId,
    });

    sendSuccess(res, notification);
  })
);

router.post(
  '/batch-read',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = getUserId(req);
    const organizationId = getOrganizationId(req);
    const validated = markReadSchema.parse(req.body);

    const result = await prisma.notification.updateMany({
      where: {
        id: { in: validated.notificationIds },
        userId,
        organizationId,
        status: NotificationStatus.PENDING,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    logger.info('批量标记通知已读', {
      userId,
      count: result.count,
      notificationIds: validated.notificationIds,
    });

    sendSuccess(res, {
      message: `已标记 ${result.count} 条通知为已读`,
      count: result.count,
    });
  })
);

router.post(
  '/mark-all-read',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = getUserId(req);
    const organizationId = getOrganizationId(req);

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        organizationId,
        status: NotificationStatus.PENDING,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    logger.info('标记所有通知已读', {
      userId,
      count: result.count,
    });

    sendSuccess(res, {
      message: `已标记 ${result.count} 条通知为已读`,
      count: result.count,
    });
  })
);

export default router;
