import { Router, Response } from 'express';
import { asyncHandler, BadRequestError, NotFoundError } from '@middleware/errorHandler';
import { AuthRequest, authMiddleware, investorOnly } from '@middleware/auth';
import { investorService } from '@services/investorService';
import { deviceService } from '@services/deviceService';
import { logger } from '@utils/logger';

const router = Router();

router.use(authMiddleware, investorOnly);

router.get('/projects', asyncHandler(async (req: AuthRequest, res: Response) => {
  const projects = await investorService.getInvestorProjects(req.userId!);

  res.json({
    success: true,
    data: {
      projects,
      total: projects.length,
    },
  });
}));

router.get('/dashboard', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  const stats = await investorService.getInvestorStatistics({
    investorId: req.userId!,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  });

  res.json({
    success: true,
    data: stats,
  });
}));

router.get('/devices-map', asyncHandler(async (req: AuthRequest, res: Response) => {
  const clusterData = await investorService.getDeviceClusterData(req.userId!);

  res.json({
    success: true,
    data: {
      clusters: clusterData,
    },
  });
}));

router.get('/device/:id/details', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw BadRequestError('设备ID不能为空');
  }

  try {
    const device = await deviceService.getDeviceById(id);

    if (req.userRole !== 'admin') {
      logger.warn(`投资商访问设备详情: userId=${req.userId}, deviceId=${id}`);
    }

    res.json({
      success: true,
      data: device,
    });
  } catch (error) {
    if ((error as any).message === '无权访问该设备') {
      throw error;
    }
    throw NotFoundError('设备不存在');
  }
}));

router.get('/energy-curve', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate, projectId } = req.query;

  if (!startDate || !endDate) {
    throw BadRequestError('请提供开始日期和结束日期');
  }

  logger.info(`获取能耗曲线: investorId=${req.userId}, startDate=${startDate}, endDate=${endDate}`);

  const roiResult = await investorService.calculateROI({
    investorId: req.userId!,
    projectId: projectId as string,
    startDate: new Date(startDate as string),
    endDate: new Date(endDate as string),
  });

  res.json({
    success: true,
    data: {
      totalWaterConsumption: roiResult.totalWaterConsumption,
      averageDailyWaterConsumption: roiResult.averageDailyWaterConsumption,
      periodDays: roiResult.periodDays,
    },
  });
}));

router.get('/roi', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate, projectId } = req.query;

  if (!startDate || !endDate) {
    throw BadRequestError('请提供开始日期和结束日期');
  }

  const roiResult = await investorService.calculateROI({
    investorId: req.userId!,
    projectId: projectId as string,
    startDate: new Date(startDate as string),
    endDate: new Date(endDate as string),
  });

  res.json({
    success: true,
    data: roiResult,
  });
}));

router.get('/fault-statistics', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  logger.info(`获取故障统计: investorId=${req.userId}, startDate=${startDate}, endDate=${endDate}`);

  const deviceStats = await deviceService.getDeviceStatistics(req.userId);

  res.json({
    success: true,
    data: {
      totalDevices: deviceStats.total,
      onlineDevices: deviceStats.online,
      offlineDevices: deviceStats.offline,
      faultDevices: deviceStats.fault,
      maintenanceDevices: deviceStats.maintenance,
      faultRate: deviceStats.total > 0 ? (deviceStats.fault / deviceStats.total) * 100 : 0,
    },
  });
}));

export default router;
