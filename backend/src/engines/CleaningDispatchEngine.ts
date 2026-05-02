import { CleaningStatus } from '../constants/enums';
import { addDays, startOfDay, isBefore, format } from 'date-fns';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import redis from '../lib/redis';
import { NotFoundError, StatusConflictError, BusinessRuleViolationError } from '../errors/AppError';

export interface CleaningTaskCreateOptions {
  orderId: string;
  propertyId: string;
  checkOutDate: Date;
  estimatedHours?: number;
  priority?: number;
  notes?: string;
  userId: string;
}

export interface CleanerAssignment {
  cleanerId: string;
  taskId: string;
  assignedAt: Date;
  estimatedStartTime?: Date;
}

export interface TaskPriorityRule {
  propertyType: string;
  checkOutTime: string;
  priorityBoost: number;
}

export class CleaningDispatchEngine {
  private readonly LOCK_PREFIX = 'cleaning:dispatch:lock:';
  private readonly LOCK_TTL = 60;

  private readonly defaultPriorityRules: TaskPriorityRule[] = [
    { propertyType: 'apartment', checkOutTime: '11:00', priorityBoost: 2 },
    { propertyType: 'house', checkOutTime: '11:00', priorityBoost: 3 },
    { propertyType: 'villa', checkOutTime: '12:00', priorityBoost: 5 },
  ];

  async createCleaningTask(
    options: CleaningTaskCreateOptions
  ): Promise<string> {
    const { orderId, propertyId, checkOutDate, estimatedHours = 2, priority = 5, notes, userId } = options;

    const existingTask = await prisma.cleaningTask.findFirst({
      where: { orderId },
    });

    if (existingTask) {
      throw new BusinessRuleViolationError(
        '该订单的保洁任务已存在',
        'CLEANING_TASK_EXISTS'
      );
    }

    const taskNo = await this.generateTaskNo();

    const scheduledTime = this.calculateScheduledTime(checkOutDate);

    const task = await prisma.cleaningTask.create({
      data: {
        taskNo,
        orderId,
        propertyId,
        checkOutDate: startOfDay(checkOutDate),
        scheduledTime,
        estimatedHours,
        status: CleaningStatus.PENDING,
        priority,
        notes,
      },
    });

    logger.info(`Created cleaning task ${task.taskNo} for order ${orderId}`, {
      userId,
      propertyId,
      priority,
      scheduledTime,
    });

    return task.id;
  }

