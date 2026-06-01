import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(__dirname, '../../data/hospital_transfer.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db: Database.Database = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
