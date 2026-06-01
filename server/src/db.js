const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let db;

function initDb(dbPath) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  createTables();
  return db;
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      type TEXT NOT NULL,
      location TEXT,
      lat REAL,
      lng REAL,
      status TEXT DEFAULT 'online',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS monitor_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER NOT NULL,
      value REAL NOT NULL,
      data_type TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      threshold_hit INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (station_id) REFERENCES stations(id)
    );

    CREATE INDEX IF NOT EXISTS idx_monitor_data_station ON monitor_data(station_id);
    CREATE INDEX IF NOT EXISTS idx_monitor_data_type ON monitor_data(data_type);
    CREATE INDEX IF NOT EXISTS idx_monitor_data_time ON monitor_data(recorded_at);

    CREATE TABLE IF NOT EXISTS thresholds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_type TEXT NOT NULL,
      warning_level TEXT NOT NULL,
      threshold_value REAL NOT NULL,
      comparison TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      level TEXT NOT NULL,
      affected_area TEXT NOT NULL,
      suggested_measures TEXT,
      valid_from TEXT,
      valid_to TEXT,
      issuer TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      template_id INTEGER,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_warnings_status ON warnings(status);
    CREATE INDEX IF NOT EXISTS idx_warnings_level ON warnings(level);
    CREATE INDEX IF NOT EXISTS idx_warnings_created ON warnings(created_at);

    CREATE TABLE IF NOT EXISTS warning_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      level TEXT NOT NULL,
      content TEXT NOT NULL,
      suggested_measures TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      channel_type TEXT NOT NULL,
      config TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS publish_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      warning_id INTEGER NOT NULL,
      channel_id INTEGER NOT NULL,
      batch_no TEXT NOT NULL,
      total_count INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      fail_count INTEGER DEFAULT 0,
      fail_list TEXT,
      status TEXT DEFAULT 'pending',
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (warning_id) REFERENCES warnings(id),
      FOREIGN KEY (channel_id) REFERENCES channels(id)
    );

    CREATE INDEX IF NOT EXISTS idx_publish_warning ON publish_records(warning_id);
    CREATE INDEX IF NOT EXISTS idx_publish_batch ON publish_records(batch_no);

    CREATE TABLE IF NOT EXISTS publish_failures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      publish_record_id INTEGER NOT NULL,
      target_id INTEGER NOT NULL,
      error_message TEXT,
      retry_count INTEGER DEFAULT 0,
      last_attempt_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (publish_record_id) REFERENCES publish_records(id),
      FOREIGN KEY (target_id) REFERENCES targets(id)
    );

    CREATE INDEX IF NOT EXISTS idx_pf_record ON publish_failures(publish_record_id);

    CREATE TABLE IF NOT EXISTS targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      target_type TEXT NOT NULL,
      contact TEXT,
      parent_id INTEGER,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      publish_record_id INTEGER NOT NULL,
      target_id INTEGER NOT NULL,
      confirm_status TEXT DEFAULT 'pending',
      confirm_time TEXT,
      forward_to TEXT,
      action_measures TEXT,
      feedback TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (publish_record_id) REFERENCES publish_records(id),
      FOREIGN KEY (target_id) REFERENCES targets(id)
    );

    CREATE INDEX IF NOT EXISTS idx_receipts_publish ON receipts(publish_record_id);
    CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(confirm_status);

    CREATE TABLE IF NOT EXISTS operations_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      operator TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_ops_log_action ON operations_log(action);
    CREATE INDEX IF NOT EXISTS idx_ops_log_time ON operations_log(created_at);
  `);
}

function getDb() {
  if (!db) {
    const dbPath = process.env.DB_PATH || './data/warning.db';
    return initDb(path.resolve(__dirname, '..', dbPath));
  }
  return db;
}

function logAction(action, targetType, targetId, operator, details) {
  const stmt = getDb().prepare(
    'INSERT INTO operations_log (action, target_type, target_id, operator, details) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run(action, targetType, targetId, operator, typeof details === 'object' ? JSON.stringify(details) : details);
}

module.exports = { initDb, getDb, logAction };