require('dotenv').config();
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  -- 用户表
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    real_name TEXT,
    phone TEXT,
    email TEXT,
    role_id INTEGER,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 角色表
  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 车辆表
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_number TEXT UNIQUE NOT NULL,
    vehicle_type TEXT,
    vehicle_model TEXT,
    capacity REAL,
    load_limit REAL,
    fuel_type TEXT,
    status TEXT DEFAULT 'idle',
    gps_device_id TEXT,
    driver_id INTEGER,
    current_lat REAL,
    current_lng REAL,
    current_address TEXT,
    speed REAL,
    direction TEXT,
    door_status INTEGER DEFAULT 0,
    light_status INTEGER DEFAULT 0,
    cargo_door_status INTEGER DEFAULT 0,
    current_load REAL,
    last_report_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 司机表
  CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    real_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    id_card TEXT UNIQUE,
    driver_license TEXT,
    license_type TEXT,
    status INTEGER DEFAULT 1,
    vehicle_id INTEGER,
    current_order_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 货物表
  CREATE TABLE IF NOT EXISTS cargo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    cargo_name TEXT NOT NULL,
    cargo_type TEXT,
    weight REAL,
    volume REAL,
    quantity INTEGER,
    packaging TEXT,
    special_requirements TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 订单表
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    origin_address TEXT NOT NULL,
    origin_lat REAL,
    origin_lng REAL,
    dest_address TEXT NOT NULL,
    dest_lat REAL,
    dest_lng REAL,
    order_type TEXT,
    priority INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    vehicle_id INTEGER,
    driver_id INTEGER,
    plan_departure_time DATETIME,
    plan_arrival_time DATETIME,
    actual_departure_time DATETIME,
    actual_arrival_time DATETIME,
    estimated_arrival_time DATETIME,
    total_distance REAL,
    total_fee REAL,
    oil_consumption REAL,
    remark TEXT,
    created_by INTEGER,
    reviewed_by INTEGER,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 调度指令表
  CREATE TABLE IF NOT EXISTS dispatch_instructions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instruction_no TEXT UNIQUE NOT NULL,
    order_id INTEGER,
    vehicle_id INTEGER,
    driver_id INTEGER,
    instruction_type TEXT NOT NULL,
    content TEXT NOT NULL,
    priority INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    send_method TEXT DEFAULT 'app',
    sent_by INTEGER,
    sent_at DATETIME,
    read_at DATETIME,
    confirmed_at DATETIME,
    response_content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- GPS轨迹表
  CREATE TABLE IF NOT EXISTS gps_tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    order_id INTEGER,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    address TEXT,
    speed REAL,
    direction TEXT,
    altitude REAL,
    door_status INTEGER,
    light_status INTEGER,
    cargo_door_status INTEGER,
    current_load REAL,
    report_time DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 费用结算表
  CREATE TABLE IF NOT EXISTS settlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    settlement_no TEXT UNIQUE NOT NULL,
    order_id INTEGER,
    vehicle_id INTEGER,
    driver_id INTEGER,
    base_fee REAL DEFAULT 0,
    distance_fee REAL DEFAULT 0,
    oil_fee REAL DEFAULT 0,
    toll_fee REAL DEFAULT 0,
    other_fee REAL DEFAULT 0,
    total_fee REAL DEFAULT 0,
    actual_payment REAL,
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    settled_at DATETIME,
    settled_by INTEGER,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 数据字典表
  CREATE TABLE IF NOT EXISTS data_dictionary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dict_type TEXT NOT NULL,
    dict_key TEXT NOT NULL,
    dict_value TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dict_type, dict_key)
  );

  -- 区域监控表
  CREATE TABLE IF NOT EXISTS geo_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    zone_type TEXT,
    center_lat REAL,
    center_lng REAL,
    radius REAL,
    polygon_coords TEXT,
    alert_in INTEGER DEFAULT 0,
    alert_out INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 越界记录表
  CREATE TABLE IF NOT EXISTS zone_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zone_id INTEGER,
    vehicle_id INTEGER,
    alert_type TEXT,
    lat REAL,
    lng REAL,
    address TEXT,
    alert_time DATETIME,
    handled_at DATETIME,
    handled_by INTEGER,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 订单状态流转日志
  CREATE TABLE IF NOT EXISTS order_status_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    operator_id INTEGER,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 车辆状态日志
  CREATE TABLE IF NOT EXISTS vehicle_status_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    operator_id INTEGER,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const hashedPassword = bcrypt.hashSync('123456', 10);

const roles = [
  { name: '系统管理员', code: 'admin', description: '系统最高权限', permissions: 'all' },
  { name: '调度员', code: 'dispatcher', description: '负责车辆调度和订单分配', permissions: 'dispatch,order,vehicle' },
  { name: '司机', code: 'driver', description: '执行运输任务', permissions: 'driver_task' },
  { name: '财务员', code: 'accountant', description: '费用结算和报表', permissions: 'settlement,report' },
  { name: '货主', code: 'shipper', description: '查看订单和货物位置', permissions: 'view_order,track_cargo' }
];

const insertRole = db.prepare('INSERT OR IGNORE INTO roles (name, code, description, permissions) VALUES (?, ?, ?, ?)');
roles.forEach(role => {
  insertRole.run(role.name, role.code, role.description, role.permissions);
});

const users = [
  { username: 'admin', password: hashedPassword, real_name: '系统管理员', phone: '13800138000', role_id: 1 },
  { username: 'dispatcher', password: hashedPassword, real_name: '张调度', phone: '13800138001', role_id: 2 },
  { username: 'accountant', password: hashedPassword, real_name: '李财务', phone: '13800138002', role_id: 4 }
];

