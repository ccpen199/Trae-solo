require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE stations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fuel_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE station_fuel_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INTEGER NOT NULL,
  fuel_type_id INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  effective_from DATETIME NOT NULL,
  effective_to DATETIME,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id),
  FOREIGN KEY (fuel_type_id) REFERENCES fuel_types(id)
);

CREATE TABLE nozzles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INTEGER NOT NULL,
  nozzle_number TEXT NOT NULL,
  fuel_type_id INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id),
  FOREIGN KEY (fuel_type_id) REFERENCES fuel_types(id),
  UNIQUE(station_id, nozzle_number)
);

CREATE TABLE tank_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INTEGER NOT NULL,
  fuel_type_id INTEGER NOT NULL,
  current_volume DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_volume DECIMAL(10,2) DEFAULT 0,
  max_volume DECIMAL(10,2) DEFAULT 10000,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id),
  FOREIGN KEY (fuel_type_id) REFERENCES fuel_types(id),
  UNIQUE(station_id, fuel_type_id)
);

CREATE TABLE member_levels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  min_points INTEGER DEFAULT 0,
  discount_rate DECIMAL(5,2) DEFAULT 0,
  point_multiplier DECIMAL(5,2) DEFAULT 1,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  password TEXT NOT NULL,
  level_id INTEGER DEFAULT 1,
  balance DECIMAL(10,2) DEFAULT 0,
  points INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (level_id) REFERENCES member_levels(id)
);

CREATE TABLE vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  plate_number TEXT UNIQUE NOT NULL,
  brand TEXT,
  model TEXT,
  color TEXT,
  fuel_type_id INTEGER,
  default_flag INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id),
  FOREIGN KEY (fuel_type_id) REFERENCES fuel_types(id)
);

CREATE TABLE coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  min_amount DECIMAL(10,2) DEFAULT 0,
  fuel_type_ids TEXT,
  station_ids TEXT,
  member_level_ids TEXT,
  valid_from DATETIME NOT NULL,
  valid_to DATETIME NOT NULL,
  max_usage INTEGER DEFAULT 1,
  total_issued INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE member_coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  coupon_id INTEGER NOT NULL,
  status TEXT DEFAULT 'available',
  used_at DATETIME,
  transaction_id INTEGER,
  acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id),
  FOREIGN KEY (coupon_id) REFERENCES coupons(id)
);

CREATE TABLE stored_value_packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  bonus_amount DECIMAL(10,2) DEFAULT 0,
  bonus_points INTEGER DEFAULT 0,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stored_value_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  package_id INTEGER,
  amount DECIMAL(10,2) NOT NULL,
  bonus_amount DECIMAL(10,2) DEFAULT 0,
  bonus_points INTEGER DEFAULT 0,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  points_before INTEGER NOT NULL,
  points_after INTEGER NOT NULL,
  type TEXT NOT NULL,
  payment_method TEXT,
  operator_id INTEGER,
  station_id INTEGER,
  status TEXT DEFAULT 'completed',
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id),
  FOREIGN KEY (package_id) REFERENCES stored_value_packages(id)
);

CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INTEGER NOT NULL,
  nozzle_id INTEGER NOT NULL,
  member_id INTEGER,
  vehicle_id INTEGER,
  fuel_type_id INTEGER NOT NULL,
  volume DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  original_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  coupon_amount DECIMAL(10,2) DEFAULT 0,
  points_used INTEGER DEFAULT 0,
  points_discount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  points_earned INTEGER DEFAULT 0,
  coupon_id INTEGER,
  cashier_id INTEGER,
  status TEXT DEFAULT 'completed',
  invoice_status TEXT DEFAULT 'none',
  start_time DATETIME,
  end_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  shift_id INTEGER,
  remark TEXT,
  FOREIGN KEY (station_id) REFERENCES stations(id),
  FOREIGN KEY (nozzle_id) REFERENCES nozzles(id),
  FOREIGN KEY (member_id) REFERENCES members(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (fuel_type_id) REFERENCES fuel_types(id),
  FOREIGN KEY (coupon_id) REFERENCES member_coupons(id)
);

CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  invoice_type TEXT NOT NULL,
  invoice_title TEXT NOT NULL,
  tax_number TEXT,
  amount DECIMAL(10,2) NOT NULL,
  invoice_number TEXT,
  status TEXT DEFAULT 'pending',
  issued_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (member_id) REFERENCES members(id)
);

CREATE TABLE shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INTEGER NOT NULL,
  cashier_id INTEGER NOT NULL,
  shift_name TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  opening_cash DECIMAL(10,2) DEFAULT 0,
  closing_cash DECIMAL(10,2),
  expected_cash DECIMAL(10,2),
  cash_difference DECIMAL(10,2),
  status TEXT DEFAULT 'open',
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id)
);

CREATE TABLE nozzle_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nozzle_id INTEGER NOT NULL,
  shift_id INTEGER NOT NULL,
  reading_start DECIMAL(10,2) NOT NULL,
  reading_end DECIMAL(10,2),
  volume_calculated DECIMAL(10,2),
  volume_actual DECIMAL(10,2),
  difference DECIMAL(10,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nozzle_id) REFERENCES nozzles(id),
  FOREIGN KEY (shift_id) REFERENCES shifts(id)
);

