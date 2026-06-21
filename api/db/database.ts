import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', '..', 'data.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      account TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('student', 'investor', 'admin')),
      phone TEXT,
      avatar TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
      student_no TEXT UNIQUE NOT NULL,
      campus_card_id TEXT UNIQUE,
      balance REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS investor_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
      company_name TEXT NOT NULL,
      total_revenue REAL NOT NULL DEFAULT 0,
      available_balance REAL NOT NULL DEFAULT 0,
      share_ratio REAL NOT NULL DEFAULT 0.7
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'fault')),
      connection_types TEXT NOT NULL,
      queue_count INTEGER NOT NULL DEFAULT 0,
      today_water_usage REAL NOT NULL DEFAULT 0,
      today_revenue REAL NOT NULL DEFAULT 0,
      total_water_usage REAL NOT NULL DEFAULT 0,
      total_revenue REAL NOT NULL DEFAULT 0,
      investor_id TEXT NOT NULL REFERENCES investor_profiles(id),
      last_online INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_devices_location ON devices(lat, lng);
    CREATE INDEX IF NOT EXISTS idx_devices_investor ON devices(investor_id);

    CREATE TABLE IF NOT EXISTS water_transactions (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES student_profiles(id),
      device_id TEXT NOT NULL REFERENCES devices(id),
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      volume REAL NOT NULL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      hash TEXT NOT NULL,
      prev_hash TEXT,
      synced_to_campus INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_student ON water_transactions(student_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_device ON water_transactions(device_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_time ON water_transactions(start_time);

    CREATE TABLE IF NOT EXISTS recharge_records (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES student_profiles(id),
      amount REAL NOT NULL,
      channel TEXT NOT NULL CHECK (channel IN ('alipay', 'wechat')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
      external_transaction_id TEXT,
      created_at INTEGER NOT NULL,
      paid_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS revenue_records (
      id TEXT PRIMARY KEY,
      investor_id TEXT NOT NULL REFERENCES investor_profiles(id),
      device_id TEXT NOT NULL REFERENCES devices(id),
      period TEXT NOT NULL,
      total_revenue REAL NOT NULL DEFAULT 0,
      investor_share REAL NOT NULL DEFAULT 0,
      platform_share REAL NOT NULL DEFAULT 0,
      settled INTEGER NOT NULL DEFAULT 0,
      settled_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_revenue_investor_period ON revenue_records(investor_id, period);

    CREATE TABLE IF NOT EXISTS device_diagnoses (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL REFERENCES devices(id),
      timestamp INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('normal', 'warning', 'critical')),
      issues_json TEXT,
      metrics_json TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_diagnosis_device_time ON device_diagnoses(device_id, timestamp);
  `);
}

export default db;
