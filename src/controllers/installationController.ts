import { Request, Response, NextFunction } from 'express';
import { installationService } from '../services';
import { databaseService } from '../services/databaseService';
import { catchAsync, ValidationError, NotFoundError, ForbiddenError } from '../middleware';
import logger from '../config/logger';

export const createInstallationTask = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { orderId, address, province, city, district, contactName, contactPhone, difficultyLevel, estimatedDuration, specialRequirements, items } = req.body;
  const user = (req as any).user;

  if (!orderId) {
    return next(new ValidationError('订单ID为必填项'));
  }

  if (!address || !contactName || !contactPhone) {
    return next(new ValidationError('地址、联系人、联系电话为必填项'));
  }

  const installation = await installationService.createInstallationTask({
    orderId,
    address,
    province,
    city,
    district,
    contactName,
    contactPhone,
    difficultyLevel,
    estimatedDuration,
    specialRequirements,
    items
  });

  logger.info(`[InstallationController] 安装任务创建成功: installationId=${installation.id}`);

  res.status(201).json({
    success: true,
    data: {
      installation
    },
    message: '安装任务创建成功'
  });
});

export const executeAutoAssignment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { installationId } = req.params;
  const { preferredDate, timeSlot } = req.body;
  const user = (req as any).user;

  if (!installationId) {
    return next(new ValidationError('安装任务ID为必填项'));
  }

  if (!preferredDate) {
    return next(new ValidationError('期望安装日期为必填项'));
  }

  if (!timeSlot) {
    return next(new ValidationError('时间段为必填项'));
  }

  const installation = await installationService.getInstallationById(installationId);
  
  if (!installation) {
    return next(new NotFoundError('安装任务不存在'));
  }

  const order = await databaseService.findUnique('order', { id: installation.orderId });
  if (!order) {
    return next(new NotFoundError('订单不存在'));
  }

  // 模拟可用安装师傅数据
  const availableInstallers = [
    {
      id: 'test-installer-id',
      name: '张师傅',
      phone: '13900139000',
      rating: 4.8,
      skills: ['全屋定制', '实木家具'],
      serviceArea: {
        provinces: [installation.province || '北京市'],
        cities: [installation.city || '北京市'],
        districts: [installation.district || '朝阳区']
      }
    }
  ];

  const result = await installationService.executeAutoAssignment({
    orderId: installation.orderId,
    installationId,
    customerAddress: {
      address: installation.address,
      province: installation.province,
      city: installation.city,
      district: installation.district
    },
    installationItems: installation.items || [],
    preferredDate: new Date(preferredDate),
    timeSlot,
    difficultyLevel: installation.difficultyLevel || 'MEDIUM',
    specialRequirements: installation.specialRequirements ? [installation.specialRequirements] : [],
    estimatedDuration: installation.estimatedDuration || 240,
    availableInstallers
  });

  logger.info(`[InstallationController] 智能派工完成: installationId=${installationId}, installerId=${result.installation.installerId}`);

  res.status(200).json({
    success: true,
    data: {
      installation: result.installation,
      assignmentDetails: result.assignmentDetails
    },
    message: '智能派工成功'
  });
});

export const assignInstaller = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { installationId } = req.params;
  const { installerId, scheduledDate, timeSlot } = req.body;
  const user = (req as any).user;

  if (!installationId) {
    return next(new ValidationError('安装任务ID为必填项'));
  }

  if (!installerId) {
    return next(new ValidationError('安装师傅ID为必填项'));
  }

  if (!scheduledDate || !timeSlot) {
    return next(new ValidationError('安装日期和时间段为必填项'));
  }

  const installation = await installationService.getInstallationById(installationId);
  
  if (!installation) {
    return next(new NotFoundError('安装任务不存在'));
  }

  const updatedInstallation = await installationService.assignInstaller({
    installationId,
    installerId,
    scheduledDate: new Date(scheduledDate),
    timeSlot,
    assignedBy: user.id,
    assignedByRole: user.role
  });

  logger.info(`[InstallationController] 安装师傅分配成功: installationId=${installationId}, installerId=${installerId}`);

  res.status(200).json({
    success: true,
    data: {
      installation: updatedInstallation
    },
    message: '安装师傅分配成功'
  });
});

