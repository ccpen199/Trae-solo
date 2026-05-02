import { ChannelType, ReservationStatus, RoomType } from '@prisma/client';
import prisma from '../lib/prisma';
import redis from '../lib/redis';

export interface ChannelReservation {
  channelOrderNo: string;
  channelType: ChannelType;
  guestName: string;
  guestPhone?: string;
  guestIdCard?: string;
  roomType: RoomType;
  checkInDate: Date;
  checkOutDate: Date;
  adultCount: number;
  childCount: number;
  roomRate: number;
  totalAmount: number;
  specialRequests?: string;
}

export interface InventoryUpdate {
  roomType: RoomType;
  date: Date;
  quantity: number;
}

export interface RateUpdate {
  roomType: RoomType;
  startDate: Date;
  endDate: Date;
  price: number;
}

class ChannelSyncEngine {
  private readonly INVENTORY_CACHE_KEY = 'channel:inventory';
  private readonly RATE_CACHE_KEY = 'channel:rates';
  private readonly CACHE_TTL = 600;

  async createReservationFromChannel(data: ChannelReservation, operatorId?: string, operatorName?: string) {
    return prisma.$transaction(async (tx) => {
      const channel = await tx.channel.findFirst({
        where: { type: data.channelType, isActive: true },
      });

      if (!channel) {
        return {
          success: false,
          error: '渠道不存在或未启用',
        };
      }

      const totalNights = Math.ceil(
        (data.checkOutDate.getTime() - data.checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const isAvailable = await this.checkInventory(
        data.roomType,
        data.checkInDate,
        data.checkOutDate
      );

      if (!isAvailable) {
        await this.logSync({
          channelId: channel.id,
          syncType: 'RESERVATION_CREATE',
          isSuccess: false,
          errorMessage: '库存不足',
          requestData: data as any,
        });

        return {
          success: false,
          error: '所选房型库存不足',
        };
      }

      let guest = await tx.guest.findFirst({
        where: {
          OR: [
            { idCardNumber: data.guestIdCard },
            { phone: data.guestPhone },
          ],
        },
      });

      if (!guest) {
        guest = await tx.guest.create({
          data: {
            name: data.guestName,
            idCardNumber: data.guestIdCard,
            phone: data.guestPhone,
          },
        });
      }

      const reservationNo = await this.generateReservationNo();

      const reservation = await tx.reservation.create({
        data: {
          reservationNo,
          channelId: channel.id,
          guestId: guest.id,
          roomType: data.roomType,
          status: ReservationStatus.CONFIRMED,
          checkInDate: data.checkInDate,
          checkOutDate: data.checkOutDate,
          adultCount: data.adultCount,
          childCount: data.childCount,
          totalNights,
          roomRate: data.roomRate,
          totalAmount: data.totalAmount,
          specialRequests: data.specialRequests,
          sourceOrderNo: data.channelOrderNo,
          isSync: true,
        },
      });

      await tx.bill.create({
        data: {
          billNo: await this.generateBillNo(),
          reservationId: reservation.id,
          guestId: guest.id,
          totalAmount: data.totalAmount,
        },
      });

      await this.updateInventory(data.roomType, data.checkInDate, data.checkOutDate, -1);

      await this.logSync({
        channelId: channel.id,
        syncType: 'RESERVATION_CREATE',
        referenceType: 'Reservation',
        referenceId: reservation.id,
        isSuccess: true,
        requestData: data as any,
        responseData: { reservationId: reservation.id },
      });

      return {
        success: true,
        reservation,
      };
    });
  }

  async checkInventory(roomType: RoomType, checkInDate: Date, checkOutDate: Date): Promise<boolean> {
    const totalRoomsOfType = await prisma.room.count({
      where: { type: roomType, status: { notIn: ['MAINTENANCE'] } },
    });

    if (totalRoomsOfType === 0) {
      return false;
    }

    const reservedRooms = await prisma.reservation.count({
      where: {
        roomType,
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        checkInDate: { lt: checkOutDate },
        checkOutDate: { gt: checkInDate },
      },
    });

    return reservedRooms < totalRoomsOfType;
  }

  async updateInventory(
    roomType: RoomType,
    checkInDate: Date,
    checkOutDate: Date,
    delta: number
  ): Promise<void> {
    const dates = this.getDateRange(checkInDate, checkOutDate);

    for (const date of dates) {
      const cacheKey = `${this.INVENTORY_CACHE_KEY}:${roomType}:${date.toISOString().split('T')[0]}`;
      const currentInventory = await redis.get(cacheKey);
      const newInventory = (parseInt(currentInventory || '0') + delta);
      if (newInventory >= 0) {
        await redis.set(cacheKey, newInventory, 'EX', this.CACHE_TTL);
      }
    }

    await redis.publish('inventory_change', JSON.stringify({
      roomType,
      checkInDate,
      checkOutDate,
      delta,
    }));
  }

  async getAvailableRooms(roomType: RoomType, date: Date): Promise<number> {
    const cacheKey = `${this.INVENTORY_CACHE_KEY}:${roomType}:${date.toISOString().split('T')[0]}`;
    const cached = await redis.get(cacheKey);

    if (cached !== null) {
      return parseInt(cached);
    }

    const totalRooms = await prisma.room.count({
      where: { type: roomType, status: { notIn: ['MAINTENANCE'] } },
    });

    const reservedRooms = await prisma.reservation.count({
      where: {
        roomType,
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        checkInDate: { lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) },
        checkOutDate: { gt: date },
      },
    });

    const available = totalRooms - reservedRooms;
    await redis.set(cacheKey, available, 'EX', this.CACHE_TTL);

    return available;
  }

  async updateRates(updates: RateUpdate[]): Promise<void> {
    for (const update of updates) {
      const dates = this.getDateRange(update.startDate, update.endDate);

      for (const date of dates) {
        const cacheKey = `${this.RATE_CACHE_KEY}:${update.roomType}:${date.toISOString().split('T')[0]}`;
        await redis.set(cacheKey, update.price, 'EX', this.CACHE_TTL * 2);
      }
    }

    await redis.publish('rate_change', JSON.stringify({ updates }));
  }

  async getRate(roomType: RoomType, date: Date): Promise<number | null> {
    const cacheKey = `${this.RATE_CACHE_KEY}:${roomType}:${date.toISOString().split('T')[0]}`;
    const cached = await redis.get(cacheKey);

    if (cached !== null) {
      return parseFloat(cached);
    }

    const room = await prisma.room.findFirst({
      where: { type: roomType },
      select: { basePrice: true },
    });

    if (room) {
      return parseFloat(room.basePrice.toString());
    }

    return null;
  }

  private async logSync(data: {
    channelId: string;
    syncType: string;
    referenceType?: string;
    referenceId?: string;
    isSuccess: boolean;
    errorMessage?: string;
    requestData?: any;
    responseData?: any;
  }): Promise<void> {
    await prisma.channelSyncLog.create({
      data: {
        ...data,
        requestData: data.requestData ? JSON.parse(JSON.stringify(data.requestData)),
        responseData: data.responseData ? JSON.parse(JSON.stringify(data.responseData)) : undefined,
      },
    });
  }

  private getDateRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    let current = new Date(start);
    while (current < end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  private async generateReservationNo(): Promise<string> {
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    const count = await prisma.reservation.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
    });

    return `RSV${dateStr}${(count + 1).toString().padStart(4, '0')}`;
  }

  private async generateBillNo(): Promise<string> {
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    const count = await prisma.bill.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
    });

    return `BL${dateStr}${(count + 1).toString().padStart(6, '0')}`;
  }
}

export const channelSyncEngine = new ChannelSyncEngine();
