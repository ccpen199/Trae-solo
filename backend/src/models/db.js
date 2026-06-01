const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function migrateUserRoleConstraint() {
  try {
    const tableInfo = db.prepare("PRAGMA table_info(users)").all();
    const roleCol = tableInfo.find(c => c.name === 'role');
    
    if (!roleCol) return;
    
    const hasNewRoles = db.prepare("SELECT 1 FROM users WHERE role IN ('platform', 'ops')").get();
    if (hasNewRoles) return;
    
    db.exec(`
      PRAGMA foreign_keys = OFF;
      
      CREATE TABLE IF NOT EXISTS users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone TEXT UNIQUE,
        role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'station_master', 'platform', 'ops')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      INSERT INTO users_new SELECT * FROM users;
      
      DROP TABLE IF EXISTS users;
      
      ALTER TABLE users_new RENAME TO users;
      
      PRAGMA foreign_keys = ON;
    `);
    
    console.log('数据库迁移完成：已扩展 role 字段约束');
  } catch (err) {
    console.warn('迁移跳过或失败（可能表已更新）:', err.message);
  }
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT UNIQUE,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'station_master', 'platform', 'ops')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parcels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_number TEXT UNIQUE NOT NULL,
      courier TEXT NOT NULL,
      sender TEXT,
      receiver TEXT,
      receiver_phone TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'transit', 'out_for_delivery', 'delivered', 'exception', 'returned')),
      weight REAL,
      volume REAL,
      estimated_delivery DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS parcel_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parcel_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      location TEXT,
      description TEXT,
      operator TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      hash TEXT NOT NULL,
      previous_hash TEXT,
      FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pickup_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parcel_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      locker_id TEXT,
      expires_at DATETIME NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'used', 'expired', 'transferred')),
      authorized_biometrics TEXT,
      FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shipping_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sender_name TEXT NOT NULL,
      sender_phone TEXT NOT NULL,
      sender_address TEXT NOT NULL,
      receiver_name TEXT NOT NULL,
      receiver_phone TEXT NOT NULL,
      receiver_address TEXT NOT NULL,
      weight REAL NOT NULL,
      volume REAL,
      item_type TEXT,
      insured_value REAL DEFAULT 0,
      timeline TEXT,
      price REAL NOT NULL,
      courier TEXT,
      status TEXT DEFAULT 'created' CHECK(status IN ('created', 'paid', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
      scheduled_pickup DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      manager_id INTEGER,
      contact TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'pending')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (manager_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS community_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('help_offer', 'help_request')),
      title TEXT NOT NULL,
      content TEXT,
      reward REAL DEFAULT 0,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'claimed', 'completed', 'closed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS recycling_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      points INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS courier_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courier TEXT NOT NULL,
      min_weight REAL NOT NULL DEFAULT 0,
      max_weight REAL NOT NULL,
      price_per_kg REAL NOT NULL,
      base_price REAL NOT NULL DEFAULT 0,
      timeline TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS anomalies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parcel_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      status TEXT DEFAULT 'detected' CHECK(status IN ('detected', 'investigating', 'resolved', 'closed')),
      FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_parcels_tracking ON parcels(tracking_number);
    CREATE INDEX IF NOT EXISTS idx_parcels_user ON parcels(user_id);
    CREATE INDEX IF NOT EXISTS idx_parcel_events_parcel ON parcel_events(parcel_id);
    CREATE INDEX IF NOT EXISTS idx_pickup_codes_parcel ON pickup_codes(parcel_id);
    CREATE INDEX IF NOT EXISTS idx_shipping_orders_user ON shipping_orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_anomalies_parcel ON anomalies(parcel_id);
  `);
}

module.exports = { db, initTables, migrateUserRoleConstraint };
