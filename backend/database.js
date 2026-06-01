const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite';
const db = new Database(path.join(__dirname, '..', dbPath));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS certificate_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_code TEXT UNIQUE NOT NULL,
      template_name TEXT NOT NULL,
      certificate_type TEXT NOT NULL,
      fields TEXT NOT NULL,
      validity_period INTEGER NOT NULL,
      validity_unit TEXT DEFAULT 'day',
      signature_rules TEXT,
      applicable_items TEXT,
      version INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS template_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      template_code TEXT NOT NULL,
      template_name TEXT NOT NULL,
      certificate_type TEXT NOT NULL,
      fields TEXT NOT NULL,
      validity_period INTEGER NOT NULL,
      validity_unit TEXT DEFAULT 'day',
      signature_rules TEXT,
      applicable_items TEXT,
      version INTEGER NOT NULL,
      change_reason TEXT,
      changed_by TEXT,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES certificate_templates(id)
    );

    CREATE TABLE IF NOT EXISTS applicants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_name TEXT NOT NULL,
      id_type TEXT NOT NULL,
      id_number TEXT UNIQUE NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS approval_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_code TEXT UNIQUE NOT NULL,
      item_name TEXT NOT NULL,
      template_id INTEGER,
      applicant_id INTEGER,
      status TEXT DEFAULT 'pending',
      approval_result TEXT,
      approver TEXT,
      approval_time DATETIME,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES certificate_templates(id),
      FOREIGN KEY (applicant_id) REFERENCES applicants(id)
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      certificate_number TEXT UNIQUE NOT NULL,
      template_id INTEGER NOT NULL,
      template_version INTEGER NOT NULL,
      approval_item_id INTEGER,
      applicant_id INTEGER NOT NULL,
      issuing_authority TEXT NOT NULL,
      issuer TEXT NOT NULL,
      issue_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiry_date DATETIME NOT NULL,
      certificate_data TEXT NOT NULL,
      signature TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES certificate_templates(id),
      FOREIGN KEY (approval_item_id) REFERENCES approval_items(id),
      FOREIGN KEY (applicant_id) REFERENCES applicants(id)
    );

    CREATE TABLE IF NOT EXISTS certificate_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      certificate_id INTEGER NOT NULL,
      operation_type TEXT NOT NULL,
      change_reason TEXT NOT NULL,
      legal_basis TEXT,
      operator TEXT NOT NULL,
      effective_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      old_status TEXT,
      new_status TEXT,
      old_expiry_date DATETIME,
      new_expiry_date DATETIME,
      old_data TEXT,
      new_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (certificate_id) REFERENCES certificates(id)
    );

    CREATE TABLE IF NOT EXISTS verification_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      certificate_number TEXT NOT NULL,
      caller TEXT NOT NULL,
      purpose TEXT NOT NULL,
      verification_result TEXT NOT NULL,
      verification_details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_type TEXT NOT NULL,
      caller TEXT,
      ip_address TEXT,
      access_count INTEGER,
      time_window TEXT,
      alert_level TEXT DEFAULT 'warning',
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_cert_number ON certificates(certificate_number);
    CREATE INDEX IF NOT EXISTS idx_cert_status ON certificates(status);
    CREATE INDEX IF NOT EXISTS idx_verify_cert ON verification_logs(certificate_number);
    CREATE INDEX IF NOT EXISTS idx_verify_time ON verification_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_verify_caller ON verification_logs(caller);
  `);

  const adminUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!adminUser) {
    db.prepare('INSERT INTO users (username, password, role, department) VALUES (?, ?, ?, ?)').run(
      'admin',
      'admin123',
      'admin',
      '系统管理部'
    );
  }

  const operatorUser = db.prepare('SELECT * FROM users WHERE username = ?').get('operator');
  if (!operatorUser) {
    db.prepare('INSERT INTO users (username, password, role, department) VALUES (?, ?, ?, ?)').run(
      'operator',
      'operator123',
      'operator',
      '证照签发科'
    );
  }

  const verifierUser = db.prepare('SELECT * FROM users WHERE username = ?').get('verifier');
  if (!verifierUser) {
    db.prepare('INSERT INTO users (username, password, role, department) VALUES (?, ?, ?, ?)').run(
      'verifier',
      'verifier123',
      'verifier',
      '核验中心'
    );
  }

  const approverUser = db.prepare('SELECT * FROM users WHERE username = ?').get('approver');
  if (!approverUser) {
    db.prepare('INSERT INTO users (username, password, role, department) VALUES (?, ?, ?, ?)').run(
      'approver',
      'approver123',
      'approver',
      '审批科'
    );
  }

  const applicantUser = db.prepare('SELECT * FROM users WHERE username = ?').get('applicant');
  if (!applicantUser) {
    db.prepare('INSERT INTO users (username, password, role, department) VALUES (?, ?, ?, ?)').run(
      'applicant',
      'applicant123',
      'applicant',
      '企业用户'
    );
  }
}

module.exports = { db, initDatabase };
