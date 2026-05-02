module.exports = `
-- 1. 权限与岗位系统
-- 角色表
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 权限表
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 角色-权限关联
CREATE TABLE IF NOT EXISTS role_permissions (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (permission_id) REFERENCES permissions(id),
  UNIQUE(role_id, permission_id)
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role_id TEXT NOT NULL,
  merchant_id TEXT,
  status INTEGER DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

-- 2. 商户与主体数据
-- 商户表
CREATE TABLE IF NOT EXISTS merchants (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  legal_name TEXT,
  business_license TEXT,
  tax_id TEXT,
  country TEXT,
  currency TEXT DEFAULT 'CNY',
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  kyc_status TEXT DEFAULT 'PENDING',
  credit_limit REAL DEFAULT 0,
  risk_score INTEGER DEFAULT 50,
  status INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 支付机构表
CREATE TABLE IF NOT EXISTS payment_institutions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  country TEXT,
  supported_currencies TEXT,
  fee_config TEXT,
  status INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 银行账户表
CREATE TABLE IF NOT EXISTS bank_accounts (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  bank_code TEXT,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  swift_code TEXT,
  iban TEXT,
  currency TEXT NOT NULL,
  country TEXT,
  is_default INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

-- 3. 多币种账户与账本
CREATE TABLE IF NOT EXISTS multi_currency_accounts (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  balance REAL DEFAULT 0,
  frozen_balance REAL DEFAULT 0,
  available_balance REAL DEFAULT 0,
  total_in REAL DEFAULT 0,
  total_out REAL DEFAULT 0,
  status INTEGER DEFAULT 1,
  last_transaction_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id),
  UNIQUE(merchant_id, currency)
);

-- 账本流水
CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  transaction_id TEXT,
  type TEXT NOT NULL,
  direction TEXT NOT NULL,
  amount REAL NOT NULL,
  balance_before REAL NOT NULL,
  balance_after REAL NOT NULL,
  currency TEXT NOT NULL,
  description TEXT,
  reference_no TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (account_id) REFERENCES multi_currency_accounts(id),
  FOREIGN KEY (transaction_id) REFERENCES payment_transactions(id)
);

-- 4. 汇率管理
CREATE TABLE IF NOT EXISTS exchange_rates (
  id TEXT PRIMARY KEY,
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate REAL NOT NULL,
  source TEXT DEFAULT 'SYSTEM',
  valid_from TEXT NOT NULL,
  valid_to TEXT,
  is_locked INTEGER DEFAULT 0,
  locked_by TEXT,
  locked_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (locked_by) REFERENCES users(id)
);

-- 汇率锁定记录（用于交易）
CREATE TABLE IF NOT EXISTS rate_locks (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate REAL NOT NULL,
  locked_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  is_used INTEGER DEFAULT 0,
  used_at TEXT,
  FOREIGN KEY (transaction_id) REFERENCES payment_transactions(id)
);

-- 5. KYC管理
CREATE TABLE IF NOT EXISTS kyc_records (
  id TEXT PRIMARY KEY,
  merchant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  submitted_at TEXT,
  reviewed_at TEXT,
  reviewed_by TEXT,
  review_comment TEXT,
  score INTEGER,
  risk_level TEXT,
  documents TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- KYC规则引擎配置
CREATE TABLE IF NOT EXISTS kyc_rules (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT,
  conditions TEXT,
  actions TEXT,
  priority INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 6. 交易主单与明细
-- 交易主单
CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL,
  merchant_id TEXT NOT NULL,
  buyer_id TEXT,
  buyer_name TEXT,
  buyer_email TEXT,
  payment_institution_id TEXT,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  target_amount REAL,
  target_currency TEXT,
  exchange_rate REAL,
  rate_lock_id TEXT,
  fee_amount REAL DEFAULT 0,
  fee_currency TEXT,
  net_amount REAL,
  status TEXT NOT NULL DEFAULT 'CREATED',
  current_node TEXT NOT NULL DEFAULT 'CREATE_COLLECTION',
  expected_completion_time TEXT,
  responsible_user_id TEXT,
  attachments TEXT,
  description TEXT,
  kyc_record_id TEXT,
  risk_score INTEGER,
  is_exception INTEGER DEFAULT 0,
  exception_reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id),
  FOREIGN KEY (payment_institution_id) REFERENCES payment_institutions(id),
  FOREIGN KEY (rate_lock_id) REFERENCES rate_locks(id),
  FOREIGN KEY (responsible_user_id) REFERENCES users(id),
  FOREIGN KEY (kyc_record_id) REFERENCES kyc_records(id)
);

-- 交易明细表
CREATE TABLE IF NOT EXISTS transaction_details (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  item_no TEXT NOT NULL,
  item_name TEXT,
  quantity INTEGER,
  unit_price REAL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'PENDING',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (transaction_id) REFERENCES payment_transactions(id)
);

-- 7. 状态流转与节点历史
CREATE TABLE IF NOT EXISTS transaction_nodes (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  node_code TEXT NOT NULL,
  node_name TEXT NOT NULL,
  status TEXT NOT NULL,
  entered_at TEXT DEFAULT (datetime('now')),
  exited_at TEXT,
  processed_by TEXT,
  processing_result TEXT,
  comment TEXT,
  next_node TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (transaction_id) REFERENCES payment_transactions(id),
  FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- 节点定义
CREATE TABLE IF NOT EXISTS workflow_nodes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT,
  allowed_roles TEXT,
  allowed_actions TEXT,
  next_nodes TEXT,
  is_terminal INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 8. 结算管理
CREATE TABLE IF NOT EXISTS settlements (
  id TEXT PRIMARY KEY,
  settlement_no TEXT UNIQUE NOT NULL,
  merchant_id TEXT NOT NULL,
  transaction_id TEXT,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  bank_account_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  expected_settlement_date TEXT,
  actual_settlement_date TEXT,
  fee_amount REAL DEFAULT 0,
  net_amount REAL,
  remark TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id),
  FOREIGN KEY (transaction_id) REFERENCES payment_transactions(id),
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id)
);

-- 9. 对账管理
CREATE TABLE IF NOT EXISTS reconciliations (
  id TEXT PRIMARY KEY,
  recon_no TEXT UNIQUE NOT NULL,
  merchant_id TEXT NOT NULL,
  date TEXT NOT NULL,
  currency TEXT NOT NULL,
  system_amount REAL NOT NULL,
  channel_amount REAL,
  diff_amount REAL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  diff_count INTEGER DEFAULT 0,
  matched_count INTEGER DEFAULT 0,
  unmatched_count INTEGER DEFAULT 0,
  processed_at TEXT,
  processed_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id),
  FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- 对账差异明细
CREATE TABLE IF NOT EXISTS recon_differences (
  id TEXT PRIMARY KEY,
  reconciliation_id TEXT NOT NULL,
  transaction_id TEXT,
  type TEXT NOT NULL,
  system_amount REAL,
  channel_amount REAL,
  diff_amount REAL,
  status TEXT DEFAULT 'PENDING',
  resolved_at TEXT,
  resolved_by TEXT,
  resolution TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (reconciliation_id) REFERENCES reconciliations(id),
  FOREIGN KEY (transaction_id) REFERENCES payment_transactions(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- 10. 消息与待办
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  transaction_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_read INTEGER DEFAULT 0,
  read_at TEXT,
  action_url TEXT,
  related_type TEXT,
  related_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (transaction_id) REFERENCES payment_transactions(id)
);

-- 待办任务
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  node_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'PENDING',
  priority TEXT DEFAULT 'MEDIUM',
  due_time TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (transaction_id) REFERENCES payment_transactions(id)
);

-- 11. 审计日志
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  role TEXT,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  user_agent TEXT,
  request_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 12. 异常处理记录
CREATE TABLE IF NOT EXISTS exception_records (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  type TEXT NOT NULL,
  code TEXT,
  message TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'PENDING',
  detected_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT,
  resolved_by TEXT,
  resolution TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (transaction_id) REFERENCES payment_transactions(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- 13. 报表统计（预聚合）
CREATE TABLE IF NOT EXISTS report_summaries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  merchant_id TEXT,
  currency TEXT,
  module TEXT NOT NULL,
  metric TEXT NOT NULL,
  value REAL NOT NULL,
  count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(date, merchant_id, currency, module, metric)
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON payment_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_current_node ON payment_transactions(current_node);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_nodes_transaction ON transaction_nodes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id, status);
`;
