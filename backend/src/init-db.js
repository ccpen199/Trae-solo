import dotenv from 'dotenv'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
const dbPath = path.resolve(__dirname, '../../data/app.sqlite')
const dbDir = path.dirname(dbPath)

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const initTables = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('shipper', 'driver', 'admin')),
  phone TEXT UNIQUE NOT NULL,
  real_name TEXT,
  id_card_no TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'banned')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enterprise_info (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipper_id INTEGER NOT NULL,
  company_name TEXT NOT NULL,
  business_license TEXT NOT NULL,
  tax_registration_no TEXT,
  legal_person_name TEXT,
  legal_person_id_card TEXT,
  company_address TEXT,
  contact_phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shipper_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS driver_info (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  driver_id INTEGER NOT NULL,
  driver_license_no TEXT NOT NULL,
  driver_license_type TEXT NOT NULL,
  vehicle_no TEXT UNIQUE NOT NULL,
  vehicle_type TEXT NOT NULL,
  vehicle_length REAL,
  vehicle_load REAL,
  id_card_front TEXT,
  id_card_back TEXT,
  driver_license_front TEXT,
  vehicle_photo TEXT,
  credit_score INTEGER DEFAULT 80,
  total_orders INTEGER DEFAULT 0,
  success_orders INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cargo_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipper_id INTEGER NOT NULL,
  cargo_name TEXT NOT NULL,
  cargo_type TEXT NOT NULL,
  weight REAL,
  volume REAL,
  quantity INTEGER,
  start_city TEXT NOT NULL,
  start_address TEXT NOT NULL,
  start_lng REAL,
  start_lat REAL,
  end_city TEXT NOT NULL,
  end_address TEXT NOT NULL,
  end_lng REAL,
  end_lat REAL,
  distance REAL NOT NULL,
  vehicle_type_required TEXT NOT NULL,
  vehicle_length_required REAL,
  loading_time DATETIME NOT NULL,
  delivery_time DATETIME NOT NULL,
  base_price REAL NOT NULL,
  distance_factor REAL DEFAULT 1.0,
  vehicle_factor REAL DEFAULT 1.0,
  time_factor REAL DEFAULT 1.0,
  suggested_price REAL NOT NULL,
  min_price REAL,
  max_price REAL,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'matched', 'trading', 'signed', 'cancelled')),
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shipper_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS driver_location (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  driver_id INTEGER NOT NULL,
  lng REAL NOT NULL,
  lat REAL NOT NULL,
  city TEXT,
  is_online INTEGER DEFAULT 0,
  is_available INTEGER DEFAULT 0,
  last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS waybills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cargo_id INTEGER NOT NULL,
  shipper_id INTEGER NOT NULL,
  driver_id INTEGER NOT NULL,
  waybill_no TEXT UNIQUE NOT NULL,
  agreed_price REAL NOT NULL,
  platform_commission REAL NOT NULL,
  insurance_fee REAL NOT NULL,
  driver_receivable REAL NOT NULL,
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'loading', 'in_transit', 'completed', 'abnormal', 'cancelled')),
  loading_photo TEXT,
  waybill_photo TEXT,
  ocr_result TEXT,
  sign_time DATETIME,
  start_time DATETIME,
  loading_time DATETIME,
  complete_time DATETIME,
  estimated_arrival DATETIME,
  current_lng REAL,
  current_lat REAL,
  route_points TEXT,
  abnormal_type TEXT,
  abnormal_desc TEXT,
  abnormal_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cargo_id) REFERENCES cargo_sources(id) ON DELETE CASCADE,
  FOREIGN KEY (shipper_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tracking_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  waybill_id INTEGER NOT NULL,
  driver_id INTEGER NOT NULL,
  lng REAL NOT NULL,
  lat REAL NOT NULL,
  speed REAL,
  heading REAL,
  is_off_route INTEGER DEFAULT 0,
  is_stationary INTEGER DEFAULT 0,
  stationary_minutes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (waybill_id) REFERENCES waybills(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS price_negotiations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cargo_id INTEGER NOT NULL,
  shipper_id INTEGER NOT NULL,
  driver_id INTEGER NOT NULL,
  bid_price REAL NOT NULL,
  negotiator TEXT NOT NULL CHECK (negotiator IN ('shipper', 'driver')),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered')),
  reply_price REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cargo_id) REFERENCES cargo_sources(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS escrow_funds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  waybill_id INTEGER NOT NULL,
  shipper_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'frozen' CHECK (status IN ('frozen', 'released', 'refunded')),
  frozen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  released_at DATETIME,
  refunded_at DATETIME,
  transaction_no TEXT UNIQUE,
  FOREIGN KEY (waybill_id) REFERENCES waybills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  waybill_id INTEGER,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('recharge', 'payment', 'commission', 'insurance', 'withdraw', 'settlement')),
  amount REAL NOT NULL,
  balance_before REAL NOT NULL,
  balance_after REAL NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_no TEXT UNIQUE NOT NULL,
  related_transaction_no TEXT,
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  balance REAL DEFAULT 0,
  frozen_balance REAL DEFAULT 0,
  total_income REAL DEFAULT 0,
  total_expend REAL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS insurance_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  waybill_id INTEGER NOT NULL,
  policy_no TEXT UNIQUE NOT NULL,
  insurance_company TEXT NOT NULL,
  insured_amount REAL NOT NULL,
  premium REAL NOT NULL,
  cargo_value REAL,
  policy_content TEXT,
  status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'cancelled', 'claimed')),
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (waybill_id) REFERENCES waybills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS whitelist_drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipper_id INTEGER NOT NULL,
  driver_id INTEGER NOT NULL,
  remark TEXT,
  cooperation_count INTEGER DEFAULT 0,
  last_cooperation_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (shipper_id, driver_id),
  FOREIGN KEY (shipper_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cooperation_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipper_id INTEGER NOT NULL,
  driver_id INTEGER NOT NULL,
  waybill_id INTEGER NOT NULL,
  cargo_name TEXT,
  route TEXT,
  price REAL,
  rating INTEGER,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shipper_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (waybill_id) REFERENCES waybills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  waybill_id INTEGER NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('off_route', 'stationary', 'timeout', 'other')),
  alert_level TEXT NOT NULL CHECK (alert_level IN ('warning', 'danger')),
  alert_message TEXT NOT NULL,
  is_handled INTEGER DEFAULT 0,
  handled_by INTEGER,
  handled_at DATETIME,
  handled_note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (waybill_id) REFERENCES waybills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id INTEGER,
  ip TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
