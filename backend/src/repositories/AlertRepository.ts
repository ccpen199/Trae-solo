import { getDb } from '../database';
import { Alert } from '../types';

export class AlertRepository {
  findById(id: number): Alert | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) as Alert | undefined;
  }

  findAll(status?: string, page: number = 1, pageSize: number = 20): { list: Alert[]; total: number } {
    const db = getDb();
    let where = '';
    const params: any[] = [];
    if (status) {
      where = 'WHERE status = ?';
      params.push(status);
    }
    const total = (db.prepare(`SELECT COUNT(*) as count FROM alerts ${where}`).get(...params) as any).count;
    const offset = (page - 1) * pageSize;
    const list = db.prepare(`SELECT * FROM alerts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset) as Alert[];
    return { list, total };
  }

  countActive(): number {
    const db = getDb();
    return (db.prepare("SELECT COUNT(*) as count FROM alerts WHERE status = 'active'").get() as any).count;
  }

  create(data: { type: string; level: string; title: string; description?: string; branch_id?: number; package_id?: number }): number {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO alerts (type, level, title, description, branch_id, package_id, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `).run(data.type, data.level, data.title, data.description || null, data.branch_id || null, data.package_id || null);
    return Number(result.lastInsertRowid);
  }

  resolve(id: number, resolvedBy: number): boolean {
    const db = getDb();
    const result = db.prepare(`
      UPDATE alerts SET status = 'resolved', resolved_by = ?, resolved_at = datetime('now', 'localtime') WHERE id = ?
    `).run(resolvedBy, id);
    return result.changes > 0;
  }
}
