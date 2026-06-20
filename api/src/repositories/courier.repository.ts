import { db } from '../database/connection';
import type { User } from '../../../shared/types';
import crypto from 'crypto';

interface CourierStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  exceptionTasks: number;
  totalWeight: number;
  totalFreight: number;
  todayTasks: number;
  todayCompleted: number;
}

function rowToUser(row: any): User {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role as User['role'],
    phone: row.phone,
    avatar: row.avatar_url,
    outletId: row.outlet_id,
    outletName: row.outlet_name,
    deviceFingerprint: row.device_fingerprint,
    certificationStatus: row.certification_status as User['certificationStatus'],
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  };
}

export const courierRepository = {
  findAll(filters?: { outletId?: string; page?: number; pageSize?: number }): { list: User[]; total: number } {
    const { outletId, page = 1, pageSize = 10 } = filters || {};
    
    let whereSql = "WHERE role = 'courier'";
    const params: any[] = [];

    if (outletId) {
      whereSql += ' AND outlet_id = ?';
      params.push(outletId);
    }

    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM users ${whereSql}
    `).get(...params) as { total: number };

    const offset = (page - 1) * pageSize;
    const rows = db.prepare(`
      SELECT u.*, o.name as outlet_name
      FROM users u
      LEFT JOIN outlets o ON u.outlet_id = o.id
      ${whereSql}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset) as any[];

    return {
      list: rows.map(rowToUser),
      total: countRow.total,
    };
  },

  findById(id: string): (User & { outletName?: string }) | null {
    const row = db.prepare(`
      SELECT u.*, o.name as outlet_name
      FROM users u
      LEFT JOIN outlets o ON u.outlet_id = o.id
      WHERE u.id = ? AND u.role = 'courier'
    `).get(id) as any | undefined;

    return row ? rowToUser(row) : null;
  },

  create(courierData: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'> & { password: string }): User {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    db.prepare(`
      INSERT INTO users (id, username, password_hash, name, phone, role, outlet_id, 
                         device_fingerprint, certification_status, avatar_url, created_at)
      VALUES (?, ?, ?, ?, ?, 'courier', ?, ?, ?, ?, ?)
    `).run(
      id,
      courierData.username,
      courierData.password,
      courierData.name,
      courierData.phone,
      courierData.outletId || null,
      courierData.deviceFingerprint || null,
      courierData.certificationStatus,
      courierData.avatar || null,
      now
    );

    return courierRepository.findById(id)!;
  },

  update(id: string, courierData: Partial<User & { password: string }>): User | null {
    const setClauses: string[] = [];
    const params: any[] = [];

    const fieldMap: Record<string, string> = {
      name: 'name',
      phone: 'phone',
      outletId: 'outlet_id',
      deviceFingerprint: 'device_fingerprint',
      certificationStatus: 'certification_status',
      avatar: 'avatar_url',
      password: 'password_hash',
    };

    Object.entries(courierData).forEach(([key, value]) => {
      const dbField = fieldMap[key];
      if (dbField && value !== undefined) {
        setClauses.push(`${dbField} = ?`);
        params.push(value);
      }
    });

    if (setClauses.length === 0) return courierRepository.findById(id);

    params.push(id);
    db.prepare(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ? AND role = 'courier'`).run(...params);

    return courierRepository.findById(id);
  },

  delete(id: string): boolean {
    const result = db.prepare("DELETE FROM users WHERE id = ? AND role = 'courier'").run(id);
    return result.changes > 0;
  },

  getStats(courierId: string, startDate?: string, endDate?: string): CourierStats {
    let dateFilter = '';
    const params: any[] = [courierId];

    if (startDate) {
      dateFilter += ' AND date(created_at) >= date(?)';
      params.push(startDate);
    }
    if (endDate) {
      dateFilter += ' AND date(created_at) <= date(?)';
      params.push(endDate);
    }

    const statsRow = db.prepare(`
      SELECT
        COUNT(*) as totalTasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedTasks,
        SUM(CASE WHEN status IN ('pending', 'assigned', 'picked', 'in_transit') THEN 1 ELSE 0 END) as pendingTasks,
        SUM(CASE WHEN status = 'exception' THEN 1 ELSE 0 END) as exceptionTasks,
        COALESCE(SUM(actual_weight), 0) as totalWeight,
        COALESCE(SUM(freight), 0) as totalFreight
      FROM pickup_tasks
      WHERE courier_id = ?${dateFilter}
    `).get(...params) as any;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStr = todayStart.toISOString().slice(0, 10);

    const todayRow = db.prepare(`
      SELECT
        COUNT(*) as todayTasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as todayCompleted
      FROM pickup_tasks
      WHERE courier_id = ? AND date(created_at) = date(?)
    `).get(courierId, todayStr) as any;

    return {
      totalTasks: statsRow.totalTasks || 0,
      completedTasks: statsRow.completedTasks || 0,
      pendingTasks: statsRow.pendingTasks || 0,
      exceptionTasks: statsRow.exceptionTasks || 0,
      totalWeight: statsRow.totalWeight || 0,
      totalFreight: statsRow.totalFreight || 0,
      todayTasks: todayRow.todayTasks || 0,
      todayCompleted: todayRow.todayCompleted || 0,
    };
  },
};
