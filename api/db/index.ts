import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { schema, seedData } from './schema.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite';
const dbDir = path.dirname(path.resolve(__dirname, '..', '..', dbPath));

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.resolve(__dirname, '..', '..', dbPath));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(schema);

const tableCount = db.prepare("SELECT COUNT(*) as count FROM hs_codes").get() as { count: number };
if (tableCount.count === 0) {
  db.exec(seedData);
  console.log('Database seeded with initial data');
}

export default db;
