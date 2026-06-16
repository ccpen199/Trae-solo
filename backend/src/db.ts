import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const db = new Database(path.resolve(__dirname, '../../', dbPath));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      name TEXT,
      phone TEXT,
      avatar TEXT,
      face_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courier_brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      logo TEXT,
      base_price REAL DEFAULT 0,
      per_kg_price REAL DEFAULT 0,
      avg_delivery_hours INTEGER DEFAULT 48,
      coverage_score INTEGER DEFAULT 80,
      rating REAL DEFAULT 4.5,
      api_status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS couriers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      brand_id INTEGER REFERENCES courier_brands(id),
      employee_no TEXT UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      id_card TEXT,
      rating REAL DEFAULT 5.0,
      total_orders INTEGER DEFAULT 0,
      complaint_count INTEGER DEFAULT 0,
      on_time_rate REAL DEFAULT 98.0,
      work_status TEXT DEFAULT 'online',
      service_area TEXT,
      longitude REAL DEFAULT 116.4074,
      latitude REAL DEFAULT 39.9042,
      voice_greeting TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id INTEGER REFERENCES courier_brands(id),
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      city TEXT,
      province TEXT,
      longitude REAL,
      latitude REAL,
      daily_throughput INTEGER DEFAULT 0,
      max_capacity INTEGER DEFAULT 10000,
      manager TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shipment_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      tracking_no TEXT,
      brand_id INTEGER REFERENCES courier_brands(id),
      courier_id INTEGER REFERENCES couriers(id),
      sender_id INTEGER REFERENCES users(id),
      receiver_id INTEGER REFERENCES users(id),
      sender_name TEXT NOT NULL,
      sender_phone TEXT NOT NULL,
      sender_address TEXT NOT NULL,
      sender_longitude REAL DEFAULT 116.4074,
      sender_latitude REAL DEFAULT 39.9042,
      receiver_name TEXT NOT NULL,
      receiver_phone TEXT NOT NULL,
      receiver_address TEXT NOT NULL,
      receiver_longitude REAL DEFAULT 121.4737,
      receiver_latitude REAL DEFAULT 31.2304,
      weight REAL DEFAULT 1.0,
      length REAL DEFAULT 30,
      width REAL DEFAULT 20,
      height REAL DEFAULT 10,
      goods_name TEXT,
      goods_type TEXT DEFAULT 'standard',
      declared_value REAL DEFAULT 0,
      price REAL DEFAULT 0,
      insurance_fee REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'created',
      priority TEXT DEFAULT 'normal',
      payment_method TEXT DEFAULT 'online',
      is_cod INTEGER DEFAULT 0,
      cod_amount REAL DEFAULT 0,
      estimated_delivery_time DATETIME,
      actual_delivery_time DATETIME,
      appointment_time DATETIME,
      voice_message TEXT,
      is_address_abnormal INTEGER DEFAULT 0,
      face_verified INTEGER DEFAULT 0,
      sign_type TEXT,
      sign_image TEXT,
      complaint_status TEXT DEFAULT 'none',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tracking_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES shipment_orders(id) ON DELETE CASCADE,
      tracking_no TEXT,
      event_type TEXT NOT NULL,
      event_desc TEXT NOT NULL,
      location TEXT,
      longitude REAL,
      latitude REAL,
      operator_id INTEGER,
      operator_name TEXT,
      branch_id INTEGER REFERENCES branches(id),
      is_exception INTEGER DEFAULT 0,
      exception_type TEXT,
      exception_level TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES shipment_orders(id),
      user_id INTEGER REFERENCES users(id),
      courier_id INTEGER REFERENCES couriers(id),
      type TEXT NOT NULL,
      description TEXT,
      images TEXT,
      status TEXT DEFAULT 'pending',
      sla_deadline DATETIME,
      handler_id INTEGER,
      resolution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS api_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_key TEXT UNIQUE NOT NULL,
      app_secret TEXT NOT NULL,
      app_name TEXT NOT NULL,
      app_type TEXT DEFAULT 'erp',
      company_name TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      status TEXT DEFAULT 'active',
      total_calls INTEGER DEFAULT 0,
      daily_limit INTEGER DEFAULT 10000,
      today_calls INTEGER DEFAULT 0,
      last_reset_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS api_call_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER REFERENCES api_applications(id),
      api_path TEXT NOT NULL,
      method TEXT,
      request_params TEXT,
      response_status INTEGER,
      response_time INTEGER,
      ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      related_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS price_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_city TEXT NOT NULL,
      receiver_city TEXT NOT NULL,
      weight REAL NOT NULL,
      brand_id INTEGER REFERENCES courier_brands(id),
      price REAL NOT NULL,
      estimated_hours INTEGER,
      snapshot_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export default db;
