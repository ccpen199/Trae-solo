import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function initDb(): any {
  const dbPath = process.env.DB_PATH || './data/reader.db';
  const resolvedPath = path.resolve(process.cwd(), dbPath);
  const dir = path.dirname(resolvedPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  createIndexes();

  console.log(`[DB] Initialized at ${resolvedPath}`);
  return db;
}

export function getDb(): any {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

function createTables() {
  const sql = `
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#B8860B',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT,
      authors TEXT NOT NULL DEFAULT '[]',
      publisher TEXT,
      publish_date TEXT,
      isbn10 TEXT,
      isbn13 TEXT,
      category TEXT,
      cover_image TEXT,
      cover_image_data TEXT,
      total_pages INTEGER NOT NULL DEFAULT 0,
      current_page INTEGER NOT NULL DEFAULT 0,
      progress REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'not_started',
      tag_ids TEXT NOT NULL DEFAULT '[]',
      start_date TEXT,
      end_date TEXT,
      summary TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reading_sessions (
      id TEXT PRIMARY KEY,
      book_id TEXT,
      mode TEXT NOT NULL DEFAULT 'manual',
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      start_time TEXT NOT NULL,
      end_time TEXT,
      start_page INTEGER,
      end_page INTEGER,
      notes TEXT,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      book_id TEXT,
      title TEXT,
      content TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'manual',
      source_image_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS note_paragraphs (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      text TEXT NOT NULL,
      bbox TEXT,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS page_anchors (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL,
      page_number INTEGER NOT NULL,
      confidence REAL NOT NULL DEFAULT 1,
      comment TEXT,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'concept',
      description TEXT,
      aliases TEXT DEFAULT '[]',
      note_ids TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS entity_relations (
      id TEXT PRIMARY KEY,
      source_entity_id TEXT NOT NULL,
      target_entity_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      note_id TEXT NOT NULL,
      FOREIGN KEY (source_entity_id) REFERENCES entities(id) ON DELETE CASCADE,
      FOREIGN KEY (target_entity_id) REFERENCES entities(id) ON DELETE CASCADE
    );
  `;

  db!.exec(sql);
}

function createIndexes() {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_books_status ON books(status)',
    'CREATE INDEX IF NOT EXISTS idx_books_category ON books(category)',
    'CREATE INDEX IF NOT EXISTS idx_books_updated_at ON books(updated_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_book_id ON reading_sessions(book_id)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON reading_sessions(start_time DESC)',
    'CREATE INDEX IF NOT EXISTS idx_notes_book_id ON notes(book_id)',
    'CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_paragraphs_note_id ON note_paragraphs(note_id)',
    'CREATE INDEX IF NOT EXISTS idx_anchors_note_id ON page_anchors(note_id)',
    'CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type)',
    'CREATE INDEX IF NOT EXISTS idx_relations_source ON entity_relations(source_entity_id)',
    'CREATE INDEX IF NOT EXISTS idx_relations_target ON entity_relations(target_entity_id)',
  ];
  indexes.forEach(sql => db!.exec(sql));
}
