import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import type { OperationLogEntry } from '@/types/user';

const LOG_STORAGE_KEY = 'operation_logs';

const getDeviceInfo = (): string => {
  try {
    const info = Taro.getSystemInfoSync();
    return `${info.platform} ${info.system} ${info.model}`;
  } catch (e) {
    console.error('[Logger] 获取设备信息失败:', e);
    return 'unknown';
  }
};

const getLocation = async (): Promise<{ longitude?: number; latitude?: number; location?: string }> => {
  try {
    const res = await Taro.getLocation({ type: 'gcj02' });
    return {
      longitude: res.longitude,
      latitude: res.latitude,
      location: `${res.longitude.toFixed(6)},${res.latitude.toFixed(6)}`
    };
  } catch (e) {
    console.warn('[Logger] 获取位置信息失败:', e);
    return {};
  }
};

const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const logOperation = async (params: {
  userId: string;
  userName: string;
  module: string;
  action: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  requestParams?: Record<string, unknown>;
  responseResult?: Record<string, unknown>;
  status: 'success' | 'failed' | 'warning';
  errorMessage?: string;
  complianceLevel: 'normal' | 'sensitive' | 'critical';
  retentionDays?: number;
  requireLocation?: boolean;
}): Promise<OperationLogEntry> => {
  const locationInfo = params.requireLocation ? await getLocation() : {};
  const deviceInfo = getDeviceInfo();

  const logEntry: OperationLogEntry = {
    id: generateId(),
    userId: params.userId,
    userName: params.userName,
    module: params.module,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    targetName: params.targetName,
    deviceInfo,
    ...locationInfo,
    requestParams: params.requestParams,
    responseResult: params.responseResult,
    status: params.status,
    errorMessage: params.errorMessage,
    timestamp: Date.now(),
    complianceLevel: params.complianceLevel,
    retentionDays: params.retentionDays || 365
  };

  console.log(`[${params.module.toUpperCase()}] ${params.action}:`, {
    target: params.targetName || params.targetId,
    status: params.status,
    time: dayjs(logEntry.timestamp).format('YYYY-MM-DD HH:mm:ss'),
    location: locationInfo.location || 'N/A'
  });

  if (params.status === 'failed' || params.errorMessage) {
    console.error(`[${params.module.toUpperCase()}] Error:`, params.errorMessage);
  }

  try {
    const existingLogs: OperationLogEntry[] = Taro.getStorageSync(LOG_STORAGE_KEY) || [];
    const cutoffTime = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentLogs = existingLogs.filter(log => log.timestamp > cutoffTime);
    recentLogs.unshift(logEntry);
    if (recentLogs.length > 1000) {
      recentLogs.length = 1000;
    }
    Taro.setStorageSync(LOG_STORAGE_KEY, recentLogs);
  } catch (e) {
    console.error('[Logger] 持久化日志失败:', e);
  }

  return logEntry;
};

export const getOperationLogs = (params?: {
  module?: string;
  action?: string;
  startTime?: number;
  endTime?: number;
  status?: string;
}): OperationLogEntry[] => {
  try {
    const logs: OperationLogEntry[] = Taro.getStorageSync(LOG_STORAGE_KEY) || [];
    let filtered = logs;

    if (params?.module) {
      filtered = filtered.filter(log => log.module === params.module);
    }
    if (params?.action) {
      filtered = filtered.filter(log => log.action === params.action);
    }
    if (params?.startTime) {
      filtered = filtered.filter(log => log.timestamp >= params.startTime!);
    }
    if (params?.endTime) {
      filtered = filtered.filter(log => log.timestamp <= params.endTime!);
    }
    if (params?.status) {
      filtered = filtered.filter(log => log.status === params.status);
    }

    return filtered;
  } catch (e) {
    console.error('[Logger] 查询日志失败:', e);
    return [];
  }
};

export const getLogById = (id: string): OperationLogEntry | null => {
  try {
    const logs: OperationLogEntry[] = Taro.getStorageSync(LOG_STORAGE_KEY) || [];
    return logs.find(log => log.id === id) || null;
  } catch (e) {
    console.error('[Logger] 查询日志详情失败:', e);
    return null;
  }
};

export const exportLogs = async (params?: {
  startTime?: number;
  endTime?: number;
  format?: 'json' | 'csv';
}): Promise<string> => {
  const logs = getOperationLogs(params);
  const format = params?.format || 'json';

  if (format === 'csv') {
    const headers = ['ID', '用户ID', '用户名', '模块', '操作', '目标类型', '目标ID', '目标名称', '状态', '时间', '合规等级'];
    const rows = logs.map(log => [
      log.id,
      log.userId,
      log.userName,
      log.module,
      log.action,
      log.targetType,
      log.targetId || '',
      log.targetName || '',
      log.status,
      dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss'),
      log.complianceLevel
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  return JSON.stringify(logs, null, 2);
};

export const clearExpiredLogs = (): void => {
  try {
    const logs: OperationLogEntry[] = Taro.getStorageSync(LOG_STORAGE_KEY) || [];
    const now = Date.now();
    const validLogs = logs.filter(log => {
      const expireTime = log.timestamp + log.retentionDays * 24 * 60 * 60 * 1000;
      return now < expireTime;
    });
    Taro.setStorageSync(LOG_STORAGE_KEY, validLogs);
    console.log(`[Logger] 清理过期日志完成，保留 ${validLogs.length} 条`);
  } catch (e) {
    console.error('[Logger] 清理过期日志失败:', e);
  }
};
