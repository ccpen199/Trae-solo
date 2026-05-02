const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('数据库连接成功');
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT,
      phone TEXT,
      address TEXT,
      latitude REAL,
      longitude REAL,
      green_credit INTEGER DEFAULT 0,
      carbon_reduction REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS riders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      status TEXT DEFAULT 'offline',
      latitude REAL,
      longitude REAL,
      total_orders INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS centers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      manager_id TEXT,
      phone TEXT,
      capacity REAL DEFAULT 10000,
      current_stock REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (manager_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS price_rules (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      sub_category TEXT,
      price_per_kg REAL NOT NULL,
      unit TEXT DEFAULT 'kg',
      effective_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiry_date DATETIME,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      resident_id TEXT NOT NULL,
      rider_id TEXT,
      center_id TEXT,
      status TEXT DEFAULT 'pending_pickup',
      category TEXT NOT NULL,
      weight REAL,
      unit_price REAL,
      total_amount REAL,
      green_credit_earned INTEGER,
      carbon_reduction REAL,
      resident_latitude REAL NOT NULL,
      resident_longitude REAL NOT NULL,
      rider_latitude REAL,
      rider_longitude REAL,
      appointment_time DATETIME,
      pickup_time DATETIME,
      arrival_time DATETIME,
      center_receipt_time DATETIME,
      qr_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resident_id) REFERENCES users(id),
      FOREIGN KEY (rider_id) REFERENCES users(id),
      FOREIGN KEY (center_id) REFERENCES centers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_status_logs (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      operator_id TEXT,
      operator_role TEXT,
      reason TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      order_id TEXT,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      balance_before INTEGER,
      balance_after INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS carbon_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      order_id TEXT,
      category TEXT,
      weight REAL,
      carbon_reduction REAL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS weight_differences (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      pickup_weight REAL,
      receipt_weight REAL,
      difference REAL,
      difference_percent REAL,
      status TEXT DEFAULT 'pending',
      reported_by TEXT,
      resolved_by TEXT,
      resolution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;
