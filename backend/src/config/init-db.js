const db = require('./database');

const initTables = () => {
  db.exec(`
    -- 用户/角色表
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      real_name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      email TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 税种配置表
    CREATE TABLE IF NOT EXISTS tax_types (
      id TEXT PRIMARY KEY,
      tax_code TEXT UNIQUE NOT NULL,
      tax_name TEXT NOT NULL,
      tax_rate DECIMAL(10,4) DEFAULT 0,
      description TEXT,
      calculation_rule TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 申报表配置表
    CREATE TABLE IF NOT EXISTS declaration_forms (
      id TEXT PRIMARY KEY,
      form_code TEXT UNIQUE NOT NULL,
      form_name TEXT NOT NULL,
      tax_type_id TEXT NOT NULL,
      version TEXT,
      fields_config TEXT,
      validation_rules TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tax_type_id) REFERENCES tax_types(id)
    );

    -- 主单表
    CREATE TABLE IF NOT EXISTS main_orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      tax_type_id TEXT NOT NULL,
      declaration_form_id TEXT,
      period_type TEXT,
      period_start DATE,
      period_end DATE,
      status TEXT DEFAULT 'draft',
      status_display TEXT DEFAULT '草稿',
      responsible_person_id TEXT,
      expected_complete_time DATETIME,
      actual_complete_time DATETIME,
      total_amount DECIMAL(18,2) DEFAULT 0,
      total_tax_amount DECIMAL(18,2) DEFAULT 0,
      risk_level TEXT DEFAULT 'none',
      risk_message TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      locked_by TEXT,
      locked_at DATETIME,
      is_locked INTEGER DEFAULT 0,
      FOREIGN KEY (tax_type_id) REFERENCES tax_types(id),
      FOREIGN KEY (declaration_form_id) REFERENCES declaration_forms(id),
      FOREIGN KEY (responsible_person_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- 明细表
    CREATE TABLE IF NOT EXISTS order_details (
      id TEXT PRIMARY KEY,
      main_order_id TEXT NOT NULL,
      detail_no TEXT NOT NULL,
      voucher_no TEXT,
      voucher_date DATE,
      item_name TEXT,
      item_type TEXT,
      amount DECIMAL(18,2) DEFAULT 0,
      tax_rate DECIMAL(10,4) DEFAULT 0,
      tax_amount DECIMAL(18,2) DEFAULT 0,
      deduction_amount DECIMAL(18,2) DEFAULT 0,
      net_amount DECIMAL(18,2) DEFAULT 0,
      status TEXT DEFAULT 'pending',
      tax_type_id TEXT,
      declaration_form_field TEXT,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id),
      FOREIGN KEY (tax_type_id) REFERENCES tax_types(id)
    );

    -- 状态流水表
    CREATE TABLE IF NOT EXISTS status_flows (
      id TEXT PRIMARY KEY,
      main_order_id TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      to_status_display TEXT,
      operator_id TEXT NOT NULL,
      operator_name TEXT,
      operation_type TEXT,
      operation_reason TEXT,
      operation_remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    -- 附件表
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      main_order_id TEXT,
      order_detail_id TEXT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      uploaded_by TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id),
      FOREIGN KEY (order_detail_id) REFERENCES order_details(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    -- 评论/审批表
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      main_order_id TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      operator_name TEXT,
      comment_type TEXT,
      content TEXT NOT NULL,
      parent_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    -- 通知/待办表
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      main_order_id TEXT,
      notification_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      is_read INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      priority TEXT DEFAULT 'normal',
      action_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id)
    );

    -- 审计日志表
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      operator_id TEXT NOT NULL,
      operator_name TEXT,
      module TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      before_value TEXT,
      after_value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    -- 统计快照表
    CREATE TABLE IF NOT EXISTS statistics_snapshots (
      id TEXT PRIMARY KEY,
      snapshot_date DATE NOT NULL,
      snapshot_type TEXT NOT NULL,
      tax_type_id TEXT,
      status TEXT,
      total_count INTEGER DEFAULT 0,
      total_amount DECIMAL(18,2) DEFAULT 0,
      total_tax_amount DECIMAL(18,2) DEFAULT 0,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tax_type_id) REFERENCES tax_types(id)
    );

    -- 税额规则表
    CREATE TABLE IF NOT EXISTS tax_rules (
      id TEXT PRIMARY KEY,
      rule_code TEXT UNIQUE NOT NULL,
      rule_name TEXT NOT NULL,
      tax_type_id TEXT,
      rule_type TEXT,
      priority INTEGER DEFAULT 0,
      conditions TEXT,
      calculation_formula TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tax_type_id) REFERENCES tax_types(id)
    );

    -- 回执表
    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY,
      main_order_id TEXT NOT NULL,
      receipt_no TEXT UNIQUE,
      receipt_type TEXT,
      receipt_date DATE,
      status TEXT,
      raw_data TEXT,
      parsed_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id)
    );

    -- 风险检查表
    CREATE TABLE IF NOT EXISTS risk_checks (
      id TEXT PRIMARY KEY,
      main_order_id TEXT NOT NULL,
      check_type TEXT,
      check_name TEXT,
      check_result TEXT,
      risk_level TEXT,
      risk_message TEXT,
      suggestion TEXT,
      checked_by TEXT,
      checked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id),
      FOREIGN KEY (checked_by) REFERENCES users(id)
    );

    -- 对账记录表
    CREATE TABLE IF NOT EXISTS reconciliation_logs (
      id TEXT PRIMARY KEY,
      main_order_id TEXT NOT NULL,
      check_item TEXT,
      expected_value TEXT,
      actual_value TEXT,
      difference TEXT,
      status TEXT,
      processed_by TEXT,
      processed_at DATETIME,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id),
      FOREIGN KEY (processed_by) REFERENCES users(id)
    );

    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_main_orders_status ON main_orders(status);
    CREATE INDEX IF NOT EXISTS idx_main_orders_responsible ON main_orders(responsible_person_id);
    CREATE INDEX IF NOT EXISTS idx_main_orders_created ON main_orders(created_by);
    CREATE INDEX IF NOT EXISTS idx_main_orders_period ON main_orders(period_start, period_end);
    CREATE INDEX IF NOT EXISTS idx_order_details_main ON order_details(main_order_id);
    CREATE INDEX IF NOT EXISTS idx_status_flows_main ON status_flows(main_order_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_operator ON audit_logs(operator_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
  `);
};

