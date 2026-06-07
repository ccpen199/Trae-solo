import db from './db.js';
import type { AuditAction } from './types.js';

export interface LogAuditParams {
  userId: number;
  action: AuditAction;
  resourceType: string;
  resourceId?: number;
  detail?: string;
  ipAddress?: string;
  userAgent?: string;
}

export function logAudit(params: LogAuditParams): void {
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, detail, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    params.userId,
    params.action,
    params.resourceType,
    params.resourceId || null,
    params.detail || null,
    params.ipAddress || null,
    params.userAgent || null
  );
}

export function logAuditAsync(params: LogAuditParams): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(() => {
      try {
        logAudit(params);
      } catch (e) {
        console.error('[Audit Log Error]', e);
      }
      resolve();
    });
  });
}

export function buildAuditDetail(action: string, changes: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(changes)) {
    if (value !== undefined) {
      parts.push(`${key}: ${JSON.stringify(value)}`);
    }
  }
  return `${action}: ${parts.join(', ')}`;
}
