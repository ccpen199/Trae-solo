import { BaseRepository } from './BaseRepository.js';
import type { User } from '../../shared/types.js';

export class UserRepository extends BaseRepository<User> {
  protected tableName = 'users';

  protected mapRowToEntity(row: Record<string, unknown>): User {
    return {
      id: row.id as string,
      phone: row.phone as string,
      nickname: row.nickname as string,
      createdAt: row.created_at as string
    };
  }

  create(user: Omit<User, 'createdAt'>): string {
    const result = this.db.prepare(`
      INSERT INTO users (id, phone, nickname)
      VALUES (?, ?, ?)
    `).run(user.id, user.phone || null, user.nickname || null);
    return String(result.lastInsertRowid);
  }

  update(id: string, user: Partial<User>): boolean {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (user.phone !== undefined) { fields.push('phone = ?'); values.push(user.phone); }
    if (user.nickname !== undefined) { fields.push('nickname = ?'); values.push(user.nickname); }
    
    values.push(id);
    const result = this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return result.changes > 0;
  }

  findById(id: number | string): User | null {
    const row = this.db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
    return row ? this.mapRowToEntity(row as Record<string, unknown>) : null;
  }

  findByPhone(phone: string): User | null {
    const row = this.db.prepare(`SELECT * FROM users WHERE phone = ?`).get(phone);
    return row ? this.mapRowToEntity(row as Record<string, unknown>) : null;
  }

  getOrCreate(userId: string, phone?: string, nickname?: string): User {
    let user = this.findById(userId);
    if (!user) {
      this.create({ id: userId, phone, nickname });
      user = this.findById(userId);
    }
    return user!;
  }

  countByDateRange(startDate: string, endDate: string): number {
    const row = this.db.prepare(`
      SELECT COUNT(*) as count FROM users 
      WHERE DATE(created_at) BETWEEN DATE(?) AND DATE(?)
    `).get(startDate, endDate) as { count: number };
    return row.count;
  }
}
