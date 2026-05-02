import { getDatabase, Database } from '../database/index.js';
import { generateId, now } from '../utils/index.js';

export abstract class BaseRepository<T extends { id: string; created_at: number; updated_at: number }> {
  protected db: Database.Database;
  protected tableName: string;

  constructor(tableName: string) {
    this.db = getDatabase();
    this.tableName = tableName;
  }

  findById(id: string): T | null {
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.get(id) as T | undefined;
    return result || null;
  }

  findAll(): T[] {
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName}`);
    return stmt.all() as T[];
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  count(): number {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`);
    const result = stmt.get() as { count: number };
    return result.count;
  }

  protected prepareInsert(fields: string[]): Database.Statement {
    const placeholders = fields.map(() => '?').join(', ');
    const fieldNames = fields.join(', ');
    return this.db.prepare(`INSERT INTO ${this.tableName} (${fieldNames}) VALUES (${placeholders})`);
  }

  protected prepareUpdate(fields: string[]): Database.Statement {
    const setClauses = fields.map(f => `${f} = ?`).join(', ');
    return this.db.prepare(`UPDATE ${this.tableName} SET ${setClauses}, updated_at = ? WHERE id = ?`);
  }
}
