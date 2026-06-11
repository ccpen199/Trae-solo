import { getDb } from '../database';
import { CustomerGroup } from '../types';

export class CustomerGroupRepository {
  findById(id: number): CustomerGroup | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM customer_groups WHERE id = ?').get(id) as CustomerGroup | undefined;
  }

  findAll(branchId?: number): CustomerGroup[] {
    const db = getDb();
    if (branchId) {
      return db.prepare('SELECT * FROM customer_groups WHERE branch_id = ? ORDER BY created_at DESC').all(branchId) as CustomerGroup[];
    }
    return db.prepare('SELECT * FROM customer_groups ORDER BY created_at DESC').all() as CustomerGroup[];
  }

  countByType(): { type: string; count: number }[] {
    const db = getDb();
    return db.prepare('SELECT type, COUNT(*) as count FROM customer_groups GROUP BY type').all() as { type: string; count: number }[];
  }

  create(data: { name: string; type: string; customer_count: number; total_orders: number; avg_fee: number; branch_id: number; tags?: string }): number {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO customer_groups (name, type, customer_count, total_orders, avg_fee, branch_id, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(data.name, data.type, data.customer_count, data.total_orders, data.avg_fee, data.branch_id, data.tags || null);
    return Number(result.lastInsertRowid);
  }
}
