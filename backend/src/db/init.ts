import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('开始创建数据库表...');

  db.run(`PRAGMA foreign_keys = ON`);

  db.run(`DROP TABLE IF EXISTS users`);
  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    real_name TEXT,
    phone TEXT UNIQUE,
    email TEXT,
    role TEXT NOT NULL CHECK(role IN ('customer', 'store', 'operation', 'risk', 'service', 'finance')),
    id_card TEXT,
    license_number TEXT,
    license_verified INTEGER DEFAULT 0,
    avatar TEXT,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`DROP TABLE IF EXISTS stores`);
  db.run(`CREATE TABLE stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    province TEXT,
    city TEXT,
    district TEXT,
    contact_person TEXT,
    contact_phone TEXT,
    business_hours TEXT,
    description TEXT,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`DROP TABLE IF EXISTS vehicles`);
  db.run(`CREATE TABLE vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_number TEXT UNIQUE NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    color TEXT,
    year INTEGER,
    mileage INTEGER DEFAULT 0,
    fuel_type TEXT CHECK(fuel_type IN ('gasoline', 'electric', 'hybrid')),
    transmission TEXT CHECK(transmission IN ('auto', 'manual')),
    seats INTEGER,
    daily_rate REAL NOT NULL,
    deposit_amount REAL NOT NULL,
    insurance_fee REAL DEFAULT 0,
    store_id INTEGER REFERENCES stores(id),
    status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'maintenance', 'rented', 'reserved', 'offline')),
    description TEXT,
    images TEXT,
    features TEXT,
    last_maintenance_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`DROP TABLE IF EXISTS orders`);
  db.run(`CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    pickup_store_id INTEGER REFERENCES stores(id),
    return_store_id INTEGER REFERENCES stores(id),
    pickup_time DATETIME NOT NULL,
    return_time DATETIME NOT NULL,
    actual_pickup_time DATETIME,
    actual_return_time DATETIME,
    daily_rate REAL NOT NULL,
    total_days INTEGER NOT NULL,
    base_amount REAL NOT NULL,
    insurance_fee REAL DEFAULT 0,
    other_fee REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    deposit_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'picked_up', 'in_use', 'returned', 'settled', 'completed', 'cancelled', 'overdue')),
    pickup_mileage INTEGER,
    return_mileage INTEGER,
    pickup_fuel_level INTEGER,
    return_fuel_level INTEGER,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`DROP TABLE IF EXISTS deposits`);
  db.run(`CREATE TABLE deposits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id),
    user_id INTEGER REFERENCES users(id),
    amount REAL NOT NULL,
    payment_method TEXT,
    transaction_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'frozen', 'partial_refunded', 'refunded', 'deducted')),
    paid_at DATETIME,
    refund_at DATETIME,
    refund_amount REAL DEFAULT 0,
    deduction_amount REAL DEFAULT 0,
    deduction_reason TEXT,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`DROP TABLE IF EXISTS inspections`);
  db.run(`CREATE TABLE inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    type TEXT NOT NULL CHECK(type IN ('pickup', 'return')),
    mileage INTEGER,
    fuel_level INTEGER,
    electric_level INTEGER,
    exterior_damages TEXT,
    interior_damages TEXT,
    photos TEXT,
    operator_id INTEGER REFERENCES users(id),
    operator_name TEXT,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`DROP TABLE IF EXISTS trajectories`);
  db.run(`CREATE TABLE trajectories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    latitude REAL,
    longitude REAL,
    speed REAL,
    heading REAL,
    location TEXT,
    is_over_region INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`DROP TABLE IF EXISTS violations`);
  db.run(`CREATE TABLE violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    user_id INTEGER REFERENCES users(id),
    violation_time DATETIME,
    violation_location TEXT,
    violation_type TEXT,
    fine_amount REAL DEFAULT 0,
    deduction_points INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'paid', 'appealed', 'resolved')),
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`DROP TABLE IF EXISTS settlements`);
  db.run(`CREATE TABLE settlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id),
    user_id INTEGER REFERENCES users(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    base_amount REAL NOT NULL,
    extra_mileage_fee REAL DEFAULT 0,
    fuel_fee REAL DEFAULT 0,
    violation_fee REAL DEFAULT 0,
    damage_fee REAL DEFAULT 0,
    overdue_fee REAL DEFAULT 0,
    other_fee REAL DEFAULT 0,
    total_settlement REAL NOT NULL,
    deposit_refund REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'paid', 'completed')),
    settlement_time DATETIME,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`DROP TABLE IF EXISTS license_verifications`);
  db.run(`CREATE TABLE license_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    license_number TEXT NOT NULL,
    license_type TEXT,
    issue_date DATE,
    expiry_date DATE,
    id_card_front TEXT,
    id_card_back TEXT,
    license_front TEXT,
    license_back TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    reviewer_id INTEGER REFERENCES users(id),
    review_remark TEXT,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log('数据库表创建完成');

  const bcrypt = require('bcryptjs');
  const saltRounds = 10;

  const hashPassword = (pwd: string) => bcrypt.hashSync(pwd, saltRounds);

  const stores = [
    { name: '北京朝阳区旗舰店', address: '北京市朝阳区建国路88号', province: '北京', city: '北京', district: '朝阳区', contact_person: '张经理', contact_phone: '13800138001', business_hours: '09:00-21:00' },
    { name: '上海浦东机场店', address: '上海市浦东新区浦东机场T2航站楼', province: '上海', city: '上海', district: '浦东新区', contact_person: '李经理', contact_phone: '13800138002', business_hours: '08:00-23:00' },
    { name: '广州天河店', address: '广州市天河区体育西路103号', province: '广东', city: '广州', district: '天河区', contact_person: '王经理', contact_phone: '13800138003', business_hours: '09:00-21:00' },
    { name: '深圳南山店', address: '深圳市南山区科技园南路1号', province: '广东', city: '深圳', district: '南山区', contact_person: '赵经理', contact_phone: '13800138004', business_hours: '09:00-21:00' },
    { name: '杭州西湖店', address: '杭州市西湖区文三路478号', province: '浙江', city: '杭州', district: '西湖区', contact_person: '钱经理', contact_phone: '13800138005', business_hours: '09:00-21:00' }
  ];

  const users = [
    { username: 'admin', password: hashPassword('admin123'), real_name: '系统管理员', phone: '13900000000', email: 'admin@example.com', role: 'operation', status: 1 },
    { username: 'risk01', password: hashPassword('risk123'), real_name: '风控专员', phone: '13900000001', email: 'risk@example.com', role: 'risk', status: 1 },
    { username: 'service01', password: hashPassword('service123'), real_name: '客服专员', phone: '13900000002', email: 'service@example.com', role: 'service', status: 1 },
    { username: 'finance01', password: hashPassword('finance123'), real_name: '财务专员', phone: '13900000003', email: 'finance@example.com', role: 'finance', status: 1 },
    { username: 'store01', password: hashPassword('store123'), real_name: '门店管理员', phone: '13900000004', email: 'store@example.com', role: 'store', status: 1 },
    { username: 'customer01', password: hashPassword('cust123'), real_name: '张三', phone: '13800138101', email: 'zhangsan@example.com', role: 'customer', id_card: '110101199001011234', license_number: '110101199001011234', license_verified: 1, status: 1 },
    { username: 'customer02', password: hashPassword('cust123'), real_name: '李四', phone: '13800138102', email: 'lisi@example.com', role: 'customer', id_card: '310101199002021234', license_number: '310101199002021234', license_verified: 1, status: 1 },
    { username: 'customer03', password: hashPassword('cust123'), real_name: '王五', phone: '13800138103', email: 'wangwu@example.com', role: 'customer', id_card: '440101199003031234', license_number: '440101199003031234', license_verified: 0, status: 1 }
  ];

  const vehicles = [
    { plate_number: '京A12345', brand: '丰田', model: '凯美瑞', color: '黑色', year: 2023, fuel_type: 'gasoline', transmission: 'auto', seats: 5, daily_rate: 299, deposit_amount: 3000, insurance_fee: 30, store_id: 1, status: 'available', description: '舒适型轿车，适合商务出行', features: 'GPS,蓝牙,倒车雷达,真皮座椅' },
    { plate_number: '京B67890', brand: '特斯拉', model: 'Model 3', color: '白色', year: 2024, fuel_type: 'electric', transmission: 'auto', seats: 5, daily_rate: 499, deposit_amount: 5000, insurance_fee: 50, store_id: 1, status: 'available', description: '新能源电动车，科技感十足', features: '自动驾驶,全景天窗,真皮座椅' },
    { plate_number: '沪A11111', brand: '宝马', model: '3系', color: '蓝色', year: 2023, fuel_type: 'gasoline', transmission: 'auto', seats: 5, daily_rate: 599, deposit_amount: 6000, insurance_fee: 60, store_id: 2, status: 'available', description: '豪华运动轿车', features: 'GPS,蓝牙,真皮座椅,电动调节' },
    { plate_number: '沪A22222', brand: '别克', model: 'GL8', color: '银色', year: 2022, fuel_type: 'gasoline', transmission: 'auto', seats: 7, daily_rate: 699, deposit_amount: 5000, insurance_fee: 70, store_id: 2, status: 'rented', description: '7座MPV，家庭出游首选', features: 'GPS,蓝牙,真皮座椅,后排娱乐' },
    { plate_number: '粤A33333', brand: '本田', model: '雅阁', color: '黑色', year: 2023, fuel_type: 'hybrid', transmission: 'auto', seats: 5, daily_rate: 349, deposit_amount: 3000, insurance_fee: 35, store_id: 3, status: 'available', description: '混合动力，省油环保', features: 'GPS,蓝牙,真皮座椅' },
    { plate_number: '粤B44444', brand: '奔驰', model: 'C级', color: '白色', year: 2024, fuel_type: 'gasoline', transmission: 'auto', seats: 5, daily_rate: 799, deposit_amount: 8000, insurance_fee: 80, store_id: 4, status: 'available', description: '豪华轿车，彰显品位', features: 'GPS,蓝牙,真皮座椅,氛围灯' },
    { plate_number: '浙A55555', brand: '奥迪', model: 'A6L', color: '黑色', year: 2023, fuel_type: 'gasoline', transmission: 'auto', seats: 5, daily_rate: 899, deposit_amount: 10000, insurance_fee: 90, store_id: 5, status: 'maintenance', description: '行政级轿车，商务首选', features: 'GPS,蓝牙,真皮座椅,后排娱乐' },
    { plate_number: '京C66666', brand: '大众', model: '帕萨特', color: '黑色', year: 2022, fuel_type: 'gasoline', transmission: 'auto', seats: 5, daily_rate: 259, deposit_amount: 2000, insurance_fee: 25, store_id: 1, status: 'available', description: '经济实用型轿车', features: 'GPS,蓝牙,倒车雷达' },
    { plate_number: '沪C77777', brand: '比亚迪', model: '汉EV', color: '红色', year: 2024, fuel_type: 'electric', transmission: 'auto', seats: 5, daily_rate: 399, deposit_amount: 4000, insurance_fee: 40, store_id: 2, status: 'reserved', description: '国产新能源旗舰', features: '自动驾驶,全景天窗,真皮座椅' },
    { plate_number: '粤C88888', brand: '丰田', model: '汉兰达', color: '白色', year: 2023, fuel_type: 'hybrid', transmission: 'auto', seats: 7, daily_rate: 549, deposit_amount: 5000, insurance_fee: 55, store_id: 3, status: 'available', description: '7座SUV，适合大家庭', features: 'GPS,蓝牙,真皮座椅,全景天窗' }
  ];

  const storeStmt = db.prepare('INSERT INTO stores (name, address, province, city, district, contact_person, contact_phone, business_hours, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)');
  stores.forEach(s => storeStmt.run(s.name, s.address, s.province, s.city, s.district, s.contact_person, s.contact_phone, s.business_hours));
  storeStmt.finalize();

  const userStmt = db.prepare('INSERT INTO users (username, password, real_name, phone, email, role, id_card, license_number, license_verified, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  users.forEach(u => userStmt.run(u.username, u.password, u.real_name, u.phone, u.email, u.role, u.id_card || null, u.license_number || null, u.license_verified, u.status));
  userStmt.finalize();

  const vehicleStmt = db.prepare('INSERT INTO vehicles (plate_number, brand, model, color, year, mileage, fuel_type, transmission, seats, daily_rate, deposit_amount, insurance_fee, store_id, status, description, features) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  vehicles.forEach(v => vehicleStmt.run(v.plate_number, v.brand, v.model, v.color, v.year, Math.floor(Math.random() * 50000), v.fuel_type, v.transmission, v.seats, v.daily_rate, v.deposit_amount, v.insurance_fee, v.store_id, v.status, v.description, v.features));
  vehicleStmt.finalize();

  const now = new Date();
  const formatDate = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ');

  const addDays = (d: Date, days: number) => {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + days);
    return nd;
  };

  const orders = [
    {
      order_no: 'ORD202401010001',
      user_id: 6, vehicle_id: 4, pickup_store_id: 2, return_store_id: 2,
      pickup_time: formatDate(addDays(now, -5)), return_time: formatDate(addDays(now, -2)),
      actual_pickup_time: formatDate(addDays(now, -5)), actual_return_time: formatDate(addDays(now, -2)),
      daily_rate: 699, total_days: 3, base_amount: 2097, insurance_fee: 210, total_amount: 2307,
      deposit_amount: 5000, status: 'completed', pickup_mileage: 15000, return_mileage: 15800,
      pickup_fuel_level: 100, return_fuel_level: 60
    },
    {
      order_no: 'ORD202401010002',
      user_id: 7, vehicle_id: 1, pickup_store_id: 1, return_store_id: 1,
      pickup_time: formatDate(addDays(now, -1)), return_time: formatDate(addDays(now, 3)),
      actual_pickup_time: formatDate(addDays(now, -1)),
      daily_rate: 299, total_days: 4, base_amount: 1196, insurance_fee: 120, total_amount: 1316,
      deposit_amount: 3000, status: 'in_use', pickup_mileage: 8500, pickup_fuel_level: 90
    },
    {
      order_no: 'ORD202401010003',
      user_id: 6, vehicle_id: 9, pickup_store_id: 2, return_store_id: 3,
      pickup_time: formatDate(addDays(now, 2)), return_time: formatDate(addDays(now, 5)),
      daily_rate: 399, total_days: 3, base_amount: 1197, insurance_fee: 120, total_amount: 1317,
      deposit_amount: 4000, status: 'paid'
    },
    {
      order_no: 'ORD202401010004',
      user_id: 7, vehicle_id: 10, pickup_store_id: 3, return_store_id: 3,
      pickup_time: formatDate(addDays(now, -10)), return_time: formatDate(addDays(now, -7)),
      actual_pickup_time: formatDate(addDays(now, -10)), actual_return_time: formatDate(addDays(now, -7)),
      daily_rate: 549, total_days: 3, base_amount: 1647, insurance_fee: 165, total_amount: 1812,
      deposit_amount: 5000, status: 'returned', pickup_mileage: 22000, return_mileage: 22500,
      pickup_fuel_level: 80, return_fuel_level: 30
    }
  ];

  const orderStmt = db.prepare(`INSERT INTO orders (order_no, user_id, vehicle_id, pickup_store_id, return_store_id, pickup_time, return_time, actual_pickup_time, actual_return_time, daily_rate, total_days, base_amount, insurance_fee, other_fee, total_amount, deposit_amount, status, pickup_mileage, return_mileage, pickup_fuel_level, return_fuel_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`);
  orders.forEach(o => orderStmt.run(o.order_no, o.user_id, o.vehicle_id, o.pickup_store_id, o.return_store_id, o.pickup_time, o.return_time, o.actual_pickup_time || null, o.actual_return_time || null, o.daily_rate, o.total_days, o.base_amount, o.insurance_fee, o.total_amount, o.deposit_amount, o.status, o.pickup_mileage || null, o.return_mileage || null, o.pickup_fuel_level || null, o.return_fuel_level || null));
  orderStmt.finalize();

  const deposits = [
    { order_id: 1, user_id: 6, amount: 5000, status: 'refunded', paid_at: formatDate(addDays(now, -5)), refund_at: formatDate(addDays(now, -2)), refund_amount: 5000 },
    { order_id: 2, user_id: 7, amount: 3000, status: 'frozen', paid_at: formatDate(addDays(now, -1)) },
    { order_id: 3, user_id: 6, amount: 4000, status: 'paid', paid_at: formatDate(now) },
    { order_id: 4, user_id: 7, amount: 5000, status: 'partial_refunded', paid_at: formatDate(addDays(now, -10)), refund_at: formatDate(addDays(now, -7)), refund_amount: 4500, deduction_amount: 500, deduction_reason: '油费差价' }
  ];

  const depositStmt = db.prepare('INSERT INTO deposits (order_id, user_id, amount, status, paid_at, refund_at, refund_amount, deduction_amount, deduction_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  deposits.forEach(d => depositStmt.run(d.order_id, d.user_id, d.amount, d.status, d.paid_at, d.refund_at || null, d.refund_amount || null, d.deduction_amount || null, d.deduction_reason || null));
  depositStmt.finalize();

  const inspections = [
    { order_id: 1, vehicle_id: 4, type: 'pickup', mileage: 15000, fuel_level: 100, operator_id: 5, operator_name: '门店管理员', remark: '车况良好' },
    { order_id: 1, vehicle_id: 4, type: 'return', mileage: 15800, fuel_level: 60, operator_id: 5, operator_name: '门店管理员', remark: '油费不足40%，需扣除费用' },
    { order_id: 2, vehicle_id: 1, type: 'pickup', mileage: 8500, fuel_level: 90, operator_id: 5, operator_name: '门店管理员', remark: '车况良好，外观无损伤' },
    { order_id: 4, vehicle_id: 10, type: 'pickup', mileage: 22000, fuel_level: 80, operator_id: 5, operator_name: '门店管理员', remark: '车况良好' },
    { order_id: 4, vehicle_id: 10, type: 'return', mileage: 22500, fuel_level: 30, operator_id: 5, operator_name: '门店管理员', remark: '右前门有轻微划痕，油费不足' }
  ];

  const inspectionStmt = db.prepare('INSERT INTO inspections (order_id, vehicle_id, type, mileage, fuel_level, operator_id, operator_name, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  inspections.forEach(i => inspectionStmt.run(i.order_id, i.vehicle_id, i.type, i.mileage, i.fuel_level, i.operator_id, i.operator_name, i.remark));
  inspectionStmt.finalize();

  const violations = [
    { order_id: 1, vehicle_id: 4, user_id: 6, violation_time: formatDate(addDays(now, -4)), violation_location: '上海市浦东新区内环高架', violation_type: '超速行驶', fine_amount: 200, deduction_points: 3, status: 'resolved' },
    { order_id: 4, vehicle_id: 10, user_id: 7, violation_time: formatDate(addDays(now, -9)), violation_location: '广州市天河区天河路', violation_type: '违停', fine_amount: 100, deduction_points: 0, status: 'pending' }
  ];

  const violationStmt = db.prepare('INSERT INTO violations (order_id, vehicle_id, user_id, violation_time, violation_location, violation_type, fine_amount, deduction_points, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  violations.forEach(v => violationStmt.run(v.order_id, v.vehicle_id, v.user_id, v.violation_time, v.violation_location, v.violation_type, v.fine_amount, v.deduction_points, v.status));
  violationStmt.finalize();

  const settlements = [
    { order_id: 1, user_id: 6, vehicle_id: 4, base_amount: 2097, fuel_fee: 200, violation_fee: 200, total_settlement: 2497, deposit_refund: 5000, status: 'completed', settlement_time: formatDate(addDays(now, -2)) },
    { order_id: 4, user_id: 7, vehicle_id: 10, base_amount: 1647, fuel_fee: 300, damage_fee: 200, total_settlement: 2147, deposit_refund: 4500, status: 'completed', settlement_time: formatDate(addDays(now, -7)) }
  ];

  const settlementStmt = db.prepare('INSERT INTO settlements (order_id, user_id, vehicle_id, base_amount, extra_mileage_fee, fuel_fee, violation_fee, damage_fee, overdue_fee, other_fee, total_settlement, deposit_refund, status, settlement_time) VALUES (?, ?, ?, ?, 0, ?, ?, ?, 0, 0, ?, ?, ?, ?)');
  settlements.forEach(s => settlementStmt.run(s.order_id, s.user_id, s.vehicle_id, s.base_amount, s.fuel_fee || 0, s.violation_fee || 0, s.damage_fee || 0, s.total_settlement, s.deposit_refund, s.status, s.settlement_time));
  settlementStmt.finalize();

  const licenseVerifications = [
    { user_id: 6, license_number: '110101199001011234', license_type: 'C1', issue_date: '2012-05-10', expiry_date: '2028-05-10', status: 'approved', reviewer_id: 2, review_remark: '驾照真实有效', reviewed_at: formatDate(addDays(now, -30)) },
    { user_id: 7, license_number: '310101199002021234', license_type: 'C1', issue_date: '2010-08-15', expiry_date: '2026-08-15', status: 'approved', reviewer_id: 2, review_remark: '驾照真实有效', reviewed_at: formatDate(addDays(now, -20)) },
    { user_id: 8, license_number: '440101199003031234', license_type: 'C2', issue_date: '2023-01-20', expiry_date: '2029-01-20', status: 'pending' }
  ];

  const licenseStmt = db.prepare('INSERT INTO license_verifications (user_id, license_number, license_type, issue_date, expiry_date, status, reviewer_id, review_remark, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  licenseVerifications.forEach(l => licenseStmt.run(l.user_id, l.license_number, l.license_type, l.issue_date, l.expiry_date, l.status, l.reviewer_id || null, l.review_remark || null, l.reviewed_at || null));
  licenseStmt.finalize();

  console.log('种子数据插入完成');

  db.close((err) => {
    if (err) {
      console.error('关闭数据库失败:', err.message);
    } else {
      console.log('数据库初始化完成!');
      console.log('数据库文件:', dbPath);
    }
  });
});
