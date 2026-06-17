import type Database from 'better-sqlite3';

export function initSchema(db: Database.Database): void {
  db.exec(`
    DROP TABLE IF EXISTS operation_logs;
    DROP TABLE IF EXISTS user_addresses;
    DROP TABLE IF EXISTS coupons;
    DROP TABLE IF EXISTS city_geofences;
    DROP TABLE IF EXISTS cities;
    DROP TABLE IF EXISTS rider_medals;
    DROP TABLE IF EXISTS reviews;
    DROP TABLE IF EXISTS dispute_tickets;
    DROP TABLE IF EXISTS withdrawals;
    DROP TABLE IF EXISTS settlements;
    DROP TABLE IF EXISTS gps_tracks;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS merchant_products;
    DROP TABLE IF EXISTS merchant_stores;
    DROP TABLE IF EXISTS merchants;
    DROP TABLE IF EXISTS rider_service_areas;
    DROP TABLE IF EXISTS vehicles;
    DROP TABLE IF EXISTS riders;
    DROP TABLE IF EXISTS users;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      nickname TEXT,
      avatar TEXT,
      real_name TEXT,
      id_card TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      password_hash TEXT,
      balance REAL DEFAULT 0,
      city_id TEXT,
      status TEXT DEFAULT 'normal',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS riders (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      level TEXT DEFAULT 'bronze',
      total_orders INTEGER DEFAULT 0,
      credit_score INTEGER DEFAULT 100,
      fulfillment_rate REAL DEFAULT 0,
      avg_rating REAL DEFAULT 0,
      current_orders INTEGER DEFAULT 0,
      online_status TEXT DEFAULT 'offline',
      accept_mode TEXT DEFAULT 'grab',
      current_lat REAL,
      current_lng REAL,
      online_at TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      rider_id TEXT NOT NULL,
      type TEXT,
      plate_number TEXT,
      vehicle_image TEXT,
      insurance_expire TEXT,
      FOREIGN KEY (rider_id) REFERENCES riders(id)
    );

    CREATE TABLE IF NOT EXISTS rider_service_areas (
      id TEXT PRIMARY KEY,
      rider_id TEXT NOT NULL,
      name TEXT,
      polygon TEXT,
      FOREIGN KEY (rider_id) REFERENCES riders(id)
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      shop_name TEXT,
      license_no TEXT,
      legal_person TEXT,
      id_card TEXT,
      category TEXT,
      audit_status TEXT DEFAULT 'pending',
      commission_rate REAL DEFAULT 0.1,
      balance REAL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS merchant_stores (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL,
      name TEXT,
      address TEXT,
      lat REAL,
      lng REAL,
      business_hours TEXT,
      delivery_radius REAL DEFAULT 5,
      delivery_fee REAL DEFAULT 3,
      status TEXT DEFAULT 'open',
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS merchant_products (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      name TEXT,
      category TEXT,
      price REAL,
      image TEXT,
      stock INTEGER DEFAULT 0,
      status TEXT DEFAULT 'on',
      FOREIGN KEY (store_id) REFERENCES merchant_stores(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      category TEXT,
      city_id TEXT,
      user_id TEXT,
      merchant_id TEXT,
      rider_id TEXT,
      status TEXT DEFAULT 'pending',
      amount REAL DEFAULT 0,
      goods_amount REAL DEFAULT 0,
      delivery_fee REAL DEFAULT 0,
      distance REAL DEFAULT 0,
      weight REAL DEFAULT 0,
      premium REAL DEFAULT 0,
      coupon_id TEXT,
      pay_method TEXT,
      pay_status TEXT DEFAULT 'unpaid',
      pickup_name TEXT,
      pickup_phone TEXT,
      pickup_address TEXT,
      pickup_lat REAL,
      pickup_lng REAL,
      deliver_name TEXT,
      deliver_phone TEXT,
      deliver_address TEXT,
      deliver_lat REAL,
      deliver_lng REAL,
      goods_description TEXT,
      goods_images TEXT,
      remark TEXT,
      expected_at TEXT,
      accepted_at TEXT,
      picked_up_at TEXT,
      completed_at TEXT,
      cancelled_at TEXT,
      cancel_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id),
      FOREIGN KEY (rider_id) REFERENCES riders(id),
      FOREIGN KEY (coupon_id) REFERENCES coupons(id)
    );

    CREATE TABLE IF NOT EXISTS gps_tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      rider_id TEXT NOT NULL,
      timestamp TEXT DEFAULT (datetime('now')),
      lat REAL,
      lng REAL,
      speed REAL,
      accuracy REAL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (rider_id) REFERENCES riders(id)
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      rider_id TEXT,
      rider_income REAL DEFAULT 0,
      merchant_id TEXT,
      merchant_income REAL DEFAULT 0,
      platform_income REAL DEFAULT 0,
      insurance_fee REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      settled_at TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (rider_id) REFERENCES riders(id),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS withdrawals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL DEFAULT 0,
      fee REAL DEFAULT 0,
      bank_card TEXT,
      bank_name TEXT,
      holder_name TEXT,
      status TEXT DEFAULT 'pending',
      audit_note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      paid_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS dispute_tickets (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      initiator TEXT,
      type TEXT,
      description TEXT,
      evidences TEXT,
      status TEXT DEFAULT 'pending',
      responsible_party TEXT,
      compensation REAL DEFAULT 0,
      assignee TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      tags TEXT,
      content TEXT,
      images TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS rider_medals (
      id TEXT PRIMARY KEY,
      rider_id TEXT NOT NULL,
      type TEXT,
      name TEXT,
      awarded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (rider_id) REFERENCES riders(id)
    );

    CREATE TABLE IF NOT EXISTS cities (
      id TEXT PRIMARY KEY,
      name TEXT,
      province TEXT,
      tier TEXT,
      center_lat REAL,
      center_lng REAL,
      pricing_config TEXT,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS city_geofences (
      id TEXT PRIMARY KEY,
      city_id TEXT NOT NULL,
      name TEXT,
      type TEXT,
      polygon TEXT,
      config TEXT,
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT,
      type TEXT DEFAULT 'fixed',
      value REAL DEFAULT 0,
      min_amount REAL DEFAULT 0,
      valid_from TEXT,
      valid_to TEXT,
      used_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tag TEXT,
      name TEXT,
      phone TEXT,
      address TEXT,
      lat REAL,
      lng REAL,
      is_default INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT,
      action TEXT,
      target_type TEXT,
      target_id TEXT,
      detail TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}
