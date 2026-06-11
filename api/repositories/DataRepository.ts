import { db, generateId, now } from '../data/database.js';
import type {
  ScenicSpotFlow,
  OTABookingData,
  IntangibleHeritage,
  CouponConsumption,
  PageResponse,
} from '../../shared/types/index.js';

export interface FlowQueryParams {
  startTime?: string;
  endTime?: string;
  region?: string;
  scenicSpotId?: string;
  page?: number;
  pageSize?: number;
}

export interface OTAQueryParams {
  platform?: string;
  startDate?: string;
  endDate?: string;
  scenicSpotId?: string;
  groupBy?: 'platform' | 'date' | 'scenicSpot';
  page?: number;
  pageSize?: number;
}

export interface HeritageQueryParams {
  level?: 'national' | 'provincial' | 'municipal';
  category?: string;
  region?: string;
  page?: number;
  pageSize?: number;
}

export interface CouponQueryParams {
  startDate?: string;
  endDate?: string;
  region?: string;
  couponBatchId?: string;
  page?: number;
  pageSize?: number;
}

export interface OTAAggregationResult {
  platform?: string;
  date?: string;
  scenicSpotId?: string;
  scenicSpotName?: string;
  totalBookingCount: number;
  totalBookingAmount: number;
}

export interface CouponStatisticsResult {
  totalIssued: number;
  totalConsumed: number;
  totalIssuedAmount: number;
  totalAmount: number;
  consumptionRate: number;
  writeOffRate: number;
  usedCount: number;
  usedAmount: number;
  region?: string;
  statisticsDate?: string;
}

export class DataRepository {
  async findScenicFlows(params: FlowQueryParams): Promise<PageResponse<ScenicSpotFlow>> {
    const { startTime, endTime, region, scenicSpotId, page = 1, pageSize = 20 } = params;
    
    let allFlows: ScenicSpotFlow[] = [];
    db.scenicFlows.forEach((flows) => {
      allFlows = [...allFlows, ...flows];
    });

    let filtered = allFlows.filter((flow) => {
      let match = true;
      if (startTime && flow.timestamp < startTime) match = false;
      if (endTime && flow.timestamp > endTime) match = false;
      if (region && flow.region !== region) match = false;
      if (scenicSpotId && flow.scenicSpotId !== scenicSpotId) match = false;
      return match;
    });

    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);

