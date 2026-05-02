import { RoomStatus, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import redis from '../lib/redis';

export interface RoomStatusChangeOptions {
  roomId: string;
  newStatus: RoomStatus;
  operatorId?: string;
  operatorName?: string;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
}

class RoomStatusEngine {
  private readonly ROOM_STATUS_CACHE_KEY = 'room:status';
  private readonly CACHE_TTL = 300;

  async changeStatus(options: RoomStatusChangeOptions): Promise<{
    success: boolean;
    fromStatus?: RoomStatus;
    toStatus?: RoomStatus;
    error?: string;
  }> {
    const { roomId, newStatus, operatorId, operatorName, reason, referenceType, referenceId } = options;

    return prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { id: roomId },
        select: { id: true, status: true, roomNumber: true },
      });

      if (!room) {
        return {
          success: false,
          error: '房间不存在',
        };
      }

      const fromStatus = room.status;

      if (fromStatus === newStatus) {
        return {
          success: true,
          fromStatus,
          toStatus: newStatus,
        };
      }

      if (!this.validateStatusTransition(fromStatus, newStatus)) {
        return {
          success: false,
          error: `不允许从 ${fromStatus} 转换到 ${newStatus}`,
        };
      }

      await tx.room.update({
        where: { id: roomId },
        data: { status: newStatus },
      });

      await tx.roomStatusHistory.create({
        data: {
          roomId,
          fromStatus,
          toStatus: newStatus,
          operatorId,
          operatorName,
          reason,
          referenceType,
          referenceId,
        },
      });

      await this.updateCache(roomId, newStatus);

      return {
        success: true,
        fromStatus,
        toStatus: newStatus,
      };
    });
  }

  validateStatusTransition(from: RoomStatus, to: RoomStatus): boolean {
    const validTransitions: Record<RoomStatus, RoomStatus[]> = {
      [RoomStatus.VACANT]: [RoomStatus.OCCUPIED, RoomStatus.RESERVED, RoomStatus.MAINTENANCE],
      [RoomStatus.OCCUPIED]: [RoomStatus.DIRTY],
      [RoomStatus.DIRTY]: [RoomStatus.VACANT, RoomStatus.MAINTENANCE],
      [RoomStatus.MAINTENANCE]: [RoomStatus.DIRTY, RoomStatus.VACANT],
      [RoomStatus.RESERVED]: [RoomStatus.OCCUPIED, RoomStatus.VACANT],
    };

    return validTransitions[from]?.includes(to) || false;
  }

  async getRoomStatus(roomId: string): Promise<RoomStatus | null> {
    const cachedStatus = await redis.hget(this.ROOM_STATUS_CACHE_KEY, roomId);
    if (cachedStatus) {
      return cachedStatus as RoomStatus;
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { status: true },
    });

    if (room) {
      await this.updateCache(roomId, room.status);
      return room.status;
    }

    return null;
  }

  async getAllRoomStatuses(): Promise<Record<string, RoomStatus>> {
    const cached = await redis.hgetall(this.ROOM_STATUS_CACHE_KEY);
    if (Object.keys(cached).length > 0) {
      return cached as Record<string, RoomStatus>;
    }

    const rooms = await prisma.room.findMany({
      select: { id: true, status: true },
    });

    const statusMap: Record<string, RoomStatus> = {};
    for (const room of rooms) {
      statusMap[room.id] = room.status;
    }

    await redis.hset(this.ROOM_STATUS_CACHE_KEY, statusMap);
    await redis.expire(this.ROOM_STATUS_CACHE_KEY, this.CACHE_TTL);

    return statusMap;
  }

  async getStatusHistory(roomId: string, limit: number = 20) {
    return prisma.roomStatusHistory.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private async updateCache(roomId: string, status: RoomStatus): Promise<void> {
    await redis.hset(this.ROOM_STATUS_CACHE_KEY, roomId, status);
    await redis.expire(this.ROOM_STATUS_CACHE_KEY, this.CACHE_TTL);
    await redis.publish('room_status_change', JSON.stringify({ roomId, status }));
  }

  async clearCache(): Promise<void> {
    await redis.del(this.ROOM_STATUS_CACHE_KEY);
  }
}

export const roomStatusEngine = new RoomStatusEngine();