const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, real_name, phone, role_id) VALUES (?, ?, ?, ?, ?)');
users.forEach(user => {
  insertUser.run(user.username, user.password, user.real_name, user.phone, user.role_id);
});

const drivers = [
  { real_name: '王司机', phone: '13900139001', id_card: '110101199001011234', driver_license: 'A1', license_type: 'A1' },
  { real_name: '赵司机', phone: '13900139002', id_card: '110101199002022345', driver_license: 'B2', license_type: 'B2' },
  { real_name: '刘司机', phone: '13900139003', id_card: '110101199003033456', driver_license: 'A2', license_type: 'A2' }
];

const insertDriver = db.prepare('INSERT OR IGNORE INTO drivers (real_name, phone, id_card, driver_license, license_type) VALUES (?, ?, ?, ?, ?)');
drivers.forEach(driver => {
  insertDriver.run(driver.real_name, driver.phone, driver.id_card, driver.driver_license, driver.license_type);
});

const vehicles = [
  { plate_number: '京A12345', vehicle_type: '厢式货车', vehicle_model: '解放J6', capacity: 10, load_limit: 5000, fuel_type: '柴油', gps_device_id: 'GPS001' },
  { plate_number: '京B23456', vehicle_type: '冷藏车', vehicle_model: '东风天龙', capacity: 15, load_limit: 8000, fuel_type: '柴油', gps_device_id: 'GPS002' },
  { plate_number: '京C34567', vehicle_type: '平板车', vehicle_model: '重汽豪沃', capacity: 20, load_limit: 10000, fuel_type: '柴油', gps_device_id: 'GPS003' },
  { plate_number: '京D45678', vehicle_type: '厢式货车', vehicle_model: '福田欧曼', capacity: 8, load_limit: 4000, fuel_type: '柴油', gps_device_id: 'GPS004' }
];

const insertVehicle = db.prepare('INSERT OR IGNORE INTO vehicles (plate_number, vehicle_type, vehicle_model, capacity, load_limit, fuel_type, gps_device_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
vehicles.forEach(vehicle => {
  insertVehicle.run(vehicle.plate_number, vehicle.vehicle_type, vehicle.vehicle_model, vehicle.capacity, vehicle.load_limit, vehicle.fuel_type, vehicle.gps_device_id);
});

const dictData = [
  { dict_type: 'order_status', dict_key: 'pending', dict_value: '待审核', sort_order: 1 },
  { dict_type: 'order_status', dict_key: 'reviewed', dict_value: '已审核', sort_order: 2 },
  { dict_type: 'order_status', dict_key: 'planned', dict_value: '已计划', sort_order: 3 },
  { dict_type: 'order_status', dict_key: 'loading', dict_value: '装货中', sort_order: 4 },
  { dict_type: 'order_status', dict_key: 'transit', dict_value: '运输中', sort_order: 5 },
  { dict_type: 'order_status', dict_key: 'unloading', dict_value: '卸货中', sort_order: 6 },
  { dict_type: 'order_status', dict_key: 'completed', dict_value: '已完成', sort_order: 7 },
  { dict_type: 'order_status', dict_key: 'cancelled', dict_value: '已取消', sort_order: 8 },
  { dict_type: 'vehicle_status', dict_key: 'idle', dict_value: '空闲', sort_order: 1 },
  { dict_type: 'vehicle_status', dict_key: 'maintenance', dict_value: '维护中', sort_order: 2 },
  { dict_type: 'vehicle_status', dict_key: 'transit', dict_value: '运输中', sort_order: 3 },
  { dict_type: 'vehicle_status', dict_key: 'loading', dict_value: '装货中', sort_order: 4 },
  { dict_type: 'vehicle_status', dict_key: 'unloading', dict_value: '卸货中', sort_order: 5 },
  { dict_type: 'instruction_type', dict_key: 'pickup', dict_value: '取货指令', sort_order: 1 },
  { dict_type: 'instruction_type', dict_key: 'dispatch', dict_value: '调度指令', sort_order: 2 },
  { dict_type: 'instruction_type', dict_key: 'confirm', dict_value: '确认指令', sort_order: 3 },
  { dict_type: 'instruction_type', dict_key: 'emergency', dict_value: '紧急指令', sort_order: 4 },
  { dict_type: 'instruction_status', dict_key: 'pending', dict_value: '待发送', sort_order: 1 },
  { dict_type: 'instruction_status', dict_key: 'sent', dict_value: '已发送', sort_order: 2 },
  { dict_type: 'instruction_status', dict_key: 'read', dict_value: '已读', sort_order: 3 },
  { dict_type: 'instruction_status', dict_key: 'confirmed', dict_value: '已确认', sort_order: 4 },
  { dict_type: 'priority', dict_key: '1', dict_value: '普通', sort_order: 1 },
  { dict_type: 'priority', dict_key: '2', dict_value: '紧急', sort_order: 2 },
  { dict_type: 'priority', dict_key: '3', dict_value: '特急', sort_order: 3 }
];

const insertDict = db.prepare('INSERT OR IGNORE INTO data_dictionary (dict_type, dict_key, dict_value, sort_order) VALUES (?, ?, ?, ?)');
dictData.forEach(item => {
  insertDict.run(item.dict_type, item.dict_key, item.dict_value, item.sort_order);
});

console.log('数据库初始化完成！');
console.log('默认账户信息：');
console.log('  管理员: admin / 123456');
console.log('  调度员: dispatcher / 123456');
console.log('  财务员: accountant / 123456');

db.close();
