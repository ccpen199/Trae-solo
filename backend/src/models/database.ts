import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = path.resolve(__dirname, '../../', process.env.DATABASE_URL || '../data/app.sqlite');
const db: Database.Database = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      phone TEXT,
      email TEXT,
      points INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      failed_attempts INTEGER DEFAULT 0,
      locked_until DATETIME,
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS login_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      success INTEGER NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      failure_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT,
      type TEXT NOT NULL,
      protocol TEXT NOT NULL,
      status TEXT DEFAULT 'offline',
      has_wifi INTEGER DEFAULT 1,
      ir_code TEXT,
      room TEXT,
      user_id INTEGER,
      firmware_version TEXT,
      last_online DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS device_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      metric_key TEXT NOT NULL,
      metric_value REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS scenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      user_id INTEGER NOT NULL,
      trigger_type TEXT NOT NULL DEFAULT 'manual',
      trigger_config TEXT,
      actions TEXT NOT NULL,
      is_geek_mode INTEGER DEFAULT 0,
      last_executed_at DATETIME,
      execution_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS scene_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scene_id INTEGER NOT NULL,
      trigger_source TEXT,
      success INTEGER DEFAULT 1,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scene_id) REFERENCES scenes(id)
    );

    CREATE TABLE IF NOT EXISTS service_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      device_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      appointment_time DATETIME,
      fault_description TEXT,
      diagnosis_result TEXT,
      engineer_id INTEGER,
      progress TEXT,
      extended_warranty INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT,
      price REAL NOT NULL,
      erp_stock INTEGER DEFAULT 0,
      aftersales_parts INTEGER DEFAULT 0,
      description TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trade_in_estimations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      old_device_model TEXT NOT NULL,
      old_device_age INTEGER NOT NULL,
      old_device_condition TEXT NOT NULL,
      estimated_value REAL NOT NULL,
      new_product_id INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (new_product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS energy_consumption (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      date DATE NOT NULL,
      kwh REAL NOT NULL,
      cost REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS point_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      points INTEGER NOT NULL,
      type TEXT NOT NULL,
      reason TEXT,
      balance_after INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS green_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      period TEXT NOT NULL,
      total_kwh REAL NOT NULL,
      saved_kwh REAL NOT NULL,
      points_earned INTEGER NOT NULL,
      report_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS firmware_releases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT NOT NULL,
      device_model TEXT NOT NULL,
      file_url TEXT,
      md5 TEXT,
      description TEXT,
      is_gray INTEGER DEFAULT 0,
      gray_percentage INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS firmware_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      firmware_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      started_at DATETIME,
      completed_at DATETIME,
      error_message TEXT,
      FOREIGN KEY (device_id) REFERENCES devices(id),
      FOREIGN KEY (firmware_id) REFERENCES firmware_releases(id)
    );

    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      parent_id INTEGER,
      level INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS channel_device_bindings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id INTEGER NOT NULL,
      device_id INTEGER NOT NULL,
      bound_by INTEGER NOT NULL,
      bound_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      permission_level TEXT NOT NULL DEFAULT 'view',
      FOREIGN KEY (channel_id) REFERENCES channels(id),
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS device_health_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      risk_level TEXT NOT NULL,
      analysis TEXT,
      prediction_days INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS ir_bridges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bridge_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'offline',
      room TEXT,
      user_id INTEGER,
      ip_address TEXT,
      last_heartbeat DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ir_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bridge_id INTEGER NOT NULL,
      device_brand TEXT NOT NULL,
      device_type TEXT NOT NULL,
      code_name TEXT NOT NULL,
      code_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bridge_id) REFERENCES ir_bridges(id)
    );

    CREATE INDEX IF NOT EXISTS idx_device_metrics_device_time ON device_metrics(device_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_energy_user_date ON energy_consumption(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_health_device_time ON device_health_scores(device_id, created_at);
  `);

  try { db.exec('ALTER TABLE users ADD COLUMN status TEXT DEFAULT "active"'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN failed_attempts INTEGER DEFAULT 0'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN locked_until DATETIME'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN last_login_at DATETIME'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN identity_type TEXT'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN company_name TEXT'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN business_license TEXT'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN partner_type TEXT'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN real_name TEXT'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN certification_no TEXT'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN service_area TEXT'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN device_serial TEXT'); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN membership_level TEXT DEFAULT 'standard'"); } catch {}
  try { db.exec('ALTER TABLE scenes ADD COLUMN last_executed_at DATETIME'); } catch {}
  try { db.exec('ALTER TABLE scenes ADD COLUMN execution_count INTEGER DEFAULT 0'); } catch {}

  const bcrypt = require('bcryptjs');
  const ensureUser = (
    username: string,
    password: string,
    role: string,
    phone: string,
    email: string,
    points = 0,
    status = 'active',
  ) => {
    const hash = bcrypt.hashSync(password, 10);
    const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (exists) {
      db.prepare(
        'UPDATE users SET password = ?, role = ?, phone = ?, email = ?, points = ?, status = ?, failed_attempts = 0, locked_until = NULL WHERE username = ?'
      ).run(hash, role, phone, email, points, status, username);
      return;
    }
    db.prepare('INSERT INTO users (username, password, role, phone, email, points, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(username, hash, role, phone, email, points, status);
  };

  ensureUser('admin', 'Admin@123', 'admin', '13800138000', 'admin@haier.com');
  ensureUser('platform', 'Admin@123', 'platform', '13700137000', 'platform@haier.com');
  ensureUser('ops', 'Admin@123', 'ops', '13600136000', 'ops@haier.com');
  ensureUser('user', 'admin123', 'user', '13900139000', 'user@haier.com', 1000);
  ensureUser('lockeduser', 'Admin@123', 'user', '13500135000', 'locked@haier.com', 0, 'locked');
  db.prepare('UPDATE users SET status = ?, failed_attempts = ?, locked_until = datetime(\'now\', \'+1 hour\') WHERE username = ?').run('locked', 5, 'lockeduser');
}

export { db, initDatabase };
