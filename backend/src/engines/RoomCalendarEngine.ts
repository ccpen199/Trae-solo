import { RoomStatus } from '../constants/enums';
import { addDays, differenceInDays, startOfDay, format, isAfter, isBefore, isSameDay } from 'date-fns';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { StatusConflictError, NotFoundError, BusinessRuleViolationError } from '../errors/AppError';
import optimisticLockService from '../services/OptimisticLockService';

export interface CalendarRange {
  startDate: Date;
  endDate: Date;
}

export interface CalendarDay {
  date: Date;
  status: RoomStatus;
  price: number;
  originalPrice: number;
  isBlocked: boolean;
  blockReason?: string | null;
  orderId?: string | null;
  version: number;
}

export interface AvailabilityCheckResult {
  available: boolean;
  conflicts: Array<{
    date: Date;
    status: RoomStatus;
    reason: string;
  }>;
}

export interface BlockCalendarOptions {
  reason: string;
  userId: string;
}

export class RoomCalendarEngine {
  async initializeCalendar(
    propertyId: string,
    basePrice: number,
    options: {
      startDate?: Date;
      endDate?: Date;
      userId: string;
    }
  ): Promise<number> {
    const { startDate = new Date(), endDate = addDays(new Date(), 365), userId } = options;

    const start = startOfDay(startDate);
    const end = startOfDay(endDate);
    
    const totalDays = differenceInDays(end, start) + 1;

    const existingCalendars = await prisma.roomCalendar.findMany({
      where: {
        propertyId,
        date: {
          gte: start,
          lte: end,
        },
      },
      select: { date: true },
    });

    const existingDates = new Set(existingCalendars.map(c => format(c.date, 'yyyy-MM-dd')));
    
    const calendarsToCreate: Array<{
      propertyId: string;
      date: Date;
      status: RoomStatus;
      price: number;
      originalPrice: number;
      isBlocked: boolean;
      version: number;
    }> = [];

    let currentDate = new Date(start);
    while (isBefore(currentDate, end) || isSameDay(currentDate, end)) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      
      if (!existingDates.has(dateStr)) {
        calendarsToCreate.push({
          propertyId,
          date: new Date(currentDate),
          status: RoomStatus.AVAILABLE,
          price: basePrice,
          originalPrice: basePrice,
          isBlocked: false,
          version: 1,
        });
      }
      
      currentDate = addDays(currentDate, 1);
    }

    if (calendarsToCreate.length > 0) {
      await prisma.roomCalendar.createMany({
        data: calendarsToCreate,
      });

      logger.info(`Initialized ${calendarsToCreate.length} calendar days for property ${propertyId}`, {
        userId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
    }

    return calendarsToCreate.length;
  }

  async checkAvailability(
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date
  ): Promise<AvailabilityCheckResult> {
    const start = startOfDay(checkInDate);
    const end = startOfDay(checkOutDate);

    const calendars = await prisma.roomCalendar.findMany({
      where: {
        propertyId,
        date: {
          gte: start,
          lt: end,
        },
      },
      orderBy: { date: 'asc' },
    });

    const expectedDays = differenceInDays(end, start);
    const conflicts: Array<{ date: Date; status: RoomStatus; reason: string }> = [];

    if (calendars.length < expectedDays) {
      const calendarDates = new Set(calendars.map(c => format(c.date, 'yyyy-MM-dd')));
      
      let currentDate = new Date(start);
      while (isBefore(currentDate, end)) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        if (!calendarDates.has(dateStr)) {
          conflicts.push({
            date: new Date(currentDate),
            status: RoomStatus.BLOCKED,
            reason: '日历未初始化',
          });
        }
        currentDate = addDays(currentDate, 1);
      }
    }

    for (const calendar of calendars) {
      if (calendar.isBlocked) {
        conflicts.push({
          date: calendar.date,
          status: calendar.status,
          reason: calendar.blockReason || '房源已被封锁',
        });
        continue;
      }

      if (calendar.status === RoomStatus.BOOKED) {
        conflicts.push({
          date: calendar.date,
          status: calendar.status,
          reason: '房源已被预订',
        });
        continue;
      }

      if (calendar.status === RoomStatus.MAINTENANCE) {
        conflicts.push({
          date: calendar.date,
          status: calendar.status,
          reason: '房源维护中',
        });
        continue;
      }
    }

    return {
      available: conflicts.length === 0,
      conflicts,
    };
  }

