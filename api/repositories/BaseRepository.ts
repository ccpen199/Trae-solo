import { getDatabase } from '../db/database.js';
import type { PaginatedResult } from '../types/index.js';

export abstract class BaseRepository<T> {
  protected db = getDatabase();
  protected abstract tableName: string;
  protected abstract columns: string[];

  public findById(id: number): T | null {
    const sql = `SELECT ${this.columns.join(', ')} FROM ${this.tableName} WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    return stmt.get(id) as T || null;
  }

  public findAll(): T[] {
    const sql = `SELECT ${this.columns.join(', ')} FROM ${this.tableName} ORDER BY id DESC`;
    const stmt = this.db.prepare(sql);
    return stmt.all() as T[];
  }

  public paginate(page: number = 1, pageSize: number = 10): PaginatedResult<T> {
    const offset = (page - 1) * pageSize;
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
    const dataSql = `SELECT ${this.columns.join(', ')} FROM ${this.tableName} ORDER BY id DESC LIMIT ? OFFSET ?`;
    
    const countStmt = this.db.prepare(countSql);
    const dataStmt = this.db.prepare(dataSql);
    
    const { total } = countStmt.get() as { total: number };
    const items = dataStmt.all(pageSize, offset) as T[];
    
    return {
      items,
      total,
      page,
      page_size: pageSize,
    };
  }

  public create(data: Partial<T>): number {
    const keys = Object.keys(data).filter(key => this.columns.includes(key) && key !== 'id');
    const values = keys.map(key => (data as Record<string, unknown>)[key]);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...values);
    return Number(result.lastInsertRowid);
  }

  public update(id: number, data: Partial<T>): boolean {
    const keys = Object.keys(data).filter(key => this.columns.includes(key) && key !== 'id');
    const values = keys.map(key => (data as Record<string, unknown>)[key]);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    const sql = `UPDATE ${this.tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...values, id);
    return result.changes > 0;
  }

  public delete(id: number): boolean {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  public count(): number {
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const stmt = this.db.prepare(sql);
    const result = stmt.get() as { count: number };
    return result.count;
  }

  public findByField(field: string, value: unknown): T | null {
    if (!this.columns.includes(field)) {
      return null;
    }
    const sql = `SELECT ${this.columns.join(', ')} FROM ${this.tableName} WHERE ${field} = ?`;
    const stmt = this.db.prepare(sql);
    return stmt.get(value) as T || null;
  }

  public findAllByField(field: string, value: unknown): T[] {
    if (!this.columns.includes(field)) {
      return [];
    }
    const sql = `SELECT ${this.columns.join(', ')} FROM ${this.tableName} WHERE ${field} = ? ORDER BY id DESC`;
    const stmt = this.db.prepare(sql);
    return stmt.all(value) as T[];
  }

  public exists(field: string, value: unknown): boolean {
    if (!this.columns.includes(field)) {
      return false;
    }
    const sql = `SELECT 1 FROM ${this.tableName} WHERE ${field} = ? LIMIT 1`;
    const stmt = this.db.prepare(sql);
    return !!stmt.get(value);
  }

  protected executeQuery<TResult>(sql: string, params: unknown[] = []): TResult[] {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as TResult[];
  }

  protected executeGet<TResult>(sql: string, params: unknown[] = []): TResult | null {
    const stmt = this.db.prepare(sql);
    return stmt.get(...params) as TResult || null;
  }

  protected executeRun(sql: string, params: unknown[] = []): { changes: number; lastInsertRowid: number } {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...params);
    return {
      changes: result.changes,
      lastInsertRowid: Number(result.lastInsertRowid),
    };
  }
}

export default BaseRepository;
