import type { User } from '@shared/types';
import { getDatabase } from '../config/database';

interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export class UserRepository {
  private db = getDatabase();

  findById(id: number): User | null {
    const row = this.db.prepare<UserRow, [number]>(`
      SELECT id, username, email, role, created_at, updated_at
      FROM users WHERE id = ?
    `).get(id);
    
    return row ? this.mapToUser(row) : null;
  }

  findByUsername(username: string): (User & { passwordHash: string }) | null {
    const row = this.db.prepare<UserRow, [string]>(`
      SELECT * FROM users WHERE username = ?
    `).get(username);
    
    return row ? { ...this.mapToUser(row), passwordHash: row.password_hash } : null;
  }

  findByEmail(email: string): (User & { passwordHash: string }) | null {
    const row = this.db.prepare<UserRow, [string]>(`
      SELECT * FROM users WHERE email = ?
    `).get(email);
    
    return row ? { ...this.mapToUser(row), passwordHash: row.password_hash } : null;
  }

  create(data: { username: string; email: string; passwordHash: string; role?: string }): User {
    const result = this.db.prepare(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run(data.username, data.email, data.passwordHash, data.role || 'user');

    return this.findById(result.lastInsertRowid as number)!;
  }

  findAll(): User[] {
    const rows = this.db.prepare<UserRow>(`
      SELECT id, username, email, role, created_at, updated_at
      FROM users ORDER BY created_at DESC
    `).all();
    
    return rows.map(row => this.mapToUser(row));
  }

  count(): number {
    const result = this.db.prepare<{ count: number }>(`
      SELECT COUNT(*) as count FROM users
    `).get();
    return result?.count || 0;
  }

  private mapToUser(row: UserRow): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role as User['role'],
      createdAt: row.created_at,
    };
  }
}
