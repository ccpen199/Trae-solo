import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance: Database.Database | null = null;

function getDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = process.env.DB_PATH || './data/app.sqlite';
  const resolvedDbPath = path.resolve(path.join(__dirname, '../../'), dbPath);

  const dbDir = path.dirname(resolvedDbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const storagePath = process.env.STORAGE_PATH || './storage';
  const resolvedStoragePath = path.resolve(path.join(__dirname, '../../'), storagePath);
  if (!fs.existsSync(resolvedStoragePath)) {
    fs.mkdirSync(resolvedStoragePath, { recursive: true });
  }

  dbInstance = new Database(resolvedDbPath);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  return dbInstance;
}

export default getDb();
