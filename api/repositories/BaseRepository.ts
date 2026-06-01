import db from '../db/connection.js';
import type { Database } from 'better-sqlite3';

export abstract class BaseRepository<T> {
  protected db: Database = db;
  protected abstract tableName: string;

  protected mapRowToEntity(row: Record<string, unknown>): T {
    return row as unknown as T;
  }

  findById(id: number): T | null {
    const row = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`).get(id);
    return row ? this.mapRowToEntity(row as Record<string, unknown>) : null;
  }

  findAll(): T[] {
    const rows = this.db.prepare(`SELECT * FROM ${this.tableName} ORDER BY id DESC`).all();
    return rows.map(row => this.mapRowToEntity(row as Record<string, unknown>));
  }

  findPaginated(page: number = 1, pageSize: number = 20, where?: string, params: unknown[] = []): { items: T[]; total: number } {
    const offset = (page - 1) * pageSize;
    const whereClause = where ? `WHERE ${where}` : '';
    
    const totalRow = this.db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`).get(...params) as { count: number };
    const rows = this.db.prepare(`SELECT * FROM ${this.tableName} ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset) as unknown[];
    
    return {
      items: rows.map(row => this.mapRowToEntity(row as Record<string, unknown>)),
      total: totalRow.count
    };
  }

  delete(id: number): boolean {
    const result = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`).run(id);
    return result.changes > 0;
  }
}
