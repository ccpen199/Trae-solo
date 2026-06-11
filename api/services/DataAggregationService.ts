import { dataRepository } from '../repositories/DataRepository.js';
import type {
  ScenicSpotFlow,
  OTABookingData,
  IntangibleHeritage,
  CouponConsumption,
  PageResponse,
} from '../../shared/types/index.js';
import type {
  FlowQueryParams,
  OTAQueryParams,
  HeritageQueryParams,
  CouponQueryParams,
  OTAAggregationResult,
  CouponStatisticsResult,
} from '../repositories/DataRepository.js';

export interface FlowTrendData {
  date: string;
  visitorCount: number;
  saturation: number;
}

export interface RegionalFlowData {
  region: string;
  totalVisitors: number;
  avgSaturation: number;
  scenicSpotCount: number;
}

export interface PlatformBookingData {
  platform: string;
  totalBookings: number;
  totalAmount: number;
  share: number;
}

export interface HeritageLevelStats {
  level: string;
  count: number;
}

export interface HeritageCategoryStats {
  category: string;
  count: number;
}

export interface WriteOffTrendData {
  date: string;
  writeOffRate: number;
  usedAmount: number;
}

export class DataAggregationService {
  async getScenicFlows(params: FlowQueryParams): Promise<PageResponse<ScenicSpotFlow>> {
    return dataRepository.findScenicFlows(params);
  }

