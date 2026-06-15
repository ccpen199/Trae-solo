import {
  Injectable,
  NestMiddleware,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import {
  AUDIT_LOG_KEY,
  AuditLogOption,
} from '../decorators/audit-log.decorator';
import { BaseEntity } from '../entities/base.entity';

export interface AuditLogEntity {
  id?: string;
  userId?: string;
  username?: string;
  module?: string;
  action?: string;
  description?: string;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  requestParams?: string;
  responseResult?: string;
  statusCode?: number;
  duration?: number;
  createdAt?: Date;
}

@Entity('audit_logs')
export class AuditLog extends BaseEntity implements AuditLogEntity {
  @Column({ name: 'user_id', type: 'varchar', length: 64, nullable: true })
  userId: string;

  @Column({ name: 'username', type: 'varchar', length: 100, nullable: true })
  username: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  module: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  action: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  method: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent: string;

  @Column({ name: 'request_params', type: 'text', nullable: true })
  requestParams: string;

  @Column({ name: 'response_result', type: 'text', nullable: true })
  responseResult: string;

  @Column({ name: 'status_code', type: 'int', nullable: true })
  statusCode: number;

  @Column({ type: 'int', nullable: true })
  duration: number;
}

@Injectable()
export class AuditLogMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuditLogMiddleware.name);

  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const auditOption = this.getAuditLogOption(req);

    if (!auditOption) {
      next();
      return;
    }

    const originalJson = res.json.bind(res);

    res.json = ((body: unknown): Response => {
      const duration = Date.now() - startTime;
      this.saveAuditLog(req, res, body, auditOption, duration).catch((err) => {
        this.logger.error(`保存审计日志失败: ${(err as Error).message}`);
      });
      return originalJson(body);
    }) as Response['json'];

    next();
  }

  private getAuditLogOption(req: Request): AuditLogOption | undefined {
    const handler = this.extractHandler(req);
    if (!handler) {
      return undefined;
    }
    return this.reflector.get<AuditLogOption>(AUDIT_LOG_KEY, handler);
  }

  private extractHandler(req: Request): CallableFunction | undefined {
    const typedReq = req as {
      route?: { stack?: Array<{ handle?: CallableFunction }> };
    };
    if (typedReq.route?.stack?.length) {
      return typedReq.route.stack.find((layer) => layer.handle)?.handle;
    }
    return undefined;
  }

  private getClientIp(req: Request): string {
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
      const ips = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor.split(',')[0];
      return ips?.trim() || '';
    }
    return req.ip || req.socket.remoteAddress || '';
  }

  private async saveAuditLog(
    req: Request,
    res: Response,
    body: unknown,
    option: AuditLogOption,
    duration: number,
  ): Promise<void> {
    const typedReq = req as {
      user?: { sub?: string; username?: string };
    };
    const user = typedReq.user;

    let requestParams = '';
    if (option.recordRequest) {
      const params = {
        query: req.query,
        body: this.filterSensitiveFields(req.body, option.excludeFields || []),
        params: req.params,
      };
      requestParams = JSON.stringify(params);
    }

    let responseResult = '';
    if (option.recordResponse && body) {
      responseResult = JSON.stringify(
        this.filterSensitiveFields(body, option.excludeFields || []),
      );
    }

    const auditLog = this.auditLogRepository.create({
      userId: user?.sub,
      username: user?.username,
      module: option.module,
      action: option.action,
      description: option.description,
      method: req.method,
      url: req.originalUrl || req.url,
      ip: this.getClientIp(req),
      userAgent: req.headers['user-agent'],
      requestParams,
      responseResult,
      statusCode: res.statusCode,
      duration,
    });

    await this.auditLogRepository.save(auditLog);
    await this.cleanupExpiredLogs();
  }

  private filterSensitiveFields(
    data: unknown,
    excludeFields: string[],
  ): unknown {
    if (!data || typeof data !== 'object') {
      return data;
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.filterSensitiveFields(item, excludeFields));
    }
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (excludeFields.includes(key)) {
        result[key] = '***';
      } else if (value && typeof value === 'object') {
        result[key] = this.filterSensitiveFields(value, excludeFields);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private async cleanupExpiredLogs(): Promise<void> {
    const retentionDays = parseInt(
      process.env.AUDIT_LOG_RETENTION_DAYS || '90',
      10,
    );
    const cutoffDate = dayjs().subtract(retentionDays, 'day').toDate();

    await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .execute()
      .catch((err) => {
        this.logger.warn(`清理过期审计日志失败: ${(err as Error).message}`);
      });
  }
}
