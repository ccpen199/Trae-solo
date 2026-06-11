import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT NOT NULL,
      company_name TEXT,
      avatar TEXT,
      auth_status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      id_card TEXT NOT NULL UNIQUE,
      driver_license TEXT NOT NULL,
      driver_license_type TEXT NOT NULL,
      qualification_certificate TEXT,
      avatar TEXT,
      auth_status TEXT DEFAULT 'pending',
      rating REAL DEFAULT 5.0,
      total_orders INTEGER DEFAULT 0,
      fleet_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_drivers_fleet_id ON drivers(fleet_id);
    CREATE INDEX IF NOT EXISTS idx_drivers_auth_status ON drivers(auth_status);

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      plate_no TEXT NOT NULL UNIQUE,
      vehicle_type TEXT NOT NULL,
      vehicle_length REAL NOT NULL,
      max_load REAL NOT NULL,
      max_volume REAL,
      color TEXT,
      driving_license TEXT NOT NULL,
      road_transport_permit TEXT,
      insurance_expire_date TEXT,
      annual_inspection_date TEXT,
      auth_status TEXT DEFAULT 'pending',
      fleet_id TEXT,
      current_driver_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_vehicles_fleet_id ON vehicles(fleet_id);
    CREATE INDEX IF NOT EXISTS idx_vehicles_plate_no ON vehicles(plate_no);

    CREATE TABLE IF NOT EXISTS carriers (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      business_license TEXT NOT NULL UNIQUE,
      road_transport_permit TEXT,
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      rating REAL DEFAULT 5.0,
      whitelist INTEGER DEFAULT 0,
      auth_status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_carriers_whitelist ON carriers(whitelist);
    CREATE INDEX IF NOT EXISTS idx_carriers_auth_status ON carriers(auth_status);

    CREATE TABLE IF NOT EXISTS cargo (
      id TEXT PRIMARY KEY,
      order_no TEXT NOT NULL UNIQUE,
      owner_id TEXT NOT NULL,
      cargo_name TEXT NOT NULL,
      cargo_type TEXT NOT NULL,
      weight REAL NOT NULL,
      volume REAL,
      quantity INTEGER,
      package_type TEXT,
      start_city TEXT NOT NULL,
      end_city TEXT NOT NULL,
      start_address TEXT NOT NULL,
      end_address TEXT NOT NULL,
      pickup_time TEXT NOT NULL,
      delivery_time TEXT,
      temperature_req TEXT,
      insurance TEXT,
      vehicle_req TEXT NOT NULL,
      expected_price REAL NOT NULL,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_cargo_owner_id ON cargo(owner_id);
    CREATE INDEX IF NOT EXISTS idx_cargo_status ON cargo(status);
    CREATE INDEX IF NOT EXISTS idx_cargo_route ON cargo(start_city, end_city);
    CREATE INDEX IF NOT EXISTS idx_cargo_created_at ON cargo(created_at);

    CREATE TABLE IF NOT EXISTS waybills (
      id TEXT PRIMARY KEY,
      waybill_no TEXT NOT NULL UNIQUE,
      cargo_id TEXT NOT NULL,
      driver_id TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      fleet_id TEXT,
      actual_price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      start_time TEXT,
      end_time TEXT,
      current_location TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cargo_id) REFERENCES cargo(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE INDEX IF NOT EXISTS idx_waybills_cargo_id ON waybills(cargo_id);
    CREATE INDEX IF NOT EXISTS idx_waybills_driver_id ON waybills(driver_id);
    CREATE INDEX IF NOT EXISTS idx_waybills_status ON waybills(status);
    CREATE INDEX IF NOT EXISTS idx_waybills_created_at ON waybills(created_at);

    CREATE TABLE IF NOT EXISTS gps_points (
      id TEXT PRIMARY KEY,
      waybill_id TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      speed REAL,
      direction INTEGER,
      ignition INTEGER,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (waybill_id) REFERENCES waybills(id)
    );

    CREATE INDEX IF NOT EXISTS idx_gps_waybill_time ON gps_points(waybill_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_gps_timestamp ON gps_points(timestamp);

    CREATE TABLE IF NOT EXISTS exception_records (
      id TEXT PRIMARY KEY,
      waybill_id TEXT NOT NULL,
      type TEXT NOT NULL,
      level TEXT NOT NULL,
      location TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      description TEXT,
      handled INTEGER DEFAULT 0,
      handled_by TEXT,
      handled_at TEXT,
      handle_remark TEXT,
      FOREIGN KEY (waybill_id) REFERENCES waybills(id)
    );

    CREATE INDEX IF NOT EXISTS idx_exception_waybill_id ON exception_records(waybill_id);
    CREATE INDEX IF NOT EXISTS idx_exception_handled ON exception_records(handled);
    CREATE INDEX IF NOT EXISTS idx_exception_timestamp ON exception_records(timestamp);

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      bill_no TEXT NOT NULL UNIQUE,
      order_id TEXT NOT NULL,
      waybill_id TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'unpaid',
      invoice_status TEXT DEFAULT 'not_applied',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      paid_at TEXT,
      FOREIGN KEY (order_id) REFERENCES cargo(id),
      FOREIGN KEY (waybill_id) REFERENCES waybills(id)
    );

    CREATE INDEX IF NOT EXISTS idx_bills_order_id ON bills(order_id);
    CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
    CREATE INDEX IF NOT EXISTS idx_bills_type ON bills(type);

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_no TEXT NOT NULL UNIQUE,
      bill_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      tax_amount REAL NOT NULL,
      total_amount REAL NOT NULL,
      buyer_info TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      issued_at TEXT,
      pdf_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills(id)
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_bill_id ON invoices(bill_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

    CREATE TABLE IF NOT EXISTS freight_rates (
      id TEXT PRIMARY KEY,
      start_city TEXT NOT NULL,
      end_city TEXT NOT NULL,
      vehicle_type TEXT NOT NULL,
      current_price REAL NOT NULL,
      historical_prices TEXT,
      trend TEXT DEFAULT 'stable',
      change_percent REAL DEFAULT 0,
      update_time TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_freight_rates_route_vehicle ON freight_rates(start_city, end_city, vehicle_type);

    CREATE TABLE IF NOT EXISTS fuel_cards (
      id TEXT PRIMARY KEY,
      card_no TEXT NOT NULL UNIQUE,
      driver_id TEXT NOT NULL,
      balance REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE INDEX IF NOT EXISTS idx_fuel_cards_driver_id ON fuel_cards(driver_id);
    CREATE INDEX IF NOT EXISTS idx_fuel_cards_card_no ON fuel_cards(card_no);

    CREATE TABLE IF NOT EXISTS fuel_transactions (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      waybill_id TEXT,
      station_name TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (card_id) REFERENCES fuel_cards(id),
      FOREIGN KEY (waybill_id) REFERENCES waybills(id)
    );

    CREATE INDEX IF NOT EXISTS idx_fuel_trans_card_id ON fuel_transactions(card_id);
    CREATE INDEX IF NOT EXISTS idx_fuel_trans_waybill_id ON fuel_transactions(waybill_id);
    CREATE INDEX IF NOT EXISTS idx_fuel_trans_timestamp ON fuel_transactions(timestamp);
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    seedInitialData();
  }

  ensureDemoAccounts();
  ensureDemoFreightRates();
  ensureDemoBusinessData();
}

function seedInitialData() {
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, role, phone, company_name, auth_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const hashPassword = (password: string) => bcrypt.hashSync(password, 10);

  insertUser.run(
    'admin001',
    'admin',
    hashPassword('admin123'),
    'admin',
    '13800000000',
    '平台管理方',
    'approved'
  );

  insertUser.run(
    'owner001',
    'owner',
    hashPassword('123456'),
    'owner',
    '13800000001',
    '上海贸易有限公司',
    'approved'
  );

  insertUser.run(
    'fleet001',
    'fleet',
    hashPassword('123456'),
    'fleet',
    '13800000002',
    '顺风物流有限公司',
    'approved'
  );

  insertUser.run(
    'driver001',
    'driver',
    hashPassword('123456'),
    'driver',
    '13800000003',
    null,
    'approved'
  );

  insertUser.run(
    'operator001',
    'ops',
    hashPassword('123456'),
    'operator',
    '13800000004',
    '平台运营部',
    'approved'
  );

  const insertDriver = db.prepare(`
    INSERT INTO drivers (id, user_id, name, phone, id_card, driver_license, driver_license_type, auth_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDriver.run(
    'driver_data_001',
    'driver001',
    '张师傅',
    '13800000003',
    '310101198001011234',
    '310000198001010001',
    'A2',
    'approved'
  );

  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (id, plate_no, vehicle_type, vehicle_length, max_load, max_volume, color, driving_license, auth_status, fleet_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertVehicle.run(
    'vehicle001',
    '沪A12345',
    '厢式货车',
    9.6,
    18,
    55,
    '红色',
    '310000202001010001',
    'approved',
    'fleet001'
  );

  const insertCarrier = db.prepare(`
    INSERT INTO carriers (id, company_name, business_license, road_transport_permit, contact_name, contact_phone, whitelist, auth_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCarrier.run(
    'carrier001',
    '顺风物流有限公司',
    '91310000MA12345678',
    '310000202001010001',
    '李经理',
    '13900000002',
    1,
    'approved'
  );

  insertCarrier.run(
    'carrier002',
    '快捷运输有限公司',
    '91310000MA87654321',
    '310000202001010002',
    '王经理',
    '13900000005',
    1,
    'approved'
  );

  const insertFreightRate = db.prepare(`
    INSERT INTO freight_rates (id, start_city, end_city, vehicle_type, current_price, trend, change_percent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const historicalPrices = JSON.stringify([
    { date: '2024-06-01', price: 4400 },
    { date: '2024-06-02', price: 4450 },
    { date: '2024-06-03', price: 4480 },
    { date: '2024-06-04', price: 4490 },
    { date: '2024-06-05', price: 4500 },
    { date: '2024-06-06', price: 4520 },
    { date: '2024-06-07', price: 4500 },
  ]);

  insertFreightRate.run('rate001', '上海', '北京', '9.6米厢式', 4500, 'up', 2.5);
  db.prepare('UPDATE freight_rates SET historical_prices = ? WHERE id = ?').run(historicalPrices, 'rate001');

  insertFreightRate.run('rate002', '上海', '广州', '9.6米厢式', 5200, 'down', -1.2);
  insertFreightRate.run('rate003', '上海', '深圳', '13米半挂', 6800, 'stable', 0);
  insertFreightRate.run('rate004', '北京', '上海', '9.6米厢式', 4300, 'up', 3.1);
  insertFreightRate.run('rate005', '广州', '上海', '17.5米大板', 7500, 'down', -0.8);

  const now = new Date().toISOString();

  const insertCargo = db.prepare(`
    INSERT INTO cargo (
      id, order_no, owner_id, cargo_name, cargo_type, weight, volume, quantity, package_type, start_city, end_city, start_address, end_address, pickup_time, vehicle_req, expected_price, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 1; i <= 5; i++) {
    const id = `cargo_sample_${i}`;
    insertCargo.run(
      id,
      `ORD2024060${i}`,
      'owner001',
      `电子产品${i}`,
      i % 2 === 0 ? 'LTL' : 'FTL',
      2.5 + i,
      10 + i * 2,
      100 + i * 10,
      '纸箱',
      '上海',
      i % 2 === 0 ? '北京' : '广州',
      `上海市浦东新区张江高科技园区博云路${i}号`,
      i % 2 === 0 ? '北京市朝阳区建国路88号' : '广州市天河区天河路385号',
      now,
      JSON.stringify({ vehicleType: '厢式货车', vehicleLength: 9.6 }),
      4500 + i * 200,
      i <= 3 ? 'completed' : i === 4 ? 'in_transit' : 'published',
      now
    );

    if (i <= 3) {
      const waybillId = `waybill_sample_${i}`;
      db.prepare(`
        INSERT INTO waybills (id, waybill_no, cargo_id, driver_id, vehicle_id, fleet_id, actual_price, status, start_time, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        waybillId,
        `WB2024060${i}`,
        id,
        'driver_data_001',
        'vehicle001',
        'fleet001',
        4500 + i * 200,
        'completed',
        now,
        now
      );

      db.prepare(`
        INSERT INTO bills (id, bill_no, order_id, waybill_id, amount, type, status, invoice_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `bill_sample_${i}`,
        `BL2024060${i}`,
        id,
        waybillId,
        4500 + i * 200,
        'receivable',
        i <= 2 ? 'paid' : 'unpaid',
        i <= 2 ? 'invoiced' : 'not_applied',
        now
      );
    }
  }

  const insertFuelCard = db.prepare(`
    INSERT INTO fuel_cards (id, card_no, driver_id, balance, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertFuelCard.run(
    'fuelcard001',
    '1000123456789012',
    'driver_data_001',
    5000,
    'active'
  );
}

function ensureDemoAccounts() {
  const hashPassword = (password: string) => bcrypt.hashSync(password, 10);
  const demoAccounts = [
    ['admin001', 'admin', 'admin123', 'admin', '13800000000', '平台管理方'],
    ['owner001', 'owner', '123456', 'owner', '13800000001', '上海贸易有限公司'],
    ['fleet001', 'fleet', '123456', 'fleet', '13800000002', '顺风物流有限公司'],
    ['driver001', 'driver', '123456', 'driver', '13800000003', null],
    ['operator001', 'ops', '123456', 'operator', '13800000004', '平台运营部'],
  ] as const;

  const upsertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, role, phone, company_name, auth_status)
    VALUES (?, ?, ?, ?, ?, ?, 'approved')
    ON CONFLICT(id) DO UPDATE SET
      username = excluded.username,
      password_hash = excluded.password_hash,
      role = excluded.role,
      phone = excluded.phone,
      company_name = excluded.company_name,
      auth_status = 'approved',
      updated_at = CURRENT_TIMESTAMP
  `);

  const legacyOperator = db.prepare('SELECT id FROM users WHERE username = ?').get('ops') as { id: string } | undefined;
  if (legacyOperator && legacyOperator.id !== 'operator001') {
    db.prepare('DELETE FROM users WHERE username = ?').run('ops');
  }
  const duplicateOperator = db.prepare('SELECT id FROM users WHERE username = ?').get('operator') as { id: string } | undefined;
  if (duplicateOperator && duplicateOperator.id !== 'operator001') {
    db.prepare('DELETE FROM users WHERE username = ?').run('operator');
  }

  for (const account of demoAccounts) {
    upsertUser.run(account[0], account[1], hashPassword(account[2]), account[3], account[4], account[5]);
  }
}

function ensureDemoFreightRates() {
  db.prepare(`DELETE FROM freight_rates WHERE vehicle_type IN ('9.6米厢车', '13米高栏', '17.5米平板')`).run();

  const upsertRate = db.prepare(`
    INSERT INTO freight_rates (id, start_city, end_city, vehicle_type, current_price, historical_prices, trend, change_percent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(start_city, end_city, vehicle_type) DO UPDATE SET
      current_price = excluded.current_price,
      historical_prices = excluded.historical_prices,
      trend = excluded.trend,
      change_percent = excluded.change_percent,
      update_time = CURRENT_TIMESTAMP
  `);

  const history = (base: number) => JSON.stringify([
    { date: '2026-06-03', price: base - 160 },
    { date: '2026-06-04', price: base - 80 },
    { date: '2026-06-05', price: base - 20 },
    { date: '2026-06-06', price: base + 30 },
    { date: '2026-06-07', price: base + 10 },
    { date: '2026-06-08', price: base + 60 },
    { date: '2026-06-09', price: base },
  ]);

  [
    ['rate_demo_001', '上海', '北京', '9.6米厢式', 4500, 'up', 2.5],
    ['rate_demo_002', '上海', '广州', '9.6米厢式', 5200, 'down', -1.2],
    ['rate_demo_003', '上海', '深圳', '13米半挂', 6800, 'stable', 0],
    ['rate_demo_004', '广州', '上海', '17.5米大板', 7500, 'down', -0.8],
    ['rate_demo_005', '杭州', '南京', '4.2米厢式', 1800, 'up', 1.6],
    ['rate_demo_006', '成都', '重庆', '冷藏车', 3200, 'stable', 0.2],
    ['rate_demo_007', '上海', '北京', '4.2米厢式', 2800, 'up', 1.8],
    ['rate_demo_008', '上海', '北京', '13米半挂', 6200, 'down', -0.5],
    ['rate_demo_009', '上海', '广州', '冷藏车', 6800, 'up', 3.2],
    ['rate_demo_010', '上海', '深圳', '4.2米厢式', 3200, 'stable', 0.1],
    ['rate_demo_011', '北京', '广州', '9.6米厢式', 5800, 'up', 2.1],
    ['rate_demo_012', '北京', '深圳', '13米半挂', 7200, 'down', -1.5],
    ['rate_demo_013', '广州', '北京', '9.6米厢式', 5500, 'up', 1.3],
    ['rate_demo_014', '深圳', '上海', '平板车', 4800, 'stable', 0.4],
    ['rate_demo_015', '杭州', '上海', '6.8米厢式', 1500, 'down', -0.6],
    ['rate_demo_016', '武汉', '成都', '9.6米厢式', 4200, 'up', 2.8],
    ['rate_demo_017', '成都', '上海', '13米半挂', 8500, 'up', 1.9],
    ['rate_demo_018', '上海', '武汉', '冷藏车', 5600, 'stable', 0.3],
    ['rate_demo_019', '南京', '杭州', '4.2米厢式', 1200, 'down', -0.9],
    ['rate_demo_020', '重庆', '成都', '6.8米厢式', 1800, 'up', 0.7],
  ].forEach(([id, startCity, endCity, vehicleType, price, trend, changePercent]) => {
    upsertRate.run(id, startCity, endCity, vehicleType, price, history(Number(price)), trend, changePercent);
  });
}

function ensureDemoBusinessData() {
  const billCount = db.prepare('SELECT COUNT(*) as count FROM bills').get() as { count: number };
  const now = new Date().toISOString();

  db.prepare(`
    INSERT OR IGNORE INTO drivers (id, user_id, name, phone, id_card, driver_license, driver_license_type, auth_status, rating, total_orders)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('driver_data_001', 'driver001', '张师傅', '13800000003', '310101198001011234', '310000198001010001', 'A2', 'approved', 5.0, 96);

  db.prepare(`
    INSERT OR IGNORE INTO vehicles (id, plate_no, vehicle_type, vehicle_length, max_load, max_volume, color, driving_license, auth_status, fleet_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('vehicle001', '沪A12345', '厢式货车', 9.6, 18, 55, '红色', '310000202001010001', 'approved', 'fleet001');

  if (billCount.count < 5) {
    const cargoRoutes = [
      { id: 'cargo_biz_104', no: 'ORD20260604', name: '机械配件', type: 'FTL', weight: 8.5, city1: '上海', city2: '北京', addr1: '上海市浦东新区', addr2: '北京市朝阳区', price: 4500 },
      { id: 'cargo_biz_105', no: 'ORD20260605', name: '化工原料', type: 'LTL', weight: 3.2, city1: '广州', city2: '上海', addr1: '广州市天河区', addr2: '上海市闵行区', price: 5200 },
      { id: 'cargo_biz_106', no: 'ORD20260606', name: '家具建材', type: 'FTL', weight: 15.0, city1: '杭州', city2: '南京', addr1: '杭州市西湖区', addr2: '南京市鼓楼区', price: 1800 },
      { id: 'cargo_biz_107', no: 'ORD20260607', name: '电子元器件', type: 'LTL', weight: 1.5, city1: '深圳', city2: '上海', addr1: '深圳市南山区', addr2: '上海市浦东新区', price: 3200 },
      { id: 'cargo_biz_108', no: 'ORD20260608', name: '冷链食品', type: 'FTL', weight: 10.0, city1: '成都', city2: '重庆', addr1: '成都市武侯区', addr2: '重庆市渝北区', price: 3200 },
    ];

    const insertCargo = db.prepare(`
      INSERT OR IGNORE INTO cargo (id, order_no, owner_id, cargo_name, cargo_type, weight, volume, quantity, package_type, start_city, end_city, start_address, end_address, pickup_time, vehicle_req, expected_price, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertWaybill = db.prepare(`
      INSERT OR IGNORE INTO waybills (id, waybill_no, cargo_id, driver_id, vehicle_id, fleet_id, actual_price, status, start_time, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const selectWaybillById = db.prepare('SELECT id FROM waybills WHERE id = ?');
    const selectWaybillByNo = db.prepare('SELECT id FROM waybills WHERE waybill_no = ?');
    const updateWaybill = db.prepare(`
      UPDATE waybills
      SET waybill_no = ?, cargo_id = ?, driver_id = ?, vehicle_id = ?, fleet_id = ?,
        actual_price = ?, status = ?, start_time = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const insertBill = db.prepare(`
      INSERT OR IGNORE INTO bills (id, bill_no, order_id, waybill_id, amount, type, status, invoice_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const selectCargoById = db.prepare('SELECT id FROM cargo WHERE id = ?');
    const selectCargoByOrderNo = db.prepare('SELECT id FROM cargo WHERE order_no = ?');
    const updateCargo = db.prepare(`
      UPDATE cargo
      SET order_no = ?, owner_id = ?, cargo_name = ?, cargo_type = ?, weight = ?, volume = ?,
        quantity = ?, package_type = ?, start_city = ?, end_city = ?, start_address = ?,
        end_address = ?, pickup_time = ?, vehicle_req = ?, expected_price = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    cargoRoutes.forEach((route, i) => {
      const cargoByOrderNo = selectCargoByOrderNo.get(route.no) as { id: string } | undefined;
      const cargoById = selectCargoById.get(route.id) as { id: string } | undefined;
      const cargoId = cargoByOrderNo?.id || cargoById?.id || route.id;
      const cargoArgs = [
        route.no, 'owner001', route.name, route.type, route.weight, 10 + i * 3, 50 + i * 10, '纸箱',
        route.city1, route.city2, route.addr1, route.addr2, now,
        JSON.stringify({ vehicleType: '9.6米厢式', vehicleLength: 9.6 }), route.price,
        i < 3 ? 'completed' : 'in_transit',
      ] as const;

      if (cargoByOrderNo || cargoById) {
        updateCargo.run(...cargoArgs, cargoId);
      } else {
        insertCargo.run(
          cargoId, ...cargoArgs, now
        );
      }

      const waybillNo = `WB2026060${i + 4}`;
      const waybillByNo = selectWaybillByNo.get(waybillNo) as { id: string } | undefined;
      const waybillById = selectWaybillById.get(`waybill_biz_${i + 104}`) as { id: string } | undefined;
      const waybillId = waybillByNo?.id || waybillById?.id || `waybill_biz_${i + 104}`;
      const waybillArgs = [
        waybillNo, cargoId, 'driver_data_001', 'vehicle001', 'fleet001',
        route.price, i < 3 ? 'completed' : 'in_transit', now,
      ] as const;

      if (waybillByNo || waybillById) {
        updateWaybill.run(...waybillArgs, waybillId);
      } else {
        insertWaybill.run(
          waybillId, ...waybillArgs, now
        );
      }

      const billStatuses: Array<{ status: string; invoice: string; type: string }> = [
        { status: 'unpaid', invoice: 'not_applied', type: 'receivable' },
        { status: 'unpaid', invoice: 'not_applied', type: 'payable' },
        { status: 'paid', invoice: 'invoiced', type: 'receivable' },
        { status: 'unpaid', invoice: 'applied', type: 'receivable' },
        { status: 'paid', invoice: 'invoiced', type: 'receivable' },
      ];

      insertBill.run(
        `bill_biz_${i + 104}`, `BL2026060${i + 4}`, cargoId, waybillId,
        route.price, billStatuses[i].type, billStatuses[i].status, billStatuses[i].invoice, now
      );
    });
  }

  const fuelTxCount = db.prepare('SELECT COUNT(*) as count FROM fuel_transactions').get() as { count: number };
  if (fuelTxCount.count === 0) {
    const insertTx = db.prepare(`
      INSERT INTO fuel_transactions (id, card_id, amount, type, waybill_id, station_name, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const txData = [
      { id: 'tx_001', amount: 2000, type: 'recharge', waybill: null, station: null, daysAgo: 30 },
      { id: 'tx_002', amount: 350, type: 'consume', waybill: 'waybill_sample_1', station: '中石化上海浦东站', daysAgo: 25 },
      { id: 'tx_003', amount: 280, type: 'consume', waybill: 'waybill_sample_2', station: '中石油北京朝阳站', daysAgo: 20 },
      { id: 'tx_004', amount: 1500, type: 'recharge', waybill: null, station: null, daysAgo: 15 },
      { id: 'tx_005', amount: 420, type: 'consume', waybill: 'waybill_sample_3', station: '中石化广州天河站', daysAgo: 10 },
      { id: 'tx_006', amount: 380, type: 'consume', waybill: 'waybill_biz_104', station: '中石油上海浦东站', daysAgo: 5 },
      { id: 'tx_007', amount: 1000, type: 'recharge', waybill: null, station: null, daysAgo: 3 },
      { id: 'tx_008', amount: 290, type: 'consume', waybill: 'waybill_biz_105', station: '中石化杭州西湖站', daysAgo: 1 },
    ];
    txData.forEach(tx => {
      const ts = new Date(Date.now() - tx.daysAgo * 86400000).toISOString();
      insertTx.run(tx.id, 'fuelcard001', tx.amount, tx.type, tx.waybill, tx.station, ts);
    });
  }

  const driverCount = db.prepare('SELECT COUNT(*) as count FROM drivers').get() as { count: number };
  if (driverCount.count < 3) {
    const insertDriver = db.prepare(`
      INSERT OR IGNORE INTO drivers (id, user_id, name, phone, id_card, driver_license, driver_license_type, auth_status, rating, total_orders)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertDriver.run('driver_data_002', 'driver001', '李师傅', '13800000004', '310101198501015678', '310000198501010002', 'B2', 'approved', 4.5, 120);
    insertDriver.run('driver_data_003', 'driver001', '王师傅', '13800000005', '310101199001019012', '310000199001010003', 'A2', 'pending', 4.0, 45);
  }

  const vehicleCount = db.prepare('SELECT COUNT(*) as count FROM vehicles').get() as { count: number };
  if (vehicleCount.count < 3) {
    const insertVehicle = db.prepare(`
      INSERT OR IGNORE INTO vehicles (id, plate_no, vehicle_type, vehicle_length, max_load, max_volume, color, driving_license, auth_status, fleet_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertVehicle.run('vehicle002', '沪B67890', '平板车', 13.0, 30, 80, '蓝色', '310000202001010002', 'approved', 'fleet001');
    insertVehicle.run('vehicle003', '沪C11111', '冷藏车', 9.6, 15, 45, '白色', '310000202001010003', 'pending', 'fleet001');
  }

  const carrierCount = db.prepare('SELECT COUNT(*) as count FROM carriers').get() as { count: number };
  if (carrierCount.count < 4) {
    const insertCarrier = db.prepare(`
      INSERT OR IGNORE INTO carriers (id, company_name, business_license, road_transport_permit, contact_name, contact_phone, whitelist, auth_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertCarrier.run('carrier003', '远达物流有限公司', '91310000MA11111111', '310000202001010003', '赵经理', '13900000006', 0, 'pending');
    insertCarrier.run('carrier004', '安捷运输有限公司', '91310000MA22222222', '310000202001010004', '钱经理', '13900000007', 1, 'approved');
  }
}

export default db;