  async assignCleaner(
    taskId: string,
    cleanerId: string,
    userId: string,
    estimatedStartTime?: Date
  ): Promise<CleanerAssignment> {
    const lockKey = `${this.LOCK_PREFIX}${taskId}`;
    const lockValue = `${Date.now()}`;

    const lockAcquired = await redis.set(lockKey, lockValue, 'EX', this.LOCK_TTL, 'NX');

    if (!lockAcquired) {
      throw new StatusConflictError(
        '该保洁任务正在被分配，请稍后重试',
        'CleaningTask',
        taskId
      );
    }

    try {
      const task = await prisma.cleaningTask.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new NotFoundError('保洁任务');
      }

      if (task.status !== CleaningStatus.PENDING && task.status !== CleaningStatus.CANCELLED) {
        throw new BusinessRuleViolationError(
          '只能分配待处理或已取消的保洁任务',
          'CLEANING_ASSIGNMENT_RULE'
        );
      }

      const cleaner = await prisma.user.findUnique({
        where: { id: cleanerId },
      });

      if (!cleaner) {
        throw new NotFoundError('保洁人员');
      }

      if (cleaner.role !== 'CLEANER') {
        throw new BusinessRuleViolationError(
          '只能分配给保洁人员',
          'CLEANER_ROLE_VALIDATION'
        );
      }

      const updatedTask = await prisma.cleaningTask.update({
        where: { id: taskId },
        data: {
          cleanerId,
          status: CleaningStatus.ASSIGNED,
        },
      });

      logger.info(`Assigned cleaner ${cleanerId} to task ${taskId}`, {
        userId,
        taskNo: updatedTask.taskNo,
      });

      return {
        cleanerId,
        taskId,
        assignedAt: new Date(),
        estimatedStartTime,
      };
    } finally {
      await redis.del(lockKey);
    }
  }

  async autoDispatch(
    taskId: string,
    userId: string
  ): Promise<string | null> {
    const task = await prisma.cleaningTask.findUnique({
      where: { id: taskId },
      include: {
        property: true,
      },
    });

    if (!task) {
      throw new NotFoundError('保洁任务');
    }

    if (task.status !== CleaningStatus.PENDING) {
      throw new BusinessRuleViolationError(
        '只能自动分配待处理的保洁任务',
        'AUTODISPATCH_RULE'
      );
    }

    const availableCleaners = await this.findAvailableCleaners(
      task.propertyId,
      task.checkOutDate
    );

    if (availableCleaners.length === 0) {
      logger.warn(`No available cleaners found for auto-dispatch of task ${taskId}`);
      return null;
    }

    const bestCleaner = this.selectBestCleaner(availableCleaners, task);

    await this.assignCleaner(taskId, bestCleaner.id, userId);

    return bestCleaner.id;
  }

  private async findAvailableCleaners(
    propertyId: string,
    checkOutDate: Date
  ): Promise<Array<{ id: string; username: string; rating?: number | null; taskCount: number }>> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { latitude: true, longitude: true },
    });

    const allCleaners = await prisma.user.findMany({
      where: {
        role: 'CLEANER',
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        extraInfo: true,
        cleaningTasks: {
          where: {
            checkOutDate: {
              gte: startOfDay(checkOutDate),
              lt: addDays(startOfDay(checkOutDate), 1),
            },
            status: {
              in: [CleaningStatus.ASSIGNED, CleaningStatus.IN_PROGRESS],
            },
          },
        },
      },
    });

    return allCleaners
      .filter(c => c.cleaningTasks.length === 0)
      .map(c => ({
        id: c.id,
        username: c.username,
        rating: (c.extraInfo as { rating?: number } | null)?.rating ?? null,
        taskCount: c.cleaningTasks.length,
      }));
  }

  private selectBestCleaner(
    cleaners: Array<{ id: string; username: string; rating?: number | null; taskCount: number }>,
    _task: { id: string; priority: number }
  ): { id: string; username: string; rating?: number | null; taskCount: number } {
    return cleaners.sort((a, b) => {
      const ratingA = a.rating ?? 0;
      const ratingB = b.rating ?? 0;
      return ratingB - ratingA;
    })[0];
  }

  async startCleaning(taskId: string, userId: string): Promise<void> {
    const task = await prisma.cleaningTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundError('保洁任务');
    }

    if (task.status !== CleaningStatus.ASSIGNED) {
      throw new BusinessRuleViolationError(
        '只能开始已分配的保洁任务',
        'CLEANING_STATUS_RULE'
      );
    }

    if (task.cleanerId !== userId) {
      throw new BusinessRuleViolationError(
        '只能开始分配给自己的保洁任务',
        'CLEANING_OWNERSHIP_RULE'
      );
    }

    await prisma.cleaningTask.update({
      where: { id: taskId },
      data: {
        status: CleaningStatus.IN_PROGRESS,
      },
    });

    logger.info(`Cleaner ${userId} started cleaning task ${taskId}`);
  }

  async completeCleaning(taskId: string, userId: string, notes?: string): Promise<void> {
    const task = await prisma.cleaningTask.findUnique({
      where: { id: taskId },
      include: { order: true },
    });

    if (!task) {
      throw new NotFoundError('保洁任务');
    }

    if (task.status !== CleaningStatus.IN_PROGRESS) {
      throw new BusinessRuleViolationError(
        '只能完成进行中的保洁任务',
        'CLEANING_STATUS_RULE'
      );
    }

    if (task.cleanerId !== userId) {
      throw new BusinessRuleViolationError(
        '只能完成分配给自己的保洁任务',
        'CLEANING_OWNERSHIP_RULE'
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.cleaningTask.update({
        where: { id: taskId },
        data: {
          status: CleaningStatus.COMPLETED,
          completedAt: new Date(),
          notes,
        },
      });

      if (task.order) {
        const checkOutDate = startOfDay(task.checkOutDate);
        
        const calendar = await tx.roomCalendar.findUnique({
          where: {
            propertyId_date: {
              propertyId: task.propertyId,
              date: checkOutDate,
            },
          },
        });

        if (calendar && calendar.status === 'CLEANING') {
          await tx.roomCalendar.update({
            where: {
              propertyId_date: {
                propertyId: task.propertyId,
                date: checkOutDate,
              },
            },
            data: {
              status: 'AVAILABLE',
            },
          });
        }
      }
    });

    logger.info(`Cleaner ${userId} completed cleaning task ${taskId}`);
  }

  async verifyCleaning(taskId: string, userId: string, inspectionNotes?: string): Promise<void> {
    const task = await prisma.cleaningTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundError('保洁任务');
    }

    if (task.status !== CleaningStatus.COMPLETED) {
      throw new BusinessRuleViolationError(
        '只能核验已完成的保洁任务',
        'CLEANING_VERIFICATION_RULE'
      );
    }

    await prisma.cleaningTask.update({
      where: { id: taskId },
      data: {
        status: CleaningStatus.INSPECTED,
        inspectionNotes,
        verifiedAt: new Date(),
      },
    });

    logger.info(`Verified cleaning task ${taskId} by ${userId}`, {
      inspectionNotes,
    });
  }

  async cancelTask(taskId: string, userId: string, reason?: string): Promise<void> {
    const task = await prisma.cleaningTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundError('保洁任务');
    }

    if (task.status === CleaningStatus.IN_PROGRESS) {
      throw new BusinessRuleViolationError(
        '不能取消进行中的保洁任务',
        'CLEANING_CANCELLATION_RULE'
      );
    }

    if (task.status === CleaningStatus.CANCELLED) {
      return;
    }

    await prisma.cleaningTask.update({
      where: { id: taskId },
      data: {
        status: CleaningStatus.CANCELLED,
      },
    });

    logger.info(`Cancelled cleaning task ${taskId} by ${userId}`, {
      reason,
    });
  }

  async getTaskStatistics(userId: string, userRole: string) {
    let where: Record<string, unknown> = {};

    if (userRole === 'CLEANER') {
      where = { cleanerId: userId };
    } else if (userRole === 'LANDLORD') {
      where = {
        property: {
          ownerId: userId,
        },
      };
    }

    const tasks = await prisma.cleaningTask.findMany({
      where,
      select: {
        id: true,
        status: true,
        priority: true,
      },
    });

    const stats = {
      total: tasks.length,
      byStatus: {
        pending: 0,
        assigned: 0,
        inProgress: 0,
        completed: 0,
        inspected: 0,
        cancelled: 0,
      },
      highPriority: 0,
    };

    for (const task of tasks) {
      switch (task.status) {
        case CleaningStatus.PENDING:
          stats.byStatus.pending++;
          break;
        case CleaningStatus.ASSIGNED:
          stats.byStatus.assigned++;
          break;
        case CleaningStatus.IN_PROGRESS:
          stats.byStatus.inProgress++;
          break;
        case CleaningStatus.COMPLETED:
          stats.byStatus.completed++;
          break;
        case CleaningStatus.INSPECTED:
          stats.byStatus.inspected++;
          break;
        case CleaningStatus.CANCELLED:
          stats.byStatus.cancelled++;
          break;
      }

      if (task.priority >= 8) {
        stats.highPriority++;
      }
    }

    return stats;
  }

  private async generateTaskNo(): Promise<string> {
    const dateStr = format(new Date(), 'yyyyMMdd');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CLN${dateStr}${random}`;
  }

  private calculateScheduledTime(checkOutDate: Date): Date {
    const scheduled = new Date(checkOutDate);
    scheduled.setHours(12, 0, 0, 0);
    return scheduled;
  }
}

export const cleaningDispatchEngine = new CleaningDispatchEngine();
export default cleaningDispatchEngine;
