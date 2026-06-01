const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS charts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT DEFAULT '未命名图表',
      type TEXT NOT NULL DEFAULT 'bar',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      settings TEXT DEFAULT '{}',
      style TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS chart_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chart_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      value REAL NOT NULL,
      color TEXT DEFAULT '#4F46E5',
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (chart_id) REFERENCES charts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS axis_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chart_id INTEGER NOT NULL UNIQUE,
      x_title TEXT DEFAULT 'X轴',
      y_title TEXT DEFAULT 'Y轴',
      y_min REAL DEFAULT 0,
      y_max REAL DEFAULT 100,
      y_interval REAL DEFAULT 20,
      show_grid INTEGER DEFAULT 1,
      show_align_line INTEGER DEFAULT 1,
      FOREIGN KEY (chart_id) REFERENCES charts(id) ON DELETE CASCADE
    );
  `);
}

module.exports = { db, initDatabase };
