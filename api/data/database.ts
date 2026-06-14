import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export let db: sqlite3.Database;

export async function initDatabase(): Promise<void> {
  const projectRoot = path.resolve(__dirname, '../..');
  const dbPath = process.env.DATABASE_PATH
    ? path.resolve(projectRoot, process.env.DATABASE_PATH)
    : path.join(projectRoot, 'data/database.db');

  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Failed to open database:', err.message);
      throw err;
    }
    console.log('Connected to SQLite database');
  });

  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');
  });

  const migrationPath = path.join(__dirname, '../../migrations/001_init.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

  await executeMultipleStatements(migrationSql);
  console.log('Database migration completed');
}

async function executeMultipleStatements(sql: string): Promise<void> {
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await new Promise<void>((resolve, reject) => {
      db.run(statement, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

export function run(sql: string, params: unknown[] = []): Promise<sqlite3.RunResult> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (this: sqlite3.RunResult, err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

export function get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
}

export function all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

export function closeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else {
        console.log('Database connection closed');
        resolve();
      }
    });
  });
}

export async function isDatabaseEmpty(): Promise<boolean> {
  const tableExists = await get<{ count: number }>(
    "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='properties'"
  );
  if (!tableExists || tableExists.count === 0) {
    return true;
  }
  const result = await get<{ count: number }>('SELECT COUNT(*) as count FROM properties');
  return result?.count === 0;
}
