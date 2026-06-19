import { Project, IProject } from '@models/Project';
import { Device, IDevice } from '@models/Device';
import { Transaction, ITransaction } from '@models/Transaction';
import { IoTData, IIoTData } from '@models/IoTData';
import { User, IUser } from '@models/User';
import { config } from '@config/index';
import { CryptoService } from '@security/crypto';
import { logger } from '@utils/logger';
import { generateTransactionNo } from '@utils/helpers';
import * as mongoose from 'mongoose';

export interface ROIParams {
  investorId: string;
  projectId?: string;
  startDate: Date;
  endDate: Date;
  maintenanceCostPerDevice?: number;
  waterPrice?: number;
}

export interface ROIResult {
  totalRevenue: number;
  totalMaintenanceCost: number;
  netProfit: number;
  averageDailyWaterConsumption: number;
  averageDailyRevenue: number;
  roi: number;
  roiPercentage: number;
  deviceCount: number;
  totalWaterConsumption: number;
  periodDays: number;
}

export interface InvestorStatisticsParams {
  investorId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface InvestorStatistics {
  totalInvestment: number;
  totalRevenue: number;
  totalProfit: number;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  faultDevices: number;
  totalWaterConsumption: number;
  averageDailyWaterConsumption: number;
  projectCount: number;
  deviceDistribution: Array<{ projectId: string; projectName: string; count: number }>;
  recentTransactions: ITransaction[];
}

export interface DeviceClusterData {
  projectId: string;
  projectName: string;
  deviceCount: number;
  onlineCount: number;
  offlineCount: number;
  faultCount: number;
  totalWaterConsumption: number;
  totalRevenue: number;
  averageWaterConsumption: number;
  roi: number;
}

export interface InvestorReportParams {
  investorId: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
}

export class InvestorService {
  private static instance: InvestorService;

  private constructor() {}

  public static getInstance(): InvestorService {
    if (!InvestorService.instance) {
      InvestorService.instance = new InvestorService();
    }
    return InvestorService.instance;
  }

  public async getInvestorProjects(investorId: string): Promise<IProject[]> {
    const investorObjectId = new mongoose.Types.ObjectId(investorId);
    return Project.find({ investorIds: investorObjectId });
  }

  private async getInvestorDevices(investorId: string, projectId?: string): Promise<IDevice[]> {
    const projects = await this.getInvestorProjects(investorId);
    const projectIds = projects
      .filter(p => !projectId || p._id.toString() === projectId)
      .map(p => p._id);
    return Device.find({ projectId: { $in: projectIds } });
  }

  private getMaintenanceCostPerMonth(): number {
    return config.maintenance?.maintenanceCostPerDevicePerMonth || 50;
  }

  private getWaterPrice(): number {
    return config.business?.waterPricePerLiter || 2.5;
  }

  public async calculateROI(params: ROIParams): Promise<ROIResult> {
    try {
      const { investorId, projectId, startDate, endDate } = params;
      const maintenanceCostPerDevice = params.maintenanceCostPerDevice || this.getMaintenanceCostPerMonth();
      const waterPrice = params.waterPrice || this.getWaterPrice();

      if (!investorId) {
        throw new Error('投资商ID不能为空');
      }

      if (startDate >= endDate) {
        throw new Error('开始日期必须小于结束日期');
      }

      const devices = await this.getInvestorDevices(investorId, projectId);
      const deviceCount = devices.length;

      if (deviceCount === 0) {
        throw new Error('没有找到相关设备');
      }

      const deviceIds = devices.map(d => d._id);

      const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      const transactionQuery: any = {
        deviceId: { $in: deviceIds },
        type: 'dispense',
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      };

      const transactions = await Transaction.find(transactionQuery);

      const totalWaterConsumption = transactions.reduce((sum, t) => sum + (t.waterVolume || 0), 0);
      const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

      const averageDailyWaterConsumption = periodDays > 0 ? totalWaterConsumption / periodDays : 0;
      const averageDailyRevenue = periodDays > 0 ? totalRevenue / periodDays : 0;

      const totalMaintenanceCost = deviceCount * maintenanceCostPerDevice * (periodDays / 30);

      const netProfit = totalRevenue - totalMaintenanceCost;

      const totalInvestment = deviceCount * 2000;

      const roi = totalInvestment > 0 ? netProfit / totalInvestment : 0;
      const roiPercentage = roi * 100;

      const result: ROIResult = {
        totalRevenue,
        totalMaintenanceCost,
        netProfit,
        averageDailyWaterConsumption,
        averageDailyRevenue,
        roi,
        roiPercentage,
        deviceCount,
        totalWaterConsumption,
        periodDays
      };

      logger.info(`ROI计算完成: investorId=${investorId}, roi=${roiPercentage.toFixed(2)}%, netProfit=${netProfit.toFixed(2)}`);
      return result;
    } catch (error) {
      logger.error('计算ROI失败:', error);
      throw error;
    }
  }

