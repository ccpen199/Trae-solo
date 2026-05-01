import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../database/dataSource';
import { AuditLogEntity, UserEntity } from '../entities';
import { AuditAction, UserRole, AuditLog } from '../types';

export interface LogOptions {
  action: AuditAction;
  userId: string;
  userRole: UserRole;
  resourceType: 'coupon' | 'budget' | 'order' | 'user' | 'system';
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
}

export class AuditService {
  private static instance: AuditService;

  private constructor() {}

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  async log(options: LogOptions): Promise<AuditLog> {
    const auditRepository = AppDataSource.getRepository(AuditLogEntity);
    
    const traceId = options.traceId || uuidv4();
    
    const auditLog = auditRepository.create({
      id: uuidv4(),
      action: options.action,
      userId: options.userId,
      userRole: options.userRole,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      details: options.details,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      traceId
    });
    
    await auditRepository.save(auditLog);
    
    return auditLog as unknown as AuditLog;
  }

  async getAuditLogs(filters: {
    userId?: string;
    action?: AuditAction;
    resourceType?: string;
    resourceId?: string;
    traceId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const auditRepository = AppDataSource.getRepository(AuditLogEntity);
    const queryBuilder = auditRepository.createQueryBuilder('audit_log');
    
    if (filters.userId) {
      queryBuilder.andWhere('audit_log.userId = :userId', { userId: filters.userId });
    }
    
    if (filters.action) {
      queryBuilder.andWhere('audit_log.action = :action', { action: filters.action });
    }
    
    if (filters.resourceType) {
      queryBuilder.andWhere('audit_log.resourceType = :resourceType', { resourceType: filters.resourceType });
    }
    
    if (filters.resourceId) {
      queryBuilder.andWhere('audit_log.resourceId = :resourceId', { resourceId: filters.resourceId });
    }
    
    if (filters.traceId) {
      queryBuilder.andWhere('audit_log.traceId = :traceId', { traceId: filters.traceId });
    }
    
    if (filters.startDate) {
      queryBuilder.andWhere('audit_log.createdAt >= :startDate', { startDate: filters.startDate });
    }
    
    if (filters.endDate) {
      queryBuilder.andWhere('audit_log.createdAt <= :endDate', { endDate: filters.endDate });
    }
    
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    
    const [logs, total] = await queryBuilder
      .orderBy('audit_log.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    
    return {
      logs: logs as unknown as AuditLog[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getCouponAuditTrail(couponId: string): Promise<AuditLog[]> {
    const auditRepository = AppDataSource.getRepository(AuditLogEntity);
    
    const logs = await auditRepository.find({
      where: {
        resourceType: 'coupon',
        resourceId: couponId
      },
      order: { createdAt: 'ASC' }
    });
    
    return logs as unknown as AuditLog[];
  }

  async getTraceLogs(traceId: string): Promise<AuditLog[]> {
    const auditRepository = AppDataSource.getRepository(AuditLogEntity);
    
    const logs = await auditRepository.find({
      where: { traceId },
      order: { createdAt: 'ASC' }
    });
    
    return logs as unknown as AuditLog[];
  }

  async exportAuditReport(filters: {
    startDate?: Date;
    endDate?: Date;
    resourceType?: string;
    action?: AuditAction;
  }): Promise<{
    data: AuditLog[];
    summary: {
      totalRecords: number;
      byAction: Record<string, number>;
      byResourceType: Record<string, number>;
      byRole: Record<string, number>;
    };
  }> {
    const auditRepository = AppDataSource.getRepository(AuditLogEntity);
    const queryBuilder = auditRepository.createQueryBuilder('audit_log');
    
    if (filters.startDate) {
      queryBuilder.andWhere('audit_log.createdAt >= :startDate', { startDate: filters.startDate });
    }
    
    if (filters.endDate) {
      queryBuilder.andWhere('audit_log.createdAt <= :endDate', { endDate: filters.endDate });
    }
    
    if (filters.resourceType) {
      queryBuilder.andWhere('audit_log.resourceType = :resourceType', { resourceType: filters.resourceType });
    }
    
    if (filters.action) {
      queryBuilder.andWhere('audit_log.action = :action', { action: filters.action });
    }
    
    const logs = await queryBuilder
      .orderBy('audit_log.createdAt', 'DESC')
      .getMany();
    
    const summary = {
      totalRecords: logs.length,
      byAction: {} as Record<string, number>,
      byResourceType: {} as Record<string, number>,
      byRole: {} as Record<string, number>
    };
    
    for (const log of logs) {
      summary.byAction[log.action] = (summary.byAction[log.action] || 0) + 1;
      summary.byResourceType[log.resourceType] = (summary.byResourceType[log.resourceType] || 0) + 1;
      summary.byRole[log.userRole] = (summary.byRole[log.userRole] || 0) + 1;
    }
    
    return {
      data: logs as unknown as AuditLog[],
      summary
    };
  }

  async getUserActivity(userId: string, days: number = 30): Promise<{
    totalActions: number;
    recentActions: AuditLog[];
    actionBreakdown: Record<string, number>;
  }> {
    const auditRepository = AppDataSource.getRepository(AuditLogEntity);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const logs = await auditRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
    
    const filteredLogs = logs.filter(log => log.createdAt >= since);
    
    const actionBreakdown: Record<string, number> = {};
    for (const log of filteredLogs) {
      actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1;
    }
    
    return {
      totalActions: filteredLogs.length,
      recentActions: filteredLogs.slice(0, 50) as unknown as AuditLog[],
      actionBreakdown
    };
  }
}

export const auditService = AuditService.getInstance();
