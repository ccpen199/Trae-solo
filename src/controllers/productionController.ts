import { Request, Response, NextFunction } from 'express';
import { productionService } from '../services';
import { catchAsync, ValidationError, NotFoundError, ForbiddenError } from '../middleware';
import logger from '../config/logger';

export const createProductionTask = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { orderId, factoryId, title, description, scheduledStartAt, scheduledEndAt } = req.body;
  const user = (req as any).user;

  if (!orderId) {
    return next(new ValidationError('订单ID为必填项'));
  }

  if (!factoryId) {
    return next(new ValidationError('工厂ID为必填项'));
  }

  if (!title) {
    return next(new ValidationError('任务标题为必填项'));
  }

  const task = await productionService.createProductionTask({
    orderId,
    factoryId,
    title,
    description,
    scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt) : undefined,
    scheduledEndAt: scheduledEndAt ? new Date(scheduledEndAt) : undefined,
    createdBy: user.id
  });

  logger.info(`[ProductionController] 生产任务创建成功: taskId=${task.id}`);

  res.status(201).json({
    success: true,
    data: {
      task
    },
    message: '生产任务创建成功'
  });
});

export const startProductionTask = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { taskId } = req.params;
  const user = (req as any).user;

  if (!taskId) {
    return next(new ValidationError('任务ID为必填项'));
  }

  const task = await productionService.getProductionTaskById(taskId);
  
  if (!task) {
    return next(new NotFoundError('生产任务不存在'));
  }

  if (task.factoryId !== user.id && user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限操作此生产任务'));
  }

  const updatedTask = await productionService.startProductionTask(taskId, user.id);

  logger.info(`[ProductionController] 生产任务开始: taskId=${taskId}`);

  res.status(200).json({
    success: true,
    data: {
      task: updatedTask
    },
    message: '生产任务开始成功'
  });
});

export const updateProductionProgress = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { taskId } = req.params;
  const { progress, status, notes } = req.body;
  const user = (req as any).user;

  if (!taskId) {
    return next(new ValidationError('任务ID为必填项'));
  }

  if (progress === undefined) {
    return next(new ValidationError('进度为必填项'));
  }

  if (progress < 0 || progress > 100) {
    return next(new ValidationError('进度必须在0-100之间'));
  }

  const task = await productionService.getProductionTaskById(taskId);
  
  if (!task) {
    return next(new NotFoundError('生产任务不存在'));
  }

  if (task.factoryId !== user.id && user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限操作此生产任务'));
  }

  const updatedTask = await productionService.updateProductionProgress({
    taskId,
    factoryId: user.id,
    progress,
    status,
    notes
  });

  logger.info(`[ProductionController] 生产进度更新: taskId=${taskId}, progress=${progress}%`);

  res.status(200).json({
    success: true,
    data: {
      task: updatedTask
    },
    message: '生产进度更新成功'
  });
});

export const completeProductionTask = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { taskId } = req.params;
  const { qualityCheckNotes } = req.body;
  const user = (req as any).user;

  if (!taskId) {
    return next(new ValidationError('任务ID为必填项'));
  }

  const task = await productionService.getProductionTaskById(taskId);
  
  if (!task) {
    return next(new NotFoundError('生产任务不存在'));
  }

  if (task.factoryId !== user.id && user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限操作此生产任务'));
  }

  const completedTask = await productionService.completeProductionTask({
    taskId,
    factoryId: user.id,
    qualityCheckNotes
  });

  logger.info(`[ProductionController] 生产任务完成: taskId=${taskId}`);

  res.status(200).json({
    success: true,
    data: {
      task: completedTask
    },
    message: '生产任务完成成功'
  });
});

export const getProductionTaskById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { taskId } = req.params;
  const user = (req as any).user;

  if (!taskId) {
    return next(new ValidationError('任务ID为必填项'));
  }

  const task = await productionService.getProductionTaskById(taskId);
  
  if (!task) {
    return next(new NotFoundError('生产任务不存在'));
  }

  if (user.role !== 'ADMIN' && task.factoryId !== user.id) {
    return next(new ForbiddenError('无权限查看此生产任务'));
  }

  res.status(200).json({
    success: true,
    data: {
      task
    }
  });
});

export const getMyProductionTasks = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const { status } = req.query;

  if (user.role !== 'FACTORY' && user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限查看生产任务列表'));
  }

  const tasks = await productionService.getProductionTasksByFactory(
    user.id, 
    status as any
  );

  res.status(200).json({
    success: true,
    data: {
      tasks,
      total: tasks.length
    }
  });
});

export const getProductionTasksByOrder = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { orderId } = req.params;
  const user = (req as any).user;

  if (!orderId) {
    return next(new ValidationError('订单ID为必填项'));
  }

  const tasks = await productionService.getProductionTasksByOrder(orderId);

  res.status(200).json({
    success: true,
    data: {
      tasks,
      total: tasks.length
    }
  });
});

export const productionController = {
  createProductionTask,
  startProductionTask,
  updateProductionProgress,
  completeProductionTask,
  getProductionTaskById,
  getMyProductionTasks,
  getProductionTasksByOrder
};

export default productionController;
