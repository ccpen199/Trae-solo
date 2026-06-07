const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const dbDir = path.join(__dirname, '../../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('province', 'branch', 'station')),
      parent_id INTEGER,
      address TEXT,
      contact TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES organizations(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      real_name TEXT NOT NULL,
      id_card TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      address TEXT,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'grid_worker', 'operator', 'admin')),
      org_id INTEGER,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'pending')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (org_id) REFERENCES organizations(id)
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      gas_user_no TEXT UNIQUE,
      meter_no TEXT UNIQUE,
      household_type TEXT,
      building_area REAL,
      population INTEGER,
      gas_equipment TEXT,
      bank_account TEXT,
      auto_pay INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS meters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meter_no TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      location TEXT,
      gis_coords TEXT,
      install_date DATE,
      last_read_date DATE,
      last_read_value REAL DEFAULT 0,
      status TEXT DEFAULT 'normal' CHECK(status IN ('normal', 'fault', 'replaced')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS meter_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      meter_id INTEGER NOT NULL,
      reading_value REAL NOT NULL,
      reading_type TEXT NOT NULL CHECK(reading_type IN ('ocr', 'manual', 'automatic')),
      image_path TEXT,
      ocr_result TEXT,
      reading_date DATE NOT NULL,
      billing_cycle TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'rejected')),
      verified_by INTEGER,
      verified_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (meter_id) REFERENCES meters(id)
    );

    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      reading_id INTEGER,
      billing_cycle TEXT NOT NULL,
      gas_usage REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_amount REAL NOT NULL,
      late_fee REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      pay_amount REAL NOT NULL,
      status TEXT DEFAULT 'unpaid' CHECK(status IN ('unpaid', 'paid', 'partial', 'overdue')),
      pay_method TEXT,
      pay_time DATETIME,
      auto_pay INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (reading_id) REFERENCES meter_readings(id)
    );

    CREATE TABLE IF NOT EXISTS auto_pay_agreements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      bank_name TEXT NOT NULL,
      bank_account TEXT NOT NULL,
      account_name TEXT NOT NULL,
      id_card TEXT NOT NULL,
      monthly_limit REAL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'cancelled')),
      signed_at DATE NOT NULL,
      cancelled_at DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('install', 'repair', 'inspect', 'complaint')),
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      gps_coords TEXT,
      images TEXT,
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'processing', 'completed', 'cancelled')),
      assigned_to INTEGER,
      assign_time DATETIME,
      start_time DATETIME,
      complete_time DATETIME,
      sla_due_time DATETIME,
      rating INTEGER,
      review TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS work_order_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      operator_id INTEGER,
      action TEXT NOT NULL,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES work_orders(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('gas_appliance', 'home_appliance', 'local_specialty')),
      brand TEXT,
      price REAL NOT NULL,
      original_price REAL,
      stock INTEGER DEFAULT 0,
      description TEXT,
      images TEXT,
      specs TEXT,
      warranty_months INTEGER DEFAULT 12,
      is_new INTEGER DEFAULT 1,
      is_hot INTEGER DEFAULT 0,
      status TEXT DEFAULT 'online' CHECK(status IN ('online', 'offline', 'deleted')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded')),
      receiver_name TEXT NOT NULL,
      receiver_phone TEXT NOT NULL,
      receiver_address TEXT NOT NULL,
      appointment_time DATETIME,
      pay_time DATETIME,
      ship_time DATETIME,
      deliver_time DATETIME,
      warranty_no TEXT,
      old_product_info TEXT,
      trade_in_value REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS warranties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      warranty_no TEXT UNIQUE NOT NULL,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'void')),
      terms TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES product_orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS safety_knowledge (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('leak', 'fire', 'explosion', 'daily', 'ar_guide')),
      content TEXT NOT NULL,
      ar_asset_path TEXT,
      step_by_step TEXT,
      video_url TEXT,
      sort_order INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published' CHECK(status IN ('draft', 'published', 'archived')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS usage_anomalies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      anomaly_type TEXT NOT NULL CHECK(anomaly_type IN ('sudden_increase', 'sudden_decrease', 'zero_usage', 'abnormal_pattern')),
      detected_date DATE NOT NULL,
      current_usage REAL,
      expected_usage REAL,
      deviation_percent REAL,
      historical_data TEXT,
      status TEXT DEFAULT 'detected' CHECK(status IN ('detected', 'notified', 'confirmed', 'resolved', 'false_alarm')),
      notified_at DATETIME,
      resolved_at DATETIME,
      resolution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS grid_collaborations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grid_worker_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      task_type TEXT NOT NULL CHECK(task_type IN ('home_check', 'meter_read', 'safety_check', 'follow_up')),
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
      scheduled_date DATE,
      completed_date DATE,
      result TEXT,
      images TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (grid_worker_id) REFERENCES users(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS device_bindings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_device_id INTEGER,
      child_device_id INTEGER NOT NULL,
      relation_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_device_id) REFERENCES meters(id),
      FOREIGN KEY (child_device_id) REFERENCES meters(id)
    );

    CREATE TABLE IF NOT EXISTS notification_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  console.log('数据库初始化完成');
  return db;
}

module.exports = { db, initDatabase };