const initData = () => {
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existingUsers.count > 0) return;

  const passwordHash = bcrypt.hashSync('123456', 10);

  const users = [
    { id: uuidv4(), username: 'admin', real_name: '系统管理员', role: 'admin', password: passwordHash },
    { id: uuidv4(), username: 'finance1', real_name: '张三', role: 'finance', password: passwordHash },
    { id: uuidv4(), username: 'advisor1', real_name: '李四', role: 'tax_advisor', password: passwordHash },
    { id: uuidv4(), username: 'manager1', real_name: '王五', role: 'enterprise_manager', password: passwordHash },
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password, real_name, role, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `);

  users.forEach(user => {
    insertUser.run(user.id, user.username, user.password, user.real_name, user.role);
  });

  const taxTypes = [
    { id: uuidv4(), tax_code: 'VAT', tax_name: '增值税', tax_rate: 0.13 },
    { id: uuidv4(), tax_code: 'CIT', tax_name: '企业所得税', tax_rate: 0.25 },
    { id: uuidv4(), tax_code: 'PIT', tax_name: '个人所得税', tax_rate: 0.03 },
    { id: uuidv4(), tax_code: 'STAMP', tax_name: '印花税', tax_rate: 0.0005 },
  ];

  const insertTaxType = db.prepare(`
    INSERT INTO tax_types (id, tax_code, tax_name, tax_rate, is_active)
    VALUES (?, ?, ?, ?, 1)
  `);

  const taxTypeIdMap = {};
  taxTypes.forEach(tax => {
    insertTaxType.run(tax.id, tax.tax_code, tax.tax_name, tax.tax_rate);
    taxTypeIdMap[tax.tax_code] = tax.id;
  });

  const declarationForms = [
    { id: uuidv4(), form_code: 'VAT_FORM_01', form_name: '增值税纳税申报表', tax_code: 'VAT' },
    { id: uuidv4(), form_code: 'CIT_FORM_01', form_name: '企业所得税月(季)度预缴纳税申报表', tax_code: 'CIT' },
    { id: uuidv4(), form_code: 'PIT_FORM_01', form_name: '个人所得税扣缴申报表', tax_code: 'PIT' },
  ];

  const insertForm = db.prepare(`
    INSERT INTO declaration_forms (id, form_code, form_name, tax_type_id, is_active)
    VALUES (?, ?, ?, ?, 1)
  `);

  declarationForms.forEach(form => {
    insertForm.run(form.id, form.form_code, form.form_name, taxTypeIdMap[form.tax_code]);
  });
};

const init = () => {
  initTables();
  initData();
  console.log('数据库初始化完成');
};

module.exports = { init, db };
