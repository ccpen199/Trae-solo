import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../constants/enums';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, PermissionDeniedError, ValidationError } from '../errors/AppError';
import cleaningDispatchEngine from '../engines/CleaningDispatchEngine';
import permissionService from '../services/PermissionService';
import auditLogService from '../services/AuditLogService';

export class CleaningController {
  getTasks = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { page = 1, limit = 20, status, propertyId } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    let where: Record<string, unknown> = {};

    if (userRole === UserRole.CLEANER) {
      where.cleanerId = userId;
    } else if (userRole === UserRole.LANDLORD) {
      if (propertyId) {
        where.propertyId = propertyId;
      } else {
        where.property = {
          ownerId: userId,
        };
      }
    }

    if (status) {
      where.status = status;
    }

    const [tasks, total] = await Promise.all([
      prisma.cleaningTask.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNo: true,
              guest: {
                select: {
                  id: true,
                  username: true,
                  realName: true,
                },
              },
            },
          },
          cleaner: {
            select: {
              id: true,
              username: true,
              phone: true,
            },
          },
        },
      }),
      prisma.cleaningTask.count({ where }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        tasks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  });

  getTask = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const hasAccess = await permissionService.checkCleaningTaskAccess(id, userId, userRole);
    if (!hasAccess) {
      throw new PermissionDeniedError();
    }

    const task = await prisma.cleaningTask.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNo: true,
            checkInDate: true,
            checkOutDate: true,
            guest: {
              select: {
                id: true,
                username: true,
                realName: true,
                phone: true,
              },
            },
          },
        },
        cleaner: {
          select: {
            id: true,
            username: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('保洁任务');
    }

    res.status(200).json({
      status: 'success',
      data: {
        task,
      },
    });
  });

  assignCleaner = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const { cleanerId } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!cleanerId) {
      throw new ValidationError('请选择保洁人员', { field: 'cleanerId' });
    }

    const hasAccess = await permissionService.checkCleaningTaskAccess(id, userId, userRole);
    if (!hasAccess) {
      throw new PermissionDeniedError();
    }

    if (userRole !== UserRole.LANDLORD && userRole !== UserRole.ADMIN) {
      throw new PermissionDeniedError('只有房东或管理员可以分配保洁人员');
    }

    const assignment = await cleaningDispatchEngine.assignCleaner(id, cleanerId, userId);

    await auditLogService.logAssign(
      'CleaningTask',
      id,
      null,
      { cleanerId },
      userId
    );

    logger.info(`Assigned cleaner ${cleanerId} to task ${id}`, { userId });

    res.status(200).json({
      status: 'success',
      data: {
        assignment,
      },
    });
  });

  autoDispatch = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const hasAccess = await permissionService.checkCleaningTaskAccess(id, userId, userRole);
    if (!hasAccess) {
      throw new PermissionDeniedError();
    }

    if (userRole !== UserRole.LANDLORD && userRole !== UserRole.ADMIN) {
      throw new PermissionDeniedError('只有房东或管理员可以自动派单');
    }

    const assignedCleanerId = await cleaningDispatchEngine.autoDispatch(id, userId);

    if (!assignedCleanerId) {
      res.status(200).json({
        status: 'success',
        data: {
          assigned: false,
          message: '没有找到可用的保洁人员',
        },
      });
      return;
    }

    await auditLogService.logAssign(
      'CleaningTask',
      id,
      null,
      { cleanerId: assignedCleanerId, autoAssigned: true },
      userId
    );

    logger.info(`Auto-dispatched task ${id} to cleaner ${assignedCleanerId}`, { userId });

    res.status(200).json({
      status: 'success',
      data: {
        assigned: true,
        cleanerId: assignedCleanerId,
      },
    });
  });

  startTask = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user.userId;

    if (req.user.role !== UserRole.CLEANER) {
      throw new PermissionDeniedError('只有保洁人员可以开始任务');
    }

    await cleaningDispatchEngine.startCleaning(id, userId);

    await auditLogService.logUpdate(
      'CleaningTask',
      id,
      null,
      { status: 'IN_PROGRESS' },
      userId
    );

    logger.info(`Cleaner ${userId} started task ${id}`);

    res.status(200).json({
      status: 'success',
      message: '任务已开始',
    });
  });

  completeTask = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.userId;

    if (req.user.role !== UserRole.CLEANER) {
      throw new PermissionDeniedError('只有保洁人员可以完成任务');
    }

    await cleaningDispatchEngine.completeCleaning(id, userId, notes);

    await auditLogService.logComplete(
      'CleaningTask',
      id,
      null,
      userId
    );

    logger.info(`Cleaner ${userId} completed task ${id}`);

    res.status(200).json({
      status: 'success',
      message: '任务已完成',
    });
  });

  verifyTask = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const { inspectionNotes } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const hasAccess = await permissionService.checkCleaningTaskAccess(id, userId, userRole);
    if (!hasAccess) {
      throw new PermissionDeniedError();
    }

    if (userRole !== UserRole.LANDLORD && userRole !== UserRole.ADMIN) {
      throw new PermissionDeniedError('只有房东或管理员可以核验任务');
    }

    await cleaningDispatchEngine.verifyCleaning(id, userId, inspectionNotes);

    await auditLogService.logUpdate(
      'CleaningTask',
      id,
      null,
      { status: 'INSPECTED', inspectionNotes },
      userId
    );

    logger.info(`Task ${id} verified by ${userId}`);

    res.status(200).json({
      status: 'success',
      message: '任务已核验',
    });
  });

  cancelTask = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const hasAccess = await permissionService.checkCleaningTaskAccess(id, userId, userRole);
    if (!hasAccess) {
      throw new PermissionDeniedError();
    }

    if (userRole !== UserRole.LANDLORD && userRole !== UserRole.ADMIN) {
      throw new PermissionDeniedError('只有房东或管理员可以取消任务');
    }

    await cleaningDispatchEngine.cancelTask(id, userId, reason);

    await auditLogService.logCancel(
      'CleaningTask',
      id,
      null,
      userId
    );

    logger.info(`Task ${id} cancelled by ${userId}`, { reason });

    res.status(200).json({
      status: 'success',
      message: '任务已取消',
    });
  });

  getStatistics = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.user.userId;
    const userRole = req.user.role;

    const stats = await cleaningDispatchEngine.getTaskStatistics(userId, userRole);

    res.status(200).json({
      status: 'success',
      data: {
        statistics: stats,
      },
    });
  });

  getAvailableCleaners = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { propertyId, date } = req.query;

    const cleaners = await prisma.user.findMany({
      where: {
        role: UserRole.CLEANER,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        phone: true,
        extraInfo: true,
        cleaningTasks: {
          where: {
            checkOutDate: date ? {
              equals: new Date(date as string),
            } : undefined,
            status: {
              in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'],
            },
          },
        },
      },
    });

    const availableCleaners = cleaners
      .filter(c => c.cleaningTasks.length === 0)
      .map(c => ({
        id: c.id,
        username: c.username,
        avatar: c.avatar,
        phone: c.phone,
        rating: (c.extraInfo as { rating?: number } | null)?.rating ?? null,
      }));

    res.status(200).json({
      status: 'success',
      data: {
        cleaners: availableCleaners,
      },
    });
  });
}

export const cleaningController = new CleaningController();
export default cleaningController;
