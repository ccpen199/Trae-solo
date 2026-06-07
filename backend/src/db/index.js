import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db = null;

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function initDb() {
  const dbPath = process.env.DB_PATH
    ? path.resolve(process.cwd(), process.env.DB_PATH)
    : path.resolve(__dirname, '../../data/app.sqlite');

  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  seedData();

  return db;
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS riders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      password_hash TEXT,
      name TEXT,
      avatar TEXT,
      id_card_number TEXT,
      id_card_front_url TEXT,
      id_card_back_url TEXT,
      real_name_verified INTEGER DEFAULT 0,
      face_verified INTEGER DEFAULT 0,
      insurance_id TEXT,
      credit_score INTEGER DEFAULT 100,
      status TEXT DEFAULT 'active',
      balance REAL DEFAULT 0,
      frozen_balance REAL DEFAULT 0,
      role TEXT DEFAULT 'rider',
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE,
      customer_name TEXT,
      customer_phone TEXT,
      pickup_address TEXT,
      pickup_lat REAL,
      pickup_lng REAL,
      delivery_address TEXT,
      delivery_lat REAL,
      delivery_lng REAL,
      item_description TEXT,
      item_weight REAL,
      item_value REAL,
      distance REAL,
      time_sensitivity TEXT DEFAULT 'standard',
      status TEXT DEFAULT 'pending',
      rider_id INTEGER,
      pricing_base REAL,
      pricing_distance REAL,
      pricing_weight REAL,
      pricing_time REAL,
      pricing_night REAL,
      pricing_rain REAL,
      total_price REAL,
      pickup_time TEXT,
      delivery_time TEXT,
      cancel_reason TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rider_id INTEGER,
      order_id INTEGER,
      amount REAL,
      commission_rate REAL,
      commission REAL,
      insurance_fee REAL,
      tax REAL,
      net_amount REAL,
      status TEXT DEFAULT 'pending',
      settled_at TEXT,
      withdrawn_at TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rider_id INTEGER,
      amount REAL,
      status TEXT DEFAULT 'pending',
      bank_account TEXT,
      bank_name TEXT,
      created_at TEXT,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS area_grids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grid_code TEXT UNIQUE,
      grid_name TEXT,
      center_lat REAL,
      center_lng REAL,
      radius REAL,
      online_riders INTEGER DEFAULT 0,
      pending_orders INTEGER DEFAULT 0,
      demand_level TEXT DEFAULT 'low',
      supply_level TEXT DEFAULT 'low',
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS dispatch_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      rider_id INTEGER,
      match_score REAL,
      dispatch_type TEXT DEFAULT 'auto',
      status TEXT DEFAULT 'pending',
      response_time TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS risk_audits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rider_id INTEGER,
      order_id INTEGER,
      audit_type TEXT,
      description TEXT,
      status TEXT DEFAULT 'pending',
      reviewer_id INTEGER,
      risk_level TEXT DEFAULT 'medium',
      created_at TEXT,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS labor_contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rider_id INTEGER,
      contract_no TEXT UNIQUE,
      content TEXT,
      signed_at TEXT,
      status TEXT DEFAULT 'pending',
      template_version TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS rider_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rider_id INTEGER,
      lat REAL,
      lng REAL,
      is_online INTEGER DEFAULT 0,
      last_heartbeat TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS system_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE,
      value TEXT,
      description TEXT,
      updated_at TEXT
    );
  `);
}

function seedData() {
  const countConfig = db.prepare('SELECT COUNT(*) as cnt FROM system_configs').get();
  if (countConfig.cnt === 0) {
    const now = new Date().toISOString();
    const insertConfig = db.prepare(
      'INSERT INTO system_configs (key, value, description, updated_at) VALUES (?, ?, ?, ?)'
    );
    const configs = [
      ['base_price', '8', '基础价格', now],
      ['price_per_km', '1.5', '每公里价格', now],
      ['price_per_kg', '0.5', '每公斤价格', now],
      ['express_surcharge', '5', '急件附加费', now],
      ['lightning_surcharge', '10', '闪电送附加费', now],
      ['night_surcharge_rate', '0.3', '夜间加价比例', now],
      ['rain_surcharge_rate', '0.5', '雨天加价比例', now],
      ['commission_rate', '0.15', '平台抽成比例', now],
      ['insurance_fee_per_order', '0.5', '每单保险费', now],
      ['tax_rate', '0.03', '税率', now],
    ];
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insertConfig.run(...item);
      }
    });
    insertMany(configs);
  }

  const countGrids = db.prepare('SELECT COUNT(*) as cnt FROM area_grids').get();
  if (countGrids.cnt === 0) {
    const now = new Date().toISOString();
    const insertGrid = db.prepare(
      'INSERT INTO area_grids (grid_code, grid_name, center_lat, center_lng, radius, online_riders, pending_orders, demand_level, supply_level, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const grids = [
      ['CBD', 'CBD商务区', 39.9087, 116.4605, 3.0, 0, 0, 'high', 'medium', now],
      ['SANLITUN', '三里屯', 39.9334, 116.4539, 2.5, 0, 0, 'high', 'low', now],
      ['WANGJING', '望京', 40.0003, 116.4799, 3.0, 0, 0, 'medium', 'high', now],
      ['ZHONGGUANCUN', '中关村', 39.9825, 116.3144, 3.0, 0, 0, 'high', 'medium', now],
      ['GUOMAO', '国贸', 39.9089, 116.4583, 2.5, 0, 0, 'high', 'low', now],
    ];
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insertGrid.run(...item);
      }
    });
    insertMany(grids);
  }

  const countRiders = db.prepare('SELECT COUNT(*) as cnt FROM riders').get();
  if (countRiders.cnt === 0) {
    const now = new Date().toISOString();
    const insertRider = db.prepare(
      'INSERT INTO riders (phone, password_hash, name, role, real_name_verified, credit_score, status, balance, frozen_balance, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const adminHash = bcrypt.hashSync('admin123', 10);
    insertRider.run('admin', adminHash, '系统管理员', 'admin', 1, 100, 'active', 0, 0, now, now);

    const riderNames = ['张伟', '李明', '王芳', '赵强', '刘洋'];
    const riderHash = bcrypt.hashSync('123456', 10);
    const insertMany = db.transaction((names) => {
      for (let i = 0; i < names.length; i++) {
        const phone = `1380000100${i + 1}`;
        insertRider.run(phone, riderHash, names[i], 'rider', 0, 100, 'active', 0, 0, now, now);
      }
    });
    insertMany(riderNames);
  }
}