    return { list, total, page, pageSize };
  }

  async findOTABookings(params: OTAQueryParams): Promise<PageResponse<OTABookingData>> {
    const { platform, startDate, endDate, scenicSpotId, page = 1, pageSize = 20 } = params;
    
    let allBookings: OTABookingData[] = [];
    db.otaBookings.forEach((bookings) => {
      allBookings = [...allBookings, ...bookings];
    });

    let filtered = allBookings.filter((booking) => {
      let match = true;
      if (platform && booking.platform !== platform) match = false;
      if (startDate && booking.dataDate < startDate) match = false;
      if (endDate && booking.dataDate > endDate) match = false;
      if (scenicSpotId && booking.scenicSpotId !== scenicSpotId) match = false;
      return match;
    });

    filtered.sort((a, b) => new Date(b.dataDate).getTime() - new Date(a.dataDate).getTime());

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);

    return { list, total, page, pageSize };
  }

  async aggregateOTABookings(params: OTAQueryParams): Promise<OTAAggregationResult[]> {
    const { platform, startDate, endDate, scenicSpotId, groupBy = 'platform' } = params;
    
    let allBookings: OTABookingData[] = [];
    db.otaBookings.forEach((bookings) => {
      allBookings = [...allBookings, ...bookings];
    });

    let filtered = allBookings.filter((booking) => {
      let match = true;
      if (platform && booking.platform !== platform) match = false;
      if (startDate && booking.dataDate < startDate) match = false;
      if (endDate && booking.dataDate > endDate) match = false;
      if (scenicSpotId && booking.scenicSpotId !== scenicSpotId) match = false;
      return match;
    });

    const groups = new Map<string, OTAAggregationResult>();

    for (const booking of filtered) {
      let key: string;
      switch (groupBy) {
        case 'date':
          key = booking.dataDate;
          break;
        case 'scenicSpot':
          key = booking.scenicSpotId;
          break;
        case 'platform':
        default:
          key = booking.platform;
      }

      if (!groups.has(key)) {
        groups.set(key, {
          platform: groupBy === 'platform' ? booking.platform : undefined,
          date: groupBy === 'date' ? booking.dataDate : undefined,
          scenicSpotId: groupBy === 'scenicSpot' ? booking.scenicSpotId : undefined,
          scenicSpotName: groupBy === 'scenicSpot' ? booking.scenicSpotName : undefined,
          totalBookingCount: 0,
          totalBookingAmount: 0,
        });
      }

      const group = groups.get(key)!;
      group.totalBookingCount += booking.bookingCount;
      group.totalBookingAmount += booking.bookingAmount;
    }

    return Array.from(groups.values());
  }

  async findHeritages(params: HeritageQueryParams): Promise<PageResponse<IntangibleHeritage>> {
    const { level, category, region, page = 1, pageSize = 20 } = params;
    
    let allHeritages = Array.from(db.heritages.values());

    let filtered = allHeritages.filter((heritage) => {
      let match = true;
      if (level && heritage.level !== level) match = false;
      if (category && heritage.category !== category) match = false;
      if (region && heritage.region !== region) match = false;
      return match;
    });

    filtered.sort((a, b) => a.name.localeCompare(b.name));

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);

    return { list, total, page, pageSize };
  }

  async findCouponConsumptions(params: CouponQueryParams): Promise<PageResponse<CouponConsumption>> {
    const { startDate, endDate, region, couponBatchId, page = 1, pageSize = 20 } = params;
    
    let allConsumptions: CouponConsumption[] = [];
    db.couponConsumptions.forEach((consumptions) => {
      allConsumptions = [...allConsumptions, ...consumptions];
    });

    let filtered = allConsumptions.filter((consumption) => {
      let match = true;
      if (startDate && consumption.statisticsDate < startDate) match = false;
      if (endDate && consumption.statisticsDate > endDate) match = false;
      if (region && consumption.region !== region) match = false;
      if (couponBatchId && consumption.couponBatchId !== couponBatchId) match = false;
      return match;
    });

    filtered.sort((a, b) => new Date(b.statisticsDate).getTime() - new Date(a.statisticsDate).getTime());

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);

    return { list, total, page, pageSize };
  }

  async calculateCouponStatistics(params: CouponQueryParams): Promise<CouponStatisticsResult> {
    const { startDate, endDate, region, couponBatchId } = params;

    const allBatchIds = new Set<string>();
    let totalIssuedCount = 0;
    let totalIssuedAmount = 0;
    db.couponBatches.forEach((batch) => {
      let match = true;
      if (region && batch.region !== region) match = false;
      if (couponBatchId && batch.id !== couponBatchId) match = false;
      if (match) {
        allBatchIds.add(batch.id);
        totalIssuedCount += batch.totalCount;
        totalIssuedAmount += batch.totalAmount;
      }
    });

    let allConsumptions: CouponConsumption[] = [];
    db.couponConsumptions.forEach((consumptions) => {
      allConsumptions = [...allConsumptions, ...consumptions];
    });

    const filtered = allConsumptions.filter((consumption) => {
      if (!allBatchIds.has(consumption.couponBatchId)) return false;
      if (startDate && consumption.statisticsDate < startDate) return false;
      if (endDate && consumption.statisticsDate > endDate) return false;
      return true;
    });

    const usedAmount = filtered.reduce((sum, c) => sum + c.usedAmount, 0);
    const usedCount = filtered.reduce((sum, c) => sum + c.usedCount, 0);
    const consumptionRate = totalIssuedCount > 0 ? (usedCount / totalIssuedCount) * 100 : 0;

    return {
      totalIssued: totalIssuedCount,
      totalConsumed: usedCount,
      totalIssuedAmount,
      totalAmount: usedAmount,
      consumptionRate,
      writeOffRate: totalIssuedAmount > 0 ? usedAmount / totalIssuedAmount : 0,
      usedCount,
      usedAmount,
      region,
    };
  }

  async createScenicFlow(data: Omit<ScenicSpotFlow, 'id' | 'timestamp'>): Promise<ScenicSpotFlow> {
    const flow: ScenicSpotFlow = {
      ...data,
      id: generateId(),
      timestamp: now(),
    };

    const existing = db.scenicFlows.get(data.scenicSpotId) || [];
    db.scenicFlows.set(data.scenicSpotId, [...existing, flow]);

    return flow;
  }

  async createOTABooking(data: Omit<OTABookingData, 'id'>): Promise<OTABookingData> {
    const booking: OTABookingData = {
      ...data,
      id: generateId(),
    };

    const existing = db.otaBookings.get(data.scenicSpotId) || [];
    db.otaBookings.set(data.scenicSpotId, [...existing, booking]);

    return booking;
  }

  async createHeritage(data: Omit<IntangibleHeritage, 'id'>): Promise<IntangibleHeritage> {
    const heritage: IntangibleHeritage = {
      ...data,
      id: generateId(),
    };

    db.heritages.set(heritage.id, heritage);
    return heritage;
  }

  async createCouponConsumption(data: Omit<CouponConsumption, 'id'>): Promise<CouponConsumption> {
    const consumption: CouponConsumption = {
      ...data,
      id: generateId(),
    };

    const existing = db.couponConsumptions.get(data.couponBatchId) || [];
    db.couponConsumptions.set(data.couponBatchId, [...existing, consumption]);

    return consumption;
  }
}

export const dataRepository = new DataRepository();
