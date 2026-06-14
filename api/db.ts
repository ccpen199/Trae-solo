import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function convertKeysToCamelCase<T = unknown>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    result[toCamelCase(key)] = obj[key];
  }
  return result as T;
}

function convertArrayToCamelCase<T = unknown>(arr: Record<string, unknown>[]): T[] {
  return arr.map(item => convertKeysToCamelCase<T>(item));
}

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const dbPath = path.join(dataDir, 'app.sqlite');
const migrationsDir = path.join(rootDir, 'migrations');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function runMigration(filePath: string): void {
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements: string[] = [];
  let currentStmt = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    if (inString) {
      currentStmt += char;
      if (char === stringChar && nextChar !== stringChar) {
        inString = false;
      } else if (char === stringChar && nextChar === stringChar) {
        currentStmt += nextChar;
        i++;
      }
    } else if (char === "'" || char === '"') {
      inString = true;
      stringChar = char;
      currentStmt += char;
    } else if (char === ';') {
      currentStmt = currentStmt.trim();
      if (currentStmt.length > 0 && !currentStmt.startsWith('--')) {
        statements.push(currentStmt);
      }
      currentStmt = '';
    } else if (char === '-' && nextChar === '-' && currentStmt.trim().length === 0) {
      while (i < sql.length && sql[i] !== '\n') {
        i++;
      }
    } else {
      currentStmt += char;
    }
  }

  currentStmt = currentStmt.trim();
  if (currentStmt.length > 0 && !currentStmt.startsWith('--')) {
    statements.push(currentStmt);
  }

  const transaction = db.transaction(() => {
    for (const stmt of statements) {
      db.exec(stmt);
    }
  });

  transaction();
}

function getMigrationVersion(): number {
  const row = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'",
    )
    .get();

  if (!row) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    return 0;
  }

  const result = db
    .prepare('SELECT MAX(version) as max_version FROM schema_migrations')
    .get() as { max_version: number | null };

  return result.max_version || 0;
}

function setMigrationVersion(version: number): void {
  db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(version);
}

export function initDatabase(): void {
  const currentVersion = getMigrationVersion();

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const match = file.match(/^(\d+)_/);
    if (!match) continue;

    const version = parseInt(match[1], 10);
    if (version > currentVersion) {
      const filePath = path.join(migrationsDir, file);
      runMigration(filePath);
      setMigrationVersion(version);
      console.log(`[DB] Executed migration: ${file}`);
    }
  }

  console.log('[DB] Database initialized successfully');
}

export function query<T = unknown>(sql: string, params: unknown[] = []): T[] {
  const stmt = db.prepare(sql);
  const result = stmt.all(...params) as Record<string, unknown>[];
  return convertArrayToCamelCase<T>(result);
}

export function queryOne<T = unknown>(sql: string, params: unknown[] = []): T | undefined {
  const stmt = db.prepare(sql);
  const result = stmt.get(...params) as Record<string, unknown> | undefined;
  return result ? convertKeysToCamelCase<T>(result) : undefined;
}

export function execute(sql: string, params: unknown[] = []): { changes: number; lastInsertRowid: bigint } {
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  return {
    changes: result.changes,
    lastInsertRowid: result.lastInsertRowid as bigint,
  };
}

export default db;
