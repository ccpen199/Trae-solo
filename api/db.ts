import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const dataDir = path.join(projectRoot, 'data')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'app.sqlite')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initTables(db)
    seedData(db)
  }
  return db
}

function initTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('designer','pm','developer','researcher')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS schemes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      business_goal TEXT,
      user_roles TEXT DEFAULT '[]',
      key_flows TEXT DEFAULT '[]',
      prototype_link TEXT,
      state_diagram TEXT,
      review_scope TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','in_review','approved','rejected','archived')),
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheme_id INTEGER NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      step_order INTEGER DEFAULT 0,
      entry_condition TEXT,
      expected_result TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','reviewing','approved','issue')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      step_id INTEGER NOT NULL REFERENCES steps(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      issue_type TEXT CHECK(issue_type IN ('unclear_entry','missing_state','uncovered_exception','copy_risk','dev_cost','other')),
      parent_comment_id INTEGER REFERENCES comments(id) ON DELETE SET NULL,
      resolved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheme_id INTEGER NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
      dispute_point TEXT NOT NULL,
      alternatives TEXT DEFAULT '[]',
      chosen_index INTEGER DEFAULT 0,
      reason TEXT,
      affected_pages TEXT DEFAULT '[]',
      verification_method TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheme_id INTEGER NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
      version TEXT,
      summary TEXT,
      related_requirements TEXT DEFAULT '[]',
      pending_sync TEXT DEFAULT '[]',
      sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('pending','syncing','synced')),
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `)
}

function seedData(db: Database.Database): void {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) return

  const hash = bcrypt.hashSync('123456', 10)

  const insertUser = db.prepare(
    'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)'
  )

  insertUser.run('designer1', hash, 'designer')
  insertUser.run('pm1', hash, 'pm')
  insertUser.run('developer1', hash, 'developer')
  insertUser.run('researcher1', hash, 'researcher')
}
