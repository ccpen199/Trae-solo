import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(__dirname, '..', 'delivery.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables(db);
  }
  return db;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS riders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL DEFAULT 'fulltime',
      status TEXT NOT NULL DEFAULT 'offline',
      credit_score INTEGER NOT NULL DEFAULT 100,
      battery INTEGER DEFAULT 100,
      vehicle_type TEXT DEFAULT 'electric',
      willingness_coefficient REAL DEFAULT 1.0,
      fulfillment_rate REAL DEFAULT 0.95,
      current_lat REAL,
      current_lng REAL,
      last_online_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rider_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rider_id INTEGER NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      speed REAL DEFAULT 0,
      heading REAL DEFAULT 0,
      accuracy REAL DEFAULT 0,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (rider_id) REFERENCES riders(id)
    );

    CREATE INDEX IF NOT EXISTS idx_rider_locations_rider_time 
      ON rider_locations(rider_id, timestamp DESC);

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      platform TEXT NOT NULL DEFAULT 'self',
      merchant_id INTEGER,
      merchant_name TEXT,
      merchant_address TEXT,
      merchant_lat REAL,
      merchant_lng REAL,
      recipient_name TEXT,
      recipient_phone TEXT,
      recipient_address TEXT,
      recipient_lat REAL,
      recipient_lng REAL,
      goods_type TEXT DEFAULT 'normal',
      goods_name TEXT,
      weight REAL DEFAULT 0,
      volume REAL DEFAULT 0,
      is_special INTEGER DEFAULT 0,
      special_note TEXT,
      pickup_time_start INTEGER,
      pickup_time_end INTEGER,
      delivery_time_start INTEGER,
      delivery_time_end INTEGER,
      delivery_fee REAL DEFAULT 0,
      tip_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      assigned_rider_id INTEGER,
      assigned_at INTEGER,
      picked_at INTEGER,
      delivered_at INTEGER,
      cancelled_at INTEGER,
      cancel_reason TEXT,
      estimated_distance REAL DEFAULT 0,
      estimated_duration INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (assigned_rider_id) REFERENCES riders(id)
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_platform ON orders(platform);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

    CREATE TABLE IF NOT EXISTS order_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      rider_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      score REAL DEFAULT 0,
      distance REAL DEFAULT 0,
      responded_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (rider_id) REFERENCES riders(id)
    );

    CREATE TABLE IF NOT EXISTS income_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rider_id INTEGER NOT NULL,
      order_id INTEGER,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      balance REAL NOT NULL,
      description TEXT,
      platform_commission REAL DEFAULT 0,
      insurance_fee REAL DEFAULT 0,
      reward_type TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (rider_id) REFERENCES riders(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE INDEX IF NOT EXISTS idx_income_rider_time 
      ON income_details(rider_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      rider_id INTEGER,
      type TEXT NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      complainant_type TEXT,
      complainant_id INTEGER,
      has_video_evidence INTEGER DEFAULT 0,
      video_url TEXT,
      handler_id INTEGER,
      handler_note TEXT,
      result TEXT,
      penalty_amount REAL DEFAULT 0,
      created_at INTEGER NOT NULL,
      handled_at INTEGER,
      closed_at INTEGER,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (rider_id) REFERENCES riders(id)
    );

    CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
    CREATE INDEX IF NOT EXISTS idx_complaints_type ON complaints(type);

    CREATE TABLE IF NOT EXISTS credit_score_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rider_id INTEGER NOT NULL,
      change_type TEXT NOT NULL,
      change_amount INTEGER NOT NULL,
      before_score INTEGER NOT NULL,
      after_score INTEGER NOT NULL,
      order_id INTEGER,
      complaint_id INTEGER,
      reason TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (rider_id) REFERENCES riders(id),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (complaint_id) REFERENCES complaints(id)
    );

    CREATE TABLE IF NOT EXISTS regions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      center_lat REAL,
      center_lng REAL,
      radius REAL DEFAULT 5,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS region_order_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      region_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      hour INTEGER NOT NULL,
      order_count INTEGER DEFAULT 0,
      rider_count INTEGER DEFAULT 0,
      avg_delivery_time REAL DEFAULT 0,
      weather TEXT,
      temperature REAL,
      is_holiday INTEGER DEFAULT 0,
      has_promotion INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (region_id) REFERENCES regions(id)
    );

    CREATE TABLE IF NOT EXISTS order_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      region_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      hour INTEGER NOT NULL,
      predicted_count INTEGER NOT NULL,
      confidence REAL DEFAULT 0,
      factors TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (region_id) REFERENCES regions(id)
    );

    CREATE TABLE IF NOT EXISTS offline_orders_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rider_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      data TEXT,
      synced INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (rider_id) REFERENCES riders(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS system_health (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric_name TEXT NOT NULL,
      metric_value REAL NOT NULL,
      region_id INTEGER,
      date TEXT,
      hour INTEGER,
      created_at INTEGER NOT NULL
    );
  `);
}
