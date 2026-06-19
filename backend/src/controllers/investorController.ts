import { Response, NextFunction } from 'express';
import { AuthRequest } from '@middleware/auth';
import { asyncHandler, BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } from '@middleware/errorHandler';
import { InvestorService } from '@services/investorService';
import { DeviceService } from '@services/deviceService';
import { TransactionService } from '@services/transactionService';
import { Device, IDevice } from '@models/Device';
import { Project } from '@models/Project';
import { IoTData } from '@models/IoTData';
import { WorkOrder } from '@models/WorkOrder';
import { Transaction } from '@models/Transaction';
import { logger } from '@utils/logger';

const investorService = InvestorService.getInstance();
const deviceService = DeviceService.getInstance();
const transactionService = TransactionService.getInstance();

export const getProjectList = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { investorId } = req.query;

  let targetInvestorId = userId;

  if (investorId) {
    if (userRole === 'admin') {
      targetInvestorId = investorId as string;
    } else if (investorId !== userId) {
      throw ForbiddenError('无权访问其他投资商的项目');
    }
  }

  if (!targetInvestorId) {
    throw UnauthorizedError('未认证');
  }

  const projects = await investorService.getInvestorProjects(targetInvestorId);

  const projectsWithStats = await Promise.all(
    projects.map(async (project) => {
      const devices = await Device.find({ projectId: project._id } as any);
      const deviceIds = devices.map(d => d._id);

      const deviceStats = {
        total: devices.length,
        online: devices.filter(d => d.status === 'online').length,
        offline: devices.filter(d => d.status === 'offline').length,
        fault: devices.filter(d => d.status === 'fault').length,
        maintenance: devices.filter(d => d.status === 'maintenance').length,
      };

      const totalWaterUsage = devices.reduce((sum, d) => sum + (d.totalWaterUsage || 0), 0);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const transactions = await investorService['getDailyRevenue'] && [];

      return {
        ...project.toObject(),
        deviceStats,
        totalWaterUsage,
        totalInvestment: project.totalInvestment || devices.length * 2000,
      };
    })
  );

  res.json({
    success: true,
    data: {
      projects: projectsWithStats,
      total: projectsWithStats.length,
    },
    message: '获取项目列表成功',
  });
});

export const getProjectDetail = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { projectId } = req.params;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  if (!projectId) {
    throw BadRequestError('项目ID不能为空');
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw NotFoundError('项目不存在');
  }

  if (userRole !== 'admin' && !project.investorIds?.map(id => id.toString()).includes(userId)) {
    throw ForbiddenError('无权访问该项目');
  }

  const { devices, total } = await investorService.getProjectDevices(projectId, userId);

  const deviceStats = {
    total,
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length,
    fault: devices.filter(d => d.status === 'fault').length,
  };

  const totalWaterUsage = devices.reduce((sum, d) => sum + (d.totalWaterUsage || 0), 0);

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const monthStats = await transactionService.getTransactionStatistics({
    projectId,
    startDate: monthStart,
    endDate: today,
  } as any);

  res.json({
    success: true,
    data: {
      project,
      deviceStats,
      totalWaterUsage,
      monthRevenue: monthStats.totalAmount,
      monthTransactions: monthStats.totalTransactionCount,
    },
    message: '获取项目详情成功',
  });
});

export const getROIDashboard = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { investorId, projectId, startDate, endDate } = req.query;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  let targetInvestorId = userId;
  if (investorId && userRole === 'admin') {
    targetInvestorId = investorId as string;
  }

  let queryStart: Date;
  let queryEnd: Date;

  if (startDate && endDate) {
    queryStart = new Date(startDate as string);
    queryEnd = new Date(endDate as string);
    if (isNaN(queryStart.getTime()) || isNaN(queryEnd.getTime())) {
      throw BadRequestError('日期格式不正确');
    }
  } else {
    const now = new Date();
    queryStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    queryEnd = now;
  }

  if (queryStart >= queryEnd) {
    throw BadRequestError('开始日期必须小于结束日期');
  }

  const roiResult = await investorService.calculateROI({
    investorId: targetInvestorId,
    projectId: projectId as string,
    startDate: queryStart,
    endDate: queryEnd,
  });

  const statistics = await investorService.getInvestorStatistics({
    investorId: targetInvestorId,
    startDate: queryStart,
    endDate: queryEnd,
  });

  const realTimeROI = await investorService.getRealTimeROI(targetInvestorId);

  res.json({
    success: true,
    data: {
      dateRange: {
        startDate: queryStart,
        endDate: queryEnd,
      },
      summary: {
        totalInvestment: statistics.totalInvestment,
        totalRevenue: roiResult.totalRevenue,
        totalMaintenanceCost: roiResult.totalMaintenanceCost,
        netProfit: roiResult.netProfit,
        roi: roiResult.roi,
        roiPercentage: roiResult.roiPercentage,
      },
      realTime: realTimeROI,
      deviceOverview: {
        total: statistics.totalDevices,
        online: statistics.onlineDevices,
        offline: statistics.offlineDevices,
        fault: statistics.faultDevices,
        onlineRate: statistics.totalDevices > 0
          ? (statistics.onlineDevices / statistics.totalDevices) * 100
          : 0,
      },
      waterConsumption: {
        total: roiResult.totalWaterConsumption,
        averageDaily: roiResult.averageDailyWaterConsumption,
      },
      periodDays: roiResult.periodDays,
      averageDailyRevenue: roiResult.averageDailyRevenue,
    },
    message: '获取ROI仪表盘数据成功',
  });
});

