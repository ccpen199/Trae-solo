import { Transaction, ITransaction } from '@models/Transaction';
import { Device, IDevice } from '@models/Device';
import { IoTData, IIoTData } from '@models/IoTData';
import { Project, IProject } from '@models/Project';
import { User, IUser } from '@models/User';
import { config } from '@config/index';
import { logger } from '@utils/logger';
import * as mongoose from 'mongoose';

export interface EnergyConsumptionParams {
  deviceId?: string;
  projectId?: string;
  investorId?: string;
  startDate: Date;
  endDate: Date;
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface WaterConsumptionParams {
  deviceId?: string;
  userId?: string;
  projectId?: string;
  investorId?: string;
  startDate: Date;
  endDate: Date;
  granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface RevenueAnalysisParams {
  projectId?: string;
  investorId?: string;
  startDate: Date;
  endDate: Date;
  granularity: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface EnergyDataPoint {
  timestamp: Date;
  label: string;
  powerConsumption: number;
  waterVolume: number;
  deviceCount?: number;
}

export interface WaterDataPoint {
  timestamp: Date;
  label: string;
  waterVolume: number;
  amount: number;
  transactionCount: number;
  averagePrice: number;
}

export interface RevenueDataPoint {
  timestamp: Date;
  label: string;
  totalRevenue: number;
  waterRevenue: number;
  otherRevenue: number;
  cost: number;
  profit: number;
  transactionCount: number;
}

export interface ComparisonReportParams {
  projectId?: string;
  investorId?: string;
  currentPeriod: { startDate: Date; endDate: Date };
  previousPeriod: { startDate: Date; endDate: Date };
}

export interface ComparisonResult {
  currentPeriod: {
    totalWaterConsumption: number;
    totalRevenue: number;
    totalTransactions: number;
    averageDailyWater: number;
    averageDailyRevenue: number;
  };
  previousPeriod: {
    totalWaterConsumption: number;
    totalRevenue: number;
    totalTransactions: number;
    averageDailyWater: number;
    averageDailyRevenue: number;
  };
  changes: {
    waterConsumptionChange: number;
    waterConsumptionChangePercent: number;
    revenueChange: number;
    revenueChangePercent: number;
    transactionChange: number;
    transactionChangePercent: number;
  };
}

export interface DeviceRankingParams {
  projectId?: string;
  investorId?: string;
  startDate: Date;
  endDate: Date;
  limit?: number;
  orderBy: 'waterVolume' | 'revenue' | 'usageFrequency';
}

export interface DeviceRankingItem {
  deviceId: string;
  deviceNo: string;
  deviceName: string;
  projectName: string;
  totalWaterVolume: number;
  totalRevenue: number;
  usageCount: number;
  ranking: number;
}

export interface PeakHourAnalysisParams {
  deviceId?: string;
  projectId?: string;
  investorId?: string;
  startDate: Date;
  endDate: Date;
}

export interface PeakHourData {
  hour: number;
  totalWaterVolume: number;
  totalRevenue: number;
  transactionCount: number;
  averageWaterVolume: number;
}

export class ReportService {
  private static instance: ReportService;

  private constructor() {}

  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  private formatLabel(date: Date, granularity: string): string {
    switch (granularity) {
      case 'hourly':
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
      case 'daily':
        return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
      case 'weekly':
        return `${date.getFullYear()}第${this.getWeekNumber(date)}周`;
      case 'monthly':
        return `${date.getFullYear()}/${date.getMonth() + 1}`;
      case 'yearly':
        return `${date.getFullYear()}`;
      default:
        return date.toISOString();
    }
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private getGroupIdField(granularity: string): any {
    const baseId: any = {
      year: { $year: '$createdAt' }
    };

    switch (granularity) {
      case 'hourly':
        baseId.month = { $month: '$createdAt' };
        baseId.day = { $dayOfMonth: '$createdAt' };
        baseId.hour = { $hour: '$createdAt' };
        break;
      case 'daily':
        baseId.month = { $month: '$createdAt' };
        baseId.day = { $dayOfMonth: '$createdAt' };
        break;
      case 'weekly':
        baseId.week = { $week: '$createdAt' };
        break;
      case 'monthly':
        baseId.month = { $month: '$createdAt' };
        break;
      case 'yearly':
        break;
    }

    return baseId;
  }

  private getDateFromGroupId(id: any, granularity: string): Date {
    switch (granularity) {
      case 'hourly':
        return new Date(id.year, id.month - 1, id.day, id.hour);
      case 'daily':
        return new Date(id.year, id.month - 1, id.day);
      case 'weekly':
        const weekDate = new Date(id.year, 0, 1);
        weekDate.setDate(weekDate.getDate() + (id.week - 1) * 7);
        return weekDate;
      case 'monthly':
        return new Date(id.year, id.month - 1, 1);
      case 'yearly':
        return new Date(id.year, 0, 1);
      default:
        return new Date();
    }
  }

  private async getDevicesByScope(projectId?: string, investorId?: string): Promise<IDevice[]> {
    const query: any = {};
    if (projectId) {
      query.projectId = new mongoose.Types.ObjectId(projectId);
      return Device.find(query);
    }
    if (investorId) {
      const investorObjectId = new mongoose.Types.ObjectId(investorId);
      const projects = await Project.find({ investorIds: investorObjectId });
      const projectIds = projects.map(p => p._id);
      query.projectId = { $in: projectIds };
      return Device.find(query);
    }
    return Device.find({});
  }

  public async getEnergyConsumptionCurve(params: EnergyConsumptionParams): Promise<{ data: EnergyDataPoint[]; summary: any }> {
    try {
      const { deviceId, projectId, investorId, startDate, endDate, granularity } = params;

      if (startDate >= endDate) {
        throw new Error('开始日期必须小于结束日期');
      }

      const match: any = {
        createdAt: { $gte: startDate, $lte: endDate }
      };

      if (deviceId) {
        match.deviceId = new mongoose.Types.ObjectId(deviceId);
      } else if (projectId || investorId) {
        const devices = await this.getDevicesByScope(projectId, investorId);
        match.deviceId = { $in: devices.map(d => d._id) };
      }

      const iotMatch: any = {
        timestamp: { $gte: startDate, $lte: endDate }
      };

      if (deviceId) {
        iotMatch.deviceId = deviceId;
      }

      const transactionStats = await Transaction.aggregate([
        { $match: { ...match, type: 'dispense', status: 'completed' } },
        {
          $group: {
            _id: this.getGroupIdField(granularity),
            totalWaterVolume: { $sum: '$waterVolume' },
            totalAmount: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
      ]);

      const devices = await this.getDevicesByScope(projectId || undefined, investorId || undefined);
      const deviceIds = deviceId ? [new mongoose.Types.ObjectId(deviceId)] : devices.map(d => d._id);

      const powerStats = await IoTData.aggregate([
        {
          $match: {
            ...iotMatch,
            deviceId: { $in: deviceIds }
          }
        },
        {
          $group: {
            _id: this.getGroupIdField(granularity),
            totalPower: { $sum: '$powerConsumption' },
            avgPower: { $avg: '$powerConsumption' }
          }
        }
      ]);

      const powerMap = new Map();
      powerStats.forEach((stat: any) => {
        const key = JSON.stringify(stat._id);
        powerMap.set(key, stat.totalPower || stat.avgPower || 0);
      });

      const data: EnergyDataPoint[] = transactionStats.map((stat: any) => {
        const date = this.getDateFromGroupId(stat._id, granularity);
        const key = JSON.stringify(stat._id);
        return {
          timestamp: date,
          label: this.formatLabel(date, granularity),
          powerConsumption: powerMap.get(key) || 0,
          waterVolume: stat.totalWaterVolume || 0
        };
      });

      const summary = {
        totalWaterConsumption: data.reduce((sum, d) => sum + d.waterVolume, 0),
        totalPowerConsumption: data.reduce((sum, d) => sum + d.powerConsumption, 0),
        averageWaterConsumption: data.length > 0 
          ? data.reduce((sum, d) => sum + d.waterVolume, 0) / data.length 
          : 0,
        averagePowerConsumption: data.length > 0 
          ? data.reduce((sum, d) => sum + d.powerConsumption, 0) / data.length 
          : 0,
        peakWaterConsumption: data.length > 0 
          ? Math.max(...data.map(d => d.waterVolume)) 
          : 0,
        peakPowerConsumption: data.length > 0 
          ? Math.max(...data.map(d => d.powerConsumption)) 
          : 0,
        dataPoints: data.length
      };

      logger.info(`能耗曲线查询完成: granularity=${granularity}, dataPoints=${data.length}`);
      return { data, summary };
    } catch (error) {
      logger.error('获取能耗曲线失败:', error);
      throw error;
    }
  }

  public async getWaterConsumptionStats(params: WaterConsumptionParams): Promise<{ data: WaterDataPoint[]; summary: any }> {
    try {
      const { deviceId, userId, projectId, investorId, startDate, endDate, granularity } = params;

      if (startDate >= endDate) {
        throw new Error('开始日期必须小于结束日期');
      }

      const match: any = {
        type: 'dispense',
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      };

      if (deviceId) match.deviceId = new mongoose.Types.ObjectId(deviceId);
      if (userId) match.userId = new mongoose.Types.ObjectId(userId);
      if (projectId || investorId) {
        const devices = await this.getDevicesByScope(projectId, investorId);
        match.deviceId = { $in: devices.map(d => d._id) };
      }

      const stats = await Transaction.aggregate([
        { $match: match },
        {
          $group: {
            _id: this.getGroupIdField(granularity),
            totalWaterVolume: { $sum: '$waterVolume' },
            totalAmount: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
      ]);

      const data: WaterDataPoint[] = stats.map((stat: any) => {
        const date = this.getDateFromGroupId(stat._id, granularity);
        return {
          timestamp: date,
          label: this.formatLabel(date, granularity),
          waterVolume: stat.totalWaterVolume || 0,
          amount: stat.totalAmount || 0,
          transactionCount: stat.transactionCount || 0,
          averagePrice: stat.totalWaterVolume > 0 
            ? stat.totalAmount / stat.totalWaterVolume 
            : 0
        };
      });

      const totalWater = data.reduce((sum, d) => sum + d.waterVolume, 0);
      const totalAmount = data.reduce((sum, d) => sum + d.amount, 0);
      const totalTransactions = data.reduce((sum, d) => sum + d.transactionCount, 0);

      const summary = {
        totalWaterConsumption: totalWater,
        totalAmount,
        totalTransactions,
        averageDailyWater: data.length > 0 ? totalWater / data.length : 0,
        averageTransactionAmount: totalTransactions > 0 ? totalAmount / totalTransactions : 0,
        averageWaterPrice: totalWater > 0 ? totalAmount / totalWater : 0,
        peakWaterConsumption: data.length > 0 ? Math.max(...data.map(d => d.waterVolume)) : 0,
        peakTransactionCount: data.length > 0 ? Math.max(...data.map(d => d.transactionCount)) : 0
      };

      logger.info(`用水统计查询完成: granularity=${granularity}, totalWater=${totalWater.toFixed(2)}L`);
      return { data, summary };
    } catch (error) {
      logger.error('获取用水统计失败:', error);
      throw error;
    }
  }

  public async getRevenueAnalysis(params: RevenueAnalysisParams): Promise<{ data: RevenueDataPoint[]; summary: any }> {
    try {
      const { projectId, investorId, startDate, endDate, granularity } = params;

      if (startDate >= endDate) {
        throw new Error('开始日期必须小于结束日期');
      }

      const match: any = {
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      };

      if (projectId || investorId) {
        const devices = await this.getDevicesByScope(projectId, investorId);
        match.deviceId = { $in: devices.map(d => d._id) };
      }

      const deductMatch = { ...match, type: 'dispense' };
      const refundMatch = { ...match, type: 'refund' };

      const [deductStats, refundStats] = await Promise.all([
        Transaction.aggregate([
          { $match: deductMatch },
          {
            $group: {
              _id: this.getGroupIdField(granularity),
              totalAmount: { $sum: '$amount' },
              waterVolume: { $sum: '$waterVolume' },
              transactionCount: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]),
        Transaction.aggregate([
          { $match: refundMatch },
          {
            $group: {
              _id: this.getGroupIdField(granularity),
              totalAmount: { $sum: '$amount' },
              transactionCount: { $sum: 1 }
            }
          }
        ])
      ]);

      const refundMap = new Map();
      refundStats.forEach((stat: any) => {
        const key = JSON.stringify(stat._id);
        refundMap.set(key, stat.totalAmount || 0);
      });

      const maintenanceCostPerDevice = config.maintenance?.maintenanceCostPerDevicePerMonth || 50;
      const devices = await this.getDevicesByScope(projectId, investorId);
      const deviceCount = devices.length;
      const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const dailyMaintenanceCost = deviceCount > 0 ? (deviceCount * maintenanceCostPerDevice) / 30 : 0;

      const data: RevenueDataPoint[] = deductStats.map((stat: any) => {
        const date = this.getDateFromGroupId(stat._id, granularity);
        const key = JSON.stringify(stat._id);
        const waterRevenue = stat.totalAmount || 0;
        const refundAmount = refundMap.get(key) || 0;
        const totalRevenue = waterRevenue - refundAmount;
        
        let cost = 0;
        if (granularity === 'daily') {
          cost = dailyMaintenanceCost;
        } else if (granularity === 'weekly') {
          cost = dailyMaintenanceCost * 7;
        } else if (granularity === 'monthly') {
          cost = dailyMaintenanceCost * 30;
        } else if (granularity === 'yearly') {
          cost = dailyMaintenanceCost * 365;
        }

        return {
          timestamp: date,
          label: this.formatLabel(date, granularity),
          totalRevenue,
          waterRevenue,
          otherRevenue: 0,
          cost,
          profit: totalRevenue - cost,
          transactionCount: stat.transactionCount || 0
        };
      });

      const totalRevenue = data.reduce((sum, d) => sum + d.totalRevenue, 0);
      const totalCost = data.reduce((sum, d) => sum + d.cost, 0);
      const totalProfit = data.reduce((sum, d) => sum + d.profit, 0);

      const summary = {
        totalRevenue,
        totalWaterRevenue: data.reduce((sum, d) => sum + d.waterRevenue, 0),
        totalCost,
        totalProfit,
        totalTransactions: data.reduce((sum, d) => sum + d.transactionCount, 0),
        averageDailyRevenue: periodDays > 0 ? totalRevenue / periodDays : 0,
        averageDailyProfit: periodDays > 0 ? totalProfit / periodDays : 0,
        profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
        peakRevenue: data.length > 0 ? Math.max(...data.map(d => d.totalRevenue)) : 0,
        peakProfit: data.length > 0 ? Math.max(...data.map(d => d.profit)) : 0
      };

      logger.info(`收益分析查询完成: totalRevenue=${totalRevenue.toFixed(2)}, totalProfit=${totalProfit.toFixed(2)}`);
      return { data, summary };
    } catch (error) {
      logger.error('获取收益分析失败:', error);
      throw error;
    }
  }

  public async getComparisonReport(params: ComparisonReportParams): Promise<ComparisonResult> {
    try {
      const { projectId, investorId, currentPeriod, previousPeriod } = params;

      const devices = await this.getDevicesByScope(projectId, investorId);
      const deviceIds = devices.map(d => d._id);

      const getPeriodStats = async (startDate: Date, endDate: Date) => {
        const transactions = await Transaction.find({
          deviceId: { $in: deviceIds },
          type: 'dispense',
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        });

        const totalWaterConsumption = transactions.reduce((sum, t) => sum + (t.waterVolume || 0), 0);
        const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
        const totalTransactions = transactions.length;
        const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          totalWaterConsumption,
          totalRevenue,
          totalTransactions,
          averageDailyWater: periodDays > 0 ? totalWaterConsumption / periodDays : 0,
          averageDailyRevenue: periodDays > 0 ? totalRevenue / periodDays : 0
        };
      };

      const current = await getPeriodStats(currentPeriod.startDate, currentPeriod.endDate);
      const previous = await getPeriodStats(previousPeriod.startDate, previousPeriod.endDate);

      const calculateChange = (currentVal: number, previousVal: number) => {
        const change = currentVal - previousVal;
        const changePercent = previousVal > 0 ? (change / previousVal) * 100 : 100;
        return { change, changePercent };
      };

      const waterChange = calculateChange(current.totalWaterConsumption, previous.totalWaterConsumption);
      const revenueChange = calculateChange(current.totalRevenue, previous.totalRevenue);
      const transactionChange = calculateChange(current.totalTransactions, previous.totalTransactions);

      const result: ComparisonResult = {
        currentPeriod: current,
        previousPeriod: previous,
        changes: {
          waterConsumptionChange: waterChange.change,
          waterConsumptionChangePercent: waterChange.changePercent,
          revenueChange: revenueChange.change,
          revenueChangePercent: revenueChange.changePercent,
          transactionChange: transactionChange.change,
          transactionChangePercent: transactionChange.changePercent
        }
      };

      logger.info(`同比报告生成完成: revenueChange=${revenueChange.changePercent.toFixed(2)}%`);
      return result;
    } catch (error) {
      logger.error('生成同比报告失败:', error);
      throw error;
    }
  }

  public async getDeviceRanking(params: DeviceRankingParams): Promise<DeviceRankingItem[]> {
    try {
      const { projectId, investorId, startDate, endDate, limit = 10, orderBy } = params;

      if (!['waterVolume', 'revenue', 'usageFrequency'].includes(orderBy)) {
        throw new Error('无效的排序字段');
      }

      const devices = await this.getDevicesByScope(projectId, investorId);
      const deviceIds = devices.map(d => d._id);

      const stats = await Transaction.aggregate([
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
            _id: '$deviceId',
            totalWaterVolume: { $sum: '$waterVolume' },
            totalRevenue: { $sum: '$amount' },
            usageCount: { $sum: 1 }
          }
        }
      ]);

      const deviceMap = new Map();
      devices.forEach(d => deviceMap.set(d._id.toString(), d));

      const projectIds = [...new Set(devices.map(d => d.projectId?.toString()).filter(Boolean))];
      const projects = await Project.find({ _id: { $in: projectIds } });
      const projectMap = new Map();
      projects.forEach(p => projectMap.set(p._id.toString(), p.projectName));

      const rankingItems: DeviceRankingItem[] = stats
        .map((stat: any) => {
          const device = deviceMap.get(stat._id.toString());
          if (!device) return null;

          return {
            deviceId: stat._id,
            deviceNo: device.deviceId,
            deviceName: device.deviceName,
            projectName: projectMap.get(device.projectId?.toString()) || '',
            totalWaterVolume: stat.totalWaterVolume || 0,
            totalRevenue: stat.totalRevenue || 0,
            usageCount: stat.usageCount || 0,
            ranking: 0
          };
        })
        .filter(Boolean) as DeviceRankingItem[];

      if (orderBy === 'waterVolume') {
        rankingItems.sort((a, b) => b.totalWaterVolume - a.totalWaterVolume);
      } else if (orderBy === 'revenue') {
        rankingItems.sort((a, b) => b.totalRevenue - a.totalRevenue);
      } else {
        rankingItems.sort((a, b) => b.usageCount - a.usageCount);
      }

      rankingItems.forEach((item, index) => {
        item.ranking = index + 1;
      });

      return rankingItems.slice(0, limit);
    } catch (error) {
      logger.error('获取设备排行失败:', error);
      throw error;
    }
  }

  public async getPeakHourAnalysis(params: PeakHourAnalysisParams): Promise<PeakHourData[]> {
    try {
      const { deviceId, projectId, investorId, startDate, endDate } = params;

      const devices = await this.getDevicesByScope(deviceId ? undefined : projectId, deviceId ? undefined : investorId);
      let deviceIds = devices.map(d => d._id);
      if (deviceId) {
        deviceIds = [new mongoose.Types.ObjectId(deviceId)];
      }

      const stats = await Transaction.aggregate([
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
            _id: { $hour: '$createdAt' },
            totalWaterVolume: { $sum: '$waterVolume' },
            totalRevenue: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      const result: PeakHourData[] = stats.map((stat: any) => ({
        hour: stat._id,
        totalWaterVolume: stat.totalWaterVolume || 0,
        totalRevenue: stat.totalRevenue || 0,
        transactionCount: stat.transactionCount || 0,
        averageWaterVolume: stat.transactionCount > 0 
          ? stat.totalWaterVolume / stat.transactionCount 
          : 0
      }));

      for (let i = 0; i < 24; i++) {
        if (!result.find(r => r.hour === i)) {
          result.push({
            hour: i,
            totalWaterVolume: 0,
            totalRevenue: 0,
            transactionCount: 0,
            averageWaterVolume: 0
          });
        }
      }

      result.sort((a, b) => a.hour - b.hour);
      return result;
    } catch (error) {
      logger.error('获取高峰时段分析失败:', error);
      throw error;
    }
  }

  public async getComprehensiveReport(params: {
    projectId?: string;
    investorId?: string;
    startDate: Date;
    endDate: Date;
  }): Promise<any> {
    try {
      const { projectId, investorId, startDate, endDate } = params;

      const [waterStats, revenueAnalysis, deviceRanking, peakHour] = await Promise.all([
        this.getWaterConsumptionStats({
          projectId,
          investorId,
          startDate,
          endDate,
          granularity: 'daily'
        }),
        this.getRevenueAnalysis({
          projectId,
          investorId,
          startDate,
          endDate,
          granularity: 'daily'
        }),
        this.getDeviceRanking({
          projectId,
          investorId,
          startDate,
          endDate,
          limit: 5,
          orderBy: 'revenue'
        }),
        this.getPeakHourAnalysis({
          projectId,
          investorId,
          startDate,
          endDate
        })
      ]);

      const peakHourData = peakHour.reduce((max, h) => 
        h.totalWaterVolume > max.totalWaterVolume ? h : max
      , peakHour[0] || { hour: 0, totalWaterVolume: 0 });

      const report = {
        reportNo: `RPT${Date.now()}`,
        reportType: 'comprehensive',
        period: { startDate, endDate },
        overview: {
          totalWaterConsumption: waterStats.summary.totalWaterConsumption,
          totalRevenue: revenueAnalysis.summary.totalRevenue,
          totalProfit: revenueAnalysis.summary.totalProfit,
          totalTransactions: waterStats.summary.totalTransactions,
          profitMargin: revenueAnalysis.summary.profitMargin
        },
        waterConsumption: waterStats.summary,
        revenueAnalysis: revenueAnalysis.summary,
        topDevices: deviceRanking,
        peakHour: {
          hour: (peakHourData as any).hour,
          totalWaterVolume: (peakHourData as any).totalWaterVolume,
          totalRevenue: (peakHourData as any).totalRevenue
        },
        dailyWaterTrend: waterStats.data.map(d => ({ label: d.label, value: d.waterVolume })),
        dailyRevenueTrend: revenueAnalysis.data.map(d => ({ label: d.label, value: d.totalRevenue })),
        generatedAt: new Date()
      };

      logger.info('综合报表生成完成');
      return report;
    } catch (error) {
      logger.error('生成综合报表失败:', error);
      throw error;
    }
  }
}

export const reportService = ReportService.getInstance();
