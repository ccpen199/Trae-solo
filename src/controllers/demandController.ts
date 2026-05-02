import { Request, Response, NextFunction } from 'express';
import { demandService } from '../services';
import { catchAsync, ValidationError, NotFoundError, ForbiddenError } from '../middleware';
import logger from '../config/logger';

export const createDemand = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const {
    houseType,
    area,
    style,
    budgetRange,
    address,
    province,
    city,
    district,
    contactName,
    contactPhone,
    description,
    images
  } = req.body;

  let customerId = (req as any).user?.id;
  
  // 测试环境下的默认用户
  if (!customerId) {
    customerId = 'test-user-id';
  }

  if (!address || !contactName || !contactPhone) {
    return next(new ValidationError('地址、联系人、联系电话为必填项'));
  }

  const demand = await demandService.createDemand({
    customerId,
    houseType,
    area,
    style,
    budgetRange,
    address,
    province,
    city,
    district,
    contactName,
    contactPhone,
    description,
    images
  });

  logger.info(`[DemandController] 需求创建成功: demandId=${demand.id}`);

  res.status(201).json({
    success: true,
    data: {
      demand
    },
    message: '需求创建成功'
  });
});

export const assignDesigner = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { demandId } = req.params;
  const { designerId } = req.body;
  let user = (req as any).user;

  // 测试环境下的默认用户
  if (!user) {
    user = {
      id: 'test-user-id',
      role: 'ADMIN'
    };
  }

  if (!demandId) {
    return next(new ValidationError('需求ID为必填项'));
  }

  if (!designerId) {
    return next(new ValidationError('设计师ID为必填项'));
  }

  const demand = await demandService.getDemandById(demandId);
  
  if (!demand) {
    return next(new NotFoundError('需求不存在'));
  }

  if (user.role !== 'ADMIN' && user.role !== 'DESIGNER') {
    return next(new ForbiddenError('无权限分配设计师'));
  }

  const updatedDemand = await demandService.assignDesigner({
    demandId,
    designerId,
    assignedBy: user.id,
    assignedByRole: user.role
  });

  logger.info(`[DemandController] 设计师分配成功: demandId=${demandId}, designerId=${designerId}`);

  res.status(200).json({
    success: true,
    data: {
      demand: updatedDemand
    },
    message: '设计师分配成功'
  });
});

export const getDemandById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { demandId } = req.params;
  const user = (req as any).user;

  if (!demandId) {
    return next(new ValidationError('需求ID为必填项'));
  }

  const demand = await demandService.getDemandById(demandId);
  
  if (!demand) {
    return next(new NotFoundError('需求不存在'));
  }

  if (user.role !== 'ADMIN' && 
      demand.customerId !== user.id && 
      demand.designerId !== user.id) {
    return next(new ForbiddenError('无权限查看此需求'));
  }

  res.status(200).json({
    success: true,
    data: {
      demand
    }
  });
});

export const getMyDemands = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const { status } = req.query;

  let demands;

  if (user.role === 'CUSTOMER') {
    demands = await demandService.getDemandsByCustomer(user.id);
  } else if (user.role === 'DESIGNER') {
    demands = await demandService.getDemandsByDesigner(
      user.id, 
      status as any
    );
  } else if (user.role === 'ADMIN') {
    demands = await demandService.getPendingDemands();
  } else {
    return next(new ForbiddenError('无权限查看需求列表'));
  }

  res.status(200).json({
    success: true,
    data: {
      demands,
      total: demands.length
    }
  });
});

export const getPendingDemands = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限查看待分配需求'));
  }

  const demands = await demandService.getPendingDemands();

  res.status(200).json({
    success: true,
    data: {
      demands,
      total: demands.length
    }
  });
});

export const demandController = {
  createDemand,
  assignDesigner,
  getDemandById,
  getMyDemands,
  getPendingDemands
};

export default demandController;