export const getDeviceClusterMap = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { investorId } = req.query;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  let targetInvestorId = userId;
  if (investorId && userRole === 'admin') {
    targetInvestorId = investorId as string;
  }

  const clusterData = await investorService.getDeviceClusterData(targetInvestorId);

  const devices = await Device.find({} as any).where('projectId').in(
    (await Project.find({ investorIds: targetInvestorId } as any).select('_id')).map(p => p._id)
  );
  const allDevices = devices.map(device => ({
    id: device._id,
    deviceId: device.deviceId,
    deviceName: device.deviceName,
    deviceModel: device.deviceModel,
    projectId: device.projectId,
    location: device.location,
    status: device.status,
    coordinates: device.location?.coordinates,
    totalWaterUsage: device.totalWaterUsage,
    currentTemperature: device.currentTemperature,
    lastHeartbeatAt: device.lastHeartbeatAt,
  }));

  res.json({
    success: true,
    data: {
      projects: clusterData,
      devices: allDevices,
      totalDevices: allDevices.length,
      onlineCount: allDevices.filter(d => d.status === 'online').length,
      offlineCount: allDevices.filter(d => d.status === 'offline').length,
      faultCount: allDevices.filter(d => d.status === 'fault').length,
    },
    message: '获取设备集群地图数据成功',
  });
});

export const getEnergyConsumptionCurve = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { investorId, projectId, deviceId, period = '7d' } = req.query;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  let targetInvestorId = userId;
  if (investorId && userRole === 'admin') {
    targetInvestorId = investorId as string;
  }

  const now = new Date();
  let queryStart: Date;
  let interval: 'hour' | 'day';

  switch (period) {
    case '24h':
      queryStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      interval = 'hour';
      break;
    case '7d':
      queryStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      interval = 'day';
      break;
    case '30d':
      queryStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      interval = 'day';
      break;
    case '90d':
      queryStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      interval = 'day';
      break;
    default:
      queryStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      interval = 'day';
  }

  let deviceQuery: any = {};
  if (projectId) deviceQuery.projectId = projectId;
  if (deviceId) deviceQuery._id = deviceId;

  const projectIds = (await Project.find({ investorIds: targetInvestorId } as any).select('_id')).map(p => p._id);
  deviceQuery.projectId = { $in: projectIds };

  const devices = await Device.find(deviceQuery);
  const deviceIds = devices.map(d => d._id);

  const matchStage: any = {
    deviceId: { $in: deviceIds },
    type: 'dispense',
    status: 'completed',
    createdAt: { $gte: queryStart, $lte: now },
  };

  let groupStage: any;

  if (interval === 'hour') {
    groupStage = {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' },
        },
        totalWater: { $sum: '$waterVolume' },
        totalAmount: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
      },
    };
  } else {
    groupStage = {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        totalWater: { $sum: '$waterVolume' },
        totalAmount: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
      },
    };
  }

  const result = await Transaction.aggregate([
    { $match: matchStage },
    groupStage,
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
  ]);

  const curveData = result.map((item: any) => {
    let dateLabel: string;
    if (interval === 'hour') {
      dateLabel = `${item._id.month}/${item._id.day} ${String(item._id.hour).padStart(2, '0')}:00`;
    } else {
      dateLabel = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
    }
    return {
      date: dateLabel,
      waterConsumption: item.totalWater,
      revenue: item.totalAmount,
      transactionCount: item.transactionCount,
      estimatedEnergy: item.totalWater * 0.15,
    };
  });

  const totalWater = curveData.reduce((sum: number, d: any) => sum + d.waterConsumption, 0);
  const totalRevenue = curveData.reduce((sum: number, d: any) => sum + d.revenue, 0);

  res.json({
    success: true,
    data: {
      period,
      interval,
      dateRange: {
        startDate: queryStart,
        endDate: now,
      },
      curve: curveData,
      summary: {
        totalWaterConsumption: totalWater,
        totalRevenue,
        totalTransactions: curveData.reduce((sum: number, d: any) => sum + d.transactionCount, 0),
        estimatedEnergyConsumption: totalWater * 0.15,
        averageDailyWater: curveData.length > 0 ? totalWater / (period === '24h' ? 24 : curveData.length) : 0,
        averageDailyRevenue: curveData.length > 0 ? totalRevenue / (period === '24h' ? 1 : curveData.length) : 0,
      },
    },
    message: '获取能耗曲线数据成功',
  });
});

