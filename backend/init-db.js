require('dotenv').config({ path: '../.env' });
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS platforms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  license_no TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  id_card TEXT NOT NULL UNIQUE,
  phone TEXT,
  driver_license_no TEXT,
  driver_license_type TEXT,
  driver_license_issue_date TEXT,
  driver_license_expiry_date TEXT,
  taxi_qualification_no TEXT,
  taxi_qualification_issue_date TEXT,
  taxi_qualification_expiry_date TEXT,
  platform_id INTEGER,
  audit_status TEXT DEFAULT 'pending',
  audit_remark TEXT,
  audit_time TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (platform_id) REFERENCES platforms(id)
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plate_no TEXT NOT NULL UNIQUE,
  vehicle_type TEXT,
  color TEXT,
  brand TEXT,
  model TEXT,
  register_date TEXT,
  vehicle_license_no TEXT,
  vehicle_license_expiry_date TEXT,
  operation_license_no TEXT,
  operation_license_expiry_date TEXT,
  insurance_expiry_date TEXT,
  annual_inspection_expiry_date TEXT,
  platform_id INTEGER,
  owner_name TEXT,
  owner_phone TEXT,
  audit_status TEXT DEFAULT 'pending',
  audit_remark TEXT,
  audit_time TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (platform_id) REFERENCES platforms(id)
);

CREATE TABLE IF NOT EXISTS driver_vehicle_bind (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  driver_id INTEGER NOT NULL,
  vehicle_id INTEGER NOT NULL,
  platform_id INTEGER NOT NULL,
  bind_date TEXT,
  unbind_date TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (platform_id) REFERENCES platforms(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform_order_no TEXT NOT NULL,
  platform_id INTEGER NOT NULL,
  driver_id INTEGER,
  vehicle_id INTEGER,
  passenger_name TEXT,
  passenger_phone TEXT,
  pickup_address TEXT,
  pickup_lat REAL,
  pickup_lng REAL,
  pickup_time TEXT,
  dropoff_address TEXT,
  dropoff_lat REAL,
  dropoff_lng REAL,
  dropoff_time TEXT,
  distance REAL,
  duration INTEGER,
  base_fare REAL,
  toll_fee REAL,
  parking_fee REAL,
  tip_amount REAL,
  total_amount REAL,
  payment_method TEXT,
  trajectory_points TEXT,
  mileage REAL,
  status TEXT DEFAULT 'completed',
  anomaly_tags TEXT,
  is_checked INTEGER DEFAULT 0,
  checked_time TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (platform_id) REFERENCES platforms(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE IF NOT EXISTS compliance_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_code TEXT NOT NULL UNIQUE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  description TEXT,
  violation_level TEXT,
  fine_amount_min REAL,
  fine_amount_max REAL,
  points_deducted INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_no TEXT NOT NULL UNIQUE,
  order_id INTEGER,
  driver_id INTEGER,
  vehicle_id INTEGER,
  platform_id INTEGER,
  complainant_name TEXT,
  complainant_phone TEXT,
  complaint_type TEXT NOT NULL,
  complaint_content TEXT,
  complaint_time TEXT,
  evidence_urls TEXT,
  status TEXT DEFAULT 'pending',
  handler TEXT,
  handle_result TEXT,
  handle_time TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (platform_id) REFERENCES platforms(id)
);

CREATE TABLE IF NOT EXISTS work_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  work_order_no TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  source_id INTEGER,
  work_order_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  driver_id INTEGER,
  vehicle_id INTEGER,
  platform_id INTEGER,
  order_id INTEGER,
  complaint_id INTEGER,
  violation_rule_id INTEGER,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'pending',
  assign_to TEXT,
  assign_time TEXT,
  verify_result TEXT,
  verify_evidence TEXT,
  verify_time TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (platform_id) REFERENCES platforms(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  FOREIGN KEY (violation_rule_id) REFERENCES compliance_rules(id)
);

CREATE TABLE IF NOT EXISTS enforcement_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_no TEXT NOT NULL UNIQUE,
  case_type TEXT NOT NULL,
  title TEXT NOT NULL,
  driver_id INTEGER,
  vehicle_id INTEGER,
  platform_id INTEGER,
  work_order_id INTEGER,
  complaint_id INTEGER,
  violation_details TEXT,
  evidence_urls TEXT,
  law_enforcement_officer TEXT,
  law_enforcement_time TEXT,
  initial_decision TEXT,
  initial_fine_amount REAL,
  initial_points_deducted INTEGER,
  decision_time TEXT,
  is_appealed INTEGER DEFAULT 0,
  appeal_content TEXT,
  appeal_time TEXT,
  review_result TEXT,
  review_time TEXT,
  final_decision TEXT,
  final_fine_amount REAL,
  final_points_deducted INTEGER,
  rectification_requirements TEXT,
  rectification_result TEXT,
  rectification_evidence TEXT,
  rectification_time TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (platform_id) REFERENCES platforms(id),
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
  FOREIGN KEY (complaint_id) REFERENCES complaints(id)
);

CREATE TABLE IF NOT EXISTS penalties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  penalty_no TEXT NOT NULL UNIQUE,
  case_id INTEGER NOT NULL,
  driver_id INTEGER,
  vehicle_id INTEGER,
  platform_id INTEGER,
  penalty_type TEXT,
  penalty_amount REAL,
  points_deducted INTEGER,
  penalty_desc TEXT,
  penalty_time TEXT,
  paid_amount REAL,
  paid_time TEXT,
  status TEXT DEFAULT 'unpaid',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES enforcement_cases(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (platform_id) REFERENCES platforms(id)
);

CREATE TABLE IF NOT EXISTS operation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_type TEXT NOT NULL,
  user_id INTEGER,
  user_name TEXT,
  operation TEXT NOT NULL,
  module TEXT,
  record_id INTEGER,
  detail TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_drivers_platform ON drivers(platform_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(audit_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_platform ON vehicles(platform_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(audit_status);
CREATE INDEX IF NOT EXISTS idx_orders_platform ON orders(platform_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_time ON orders(pickup_time);
CREATE INDEX IF NOT EXISTS idx_orders_anomaly ON orders(is_checked);
CREATE INDEX IF NOT EXISTS idx_workorders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_workorders_type ON work_orders(work_order_type);
CREATE INDEX IF NOT EXISTS idx_cases_status ON enforcement_cases(status);
CREATE INDEX IF NOT EXISTS idx_penalties_status ON penalties(status);
`);

console.log('数据库初始化完成:', dbPath);
db.close();
