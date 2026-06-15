import { saveSetting, getSetting } from './db';

export interface AuditLogEntry {
  id: string;
  action: string;
  timestamp: number;
  details: Record<string, any>;
}

const STORAGE_KEY = 'audit_logs';
const MAX_LOGS = 200;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function addAuditLog(action: string, details: Record<string, any> = {}): Promise<void> {
  try {
    const logs = await getAuditLogs();
    const entry: AuditLogEntry = {
      id: generateId(),
      action,
      timestamp: Date.now(),
      details,
    };
    logs.unshift(entry);
    const limited = logs.slice(0, MAX_LOGS);
    await saveSetting(STORAGE_KEY, limited);
  } catch (e) {
    console.error('Failed to add audit log', e, { action, details });
  }
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const data = await getSetting(STORAGE_KEY);
    if (Array.isArray(data)) {
      return data as AuditLogEntry[];
    }
    return [];
  } catch (e) {
    console.error('Failed to get audit logs', e);
    return [];
  }
}

export async function clearAuditLogs(): Promise<void> {
  try {
    await saveSetting(STORAGE_KEY, []);
  } catch (e) {
    console.error('Failed to clear audit logs', e);
  }
}

export async function initAuditLog(): Promise<void> {
  try {
    const logs = await getAuditLogs();
    if (logs.length === 0) {
      await addAuditLog('app.init', { message: '应用首次启动，审计系统已激活' });
    } else {
      await addAuditLog('app.visit', { message: '应用访问', logCount: logs.length });
    }
  } catch (e) {
    console.error('Failed to init audit log', e);
  }
}

export const ACTIONS = {
  APP_INIT: 'app.init',
  APP_VISIT: 'app.visit',
  RESUME_CREATE: 'resume.create',
  RESUME_SAVE: 'resume.save',
  RESUME_DELETE: 'resume.delete',
  RESUME_EXPORT: 'resume.export',
  RESUME_IMPORT: 'resume.import',
  TEMPLATE_USE: 'template.use',
  TEMPLATE_FILTER: 'template.filter',
  MODULE_ADD: 'module.add',
  MODULE_REMOVE: 'module.remove',
  MODULE_REORDER: 'module.reorder',
  AI_DIAGNOSIS: 'ai.diagnosis',
  ATS_CHECK: 'ats.check',
  PRIVACY_TOGGLE: 'privacy.toggle',
  DATA_CLEAR: 'data.clear',
  DATA_EXPORT: 'data.export',
};

export const ACTION_LABELS: Record<string, string> = {
  'app.init': '应用初始化',
  'app.visit': '应用访问',
  'resume.create': '创建简历',
  'resume.save': '保存简历',
  'resume.delete': '删除简历',
  'resume.export': '导出Word',
  'resume.import': '导入Word',
  'template.use': '使用模板',
  'template.filter': '筛选模板',
  'module.add': '添加模块',
  'module.remove': '删除模块',
  'module.reorder': '模块排序',
  'ai.diagnosis': 'AI诊断',
  'ats.check': 'ATS检测',
  'privacy.toggle': '隐私模式切换',
  'data.clear': '清空数据',
  'data.export': '导出数据',
};
