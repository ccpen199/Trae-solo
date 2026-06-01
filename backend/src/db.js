import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'data', 'app.sqlite');

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'online' CHECK(status IN ('online','offline','maintenance')),
      total_slots INTEGER NOT NULL DEFAULT 8,
      available_count INTEGER NOT NULL DEFAULT 0,
      charging_count INTEGER NOT NULL DEFAULT 0,
      abnormal_count INTEGER NOT NULL DEFAULT 0,
      current_wait_minutes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS cabinet_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER NOT NULL,
      slot_number INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','charging','occupied','fault')),
      battery_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (station_id) REFERENCES stations(id)
    );

    CREATE TABLE IF NOT EXISTS batteries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      battery_code TEXT NOT NULL UNIQUE,
      model TEXT NOT NULL,
      soc INTEGER NOT NULL DEFAULT 0,
      soh INTEGER NOT NULL DEFAULT 100,
      cycle_count INTEGER NOT NULL DEFAULT 0,
      temperature REAL NOT NULL DEFAULT 0,
      voltage REAL NOT NULL DEFAULT 0,
      fault_code TEXT,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','charging','in_use','maintenance','abnormal')),
      station_id INTEGER NOT NULL,
      last_maintenance_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (station_id) REFERENCES stations(id)
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate_number TEXT NOT NULL UNIQUE,
      vin TEXT NOT NULL UNIQUE,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      owner_phone TEXT NOT NULL,
      member_type TEXT NOT NULL DEFAULT 'none' CHECK(member_type IN ('none','silver','gold','platinum')),
      member_expire_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS swap_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT NOT NULL UNIQUE,
      station_id INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      battery_out_id INTEGER,
      battery_in_id INTEGER,
      slot_number INTEGER,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','swapping','completed','failed','suspended')),
      swap_start_time TEXT,
      swap_end_time TEXT,
      fee REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      actual_fee REAL NOT NULL DEFAULT 0,
      member_benefit TEXT,
      failure_reason TEXT,
      suspend_reason TEXT,
      operator_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (station_id) REFERENCES stations(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (battery_out_id) REFERENCES batteries(id),
      FOREIGN KEY (battery_in_id) REFERENCES batteries(id)
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      plate_number TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting' CHECK(status IN ('waiting','swapped','cancelled','requeued')),
      action_by TEXT,
      action_at TEXT,
      action_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (station_id) REFERENCES stations(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS safety_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER NOT NULL,
      battery_id INTEGER,
      alert_type TEXT NOT NULL CHECK(alert_type IN ('high_temperature','leakage','door_anomaly','swap_failure','user_complaint')),
      severity TEXT NOT NULL DEFAULT 'medium' CHECK(severity IN ('low','medium','high','critical')),
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','processing','resolved')),
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (station_id) REFERENCES stations(id),
      FOREIGN KEY (battery_id) REFERENCES batteries(id)
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id INTEGER,
      station_id INTEGER NOT NULL,
      battery_id INTEGER,
      type TEXT NOT NULL CHECK(type IN ('inspection','repair','replacement','complaint_handling')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','assigned','in_progress','completed','closed')),
      assigned_to TEXT,
      description TEXT NOT NULL,
      resolution TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (alert_id) REFERENCES safety_alerts(id),
      FOREIGN KEY (station_id) REFERENCES stations(id),
      FOREIGN KEY (battery_id) REFERENCES batteries(id)
    );
  `);
}

export { db, initDB };
