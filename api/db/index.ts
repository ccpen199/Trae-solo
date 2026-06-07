import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const fullDbPath = path.resolve(projectRoot, dbPath);

const dbDir = path.dirname(fullDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(fullDbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
