require('dotenv').config({ path: '../.env' });
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', process.env.DB_PATH || './database/app.sqlite');
const db = new Database(dbPath);

db.exec(`
  DROP TABLE IF EXISTS marketing_effects;
  DROP TABLE IF EXISTS repayment_plans;
  DROP TABLE IF EXISTS installment_applications;
  DROP TABLE IF EXISTS touch_records;
  DROP TABLE IF EXISTS customer_segments;
  DROP TABLE IF EXISTS segment_rules;
  DROP TABLE IF EXISTS installment_products;
  DROP TABLE IF EXISTS customers;

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_no VARCHAR(16) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(11) NOT NULL,
    card_level VARCHAR(20) NOT NULL DEFAULT '普通',
    credit_limit DECIMAL(12,2) NOT NULL DEFAULT 10000,
    available_limit DECIMAL(12,2) NOT NULL DEFAULT 10000,
    bill_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    overdue_days INTEGER NOT NULL DEFAULT 0,
    risk_level VARCHAR(20) NOT NULL DEFAULT '低',
    consumption_industries TEXT,
    installment_history_count INTEGER NOT NULL DEFAULT 0,
    is_excluded BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS segment_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    rule_version VARCHAR(20) NOT NULL,
    card_levels TEXT,
    min_bill_amount DECIMAL(12,2),
    max_bill_amount DECIMAL(12,2),
    industries TEXT,
    risk_levels TEXT,
    min_installment_history INTEGER,
    exclude_existing BOOLEAN NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_by VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customer_segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    segment_rule_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    rule_version VARCHAR(20) NOT NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (segment_rule_id) REFERENCES segment_rules(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    UNIQUE(segment_rule_id, customer_id, rule_version)
  );

  CREATE TABLE IF NOT EXISTS installment_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    periods INTEGER NOT NULL,
    base_rate DECIMAL(6,4) NOT NULL,
    preferential_rate DECIMAL(6,4),
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    min_amount DECIMAL(12,2) NOT NULL DEFAULT 1000,
    max_amount DECIMAL(12,2) NOT NULL DEFAULT 500000,
    applicable_card_levels TEXT,
    applicable_risk_levels TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_by VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS touch_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    product_id INTEGER,
    segment_rule_id INTEGER,
    channel VARCHAR(20) NOT NULL,
    touch_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    result VARCHAR(20) NOT NULL,
    follow_up_status VARCHAR(20) DEFAULT '待处理',
    operator VARCHAR(50),
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_id) REFERENCES installment_products(id),
    FOREIGN KEY (segment_rule_id) REFERENCES segment_rules(id)
  );

  CREATE TABLE IF NOT EXISTS installment_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_no VARCHAR(32) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    periods INTEGER NOT NULL,
    monthly_payment DECIMAL(12,2) NOT NULL,
    total_fee DECIMAL(12,2) NOT NULL,
    applied_rate DECIMAL(6,4) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT '待审批',
    risk_review_result VARCHAR(20),
    review_remark TEXT,
    reviewed_by VARCHAR(50),
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_id) REFERENCES installment_products(id)
  );

  CREATE TABLE IF NOT EXISTS repayment_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    period_no INTEGER NOT NULL,
    due_date DATE NOT NULL,
    principal DECIMAL(12,2) NOT NULL,
    fee DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT '待还款',
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES installment_applications(id)
  );

  CREATE TABLE IF NOT EXISTS marketing_effects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    segment_rule_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    touch_count INTEGER NOT NULL DEFAULT 0,
    application_count INTEGER NOT NULL DEFAULT 0,
    approved_count INTEGER NOT NULL DEFAULT 0,
    total_approved_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    last_touch_at DATETIME,
    last_application_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (segment_rule_id) REFERENCES segment_rules(id),
    FOREIGN KEY (product_id) REFERENCES installment_products(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    UNIQUE(segment_rule_id, product_id, customer_id)
  );

  CREATE INDEX IF NOT EXISTS idx_customers_card_level ON customers(card_level);
  CREATE INDEX IF NOT EXISTS idx_customers_risk_level ON customers(risk_level);
  CREATE INDEX IF NOT EXISTS idx_touch_records_customer ON touch_records(customer_id);
  CREATE INDEX IF NOT EXISTS idx_touch_records_follow_up ON touch_records(follow_up_status);
  CREATE INDEX IF NOT EXISTS idx_applications_customer ON installment_applications(customer_id);
  CREATE INDEX IF NOT EXISTS idx_applications_status ON installment_applications(status);
  CREATE INDEX IF NOT EXISTS idx_repayment_plans_application ON repayment_plans(application_id);
`);

const insertCustomers = db.prepare(`
  INSERT OR IGNORE INTO customers 
  (card_no, name, phone, card_level, credit_limit, available_limit, bill_amount, overdue_days, risk_level, consumption_industries, installment_history_count, is_excluded)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const sampleCustomers = [
  ['6222020100010001', '张三', '13800138001', '白金', 100000, 85000, 15000, 0, '低', '餐饮,酒店,购物', 3, 0],
  ['6222020100010002', '李四', '13800138002', '金卡', 50000, 42000, 8000, 0, '低', '购物,娱乐', 1, 0],
  ['6222020100010003', '王五', '13800138003', '普通', 20000, 18000, 2000, 15, '中', '餐饮,商超', 0, 0],
  ['6222020100010004', '赵六', '13800138004', '白金', 150000, 120000, 30000, 0, '低', '酒店,航空,购物', 5, 0],
  ['6222020100010005', '钱七', '13800138005', '金卡', 60000, 55000, 5000, 0, '低', '商超,餐饮', 2, 0],
  ['6222020100010006', '孙八', '13800138006', '普通', 15000, 10000, 5000, 45, '高', '娱乐', 0, 1],
  ['6222020100010007', '周九', '13800138007', '钻石', 300000, 280000, 20000, 0, '低', '航空,酒店,购物,餐饮', 8, 0],
  ['6222020100010008', '吴十', '13800138008', '金卡', 55000, 40000, 15000, 5, '中', '购物,餐饮,商超', 1, 0],
];

sampleCustomers.forEach(c => insertCustomers.run(...c));

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO installment_products 
  (name, periods, base_rate, preferential_rate, start_date, end_date, min_amount, max_amount, applicable_card_levels, applicable_risk_levels, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const now = new Date().toISOString();
const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

const sampleProducts = [
  ['3期账单分期', 3, 0.0080, 0.0060, now, nextMonth, 1000, 50000, '["普通","金卡","白金","钻石"]', '["低","中"]', '系统'],
  ['6期账单分期', 6, 0.0075, 0.0055, now, nextMonth, 1000, 100000, '["金卡","白金","钻石"]', '["低","中"]', '系统'],
  ['12期账单分期', 12, 0.0070, 0.0050, now, nextMonth, 5000, 200000, '["白金","钻石"]', '["低"]', '系统'],
  ['24期账单分期', 24, 0.0065, 0.0045, now, nextMonth, 10000, 500000, '["白金","钻石"]', '["低"]', '系统'],
];

sampleProducts.forEach(p => insertProduct.run(...p));

console.log('数据库初始化完成！');
console.log(`已插入 ${sampleCustomers.length} 个测试客户`);
console.log(`已插入 ${sampleProducts.length} 个分期产品`);

db.close();
