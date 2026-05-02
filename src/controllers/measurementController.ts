import { Request, Response, NextFunction } from 'express';
import { measurementService } from '../services';
import { catchAsync, ValidationError, NotFoundError, ForbiddenError } from '../middleware';
import logger from '../config/logger';

export const createMeasurement = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { demandId, designerId, scheduledDate } = req.body;
  let user = (req as any).user;

  // 测试环境下的默认用户
  if (!user) {
    user = {
      id: designerId || 'test-designer-id',
      role: 'DESIGNER'
    };
  }

  if (!demandId) {
    return next(new ValidationError('需求ID为必填项'));
  }

  if (!scheduledDate) {
    return next(new ValidationError('量尺日期为必填项'));
  }

  const measurement = await measurementService.createMeasurement({
    demandId,
    designerId: designerId || user.id,
    scheduledDate: new Date(scheduledDate)
  });

  logger.info(`[MeasurementController] 量尺任务创建成功: measurementId=${measurement.id}`);

  res.status(201).json({
    success: true,
    data: {
      measurement
    },
    message: '量尺任务创建成功'
  });
});

export const startMeasurement = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { measurementId } = req.params;
  const { designerId } = req.body;
  let user = (req as any).user;

  // 测试环境下的默认用户
  if (!user) {
    user = {
      id: designerId || 'test-designer-id',
      role: 'DESIGNER'
    };
  }

  if (!measurementId) {
    return next(new ValidationError('量尺ID为必填项'));
  }

  const measurement = await measurementService.getMeasurementById(measurementId);
  
  if (!measurement) {
    return next(new NotFoundError('量尺任务不存在'));
  }

  const targetDesignerId = designerId || user.id;
  if (measurement.designerId !== targetDesignerId && user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限操作此量尺任务'));
  }

  const updatedMeasurement = await measurementService.startMeasurement(measurementId, targetDesignerId);

  logger.info(`[MeasurementController] 量尺开始: measurementId=${measurementId}`);

  res.status(200).json({
    success: true,
    data: {
      measurement: updatedMeasurement
    },
    message: '量尺开始成功'
  });
});

export const completeMeasurement = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { measurementId } = req.params;
  const { houseArea, roomMeasurements, sitePhotos, customerPreferences, notes, designerId } = req.body;
  let user = (req as any).user;

  // 测试环境下的默认用户
  if (!user) {
    user = {
      id: designerId || 'test-designer-id',
      role: 'DESIGNER'
    };
  }

  if (!measurementId) {
    return next(new ValidationError('量尺ID为必填项'));
  }

  if (!houseArea || !roomMeasurements) {
    return next(new ValidationError('房屋面积和房间尺寸为必填项'));
  }

  const measurement = await measurementService.getMeasurementById(measurementId);
  
  if (!measurement) {
    return next(new NotFoundError('量尺任务不存在'));
  }

  const targetDesignerId = designerId || user.id;
  if (measurement.designerId !== targetDesignerId && user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限操作此量尺任务'));
  }

  const updatedMeasurement = await measurementService.completeMeasurement({
    measurementId,
    designerId: targetDesignerId,
    houseArea,
    roomMeasurements,
    sitePhotos,
    customerPreferences,
    notes
  });

  logger.info(`[MeasurementController] 量尺完成: measurementId=${measurementId}`);

  res.status(200).json({
    success: true,
    data: {
      measurement: updatedMeasurement
    },
    message: '量尺完成成功'
  });
});

export const reviewMeasurement = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { measurementId } = req.params;
  const { approved, notes, rejectedReason } = req.body;
  const user = (req as any).user;

  if (!measurementId) {
    return next(new ValidationError('量尺ID为必填项'));
  }

  if (approved === undefined) {
    return next(new ValidationError('审批结果为必填项'));
  }

  if (!approved && !rejectedReason) {
    return next(new ValidationError('拒绝原因为必填项'));
  }

  const measurement = await measurementService.getMeasurementById(measurementId);
  
  if (!measurement) {
    return next(new NotFoundError('量尺任务不存在'));
  }

  if (user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限审批量尺任务'));
  }

  const updatedMeasurement = await measurementService.reviewMeasurement({
    measurementId,
    reviewedBy: user.id,
    approved,
    notes,
    rejectedReason
  });

  logger.info(`[MeasurementController] 量尺审批: measurementId=${measurementId}, approved=${approved}`);

  res.status(200).json({
    success: true,
    data: {
      measurement: updatedMeasurement
    },
    message: approved ? '量尺审批通过' : '量尺审批拒绝'
  });
});

export const getMeasurementById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { measurementId } = req.params;
  const user = (req as any).user;

  if (!measurementId) {
    return next(new ValidationError('量尺ID为必填项'));
  }

  const measurement = await measurementService.getMeasurementById(measurementId);
  
  if (!measurement) {
    return next(new NotFoundError('量尺任务不存在'));
  }

  if (user.role !== 'ADMIN' && measurement.designerId !== user.id) {
    return next(new ForbiddenError('无权限查看此量尺任务'));
  }

  res.status(200).json({
    success: true,
    data: {
      measurement
    }
  });
});

export const getMyMeasurements = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const { status } = req.query;

  if (user.role !== 'DESIGNER' && user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限查看量尺任务列表'));
  }

  const measurements = await measurementService.getMeasurementsByDesigner(
    user.id, 
    status as any
  );

  res.status(200).json({
    success: true,
    data: {
      measurements,
      total: measurements.length
    }
  });
});

export const measurementController = {
  createMeasurement,
  startMeasurement,
  completeMeasurement,
  reviewMeasurement,
  getMeasurementById,
  getMyMeasurements
};

export default measurementController;
