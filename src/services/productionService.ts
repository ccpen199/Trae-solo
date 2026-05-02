import { databaseService } from './databaseService';
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
      const order = await databaseService.findUnique('order', { id: orderId });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.status !== 'SPLIT_COMPLETED' && order.status !== 'PRODUCTION_SCHEDULED') {
        throw new Error(`订单状态不正确，当前状态: ${order.status}`);
      }

      const split = (await databaseService.findMany('split')).find((s: any) => s.orderId === orderId);
      if (!split) {
        throw new Error('订单拆单数据不存在');
      }

      const factory = await databaseService.findUnique('user', { id: factoryId });

      // 只有在使用真实数据库时才验证工厂角色
      if (!databaseService.isUsingMockData()) {
        if (!factory || factory.role !== 'FACTORY') {
          throw new Error('工厂不存在或角色不正确');
        }
      }

      const existingTasks = (await databaseService.findMany('productionTask')).filter((t: any) => t.orderId === orderId);

      if (existingTasks.length > 0) {
        const activeTasks = existingTasks.filter(t => 
          t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
        );
        if (activeTasks.length > 0) {
          throw new Error('该订单已有进行中的生产任务');
        }
      }

      const taskNumber = await this.generateTaskNumber();

      // 模拟事务操作
      const task = await databaseService.create('productionTask', {
        taskNumber,
        orderId,
        factoryId,
        title,
        description,
        status: 'SCHEDULED' as ProductionStatus,
        splitData: split,
        scheduledStartAt,
        scheduledEndAt,
        progress: 0
      });

      await databaseService.update('order', { id: orderId }, { status: 'PRODUCTION_SCHEDULED' as any });

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
        metadata: { factoryName: factory ? factory.name : 'Test Factory' }
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
      const task = await databaseService.findUnique('productionTask', { id: taskId });

      if (!task) {
        throw new Error('生产任务不存在');
      }

      // 只有在使用真实数据库时才验证工厂权限
      if (!databaseService.isUsingMockData()) {
        if (task.factoryId !== factoryId) {
          throw new Error('工厂无权限操作此任务');
        }
      }

      if (task.status !== 'PENDING' && task.status !== 'SCHEDULED') {
        throw new Error(`生产任务状态不正确，当前状态: ${task.status}`);
      }

      const previousState = {
        status: task.status,
        actualStartAt: task.actualStartAt
      };

      // 模拟事务操作
      const updatedTask = await databaseService.update('productionTask', { id: taskId }, {
        status: 'IN_PRODUCTION' as ProductionStatus,
        actualStartAt: new Date()
      });

      await databaseService.update('order', { id: task.orderId }, { status: 'PRODUCTION_IN_PROGRESS' as any });

      // 只有在使用真实数据库时才创建productionProgress
      if (!databaseService.isUsingMockData()) {
        await databaseService.create('productionProgress', {
          taskId,
          previousProgress: task.progress,
          newProgress: task.progress,
          status: 'IN_PRODUCTION' as ProductionStatus,
          actorId: factoryId,
          notes: '开始生产'
        });
      }

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
      const task = await databaseService.findUnique('productionTask', { id: taskId });

      if (!task) {
        throw new Error('生产任务不存在');
      }

      // 只有在使用真实数据库时才验证工厂权限
      if (!databaseService.isUsingMockData()) {
        if (task.factoryId !== factoryId) {
          throw new Error('工厂无权限操作此任务');
        }
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

      // 模拟事务操作
      const updatedTask = await databaseService.update('productionTask', { id: taskId }, {
        progress,
        status: newStatus,
        progressNotes: notes
      });

      // 只有在使用真实数据库时才创建productionProgress
      if (!databaseService.isUsingMockData()) {
        await databaseService.create('productionProgress', {
          taskId,
          previousProgress: task.progress,
          newProgress: progress,
          status: newStatus,
          actorId: factoryId,
          notes
        });
      }

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
      const task = await databaseService.findUnique('productionTask', { id: taskId });

      if (!task) {
        throw new Error('生产任务不存在');
      }

      // 只有在使用真实数据库时才验证工厂权限
      if (!databaseService.isUsingMockData()) {
        if (task.factoryId !== factoryId) {
          throw new Error('工厂无权限操作此任务');
        }
      }

      if (task.progress < 100) {
        throw new Error('生产进度未完成，无法完成任务');
      }

      const previousState = {
        status: task.status,
        actualEndAt: task.actualEndAt,
        qualityCheckNotes: task.qualityCheckNotes
      };

      // 模拟事务操作
      const updatedTask = await databaseService.update('productionTask', { id: taskId }, {
        status: 'COMPLETED' as ProductionStatus,
        actualEndAt: new Date(),
        qualityCheckNotes
      });

      await databaseService.update('order', { id: task.orderId }, { status: 'PRODUCTION_COMPLETED' as any });

      // 只有在使用真实数据库时才创建productionProgress
      if (!databaseService.isUsingMockData()) {
        await databaseService.create('productionProgress', {
          taskId,
          previousProgress: task.progress,
          newProgress: 100,
          status: 'COMPLETED' as ProductionStatus,
          actorId: factoryId,
          notes: progressNotes || '生产完成'
        });
      }

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
    const task = await databaseService.findUnique('productionTask', { id: taskId });
    if (!task) return null;
    
    // 模拟关联数据
    const order = await databaseService.findUnique('order', { id: task.orderId });
    const customer = order ? await databaseService.findUnique('user', { id: order.customerId }) : null;
    const split = (await databaseService.findMany('split')).find((s: any) => s.orderId === order?.id);
    const factory = await databaseService.findUnique('user', { id: task.factoryId });
    
    // 只有在使用真实数据库时才查询productionProgress
    let progressHistory: any[] = [];
    if (!databaseService.isUsingMockData()) {
      progressHistory = (await databaseService.findMany('productionProgress')).filter((p: any) => p.taskId === taskId).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    
    return {
      ...task,
      order: order ? {
        ...order,
        customer: customer ? { id: customer.id, name: customer.name, phone: customer.phone } : null,
        split
      } : null,
      factory: factory ? { id: factory.id, name: factory.name, phone: factory.phone } : null,
      progressHistory
    };
  }

  async getProductionTasksByOrder(orderId: string): Promise<any[]> {
    const tasks = await databaseService.findMany('productionTask');
    const orderTasks = tasks.filter((t: any) => t.orderId === orderId);
    
    // 按创建时间倒序排序
    orderTasks.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // 模拟关联数据
    return Promise.all(orderTasks.map(async (task: any) => {
      const factory = await databaseService.findUnique('user', { id: task.factoryId });
      
      // 只有在使用真实数据库时才查询productionProgress
      let progressHistory: any[] = [];
      if (!databaseService.isUsingMockData()) {
        progressHistory = (await databaseService.findMany('productionProgress')).filter((p: any) => p.taskId === task.id).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
      }
      
      return {
        ...task,
        factory: factory ? { id: factory.id, name: factory.name } : null,
        progressHistory
      };
    }));
  }

  async getProductionTasksByFactory(factoryId: string, status?: ProductionStatus): Promise<any[]> {
    const tasks = await databaseService.findMany('productionTask');
    let factoryTasks = tasks.filter((t: any) => t.factoryId === factoryId);
    
    if (status) {
      factoryTasks = factoryTasks.filter((t: any) => t.status === status);
    }
    
    // 按创建时间倒序排序
    factoryTasks.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // 模拟关联数据
    return Promise.all(factoryTasks.map(async (task: any) => {
      const order = await databaseService.findUnique('order', { id: task.orderId });
      return {
        ...task,
        order: order ? { id: order.id, orderNumber: order.orderNumber, title: order.title } : null
      };
    }));
  }

  async getActiveProductionTasks(): Promise<any[]> {
    const tasks = await databaseService.findMany('productionTask');
    const activeTasks = tasks.filter((t: any) => 
      ['SCHEDULED', 'IN_PRODUCTION', 'QUALITY_CHECK'].includes(t.status)
    );
    
    // 按创建时间正序排序
    activeTasks.sort((a: any, b: any) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // 模拟关联数据
    return Promise.all(activeTasks.map(async (task: any) => {
      const order = await databaseService.findUnique('order', { id: task.orderId });
      const factory = await databaseService.findUnique('user', { id: task.factoryId });
      return {
        ...task,
        order: order ? { id: order.id, orderNumber: order.orderNumber, title: order.title } : null,
        factory: factory ? { id: factory.id, name: factory.name } : null
      };
    }));
  }

  private async generateTaskNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');

    const tasks = await databaseService.findMany('productionTask');
    const todayTasks = tasks.filter((t: any) => {
      const tDate = new Date(t.createdAt);
      return tDate.getFullYear() === now.getFullYear() &&
        tDate.getMonth() === now.getMonth() &&
        tDate.getDate() === now.getDate();
    });

    const count = todayTasks.length;
    const sequence = (count + 1).toString().padStart(4, '0');
    return `PT${dateStr}${sequence}`;
  }
}

export const productionService = new ProductionService();
export default ProductionService;
