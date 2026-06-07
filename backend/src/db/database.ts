import BetterSqlite3 from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envDbPath = process.env.DB_PATH || './data/app.sqlite';
const dbPath = resolve(__dirname, '../../', envDbPath);

mkdirSync(dirname(dbPath), { recursive: true });

const db: BetterSqlite3.Database = new BetterSqlite3(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
