import { getDb } from '../database';
import { AuditLog } from '../types';

export class AuditLogRepository {
  findAll(page: number = 1, pageSize: number = 20): { list: AuditLog[]; total: number } {
    const db = getDb();
    const total = (db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as any).count;
    const offset = (page - 1) * pageSize;
    const list = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?').all(pageSize, offset) as AuditLog[];
    return { list, total };
  }

  create(data: { user_id?: number; user_name?: string; user_role?: string; action: string; target_type?: string; target_id?: number; details?: string; ip_address?: string }): number {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(data.user_id || null, data.user_name || null, data.user_role || null, data.action, data.target_type || null, data.target_id || null, data.details || null, data.ip_address || null);
    return Number(result.lastInsertRowid);
  }
}
