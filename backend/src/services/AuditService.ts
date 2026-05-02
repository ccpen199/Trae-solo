import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import {
  AuditLog,
  AuditAction,
  AuditLevel,
  User,
  MasterWaybill,
} from '../entities';

export interface AuditContext {
  operator: User;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityNo?: string;
  description?: string;
  originalValue?: any;
  newValue?: any;
  changedFields?: string[];
  relatedEntityType?: string;
  relatedEntityId?: string;
  ip?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
}

export class AuditService {
  private auditRepo: Repository<AuditLog>;

  private static readonly ACTION_DISPLAY_MAP: Record<AuditAction, string> = {
    [AuditAction.CREATE]: '创建',
    [AuditAction.UPDATE]: '更新',
    [AuditAction.DELETE]: '删除',
    [AuditAction.LOGIN]: '登录',
    [AuditAction.LOGOUT]: '登出',
    [AuditAction.APPROVE]: '审批通过',
    [AuditAction.REJECT]: '驳回',
    [AuditAction.CANCEL]: '取消',
    [AuditAction.LOCK]: '锁定',
    [AuditAction.UNLOCK]: '解锁',
    [AuditAction.EXPORT]: '导出',
    [AuditAction.IMPORT]: '导入',
    [AuditAction.ARCHIVE]: '归档',
    [AuditAction.UNARCHIVE]: '取消归档',
    [AuditAction.CORRECT]: '冲正',
    [AuditAction.REOPEN]: '重开',
    [AuditAction.REASSIGN]: '转派',
  };

  private static readonly LEVEL_DISPLAY_MAP: Record<AuditLevel, string> = {
    [AuditLevel.LOW]: '低',
    [AuditLevel.MEDIUM]: '中',
    [AuditLevel.HIGH]: '高',
    [AuditLevel.CRITICAL]: '关键',
  };

  constructor() {
    this.auditRepo = AppDataSource.getRepository(AuditLog);
  }

  async log(context: AuditContext, level: AuditLevel = AuditLevel.MEDIUM): Promise<AuditLog> {
    const auditLog = new AuditLog();
    auditLog.action = context.action;
    auditLog.actionDisplay = AuditService.getActionDisplay(context.action);
    auditLog.level = level;
    auditLog.entityType = context.entityType;
    auditLog.entityId = context.entityId;

    if (context.entityNo) {
      auditLog.entityNo = context.entityNo;
    }

    auditLog.operatorId = context.operator.id;
    auditLog.operatorName = context.operator.name;
    auditLog.operatorRole = context.operator.role;

    if (context.ip) {
      auditLog.operatorIp = context.ip;
    }
    if (context.userAgent) {
      auditLog.operatorUserAgent = context.userAgent;
    }
    if (context.requestMethod) {
      auditLog.requestMethod = context.requestMethod;
    }
    if (context.requestPath) {
      auditLog.requestPath = context.requestPath;
    }

    if (context.description) {
      auditLog.description = context.description;
    }

    if (context.originalValue !== undefined) {
      auditLog.originalValue = JSON.stringify(context.originalValue);
    }
    if (context.newValue !== undefined) {
      auditLog.newValue = JSON.stringify(context.newValue);
    }
    if (context.changedFields && context.changedFields.length > 0) {
      auditLog.changedFields = JSON.stringify(context.changedFields);
    }

    if (context.relatedEntityType) {
      auditLog.relatedEntityType = context.relatedEntityType;
    }
    if (context.relatedEntityId) {
      auditLog.relatedEntityId = context.relatedEntityId;
    }

    auditLog.isRead = false;

    return this.auditRepo.save(auditLog);
  }

  async logWaybillAction(
    operator: User,
    waybill: MasterWaybill,
    action: AuditAction,
    description?: string,
    originalValue?: any,
    newValue?: any,
    changedFields?: string[],
    ip?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    const level = this.getActionLevel(action);

    return this.log(
      {
        operator,
        action,
        entityType: 'MasterWaybill',
        entityId: waybill.id,
        entityNo: waybill.masterNo,
        description,
        originalValue,
        newValue,
        changedFields,
        ip,
        userAgent,
      },
      level
    );
  }

  async logCreate(operator: User, entityType: string, entityId: string, entityNo?: string, description?: string): Promise<AuditLog> {
    return this.log(
      {
        operator,
        action: AuditAction.CREATE,
        entityType,
        entityId,
        entityNo,
        description,
      },
      AuditLevel.MEDIUM
    );
  }

  async logUpdate(
    operator: User,
    entityType: string,
    entityId: string,
    originalValue: any,
    newValue: any,
    changedFields: string[],
    entityNo?: string,
    description?: string
  ): Promise<AuditLog> {
    return this.log(
      {
        operator,
        action: AuditAction.UPDATE,
        entityType,
        entityId,
        entityNo,
        description,
        originalValue,
        newValue,
        changedFields,
      },
      AuditLevel.MEDIUM
    );
  }

