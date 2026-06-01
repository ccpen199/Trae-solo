const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      inventors TEXT,
      college TEXT,
      maturity_level TEXT,
      ownership_clear INTEGER DEFAULT 0,
      ownership_remark TEXT,
      patent_number TEXT,
      paper_doi TEXT,
      software_copyright TEXT,
      prototype_description TEXT,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      achievement_id INTEGER NOT NULL,
      version INTEGER DEFAULT 1,
      market_scene TEXT,
      tech_advantage TEXT,
      conclusion TEXT,
      expert_opinion TEXT,
      valuation_basis TEXT,
      valuation_amount REAL,
      status TEXT DEFAULT 'pending',
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      industry TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS engagements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      achievement_id INTEGER NOT NULL,
      company_id INTEGER NOT NULL,
      status TEXT DEFAULT 'initial',
      nda_signed INTEGER DEFAULT 0,
      nda_date TEXT,
      trial_progress TEXT,
      requirement_gap TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS communication_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      engagement_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      content TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      achievement_id INTEGER NOT NULL,
      engagement_id INTEGER,
      contract_number TEXT UNIQUE,
      license_type TEXT,
      amount REAL,
      payment_schedule TEXT,
      inventor_share REAL,
      college_share REAL,
      status TEXT DEFAULT 'draft',
      signed_date TEXT,
      effective_date TEXT,
      expiry_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
      FOREIGN KEY (engagement_id) REFERENCES engagements(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS contract_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER NOT NULL,
      version INTEGER DEFAULT 1,
      change_type TEXT,
      change_content TEXT,
      reason TEXT,
      approved_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT,
      actual_date TEXT,
      status TEXT DEFAULT 'pending',
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS revenue_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id INTEGER NOT NULL,
      contract_id INTEGER NOT NULL,
      achievement_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      inventor_amount REAL,
      college_amount REAL,
      university_amount REAL,
      inventor_distributed INTEGER DEFAULT 0,
      college_distributed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
      FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
      FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT,
      role TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO users (username, name, role) VALUES 
    ('admin', '系统管理员', 'admin'),
    ('researcher', '科研人员', 'researcher'),
    ('tto', '技术转移办公室', 'tto'),
    ('legal', '法务', 'legal');
  `);
}

initDatabase();

module.exports = db;
