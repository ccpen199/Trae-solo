import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { config } from './config';

const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (path: string) => any };

const dbPath = path.join(__dirname, '../', config.dbPath);
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      balance REAL DEFAULT 0,
      campus_card_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS manufacturers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      device_type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_no TEXT UNIQUE NOT NULL,
      qr_code TEXT UNIQUE NOT NULL,
      name TEXT,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'idle',
      lock_status INTEGER DEFAULT 0,
      location TEXT,
      address TEXT,
      lat REAL,
      lng REAL,
      property_id INTEGER,
      manufacturer_id INTEGER,
      firmware_version TEXT,
      nb_iot_ip TEXT,
      wifi_mac TEXT,
      last_online DATETIME,
      power_consumption REAL DEFAULT 0,
      water_consumption REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id)
    );

    CREATE TABLE IF NOT EXISTS device_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      status TEXT,
      fault_code TEXT,
      door_lock INTEGER,
      power_usage REAL,
      water_usage REAL,
      temperature REAL,
      remain_time INTEGER,
      reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      device_id INTEGER NOT NULL,
      program_id INTEGER,
      start_time DATETIME,
      end_time DATETIME,
      actual_duration INTEGER,
      total_cost REAL DEFAULT 0,
      pay_amount REAL DEFAULT 0,
      pay_method TEXT,
      pay_status TEXT DEFAULT 'unpaid',
      order_status TEXT DEFAULT 'created',
      energy_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (device_id) REFERENCES devices(id),
      FOREIGN KEY (program_id) REFERENCES programs(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      transaction_no TEXT,
      status TEXT DEFAULT 'pending',
      paid_at DATETIME,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      fault_code TEXT,
      description TEXT,
      reporter_id INTEGER,
      handler_id INTEGER,
      property_order_no TEXT,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'normal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (device_id) REFERENCES devices(id),
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (handler_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      level TEXT DEFAULT 'info',
      status TEXT DEFAULT 'active',
      message TEXT,
      triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS energy_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      total_power REAL DEFAULT 0,
      total_water REAL DEFAULT 0,
      total_runs INTEGER DEFAULT 0,
      total_revenue REAL DEFAULT 0,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS settlement_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      total_runs INTEGER DEFAULT 0,
      total_revenue REAL DEFAULT 0,
      settlement_amount REAL DEFAULT 0,
      settlement_type TEXT DEFAULT 'per_use',
      status TEXT DEFAULT 'pending',
      paid_at DATETIME,
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS firmware_upgrades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT NOT NULL,
      file_path TEXT,
      device_type TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS brand_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER,
      primary_color TEXT DEFAULT '#409EFF',
      logo_url TEXT,
      app_name TEXT DEFAULT '智能洗衣',
      welcome_text TEXT DEFAULT '欢迎使用智能洗衣',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS device_commands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      command TEXT NOT NULL,
      params TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      executed_at DATETIME,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );
  `);

  seedTestData();
}

function seedTestData(): void {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const hash123456 = bcrypt.hashSync('123456', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (phone, password_hash, nickname, role, balance)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run('13800138000', hash123456, '张三', 'user', 100.0);
  insertUser.run('13900139000', hash123456, '物业管理员', 'property', 0);
  insertUser.run('13700137000', hash123456, '设备厂商', 'manufacturer', 0);
  insertUser.run('platform', hash123456, '平台运营', 'platform', 0);
  insertUser.run('ops', hash123456, '运维工程师', 'ops', 0);
  insertUser.run('admin', hash123456, '系统管理员', 'admin', 0);

  const insertProperty = db.prepare(`
    INSERT INTO properties (name, contact, phone, address)
    VALUES (?, ?, ?, ?)
  `);

  const prop1 = insertProperty.run('阳光花园物业', '李经理', '13800000001', '北京市朝阳区阳光花园');
  const prop2 = insertProperty.run('幸福小区物业', '王主任', '13800000002', '北京市海淀区幸福小区');
  const prop3 = insertProperty.run('和谐家园物业', '赵主管', '13800000003', '北京市西城区和谐家园');

  const insertManufacturer = db.prepare(`
    INSERT INTO manufacturers (name, contact, phone)
    VALUES (?, ?, ?)
  `);

  const manu1 = insertManufacturer.run('海尔智家', '张工', '400-123-4567');
  const manu2 = insertManufacturer.run('美的洗衣设备', '刘工', '400-765-4321');

  const insertProgram = db.prepare(`
    INSERT INTO programs (name, duration_minutes, price, description, device_type)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertProgram.run('标准洗', 45, 6.0, '日常衣物标准清洗', 'washer');
  insertProgram.run('快速洗', 20, 4.0, '轻度脏污衣物快速清洗', 'washer');
  insertProgram.run('大件洗', 60, 10.0, '床单被罩等大件衣物', 'washer');
  insertProgram.run('标准烘', 30, 5.0, '普通衣物烘干', 'dryer');
  insertProgram.run('快速烘', 15, 3.0, '少量衣物快速烘干', 'dryer');

  const insertDevice = db.prepare(`
    INSERT INTO devices (device_no, qr_code, name, type, status, location, address, lat, lng, property_id, manufacturer_id, firmware_version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const beijingLocations = [
    { lat: 39.9042, lng: 116.4074, addr: '北京市朝阳区建国路88号' },
    { lat: 39.9200, lng: 116.4400, addr: '北京市朝阳区光华路' },
    { lat: 39.9800, lng: 116.3100, addr: '北京市海淀区中关村大街' },
    { lat: 39.9600, lng: 116.3500, addr: '北京市海淀区学院路' },
    { lat: 39.9100, lng: 116.3700, addr: '北京市西城区西单北大街' },
    { lat: 39.9300, lng: 116.4200, addr: '北京市东城区王府井大街' },
    { lat: 39.9500, lng: 116.3900, addr: '北京市西城区阜成门外大街' },
    { lat: 39.8900, lng: 116.4100, addr: '北京市崇文区前门大街' },
    { lat: 39.9400, lng: 116.4500, addr: '北京市朝阳区三里屯' },
    { lat: 39.9700, lng: 116.3300, addr: '北京市海淀区五道口' },
  ];

  for (let i = 0; i < 10; i++) {
    const type = i < 5 ? 'washer' : 'dryer';
    const typeName = type === 'washer' ? '洗衣机' : '烘干机';
    const loc = beijingLocations[i];
    const propId = i < 3 ? prop1.lastInsertRowid : i < 7 ? prop2.lastInsertRowid : prop3.lastInsertRowid;
    const manuId = i < 5 ? manu1.lastInsertRowid : manu2.lastInsertRowid;
    const status = i === 0 ? 'running' : i === 1 ? 'fault' : 'idle';
    insertDevice.run(
      `DEV${String(i + 1).padStart(4, '0')}`,
      `QR${String(i + 1).padStart(6, '0')}`,
      `${typeName}-${i + 1}`,
      type,
      status,
      `B${Math.floor(i / 2) + 1}号楼`,
      loc.addr,
      loc.lat,
      loc.lng,
      propId as number,
      manuId as number,
      'v1.0.0'
    );
  }

  const insertOrder = db.prepare(`
    INSERT INTO orders (order_no, user_id, device_id, program_id, start_time, end_time, actual_duration, total_cost, pay_amount, pay_method, pay_status, order_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();
  for (let i = 0; i < 8; i++) {
    const daysAgo = 8 - i;
    const startTime = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 45 * 60 * 1000);
    insertOrder.run(
      `ORD${202401010000 + i}`,
      1,
      (i % 10) + 1,
      (i % 5) + 1,
      startTime.toISOString(),
      endTime.toISOString(),
      45,
      6.0,
      6.0,
      i % 2 === 0 ? 'wechat' : 'alipay',
      'paid',
      'completed'
    );
  }

  const insertAlert = db.prepare(`
    INSERT INTO alerts (device_id, type, level, status, message)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertAlert.run(2, 'water_sensor_failure', 'warning', 'active', '水位传感器异常');
  insertAlert.run(2, 'door_not_locked', 'critical', 'resolved', '门锁未锁');

  const insertWorkOrder = db.prepare(`
    INSERT INTO work_orders (device_id, fault_code, description, reporter_id, status, priority)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertWorkOrder.run(2, 'E001', '水位传感器故障', 1, 'pending', 'high');

  const insertBrandConfig = db.prepare(`
    INSERT INTO brand_configs (property_id, primary_color, logo_url, app_name, welcome_text)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertBrandConfig.run(null, '#409EFF', '', '智能洗衣', '欢迎使用智能洗衣');
  insertBrandConfig.run(prop1.lastInsertRowid as number, '#67C23A', '', '阳光洗衣', '欢迎使用阳光洗衣');

  console.log('Test data inserted successfully.');
}

export default db;
