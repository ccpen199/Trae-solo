-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_card VARCHAR(18) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  phone VARCHAR(11) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK(user_type IN ('resident','flexible','admin_tax','admin_ops')),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 参保信息表
CREATE TABLE IF NOT EXISTS insurance_info (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  insurance_type VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'insured',
  pay_grade INTEGER NOT NULL,
  total_months INTEGER NOT NULL DEFAULT 0,
  government_subsidy DECIMAL(12,2) NOT NULL DEFAULT 0,
  personal_account DECIMAL(12,2) NOT NULL DEFAULT 0,
  insured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 缴费订单表
CREATE TABLE IF NOT EXISTS payment_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no VARCHAR(32) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  insurance_type VARCHAR(30) NOT NULL,
  pay_year INTEGER NOT NULL,
  pay_grade INTEGER NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  tax_invoice_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  finance_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  medical_credit_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 家庭共济表
CREATE TABLE IF NOT EXISTS family_mutual_aid (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  relative_id_card VARCHAR(18) NOT NULL,
  relative_name VARCHAR(50) NOT NULL,
  relationship VARCHAR(20) NOT NULL,
  auth_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  used_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending_verify',
  verified_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 养老金发放表
CREATE TABLE IF NOT EXISTS pension_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  pay_month VARCHAR(7) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  bank_name VARCHAR(50),
  bank_account VARCHAR(30),
  status VARCHAR(20) NOT NULL DEFAULT 'paid',
  paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 异常预警表
CREATE TABLE IF NOT EXISTS payment_warnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  warning_type VARCHAR(30) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  handler_id INTEGER,
  handled_at DATETIME,
  handle_note TEXT,
  triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- 稽核规则表
CREATE TABLE IF NOT EXISTS audit_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_name VARCHAR(100) NOT NULL,
  rule_code VARCHAR(50) UNIQUE NOT NULL,
  rule_condition TEXT NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  threshold INTEGER,
  enabled BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_insurance_user ON insurance_info(user_id);
CREATE INDEX IF NOT EXISTS idx_order_user ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_family_user ON family_mutual_aid(user_id);
CREATE INDEX IF NOT EXISTS idx_warning_user ON payment_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_warning_status ON payment_warnings(status);
