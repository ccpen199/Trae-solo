import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { schema, initialData } from './schema';

const dbPath = path.join(__dirname, '../../data/copyright.db');
const dataDir = path.join(__dirname, '../../data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: Database.Database;

try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
} catch (error) {
  console.error('Failed to connect to database:', error);
  throw error;
}

export function initDatabase(): void {
  const createTables = db.transaction(() => {
    db.exec(schema);
    console.log('Database tables created successfully');
  });

  try {
    createTables();
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

export function seedDatabase(): void {
  const insertSeed = db.transaction(() => {
    db.exec(initialData);
    console.log('Seed data inserted successfully');
  });

  try {
    insertSeed();
  } catch (error) {
    console.error('Error inserting seed data:', error);
    throw error;
  }
}

export function getDatabase(): Database.Database {
  return db;
}

export default db;