CREATE TABLE inventory_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INTEGER NOT NULL,
  fuel_type_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  volume DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  reference_id INTEGER,
  operator_id INTEGER,
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id),
  FOREIGN KEY (fuel_type_id) REFERENCES fuel_types(id)
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  station_id INTEGER,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id)
);

CREATE TABLE complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  transaction_id INTEGER,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  handled_by INTEGER,
  handled_at DATETIME,
  result TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

CREATE TABLE point_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  fuel_type_id INTEGER,
  station_id INTEGER,
  points_per_yuan INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trans_station ON transactions(station_id);
CREATE INDEX idx_trans_member ON transactions(member_id);
CREATE INDEX idx_trans_time ON transactions(end_time);
CREATE INDEX idx_trans_status ON transactions(status);
CREATE INDEX idx_member_coupon ON member_coupons(member_id, status);
`);

const bcrypt = require('bcryptjs');
const hashPwd = (p) => bcrypt.hashSync(p, 10);

const insert = db.prepare(`
INSERT INTO stations (name, address) VALUES 
('中心加油站', '北京市朝阳区建国路88号'),
('东三环加油站', '北京市朝阳区东三环中路12号');
`);
insert.run();

const insertFuel = db.prepare(`
INSERT INTO fuel_types (code, name) VALUES 
('92#', '92号汽油'),
('95#', '95号汽油'),
('98#', '98号汽油'),
('0#', '0号柴油');
`);
insertFuel.run();

const insertPrices = db.prepare(`
INSERT INTO station_fuel_prices (station_id, fuel_type_id, price, effective_from) VALUES 
(1, 1, 7.58, '2024-01-01 00:00:00'),
(1, 2, 8.12, '2024-01-01 00:00:00'),
(1, 3, 8.95, '2024-01-01 00:00:00'),
(1, 4, 7.25, '2024-01-01 00:00:00'),
(2, 1, 7.55, '2024-01-01 00:00:00'),
(2, 2, 8.08, '2024-01-01 00:00:00');
`);
insertPrices.run();

const insertNozzles = db.prepare(`
INSERT INTO nozzles (station_id, nozzle_number, fuel_type_id) VALUES 
(1, '1号枪', 1),
(1, '2号枪', 1),
(1, '3号枪', 2),
(1, '4号枪', 2),
(1, '5号枪', 3),
(1, '6号枪', 4),
(2, '1号枪', 1),
(2, '2号枪', 1),
(2, '3号枪', 2),
(2, '4号枪', 4);
`);
insertNozzles.run();

const insertTank = db.prepare(`
INSERT INTO tank_inventory (station_id, fuel_type_id, current_volume) VALUES 
(1, 1, 8500),
(1, 2, 6200),
(1, 3, 3500),
(1, 4, 7800),
(2, 1, 9000),
(2, 2, 5500),
(2, 4, 6800);
`);
insertTank.run();

const insertLevels = db.prepare(`
INSERT INTO member_levels (name, min_points, discount_rate, point_multiplier, description) VALUES 
('普通会员', 0, 0, 1, '初始等级'),
('银卡会员', 1000, 0.02, 1.2, '累计积分1000升级'),
('金卡会员', 5000, 0.05, 1.5, '累计积分5000升级'),
('钻石会员', 20000, 0.08, 2, '累计积分20000升级');
`);
insertLevels.run();

const insertPackages = db.prepare(`
INSERT INTO stored_value_packages (name, amount, bonus_amount, bonus_points) VALUES 
('充1000送50', 1000, 50, 100),
('充2000送150', 2000, 150, 250),
('充5000送400', 5000, 400, 600),
('充10000送1000', 10000, 1000, 1500);
`);
insertPackages.run();

const insertCoupons = db.prepare(`
INSERT INTO coupons (code, name, type, value, min_amount, fuel_type_ids, valid_from, valid_to, total_issued) VALUES 
('NEW2024', '新用户立减20', 'fixed', 20, 100, '1,2,3,4', '2024-01-01', '2024-12-31', 1000),
('FUEL50', '满300减50', 'fixed', 50, 300, '1,2', '2024-01-01', '2024-06-30', 500),
('VIP10', '会员专享9折', 'percent', 10, 0, '1,2,3,4', '2024-01-01', '2024-12-31', 2000),
('DIESEL30', '柴油满200减30', 'fixed', 30, 200, '4', '2024-01-01', '2024-03-31', 300);
`);
insertCoupons.run();

const insertUsers = db.prepare(`
INSERT INTO users (username, password, name, role, station_id) VALUES 
('admin', ?, '系统管理员', 'hq', NULL),
('hq_finance', ?, '财务张总', 'finance', NULL),
('hq_ops', ?, '运营李经理', 'operation', NULL),
('station1_mgr', ?, '中心站王站长', 'manager', 1),
('station2_mgr', ?, '东三环刘站长', 'manager', 2),
('station1_cash1', ?, '中心站收银员赵', 'cashier', 1),
('station1_cash2', ?, '中心站收银员钱', 'cashier', 1),
('station2_cash1', ?, '东三环收银员孙', 'cashier', 2);
`);
insertUsers.run(
  hashPwd('admin123'),
  hashPwd('finance123'),
  hashPwd('operation123'),
  hashPwd('manager123'),
  hashPwd('manager123'),
  hashPwd('cashier123'),
  hashPwd('cashier123'),
  hashPwd('cashier123')
);

const insertMembers = db.prepare(`
INSERT INTO members (phone, name, password, level_id, balance, points) VALUES 
('13800000001', '张三', ?, 2, 2500, 1850),
('13800000002', '李四', ?, 3, 8000, 6500),
('13800000003', '王五', ?, 1, 300, 200),
('13800000004', '赵六', ?, 4, 15000, 25000),
('13800000005', '钱七', ?, 1, 0, 0);
`);
insertMembers.run(
  hashPwd('123456'),
  hashPwd('123456'),
  hashPwd('123456'),
  hashPwd('123456'),
  hashPwd('123456')
);

const insertVehicles = db.prepare(`
INSERT INTO vehicles (member_id, plate_number, brand, model, fuel_type_id, default_flag) VALUES 
(1, '京A12345', '大众', '迈腾', 2, 1),
(2, '京B67890', '宝马', 'X5', 3, 1),
(3, '京C54321', '丰田', '卡罗拉', 1, 1),
(4, '京D98765', '奔驰', 'S450', 3, 1),
(4, '京E11111', '保时捷', 'Cayenne', 3, 0),
(1, '京F22222', '奥迪', 'A6L', 2, 0);
`);
insertVehicles.run();

const insertMemberCoupons = db.prepare(`
INSERT INTO member_coupons (member_id, coupon_id, status) VALUES 
(1, 1, 'available'),
(1, 2, 'available'),
(2, 3, 'available'),
(2, 1, 'used'),
(3, 1, 'available'),
(4, 3, 'available');
`);
insertMemberCoupons.run();

const insertTransactions = db.prepare(`
INSERT INTO transactions (station_id, nozzle_id, member_id, vehicle_id, fuel_type_id, volume, unit_price, original_amount, discount_amount, coupon_amount, final_amount, payment_method, points_earned, cashier_id, status, invoice_status, end_time) VALUES 
(1, 2, 1, 1, 2, 50, 8.12, 406, 8.12, 20, 377.88, 'balance', 45, 6, 'completed', 'none', '2024-01-15 09:30:00'),
(1, 4, 2, 2, 3, 65, 8.95, 581.75, 29.09, 0, 552.66, 'balance', 83, 6, 'completed', 'issued', '2024-01-15 10:15:00'),
(2, 1, 3, 3, 1, 45, 7.55, 339.75, 0, 20, 319.75, 'wechat', 32, 8, 'completed', 'pending', '2024-01-15 11:00:00'),
(1, 3, 4, 4, 3, 70, 8.95, 626.5, 50.12, 0, 576.38, 'balance', 115, 7, 'completed', 'none', '2024-01-15 14:20:00'),
(1, 1, NULL, NULL, 1, 35, 7.58, 265.3, 0, 0, 265.3, 'cash', 0, 6, 'completed', 'none', '2024-01-15 15:45:00'),
(2, 3, NULL, NULL, 2, 55, 8.08, 444.4, 0, 0, 444.4, 'alipay', 0, 8, 'completed', 'none', '2024-01-15 16:30:00');
`);
insertTransactions.run();

const insertInvoices = db.prepare(`
INSERT INTO invoices (transaction_id, member_id, invoice_type, invoice_title, tax_number, amount, status, issued_at) VALUES 
(2, 2, 'company', '科技有限公司', '91110000MA001ABCDE', 581.75, 'issued', '2024-01-15 11:00:00'),
(3, 3, 'personal', '王五', NULL, 339.75, 'pending', NULL);
`);
insertInvoices.run();

const insertShifts = db.prepare(`
INSERT INTO shifts (station_id, cashier_id, shift_name, start_time, end_time, opening_cash, closing_cash, expected_cash, cash_difference, status) VALUES 
(1, 6, '早班', '2024-01-15 08:00:00', '2024-01-15 16:00:00', 500, 1142.3, 1142.3, 0, 'closed'),
(1, 7, '晚班', '2024-01-15 16:00:00', NULL, 500, NULL, NULL, NULL, 'open'),
(2, 8, '早班', '2024-01-15 08:00:00', NULL, 300, NULL, NULL, NULL, 'open');
`);
insertShifts.run();

const insertPointRules = db.prepare(`
INSERT INTO point_rules (name, points_per_yuan) VALUES 
('默认积分规则', 1);
`);
insertPointRules.run();

db.close();
console.log('数据库初始化完成！');
console.log('默认账号: admin/admin123, station1_mgr/manager123, station1_cash1/cashier123');
console.log('会员测试账号: 13800000001/123456');
