const { run, exec, get } = require('./index');

const BILL_STATUSES = {
  PENDING_INPUT: 'pending_input',
  PENDING_ENDORSEMENT: 'pending_endorsement',
  PENDING_DISCOUNT: 'pending_discount',
  PENDING_MATURITY: 'pending_maturity',
  ARCHIVED: 'archived',
  DIFFERENCE: 'difference'
};

const BILL_TYPES = {
  BANK_ACCEPTANCE: 'bank_acceptance',
  COMMERCIAL_ACCEPTANCE: 'commercial_acceptance'
};

const initializeDatabase = async () => {
  console.log('开始初始化数据库...');

  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('finance', 'bank', 'supplier', 'customer', 'auditor', 'admin')),
      department TEXT,
      email TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1,
      version INTEGER DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_no TEXT UNIQUE NOT NULL,
      bill_type TEXT NOT NULL CHECK(bill_type IN ('bank_acceptance', 'commercial_acceptance')),
      bill_number TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      currency TEXT DEFAULT 'CNY',
      drawer TEXT NOT NULL,
      acceptor TEXT NOT NULL,
      payee TEXT NOT NULL,
      issue_date DATE NOT NULL,
      maturity_date DATE NOT NULL,
      due_date DATE,
      status TEXT NOT NULL DEFAULT 'pending_input' CHECK(status IN ('pending_input', 'pending_endorsement', 'pending_discount', 'pending_maturity', 'archived', 'difference')),
      responsible_person_id INTEGER,
      expected_complete_date DATE,
      risk_score REAL DEFAULT 0,
      risk_level TEXT DEFAULT 'low' CHECK(risk_level IN ('low', 'medium', 'high')),
      credit_limit_used REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      updated_by INTEGER,
      version INTEGER DEFAULT 1,
      is_deleted INTEGER DEFAULT 0,
      FOREIGN KEY (responsible_person_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (updated_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_bills_bill_no ON bills(bill_no);
    CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
    CREATE INDEX IF NOT EXISTS idx_bills_maturity_date ON bills(maturity_date);
    CREATE INDEX IF NOT EXISTS idx_bills_responsible ON bills(responsible_person_id);
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS bill_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      detail_no TEXT UNIQUE NOT NULL,
      item_type TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      description TEXT,
      related_bill_no TEXT,
      related_company TEXT,
      due_date DATE,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      version INTEGER DEFAULT 1,
      is_deleted INTEGER DEFAULT 0,
      FOREIGN KEY (bill_id) REFERENCES bills(id)
    );

    CREATE INDEX IF NOT EXISTS idx_bill_details_bill_id ON bill_details(bill_id);
    CREATE INDEX IF NOT EXISTS idx_bill_details_status ON bill_details(status);
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS bill_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      action TEXT NOT NULL,
      operator_id INTEGER,
      operator_name TEXT,
      comment TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_status_history_bill_id ON bill_status_history(bill_id);
    CREATE INDEX IF NOT EXISTS idx_status_history_created ON bill_status_history(created_at);
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS endorsements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endorsement_no TEXT UNIQUE NOT NULL,
      bill_id INTEGER NOT NULL,
      from_company TEXT NOT NULL,
      to_company TEXT NOT NULL,
      endorsement_date DATE NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'pending_info', 'reassigned')),
      operator_id INTEGER,
      approval_comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      version INTEGER DEFAULT 1,
      FOREIGN KEY (bill_id) REFERENCES bills(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_endorsements_bill_id ON endorsements(bill_id);
    CREATE INDEX IF NOT EXISTS idx_endorsements_status ON endorsements(status);
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS discount_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discount_no TEXT UNIQUE NOT NULL,
      bill_id INTEGER NOT NULL,
      bank_name TEXT NOT NULL,
      discount_amount REAL NOT NULL DEFAULT 0,
      discount_rate REAL NOT NULL DEFAULT 0,
      discount_date DATE,
      interest_amount REAL DEFAULT 0,
      actual_amount REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'processing')),
      operator_id INTEGER,
      approval_comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      version INTEGER DEFAULT 1,
      FOREIGN KEY (bill_id) REFERENCES bills(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_discount_bill_id ON discount_applications(bill_id);
    CREATE INDEX IF NOT EXISTS idx_discount_status ON discount_applications(status);
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS maturity_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reminder_no TEXT UNIQUE NOT NULL,
      bill_id INTEGER NOT NULL,
      reminder_type TEXT NOT NULL CHECK(reminder_type IN ('7_days', '3_days', '1_day', 'on_time', 'overdue')),
      reminder_date DATE NOT NULL,
      is_locked INTEGER DEFAULT 0,
      locked_by INTEGER,
      locked_at DATETIME,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'processed', 'ignored')),
      operator_id INTEGER,
      processed_comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills(id),
      FOREIGN KEY (locked_by) REFERENCES users(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_reminders_bill_id ON maturity_reminders(bill_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_date ON maturity_reminders(reminder_date);
    CREATE INDEX IF NOT EXISTS idx_reminders_locked ON maturity_reminders(is_locked);
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_no TEXT UNIQUE NOT NULL,
      bill_id INTEGER,
      operation_type TEXT NOT NULL,
      operation_module TEXT NOT NULL,
      operator_id INTEGER,
      operator_name TEXT,
      request_method TEXT,
      request_path TEXT,
      request_params TEXT,
      response_status TEXT,
      response_message TEXT,
      idempotent_key TEXT,
      data_version INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_logs_bill_id ON operation_logs(bill_id);
    CREATE INDEX IF NOT EXISTS idx_logs_operator ON operation_logs(operator_id);
    CREATE INDEX IF NOT EXISTS idx_logs_idempotent ON operation_logs(idempotent_key);
    CREATE INDEX IF NOT EXISTS idx_logs_created ON operation_logs(created_at);
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS difference_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      diff_no TEXT UNIQUE NOT NULL,
      bill_id INTEGER NOT NULL,
      diff_type TEXT NOT NULL CHECK(diff_type IN ('credit_limit', 'exchange_rate', 'invoice', 'callback', 'reconciliation')),
      diff_description TEXT,
      original_status TEXT,
      current_status TEXT DEFAULT 'open' CHECK(current_status IN ('open', 'processing', 'resolved', 'closed')),
      operator_id INTEGER,
      resolved_at DATETIME,
      resolution_comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_diff_bill_id ON difference_orders(bill_id);
    CREATE INDEX IF NOT EXISTS idx_diff_status ON difference_orders(current_status);
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attach_no TEXT UNIQUE NOT NULL,
      bill_id INTEGER,
      related_id INTEGER,
      related_type TEXT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      verified INTEGER DEFAULT 0,
      verified_by INTEGER,
      verified_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills(id),
      FOREIGN KEY (verified_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_attachments_bill_id ON attachments(bill_id);
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS credit_limits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT UNIQUE NOT NULL,
      total_limit REAL NOT NULL DEFAULT 0,
      used_limit REAL NOT NULL DEFAULT 0,
      available_limit REAL NOT NULL DEFAULT 0,
      currency TEXT DEFAULT 'CNY',
      valid_from DATE,
      valid_to DATE,
      risk_level TEXT DEFAULT 'low',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      version INTEGER DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_credit_company ON credit_limits(company_name);
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS tax_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_code TEXT UNIQUE NOT NULL,
      rule_name TEXT NOT NULL,
      rule_type TEXT NOT NULL CHECK(rule_type IN ('vat', 'stamp', 'interest', 'other')),
      tax_rate REAL NOT NULL DEFAULT 0,
      min_amount REAL DEFAULT 0,
      max_amount REAL,
      effective_date DATE,
      expiry_date DATE,
      is_active INTEGER DEFAULT 1,
      priority INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_tax_rules_code ON tax_rules(rule_code);
    CREATE INDEX IF NOT EXISTS idx_tax_rules_active ON tax_rules(is_active);
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS reconciliation_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recon_no TEXT UNIQUE NOT NULL,
      bill_id INTEGER,
      recon_type TEXT NOT NULL CHECK(recon_type IN ('bank', 'customer', 'supplier')),
      expected_amount REAL NOT NULL,
      actual_amount REAL NOT NULL,
      diff_amount REAL NOT NULL,
      recon_status TEXT DEFAULT 'pending' CHECK(recon_status IN ('pending', 'matched', 'unmatched', 'corrected')),
      corrected_amount REAL,
      correction_comment TEXT,
      operator_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_recon_bill_id ON reconciliation_records(bill_id);
    CREATE INDEX IF NOT EXISTS idx_recon_status ON reconciliation_records(recon_status);
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS idempotent_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idempotent_key TEXT UNIQUE NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      request_data TEXT,
      response_data TEXT,
      status TEXT DEFAULT 'processing' CHECK(status IN ('processing', 'success', 'failed')),
      retry_count INTEGER DEFAULT 0,
      max_retries INTEGER DEFAULT 3,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME
    );

    CREATE INDEX IF NOT EXISTS idx_idempotent_key ON idempotent_records(idempotent_key);
    CREATE INDEX IF NOT EXISTS idx_idempotent_status ON idempotent_records(status);
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      notification_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      related_bill_id INTEGER,
      related_type TEXT,
      is_read INTEGER DEFAULT 0,
      read_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (related_bill_id) REFERENCES bills(id)
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_bill ON notifications(related_bill_id);
  `);

  const adminExists = await get(`SELECT id FROM users WHERE username = ?`, ['admin']);
  
  if (!adminExists) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await run(`
      INSERT INTO users (username, password, name, role, department, email, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['admin', hashedPassword, '系统管理员', 'admin', '财务部', 'admin@bill.com', '13800138000']);

    const users = [
      { username: 'finance01', name: '张财务', role: 'finance', dept: '财务部', email: 'finance@bill.com' },
      { username: 'bank01', name: '李银行', role: 'bank', dept: '银行部', email: 'bank@bill.com' },
      { username: 'supplier01', name: '王供应商', role: 'supplier', dept: '供应商部', email: 'supplier@bill.com' },
      { username: 'customer01', name: '赵客户', role: 'customer', dept: '客户部', email: 'customer@bill.com' },
      { username: 'auditor01', name: '钱审计', role: 'auditor', dept: '审计部', email: 'auditor@bill.com' }
    ];

    for (const user of users) {
      const hashedPwd = await bcrypt.hash('123456', 10);
      await run(`
        INSERT INTO users (username, password, name, role, department, email, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [user.username, hashedPwd, user.name, user.role, user.dept, user.email, '13800138001']);
    }
  }

  const taxRulesExist = await get(`SELECT id FROM tax_rules LIMIT 1`);
  
  if (!taxRulesExist) {
    await run(`
      INSERT INTO tax_rules (rule_code, rule_name, rule_type, tax_rate, effective_date, priority)
      VALUES 
        ('VAT_001', '增值税一般税率', 'vat', 0.13, '2024-01-01', 1),
        ('STAMP_001', '印花税票据税率', 'stamp', 0.0005, '2024-01-01', 1),
        ('INTEREST_001', '贴现利息税率', 'interest', 0.06, '2024-01-01', 1)
    `);
  }

  const creditLimitsExist = await get(`SELECT id FROM credit_limits LIMIT 1`);
  
  if (!creditLimitsExist) {
    await run(`
      INSERT INTO credit_limits (company_name, total_limit, used_limit, available_limit, valid_from, valid_to, risk_level)
      VALUES 
        ('示例供应商有限公司', 1000000, 0, 1000000, '2024-01-01', '2024-12-31', 'low'),
        ('示例客户有限公司', 500000, 0, 500000, '2024-01-01', '2024-12-31', 'low')
    `);
  }

  console.log('数据库初始化完成！');
  console.log('默认用户: admin / admin123');
  console.log('其他用户: finance01, bank01, supplier01, customer01, auditor01 / 123456');
};

module.exports = {
  initializeDatabase,
  BILL_STATUSES,
  BILL_TYPES
};
