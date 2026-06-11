import { getDb } from '../database';
import { User } from '../types';

export class UserRepository {
  findByUsername(username: string): User | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;
  }

  findById(id: number): User | undefined {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
  }

  findAll(page: number = 1, pageSize: number = 20): { list: User[]; total: number } {
    const db = getDb();
    const offset = (page - 1) * pageSize;
    const total = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
    const list = db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?').all(pageSize, offset) as User[];
    return { list, total };
  }

  count(): number {
    const db = getDb();
    return (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  }

  countByRole(role: string): number {
    const db = getDb();
    return (db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get(role) as any).count;
  }

  create(data: { username: string; phone: string | null; password_hash: string; name: string; role: string }): number {
    const db = getDb();
    const result = db.prepare(
      'INSERT INTO users (username, phone, password_hash, name, role, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(data.username, data.phone, data.password_hash, data.name, data.role, 'active');
    return Number(result.lastInsertRowid);
  }
}
