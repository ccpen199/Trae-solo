import { db } from '../db/database';
import type { AuditLog } from '../../shared/types';

function mapDbRowToAuditLog(row: any): AuditLog {
  return {
    id: row.id,
    operator: row.operator,
    action: row.action,
    targetType: row.target_type || undefined,
    targetId: row.target_id || undefined,
    detail: row.detail || undefined,
    ip: row.ip || undefined,
    createdAt: row.created_at,
  };
}

export const AuditService = {
  logAction(
    operator: string,
    action: string,
    targetType?: string,
    targetId?: string,
    detail?: string,
    ip?: string,
  ): void {
    db.prepare(`
      INSERT INTO audit_logs (operator, action, target_type, target_id, detail, ip)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(operator, action, targetType ?? null, targetId ?? null, detail ?? null, ip ?? null);
  },

  getAuditLogs(limit: number = 50, offset: number = 0): { logs: AuditLog[]; total: number } {
    const totalRow = db.prepare('SELECT COUNT(*) as total FROM audit_logs').get() as any;
    const logs = db.prepare(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
    )
      .all(limit, offset) as any[];
    return {
      logs: logs.map(mapDbRowToAuditLog),
      total: totalRow.total || 0,
    };
  },
};
