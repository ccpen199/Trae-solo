require('dotenv').config({ path: '../../.env' })
const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '../../../data/app.sqlite')
const db = new Database(dbPath)

db.exec(`
CREATE TABLE IF NOT EXISTS enterprises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credit_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  registered_capital TEXT,
  establishment_date TEXT,
  status TEXT,
  industry TEXT,
  address TEXT,
  legal_representative TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enterprise_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  change_type TEXT NOT NULL,
  before_value TEXT,
  after_value TEXT,
  change_date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
);

CREATE TABLE IF NOT EXISTS shareholders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  share_ratio TEXT,
  contribution_amount TEXT,
  is_related_enterprise INTEGER DEFAULT 0,
  related_enterprise_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id),
  FOREIGN KEY (related_enterprise_id) REFERENCES enterprises(id)
);

CREATE TABLE IF NOT EXISTS judicial_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  record_type TEXT NOT NULL,
  title TEXT NOT NULL,
  court TEXT,
  case_number TEXT,
  amount TEXT,
  verdict_date TEXT,
  status TEXT,
  risk_level TEXT DEFAULT 'medium',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
);

CREATE TABLE IF NOT EXISTS tax_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  record_type TEXT NOT NULL,
  description TEXT,
  tax_authority TEXT,
  violation_date TEXT,
  amount TEXT,
  is_abnormal INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
);

CREATE TABLE IF NOT EXISTS business_indicators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  quarter INTEGER,
  revenue TEXT,
  profit TEXT,
  employee_count INTEGER,
  asset_total TEXT,
  liability_total TEXT,
  data_source TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
);

CREATE TABLE IF NOT EXISTS credit_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enterprise_id INTEGER NOT NULL,
  bank TEXT NOT NULL,
  credit_line TEXT,
  used_amount TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'normal',
  overdue_days INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
);

CREATE TABLE IF NOT EXISTS query_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credit_code TEXT NOT NULL,
  enterprise_name TEXT,
  account_manager TEXT NOT NULL,
  query_purpose TEXT NOT NULL,
  auth_file TEXT,
  query_time TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'success',
  failure_reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_no TEXT UNIQUE NOT NULL,
  credit_code TEXT NOT NULL,
  enterprise_name TEXT NOT NULL,
  version TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  risk_score INTEGER,
  hit_rules TEXT,
  evidence_sources TEXT,
  report_data TEXT,
  generated_by TEXT NOT NULL,
  generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  is_archived INTEGER DEFAULT 0,
  archived_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS export_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  report_no TEXT NOT NULL,
  version TEXT NOT NULL,
  exported_by TEXT NOT NULL,
  watermark TEXT NOT NULL,
  export_format TEXT DEFAULT 'pdf',
  file_path TEXT,
  exported_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id)
);

CREATE TABLE IF NOT EXISTS risk_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_code TEXT UNIQUE NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  description TEXT,
  is_enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_code TEXT UNIQUE NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  last_success_at TEXT,
  last_failure_at TEXT,
  failure_count INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 3,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operator TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`)

const insertRule = db.prepare(`
INSERT OR IGNORE INTO risk_rules (rule_code, rule_name, rule_type, risk_level, description)
VALUES (?, ?, ?, ?, ?)
`)

const rules = [
  ['R001', '存在失信被执行记录', 'judicial', 'high', '企业被列入失信被执行人名单'],
  ['R002', '存在未结诉讼案件', 'judicial', 'medium', '企业有未审结的诉讼案件'],
  ['R003', '税务异常记录', 'tax', 'high', '企业存在税务异常情况'],
  ['R004', '股东关联企业高风险', 'related', 'medium', '股东关联企业存在风险记录'],
  ['R005', '授信逾期记录', 'credit', 'high', '企业历史授信有逾期记录'],
  ['R006', '注册资本变更频繁', 'business', 'low', '企业近期多次变更注册资本'],
  ['R007', '法定代表人变更', 'business', 'low', '企业近期变更法定代表人']
]

rules.forEach(r => insertRule.run(...r))

const insertSource = db.prepare(`
INSERT OR IGNORE INTO data_sources (source_code, source_name, source_type)
VALUES (?, ?, ?)
`)

const sources = [
  ['GS', '工商数据源', 'business'],
  ['SF', '司法数据源', 'judicial'],
  ['SW', '税务数据源', 'tax'],
  ['JY', '经营数据源', 'business'],
  ['SX', '授信数据源', 'credit']
]

sources.forEach(s => insertSource.run(...s))

db.close()
console.log('数据库初始化完成')
