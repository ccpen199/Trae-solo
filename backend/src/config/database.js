import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DB_PATH || join(__dirname, '../../data/app.sqlite');

const dataDir = dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'investor',
  full_name TEXT,
  id_card TEXT,
  phone TEXT,
  email TEXT,
  risk_level INTEGER,
  risk_assessment_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_version INTEGER NOT NULL DEFAULT 1,
  payload TEXT NOT NULL,
  metadata TEXT,
  occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS fund_products (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  risk_level INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  issuer TEXT,
  manager TEXT,
  nav DECIMAL(18,4) NOT NULL DEFAULT 1.0000,
  nav_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  order_type TEXT NOT NULL,
  amount DECIMAL(18,2),
  shares DECIMAL(18,4),
  nav DECIMAL(18,4),
  fee_amount DECIMAL(18,2),
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  external_ref TEXT,
  notes TEXT,
  submitted_at DATETIME,
  confirmed_at DATETIME,
  completed_at DATETIME,
  rejected_at DATETIME,
  rejected_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS user_assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  total_shares DECIMAL(18,4) NOT NULL DEFAULT 0,
  available_shares DECIMAL(18,4) NOT NULL DEFAULT 0,
  frozen_shares DECIMAL(18,4) NOT NULL DEFAULT 0,
  cost_price DECIMAL(18,4) NOT NULL DEFAULT 0,
  total_invested DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_redeemed DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_dividend DECIMAL(18,2) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  order_id TEXT,
  product_id TEXT,
  transaction_type TEXT NOT NULL,
  amount DECIMAL(18,2),
  shares DECIMAL(18,4),
  nav DECIMAL(18,4),
  fee_amount DECIMAL(18,2),
  status TEXT NOT NULL DEFAULT 'pending',
  occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS dividend_events (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  announcement_date DATE NOT NULL,
  record_date DATE NOT NULL,
  ex_date DATE NOT NULL,
  payment_date DATE NOT NULL,
  per_share_amount DECIMAL(18,4) NOT NULL,
  status TEXT NOT NULL DEFAULT 'announced',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS dividend_records (
  id TEXT PRIMARY KEY,
  dividend_event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  shares_held DECIMAL(18,4) NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  distribution_type TEXT NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS reconciliations (
  id TEXT PRIMARY KEY,
  reconciliation_date DATE NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_orders INTEGER,
  matched_orders INTEGER,
  unmatched_orders INTEGER,
  difference_amount DECIMAL(18,2),
  report_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
)`);

db.exec(`CREATE TABLE IF NOT EXISTS risk_assessments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  answers TEXT NOT NULL,
  score INTEGER NOT NULL,
  risk_level INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expired_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS compliance_alerts (
  id TEXT PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  related_user_id TEXT,
  related_order_id TEXT,
  related_product_id TEXT,
  threshold_value DECIMAL(18,4),
  actual_value DECIMAL(18,4),
  status TEXT NOT NULL DEFAULT 'open',
  detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  resolver_id TEXT,
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_events_aggregate ON events(aggregate_type, aggregate_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_events_occurred ON events(occurred_at)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_assets_user ON user_assets(user_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_alerts_status ON compliance_alerts(status)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_alerts_severity ON compliance_alerts(severity)`);

export default db;
