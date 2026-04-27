import { Request, Response, NextFunction } from 'express';
import { auditService, exceptionService } from '../services';
import { catchAsync, ForbiddenError, ValidationError } from '../middleware';
import logger from '../config/logger';

export const getAuditLogsByEntity = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { entityType, entityId } = req.params;
  const user = (req as any).user;

  if (user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限查看审计日志'));
  }

  if (!entityType || !entityId) {
    return next(new ValidationError('实体类型和ID为必填项'));
  }

  const logs = await auditService.getLogsByEntity(entityType, entityId);

  res.status(200).json({
    success: true,
    data: {
      logs,
      total: logs.length
    }
  });
});

export const getOrderAuditTrail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { orderId } = req.params;
  const user = (req as any).user;

  if (!orderId) {
    return next(new ValidationError('订单ID为必填项'));
  }

  const logs = await auditService.getOrderAuditTrail(orderId);

  if (user.role !== 'ADMIN' && logs.length > 0) {
    const firstLog = logs[0];
    if (firstLog.actorId !== user.id) {
      return next(new ForbiddenError('无权限查看此订单的审计日志'));
    }
  }

  res.status(200).json({
    success: true,
    data: {
      logs,
      total: logs.length
    }
  });
});

export const getMyAuditLogs = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  const logs = await auditService.getLogsByActor(user.id);

  res.status(200).json({
    success: true,
    data: {
      logs,
      total: logs.length
    }
  });
});

export const getExceptionLogs = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const { handled } = req.query;

  if (user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限查看异常日志'));
  }

  const unhandledExceptions = await exceptionService.getUnhandledExceptions();
  const stats = await exceptionService.getExceptionStats();

  res.status(200).json({
    success: true,
    data: {
      unhandledExceptions,
      stats
    }
  });
});

export const handleException = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { exceptionId } = req.params;
  const { handlingNotes } = req.body;
  const user = (req as any).user;

  if (user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限处理异常'));
  }

  if (!exceptionId) {
    return next(new ValidationError('异常ID为必填项'));
  }

  if (!handlingNotes) {
    return next(new ValidationError('处理备注为必填项'));
  }

  const exception = await exceptionService.handleException(
    exceptionId,
    user.id,
    handlingNotes
  );

  logger.info(`[AuditController] 异常已处理: exceptionId=${exceptionId}, handledBy=${user.id}`);

  res.status(200).json({
    success: true,
    data: {
      exception
    },
    message: '异常处理成功'
  });
});

export const auditController = {
  getAuditLogsByEntity,
  getOrderAuditTrail,
  getMyAuditLogs,
  getExceptionLogs,
  handleException
};

export default auditController;
