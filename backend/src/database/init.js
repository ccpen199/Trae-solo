import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../data/app.sqlite');

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

const initDb = () => {
  db.exec(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('borrower', 'manager', 'risk_expert', 'approval_director')),
      name TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 借款人详情表
    CREATE TABLE IF NOT EXISTS borrowers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      id_card TEXT UNIQUE,
      bank_card TEXT,
      address TEXT,
      credit_level TEXT DEFAULT 'A',
      credit_score INTEGER DEFAULT 650,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 贷款进件表
    CREATE TABLE IF NOT EXISTS loan_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_no TEXT UNIQUE NOT NULL,
      borrower_id INTEGER NOT NULL,
      manager_id INTEGER,
      risk_expert_id INTEGER,
      approval_director_id INTEGER,
      loan_amount DECIMAL(15,2) NOT NULL,
      loan_term INTEGER NOT NULL,
      interest_rate DECIMAL(5,4) DEFAULT 0.0065,
      purpose TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN (
        'draft', 'returned_for_edit', 'submitted', 'fraud_checking', 'pending_initial_review',
        'manager_processing', 'pending_risk_review', 'risk_reviewing', 'pending_approval',
        'approval_in_progress', 'multi_signing', 'approved', 'lending', 'repaid',
        'overdue', 'rejected', 'cancelled', 'awaiting_confirmation', 'active', 'draft_submitted'
      )),
      credit_score INTEGER,
      fraud_risk_level TEXT DEFAULT 'low' CHECK(fraud_risk_level IN ('low', 'medium', 'high', 'critical')),
      fraud_tags TEXT,
      credit_report_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      submitted_at DATETIME,
      FOREIGN KEY (borrower_id) REFERENCES borrowers(id),
      FOREIGN KEY (manager_id) REFERENCES users(id),
      FOREIGN KEY (risk_expert_id) REFERENCES users(id),
      FOREIGN KEY (approval_director_id) REFERENCES users(id)
    );

    -- 申请资料表
    CREATE TABLE IF NOT EXISTS application_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      document_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      uploaded_by INTEGER NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES loan_applications(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    -- 审批意见表
    CREATE TABLE IF NOT EXISTS approval_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      action TEXT NOT NULL,
      comment TEXT,
      decision TEXT CHECK(decision IN ('approve', 'reject', 'return', 'escalate')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES loan_applications(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 会签记录表
    CREATE TABLE IF NOT EXISTS signing_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      sign_order INTEGER NOT NULL,
      signer_id INTEGER NOT NULL,
      signer_role TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      comment TEXT,
      signed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES loan_applications(id),
      FOREIGN KEY (signer_id) REFERENCES users(id)
    );

    -- 电子借据表
    CREATE TABLE IF NOT EXISTS electronic_contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER UNIQUE NOT NULL,
      contract_no TEXT UNIQUE NOT NULL,
      contract_content TEXT NOT NULL,
      borrower_confirmed_at DATETIME,
      manager_confirmed_at DATETIME,
      signed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES loan_applications(id)
    );

    -- 还款计划表
    CREATE TABLE IF NOT EXISTS repayment_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      period INTEGER NOT NULL,
      due_date DATE NOT NULL,
      principal_amount DECIMAL(15,2) NOT NULL,
      interest_amount DECIMAL(15,2) NOT NULL,
      total_amount DECIMAL(15,2) NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'overdue', 'partially_paid')),
      paid_at DATETIME,
      actual_paid_amount DECIMAL(15,2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES loan_applications(id),
      UNIQUE(application_id, period)
    );

    -- 还款流水表
    CREATE TABLE IF NOT EXISTS repayment_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL,
      application_id INTEGER NOT NULL,
      transaction_no TEXT UNIQUE NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      payment_method TEXT,
      status TEXT DEFAULT 'processing' CHECK(status IN ('processing', 'success', 'failed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (schedule_id) REFERENCES repayment_schedules(id),
      FOREIGN KEY (application_id) REFERENCES loan_applications(id)
    );

    -- 催收记录表
    CREATE TABLE IF NOT EXISTS collection_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      schedule_id INTEGER NOT NULL,
      collector_id INTEGER,
      collection_type TEXT NOT NULL,
      collection_comment TEXT,
      next_follow_up_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES loan_applications(id),
      FOREIGN KEY (schedule_id) REFERENCES repayment_schedules(id),
      FOREIGN KEY (collector_id) REFERENCES users(id)
    );

    -- 风控命中标
    CREATE TABLE IF NOT EXISTS risk_hits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      risk_type TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      rule_name TEXT NOT NULL,
      rule_id TEXT,
      hit_details TEXT,
      suggestion TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES loan_applications(id)
    );

    -- 额度控制表
    CREATE TABLE IF NOT EXISTS credit_limits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      borrower_id INTEGER UNIQUE NOT NULL,
      total_limit DECIMAL(15,2) DEFAULT 0,
      used_limit DECIMAL(15,2) DEFAULT 0,
      available_limit DECIMAL(15,2) DEFAULT 0,
      max_single_loan DECIMAL(15,2) DEFAULT 50000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (borrower_id) REFERENCES borrowers(id)
    );

    -- 审计日志表
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      role TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      before_state TEXT,
      after_state TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 规则引擎规则表
    CREATE TABLE IF NOT EXISTS rule_engine_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_name TEXT UNIQUE NOT NULL,
      rule_category TEXT NOT NULL,
      rule_logic TEXT NOT NULL,
      rule_parameters TEXT,
      is_active INTEGER DEFAULT 1,
      priority INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_loan_status ON loan_applications(status);
    CREATE INDEX IF NOT EXISTS idx_loan_borrower ON loan_applications(borrower_id);
    CREATE INDEX IF NOT EXISTS idx_loan_manager ON loan_applications(manager_id);
    CREATE INDEX IF NOT EXISTS idx_repayment_due ON repayment_schedules(due_date);
    CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(created_at);
  `);

  console.log('Database tables initialized successfully.');
};

const insertInitialData = () => {
  const users = [
    { username: 'borrower1', password: bcrypt.hashSync('123456', 10), role: 'borrower', name: '张三', phone: '13800138001' },
    { username: 'manager1', password: bcrypt.hashSync('123456', 10), role: 'manager', name: '李经理', phone: '13800138002' },
    { username: 'risk1', password: bcrypt.hashSync('123456', 10), role: 'risk_expert', name: '王风控', phone: '13800138003' },
    { username: 'approval1', password: bcrypt.hashSync('123456', 10), role: 'approval_director', name: '赵总监', phone: '13800138004' }
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, password, role, name, phone)
    VALUES (@username, @password, @role, @name, @phone)
  `);

  for (const user of users) {
    const result = insertUser.run(user);
    if (result.lastInsertRowid && user.role === 'borrower') {
      db.prepare(`
        INSERT OR IGNORE INTO borrowers (user_id, id_card, credit_level, credit_score)
        VALUES (?, ?, 'A', 680)
      `).run(result.lastInsertRowid, '110101199001011234');

      db.prepare(`
        INSERT OR IGNORE INTO credit_limits (borrower_id, total_limit, available_limit, max_single_loan)
        VALUES ((SELECT id FROM borrowers WHERE user_id = ?), 200000, 200000, 100000)
      `).run(result.lastInsertRowid);
    }
  }

  const rules = [
    { rule_name: '贷款额度上限', rule_category: 'limit', rule_logic: 'application.loan_amount <= 500000', rule_parameters: '{"max_amount": 500000}', is_active: 1, priority: 1 },
    { rule_name: '最低信用分阈值', rule_category: 'credit', rule_logic: 'borrower.credit_score >= 500', rule_parameters: '{"min_score": 500}', is_active: 1, priority: 2 },
    { rule_name: '高风险拒贷', rule_category: 'fraud', rule_logic: 'application.fraud_risk_level != "critical"', rule_parameters: '{}', is_active: 1, priority: 3 },
    { rule_name: '贷款期限限制', rule_category: 'limit', rule_logic: 'application.loan_term BETWEEN 3 AND 36', rule_parameters: '{"min_term": 3, "max_term": 36}', is_active: 1, priority: 1 }
  ];

  const insertRule = db.prepare(`
    INSERT OR IGNORE INTO rule_engine_rules (rule_name, rule_category, rule_logic, rule_parameters, is_active, priority)
    VALUES (@rule_name, @rule_category, @rule_logic, @rule_parameters, @is_active, @priority)
  `);

  for (const rule of rules) {
    insertRule.run(rule);
  }

  console.log('Initial data inserted.');
};

export { db, initDb, insertInitialData };
