import { BaseRepository } from './BaseRepository.js';
import type { Admin } from '../../shared/types.js';

export class AdminRepository extends BaseRepository<Admin> {
  protected tableName = 'admins';

  protected mapRowToEntity(row: Record<string, unknown>): Admin {
    return {
      id: row.id as number,
      username: row.username as string,
      role: row.role as Admin['role'],
      createdAt: row.created_at as string
    };
  }

  findByUsername(username: string): (Admin & { passwordHash: string }) | null {
    const row = this.db.prepare(`
      SELECT * FROM admins WHERE username = ?
    `).get(username) as Record<string, unknown> | undefined;
    
    if (!row) return null;
    
    return {
      id: row.id as number,
      username: row.username as string,
      role: row.role as Admin['role'],
      createdAt: row.created_at as string,
      passwordHash: row.password_hash as string
    };
  }

  create(admin: Omit<Admin, 'id' | 'createdAt'> & { passwordHash: string }): number {
    const result = this.db.prepare(`
      INSERT INTO admins (username, password_hash, role)
      VALUES (?, ?, ?)
    `).run(admin.username, admin.passwordHash, admin.role);
    return result.lastInsertRowid as number;
  }

  updateRole(id: number, role: Admin['role']): boolean {
    const result = this.db.prepare(`
      UPDATE admins SET role = ? WHERE id = ?
    `).run(role, id);
    return result.changes > 0;
  }

  findByRole(role: Admin['role']): Admin[] {
    const rows = this.db.prepare(`SELECT * FROM admins WHERE role = ? ORDER BY id`).all(role);
    return rows.map(row => this.mapRowToEntity(row as Record<string, unknown>));
  }
}