  public async calculateDailyROI(investorId: string, date: Date = new Date()): Promise<ROIResult> {
    try {
      const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      endDate.setMilliseconds(endDate.getMilliseconds() - 1);

      return await this.calculateROI({
        investorId,
        startDate,
        endDate
      });
    } catch (error) {
      logger.error('计算每日ROI失败:', error);
      throw error;
    }
  }

  public async getInvestorStatistics(params: InvestorStatisticsParams): Promise<InvestorStatistics> {
    try {
      const { investorId, startDate, endDate } = params;

      if (!investorId) {
        throw new Error('投资商ID不能为空');
      }

      const projects = await this.getInvestorProjects(investorId);
      const projectIds = projects.map(p => p._id);

      const devices = await Device.find({ projectId: { $in: projectIds } });
      const deviceIds = devices.map(d => d._id);

      const totalInvestment = projects.reduce((sum, p) => sum + (p.totalInvestment || 0), 0);

      const deviceStats = {
        totalDevices: devices.length,
        onlineDevices: devices.filter(d => d.status === 'online').length,
        offlineDevices: devices.filter(d => d.status === 'offline').length,
        faultDevices: devices.filter(d => d.status === 'fault').length
      };

      const totalWaterConsumption = devices.reduce((sum, d) => sum + (d.totalWaterUsage || 0), 0);

      const transactionQuery: any = {
        deviceId: { $in: deviceIds },
        type: 'dispense',
        status: 'completed'
      };

      if (startDate && endDate) {
        transactionQuery.createdAt = { $gte: startDate, $lte: endDate };
      }

      const transactions = await Transaction.find(transactionQuery)
        .sort({ createdAt: -1 })
        .limit(20);

      const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

      const maintenanceCost = this.getMaintenanceCostPerMonth();
      const periodDays = startDate && endDate 
        ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1
        : 30;
      const totalMaintenanceCost = devices.length * maintenanceCost * (periodDays / 30);
      const totalProfit = totalRevenue - totalMaintenanceCost;

      const averageDailyWaterConsumption = periodDays > 0 ? totalWaterConsumption / periodDays : 0;

      const deviceDistribution = projects.map(project => {
        const projectDevices = devices.filter(d => d.projectId?.toString() === project._id.toString());
        return {
          projectId: project._id.toString(),
          projectName: project.projectName,
          count: projectDevices.length
        };
      });

      const result: InvestorStatistics = {
        totalInvestment,
        totalRevenue,
        totalProfit,
        ...deviceStats,
        totalWaterConsumption,
        averageDailyWaterConsumption,
        projectCount: projects.length,
        deviceDistribution,
        recentTransactions: transactions
      };

      return result;
    } catch (error) {
      logger.error('获取投资商统计数据失败:', error);
      throw error;
    }
  }

  public async getDeviceClusterData(investorId: string): Promise<DeviceClusterData[]> {
    try {
      if (!investorId) {
        throw new Error('投资商ID不能为空');
      }

      const projects = await this.getInvestorProjects(investorId);
      const result: DeviceClusterData[] = [];

      const maintenanceCost = this.getMaintenanceCostPerMonth();
      const waterPrice = this.getWaterPrice();

      for (const project of projects) {
        const devices = await Device.find({ projectId: project._id });
        const deviceIds = devices.map(d => d._id);

        if (devices.length === 0) continue;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const transactions = await Transaction.find({
          deviceId: { $in: deviceIds },
          type: 'dispense',
          status: 'completed',
          createdAt: { $gte: thirtyDaysAgo }
        });

        const totalWaterConsumption = transactions.reduce((sum, t) => sum + (t.waterVolume || 0), 0);
        const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);

        const averageWaterConsumption = devices.length > 0 ? totalWaterConsumption / devices.length : 0;
        const totalMaintenanceCost = devices.length * maintenanceCost;
        const netProfit = totalRevenue - totalMaintenanceCost;
        const totalInvestment = devices.length * 2000;
        const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

        result.push({
          projectId: project._id.toString(),
          projectName: project.projectName,
          deviceCount: devices.length,
          onlineCount: devices.filter(d => d.status === 'online').length,
          offlineCount: devices.filter(d => d.status === 'offline').length,
          faultCount: devices.filter(d => d.status === 'fault').length,
          totalWaterConsumption,
          totalRevenue,
          averageWaterConsumption,
          roi
        });
      }

      return result;
    } catch (error) {
      logger.error('获取设备集群数据失败:', error);
      throw error;
    }
  }

