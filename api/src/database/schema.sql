-- 数据库 schema
CREATE TABLE IF NOT EXISTS outlets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  contact TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('courier', 'admin', 'operator')),
  outlet_id TEXT REFERENCES outlets(id),
  device_fingerprint TEXT,
  certification_status TEXT NOT NULL DEFAULT 'pending',
  avatar_url TEXT,
  last_login_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  sender_province TEXT,
  sender_city TEXT,
  sender_district TEXT,
  sender_address TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  receiver_province TEXT,
  receiver_city TEXT,
  receiver_district TEXT,
  receiver_address TEXT NOT NULL,
  item_type TEXT NOT NULL,
  estimated_weight DECIMAL(10,2) NOT NULL,
  actual_weight DECIMAL(10,2),
  appointment_time DATETIME NOT NULL,
  pickup_code TEXT NOT NULL,
  remark TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pickup_tasks (
  id TEXT PRIMARY KEY,
  task_no TEXT UNIQUE NOT NULL,
  order_id TEXT NOT NULL REFERENCES orders(id),
  order_no TEXT NOT NULL,
  courier_id TEXT REFERENCES users(id),
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  pickup_code TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  item_type TEXT NOT NULL,
  estimated_weight DECIMAL(10,2) NOT NULL,
  actual_weight DECIMAL(10,2),
  appointment_time DATETIME NOT NULL,
  weight_check_rule TEXT NOT NULL DEFAULT 'tolerance',
  weight_tolerance DECIMAL(5,2) DEFAULT 0.5,
  freight DECIMAL(10,2),
  payment_method TEXT CHECK (payment_method IN ('wechat', 'alipay', 'cash', 'account')),
  photos TEXT,
  waybill_no TEXT,
  printed_at DATETIME,
  status TEXT NOT NULL DEFAULT 'pending',
  exception_reason TEXT,
  synced BOOLEAN NOT NULL DEFAULT 1,
  picked_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS waybill_accounts (
  id TEXT PRIMARY KEY,
  outlet_id TEXT UNIQUE NOT NULL REFERENCES outlets(id),
  outlet_name TEXT NOT NULL,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  frozen_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_recharged DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_used DECIMAL(12,2) NOT NULL DEFAULT 0,
  template_id TEXT,
  template_name TEXT,
  paper_size TEXT DEFAULT '100x150',
  font_size TEXT DEFAULT 'medium',
  show_logo BOOLEAN NOT NULL DEFAULT 1,
  logo_url TEXT,
  low_balance_threshold DECIMAL(12,2) NOT NULL DEFAULT 100,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recharge_records (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES waybill_accounts(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  operator_id TEXT REFERENCES users(id),
  operator_name TEXT,
  remark TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_role TEXT,
  target_outlet_id TEXT REFERENCES outlets(id),
  target_courier_id TEXT REFERENCES users(id),
  related_id TEXT,
  related_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME
);

CREATE TABLE IF NOT EXISTS daily_finances (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  outlet_name TEXT NOT NULL,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_weight DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_freight DECIMAL(12,2) NOT NULL DEFAULT 0,
  waybill_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  platform_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_income DECIMAL(12,2) NOT NULL DEFAULT 0,
  detail TEXT,
  UNIQUE(date, outlet_id)
);

CREATE TABLE IF NOT EXISTS bank_cards (
  id TEXT PRIMARY KEY,
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  bank_name TEXT NOT NULL,
  bank_branch TEXT,
  card_number TEXT NOT NULL,
  card_holder TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS withdraw_records (
  id TEXT PRIMARY KEY,
  outlet_id TEXT NOT NULL REFERENCES outlets(id),
  bank_card_id TEXT NOT NULL REFERENCES bank_cards(id),
  amount DECIMAL(12,2) NOT NULL,
  bank_name TEXT NOT NULL,
  card_number TEXT NOT NULL,
  card_holder TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  auditor_id TEXT REFERENCES users(id),
  auditor_name TEXT,
  audit_remark TEXT,
  transfer_transaction_id TEXT,
  applicant_id TEXT NOT NULL REFERENCES users(id),
  applicant_name TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  audited_at DATETIME,
  transferred_at DATETIME
);

CREATE TABLE IF NOT EXISTS print_logs (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES pickup_tasks(id),
  waybill_no TEXT NOT NULL,
  printer_name TEXT,
  paper_size TEXT,
  printed_by TEXT NOT NULL REFERENCES users(id),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_courier ON pickup_tasks(courier_id);
CREATE INDEX IF NOT EXISTS idx_tasks_outlet ON pickup_tasks(outlet_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON pickup_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_synced ON pickup_tasks(synced);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_code ON orders(pickup_code);
CREATE INDEX IF NOT EXISTS idx_messages_target ON messages(target_courier_id, target_outlet_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_finance_date ON daily_finances(date);
