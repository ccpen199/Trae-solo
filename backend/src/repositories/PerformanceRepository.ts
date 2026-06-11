import { getDb } from '../database';
import { PerformanceRecord } from '../types';

export class PerformanceRepository {
  findById(id: number): PerformanceRecord | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM performance_records WHERE id = ?').get(id) as PerformanceRecord | undefined;
  }

  findByUser(userId: number, page: number = 1, pageSize: number = 20): { list: PerformanceRecord[]; total: number } {
    const db = getDb();
    const total = (db.prepare('SELECT COUNT(*) as count FROM performance_records WHERE user_id = ?').get(userId) as any).count;
    const offset = (page - 1) * pageSize;
    const list = db.prepare('SELECT * FROM performance_records WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(userId, pageSize, offset) as PerformanceRecord[];
    return { list, total };
  }

  findByPeriod(period: string, page: number = 1, pageSize: number = 20): { list: PerformanceRecord[]; total: number } {
    const db = getDb();
    const total = (db.prepare('SELECT COUNT(*) as count FROM performance_records WHERE period = ?').get(period) as any).count;
    const offset = (page - 1) * pageSize;
    const list = db.prepare('SELECT * FROM performance_records WHERE period = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(period, pageSize, offset) as PerformanceRecord[];
    return { list, total };
  }

  listAll(page: number = 1, pageSize: number = 20): { list: PerformanceRecord[]; total: number } {
    const db = getDb();
    const total = (db.prepare('SELECT COUNT(*) as count FROM performance_records').get() as any).count;
    const offset = (page - 1) * pageSize;
    const list = db.prepare('SELECT * FROM performance_records ORDER BY created_at DESC LIMIT ? OFFSET ?').all(pageSize, offset) as PerformanceRecord[];
    return { list, total };
  }

  create(data: { user_id: number; period: string; total_tasks: number; completed_tasks: number; failed_tasks: number; on_time_rate: number; customer_score: number; total_fee: number; bonus: number; deduction: number; branch_id: number }): number {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO performance_records (user_id, period, total_tasks, completed_tasks, failed_tasks, on_time_rate, customer_score, total_fee, bonus, deduction, branch_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(data.user_id, data.period, data.total_tasks, data.completed_tasks, data.failed_tasks, data.on_time_rate, data.customer_score, data.total_fee, data.bonus, data.deduction, data.branch_id);
    return Number(result.lastInsertRowid);
  }
}