  public async generateInvestorReport(params: InvestorReportParams): Promise<any> {
    try {
      const { investorId, reportType, startDate, endDate } = params;

      if (!investorId) {
        throw new Error('投资商ID不能为空');
      }

      if (startDate >= endDate) {
        throw new Error('开始日期必须小于结束日期');
      }

      const roiResult = await this.calculateROI({
        investorId,
        startDate,
        endDate
      });

      const statistics = await this.getInvestorStatistics({
        investorId,
        startDate,
        endDate
      });

      const clusterData = await this.getDeviceClusterData(investorId);

      const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const dailyRevenue = await this.getDailyRevenue(investorId, startDate, endDate);
      const dailyWaterConsumption = await this.getDailyWaterConsumption(investorId, startDate, endDate);

      const report = {
        reportNo: `RPT${Date.now()}`,
        reportType,
        investorId,
        period: {
          startDate,
          endDate,
          days: periodDays
        },
        summary: {
          totalRevenue: roiResult.totalRevenue,
          totalMaintenanceCost: roiResult.totalMaintenanceCost,
          netProfit: roiResult.netProfit,
          roi: roiResult.roi,
          roiPercentage: roiResult.roiPercentage
        },
        deviceOverview: {
          total: statistics.totalDevices,
          online: statistics.onlineDevices,
          offline: statistics.offlineDevices,
          fault: statistics.faultDevices,
          onlineRate: statistics.totalDevices > 0 
            ? (statistics.onlineDevices / statistics.totalDevices) * 100 
            : 0
        },
        waterConsumption: {
          total: roiResult.totalWaterConsumption,
          dailyAverage: roiResult.averageDailyWaterConsumption
        },
        projectPerformance: clusterData,
        dailyRevenue,
        dailyWaterConsumption,
        generatedAt: new Date()
      };

      logger.info(`生成投资商报表成功: investorId=${investorId}, reportType=${reportType}`);
      return report;
    } catch (error) {
      logger.error('生成投资商报表失败:', error);
      throw error;
    }
  }

  private async getDailyRevenue(investorId: string, startDate: Date, endDate: Date): Promise<Array<{ date: string; revenue: number }>> {
    try {
      const devices = await this.getInvestorDevices(investorId);
      const deviceIds = devices.map(d => d._id);

      const result = await Transaction.aggregate([
        {
          $match: {
            deviceId: { $in: deviceIds },
            type: 'dispense',
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            revenue: { $sum: '$amount' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ]);

      return result.map((item: any) => ({
        date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
        revenue: item.revenue
      }));
    } catch (error) {
      logger.error('获取每日收入数据失败:', error);
      return [];
    }
  }

  private async getDailyWaterConsumption(investorId: string, startDate: Date, endDate: Date): Promise<Array<{ date: string; consumption: number }>> {
    try {
      const devices = await this.getInvestorDevices(investorId);
      const deviceIds = devices.map(d => d._id);

      const result = await Transaction.aggregate([
        {
          $match: {
            deviceId: { $in: deviceIds },
            type: 'dispense',
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            consumption: { $sum: '$waterVolume' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
        }
      ]);

      return result.map((item: any) => ({
        date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
        consumption: item.consumption
      }));
    } catch (error) {
      logger.error('获取每日用水量数据失败:', error);
      return [];
    }
  }

  public async getInvestorProjectsList(investorId: string): Promise<IProject[]> {
    try {
      if (!investorId) {
        throw new Error('投资商ID不能为空');
      }

      const projects = await this.getInvestorProjects(investorId);
      return projects.sort((a: any, b: any) => b.createdAt - a.createdAt);
    } catch (error) {
      logger.error('获取投资商项目列表失败:', error);
      throw error;
    }
  }

  public async getProjectDevices(projectId: string, investorId: string): Promise<{ devices: IDevice[]; total: number }> {
    try {
      if (!projectId || !investorId) {
        throw new Error('参数错误');
      }

      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error('项目不存在');
      }

      const investorObjectId = new mongoose.Types.ObjectId(investorId);
      const projectInvestorIds = project.investorIds || [];
      if (!projectInvestorIds.some((id: any) => id.toString() === investorObjectId.toString())) {
        throw new Error('无权访问该项目');
      }

      const devices = await Device.find({ projectId })
        .sort({ createdAt: -1 });

      return { devices, total: devices.length };
    } catch (error) {
      logger.error('获取项目设备列表失败:', error);
      throw error;
    }
  }

  public async getRealTimeROI(investorId: string): Promise<{
    currentROI: number;
    projectedMonthlyROI: number;
    todayRevenue: number;
    monthToDateRevenue: number;
  }> {
    try {
      if (!investorId) {
        throw new Error('投资商ID不能为空');
      }

      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const todayROI = await this.calculateDailyROI(investorId, today);

      const monthToDateROI = await this.calculateROI({
        investorId,
        startDate: monthStart,
        endDate: today
      });

      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const currentDay = today.getDate();
      const projectedMonthlyROI = currentDay > 0 
        ? (monthToDateROI.roi / currentDay) * daysInMonth
        : 0;

      return {
        currentROI: todayROI.roiPercentage,
        projectedMonthlyROI: projectedMonthlyROI * 100,
        todayRevenue: todayROI.totalRevenue,
        monthToDateRevenue: monthToDateROI.totalRevenue
      };
    } catch (error) {
      logger.error('获取实时ROI失败:', error);
      throw error;
    }
  }
}

export const investorService = InvestorService.getInstance();
