import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'app.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export function queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined;
}

export function queryMany<T>(sql: string, params: unknown[] = []): T[] {
  return db.prepare(sql).all(...params) as T[];
}

export function execute(sql: string, params: unknown[] = []): Database.RunResult {
  return db.prepare(sql).run(...params);
}

export function transaction(fn: () => void): void {
  const tx = db.transaction(fn);
  tx();
}
