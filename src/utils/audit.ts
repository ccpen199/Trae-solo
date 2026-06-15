import { saveSetting, getSetting } from './db';

export interface AuditLogEntry {
  id: string;
  action: string;
  timestamp: number;
  details: Record<string, any>;
}

const STORAGE_KEY = 'audit_logs';

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
    const limited = logs.slice(0, 100);
    await saveSetting(STORAGE_KEY, limited);
  } catch (e) {
    console.error('Failed to add audit log', e);
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

export const ACTIONS = {
  RESUME_CREATE: 'resume.create',
  RESUME_SAVE: 'resume.save',
  RESUME_DELETE: 'resume.delete',
  RESUME_EXPORT: 'resume.export',
  RESUME_IMPORT: 'resume.import',
  TEMPLATE_USE: 'template.use',
  MODULE_ADD: 'module.add',
  MODULE_REMOVE: 'module.remove',
  MODULE_REORDER: 'module.reorder',
  AI_DIAGNOSIS: 'ai.diagnosis',
  ATS_CHECK: 'ats.check',
  PRIVACY_TOGGLE: 'privacy.toggle',
  DATA_CLEAR: 'data.clear',
  DATA_EXPORT: 'data.export',
};
