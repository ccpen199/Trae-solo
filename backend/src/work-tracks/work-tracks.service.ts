import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkTracksService {
  constructor(private prisma: PrismaService) {}

  async findByOrder(orderId: string) {
    return this.prisma.workTrack.findMany({
      where: { orderId },
      orderBy: { timestamp: 'asc' },
    });
  }

  async create(
    userId: string,
    data: {
      orderId: string;
      startTime: string;
      endTime?: string;
      points?: Array<{
        lng: number;
        lat: number;
        speed?: number;
        altitude?: number;
        accuracy?: number;
        timestamp: string;
      }>;
    },
  ) {
    // 这里简化处理，实际应该根据 data 中的 points 创建多条轨迹记录
    if (data.points && data.points.length > 0) {
      const tracks = data.points.map(point => ({
        orderId: data.orderId,
        lng: point.lng,
        lat: point.lat,
        timestamp: new Date(point.timestamp),
        speed: point.speed,
        altitude: point.altitude,
        accuracy: point.accuracy,
      }));
      return this.prisma.workTrack.createMany({
        data: tracks,
      });
    }
    return null;
  }

  async findPointsByOrder(orderId: string, startTime?: string, endTime?: string) {
    const where: any = { orderId };
    if (startTime) {
      where.timestamp = { ...where.timestamp, gte: new Date(startTime) };
    }
    if (endTime) {
      where.timestamp = { ...where.timestamp, lte: new Date(endTime) };
    }
    return this.prisma.workTrack.findMany({
      where,
      orderBy: { timestamp: 'asc' },
    });
  }

  async getOrderStats(orderId: string) {
    const tracks = await this.findByOrder(orderId);
    
    if (tracks.length === 0) {
      return {
        totalPoints: 0,
        duration: 0,
        distance: 0,
      };
    }

    const totalPoints = tracks.length;
    const startTime = tracks[0].timestamp;
    const endTime = tracks[tracks.length - 1].timestamp;
    const duration = (endTime.getTime() - startTime.getTime()) / 1000 / 60; // 分钟

    // 计算距离（简化计算）
    let distance = 0;
    for (let i = 1; i < tracks.length; i++) {
      const prev = tracks[i - 1];
      const curr = tracks[i];
      // 使用简单的欧几里得距离计算
      const dx = curr.lng - prev.lng;
      const dy = curr.lat - prev.lat;
      distance += Math.sqrt(dx * dx + dy * dy);
    }

    return {
      totalPoints,
      duration: Math.round(duration * 100) / 100,
      distance: Math.round(distance * 100000) / 100000, // 转换为合适的单位
    };
  }

  async verifyTracks(orderId: string) {
    const tracks = await this.findByOrder(orderId);
    
    if (tracks.length < 3) {
      return {
        verified: false,
        reason: '轨迹点数量不足',
      };
    }

    // 简单的验证逻辑
    const stats = await this.getOrderStats(orderId);
    
    if (stats.duration < 5) { // 至少5分钟
      return {
        verified: false,
        reason: '作业时长不足',
      };
    }

    return {
      verified: true,
      stats,
    };
  }
}
