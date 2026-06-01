import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.resolve(process.cwd(), 'data', 'app.sqlite');
    const dbDir = path.dirname(dbPath);
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    runMigrations(db);
    seedInitialData(db);
  }
  return db;
}

function runMigrations(db: Database.Database): void {
  const migrationsDir = path.resolve(process.cwd(), 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    return;
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      db.exec(sql);
      console.log(`Migration applied: ${file}`);
    } catch (err) {
      console.error(`Error applying migration ${file}:`, err);
      throw err;
    }
  }
}

function seedInitialData(db: Database.Database): void {
  const checkUser = db.prepare('SELECT COUNT(*) as count FROM users');
  const result = checkUser.get() as { count: number };
  
  if (result.count === 0) {
    console.log('Seeding initial data...');
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
