import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite';
const resolvedDbPath = path.resolve(__dirname, '..', dbPath);

const dataDir = path.dirname(resolvedDbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(resolvedDbPath);
db.pragma('journal_mode = WAL');

function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  db.pragma('foreign_keys = OFF');

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    db.exec(sql);
    console.log(`Migration executed: ${file}`);
  }

  db.pragma('foreign_keys = ON');
}

runMigrations();

export default db;
