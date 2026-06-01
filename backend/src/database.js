const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('lawyer', 'assistant', 'client', 'manager')),
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_number TEXT UNIQUE NOT NULL,
      case_name TEXT NOT NULL,
      case_type TEXT,
      status TEXT DEFAULT 'active',
      court TEXT,
      plaintiff TEXT,
      defendant TEXT,
      filing_date DATE,
      hearing_date DATE,
      description TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS case_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(case_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS evidence_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
      group_name TEXT NOT NULL,
      group_order INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
      group_id INTEGER REFERENCES evidence_groups(id) ON DELETE SET NULL,
      evidence_number TEXT NOT NULL,
      evidence_name TEXT NOT NULL,
      evidence_type TEXT,
      source TEXT,
      obtain_date DATE,
      confidentiality_level TEXT DEFAULT 'normal',
      original_status TEXT DEFAULT 'original',
      proof_purpose TEXT,
      dispute_focus TEXT,
      file_name TEXT,
      file_path TEXT,
      file_size INTEGER,
      file_type TEXT,
      upload_batch TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      version INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN DEFAULT 1,
      withdrawn_reason TEXT,
      withdrawn_by INTEGER REFERENCES users(id),
      withdrawn_at DATETIME,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS evidence_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evidence_id INTEGER REFERENCES evidence(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      evidence_number TEXT NOT NULL,
      evidence_name TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      changed_by INTEGER REFERENCES users(id),
      change_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      record_id INTEGER,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS export_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER REFERENCES cases(id),
      export_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT,
      watermark TEXT,
      exported_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const adminExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('admin');
  if (adminExists.count === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (username, password, name, role, email)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', hash, '系统管理员', 'manager', 'admin@example.com');

    const lawyerHash = bcrypt.hashSync('lawyer123', 10);
    db.prepare(`
      INSERT INTO users (username, password, name, role, email)
      VALUES (?, ?, ?, ?, ?)
    `).run('lawyer1', lawyerHash, '张律师', 'lawyer', 'zhang@example.com');

    const assistantHash = bcrypt.hashSync('assistant123', 10);
    db.prepare(`
      INSERT INTO users (username, password, name, role, email)
      VALUES (?, ?, ?, ?, ?)
    `).run('assistant1', assistantHash, '李助理', 'assistant', 'li@example.com');

    const clientHash = bcrypt.hashSync('client123', 10);
    db.prepare(`
      INSERT INTO users (username, password, name, role, email)
      VALUES (?, ?, ?, ?, ?)
    `).run('client1', clientHash, '王客户', 'client', 'wang@example.com');
  }
}

initDatabase();

module.exports = db;
