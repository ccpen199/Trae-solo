import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  AuditLog,
  AuditAction,
  AuditResourceType,
  AuditResult,
} from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async logCreate(
    resourceType: AuditResourceType,
    resourceId: string,
    resourceName: string,
    newValue: Record<string, any>,
    operatorId?: string,
    operatorName?: string,
    clientIp?: string,
  ): Promise<AuditLog> {
    return this.createAuditLog({
      action: AuditAction.CREATE,
      resourceType,
      resourceId,
      resourceName,
      result: AuditResult.SUCCESS,
      operatorId,
      operatorName,
      clientIp,
      newValue,
      description: `创建${this.getResourceTypeName(resourceType)}: ${resourceName}`,
    });
  }

  async logUpdate(
    resourceType: AuditResourceType,
    resourceId: string,
    resourceName: string,
    oldValue: Record<string, any>,
    newValue: Record<string, any>,
    operatorId?: string,
    operatorName?: string,
    clientIp?: string,
  ): Promise<AuditLog> {
    const changes = this.detectChanges(oldValue, newValue);

    return this.createAuditLog({
      action: AuditAction.UPDATE,
      resourceType,
      resourceId,
      resourceName,
      result: AuditResult.SUCCESS,
      operatorId,
      operatorName,
      clientIp,
      oldValue,
      newValue,
      changes,
      description: `更新${this.getResourceTypeName(resourceType)}: ${resourceName}`,
    });
  }

  async logDelete(
    resourceType: AuditResourceType,
    resourceId: string,
    resourceName: string,
    oldValue: Record<string, any>,
    operatorId?: string,
    operatorName?: string,
    clientIp?: string,
  ): Promise<AuditLog> {
    return this.createAuditLog({
      action: AuditAction.DELETE,
      resourceType,
      resourceId,
      resourceName,
      result: AuditResult.SUCCESS,
      operatorId,
      operatorName,
      clientIp,
      oldValue,
      description: `删除${this.getResourceTypeName(resourceType)}: ${resourceName}`,
    });
  }

  async logExecute(
    resourceType: AuditResourceType,
    resourceId: string,
    resourceName: string,
    operation: string,
    details: Record<string, any>,
    operatorId?: string,
    operatorName?: string,
    clientIp?: string,
    relatedAlarmId?: string,
    relatedCommandId?: string,
    relatedRecordId?: string,
  ): Promise<AuditLog> {
    return this.createAuditLog({
      action: AuditAction.EXECUTE,
      resourceType,
      resourceId,
      resourceName,
      result: AuditResult.SUCCESS,
      operatorId,
      operatorName,
      clientIp,
      newValue: details,
      relatedAlarmId,
      relatedCommandId,
      relatedRecordId,
      description: `执行${operation}操作: ${resourceName}`,
    });
  }

  async logFailure(
    action: AuditAction,
    resourceType: AuditResourceType,
    resourceId: string,
    resourceName: string,
    errorMessage: string,
    operatorId?: string,
    operatorName?: string,
    clientIp?: string,
  ): Promise<AuditLog> {
    return this.createAuditLog({
      action,
      resourceType,
      resourceId,
      resourceName,
      result: AuditResult.FAILURE,
      operatorId,
      operatorName,
      clientIp,
      errorMessage,
      description: `${this.getActionName(action)}${this.getResourceTypeName(resourceType)}失败: ${resourceName}`,
    });
  }

  private async createAuditLog(data: Partial<AuditLog>): Promise<AuditLog> {
    const log = this.auditLogRepository.create({
      ...data,
      actionedAt: new Date(),
    });

    const savedLog = await this.auditLogRepository.save(log);
    this.logger.log(`Audit log created: ${savedLog.action} ${savedLog.resourceType} ${savedLog.resourceId}`);
    return savedLog;
  }

  private detectChanges(
    oldValue: Record<string, any>,
    newValue: Record<string, any>,
  ): AuditLog['changes'] {
    if (!oldValue || !newValue) return [];

    const changes: AuditLog['changes'] = [];
    const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);

    for (const key of allKeys) {
      if (key === 'createdAt' || key === 'updatedAt' || key === 'isDeleted') {
        continue;
      }

      const oldVal = oldValue[key];
      const newVal = newValue[key];

      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({
          field: key,
          oldValue: oldVal,
          newValue: newVal,
        });
      }
    }

    return changes;
  }

  private getResourceTypeName(resourceType: AuditResourceType): string {
    const names: Record<AuditResourceType, string> = {
      [AuditResourceType.CROP]: '作物',
      [AuditResourceType.GROWTH_STAGE]: '生长期',
      [AuditResourceType.THRESHOLD]: '阈值',
      [AuditResourceType.SENSOR]: '传感器',
      [AuditResourceType.SENSOR_READING]: '传感器读数',
      [AuditResourceType.ALARM]: '告警',
      [AuditResourceType.CONTROL_DEVICE]: '控制设备',
      [AuditResourceType.CONTROL_COMMAND]: '控制指令',
      [AuditResourceType.FARMING_RECORD]: '农事记录',
      [AuditResourceType.HIGH_YIELD_ANALYSIS]: '高产分析',
      [AuditResourceType.STANDARDIZED_MODEL]: '标准化模型',
      [AuditResourceType.USER]: '用户',
      [AuditResourceType.SETTINGS]: '设置',
    };
    return names[resourceType] || resourceType;
  }

  private getActionName(action: AuditAction): string {
    const names: Record<AuditAction, string> = {
      [AuditAction.CREATE]: '创建',
      [AuditAction.READ]: '读取',
      [AuditAction.UPDATE]: '更新',
      [AuditAction.DELETE]: '删除',
      [AuditAction.EXECUTE]: '执行',
      [AuditAction.LOGIN]: '登录',
      [AuditAction.LOGOUT]: '登出',
    };
    return names[action] || action;
  }

  async getLogsByResource(
    resourceType: AuditResourceType,
    resourceId: string,
    limit: number = 50,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        resourceType,
        resourceId,
        isDeleted: false,
      },
      order: { actionedAt: 'DESC' },
      take: limit,
    });
  }

  async getLogsInRange(
    startTime: Date,
    endTime: Date,
    resourceType?: AuditResourceType,
    action?: AuditAction,
    operatorId?: string,
    limit: number = 100,
  ): Promise<AuditLog[]> {
    const where: any = {
      actionedAt: Between(startTime, endTime),
      isDeleted: false,
    };

    if (resourceType) {
      where.resourceType = resourceType;
    }
    if (action) {
      where.action = action;
    }
    if (operatorId) {
      where.operatorId = operatorId;
    }

    return this.auditLogRepository.find({
      where,
      order: { actionedAt: 'DESC' },
      take: limit,
    });
  }

  async getLogsByRelatedAlarm(alarmId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        relatedAlarmId: alarmId,
        isDeleted: false,
      },
      order: { actionedAt: 'ASC' },
    });
  }

  async getLogsByRelatedCommand(commandId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        relatedCommandId: commandId,
        isDeleted: false,
      },
      order: { actionedAt: 'ASC' },
    });
  }

  async getLogsByRelatedRecord(recordId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: {
        relatedRecordId: recordId,
        isDeleted: false,
      },
      order: { actionedAt: 'ASC' },
    });
  }

  async getLogById(id: string): Promise<AuditLog> {
    return this.auditLogRepository.findOne({
      where: { id, isDeleted: false },
    });
  }

  async getOperatorStatistics(
    startTime: Date,
    endTime: Date,
  ): Promise<{
    operatorId: string;
    operatorName: string;
    actionCount: number;
    successCount: number;
    failureCount: number;
  }[]> {
    const logs = await this.getLogsInRange(startTime, endTime);

    const stats: Record<string, any> = {};

    for (const log of logs) {
      if (!log.operatorId) continue;

      const key = log.operatorId;
      if (!stats[key]) {
        stats[key] = {
          operatorId: log.operatorId,
          operatorName: log.operatorName || '未知',
          actionCount: 0,
          successCount: 0,
          failureCount: 0,
        };
      }

      stats[key].actionCount++;
      if (log.result === AuditResult.SUCCESS) {
        stats[key].successCount++;
      } else {
        stats[key].failureCount++;
      }
    }

    return Object.values(stats).sort((a, b) => b.actionCount - a.actionCount);
  }

  async getResourceStatistics(
    startTime: Date,
    endTime: Date,
  ): Promise<{
    resourceType: AuditResourceType;
    createCount: number;
    updateCount: number;
    deleteCount: number;
    executeCount: number;
  }[]> {
    const logs = await this.getLogsInRange(startTime, endTime);

    const stats: Record<string, any> = {};

    for (const log of logs) {
      const key = log.resourceType;
      if (!stats[key]) {
        stats[key] = {
          resourceType: log.resourceType,
          createCount: 0,
          updateCount: 0,
          deleteCount: 0,
          executeCount: 0,
        };
      }

      switch (log.action) {
        case AuditAction.CREATE:
          stats[key].createCount++;
          break;
        case AuditAction.UPDATE:
          stats[key].updateCount++;
          break;
        case AuditAction.DELETE:
          stats[key].deleteCount++;
          break;
        case AuditAction.EXECUTE:
          stats[key].executeCount++;
          break;
      }
    }

    return Object.values(stats);
  }
}
