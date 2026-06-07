const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'app.sqlite');

let db = null;

function initDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE,
      password_hash TEXT,
      name TEXT,
      role TEXT CHECK(role IN ('requester','courier','admin')),
      credit_score INTEGER DEFAULT 100,
      status TEXT DEFAULT 'active',
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS courier_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      real_name TEXT,
      id_number TEXT,
      id_card_photo TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','suspended')),
      latitude REAL,
      longitude REAL,
      is_online INTEGER DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      completed_orders INTEGER DEFAULT 0,
      avg_rating REAL DEFAULT 5.0,
      fulfillment_rate REAL DEFAULT 1.0,
      current_order_id TEXT,
      service_areas TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE,
      type TEXT CHECK(type IN ('pickup_delivery','purchase','allpurpose','queue')),
      requester_id TEXT,
      courier_id TEXT,
      priority INTEGER DEFAULT 0 CHECK(priority IN (0,1,2)),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','dispatched','accepted','arrived','in_progress','completed','cancelled','timeout')),
      title TEXT,
      description TEXT,
      pickup_address TEXT,
      pickup_latitude REAL,
      pickup_longitude REAL,
      delivery_address TEXT,
      delivery_latitude REAL,
      delivery_longitude REAL,
      purchase_items TEXT,
      estimated_duration INTEGER,
      deadline TEXT,
      fee REAL,
      reward REAL,
      require_photo INTEGER DEFAULT 0,
      require_signature INTEGER DEFAULT 0,
      assigned_at TEXT,
      accepted_at TEXT,
      arrived_at TEXT,
      started_at TEXT,
      completed_at TEXT,
      cancelled_at TEXT,
      cancel_reason TEXT,
      timeout_at TEXT,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (requester_id) REFERENCES users(id),
      FOREIGN KEY (courier_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_tracking (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      courier_id TEXT,
      action TEXT,
      latitude REAL,
      longitude REAL,
      photo_url TEXT,
      note TEXT,
      created_at TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      from_user_id TEXT,
      to_user_id TEXT,
      rating INTEGER CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS service_areas (
      id TEXT PRIMARY KEY,
      city TEXT,
      district TEXT,
      grid_code TEXT,
      center_latitude REAL,
      center_longitude REAL,
      heat_level INTEGER DEFAULT 0,
      active_couriers INTEGER DEFAULT 0,
      pending_orders INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS credit_rules (
      id TEXT PRIMARY KEY,
      action TEXT,
      score_change INTEGER,
      description TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS credit_adjustments (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      reason TEXT,
      score_change INTEGER,
      created_by TEXT,
      created_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS blacklist (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      reason TEXT,
      created_by TEXT,
      created_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS whitelist (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      reason TEXT,
      created_by TEXT,
      created_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS enterprise_clients (
      id TEXT PRIMARY KEY,
      name TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      api_key TEXT UNIQUE,
      api_secret TEXT,
      status TEXT DEFAULT 'active',
      monthly_quota INTEGER DEFAULT 1000,
      used_quota INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS quality_rules (
      id TEXT PRIMARY KEY,
      order_type TEXT,
      rule_name TEXT,
      rule_key TEXT,
      required INTEGER DEFAULT 1,
      description TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      type TEXT,
      title TEXT,
      content TEXT,
      related_id TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT
    );
  `);

  return db;
}

function getDB() {
  if (!db) {
    return initDB();
  }
  return db;
}

module.exports = { initDB, getDB };
