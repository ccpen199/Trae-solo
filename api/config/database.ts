import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const resolvedDbPath = path.resolve(dbPath);

const dbDir = path.dirname(resolvedDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(resolvedDbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

type Row = Record<string, unknown>;
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type Param = unknown;

function parseJsonFields<T>(row: Row | null, jsonFields: string[]): T | undefined {
  if (!row) return undefined;
  const result: Row = { ...row };
  for (const field of jsonFields) {
    const value = result[field];
    if (value !== null && value !== undefined && typeof value === 'string') {
      try {
        result[field] = JSON.parse(value);
      } catch {
        // keep original value if parsing fails
      }
    }
  }
  return result as T;
}

function serializeJsonValues(params: Param[]): Param[] {
  return params.map(param => {
    if (param !== null && typeof param === 'object' && !Array.isArray(param) && !(param instanceof Buffer)) {
      return JSON.stringify(param);
    }
    if (Array.isArray(param)) {
      return JSON.stringify(param);
    }
    return param;
  });
}

export function run(sql: string, params: Param[] = []): Database.RunResult {
  const serializedParams = serializeJsonValues(params);
  return db.prepare(sql).run(...serializedParams);
}

export function query<T = unknown>(sql: string, params: Param[] = [], jsonFields: string[] = []): T[] {
  const serializedParams = serializeJsonValues(params);
  const rows = db.prepare(sql).all(...serializedParams) as Row[];
  return rows.map(row => parseJsonFields<T>(row, jsonFields) as T);
}

export function get<T = unknown>(sql: string, params: Param[] = [], jsonFields: string[] = []): T | undefined {
  const serializedParams = serializeJsonValues(params);
  const row = db.prepare(sql).get(...serializedParams) as Row | undefined;
  return parseJsonFields<T>(row, jsonFields);
}

export function exec(sql: string): void {
  db.exec(sql);
}

export default db;
