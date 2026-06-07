import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

const info = db.prepare('PRAGMA table_info(disputes)').all() as { name: string }[];
const cols = info.map(c => c.name);

if (!cols.includes('provider_id')) {
  db.exec('ALTER TABLE disputes ADD COLUMN provider_id INTEGER');
  console.log('Added provider_id column to disputes');
} else {
  console.log('provider_id column exists');
}

db.close();
