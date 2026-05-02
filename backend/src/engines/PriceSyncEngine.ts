import { ChannelPlatform } from '../constants/enums';
import { addDays, startOfDay, isAfter, isBefore, isSameDay, format } from 'date-fns';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import redis from '../lib/redis';
import { NotFoundError, BusinessRuleViolationError } from '../errors/AppError';
import roomCalendarEngine from './RoomCalendarEngine';

export interface PriceRule {
  id: string;
  propertyId: string;
  name: string;
  ruleType: 'fixed' | 'percentage';
  priceAdjustment: number;
  percentage?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  daysOfWeek?: number[] | null;
  minNights?: number | null;
  maxNights?: number | null;
  priority: number;
  isActive: boolean;
}

export interface SyncResult {
  success: boolean;
  syncedDates: number;
  errors: string[];
  platform?: ChannelPlatform;
}

export interface PriceCalculationResult {
  basePrice: number;
  finalPrice: number;
  adjustments: Array<{
    ruleId: string;
    ruleName: string;
    adjustment: number;
    type: 'fixed' | 'percentage';
  }>;
}

export class PriceSyncEngine {
  private readonly LOCK_PREFIX = 'price:sync:lock:';
  private readonly LOCK_TTL = 300;

  async calculatePrice(
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date,
    guestCount: number = 1
  ): Promise<{
    perNightPrice: number;
    totalPrice: number;
    nights: number;
    dailyBreakdown: Array<{ date: Date; price: number; originalPrice: number }>;
  }> {
    const start = startOfDay(checkInDate);
    const end = startOfDay(checkOutDate);
    const nights = this.getNightsCount(start, end);

    if (nights <= 0) {
      throw new BusinessRuleViolationError(
        '入住日期必须早于退房日期',
        'DATE_VALIDATION_RULE'
      );
    }

    const calendars = await roomCalendarEngine.getCalendarRange(propertyId, start, end);

    if (calendars.length === 0) {
      throw new NotFoundError('日历记录');
    }

    const priceRules = await this.getActiveRules(propertyId);

    const dailyBreakdown: Array<{ date: Date; price: number; originalPrice: number }> = [];
    let totalPrice = 0;

    for (const calendar of calendars) {
      const calculation = await this.applyPriceRules(
        calendar.price,
        calendar.date,
        nights,
        priceRules
      );
      
      dailyBreakdown.push({
        date: calendar.date,
        price: calculation.finalPrice,
        originalPrice: calendar.originalPrice,
      });
      
      totalPrice += calculation.finalPrice;
    }

    const perNightPrice = nights > 0 ? totalPrice / nights : 0;

    return {
      perNightPrice: Math.round(perNightPrice * 100) / 100,
      totalPrice: Math.round(totalPrice * 100) / 100,
      nights,
      dailyBreakdown,
    };
  }

  private async applyPriceRules(
    basePrice: number,
    date: Date,
    nights: number,
    rules: PriceRule[]
  ): Promise<PriceCalculationResult> {
    const adjustments: PriceCalculationResult['adjustments'] = [];
    let currentPrice = basePrice;

    const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (!rule.isActive) continue;
      if (!this.matchesRule(rule, date, nights)) continue;

      let adjustment = 0;

      if (rule.ruleType === 'fixed') {
        adjustment = rule.priceAdjustment;
      } else if (rule.ruleType === 'percentage' && rule.percentage) {
        adjustment = basePrice * (rule.percentage / 100);
      }

      currentPrice += adjustment;

      adjustments.push({
        ruleId: rule.id,
        ruleName: rule.name,
        adjustment,
        type: rule.ruleType,
      });
    }

    if (currentPrice < 0) {
      currentPrice = 0;
    }

