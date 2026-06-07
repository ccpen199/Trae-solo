import db from '../db.js';

export class BaseRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  findAll(): T[] {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName}`);
    return stmt.all() as T[];
  }

  findById(id: number): T | undefined {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    return stmt.get(id) as T | undefined;
  }

  findByField(field: string, value: any): T | undefined {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE ${field} = ?`);
    return stmt.get(value) as T | undefined;
  }

  findManyByField(field: string, value: any): T[] {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE ${field} = ?`);
    return stmt.all(value) as T[];
  }

  create(data: Partial<T>): number {
    const keys = Object.keys(data).filter(k => data[k as keyof T] !== undefined);
    const values = keys.map(k => data[k as keyof T]);
    const placeholders = keys.map(() => '?').join(', ');
    
    const stmt = db.prepare(`
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders})
    `);
    
    const result = stmt.run(...values);
    return Number(result.lastInsertRowid);
  }

  update(id: number, data: Partial<T>): boolean {
    const keys = Object.keys(data).filter(k => data[k as keyof T] !== undefined);
    const values = keys.map(k => data[k as keyof T]);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    
    const stmt = db.prepare(`
      UPDATE ${this.tableName} 
      SET ${setClause}
      WHERE id = ?
    `);
    
    const result = stmt.run(...values, id);
    return result.changes > 0;
  }

  delete(id: number): boolean {
    const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  count(): number {
    const stmt = db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`);
    const result = stmt.get() as { count: number };
    return result.count;
  }

  paginate(page: number = 1, pageSize: number = 10, where?: string, params: any[] = []): { data: T[]; total: number; page: number; pageSize: number } {
    const offset = (page - 1) * pageSize;
    const whereClause = where ? `WHERE ${where}` : '';
    
    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`);
    const { count } = countStmt.get(...params) as { count: number };
    
    const dataStmt = db.prepare(`
      SELECT * FROM ${this.tableName} 
      ${whereClause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `);
    const data = dataStmt.all(...params, pageSize, offset) as T[];
    
    return { data, total: count, page, pageSize };
  }
}
