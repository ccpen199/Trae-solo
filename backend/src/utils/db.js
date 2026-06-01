const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '../../..', 'data', 'app.sqlite')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_type TEXT NOT NULL CHECK(user_type IN ('operator', 'project_owner', 'freelancer', 'finance', 'tax')),
      username TEXT UNIQUE NOT NULL,
      name TEXT,
      phone TEXT,
      id_card TEXT,
      id_card_verified INTEGER DEFAULT 0,
      agreement_status TEXT DEFAULT 'pending' CHECK(agreement_status IN ('pending', 'approved', 'rejected')),
      agreement_file TEXT,
      bank_name TEXT,
      bank_account TEXT,
      bank_account_name TEXT,
      tax_identity TEXT CHECK(tax_identity IN ('natural_person', 'individual_business', 'other')),
      risk_status TEXT DEFAULT 'normal' CHECK(risk_status IN ('normal', 'warning', 'blocked')),
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_owner_id INTEGER NOT NULL,
      project_name TEXT NOT NULL,
      project_code TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'closed')),
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (project_owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS task_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      batch_no TEXT UNIQUE NOT NULL,
      batch_name TEXT NOT NULL,
      total_tasks INTEGER DEFAULT 0,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'importing', 'completed', 'rejected')),
      created_by INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER NOT NULL,
      freelancer_id INTEGER NOT NULL,
      task_no TEXT NOT NULL,
      task_content TEXT,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      total_amount REAL NOT NULL,
      acceptance_status TEXT DEFAULT 'pending' CHECK(acceptance_status IN ('pending', 'approved', 'rejected')),
      rejection_reason TEXT,
      accepted_by INTEGER,
      accepted_at INTEGER,
      settled INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (batch_id) REFERENCES task_batches(id),
      FOREIGN KEY (freelancer_id) REFERENCES users(id),
      FOREIGN KEY (accepted_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS import_errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER NOT NULL,
      row_number INTEGER NOT NULL,
      error_message TEXT NOT NULL,
      row_data TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (batch_id) REFERENCES task_batches(id)
    );

    CREATE TABLE IF NOT EXISTS settlement_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_name TEXT UNIQUE NOT NULL,
      rule_type TEXT NOT NULL CHECK(rule_type IN ('platform_fee', 'tax', 'subsidy', 'deduction')),
      calculation_type TEXT NOT NULL CHECK(calculation_type IN ('percentage', 'fixed')),
      value REAL NOT NULL,
      min_value REAL,
      max_value REAL,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      settlement_no TEXT UNIQUE NOT NULL,
      freelancer_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      task_ids TEXT NOT NULL,
      total_task_amount REAL NOT NULL,
      platform_fee REAL DEFAULT 0,
      personal_tax REAL DEFAULT 0,
      subsidy REAL DEFAULT 0,
      deduction REAL DEFAULT 0,
      final_amount REAL NOT NULL,
      amount_adjustment_log TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'confirmed', 'paid', 'failed')),
      created_by INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (freelancer_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payment_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_no TEXT UNIQUE NOT NULL,
      batch_name TEXT NOT NULL,
      total_count INTEGER DEFAULT 0,
      total_amount REAL DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      success_amount REAL DEFAULT 0,
      fail_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'processing' CHECK(status IN ('processing', 'partial_success', 'success', 'failed')),
      bank_receipt TEXT,
      created_by INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_batch_id INTEGER NOT NULL,
      settlement_id INTEGER NOT NULL,
      freelancer_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'success', 'failed', 'retrying')),
      fail_reason TEXT,
      retry_count INTEGER DEFAULT 0,
      bank_serial_no TEXT,
      paid_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (payment_batch_id) REFERENCES payment_batches(id),
      FOREIGN KEY (settlement_id) REFERENCES settlements(id),
      FOREIGN KEY (freelancer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_no TEXT UNIQUE NOT NULL,
      voucher_type TEXT NOT NULL CHECK(voucher_type IN ('payment', 'tax', 'service')),
      related_id INTEGER NOT NULL,
      freelancer_id INTEGER,
      project_id INTEGER,
      file_path TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (freelancer_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operator_id INTEGER,
      operation_type TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      old_value TEXT,
      new_value TEXT,
      remark TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );
  `)

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get()
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (user_type, username, name, phone, id_card_verified, agreement_status, risk_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    insertUser.run('operator', 'admin', '系统管理员', '13800138000', 1, 'approved', 'normal')
    insertUser.run('finance', 'finance01', '财务小张', '13800138001', 1, 'approved', 'normal')
    insertUser.run('tax', 'tax01', '税务小李', '13800138002', 1, 'approved', 'normal')
    insertUser.run('project_owner', 'po01', '项目方老王', '13800138003', 1, 'approved', 'normal')
    insertUser.run('freelancer', 'fl01', '自由职业者小赵', '13800138004', 1, 'approved', 'normal')
  }

  const ruleCount = db.prepare('SELECT COUNT(*) as count FROM settlement_rules').get()
  if (ruleCount.count === 0) {
    const insertRule = db.prepare(`
      INSERT INTO settlement_rules (rule_name, rule_type, calculation_type, value)
      VALUES (?, ?, ?, ?)
    `)
    insertRule.run('平台服务费', 'platform_fee', 'percentage', 5.0)
    insertRule.run('个人所得税', 'tax', 'percentage', 20.0)
    insertRule.run('新人补贴', 'subsidy', 'fixed', 50.0)
  }
}

initTables()

module.exports = db
