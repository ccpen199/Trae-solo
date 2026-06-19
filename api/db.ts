import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbPath = path.resolve(process.cwd(), 'data', 'classified.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.')
  }
  return db
}

export function initDb(): Database.Database {
  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      region_code TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL DEFAULT 0,
      province TEXT,
      city TEXT,
      district TEXT,
      author_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      risk_score INTEGER DEFAULT 0,
      is_top INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      leads INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
    CREATE INDEX IF NOT EXISTS idx_posts_location ON posts(province, city, district);
    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_posts_risk_score ON posts(risk_score);

    CREATE TABLE IF NOT EXISTS post_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      ocr_text TEXT,
      is_primary INTEGER DEFAULT 0,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS post_attributes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      license_no TEXT NOT NULL,
      license_verified INTEGER DEFAULT 0,
      deposit_amount REAL DEFAULT 0,
      deposit_status TEXT DEFAULT 'none',
      rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sensitive_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      hit_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS audit_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      auditor_id INTEGER NOT NULL,
      stage TEXT NOT NULL,
      result TEXT NOT NULL,
      comment TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (auditor_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_audit_stage ON audit_records(stage);
    CREATE INDEX IF NOT EXISTS idx_audit_auditor_id ON audit_records(auditor_id);

    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      key TEXT NOT NULL UNIQUE,
      org TEXT,
      permissions TEXT,
      call_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS geo_regions (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      level INTEGER NOT NULL,
      parent_code TEXT,
      post_count INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_geo_parent_code ON geo_regions(parent_code);
    CREATE INDEX IF NOT EXISTS idx_geo_level ON geo_regions(level);
  `)

  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
