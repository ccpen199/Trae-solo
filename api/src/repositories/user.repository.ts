import { db } from '../database/connection';
import type { User } from '../../../shared/types';
import crypto from 'crypto';

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  phone: string;
  role: string;
  outlet_id?: string;
  outlet_name?: string;
  device_fingerprint?: string;
  certification_status: string;
  avatar_url?: string;
  last_login_at?: string;
  created_at: string;
}

function rowToUser(row: UserRow & { outlet_name?: string }): User {
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

export const userRepository = {
  findByUsername(username: string): (User & { passwordHash: string }) | null {
    const row = db.prepare(`
      SELECT u.*, o.name as outlet_name
      FROM users u
      LEFT JOIN outlets o ON u.outlet_id = o.id
      WHERE u.username = ?
    `).get(username) as UserRow | undefined;

    if (!row) return null;

    return {
      ...rowToUser(row),
      passwordHash: row.password_hash,
    };
  },

  findById(id: string): User | null {
    const row = db.prepare(`
      SELECT u.*, o.name as outlet_name
      FROM users u
      LEFT JOIN outlets o ON u.outlet_id = o.id
      WHERE u.id = ?
    `).get(id) as UserRow | undefined;

    return row ? rowToUser(row) : null;
  },

  findAll(filters?: { role?: string; outletId?: string }): User[] {
    let sql = `
      SELECT u.*, o.name as outlet_name
      FROM users u
      LEFT JOIN outlets o ON u.outlet_id = o.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.role) {
      sql += ' AND u.role = ?';
      params.push(filters.role);
    }
    if (filters?.outletId) {
      sql += ' AND u.outlet_id = ?';
      params.push(filters.outletId);
    }

    sql += ' ORDER BY u.created_at DESC';

    const rows = db.prepare(sql).all(...params) as UserRow[];
    return rows.map(rowToUser);
  },

  create(userData: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'> & { password: string }): User {
    const id = crypto.randomUUID();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    db.prepare(`
      INSERT INTO users (id, username, password_hash, name, phone, role, outlet_id, 
                         device_fingerprint, certification_status, avatar_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userData.username,
      userData.password,
      userData.name,
      userData.phone,
      userData.role,
      userData.outletId || null,
      userData.deviceFingerprint || null,
      userData.certificationStatus,
      userData.avatar || null,
      now
    );

    return userRepository.findById(id)!;
  },

  update(id: string, userData: Partial<User & { password: string }>): User | null {
    const setClauses: string[] = [];
    const params: any[] = [];

    const fieldMap: Record<string, string> = {
      name: 'name',
      phone: 'phone',
      role: 'role',
      outletId: 'outlet_id',
      deviceFingerprint: 'device_fingerprint',
      certificationStatus: 'certification_status',
      avatar: 'avatar_url',
      password: 'password_hash',
    };

    Object.entries(userData).forEach(([key, value]) => {
      const dbField = fieldMap[key];
      if (dbField && value !== undefined) {
        setClauses.push(`${dbField} = ?`);
        params.push(value);
      }
    });

    if (setClauses.length === 0) return userRepository.findById(id);

    params.push(id);
    db.prepare(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);

    return userRepository.findById(id);
  },

  updateLastLogin(id: string): void {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now, id);
  },

  delete(id: string): boolean {
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
