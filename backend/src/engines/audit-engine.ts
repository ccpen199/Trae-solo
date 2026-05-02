import { knex } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLogEntry {
  id: string;
  userId?: string;
  username: string;
  action: string;
  module: string;
  tableName?: string;
  recordId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  createdAt: Date;
}

export interface AuditQueryOptions {
  userId?: string;
  module?: string;
  action?: string;
  tableName?: string;
  recordId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  includeDiff?: boolean;
}

export interface AuditDiff {
  field: string;
  oldValue: any;
  newValue: any;
  operation: 'ADDED' | 'REMOVED' | 'MODIFIED';
}

export interface AuditStats {
  totalActions: number;
  byModule: Record<string, number>;
  byAction: Record<string, number>;
  byUser: Record<string, number>;
  recentActions: AuditLogEntry[];
}

export class AuditEngine {
  private modules: Record<string, string[]> = {
    AUTH: ['LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'LOGIN_FAILED'],
    PATIENT: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'SEARCH', 'VIEW_HISTORY'],
    VISIT: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'START', 'END'],
    PRESCRIPTION: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'SIGN', 'DISPENSE', 'CANCEL', 'REVIEW'],
    EXAM_ORDER: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'SIGN', 'EXECUTE', 'RESULT_ENTER'],
    MEDICAL_RECORD: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'SIGN', 'LOCK', 'EDIT_LOCKED'],
    NURSING_ORDER: ['CREATE', 'READ', 'UPDATE', 'EXECUTE', 'CANCEL'],
    ARCHIVE: ['CREATE', 'READ', 'QUALITY_CHECK', 'ARCHIVE', 'RETRIEVE'],
    DIGITAL_SIGNATURE: ['SIGN', 'VERIFY', 'LOCK'],
    CDSS: ['VALIDATE', 'ALERT_ACKNOWLEDGE', 'OVERRIDE'],
    USER_MANAGEMENT: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'ENABLE', 'DISABLE', 'ROLE_CHANGE'],
    ROLE_MANAGEMENT: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'PERMISSION_CHANGE'],
    SYSTEM: ['CONFIG_CHANGE', 'BACKUP', 'RESTORE', 'EXPORT'],
    AUDIT: ['READ', 'EXPORT', 'SEARCH'],
  };

  async log(
    entry: Omit<AuditLogEntry, 'id' | 'createdAt'>
  ): Promise<string> {
    const id = uuidv4();
    const now = new Date();

    await knex('audit_logs').insert({
      id,
      user_id: entry.userId,
      username: entry.username,
      action: entry.action,
      module: entry.module,
      table_name: entry.tableName,
      record_id: entry.recordId,
      old_value: entry.oldValue,
      new_value: entry.newValue,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      description: entry.description,
      created_at: now,
      updated_at: now,
    });

    return id;
  }

  async logCreate(
    module: string,
    tableName: string,
    recordId: string,
    newValue: any,
    user: { id: string; username: string },
    ipAddress?: string,
    description?: string
  ): Promise<string> {
    return this.log({
      userId: user.id,
      username: user.username,
      action: 'CREATE',
      module,
      tableName,
      recordId,
      newValue,
      ipAddress,
      description: description || `创建了 ${tableName} 记录: ${recordId}`,
    });
  }

  async logUpdate(
    module: string,
    tableName: string,
    recordId: string,
    oldValue: any,
    newValue: any,
    user: { id: string; username: string },
    ipAddress?: string,
    description?: string
  ): Promise<string> {
    const diff = this.computeDiff(oldValue, newValue);

    return this.log({
      userId: user.id,
      username: user.username,
      action: 'UPDATE',
      module,
      tableName,
      recordId,
      oldValue,
      newValue,
      ipAddress,
      description: description || `更新了 ${tableName} 记录: ${recordId}`,
    });
  }

  async logDelete(
    module: string,
    tableName: string,
    recordId: string,
    oldValue: any,
    user: { id: string; username: string },
    ipAddress?: string,
    description?: string
  ): Promise<string> {
    return this.log({
      userId: user.id,
      username: user.username,
      action: 'DELETE',
      module,
      tableName,
      recordId,
      oldValue,
      ipAddress,
      description: description || `删除了 ${tableName} 记录: ${recordId}`,
    });
  }

  async logRead(
    module: string,
    tableName: string,
    recordId: string,
    user: { id: string; username: string },
    ipAddress?: string,
    description?: string
  ): Promise<string> {
    return this.log({
      userId: user.id,
      username: user.username,
      action: 'READ',
      module,
      tableName,
      recordId,
      ipAddress,
      description: description || `查看了 ${tableName} 记录: ${recordId}`,
    });
  }

  async logStatusChange(
    module: string,
    tableName: string,
    recordId: string,
    oldStatus: string,
    newStatus: string,
    user: { id: string; username: string },
    ipAddress?: string,
    reason?: string
  ): Promise<string> {
    return this.log({
      userId: user.id,
      username: user.username,
      action: 'STATUS_CHANGE',
      module,
      tableName,
      recordId,
      oldValue: { status: oldStatus },
      newValue: { status: newStatus },
      ipAddress,
      description: reason || `状态变更: ${oldStatus} -> ${newStatus}`,
    });
  }

  async logSign(
    module: string,
    tableName: string,
    recordId: string,
    user: { id: string; username: string },
    ipAddress?: string,
    metadata?: any
  ): Promise<string> {
    return this.log({
      userId: user.id,
      username: user.username,
      action: 'SIGN',
      module,
      tableName,
      recordId,
      newValue: { signedAt: new Date(), metadata },
      ipAddress,
      description: `对 ${tableName} 记录 ${recordId} 进行了电子签名`,
    });
  }

  async logCDSSAlert(
    ruleCode: string,
    ruleName: string,
    alertType: string,
    userAction: 'ACKNOWLEDGE' | 'OVERRIDE' | 'BLOCK',
    user: { id: string; username: string },
    ipAddress?: string,
    details?: any
  ): Promise<string> {
    return this.log({
      userId: user.id,
      username: user.username,
      action: userAction === 'OVERRIDE' ? 'OVERRIDE' : userAction === 'BLOCK' ? 'BLOCK' : 'ALERT_ACKNOWLEDGE',
      module: 'CDSS',
      tableName: 'cdss_rules',
      recordId: ruleCode,
      newValue: { ruleName, alertType, details },
      ipAddress,
      description: `${userAction === 'OVERRIDE' ? '忽略了' : userAction === 'BLOCK' ? '被CDSS阻止的' : '确认了'} CDSS规则: ${ruleName}`,
    });
  }

  computeDiff(oldValue: any, newValue: any): AuditDiff[] {
    const diffs: AuditDiff[] = [];

    if (!oldValue || typeof oldValue !== 'object') {
      return diffs;
    }

    if (!newValue || typeof newValue !== 'object') {
      return diffs;
    }

    const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);

    for (const key of allKeys) {
      const oldVal = oldValue[key];
      const newVal = newValue[key];

      if (!(key in newValue)) {
        diffs.push({
          field: key,
          oldValue: oldVal,
          newValue: undefined,
          operation: 'REMOVED',
        });
      } else if (!(key in oldValue)) {
        diffs.push({
          field: key,
          oldValue: undefined,
          newValue: newVal,
          operation: 'ADDED',
        });
      } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diffs.push({
          field: key,
          oldValue: oldVal,
          newValue: newVal,
          operation: 'MODIFIED',
        });
      }
    }

    return diffs;
  }

  async query(options: AuditQueryOptions): Promise<{
    logs: AuditLogEntry[];
    total: number;
    diffs?: Record<string, AuditDiff[]>;
  }> {
    let query = knex('audit_logs').select('*');

    if (options.userId) {
      query = query.where('user_id', options.userId);
    }

    if (options.module) {
      query = query.where('module', options.module);
    }

    if (options.action) {
      query = query.where('action', options.action);
    }

    if (options.tableName) {
      query = query.where('table_name', options.tableName);
    }

    if (options.recordId) {
      query = query.where('record_id', options.recordId);
    }

    if (options.startDate) {
      query = query.where('created_at', '>=', options.startDate);
    }

    if (options.endDate) {
      query = query.where('created_at', '<=', options.endDate);
    }

    const countQuery = query.clone().count('* as count');
    const countResult = await countQuery.first();
    const total = parseInt(countResult?.count?.toString() || '0', 10);

    query = query.orderBy('created_at', 'desc');

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.offset(options.offset);
    }

    const logs = await query;

    const results = {
      logs: logs.map((log) => ({
        id: log.id,
        userId: log.user_id,
        username: log.username,
        action: log.action,
        module: log.module,
        tableName: log.table_name,
        recordId: log.record_id,
        oldValue: log.old_value,
        newValue: log.new_value,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        description: log.description,
        createdAt: log.created_at,
      })),
      total,
    };

    if (options.includeDiff) {
      const diffs: Record<string, AuditDiff[]> = {};
      for (const log of results.logs) {
        if (log.action === 'UPDATE' && log.oldValue && log.newValue) {
          diffs[log.id] = this.computeDiff(log.oldValue, log.newValue);
        }
      }
      return { ...results, diffs };
    }

    return results;
  }

  async getRecordHistory(
    tableName: string,
    recordId: string,
    limit: number = 50
  ): Promise<{
    logs: AuditLogEntry[];
    diffs: Record<string, AuditDiff[]>;
  }> {
    return this.query({
      tableName,
      recordId,
      limit,
      includeDiff: true,
    }) as Promise<{ logs: AuditLogEntry[]; total: number; diffs: Record<string, AuditDiff[]> }>;
  }

  async getStats(options: {
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<AuditStats> {
    let baseQuery = knex('audit_logs');

    if (options.startDate) {
      baseQuery = baseQuery.where('created_at', '>=', options.startDate);
    }

    if (options.endDate) {
      baseQuery = baseQuery.where('created_at', '<=', options.endDate);
    }

    const countQuery = baseQuery.clone().count('* as count');
    const countResult = await countQuery.first();
    const totalActions = parseInt(countResult?.count?.toString() || '0', 10);

    const moduleQuery = baseQuery
      .clone()
      .select('module')
      .count('* as count')
      .groupBy('module')
      .orderBy('count', 'desc');
    const moduleResults = await moduleQuery;
    const byModule: Record<string, number> = {};
    for (const result of moduleResults) {
      byModule[result.module] = parseInt(result.count.toString(), 10);
    }

    const actionQuery = baseQuery
      .clone()
      .select('action')
      .count('* as count')
      .groupBy('action')
      .orderBy('count', 'desc');
    const actionResults = await actionQuery;
    const byAction: Record<string, number> = {};
    for (const result of actionResults) {
      byAction[result.action] = parseInt(result.count.toString(), 10);
    }

    const userQuery = baseQuery
      .clone()
      .select('username')
      .count('* as count')
      .groupBy('username')
      .orderBy('count', 'desc')
      .limit(20);
    const userResults = await userQuery;
    const byUser: Record<string, number> = {};
    for (const result of userResults) {
      byUser[result.username] = parseInt(result.count.toString(), 10);
    }

    const recentQuery = baseQuery
      .clone()
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(10);
    const recentResults = await recentQuery;

    return {
      totalActions,
      byModule,
      byAction,
      byUser,
      recentActions: recentResults.map((log) => ({
        id: log.id,
        userId: log.user_id,
        username: log.username,
        action: log.action,
        module: log.module,
        tableName: log.table_name,
        recordId: log.record_id,
        oldValue: log.old_value,
        newValue: log.new_value,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        description: log.description,
        createdAt: log.created_at,
      })),
    };
  }

  validateModuleAction(module: string, action: string): boolean {
    const allowedActions = this.modules[module];
    if (!allowedActions) return false;
    return allowedActions.includes(action);
  }

  getModules(): string[] {
    return Object.keys(this.modules);
  }

  getActions(module: string): string[] {
    return this.modules[module] || [];
  }

  async exportToCSV(options: AuditQueryOptions): Promise<string> {
    const result = await this.query({ ...options, limit: undefined, offset: undefined });

    const headers = ['时间', '用户名', '模块', '操作', '表名', '记录ID', '描述', 'IP地址'];

    const rows = result.logs.map((log) => [
      log.createdAt.toISOString(),
      log.username,
      log.module,
      log.action,
      log.tableName || '',
      log.recordId || '',
      log.description || '',
      log.ipAddress || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  async queryLogs(
    filters: any,
    pagination: { limit?: number; offset?: number }
  ): Promise<{ logs: AuditLogEntry[]; total: number }> {
    return this.query({
      ...filters,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  async getLogById(logId: string): Promise<AuditLogEntry | undefined> {
    const result = await knex('audit_logs').select('*').where('id', logId).first();

    if (!result) {
      return undefined;
    }

    return {
      id: result.id,
      userId: result.user_id,
      username: result.username,
      action: result.action,
      module: result.module,
      tableName: result.table_name,
      recordId: result.record_id,
      oldValue: result.old_value,
      newValue: result.new_value,
      ipAddress: result.ip_address,
      userAgent: result.user_agent,
      description: result.description,
      createdAt: result.created_at,
    };
  }

  async getEntityHistory(
    entityType: string,
    entityId: string,
    limit: number = 50
  ): Promise<AuditLogEntry[]> {
    const result = await this.getRecordHistory(entityType, entityId, limit);
    return result.logs;
  }

  async getStatistics(startDate?: Date, endDate?: Date): Promise<AuditStats> {
    return this.getStats({ startDate, endDate });
  }

  async queryCDSSAlerts(
    filters: any,
    pagination: { limit?: number; offset?: number }
  ): Promise<{ alerts: any[]; total: number }> {
    let query = knex('audit_logs')
      .select('*')
      .where('module', 'CDSS')
      .orderBy('created_at', 'desc');

    if (filters.status) {
      query = query.where('action', filters.status);
    }

    const countQuery = query.clone().count('* as count');
    const countResult = await countQuery.first();
    const total = parseInt(countResult?.count?.toString() || '0', 10);

    if (pagination.limit) {
      query = query.limit(pagination.limit);
    }
    if (pagination.offset) {
      query = query.offset(pagination.offset);
    }

    const results = await query;

    const alerts = results.map((alert: any) => ({
      id: alert.id,
      ruleCode: alert.record_id,
      action: alert.action,
      timestamp: alert.created_at,
      username: alert.username,
      details: alert.new_value,
      description: alert.description,
    }));

    return { alerts, total };
  }
}

export const auditEngine = new AuditEngine();