  async logDelete(operator: User, entityType: string, entityId: string, entityNo?: string, description?: string): Promise<AuditLog> {
    return this.log(
      {
        operator,
        action: AuditAction.DELETE,
        entityType,
        entityId,
        entityNo,
        description,
      },
      AuditLevel.HIGH
    );
  }

  async logLogin(operator: User, ip?: string, userAgent?: string): Promise<AuditLog> {
    return this.log(
      {
        operator,
        action: AuditAction.LOGIN,
        entityType: 'User',
        entityId: operator.id,
        entityNo: operator.username,
        description: '用户登录',
        ip,
        userAgent,
      },
      AuditLevel.LOW
    );
  }

  async logLogout(operator: User, ip?: string): Promise<AuditLog> {
    return this.log(
      {
        operator,
        action: AuditAction.LOGOUT,
        entityType: 'User',
        entityId: operator.id,
        entityNo: operator.username,
        description: '用户登出',
        ip,
      },
      AuditLevel.LOW
    );
  }

  async logArchive(operator: User, entityType: string, entityId: string, entityNo?: string): Promise<AuditLog> {
    return this.log(
      {
        operator,
        action: AuditAction.ARCHIVE,
        entityType,
        entityId,
        entityNo,
        description: '数据归档',
      },
      AuditLevel.HIGH
    );
  }

  async logCorrection(
    operator: User,
    entityType: string,
    entityId: string,
    originalValue: any,
    newValue: any,
    reason: string,
    entityNo?: string
  ): Promise<AuditLog> {
    return this.log(
      {
        operator,
        action: AuditAction.CORRECT,
        entityType,
        entityId,
        entityNo,
        description: `冲正操作: ${reason}`,
        originalValue,
        newValue,
      },
      AuditLevel.CRITICAL
    );
  }

  async logReopen(
    operator: User,
    entityType: string,
    entityId: string,
    reason: string,
    entityNo?: string
  ): Promise<AuditLog> {
    return this.log(
      {
        operator,
        action: AuditAction.REOPEN,
        entityType,
        entityId,
        entityNo,
        description: `重开操作: ${reason}`,
      },
      AuditLevel.HIGH
    );
  }

  private getActionLevel(action: AuditAction): AuditLevel {
    const highRiskActions: AuditAction[] = [
      AuditAction.DELETE,
      AuditAction.ARCHIVE,
      AuditAction.CORRECT,
      AuditAction.REOPEN,
      AuditAction.CANCEL,
    ];

    const mediumRiskActions: AuditAction[] = [
      AuditAction.UPDATE,
      AuditAction.APPROVE,
      AuditAction.REJECT,
      AuditAction.LOCK,
      AuditAction.UNLOCK,
      AuditAction.EXPORT,
      AuditAction.IMPORT,
      AuditAction.REASSIGN,
    ];

    if (highRiskActions.includes(action)) {
      return AuditLevel.HIGH;
    }
    if (mediumRiskActions.includes(action)) {
      return AuditLevel.MEDIUM;
    }
    return AuditLevel.LOW;
  }

  static getActionDisplay(action: AuditAction): string {
    return this.ACTION_DISPLAY_MAP[action] || action;
  }

  static getLevelDisplay(level: AuditLevel): string {
    return this.LEVEL_DISPLAY_MAP[level] || level;
  }

  async getAuditLogs(
    options?: Partial<{
      operatorId: string;
      entityType: string;
      entityId: string;
      action: AuditAction;
      level: AuditLevel;
      fromDate: Date;
      toDate: Date;
      page: number;
      pageSize: number;
    }>
  ): Promise<{ items: AuditLog[]; total: number }> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: Record<string, any> = {};

    if (options?.operatorId) {
      where.operatorId = options.operatorId;
    }
    if (options?.entityType) {
      where.entityType = options.entityType;
    }
    if (options?.entityId) {
      where.entityId = options.entityId;
    }
    if (options?.action) {
      where.action = options.action;
    }
    if (options?.level) {
      where.level = options.level;
    }

    const queryBuilder = this.auditRepo.createQueryBuilder('audit');

    if (Object.keys(where).length > 0) {
      queryBuilder.where(where);
    }

    if (options?.fromDate) {
      queryBuilder.andWhere('audit.createdAt >= :fromDate', { fromDate: options.fromDate });
    }
    if (options?.toDate) {
      queryBuilder.andWhere('audit.createdAt <= :toDate', { toDate: options.toDate });
    }

    queryBuilder
      .orderBy('audit.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total };
  }

  async getWaybillAuditLogs(waybillId: string): Promise<AuditLog[]> {
    return this.auditRepo.find({
      where: { entityType: 'MasterWaybill', entityId: waybillId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(auditLogId: string, userId: string): Promise<AuditLog | null> {
    const auditLog = await this.auditRepo.findOneBy({ id: auditLogId });
    if (!auditLog) {
      return null;
    }

    auditLog.isRead = true;
    auditLog.readBy = userId;
    auditLog.readAt = new Date();

    return this.auditRepo.save(auditLog);
  }
}
