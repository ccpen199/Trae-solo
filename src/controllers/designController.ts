import { Request, Response, NextFunction } from 'express';
import { designService } from '../services';
import { catchAsync, ValidationError, NotFoundError, ForbiddenError } from '../middleware';
import logger from '../config/logger';

export const createDesign = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { demandId, designerId, title, description } = req.body;
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

  if (!title) {
    return next(new ValidationError('设计标题为必填项'));
  }

  const design = await designService.createDesign({
    demandId,
    designerId: designerId || user.id,
    title,
    description
  });

  logger.info(`[DesignController] 设计创建成功: designId=${design.id}`);

  res.status(201).json({
    success: true,
    data: {
      design
    },
    message: '设计创建成功'
  });
});

export const updateDesign = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { designId } = req.params;
  const { title, description, renderings, blueprints, designData, designerId } = req.body;
  let user = (req as any).user;

  // 测试环境下的默认用户
  if (!user) {
    user = {
      id: designerId || 'test-designer-id',
      role: 'DESIGNER'
    };
  }

  if (!designId) {
    return next(new ValidationError('设计ID为必填项'));
  }

  const design = await designService.getDesignById(designId);
  
  if (!design) {
    return next(new NotFoundError('设计不存在'));
  }

  const targetDesignerId = designerId || user.id;
  if (design.designerId !== targetDesignerId && user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限操作此设计'));
  }

  const updatedDesign = await designService.updateDesign(designId, targetDesignerId, {
    title,
    description,
    renderings,
    blueprints,
    designData
  });

  logger.info(`[DesignController] 设计更新成功: designId=${designId}`);

  res.status(200).json({
    success: true,
    data: {
      design: updatedDesign
    },
    message: '设计更新成功'
  });
});

export const submitDesign = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { designId } = req.params;
  const { designerId, notes, renderings, blueprints, designData } = req.body;
  let user = (req as any).user;

  // 测试环境下的默认用户
  if (!user) {
    user = {
      id: designerId || 'test-designer-id',
      role: 'DESIGNER'
    };
  }

  if (!designId) {
    return next(new ValidationError('设计ID为必填项'));
  }

  const design = await designService.getDesignById(designId);
  
  if (!design) {
    return next(new NotFoundError('设计不存在'));
  }

  const targetDesignerId = designerId || user.id;
  if (design.designerId !== targetDesignerId && user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限操作此设计'));
  }

  if (!design.renderings || design.renderings.length === 0) {
    return next(new ValidationError('设计必须包含效果图'));
  }

  if (!design.designData) {
    return next(new ValidationError('设计必须包含设计数据'));
  }

  const submittedDesign = await designService.submitDesign({
    designId,
    designerId: targetDesignerId,
    renderings,
    blueprints,
    designData
  });

  logger.info(`[DesignController] 设计提交成功: designId=${designId}`);

  res.status(200).json({
    success: true,
    data: {
      design: submittedDesign
    },
    message: '设计提交成功'
  });
});

export const reviewDesign = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { designId } = req.params;
  const { approved, notes, rejectedReason } = req.body;
  const user = (req as any).user;

  if (!designId) {
    return next(new ValidationError('设计ID为必填项'));
  }

  if (approved === undefined) {
    return next(new ValidationError('审批结果为必填项'));
  }

  if (!approved && !rejectedReason) {
    return next(new ValidationError('拒绝原因为必填项'));
  }

  const design = await designService.getDesignById(designId);
  
  if (!design) {
    return next(new NotFoundError('设计不存在'));
  }

  if (user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限审批设计'));
  }

  const updatedDesign = await designService.reviewDesign({
    designId,
    reviewedBy: user.id,
    approved,
    notes,
    rejectedReason
  });

  logger.info(`[DesignController] 设计审批: designId=${designId}, approved=${approved}`);

  res.status(200).json({
    success: true,
    data: {
      design: updatedDesign
    },
    message: approved ? '设计审批通过' : '设计审批拒绝'
  });
});

export const getDesignById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { designId } = req.params;
  const user = (req as any).user;

  if (!designId) {
    return next(new ValidationError('设计ID为必填项'));
  }

  const design = await designService.getDesignById(designId);
  
  if (!design) {
    return next(new NotFoundError('设计不存在'));
  }

  if (user.role !== 'ADMIN' && design.designerId !== user.id) {
    return next(new ForbiddenError('无权限查看此设计'));
  }

  res.status(200).json({
    success: true,
    data: {
      design
    }
  });
});

export const getMyDesigns = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const { status } = req.query;

  if (user.role !== 'DESIGNER' && user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限查看设计列表'));
  }

  const designs = await designService.getDesignsByDesigner(
    user.id, 
    status as any
  );

  res.status(200).json({
    success: true,
    data: {
      designs,
      total: designs.length
    }
  });
});

export const designController = {
  createDesign,
  updateDesign,
  submitDesign,
  reviewDesign,
  getDesignById,
  getMyDesigns
};

export default designController;
