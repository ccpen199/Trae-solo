import { getDb } from '../database';
import { Settlement } from '../types';

export class SettlementRepository {
  findById(id: number): Settlement | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM settlements WHERE id = ?').get(id) as Settlement | undefined;
  }

  findByCourier(courierId: number, page: number = 1, pageSize: number = 20): { list: Settlement[]; total: number } {
    const db = getDb();
    const total = (db.prepare('SELECT COUNT(*) as count FROM settlements WHERE courier_id = ?').get(courierId) as any).count;
    const offset = (page - 1) * pageSize;
    const list = db.prepare('SELECT * FROM settlements WHERE courier_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(courierId, pageSize, offset) as Settlement[];
    return { list, total };
  }

  findByBranch(branchId: number, page: number = 1, pageSize: number = 20): { list: Settlement[]; total: number } {
    const db = getDb();
    const total = (db.prepare('SELECT COUNT(*) as count FROM settlements WHERE branch_id = ?').get(branchId) as any).count;
    const offset = (page - 1) * pageSize;
    const list = db.prepare('SELECT * FROM settlements WHERE branch_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(branchId, pageSize, offset) as Settlement[];
    return { list, total };
  }

  findAll(page: number = 1, pageSize: number = 20): { list: Settlement[]; total: number } {
    const db = getDb();
    const total = (db.prepare('SELECT COUNT(*) as count FROM settlements').get() as any).count;
    const offset = (page - 1) * pageSize;
    const list = db.prepare('SELECT * FROM settlements ORDER BY created_at DESC LIMIT ? OFFSET ?').all(pageSize, offset) as Settlement[];
    return { list, total };
  }

  create(data: { period: string; branch_id: number; courier_id: number; total_tasks: number; total_fee: number; bonus: number; deduction: number; net_amount: number }): number {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO settlements (period, branch_id, courier_id, total_tasks, total_fee, bonus, deduction, net_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(data.period, data.branch_id, data.courier_id, data.total_tasks, data.total_fee, data.bonus, data.deduction, data.net_amount);
    return Number(result.lastInsertRowid);
  }

  update(id: number, data: Partial<Settlement>): boolean {
    const db = getDb();
    const sets: string[] = [];
    const params: any[] = [];
    for (const [key, value] of Object.entries(data)) {
      sets.push(`${key} = ?`);
      params.push(value);
    }
    if (sets.length === 0) return false;
    params.push(id);
    const result = db.prepare(`UPDATE settlements SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return result.changes > 0;
  }
}
