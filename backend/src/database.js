const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dbDir = path.join(__dirname, '../data')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(path.join(dbDir, 'app.sqlite'))
db.pragma('journal_mode = WAL')

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      budget_source TEXT NOT NULL,
      indicator_no TEXT NOT NULL UNIQUE,
      project_unit TEXT NOT NULL,
      purpose TEXT NOT NULL,
      annual_quota DECIMAL(15,2) NOT NULL,
      available_balance DECIMAL(15,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      applicant TEXT NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      current_stage TEXT DEFAULT 'business',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS audit_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      stage TEXT NOT NULL,
      auditor TEXT NOT NULL,
      action TEXT NOT NULL,
      opinion TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS payment_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      batch_no TEXT NOT NULL,
      bank_result TEXT,
      failure_reason TEXT,
      retry_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS performance_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      application_id INTEGER,
      metric_name TEXT NOT NULL,
      metric_value DECIMAL(15,2),
      report_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  db.exec(`
    INSERT OR IGNORE INTO users (username, password, name, role) VALUES 
    ('admin', 'admin123', '系统管理员', 'admin'),
    ('business', 'business123', '张业务', 'business'),
    ('finance', 'finance123', '李财务', 'finance'),
    ('leader', 'leader123', '王领导', 'leader'),
    ('applicant', 'applicant123', '赵申请', 'applicant');
  `)

  const stmt = db.prepare("SELECT COUNT(*) as count FROM projects")
  const result = stmt.get()
  if (result.count === 0) {
    const insert = db.prepare(`
      INSERT INTO projects (budget_source, indicator_no, project_unit, purpose, annual_quota, available_balance)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    insert.run('一般公共预算', 'CZ-2024-001', '市教育局', '教育经费补助', 5000000.00, 5000000.00)
    insert.run('政府性基金', 'JJ-2024-002', '市卫健委', '医疗设备采购', 3000000.00, 3000000.00)
    insert.run('上级转移支付', 'ZY-2024-003', '市交通局', '公路建设专项', 10000000.00, 10000000.00)
  }
}

module.exports = { db, initDatabase }
