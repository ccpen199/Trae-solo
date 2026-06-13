import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DeviceEntity } from '../../database/entities/device.entity';
import { TelemetryEntity, UserBehaviorLogEntity } from '../../database/entities/telemetry.entity';
import { HomeEntity } from '../../database/entities/home.entity';
import { VendorEntity } from '../../database/entities/vendor.entity';
import { AlertEntity } from '../../database/entities/alert.entity';
import { AlertType, AlertSeverity, AlertStatus, NotificationChannel } from '@iot/shared';
import { DeviceStatus, DeviceCategory } from '@iot/shared';
import { CacheService } from '../redis/cache.service';
import { AlertService } from './alert.service';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    @InjectRepository(DeviceEntity) private readonly deviceRepo: Repository<DeviceEntity>,
    @InjectRepository(TelemetryEntity) private readonly telemetryRepo: Repository<TelemetryEntity>,
    @InjectRepository(HomeEntity) private readonly homeRepo: Repository<HomeEntity>,
    @InjectRepository(VendorEntity) private readonly vendorRepo: Repository<VendorEntity>,
    @InjectRepository(UserBehaviorLogEntity) private readonly behaviorRepo: Repository<UserBehaviorLogEntity>,
    private readonly cache: CacheService,
    private readonly alertService: AlertService,
  ) {}

  async getHomeDashboard(homeId: string) {
    const home = await this.homeRepo.findOne({ where: { id: homeId } });
    if (!home) throw new NotFoundException('家庭不存在');

    const devices = await this.deviceRepo.find({ where: { homeId } });
    const totalDevices = devices.length;
    const onlineDevices = devices.filter(d => d.status === DeviceStatus.ONLINE).length;
    const offlineDevices = totalDevices - onlineDevices;
    const onlineRate = totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 0;

    const lowBatteryDevices = devices.filter(d => {
      const battery = d.properties?.battery;
      return typeof battery === 'number' && battery <= 15;
    });

    const byCategory = devices.reduce((acc, d) => {
      acc[d.category] = (acc[d.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const openAlerts = await this.alertService.getAlerts(homeId, { status: AlertStatus.OPEN });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayPowerConsumption = await this.telemetryRepo
      .createQueryBuilder('t')
      .select('SUM(t.powerConsumption)', 'total')
      .where('t.deviceId IN (SELECT id FROM devices WHERE "homeId" = :homeId)', { homeId })
      .andWhere('t.timestamp >= :start', { start: todayStart })
      .getRawOne();

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weeklyTrend = await this.telemetryRepo
      .createQueryBuilder('t')
      .select([
        `DATE_TRUNC('day', t.timestamp) as day`,
        'AVG(t.powerConsumption) as avg_power',
        'SUM(t.powerConsumption) as total_power',
        'COUNT(DISTINCT t.deviceId) as active_devices',
      ])
      .where('t.deviceId IN (SELECT id FROM devices WHERE "homeId" = :homeId)', { homeId })
      .andWhere('t.timestamp >= :start', { start: weekStart })
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany();

    return {
      totalDevices,
      onlineDevices,
      offlineDevices,
      onlineRate: onlineRate.toFixed(1),
      lowBatteryCount: lowBatteryDevices.length,
      lowBatteryDevices,
      byCategory,
      openAlerts: openAlerts.total,
      todayPowerConsumption: parseFloat(todayPowerConsumption?.total || '0'),
      weeklyTrend,
    };
  }

  async getAdminDashboard() {
    const totalVendors = await this.vendorRepo.count();
    const activeVendors = await this.vendorRepo.count({ where: { status: 'active' } });
    const totalDevices = await this.deviceRepo.count();
    const onlineDevices = await this.deviceRepo.count({ where: { status: DeviceStatus.ONLINE } });

    const devicesByCategory = await this.deviceRepo
      .createQueryBuilder('d')
      .select('d.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .addSelect(`SUM(CASE WHEN d.status = 'online' THEN 1 ELSE 0 END)`, 'online')
      .groupBy('d.category')
      .getRawMany();

    const devicesByVendor = await this.deviceRepo
      .createQueryBuilder('d')
      .select('v.name', 'vendor')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('d.vendor', 'v')
      .groupBy('v.id, v.name')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const alerts24h = await this.alertService.getAlertStats(null, last24h);
    const powerStats = await this.getGlobalPowerStats(last24h);
    const onlineRateHistory = await this.getOnlineRateHistory();

    return {
      totalVendors,
      activeVendors,
      totalDevices,
      onlineDevices,
      globalOnlineRate: totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 0,
      devicesByCategory,
      devicesByVendor,
      alerts24h,
      powerStats,
      onlineRateHistory,
    };
  }

  async getOnlineRate(homeId?: string, range: '1h' | '24h' | '7d' | '30d' = '24h') {
    const bucketMap: Record<string, string> = {
      '1h': '5 minutes',
      '24h': '1 hour',
      '7d': '1 day',
      '30d': '1 day',
    };
    const ranges: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    const since = new Date(Date.now() - ranges[range]);
    const qb = this.deviceRepo
      .createQueryBuilder('d')
      .select([
        `time_bucket('${bucketMap[range]}', d."lastSeen") as bucket`,
        'COUNT(*)',
        `SUM(CASE WHEN d.status = 'online' THEN 1 ELSE 0 END) as online`,
      ]);

    if (homeId) qb.where('d."homeId" = :homeId', { homeId });
    qb.andWhere('d."lastSeen" >= :since', { since });
    qb.groupBy('bucket').orderBy('bucket', 'ASC');

    return qb.getRawMany();
  }

  @Cron('*/5 * * * *')
  async checkDeviceHeartbeats() {
    this.logger.debug('Running heartbeat check...');
    const threshold = new Date(Date.now() - 5 * 60 * 1000);

    const staleDevices = await this.deviceRepo
      .createQueryBuilder('d')
      .where('d.status = :online', { online: DeviceStatus.ONLINE })
      .andWhere('d."lastSeen" < :threshold', { threshold })
      .getMany();

    for (const device of staleDevices) {
      device.status = DeviceStatus.OFFLINE;
      await this.deviceRepo.save(device);

      await this.alertService.createAlert({
        type: AlertType.DEVICE_OFFLINE,
        severity: AlertSeverity.WARNING,
        deviceId: device.id,
        homeId: device.homeId || 'unknown',
        vendorId: device.vendorId,
        title: `设备离线：${device.name}`,
        message: `设备 ${device.name} 已超过5分钟无心跳，已判定为离线`,
        data: { deviceName: device.name, lastSeen: device.lastSeen },
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      });

      this.logger.warn(`Device marked offline: ${device.id} (${device.name})`);
    }

    await this.cache.set('monitoring:last_heartbeat_check', new Date(), 300);
  }

  @Cron('0 */15 * * * *')
  async checkPowerConsumption() {
    this.logger.debug('Running abnormal power consumption check...');
    const since = new Date(Date.now() - 15 * 60 * 1000);

    const abnormal = await this.telemetryRepo
      .createQueryBuilder('t')
      .select('t.deviceId', 'deviceId')
      .addSelect('AVG(t.powerConsumption)', 'avg_power')
      .addSelect('MAX(t.powerConsumption)', 'max_power')
      .addSelect('d.name', 'name')
      .addSelect('d."homeId"', 'homeId')
      .addSelect('d."vendorId"', 'vendorId')
      .addSelect('d.category', 'category')
      .leftJoin(DeviceEntity, 'd', 'd.id = t.deviceId')
      .where('t.timestamp >= :since', { since })
      .andWhere('t.powerConsumption > 0')
      .groupBy('t.deviceId, d.name, d."homeId", d."vendorId", d.category')
      .having('AVG(t.powerConsumption) > :threshold', { threshold: 5000 })
      .getRawMany();

    for (const record of abnormal) {
      const recent = await this.alertService.getAlerts(record.homeId, {
        deviceId: record.deviceId,
        type: AlertType.HIGH_POWER_CONSUMPTION,
        status: AlertStatus.OPEN,
      });
      if (recent.items.length > 0) continue;

      await this.alertService.createAlert({
        type: AlertType.HIGH_POWER_CONSUMPTION,
        severity: record.max_power > 8000 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
        deviceId: record.deviceId,
        homeId: record.homeId,
        vendorId: record.vendorId,
        title: `异常功耗告警：${record.name}`,
        message: `设备平均功耗 ${record.avg_power?.toFixed?.(0) || record.avg_power}W，峰值 ${record.max_power?.toFixed?.(0) || record.max_power}W，已超过正常范围`,
        data: { avgPower: record.avg_power, maxPower: record.max_power },
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.SMS],
      });
      this.logger.warn(`High power alert: ${record.deviceId} avg=${record.avg_power}W`);
    }
  }

  @Cron('0 * * * * *')
  async checkLowBatteryDevices() {
    this.logger.debug('Running low battery check...');
    const devices = await this.deviceRepo
      .createQueryBuilder('d')
      .where("d.properties->>'battery' IS NOT NULL")
      .andWhere("CAST(d.properties->>'battery' AS FLOAT) <= 10")
      .getMany();

    for (const device of devices) {
      const battery = parseFloat(device.properties.battery);
      const openAlert = await this.alertService.getAlerts(device.homeId, {
        deviceId: device.id,
        type: AlertType.LOW_BATTERY,
        status: AlertStatus.OPEN,
      });
      if (openAlert.items.length > 0) continue;

      await this.alertService.createAlert({
        type: AlertType.LOW_BATTERY,
        severity: battery <= 5 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
        deviceId: device.id,
        homeId: device.homeId || 'unknown',
        vendorId: device.vendorId,
        title: `${device.name} 电量不足`,
        message: `当前电量 ${battery}%，请及时更换电池或充电`,
        data: { battery, deviceName: device.name },
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.SMS],
      });
    }
  }

  async getPowerAnalytics(homeId: string, range: '1h' | '24h' | '7d' | '30d' = '24h') {
    const ranges: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    const since = new Date(Date.now() - ranges[range]);
    const bucket = range === '1h' ? '5 minutes' : range === '24h' ? '30 minutes' : '1 hour';

    const byDevice = await this.telemetryRepo
      .createQueryBuilder('t')
      .select([
        't.deviceId',
        'd.name as device_name',
        'd.category',
        `time_bucket('${bucket}', t.timestamp) as bucket`,
        'AVG(t.powerConsumption) as avg_power',
        'SUM(t.powerConsumption) as total_power',
      ])
      .leftJoin('t.device', 'd')
      .where('d.homeId = :homeId', { homeId })
      .andWhere('t.timestamp >= :since', { since })
      .groupBy('t.deviceId, d.name, d.category, bucket')
      .orderBy('bucket', 'ASC')
      .getRawMany();

    return { byDevice, range };
  }

  private async getGlobalPowerStats(since: Date) {
    return this.telemetryRepo
      .createQueryBuilder('t')
      .select([
        'AVG(t.powerConsumption) as avg_power',
        'SUM(t.powerConsumption) as total_power',
        'MAX(t.powerConsumption) as peak_power',
        'COUNT(DISTINCT t.deviceId) as active_devices',
      ])
      .where('t.timestamp >= :since', { since })
      .getRawOne();
  }

  private async getOnlineRateHistory() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.deviceRepo
      .createQueryBuilder('d')
      .select([
        `time_bucket('1 hour', d."lastSeen") as hour`,
        'COUNT(*) as total',
        `SUM(CASE WHEN d.status = 'online' THEN 1 ELSE 0 END) as online`,
      ])
      .where('d."lastSeen" >= :since', { since })
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany();
  }
}
