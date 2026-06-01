import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite';
const resolvedDbPath = path.resolve(__dirname, '../../..', dbPath);

const dbDir = path.dirname(resolvedDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(resolvedDbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function runMigrations() {
  const migrationPath = path.resolve(__dirname, '../../..', 'migrations', '001_initial_schema.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  db.exec(migrationSQL);
  console.log('Database migrations completed');
}

export default db;
