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
    CREATE TABLE IF NOT EXISTS experts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      professional_field TEXT NOT NULL,
      title TEXT,
      company TEXT NOT NULL,
      region TEXT NOT NULL,
      qualification_valid_until DATE,
      is_blacklisted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expert_review_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expert_id INTEGER NOT NULL,
      project_name TEXT NOT NULL,
      review_date DATE,
      role TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (expert_id) REFERENCES experts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      professional_field TEXT NOT NULL,
      expert_count INTEGER NOT NULL,
      alternate_count INTEGER DEFAULT 2,
      region TEXT,
      confidentiality_level TEXT DEFAULT '普通',
     回避_units TEXT,
      requirements TEXT,
      status TEXT DEFAULT 'pending',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS extraction_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      random_seed TEXT NOT NULL,
      candidate_pool TEXT NOT NULL,
      selected_experts TEXT NOT NULL,
      alternate_experts TEXT NOT NULL,
      supervisor TEXT,
      extracted_by TEXT,
      extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      extraction_id INTEGER NOT NULL,
      expert_id INTEGER NOT NULL,
      expert_name TEXT NOT NULL,
      is_alternate INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      reject_reason TEXT,
      response_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (extraction_id) REFERENCES extraction_records(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      details TEXT,
      operator TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_experts_field ON experts(professional_field);
    CREATE INDEX IF NOT EXISTS idx_experts_region ON experts(region);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
  `);
}

initDatabase();

module.exports = db;
