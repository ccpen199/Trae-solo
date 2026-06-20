import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config';
import { seedDatabase } from './seed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initTables() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  const tablesExist = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='outlets'"
  ).get();

  if (!tablesExist) {
    db.exec(schema);
  }
}

initTables();

const hasData = db.prepare("SELECT COUNT(*) as count FROM outlets").get() as { count: number };
if (hasData.count === 0) {
  seedDatabase(db);
}

export { db };
export default db;
