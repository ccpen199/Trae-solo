import { getDb } from '../database';
import { Package } from '../types';

export interface PackageFilter {
  branch_id?: number;
  courier_id?: number;
  brand?: string;
  status?: string;
  type?: string;
  keyword?: string;
}

export class PackageRepository {
  findById(id: number): Package | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM packages WHERE id = ?').get(id) as Package | undefined;
  }

  findAll(filter: PackageFilter, page: number = 1, pageSize: number = 20): { list: Package[]; total: number } {
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
    if (filter.brand) {
      conditions.push('brand = ?');
      params.push(filter.brand);
    }
    if (filter.status) {
      conditions.push('status = ?');
      params.push(filter.status);
    }
    if (filter.type) {
      conditions.push('type = ?');
      params.push(filter.type);
    }
    if (filter.keyword) {
      conditions.push('(tracking_no LIKE ? OR sender_name LIKE ? OR receiver_name LIKE ? OR sender_phone LIKE ? OR receiver_phone LIKE ?)');
      const kw = `%${filter.keyword}%`;
      params.push(kw, kw, kw, kw, kw);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = (db.prepare(`SELECT COUNT(*) as count FROM packages ${where}`).get(...params) as any).count;
    const offset = (page - 1) * pageSize;
    const list = db.prepare(`SELECT * FROM packages ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset) as Package[];
    return { list, total };
  }

  countByStatus(branchId?: number): Record<string, number> {
    const db = getDb();
    const where = branchId ? `WHERE branch_id = ${branchId}` : '';
    const rows = db.prepare(`SELECT status, COUNT(*) as count FROM packages ${where} GROUP BY status`).all() as any[];
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.status] = row.count;
    }
    return result;
  }

  countByBrand(branchId?: number): Record<string, number> {
    const db = getDb();
    const where = branchId ? `WHERE branch_id = ${branchId}` : '';
    const rows = db.prepare(`SELECT brand, COUNT(*) as count FROM packages ${where} GROUP BY brand`).all() as any[];
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.brand] = row.count;
    }
    return result;
  }

  sumFees(branchId?: number): { totalFee: number; totalSigned: number } {
    const db = getDb();
    const where = branchId ? `WHERE branch_id = ${branchId}` : '';
    const feeRow = db.prepare(`SELECT COALESCE(SUM(fee), 0) as totalFee FROM packages ${where}`).get() as any;
    const signedWhere = branchId ? `WHERE branch_id = ${branchId} AND status = 'signed'` : "WHERE status = 'signed'";
    const signedRow = db.prepare(`SELECT COALESCE(SUM(fee), 0) as totalSigned FROM packages ${signedWhere}`).get() as any;
    return { totalFee: feeRow.totalFee, totalSigned: signedRow.totalSigned };
  }

  updateStatus(id: number, status: string, extraFields: Record<string, any> = {}): boolean {
    const db = getDb();
    const sets = ['status = ?', 'updated_at = datetime("now", "localtime")'];
    const params: any[] = [status];
    for (const [key, value] of Object.entries(extraFields)) {
      sets.push(`${key} = ?`);
      params.push(value);
    }
    params.push(id);
    const result = db.prepare(`UPDATE packages SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return result.changes > 0;
  }

  create(data: Partial<Package>): number {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO packages (tracking_no, brand, type, status, branch_id, courier_id, sender_name, sender_phone, receiver_name, receiver_phone, weight, fee)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.tracking_no, data.brand, data.type, data.status || 'pending',
      data.branch_id, data.courier_id || null, data.sender_name, data.sender_phone,
      data.receiver_name, data.receiver_phone, data.weight, data.fee
    );
    return Number(result.lastInsertRowid);
  }
}