export const startInstallation = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { installationId } = req.params;
  const user = (req as any).user;

  if (!installationId) {
    return next(new ValidationError('安装任务ID为必填项'));
  }

  const installation = await installationService.getInstallationById(installationId);
  
  if (!installation) {
    return next(new NotFoundError('安装任务不存在'));
  }

  if (installation.installerId !== user.id && user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限操作此安装任务'));
  }

  const updatedInstallation = await installationService.startInstallation(installationId, user.id);

  logger.info(`[InstallationController] 安装开始: installationId=${installationId}`);

  res.status(200).json({
    success: true,
    data: {
      installation: updatedInstallation
    },
    message: '安装开始成功'
  });
});

export const completeInstallation = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { installationId } = req.params;
  const { installationPhotos, notes, customerFeedback, customerRating } = req.body;
  const user = (req as any).user;

  if (!installationId) {
    return next(new ValidationError('安装任务ID为必填项'));
  }

  const installation = await installationService.getInstallationById(installationId);
  
  if (!installation) {
    return next(new NotFoundError('安装任务不存在'));
  }

  if (installation.installerId !== user.id && user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限操作此安装任务'));
  }

  const updatedInstallation = await installationService.completeInstallation(
    installationId,
    user.id,
    {
      installationPhotos,
      notes,
      customerFeedback,
      customerRating
    }
  );

  logger.info(`[InstallationController] 安装完成: installationId=${installationId}`);

  res.status(200).json({
    success: true,
    data: {
      installation: updatedInstallation
    },
    message: '安装完成成功'
  });
});

export const acceptInstallation = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { installationId } = req.params;
  const { notes, rating, feedback } = req.body;
  const user = (req as any).user;

  if (!installationId) {
    return next(new ValidationError('安装任务ID为必填项'));
  }

  const installation = await installationService.getInstallationById(installationId);
  
  if (!installation) {
    return next(new NotFoundError('安装任务不存在'));
  }

  if (user.role !== 'CUSTOMER' && user.role !== 'ADMIN') {
    return next(new ForbiddenError('无权限验收安装'));
  }

  const updatedInstallation = await installationService.acceptInstallation(
    installationId,
    user.id,
    {
      notes,
      rating,
      feedback
    }
  );

  logger.info(`[InstallationController] 安装验收: installationId=${installationId}`);

  res.status(200).json({
    success: true,
    data: {
      installation: updatedInstallation
    },
    message: '安装验收成功'
  });
});

export const getInstallationById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { installationId } = req.params;
  const user = (req as any).user;

  if (!installationId) {
    return next(new ValidationError('安装任务ID为必填项'));
  }

  const installation = await installationService.getInstallationById(installationId);
  
  if (!installation) {
    return next(new NotFoundError('安装任务不存在'));
  }

  if (user.role !== 'ADMIN' && 
      installation.installerId !== user.id && 
      installation.order?.customerId !== user.id) {
    return next(new ForbiddenError('无权限查看此安装任务'));
  }

  res.status(200).json({
    success: true,
    data: {
      installation
    }
  });
});

export const getMyInstallations = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const { status } = req.query;

  let installations;

  if (user.role === 'INSTALLER') {
    installations = await installationService.getInstallationsByInstaller(
      user.id, 
      status as any
    );
  } else if (user.role === 'CUSTOMER') {
    installations = await installationService.getInstallationsByCustomer(user.id);
  } else if (user.role === 'ADMIN') {
    installations = await installationService.getAllInstallations(status as any);
  } else {
    return next(new ForbiddenError('无权限查看安装任务列表'));
  }

  res.status(200).json({
    success: true,
    data: {
      installations,
      total: installations.length
    }
  });
});

export const getInstallationsByOrder = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { orderId } = req.params;
  const user = (req as any).user;

  if (!orderId) {
    return next(new ValidationError('订单ID为必填项'));
  }

  const installations = await installationService.getInstallationsByOrder(orderId);

  res.status(200).json({
    success: true,
    data: {
      installations,
      total: installations.length
    }
  });
});

export const installationController = {
  createInstallationTask,
  executeAutoAssignment,
  assignInstaller,
  startInstallation,
  completeInstallation,
  acceptInstallation,
  getInstallationById,
  getMyInstallations,
  getInstallationsByOrder
};

export default installationController;