    return {
      basePrice,
      finalPrice: Math.round(currentPrice * 100) / 100,
      adjustments,
    };
  }

  private matchesRule(rule: PriceRule, date: Date, nights: number): boolean {
    if (rule.startDate && isBefore(date, rule.startDate)) {
      return false;
    }

    if (rule.endDate && isAfter(date, rule.endDate)) {
      return false;
    }

    if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
      const dayOfWeek = date.getDay();
      if (!rule.daysOfWeek.includes(dayOfWeek)) {
        return false;
      }
    }

    if (rule.minNights !== null && nights < rule.minNights) {
      return false;
    }

    if (rule.maxNights !== null && nights > rule.maxNights) {
      return false;
    }

    return true;
  }

  async getActiveRules(propertyId: string): Promise<PriceRule[]> {
    const rules = await prisma.priceRule.findMany({
      where: {
        propertyId,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });

    return rules.map(r => ({
      ...r,
      startDate: r.startDate ?? null,
      endDate: r.endDate ?? null,
      daysOfWeek: r.daysOfWeek ? (r.daysOfWeek as unknown as number[]) : null,
      minNights: r.minNights ?? null,
      maxNights: r.maxNights ?? null,
      percentage: r.percentage ?? null,
    }));
  }

  async createPriceRule(
    propertyId: string,
    rule: Omit<PriceRule, 'id' | 'propertyId'>,
    userId: string
  ): Promise<PriceRule> {
    const created = await prisma.priceRule.create({
      data: {
        propertyId,
        name: rule.name,
        ruleType: rule.ruleType,
        priceAdjustment: rule.priceAdjustment,
        percentage: rule.percentage,
        startDate: rule.startDate,
        endDate: rule.endDate,
        daysOfWeek: rule.daysOfWeek as unknown as object,
        minNights: rule.minNights,
        maxNights: rule.maxNights,
        priority: rule.priority,
        isActive: rule.isActive,
      },
    });

    logger.info(`Created price rule for property ${propertyId}`, {
      userId,
      ruleId: created.id,
      ruleName: rule.name,
    });

    return {
      ...created,
      startDate: created.startDate ?? null,
      endDate: created.endDate ?? null,
      daysOfWeek: created.daysOfWeek ? (created.daysOfWeek as unknown as number[]) : null,
      minNights: created.minNights ?? null,
      maxNights: created.maxNights ?? null,
      percentage: created.percentage ?? null,
    };
  }

  async syncToChannels(
    propertyId: string,
    platforms: ChannelPlatform[],
    startDate?: Date,
    endDate?: Date
  ): Promise<SyncResult[]> {
    const lockKey = `${this.LOCK_PREFIX}${propertyId}`;
    const lockValue = `${Date.now()}`;

    const lockAcquired = await redis.set(lockKey, lockValue, 'EX', this.LOCK_TTL, 'NX');

    if (!lockAcquired) {
      logger.warn(`Price sync already in progress for property ${propertyId}`);
      return platforms.map(platform => ({
        success: false,
        syncedDates: 0,
        errors: ['同步正在进行中，请稍后重试'],
        platform,
      }));
    }

    try {
      const results: SyncResult[] = [];
      const start = startDate || new Date();
      const end = endDate || addDays(new Date(), 365);

      for (const platform of platforms) {
        const result = await this.syncToSingleChannel(propertyId, platform, start, end);
        results.push({ ...result, platform });
      }

      await prisma.channelSync.updateMany({
        where: {
          propertyId,
          platform: { in: platforms },
        },
        data: {
          lastSyncAt: new Date(),
          nextSyncAt: addDays(new Date(), 1),
          syncStatus: 'success',
        },
      });

      return results;
    } finally {
      await redis.del(lockKey);
    }
  }

  private async syncToSingleChannel(
    propertyId: string,
    platform: ChannelPlatform,
    startDate: Date,
    endDate: Date
  ): Promise<Omit<SyncResult, 'platform'>> {
    const channelSync = await prisma.channelSync.findUnique({
      where: {
        propertyId_platform: {
          propertyId,
          platform,
        },
      },
    });

    if (!channelSync || !channelSync.isActive) {
      return {
        success: false,
        syncedDates: 0,
        errors: [`未配置或未启用 ${platform} 渠道同步`],
      };
    }

    const calendars = await roomCalendarEngine.getCalendarRange(
      propertyId,
      startDate,
      endDate
    );

    logger.info(`Syncing prices to ${platform} for property ${propertyId}`, {
      dateRange: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd'),
      },
      datesCount: calendars.length,
    });

    return {
      success: true,
      syncedDates: calendars.length,
      errors: [],
    };
  }

  async pullFromChannels(
    propertyId: string,
    platforms: ChannelPlatform[]
  ): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const platform of platforms) {
      const channelSync = await prisma.channelSync.findUnique({
        where: {
          propertyId_platform: {
            propertyId,
            platform,
          },
        },
      });

      if (!channelSync || !channelSync.isActive) {
        results.push({
          success: false,
          syncedDates: 0,
          errors: [`未配置或未启用 ${platform} 渠道同步`],
          platform,
        });
        continue;
      }

      logger.info(`Pulling prices from ${platform} for property ${propertyId}`);

      results.push({
        success: true,
        syncedDates: 0,
        errors: [],
        platform,
      });
    }

    return results;
  }

  async updatePropertyPrice(
    propertyId: string,
    newBasePrice: number,
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const start = startDate || new Date();
    const end = endDate || addDays(new Date(), 365);

    const count = await roomCalendarEngine.updatePrice(
      propertyId,
      start,
      end,
      newBasePrice,
      userId,
      true
    );

    await prisma.property.update({
      where: { id: propertyId },
      data: { pricePerNight: newBasePrice },
    });

    return count;
  }

  private getNightsCount(startDate: Date, endDate: Date): number {
    const start = startOfDay(startDate);
    const end = startOfDay(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
}

export const priceSyncEngine = new PriceSyncEngine();
export default priceSyncEngine;
