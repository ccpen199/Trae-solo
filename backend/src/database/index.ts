import initSqlJs, { Database as SqlJsDatabase, SqlValue } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import { createTablesSQL, initDataSQL } from './schema';

export class Database {
  private db: SqlJsDatabase | null = null;
  private dbPath: string;
  private inTransaction: boolean = false;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  async initialize(): Promise<void> {
    const SQL = await initSqlJs();
    
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }

    this.createTables();
    this.initData();
    this.save();
  }

  private createTables(): void {
    if (!this.db) return;
    for (const sql of createTablesSQL) {
      this.db.run(sql);
    }
  }

  private initData(): void {
    if (!this.db) return;
    for (const sql of initDataSQL) {
      try {
        this.db.run(sql);
      } catch (e) {
        console.log('Init data skipped (probably already exists):', e);
      }
    }
  }

  save(): void {
    if (!this.db) return;
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
  }

  private runInternal(sql: string, params?: (string | number | null)[]): { lastInsertRowid: number; changes: number } {
    if (!this.db) throw new Error('Database not initialized');
    this.db.run(sql, params || []);
    const lastInsertRowid = this.db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number || 0;
    const changes = this.db.exec('SELECT changes() as cnt')[0]?.values[0]?.[0] as number || 0;
    return { lastInsertRowid, changes };
  }

  run(sql: string, params?: (string | number | null)[]): { lastInsertRowid: number; changes: number } {
    const result = this.runInternal(sql, params);
    if (!this.inTransaction) {
      this.save();
    }
    return result;
  }

  get<T>(sql: string, params?: (string | number | null)[]): T | undefined {
    if (!this.db) throw new Error('Database not initialized');
    const stmt = this.db.prepare(sql, params || []);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row as T;
    }
    stmt.free();
    return undefined;
  }

  all<T>(sql: string, params?: (string | number | null)[]): T[] {
    if (!this.db) throw new Error('Database not initialized');
    const results = this.db.exec(sql, params || []);
    if (results.length === 0) return [];
    
    const columns = results[0].columns;
    const values = results[0].values;
    
    return values.map((row: SqlValue[]) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col: string, i: number) => {
        const value = row[i];
        if (value instanceof Uint8Array) {
          obj[col] = Buffer.from(value).toString('base64');
        } else {
          obj[col] = value;
        }
      });
      return obj as T;
    });
  }

  exec(sql: string): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.run(sql);
    if (!this.inTransaction) {
      this.save();
    }
  }

  transaction(callback: () => void): void {
    if (this.inTransaction) {
      throw new Error('Nested transactions are not supported');
    }

    this.inTransaction = true;
    let committed = false;

    try {
      this.runInternal('BEGIN TRANSACTION');
      callback();
      this.runInternal('COMMIT');
      committed = true;
      this.save();
    } catch (e) {
      if (!committed) {
        try {
          this.runInternal('ROLLBACK');
        } catch (rollbackError) {
          console.warn('Rollback failed (transaction may already be rolled back):', rollbackError);
        }
      }
      throw e;
    } finally {
      this.inTransaction = false;
    }
  }

  close(): void {
    if (this.db) {
      this.save();
      this.db.close();
      this.db = null;
    }
  }
}

let databaseInstance: Database | null = null;

export async function getDatabase(dbPath: string): Promise<Database> {
  if (!databaseInstance) {
    databaseInstance = new Database(dbPath);
    await databaseInstance.initialize();
  }
  return databaseInstance;
}