  async getFlowTrend(params: FlowQueryParams): Promise<FlowTrendData[]> {
    const { list } = await dataRepository.findScenicFlows({
      ...params,
      pageSize: 1000,
    });

    const dailyData = new Map<string, { visitorCount: number; saturationSum: number; count: number }>();

    for (const flow of list) {
      const date = flow.timestamp.substring(0, 10);
      if (!dailyData.has(date)) {
        dailyData.set(date, { visitorCount: 0, saturationSum: 0, count: 0 });
      }
      const data = dailyData.get(date)!;
      data.visitorCount += flow.visitorCount;
      data.saturationSum += flow.saturation;
      data.count += 1;
    }

    return Array.from(dailyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        visitorCount: data.visitorCount,
        saturation: data.count > 0 ? data.saturationSum / data.count : 0,
      }));
  }

  async getRegionalFlowStats(params: FlowQueryParams): Promise<RegionalFlowData[]> {
    const { list } = await dataRepository.findScenicFlows({
      ...params,
      pageSize: 1000,
    });

    const regionData = new Map<string, { totalVisitors: number; saturationSum: number; scenicSpots: Set<string> }>();

    for (const flow of list) {
      if (!regionData.has(flow.region)) {
        regionData.set(flow.region, { totalVisitors: 0, saturationSum: 0, scenicSpots: new Set() });
      }
      const data = regionData.get(flow.region)!;
      data.totalVisitors += flow.visitorCount;
      data.saturationSum += flow.saturation;
      data.scenicSpots.add(flow.scenicSpotId);
    }

    return Array.from(regionData.entries()).map(([region, data]) => ({
      region,
      totalVisitors: data.totalVisitors,
      avgSaturation: data.scenicSpots.size > 0 ? data.saturationSum / data.scenicSpots.size : 0,
      scenicSpotCount: data.scenicSpots.size,
    }));
  }

  async getOTABookings(params: OTAQueryParams): Promise<PageResponse<OTABookingData>> {
    return dataRepository.findOTABookings(params);
  }

  async getOTAAggregation(params: OTAQueryParams): Promise<OTAAggregationResult[]> {
    return dataRepository.aggregateOTABookings(params);
  }

  async getPlatformDistribution(params: OTAQueryParams): Promise<PlatformBookingData[]> {
    const results = await dataRepository.aggregateOTABookings({
      ...params,
      groupBy: 'platform',
    });

    const totalAmount = results.reduce((sum, r) => sum + r.totalBookingAmount, 0);

    return results.map((r) => ({
      platform: r.platform!,
      totalBookings: r.totalBookingCount,
      totalAmount: r.totalBookingAmount,
      share: totalAmount > 0 ? r.totalBookingAmount / totalAmount : 0,
    }));
  }

  async getHeritages(params: HeritageQueryParams): Promise<PageResponse<IntangibleHeritage>> {
    return dataRepository.findHeritages(params);
  }

  async getHeritageLevelStats(params: HeritageQueryParams): Promise<HeritageLevelStats[]> {
    const { list } = await dataRepository.findHeritages({
      ...params,
      pageSize: 1000,
    });

    const levelCount = new Map<string, number>();
    for (const heritage of list) {
      levelCount.set(heritage.level, (levelCount.get(heritage.level) || 0) + 1);
    }

    const levelMap: Record<string, string> = {
      national: '国家级',
      provincial: '省级',
      municipal: '市级',
    };

    return Array.from(levelCount.entries()).map(([level, count]) => ({
      level: levelMap[level] || level,
      count,
    }));
  }

  async getHeritageCategoryStats(params: HeritageQueryParams): Promise<HeritageCategoryStats[]> {
    const { list } = await dataRepository.findHeritages({
      ...params,
      pageSize: 1000,
    });

    const categoryCount = new Map<string, number>();
    for (const heritage of list) {
      categoryCount.set(heritage.category, (categoryCount.get(heritage.category) || 0) + 1);
    }

    return Array.from(categoryCount.entries()).map(([category, count]) => ({
      category,
      count,
    }));
  }

  async getCouponConsumptions(params: CouponQueryParams): Promise<PageResponse<CouponConsumption>> {
    return dataRepository.findCouponConsumptions(params);
  }

  async getCouponStatistics(params: CouponQueryParams): Promise<CouponStatisticsResult> {
    return dataRepository.calculateCouponStatistics(params);
  }

  async getWriteOffTrend(params: CouponQueryParams): Promise<WriteOffTrendData[]> {
    const { list } = await dataRepository.findCouponConsumptions({
      ...params,
      pageSize: 1000,
    });

    const dailyData = new Map<string, { totalAmount: number; usedAmount: number }>();

    for (const consumption of list) {
      const date = consumption.statisticsDate;
      if (!dailyData.has(date)) {
        dailyData.set(date, { totalAmount: 0, usedAmount: 0 });
      }
      const data = dailyData.get(date)!;
      data.totalAmount += consumption.totalAmount;
      data.usedAmount += consumption.usedAmount;
    }

    return Array.from(dailyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        writeOffRate: data.totalAmount > 0 ? data.usedAmount / data.totalAmount : 0,
        usedAmount: data.usedAmount,
      }));
  }

  async getOverviewStats(): Promise<{
    totalVisitors: number;
    totalBookings: number;
    totalHeritages: number;
    totalCouponAmount: number;
    avgWriteOffRate: number;
  }> {
    const [flows, otaBookings, heritages, couponStats] = await Promise.all([
      dataRepository.findScenicFlows({ pageSize: 10000 }),
      dataRepository.findOTABookings({ pageSize: 10000 }),
      dataRepository.findHeritages({ pageSize: 10000 }),
      dataRepository.calculateCouponStatistics({}),
    ]);

    const totalVisitors = flows.list.reduce((sum, f) => sum + f.visitorCount, 0);
    const totalBookings = otaBookings.list.reduce((sum, o) => sum + o.bookingCount, 0);

    return {
      totalVisitors,
      totalBookings,
      totalHeritages: heritages.total,
      totalCouponAmount: couponStats.usedAmount,
      avgWriteOffRate: couponStats.writeOffRate,
    };
  }

  async createScenicFlow(data: Omit<ScenicSpotFlow, 'id' | 'timestamp'>): Promise<ScenicSpotFlow> {
    return dataRepository.createScenicFlow(data);
  }

  async createOTABooking(data: Omit<OTABookingData, 'id'>): Promise<OTABookingData> {
    return dataRepository.createOTABooking(data);
  }

  async createHeritage(data: Omit<IntangibleHeritage, 'id'>): Promise<IntangibleHeritage> {
    return dataRepository.createHeritage(data);
  }

  async createCouponConsumption(data: Omit<CouponConsumption, 'id'>): Promise<CouponConsumption> {
    return dataRepository.createCouponConsumption(data);
  }
}

export const dataAggregationService = new DataAggregationService();