  async getCalendarRange(
    propertyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarDay[]> {
    const calendars = await prisma.roomCalendar.findMany({
      where: {
        propertyId,
        date: {
          gte: startOfDay(startDate),
          lte: startOfDay(endDate),
        },
      },
      orderBy: { date: 'asc' },
    });

    return calendars.map(c => ({
      date: c.date,
      status: c.status,
      price: Number(c.price),
      originalPrice: Number(c.originalPrice),
      isBlocked: c.isBlocked,
      blockReason: c.blockReason,
      orderId: c.orderId,
      version: c.version,
    }));
  }

  async blockCalendar(
    propertyId: string,
    startDate: Date,
    endDate: Date,
    options: BlockCalendarOptions
  ): Promise<number> {
    const start = startOfDay(startDate);
    const end = startOfDay(endDate);
    const { reason, userId } = options;

    const availability = await this.checkAvailability(propertyId, start, end);

    if (!availability.available) {
      throw new StatusConflictError(
        '无法封锁，部分日期已被占用',
        'Calendar',
        propertyId
      );
    }

    const result = await prisma.roomCalendar.updateMany({
      where: {
        propertyId,
        date: {
          gte: start,
          lt: end,
        },
        status: RoomStatus.AVAILABLE,
      },
      data: {
        isBlocked: true,
        blockReason: reason,
        status: RoomStatus.BLOCKED,
      },
    });

    logger.info(`Blocked ${result.count} calendar days for property ${propertyId}`, {
      userId,
      reason,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });

    return result.count;
  }

  async unblockCalendar(
    propertyId: string,
    startDate: Date,
    endDate: Date,
    userId: string
  ): Promise<number> {
    const start = startOfDay(startDate);
    const end = startOfDay(endDate);

    const result = await prisma.roomCalendar.updateMany({
      where: {
        propertyId,
        date: {
          gte: start,
          lt: end,
        },
        isBlocked: true,
      },
      data: {
        isBlocked: false,
        blockReason: null,
        status: RoomStatus.AVAILABLE,
      },
    });

    logger.info(`Unblocked ${result.count} calendar days for property ${propertyId}`, {
      userId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });

    return result.count;
  }

  async bookCalendar(
    propertyId: string,
    orderId: string,
    startDate: Date,
    endDate: Date,
    userId: string
  ): Promise<number> {
    const start = startOfDay(startDate);
    const end = startOfDay(endDate);

    const availability = await this.checkAvailability(propertyId, start, end);

    if (!availability.available) {
      throw new StatusConflictError(
        '房源在所选日期不可用',
        'Calendar',
        propertyId
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const calendars = await tx.roomCalendar.findMany({
        where: {
          propertyId,
          date: {
            gte: start,
            lt: end,
          },
        },
      });

      for (const calendar of calendars) {
        if (calendar.status !== RoomStatus.AVAILABLE || calendar.isBlocked) {
          throw new StatusConflictError(
            `日期 ${format(calendar.date, 'yyyy-MM-dd')} 不可用`,
            'Calendar',
            propertyId
          );
        }
      }

      const updated = await tx.roomCalendar.updateMany({
        where: {
          propertyId,
          date: {
            gte: start,
            lt: end,
          },
        },
        data: {
          status: RoomStatus.BOOKED,
          orderId,
        },
      });

      return updated.count;
    });

    logger.info(`Booked ${result} calendar days for order ${orderId}`, {
      userId,
      propertyId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });

    return result;
  }

  async releaseCalendar(
    orderId: string,
    userId: string
  ): Promise<number> {
    const calendars = await prisma.roomCalendar.findMany({
      where: { orderId },
    });

    if (calendars.length === 0) {
      return 0;
    }

    const result = await prisma.roomCalendar.updateMany({
      where: { orderId },
      data: {
        status: RoomStatus.AVAILABLE,
        orderId: null,
      },
    });

    logger.info(`Released ${result.count} calendar days for order ${orderId}`, {
      userId,
    });

    return result.count;
  }

  async updatePrice(
    propertyId: string,
    startDate: Date,
    endDate: Date,
    newPrice: number,
    userId: string,
    updateOriginal: boolean = false
  ): Promise<number> {
    const start = startOfDay(startDate);
    const end = startOfDay(endDate);

    const updateData: {
      price: number;
      originalPrice?: number;
    } = {
      price: newPrice,
    };

    if (updateOriginal) {
      updateData.originalPrice = newPrice;
    }

    const result = await prisma.roomCalendar.updateMany({
      where: {
        propertyId,
        date: {
          gte: start,
          lte: end,
        },
      },
      data: updateData,
    });

    logger.info(`Updated price for ${result.count} calendar days`, {
      userId,
      propertyId,
      newPrice,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });

    return result.count;
  }

  async markAsCleaning(
    propertyId: string,
    date: Date,
    userId: string
  ): Promise<void> {
    const d = startOfDay(date);

    const calendar = await prisma.roomCalendar.findUnique({
      where: {
        propertyId_date: {
          propertyId,
          date: d,
        },
      },
    });

    if (!calendar) {
      throw new NotFoundError('日历记录');
    }

    if (calendar.status !== RoomStatus.BOOKED) {
      throw new BusinessRuleViolationError(
        '只能将已预订日期标记为保洁中',
        'CALENDAR_STATUS_RULE'
      );
    }

    await prisma.roomCalendar.update({
      where: {
        propertyId_date: {
          propertyId,
          date: d,
        },
      },
      data: {
        status: RoomStatus.CLEANING,
      },
    });

    logger.info(`Marked date as cleaning`, {
      userId,
      propertyId,
      date: d.toISOString(),
    });
  }

  async markAsAvailable(
    propertyId: string,
    date: Date,
    userId: string
  ): Promise<void> {
    const d = startOfDay(date);

    const calendar = await prisma.roomCalendar.findUnique({
      where: {
        propertyId_date: {
          propertyId,
          date: d,
        },
      },
    });

    if (!calendar) {
      throw new NotFoundError('日历记录');
    }

    if (calendar.status !== RoomStatus.CLEANING && calendar.status !== RoomStatus.MAINTENANCE) {
      throw new BusinessRuleViolationError(
        '只能将保洁中或维护中的日期标记为可用',
        'CALENDAR_STATUS_RULE'
      );
    }

    await prisma.roomCalendar.update({
      where: {
        propertyId_date: {
          propertyId,
          date: d,
        },
      },
      data: {
        status: RoomStatus.AVAILABLE,
      },
    });

    logger.info(`Marked date as available`, {
      userId,
      propertyId,
      date: d.toISOString(),
    });
  }
}

export const roomCalendarEngine = new RoomCalendarEngine();
export default roomCalendarEngine;