`

db.exec(initTables)

const createIndexes = `
CREATE INDEX IF NOT EXISTS idx_cargo_status ON cargo_sources(status);
CREATE INDEX IF NOT EXISTS idx_cargo_shipper ON cargo_sources(shipper_id);
CREATE INDEX IF NOT EXISTS idx_cargo_route ON cargo_sources(start_city, end_city);
CREATE INDEX IF NOT EXISTS idx_driver_location ON driver_location(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_online ON driver_location(is_online, is_available);
CREATE INDEX IF NOT EXISTS idx_waybill_status ON waybills(status);
CREATE INDEX IF NOT EXISTS idx_waybill_shipper ON waybills(shipper_id);
CREATE INDEX IF NOT EXISTS idx_waybill_driver ON waybills(driver_id);
CREATE INDEX IF NOT EXISTS idx_tracking_waybill ON tracking_records(waybill_id);
CREATE INDEX IF NOT EXISTS idx_transaction_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_waybill ON alerts(waybill_id);
CREATE INDEX IF NOT EXISTS idx_alert_handled ON alerts(is_handled);
CREATE INDEX IF NOT EXISTS idx_whitelist_shipper ON whitelist_drivers(shipper_id);
`

db.exec(createIndexes)

const adminPwd = bcrypt.hashSync('admin123456', 10)
const shipperPwd = bcrypt.hashSync('shipper123', 10)
const driverPwd = bcrypt.hashSync('driver123', 10)

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (username, password, role, phone, real_name, id_card_no, status)
  VALUES (?, ?, ?, ?, ?, ?, 'verified')
`)

insertUser.run('admin', adminPwd, 'admin', '13800000000', '系统管理员', '110101199001010001')
insertUser.run('shipper01', shipperPwd, 'shipper', '13800000001', '张三', '110101199001010002')
insertUser.run('driver01', driverPwd, 'driver', '13800000002', '李四', '110101199001010003')
insertUser.run('driver02', driverPwd, 'driver', '13800000003', '王五', '110101199001010004')

const insertEnterprise = db.prepare(`
  INSERT OR IGNORE INTO enterprise_info (shipper_id, company_name, business_license, tax_registration_no, legal_person_name, legal_person_id_card, company_address, contact_phone, status, verified_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'verified', CURRENT_TIMESTAMP)
`)
insertEnterprise.run(2, '北京速达物流有限公司', '91110105MA001ABC12', '91110105MA001ABC12', '张三', '110101199001010002', '北京市朝阳区建国路88号', '010-88888888')

const insertDriverInfo = db.prepare(`
  INSERT OR IGNORE INTO driver_info (driver_id, driver_license_no, driver_license_type, vehicle_no, vehicle_type, vehicle_length, vehicle_load, credit_score, total_orders, success_orders)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
insertDriverInfo.run(3, '110101199001010003', 'A2', '京A12345', '厢式货车', 9.6, 18, 85, 120, 115)
insertDriverInfo.run(4, '110101199001010004', 'A2', '京B67890', '高栏货车', 13.0, 32, 92, 200, 196)

const insertDriverLocation = db.prepare(`
  INSERT OR IGNORE INTO driver_location (driver_id, lng, lat, city, is_online, is_available)
  VALUES (?, ?, ?, ?, 1, 1)
`)
insertDriverLocation.run(3, 116.4074, 39.9042, '北京市')
insertDriverLocation.run(4, 116.5074, 39.9142, '北京市')

const insertWallet = db.prepare(`
  INSERT OR IGNORE INTO wallets (user_id, balance, frozen_balance, total_income, total_expend)
  VALUES (?, ?, ?, ?, ?)
`)
insertWallet.run(1, 0, 0, 0, 0)
insertWallet.run(2, 50000, 0, 100000, 50000)
insertWallet.run(3, 15000, 0, 80000, 65000)
insertWallet.run(4, 28000, 0, 150000, 122000)

console.log('数据库初始化完成！')
console.log('测试账号:')
console.log('  管理员: admin / admin123456')
console.log('  货主: shipper01 / shipper123')
console.log('  司机: driver01 / driver123')
console.log('  司机: driver02 / driver123')

db.close()
