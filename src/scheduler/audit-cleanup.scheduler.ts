import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import dayjs from 'dayjs';
import { ConfigService } from '@nestjs/config';
import { AuditLog } from '../common/middleware/audit-log.middleware';
import { CertAccessLog } from '../modules/e-cert/entities/cert-access-log.entity';

@Injectable()
export class AuditCleanupScheduler {
  private readonly logger = new Logger(AuditCleanupScheduler.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(CertAccessLog)
    private readonly certAccessLogRepository: Repository<CertAccessLog>,
  ) {}

  @Cron('0 0 3 * * *', {
    name: 'audit_log_cleanup',
    timeZone: 'Asia/Shanghai',
  })
  async handleCron(): Promise<void> {
    this.logger.log('开始执行审计日志清理任务...');

    const retentionDays = this.configService.get<number>(
      'auditLog.retentionDays',
      90,
    );
    const cutoffDate = dayjs().subtract(retentionDays, 'day').toDate();

    try {
      const auditLogResult = await this.auditLogRepository
        .createQueryBuilder()
        .delete()
        .where('created_at < :cutoffDate', { cutoffDate })
        .execute();
      this.logger.log(
        `清理过期审计日志完成，删除 ${auditLogResult.affected ?? 0} 条记录`,
      );
    } catch (error) {
      this.logger.error(
        `清理审计日志失败: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }

    try {
      const certAccessLogResult = await this.certAccessLogRepository
        .createQueryBuilder()
        .delete()
        .where('access_time < :cutoffDate', { cutoffDate })
        .execute();
      this.logger.log(
        `清理过期证照访问日志完成，删除 ${certAccessLogResult.affected ?? 0} 条记录`,
      );
    } catch (error) {
      this.logger.error(
        `清理证照访问日志失败: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }

    this.logger.log('审计日志清理任务执行完成');
  }
}
