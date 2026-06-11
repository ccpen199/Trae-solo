import Database from 'better-sqlite3';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dbDir = path.dirname(config.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    db = new Database(config.dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS charging_stations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      province TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      operator_id TEXT NOT NULL,
      total_piles INTEGER NOT NULL DEFAULT 0,
      available_piles INTEGER NOT NULL DEFAULT 0,
      rating REAL NOT NULL DEFAULT 5.0,
      review_count INTEGER NOT NULL DEFAULT 0,
      payment_methods TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS charging_piles (
      id TEXT PRIMARY KEY,
      station_id TEXT NOT NULL,
      pile_code TEXT NOT NULL UNIQUE,
      power_level INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'offline',
      connector_type TEXT NOT NULL,
      current_power REAL NOT NULL DEFAULT 0,
      total_energy REAL NOT NULL DEFAULT 0,
      last_heartbeat TEXT,
      firmware_version TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (station_id) REFERENCES charging_stations(id)
    );

    CREATE INDEX IF NOT EXISTS idx_piles_station ON charging_piles(station_id);
    CREATE INDEX IF NOT EXISTS idx_stations_city ON charging_stations(city);

    CREATE TABLE IF NOT EXISTS operators (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_person TEXT,
      contact_phone TEXT,
      share_ratio REAL NOT NULL DEFAULT 0.3,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL UNIQUE,
      nickname TEXT,
      avatar TEXT,
      balance REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plate_number TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      battery_capacity REAL NOT NULL,
      current_soc REAL NOT NULL DEFAULT 0,
      current_mileage REAL NOT NULL DEFAULT 0,
      energy_consumption REAL NOT NULL DEFAULT 0,
      fault_codes TEXT NOT NULL DEFAULT '[]',
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_vehicles_user ON vehicles(user_id);

    CREATE TABLE IF NOT EXISTS charging_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      pile_id TEXT NOT NULL,
      station_id TEXT NOT NULL,
      vehicle_id TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      start_soc REAL,
      end_soc REAL,
      energy_charged REAL NOT NULL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'charging',
      payment_method TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (pile_id) REFERENCES charging_piles(id),
      FOREIGN KEY (station_id) REFERENCES charging_stations(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON charging_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_station ON charging_sessions(station_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON charging_sessions(status);

    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL UNIQUE,
      station_id TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      total_amount REAL NOT NULL,
      platform_fee REAL NOT NULL,
      operator_share REAL NOT NULL,
      settle_time TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES charging_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id TEXT PRIMARY KEY,
      station_id TEXT NOT NULL,
      pile_id TEXT,
      type TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium',
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      assignee TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (station_id) REFERENCES charging_stations(id)
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON work_orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_station ON work_orders(station_id);

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      station_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      rating REAL NOT NULL,
      content TEXT,
      sentiment TEXT NOT NULL DEFAULT 'neutral',
      sentiment_score REAL NOT NULL DEFAULT 0.5,
      is_approved INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (station_id) REFERENCES charging_stations(id)
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_station ON reviews(station_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);

    CREATE TABLE IF NOT EXISTS city_heat_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city TEXT NOT NULL,
      date TEXT NOT NULL,
      total_charges INTEGER NOT NULL DEFAULT 0,
      total_energy REAL NOT NULL DEFAULT 0,
      avg_occupancy REAL NOT NULL DEFAULT 0,
      failure_rate REAL NOT NULL DEFAULT 0,
      UNIQUE(city, date)
    );
  `);
}
