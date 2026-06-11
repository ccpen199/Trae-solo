import { getDb } from '../database';
import { PickupTask } from '../types';

export interface TaskFilter {
  branch_id?: number;
  courier_id?: number;
  type?: string;
  status?: string;
}

export class TaskRepository {
  findById(id: number): PickupTask | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM pickup_tasks WHERE id = ?').get(id) as PickupTask | undefined;
  }

  findAll(filter: TaskFilter, page: number = 1, pageSize: number = 20): { list: PickupTask[]; total: number } {
    const db = getDb();
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter.branch_id) {
      conditions.push('branch_id = ?');
      params.push(filter.branch_id);
    }
    if (filter.courier_id) {
      conditions.push('courier_id = ?');
      params.push(filter.courier_id);
    }
    if (filter.type) {
      conditions.push('type = ?');
      params.push(filter.type);
    }
    if (filter.status) {
      conditions.push('status = ?');
      params.push(filter.status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = (db.prepare(`SELECT COUNT(*) as count FROM pickup_tasks ${where}`).get(...params) as any).count;
    const offset = (page - 1) * pageSize;
    const list = db.prepare(`SELECT * FROM pickup_tasks ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset) as PickupTask[];
    return { list, total };
  }

  countByStatus(branchId?: number): Record<string, number> {
    const db = getDb();
    const where = branchId ? `WHERE branch_id = ${branchId}` : '';
    const rows = db.prepare(`SELECT status, COUNT(*) as count FROM pickup_tasks ${where} GROUP BY status`).all() as any[];
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.status] = row.count;
    }
    return result;
  }

  countByCourier(branchId?: number): Record<string, number> {
    const db = getDb();
    const where = branchId ? `WHERE branch_id = ${branchId}` : '';
    const rows = db.prepare(`SELECT courier_id, COUNT(*) as count FROM pickup_tasks ${where} AND courier_id IS NOT NULL GROUP BY courier_id`).all() as any[];
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[String(row.courier_id)] = row.count;
    }
    return result;
  }

  create(data: Partial<PickupTask>): number {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO pickup_tasks (task_no, type, status, branch_id, courier_id, tracking_no, sender_name, sender_phone, receiver_name, receiver_phone, address, scheduled_time, fee, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.task_no, data.type, data.status || 'pending', data.branch_id,
      data.courier_id || null, data.tracking_no || null,
      data.sender_name, data.sender_phone, data.receiver_name, data.receiver_phone,
      data.address, data.scheduled_time, data.fee, data.note
    );
    return Number(result.lastInsertRowid);
  }

  updateStatus(id: number, status: string, extraFields: Record<string, any> = {}): boolean {
    const db = getDb();
    const sets = ['status = ?'];
    const params: any[] = [status];
    for (const [key, value] of Object.entries(extraFields)) {
      sets.push(`${key} = ?`);
      params.push(value);
    }
    params.push(id);
    const result = db.prepare(`UPDATE pickup_tasks SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return result.changes > 0;
  }
}
