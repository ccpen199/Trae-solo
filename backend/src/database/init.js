const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

function initDatabase() {
  const dbPath = path.join(__dirname, '../../data/app.sqlite');
  const db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      real_name TEXT NOT NULL,
      role_id INTEGER NOT NULL,
      email TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id),
      UNIQUE(role_id, action, resource)
    );

    CREATE TABLE IF NOT EXISTS rule_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT UNIQUE NOT NULL,
      description TEXT,
      rules_json TEXT,
      is_active INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS qualifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      level TEXT,
      certificate_no TEXT,
      issuing_authority TEXT,
      issue_date DATE,
      expiry_date DATE,
      status TEXT DEFAULT 'valid',
      attachment_path TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bid_no TEXT UNIQUE NOT NULL,
      project_name TEXT NOT NULL,
      purchaser TEXT,
      bid_deadline DATETIME,
      budget_amount DECIMAL(15,2),
      status TEXT DEFAULT 'draft',
      rule_version_id INTEGER,
      current_node TEXT DEFAULT 'upload',
      previous_node TEXT,
      previous_conclusion TEXT,
      attachment_path TEXT,
      raw_text TEXT,
      created_by INTEGER NOT NULL,
      owner_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rule_version_id) REFERENCES rule_versions(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bid_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bid_id INTEGER NOT NULL,
      section TEXT,
      item_no TEXT,
      item_content TEXT NOT NULL,
      score_weight DECIMAL(5,2),
      requirement_level TEXT,
      is_required INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      ai_analysis TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bid_item_id INTEGER NOT NULL,
      bid_id INTEGER NOT NULL,
      content TEXT,
      ai_generated TEXT,
      human_edited TEXT,
      status TEXT DEFAULT 'draft',
      matched_qualification_ids TEXT,
      evidence_paths TEXT,
      reviewer_id INTEGER,
      review_comment TEXT,
      reviewed_at DATETIME,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bid_item_id) REFERENCES bid_items(id) ON DELETE CASCADE,
      FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bid_qualifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bid_id INTEGER NOT NULL,
      qualification_id INTEGER NOT NULL,
      match_score DECIMAL(5,2) DEFAULT 0,
      is_required INTEGER DEFAULT 0,
      status TEXT DEFAULT 'matched',
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE CASCADE,
      FOREIGN KEY (qualification_id) REFERENCES qualifications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS missing_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bid_id INTEGER NOT NULL,
      check_type TEXT NOT NULL,
      item_name TEXT NOT NULL,
      is_missing INTEGER DEFAULT 1,
      severity TEXT DEFAULT 'warning',
      suggestion TEXT,
      resolved_by INTEGER,
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE CASCADE,
      FOREIGN KEY (resolved_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS business_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bid_id INTEGER,
      action_type TEXT NOT NULL,
      action_detail TEXT,
      status TEXT NOT NULL,
      operator_id INTEGER,
      owner_id INTEGER,
      reviewer_id INTEGER,
      exception_reason TEXT,
      rule_version TEXT,
      metadata_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bid_id) REFERENCES bids(id),
      FOREIGN KEY (operator_id) REFERENCES users(id),
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      bid_id INTEGER,
      action TEXT NOT NULL,
      resource TEXT,
      resource_id INTEGER,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (bid_id) REFERENCES bids(id)
    );

    CREATE TABLE IF NOT EXISTS exception_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bid_id INTEGER,
      operation TEXT NOT NULL,
      error_type TEXT NOT NULL,
      error_message TEXT,
      raw_request TEXT,
      compensation_action TEXT,
      manual_remark TEXT,
      operator_id INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (bid_id) REFERENCES bids(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS status_transitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bid_id INTEGER NOT NULL,
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      transition_reason TEXT,
      operator_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE CASCADE,
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bid_id INTEGER,
      qualification_id INTEGER,
      response_id INTEGER,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE CASCADE,
      FOREIGN KEY (qualification_id) REFERENCES qualifications(id) ON DELETE CASCADE,
      FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);
    CREATE INDEX IF NOT EXISTS idx_bids_owner ON bids(owner_id);
    CREATE INDEX IF NOT EXISTS idx_bids_created ON bids(created_at);
    CREATE INDEX IF NOT EXISTS idx_ledger_bid ON business_ledger(bid_id);
    CREATE INDEX IF NOT EXISTS idx_ledger_status ON business_ledger(status);
    CREATE INDEX IF NOT EXISTS idx_ledger_operator ON business_ledger(operator_id);
    CREATE INDEX IF NOT EXISTS idx_ledger_created ON business_ledger(created_at);
    CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exception_logs(status);
    CREATE INDEX IF NOT EXISTS idx_qualifications_status ON qualifications(status);
  `);

  const roleCount = db.prepare('SELECT COUNT(*) as count FROM roles').get();
  if (roleCount.count === 0) {
    const insertRole = db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)');
    insertRole.run('business_owner', '业务负责人');
    insertRole.run('model_operator', '模型运营');
    insertRole.run('reviewer', '审核人员');
    insertRole.run('user', '一线使用者');
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('123456', 10);
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, real_name, role_id, email, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `);
    insertUser.run('owner', hashedPassword, '张经理', 1, 'owner@company.com');
    insertUser.run('operator', hashedPassword, '李运营', 2, 'operator@company.com');
    insertUser.run('reviewer', hashedPassword, '王审核', 3, 'reviewer@company.com');
    insertUser.run('user', hashedPassword, '赵用户', 4, 'user@company.com');
  }

  const ruleCount = db.prepare('SELECT COUNT(*) as count FROM rule_versions').get();
  if (ruleCount.count === 0) {
    const insertRule = db.prepare(`
      INSERT INTO rule_versions (version, description, is_active, created_by)
      VALUES (?, ?, 1, 1)
    `);
    insertRule.run('v1.0.0', '初始版本规则，包含基础标书解析和评分项校验');
  }

  const permCount = db.prepare('SELECT COUNT(*) as count FROM permissions').get();
  if (permCount.count === 0) {
    const insertPerm = db.prepare('INSERT INTO permissions (role_id, action, resource) VALUES (?, ?, ?)');
    const perms = [
      [1, '*', '*'],
      [2, 'create', 'bid'], [2, 'read', 'bid'], [2, 'update', 'bid'], [2, 'parse', 'bid'],
      [2, 'generate', 'response'], [2, 'match', 'qualification'],
      [3, 'read', 'bid'], [3, 'review', 'response'], [3, 'approve', 'bid'],
      [4, 'create', 'bid'], [4, 'read', 'bid'], [4, 'update', 'bid'], [4, 'export', 'bid']
    ];
    perms.forEach(p => insertPerm.run(p[0], p[1], p[2]));
  }

  const qualCount = db.prepare('SELECT COUNT(*) as count FROM qualifications').get();
  if (qualCount.count === 0) {
    const insertQual = db.prepare(`
      INSERT INTO qualifications (name, type, level, certificate_no, issuing_authority, issue_date, expiry_date, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    insertQual.run('建筑工程施工总承包一级资质', '施工资质', '一级', 'JZ-2023-001', '住建部', '2023-01-15', '2028-01-14', 'valid');
    insertQual.run('ISO9001质量管理体系认证', '体系认证', 'AAA', 'ISO-2023-088', '中国质量认证中心', '2023-06-01', '2026-05-31', 'valid');
    insertQual.run('高新技术企业证书', '企业资质', '国家级', 'GX-2022-1234', '科技部', '2022-10-01', '2025-09-30', 'valid');
    insertQual.run('安全生产许可证', '安全资质', '', 'AQ-2024-0567', '应急管理部', '2024-01-01', '2025-12-31', 'expired');
  }

  return db;
}

module.exports = initDatabase;