export const getFaultStatistics = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { investorId, projectId, startDate, endDate } = req.query;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  let targetInvestorId = userId;
  if (investorId && userRole === 'admin') {
    targetInvestorId = investorId as string;
  }

  let queryStart: Date;
  let queryEnd: Date;

  if (startDate && endDate) {
    queryStart = new Date(startDate as string);
    queryEnd = new Date(endDate as string);
    if (isNaN(queryStart.getTime()) || isNaN(queryEnd.getTime())) {
      throw BadRequestError('日期格式不正确');
    }
  } else {
    const now = new Date();
    queryStart = new Date(now.getFullYear(), now.getMonth(), 1);
    queryEnd = now;
  }

  if (queryStart >= queryEnd) {
    throw BadRequestError('开始日期必须小于结束日期');
  }

  const projectIds = (await Project.find({ investorIds: targetInvestorId } as any).select('_id')).map(p => p._id);
  const deviceQuery: any = { projectId: { $in: projectIds } };
  if (projectId) deviceQuery.projectId = projectId;

  const devices = await Device.find(deviceQuery);
  const deviceIds = devices.map(d => d._id.toString());

  const faultDevices = devices.filter(d => d.status === 'fault');

  const workOrderQuery: any = {
    deviceId: { $in: deviceIds },
    createdAt: { $gte: queryStart, $lte: queryEnd },
  };

  const workOrders = await WorkOrder.find(workOrderQuery);

  const faultByType: Record<string, number> = {};
  const faultByPriority: Record<string, number> = {};
  const faultByStatus: Record<string, number> = {};

  workOrders.forEach((wo: any) => {
    if (wo.type === 'repair') {
      faultByType[wo.description?.substring(0, 20) || '其他故障'] = (faultByType[wo.description?.substring(0, 20) || '其他故障'] || 0) + 1;
    }
    faultByPriority[wo.priority || 'low'] = (faultByPriority[wo.priority || 'low'] || 0) + 1;
    faultByStatus[wo.status] = (faultByStatus[wo.status] || 0) + 1;
  });

  const recentFaults = workOrders
    .filter((wo: any) => wo.type === 'repair')
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  const avgRepairTime = workOrders
    .filter((wo: any) => wo.status === 'resolved' || wo.status === 'closed')
    .map((wo: any) => {
      const resolved = wo.resolvedAt || wo.closedAt;
      if (resolved) {
        return (new Date(resolved).getTime() - new Date(wo.createdAt).getTime()) / (1000 * 60 * 60);
      }
      return 0;
    })
    .filter(t => t > 0);

  const avgRepairHours = avgRepairTime.length > 0
    ? avgRepairTime.reduce((a, b) => a + b, 0) / avgRepairTime.length
    : 0;

  res.json({
    success: true,
    data: {
      dateRange: {
        startDate: queryStart,
        endDate: queryEnd,
      },
      deviceFaults: {
        totalFaultDevices: faultDevices.length,
        totalDevices: devices.length,
        faultRate: devices.length > 0 ? (faultDevices.length / devices.length) * 100 : 0,
        faultDevices: faultDevices.map(d => ({
          id: d._id,
          deviceId: d.deviceId,
          deviceName: d.deviceName,
          location: d.location,
          faultTime: d.lastHeartbeatAt,
        })),
      },
      workOrderStats: {
        total: workOrders.length,
        faultCount: workOrders.filter((wo: any) => wo.type === 'repair').length,
        maintenanceCount: workOrders.filter((wo: any) => wo.type === 'maintenance').length,
        upgradeCount: workOrders.filter((wo: any) => wo.type === 'firmware_upgrade').length,
        avgRepairHours: avgRepairHours.toFixed(2),
      },
      faultByPriority,
      faultByStatus,
      topFaultTypes: Object.entries(faultByType)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([type, count]) => ({ type, count })),
      recentFaults,
    },
    message: '获取故障统计数据成功',
  });
});

export const getInvestorStatistics = asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const { investorId, startDate, endDate } = req.query;

  if (!userId) {
    throw UnauthorizedError('未认证');
  }

  let targetInvestorId = userId;
  if (investorId && userRole === 'admin') {
    targetInvestorId = investorId as string;
  }

  let queryStart: Date | undefined;
  let queryEnd: Date | undefined;

  if (startDate) {
    queryStart = new Date(startDate as string);
    if (isNaN(queryStart.getTime())) {
      throw BadRequestError('开始日期格式不正确');
    }
  }

  if (endDate) {
    queryEnd = new Date(endDate as string);
    if (isNaN(queryEnd.getTime())) {
      throw BadRequestError('结束日期格式不正确');
    }
  }

  const statistics = await investorService.getInvestorStatistics({
    investorId: targetInvestorId,
    startDate: queryStart,
    endDate: queryEnd,
  });

  res.json({
    success: true,
    data: statistics,
    message: '获取投资商统计成功',
  });
});
