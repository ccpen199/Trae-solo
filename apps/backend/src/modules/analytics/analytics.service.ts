import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SceneEntity } from '../../database/entities/scene.entity';
import { DeviceEntity } from '../../database/entities/device.entity';
import { TelemetryEntity, UserBehaviorLogEntity } from '../../database/entities/telemetry.entity';
import { HomeEntity } from '../../database/entities/home.entity';
import { CacheService } from '../redis/cache.service';
import { DeviceCategory } from '@iot/shared';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(SceneEntity) private readonly sceneRepo: Repository<SceneEntity>,
    @InjectRepository(DeviceEntity) private readonly deviceRepo: Repository<DeviceEntity>,
    @InjectRepository(TelemetryEntity) private readonly telemetryRepo: Repository<TelemetryEntity>,
    @InjectRepository(HomeEntity) private readonly homeRepo: Repository<HomeEntity>,
    @InjectRepository(UserBehaviorLogEntity) private readonly behaviorRepo: Repository<UserBehaviorLogEntity>,
    private readonly cache: CacheService,
  ) {}

  async getUsageReport(homeId: string, range: '7d' | '30d' | '90d' = '30d') {
    const days = { '7d': 7, '30d': 30, '90d': 90 }[range];
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const devices = await this.deviceRepo.find({ where: { homeId } });
    const scenes = await this.sceneRepo.find({ where: { homeId } });

    const totalSceneExecutions = scenes.reduce((acc, s) => acc + s.executionCount, 0);

    const deviceUsage = await Promise.all(
      devices.map(async (device) => ({
        deviceId: device.id,
        deviceName: device.name,
        category: device.category,
        telemetryCount: await this.telemetryRepo.count({
          where: { deviceId: device.id, timestamp: since as any },
        }),
        onlineSeconds: device.onlineSecondsToday * (days / 1),
      })),
    );

    const byCategory = deviceUsage.reduce((acc, u) => {
      acc[u.category] = acc[u.category] || { count: 0, telemetry: 0 };
      acc[u.category].count++;
      acc[u.category].telemetry += u.telemetryCount;
      return acc;
    }, {} as Record<string, { count: number; telemetry: number }>);

    const behaviorLogs = await this.behaviorRepo.count({
      where: { homeId, createdAt: since as any },
    });

    return {
      range,
      totalDevices: devices.length,
      totalScenes: scenes.length,
      totalSceneExecutions,
      totalBehaviorLogs: behaviorLogs,
      deviceUsage,
      byCategory,
    };
  }

  async getDeviceAnalytics(deviceId: string, homeId: string, range: '24h' | '7d' | '30d' = '7d') {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId, homeId } });
    if (!device) throw new Error('设备不存在');

    const ranges: Record<string, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    const bucket = range === '24h' ? '1 hour' : '1 day';
    const since = new Date(Date.now() - ranges[range]);

    const telemetryTrend = await this.telemetryRepo
      .createQueryBuilder('t')
      .select([
        `time_bucket('${bucket}', t.timestamp) as bucket`,
        'AVG(t.temperature) as avg_temp',
        'AVG(t.humidity) as avg_humidity',
        'AVG(t.powerConsumption) as avg_power',
        'AVG(t.battery) as avg_battery',
        'AVG(t.signalStrength) as avg_signal',
        'COUNT(*) as samples',
      ])
      .where('t.deviceId = :deviceId', { deviceId })
      .andWhere('t.timestamp >= :since', { since })
      .groupBy('bucket')
      .orderBy('bucket', 'ASC')
      .getRawMany();

    return {
      deviceId,
      deviceName: device.name,
      range,
      telemetryTrend,
      properties: device.properties,
    };
  }

  async getSceneUsageInsights(homeId: string) {
    const scenes = await this.sceneRepo.find({
      where: { homeId },
      order: { executionCount: 'DESC' },
    });

    const topScenes = scenes.slice(0, 5).map(s => ({
      id: s.id,
      name: s.name,
      executionCount: s.executionCount,
      lastExecutedAt: s.lastExecutedAt,
      status: s.status,
    }));

    const leastUsed = [...scenes]
      .sort((a, b) => a.executionCount - b.executionCount)
      .slice(0, 3)
      .filter(s => s.executionCount > 0);

    const avgExecutions = scenes.length > 0
      ? scenes.reduce((acc, s) => acc + s.executionCount, 0) / scenes.length
      : 0;

    return {
      totalScenes: scenes.length,
      avgExecutions: avgExecutions.toFixed(1),
      topScenes,
      leastUsed,
      learningEnabled: scenes.filter(s => s.autoLearning).length,
    };
  }

  async logBehavior(userId: string, action: string, context?: {
    homeId?: string;
    deviceId?: string;
    sceneId?: string;
    extra?: Record<string, any>;
  }) {
    try {
      const log = this.behaviorRepo.create({
        userId,
        action,
        homeId: context?.homeId,
        deviceId: context?.deviceId,
        sceneId: context?.sceneId,
        context: context?.extra,
      });
      await this.behaviorRepo.save(log);
    } catch (err) {
      this.logger.error('Failed to log behavior:', err);
    }
  }

  async exportUserData(homeId: string) {
    const devices = await this.deviceRepo.find({ where: { homeId } });
    const deviceIds = devices.map(d => d.id);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const telemetry = await this.telemetryRepo
      .createQueryBuilder('t')
      .where('t.deviceId IN (:...ids)', { ids: deviceIds })
      .andWhere('t.timestamp >= :weekAgo', { weekAgo })
      .orderBy('t.timestamp', 'DESC')
      .limit(10000)
      .getMany();

    const behavior = await this.behaviorRepo
      .createQueryBuilder('b')
      .where('b.homeId = :homeId', { homeId })
      .andWhere('b.createdAt >= :weekAgo', { weekAgo })
      .orderBy('b.createdAt', 'DESC')
      .limit(10000)
      .getMany();

    return {
      generatedAt: new Date(),
      period: '最近7天',
      devices,
      telemetryRecords: telemetry.length,
      behaviorRecords: behavior.length,
      data: { devices, telemetry, behavior },
    };
  }
}
