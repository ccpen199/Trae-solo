import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_DIR = path.resolve(__dirname, '..', 'data')
const DB_PATH = path.join(DB_DIR, 'guardian.db')

let db: Database.Database | null = null

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function getDb(): Database.Database {
  if (db) return db
  ensureDir(DB_DIR)
  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}

export function isSeeded(): boolean {
  const database = getDb()
  const row = database.prepare('SELECT COUNT(*) as count FROM devices').get() as { count: number }
  return row.count > 0
}

export function initDb(): void {
  const database = getDb()

  database.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('watch', 'shoe')),
      imei TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'offline' CHECK(status IN ('online', 'offline', 'sos')),
      battery_level INTEGER DEFAULT 0,
      signal_strength INTEGER DEFAULT 0,
      firmware_version TEXT DEFAULT '1.0.0',
      settings TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL REFERENCES devices(id),
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      accuracy REAL DEFAULT 0,
      mode TEXT NOT NULL DEFAULT 'fusion' CHECK(mode IN ('gps', 'wifi', 'cell', 'fusion')),
      speed REAL DEFAULT 0,
      timestamp TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_locations_device_timestamp ON locations(device_id, timestamp);

    CREATE TABLE IF NOT EXISTS geofences (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL REFERENCES devices(id),
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('circle', 'polygon')),
      coordinates TEXT NOT NULL,
      radius REAL,
      rule TEXT NOT NULL DEFAULT 'both' CHECK(rule IN ('enter', 'exit', 'both')),
      schedule TEXT DEFAULT '{}',
      enabled INTEGER DEFAULT 1,
      alert_level TEXT DEFAULT 'medium' CHECK(alert_level IN ('low', 'medium', 'high')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS call_records (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL REFERENCES devices(id),
      type TEXT NOT NULL CHECK(type IN ('audio', 'video')),
      direction TEXT NOT NULL CHECK(direction IN ('inbound', 'outbound', 'missed')),
      caller_number TEXT,
      duration INTEGER DEFAULT 0,
      timestamp TEXT NOT NULL,
      has_recording INTEGER DEFAULT 0,
      recording_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_calls_device_timestamp ON call_records(device_id, timestamp);

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL REFERENCES devices(id),
      type TEXT NOT NULL CHECK(type IN ('sos', 'geofence', 'battery', 'behavior', 'offline')),
      severity TEXT NOT NULL CHECK(severity IN ('critical', 'high', 'medium', 'low')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'acknowledged', 'resolved', 'closed')),
      description TEXT,
      location_lat REAL,
      location_lng REAL,
      notification_chain TEXT DEFAULT '[]',
      timestamp TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_alerts_type_status ON alerts(type, status);
    CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);

    CREATE TABLE IF NOT EXISTS work_orders (
      id TEXT PRIMARY KEY,
      alert_id TEXT NOT NULL REFERENCES alerts(id),
      assignee TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
      notes TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT,
      phone TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'temporary_caregiver' CHECK(role IN ('primary_guardian', 'temporary_caregiver', 'school_admin')),
      permissions TEXT DEFAULT '[]',
      joined_at TEXT DEFAULT (datetime('now')),
      invited_by TEXT REFERENCES members(id)
    );

    CREATE TABLE IF NOT EXISTS behavior_anomalies (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL REFERENCES devices(id),
      type TEXT NOT NULL CHECK(type IN ('prolonged_stillness', 'nighttime_movement', 'signal_anomaly', 'unusual_route')),
      confidence REAL DEFAULT 0,
      description TEXT,
      timestamp TEXT NOT NULL,
      resolved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_anomalies_device_timestamp ON behavior_anomalies(device_id, timestamp);

    CREATE TABLE IF NOT EXISTS privacy_policies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL CHECK(category IN ('face_blur', 'location_strip', 'call_encrypt', 'data_mask')),
      enabled INTEGER DEFAULT 1,
      config TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      permissions TEXT NOT NULL DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)
}
