import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from './config';

const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function getDb(): Database.Database {
  return db;
}

export function safeParse(str: string | null | undefined): any {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export function safeStringify(obj: any): string | null {
  if (obj === null || obj === undefined) return null;
  try {
    return JSON.stringify(obj);
  } catch {
    return null;
  }
}

export function initTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'platform', 'ops')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      address TEXT,
      manager_id INTEGER,
      brand_partners TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (manager_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_no TEXT NOT NULL UNIQUE,
      brand TEXT NOT NULL CHECK(brand IN ('顺丰', '中通', '圆通', '韵达', '极兔')),
      type TEXT NOT NULL CHECK(type IN ('inbound', 'outbound')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'inbound', 'stored', 'outbound', 'signed', 'exception')),
      branch_id INTEGER NOT NULL,
      courier_id INTEGER,
      sender_name TEXT,
      sender_phone TEXT,
      receiver_name TEXT,
      receiver_phone TEXT,
      weight REAL,
      fee REAL,
      signed_by TEXT,
      signed_at TEXT,
      exception_type TEXT,
      exception_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (courier_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS pickup_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_no TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('pickup', 'delivery')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'in_progress', 'completed', 'failed')),
      branch_id INTEGER NOT NULL,
      courier_id INTEGER,
      tracking_no TEXT,
      sender_name TEXT,
      sender_phone TEXT,
      receiver_name TEXT,
      receiver_phone TEXT,
      address TEXT,
      scheduled_time TEXT,
      completed_at TEXT,
      fee REAL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (courier_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period TEXT NOT NULL,
      branch_id INTEGER NOT NULL,
      courier_id INTEGER NOT NULL,
      total_tasks INTEGER NOT NULL DEFAULT 0,
      total_fee REAL NOT NULL DEFAULT 0,
      bonus REAL NOT NULL DEFAULT 0,
      deduction REAL NOT NULL DEFAULT 0,
      net_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'paid')),
      paid_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (courier_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('overdue', 'exception', 'inventory_overflow', 'fee_anomaly')),
      level TEXT NOT NULL CHECK(level IN ('warning', 'critical')),
      title TEXT NOT NULL,
      description TEXT,
      branch_id INTEGER,
      package_id INTEGER,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'resolved')),
      resolved_by INTEGER,
      resolved_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (package_id) REFERENCES packages(id),
      FOREIGN KEY (resolved_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);
}
