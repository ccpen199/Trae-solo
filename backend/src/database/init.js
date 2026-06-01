const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'operator', 'auditor')),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    department TEXT,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_no TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    company TEXT,
    industry TEXT,
    level TEXT CHECK(level IN ('A', 'B', 'C', 'D')),
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    region TEXT,
    total_amount REAL DEFAULT 0,
    last_payment_date DATETIME,
    expiration_date DATETIME,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customer_behavior (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    behavior_type TEXT NOT NULL,
    behavior_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    behavior_detail TEXT,
    ip_address TEXT,
    device_info TEXT,
    session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS payment_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    order_no TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    payment_type TEXT,
    payment_time DATETIME,
    status TEXT CHECK(status IN ('pending', 'success', 'failed', 'refunded')),
    product_name TEXT,
    start_date DATETIME,
    end_date DATETIME,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS risk_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    assessment_no TEXT UNIQUE NOT NULL,
    risk_score INTEGER NOT NULL,
    risk_level TEXT NOT NULL CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
    risk_tags TEXT,
    risk_reasons TEXT,
    model_version TEXT,
    assessment_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'auto_blocked', 'manual_review', 'watching', 'closed')),
    review_result TEXT,
    reviewer_id INTEGER,
    review_time DATETIME,
    review_remark TEXT,
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS risk_assessment_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assessment_id INTEGER NOT NULL,
    risk_score INTEGER,
    risk_level TEXT,
    risk_tags TEXT,
    risk_reasons TEXT,
    status TEXT,
    version INTEGER,
    change_log TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES risk_assessments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS recovery_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_no TEXT UNIQUE NOT NULL,
    assessment_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    task_type TEXT NOT NULL,
    task_title TEXT NOT NULL,
    task_description TEXT,
    assignee_id INTEGER,
    priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
    due_date DATETIME,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    execution_result TEXT,
    execution_time DATETIME,
    execution_remark TEXT,
    recovery_effect TEXT,
    recovered_amount REAL DEFAULT 0,
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES risk_assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS task_operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    operation_type TEXT NOT NULL CHECK(operation_type IN ('create', 'submit', 'execute', 'review', 'reject', 'close')),
    operation_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    operator_id INTEGER,
    remark TEXT,
    before_status TEXT,
    after_status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES recovery_tasks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS config_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_code TEXT UNIQUE NOT NULL,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL,
    rule_expression TEXT,
    risk_score INTEGER DEFAULT 0,
    owner_id INTEGER,
    valid_from DATETIME,
    valid_to DATETIME,
    status INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    remark TEXT,
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS config_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    allowed INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, resource, action)
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attachment_no TEXT UNIQUE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    related_type TEXT,
    related_id INTEGER,
    uploaded_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    module TEXT NOT NULL,
    operation TEXT NOT NULL,
    target_type TEXT,
    target_id INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    request_params TEXT,
    response_result TEXT,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS statistics_daily (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_date DATE UNIQUE NOT NULL,
    total_customers INTEGER DEFAULT 0,
    new_assessments INTEGER DEFAULT 0,
    high_risk_count INTEGER DEFAULT 0,
    tasks_created INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    recovery_rate REAL DEFAULT 0,
    recovered_amount REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const bcrypt = require('bcryptjs');
const hashedAdmin = bcrypt.hashSync('admin123', 10);
const hashedManager = bcrypt.hashSync('manager123', 10);
const hashedOperator = bcrypt.hashSync('operator123', 10);
const hashedAuditor = bcrypt.hashSync('auditor123', 10);

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (username, password, role, name, email, department)
  VALUES (?, ?, ?, ?, ?, ?)
`);

insertUser.run('admin', hashedAdmin, 'admin', '系统管理员', 'admin@company.com', '技术部');
insertUser.run('manager', hashedManager, 'manager', '业务负责人', 'manager@company.com', '运营部');
insertUser.run('operator', hashedOperator, 'operator', '一线运营', 'operator@company.com', '运营部');
insertUser.run('auditor', hashedAuditor, 'auditor', '审核人员', 'auditor@company.com', '风控部');

const insertConfig = db.prepare(`
  INSERT OR IGNORE INTO config_rules (rule_code, rule_name, rule_type, rule_expression, risk_score, status, remark)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertConfig.run('LOGIN_7D', '7天未登录', 'behavior', 'last_login > 7 days', 20, 1, '连续7天未登录系统');
insertConfig.run('USAGE_DECLINE', '使用频次下降', 'behavior', 'usage_count < avg_30d * 0.5', 25, 1, '使用频次低于月均50%');
insertConfig.run('EXPIRE_30D', '服务即将到期', 'subscription', 'expiration_date < 30 days', 30, 1, '服务到期不足30天');
insertConfig.run('NO_PAYMENT_90D', '90天未消费', 'payment', 'last_payment > 90 days', 35, 1, '连续90天无消费记录');
insertConfig.run('TICKET_INCREASE', '客诉量增加', 'support', 'ticket_count > avg_30d * 2', 15, 1, '工单量超过月均2倍');
insertConfig.run('CONTACT_CHANGE', '联系人变更', 'profile', 'contact_changed = 1', 10, 1, '关键联系人发生变更');

const insertSampleCustomers = db.prepare(`
  INSERT OR IGNORE INTO customers (customer_no, name, company, industry, level, contact_name, contact_phone, contact_email, region, total_amount, last_payment_date, expiration_date)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const now = new Date();
const formatDate = (d) => d.toISOString().split('T')[0];

insertSampleCustomers.run(
  'CUST001', '北京科技有限公司', '北京科技', '互联网', 'A',
  '张三', '13800138001', 'zhangsan@bjtech.com', '华北',
  500000, formatDate(new Date(now - 10 * 24 * 60 * 60 * 1000)),
  formatDate(new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000))
);

insertSampleCustomers.run(
  'CUST002', '上海贸易集团', '上海贸易', '电商', 'B',
  '李四', '13800138002', 'lisi@shtrade.com', '华东',
  200000, formatDate(new Date(now - 45 * 24 * 60 * 60 * 1000)),
  formatDate(new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000))
);

insertSampleCustomers.run(
  'CUST003', '广州制造公司', '广州制造', '制造业', 'C',
  '王五', '13800138003', 'wangwu@gzmfg.com', '华南',
  80000, formatDate(new Date(now - 100 * 24 * 60 * 60 * 1000)),
  formatDate(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000))
);

insertSampleCustomers.run(
  'CUST004', '深圳创新科技', '深圳创新', '软件', 'A',
  '赵六', '13800138004', 'zhaoliu@szcx.com', '华南',
  800000, formatDate(new Date(now - 3 * 24 * 60 * 60 * 1000)),
  formatDate(new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000))
);

insertSampleCustomers.run(
  'CUST005', '杭州数字公司', '杭州数字', '大数据', 'B',
  '钱七', '13800138005', 'qianqi@hzdigital.com', '华东',
  150000, formatDate(new Date(now - 80 * 24 * 60 * 60 * 1000)),
  formatDate(new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000))
);

db.close();
console.log('Database initialized successfully!');
