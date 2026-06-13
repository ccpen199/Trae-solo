import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertEntity } from '../../database/entities/alert.entity';
import { HomeEntity } from '../../database/entities/home.entity';
import { AlertType, AlertSeverity, AlertStatus, NotificationChannel } from '@iot/shared';
import { NotificationService } from './notification.service';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    @InjectRepository(AlertEntity) private readonly alertRepo: Repository<AlertEntity>,
    @InjectRepository(HomeEntity) private readonly homeRepo: Repository<HomeEntity>,
    private readonly notificationService: NotificationService,
  ) {}

  async createAlert(dto: {
    type: AlertType;
    severity: AlertSeverity;
    deviceId?: string;
    homeId: string;
    vendorId?: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    channels?: NotificationChannel[];
  }) {
    const alert = this.alertRepo.create({
      ...dto,
      channels: dto.channels || [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      status: AlertStatus.OPEN,
      notifications: [],
    });
    const saved = await this.alertRepo.save(alert);

    try {
      const sendResults = await this.notificationService.dispatchNotification(saved);
      saved.notifications = sendResults;
      await this.alertRepo.save(saved);
    } catch (err: any) {
      this.logger.error(`Failed to dispatch alert ${saved.id}: ${err.message}`);
    }

    this.logger.log(`Alert created: ${saved.id} [${saved.type}/${saved.severity}] ${saved.title}`);
    return saved;
  }

  async getAlerts(
    homeId?: string,
    filters?: {
      deviceId?: string;
      type?: AlertType;
      severity?: AlertSeverity;
      status?: AlertStatus;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      pageSize?: number;
    },
  ) {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;

    const qb = this.alertRepo.createQueryBuilder('a');

    if (homeId) qb.andWhere('a.homeId = :homeId', { homeId });
    if (filters?.deviceId) qb.andWhere('a.deviceId = :deviceId', { deviceId: filters.deviceId });
    if (filters?.type) qb.andWhere('a.type = :type', { type: filters.type });
    if (filters?.severity) qb.andWhere('a.severity = :severity', { severity: filters.severity });
    if (filters?.status) qb.andWhere('a.status = :status', { status: filters.status });
    if (filters?.startDate) qb.andWhere('a.createdAt >= :start', { start: filters.startDate });
    if (filters?.endDate) qb.andWhere('a.createdAt <= :end', { end: filters.endDate });

    const [items, total] = await qb
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total, page, pageSize };
  }

  async getAlertStats(homeId?: string, since?: Date) {
    const qb = this.alertRepo.createQueryBuilder('a');

    if (homeId) qb.andWhere('a.homeId = :homeId', { homeId });
    if (since) qb.andWhere('a.createdAt >= :since', { since });

    return qb
      .select([
        'a.type',
        'a.severity',
        'a.status',
        'COUNT(*) as count',
      ])
      .groupBy('a.type, a.severity, a.status')
      .getRawMany();
  }

  async acknowledge(alertId: string, userId: string) {
    const alert = await this.alertRepo.findOne({ where: { id: alertId } });
    if (!alert) throw new NotFoundException('告警不存在');
    await this.checkAccess(alert, userId);

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedAt = new Date();
    return this.alertRepo.save(alert);
  }

  async resolve(alertId: string, userId: string, resolutionNote?: string) {
    const alert = await this.alertRepo.findOne({ where: { id: alertId } });
    if (!alert) throw new NotFoundException('告警不存在');
    await this.checkAccess(alert, userId);

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = new Date();
    alert.resolvedBy = userId;
    if (resolutionNote) {
      alert.data = { ...(alert.data || {}), resolutionNote };
    }
    return this.alertRepo.save(alert);
  }

  async ignore(alertId: string, userId: string) {
    const alert = await this.alertRepo.findOne({ where: { id: alertId } });
    if (!alert) throw new NotFoundException('告警不存在');
    await this.checkAccess(alert, userId);

    alert.status = AlertStatus.IGNORED;
    return this.alertRepo.save(alert);
  }

  async bulkResolve(alertIds: string[], userId: string) {
    const results: any[] = [];
    for (const id of alertIds) {
      try {
        const alert = await this.resolve(id, userId);
        results.push({ id, success: true });
      } catch (err: any) {
        results.push({ id, success: false, error: err.message });
      }
    }
    return { results, resolved: results.filter(r => r.success).length };
  }

  private async checkAccess(alert: AlertEntity, userId: string) {
    const home = await this.homeRepo.findOne({ where: { id: alert.homeId } });
    if (!home) return;
    if (home.ownerId === userId) return;
    if (home.members.some(m => m.userId === userId)) return;
    throw new ForbiddenException('您无权操作该告警');
  }
}
