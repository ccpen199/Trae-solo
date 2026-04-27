import prisma from '../config/database';
import logger from '../config/logger';
import { auditService } from './auditService';
import { exceptionService, ExceptionType } from './exceptionService';
import { ProductionStatus, UserRole } from '../types';

export interface CreateProductionTaskParams {
  orderId: string;
  factoryId: string;
  title: string;
  description?: string;
  scheduledStartAt?: Date;
  scheduledEndAt?: Date;
}

export interface UpdateProductionProgressParams {
  taskId: string;
  factoryId: string;
  progress: number;
  status?: ProductionStatus;
  notes?: string;
}

export interface CompleteProductionTaskParams {
  taskId: string;
  factoryId: string;
  qualityCheckNotes?: string;
  progressNotes?: string;
}

export class ProductionService {
  async createProductionTask(params: CreateProductionTaskParams): Promise<any> {
    const { orderId, factoryId, title, description, scheduledStartAt, scheduledEndAt } = params;

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          split: true
        }
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.status !== 'SPLIT_COMPLETED' && order.status !== 'PRODUCTION_SCHEDULED') {
        throw new Error(`订单状态不正确，当前状态: ${order.status}`);
      }

      if (!order.split) {
        throw new Error('订单拆单数据不存在');
      }

      const factory = await prisma.user.findUnique({
        where: { id: factoryId },
        include: { factoryProfile: true }
      });

      if (!factory || factory.role !== 'FACTORY') {
        throw new Error('工厂不存在或角色不正确');
      }

      const existingTasks = await prisma.productionTask.findMany({
        where: { orderId }
      });

      if (existingTasks.length > 0) {
        const activeTasks = existingTasks.filter(t => 
          t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
        );
        if (activeTasks.length > 0) {
          throw new Error('该订单已有进行中的生产任务');
        }
      }

      const taskNumber = await this.generateTaskNumber();

      const task = await prisma.$transaction(async (tx) => {
        const newTask = await tx.productionTask.create({
          data: {
            taskNumber,
            orderId,
            factoryId,
            title,
            description,
            status: 'SCHEDULED' as ProductionStatus,
            splitData: order.split,
            scheduledStartAt,
            scheduledEndAt,
            progress: 0
          }
        });

        await tx.order.update({
          where: { id: orderId },
          data: { status: 'PRODUCTION_SCHEDULED' as any }
        });

        return newTask;
      });

      await auditService.createLog({
        entityType: 'ProductionTask',
        entityId: task.id,
        action: 'PRODUCTION_TASK_CREATED',
        actorId: factoryId,
        actorRole: 'FACTORY',
        newState: {
          id: task.id,
          taskNumber: task.taskNumber,
          orderId,
          status: task.status
        },
        reason: '创建生产任务',
        metadata: { factoryName: factory.name }
      });

      logger.info(`[ProductionService] 生产任务创建成功: taskNumber=${taskNumber}, orderId=${orderId}`);

      return task;
    } catch (error: any) {
      await exceptionService.createException({
        orderId: params.orderId,
        entityType: 'ProductionTask',
        exceptionType: 'PRODUCTION_ERROR',
        message: `创建生产任务失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async startProductionTask(taskId: string, factoryId: string): Promise<any> {
    try {
      const task = await prisma.productionTask.findUnique({
        where: { id: taskId }
      });

      if (!task) {
        throw new Error('生产任务不存在');
      }

      if (task.factoryId !== factoryId) {
        throw new Error('工厂无权限操作此任务');
      }

      if (task.status !== 'PENDING' && task.status !== 'SCHEDULED') {
        throw new Error(`生产任务状态不正确，当前状态: ${task.status}`);
      }

      const previousState = {
        status: task.status,
        actualStartAt: task.actualStartAt
      };

      const updatedTask = await prisma.$transaction(async (tx) => {
        const newTask = await tx.productionTask.update({
          where: { id: taskId },
          data: {
            status: 'IN_PRODUCTION' as ProductionStatus,
            actualStartAt: new Date()
          }
        });

        await tx.order.update({
          where: { id: task.orderId },
          data: { status: 'PRODUCTION_IN_PROGRESS' as any }
        });

        await tx.productionProgress.create({
          data: {
            taskId,
            previousProgress: task.progress,
            newProgress: task.progress,
            status: 'IN_PRODUCTION' as ProductionStatus,
            actorId: factoryId,
            notes: '开始生产'
          }
        });

        return newTask;
      });

      await auditService.createLog({
        entityType: 'ProductionTask',
        entityId: taskId,
        action: 'PRODUCTION_STARTED',
        actorId: factoryId,
        actorRole: 'FACTORY',
        previousState,
        newState: {
          status: updatedTask.status,
          actualStartAt: updatedTask.actualStartAt
        },
        reason: '开始生产加工'
      });

      logger.info(`[ProductionService] 生产任务开始: taskId=${taskId}`);

      return updatedTask;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'ProductionTask',
        entityId: taskId,
        exceptionType: 'PRODUCTION_ERROR',
        message: `开始生产任务失败: ${error.message}`,
        context: { taskId, factoryId },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async updateProductionProgress(params: UpdateProductionProgressParams): Promise<any> {
    const { taskId, factoryId, progress, status, notes } = params;

    try {
      const task = await prisma.productionTask.findUnique({
        where: { id: taskId }
      });

      if (!task) {
        throw new Error('生产任务不存在');
      }

      if (task.factoryId !== factoryId) {
        throw new Error('工厂无权限操作此任务');
      }

      if (progress < 0 || progress > 100) {
        throw new Error('进度值必须在 0-100 之间');
      }

      const previousState = {
        progress: task.progress,
        status: task.status,
        progressNotes: task.progressNotes
      };

      const newStatus = status || (progress >= 100 ? 'QUALITY_CHECK' as ProductionStatus : task.status);

      const updatedTask = await prisma.$transaction(async (tx) => {
        const newTask = await tx.productionTask.update({
          where: { id: taskId },
          data: {
            progress,
            status: newStatus,
            progressNotes: notes
          }
        });

        await tx.productionProgress.create({
          data: {
            taskId,
            previousProgress: task.progress,
            newProgress: progress,
            status: newStatus,
            actorId: factoryId,
            notes
          }
        });

        return newTask;
      });

      await auditService.createLog({
        entityType: 'ProductionTask',
        entityId: taskId,
        action: 'PRODUCTION_PROGRESS_UPDATED',
        actorId: factoryId,
        actorRole: 'FACTORY',
        previousState,
        newState: {
          progress: updatedTask.progress,
          status: updatedTask.status
        },
        reason: '更新生产进度',
        metadata: { progress, notes }
      });

      logger.info(`[ProductionService] 生产进度更新: taskId=${taskId}, progress=${progress}%`);

      return updatedTask;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'ProductionTask',
        entityId: params.taskId,
        exceptionType: 'PRODUCTION_ERROR',
        message: `更新生产进度失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async completeProductionTask(params: CompleteProductionTaskParams): Promise<any> {
    const { taskId, factoryId, qualityCheckNotes, progressNotes } = params;

    try {
      const task = await prisma.productionTask.findUnique({
        where: { id: taskId }
      });

      if (!task) {
        throw new Error('生产任务不存在');
      }

      if (task.factoryId !== factoryId) {
        throw new Error('工厂无权限操作此任务');
      }

      if (task.progress < 100) {
        throw new Error('生产进度未完成，无法完成任务');
      }

      const previousState = {
        status: task.status,
        actualEndAt: task.actualEndAt,
        qualityCheckNotes: task.qualityCheckNotes
      };

      const updatedTask = await prisma.$transaction(async (tx) => {
        const newTask = await tx.productionTask.update({
          where: { id: taskId },
          data: {
            status: 'COMPLETED' as ProductionStatus,
            actualEndAt: new Date(),
            qualityCheckNotes
          }
        });

        await tx.order.update({
          where: { id: task.orderId },
          data: { status: 'PRODUCTION_COMPLETED' as any }
        });

        await tx.productionProgress.create({
          data: {
            taskId,
            previousProgress: task.progress,
            newProgress: 100,
            status: 'COMPLETED' as ProductionStatus,
            actorId: factoryId,
            notes: progressNotes || '生产完成'
          }
        });

        return newTask;
      });

      await auditService.createLog({
        entityType: 'ProductionTask',
        entityId: taskId,
        action: 'PRODUCTION_COMPLETED',
        actorId: factoryId,
        actorRole: 'FACTORY',
        previousState,
        newState: {
          status: updatedTask.status,
          actualEndAt: updatedTask.actualEndAt
        },
        reason: '生产任务完成',
        metadata: { qualityCheckNotes }
      });

      logger.info(`[ProductionService] 生产任务完成: taskId=${taskId}`);

      return updatedTask;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'ProductionTask',
        entityId: params.taskId,
        exceptionType: 'PRODUCTION_ERROR',
        message: `完成生产任务失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async getProductionTaskById(taskId: string): Promise<any> {
    return prisma.productionTask.findUnique({
      where: { id: taskId },
      include: {
        order: {
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            split: true
          }
        },
        factory: {
          select: { id: true, name: true, phone: true },
          include: { factoryProfile: true }
        },
        progressHistory: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  async getProductionTasksByOrder(orderId: string): Promise<any[]> {
    return prisma.productionTask.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: {
        factory: { select: { id: true, name: true } },
        progressHistory: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async getProductionTasksByFactory(factoryId: string, status?: ProductionStatus): Promise<any[]> {
    const where: any = { factoryId };
    if (status) {
      where.status = status;
    }

    return prisma.productionTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: { id: true, orderNumber: true, title: true }
        }
      }
    });
  }

  async getActiveProductionTasks(): Promise<any[]> {
    return prisma.productionTask.findMany({
      where: {
        status: {
          in: ['SCHEDULED', 'IN_PRODUCTION', 'QUALITY_CHECK']
        }
      },
      orderBy: { createdAt: 'asc' },
      include: {
        order: {
          select: { id: true, orderNumber: true, title: true }
        },
        factory: { select: { id: true, name: true } }
      }
    });
  }

  private async generateTaskNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');

    const count = await prisma.productionTask.count({
      where: {
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        }
      }
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `PT${dateStr}${sequence}`;
  }
}

export const productionService = new ProductionService();
export default ProductionService;
