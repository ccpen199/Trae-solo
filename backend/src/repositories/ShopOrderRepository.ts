import { getDb } from '../database';
import { ShopOrder } from '../types';

export class ShopOrderRepository {
  findById(id: number): ShopOrder | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM shop_orders WHERE id = ?').get(id) as ShopOrder | undefined;
  }

  findAll(filters: { status?: string; branch_id?: number; source?: string }, page: number = 1, pageSize: number = 20): { list: ShopOrder[]; total: number } {
    const db = getDb();
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }
    if (filters.branch_id) {
      conditions.push('branch_id = ?');
      params.push(filters.branch_id);
    }
    if (filters.source) {
      conditions.push('source = ?');
      params.push(filters.source);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = (db.prepare(`SELECT COUNT(*) as count FROM shop_orders ${whereClause}`).get(...params) as any).count;
    const offset = (page - 1) * pageSize;
    const list = db.prepare(`SELECT * FROM shop_orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset) as ShopOrder[];
    return { list, total };
  }

  countByStatus(): { status: string; count: number }[] {
    const db = getDb();
    return db.prepare('SELECT status, COUNT(*) as count FROM shop_orders GROUP BY status').all() as { status: string; count: number }[];
  }

  sumAmount(): { total: number } {
    const db = getDb();
    const result = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM shop_orders').get() as { total: number };
    return result;
  }

  create(data: { order_no: string; customer_name: string; customer_phone: string; product_name: string; quantity: number; amount: number; branch_id: number; courier_id?: number; source: string }): number {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO shop_orders (order_no, customer_name, customer_phone, product_name, quantity, amount, status, tracking_no, branch_id, courier_id, source)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL, ?, ?, ?)
    `).run(data.order_no, data.customer_name, data.customer_phone, data.product_name, data.quantity, data.amount, data.branch_id, data.courier_id || null, data.source);
    return Number(result.lastInsertRowid);
  }

  updateStatus(id: number, status: string, trackingNo?: string): boolean {
    const db = getDb();
    const now = new Date().toISOString();
    if (trackingNo) {
      const result = db.prepare('UPDATE shop_orders SET status = ?, tracking_no = ?, updated_at = ? WHERE id = ?').run(status, trackingNo, now, id);
      return result.changes > 0;
    }
    const result = db.prepare('UPDATE shop_orders SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);
    return result.changes > 0;
  }
}
