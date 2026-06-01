import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../../data/app.sqlite')

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'shipper',
      status TEXT DEFAULT 'active',
      company_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id),
      id_card TEXT UNIQUE,
      driver_license TEXT UNIQUE,
      vehicle_license TEXT,
      no_crime_record TEXT,
      real_name TEXT,
      phone TEXT,
      status TEXT DEFAULT 'pending',
      rating REAL DEFAULT 5.0,
      order_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      verified_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER REFERENCES drivers(id),
      plate_number TEXT UNIQUE NOT NULL,
      vehicle_type TEXT NOT NULL,
      vehicle_length REAL NOT NULL,
      max_weight REAL,
      max_volume REAL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_code TEXT,
      city_name TEXT,
      district_code TEXT,
      district_name TEXT,
      geofence TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      shipper_id INTEGER REFERENCES users(id),
      driver_id INTEGER REFERENCES drivers(id),
      vehicle_id INTEGER REFERENCES vehicles(id),
      order_type TEXT NOT NULL DEFAULT 'instant',
      cargo_type TEXT,
      cargo_weight REAL,
      cargo_volume REAL,
      loading_address TEXT NOT NULL,
      loading_lat REAL,
      loading_lng REAL,
      unloading_address TEXT NOT NULL,
      unloading_lat REAL,
      unloading_lng REAL,
      distance REAL,
      loading_requirements TEXT,
      time_window_start DATETIME,
      time_window_end DATETIME,
      vehicle_type_required TEXT,
      vehicle_length_required REAL,
      status TEXT DEFAULT 'pending',
      price REAL,
      platform_fee REAL,
      driver_income REAL,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      accepted_at DATETIME,
      arrived_at DATETIME,
      loaded_at DATETIME,
      completed_at DATETIME,
      cancelled_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS order_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id),
      status TEXT NOT NULL,
      location TEXT,
      lat REAL,
      lng REAL,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS waybills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER UNIQUE REFERENCES orders(id),
      waybill_no TEXT UNIQUE NOT NULL,
      shipper_signature TEXT,
      driver_signature TEXT,
      receiver_signature TEXT,
      cargo_photos TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id),
      driver_id INTEGER REFERENCES drivers(id),
      bid_price REAL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id),
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      payer_id INTEGER REFERENCES users(id),
      payee_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'pending',
      payment_method TEXT,
      transaction_no TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id),
      reporter_id INTEGER REFERENCES users(id),
      type TEXT NOT NULL,
      description TEXT,
      evidence TEXT,
      status TEXT DEFAULT 'pending',
      handler_id INTEGER REFERENCES users(id),
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      handled_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS sla_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id),
      accept_time INTEGER,
      arrive_time INTEGER,
      accept_standard INTEGER DEFAULT 60,
      arrive_standard INTEGER DEFAULT 300,
      accept_passed BOOLEAN,
      arrive_passed BOOLEAN,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS route_heatmap (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_city TEXT,
      to_city TEXT,
      order_count INTEGER DEFAULT 0,
      total_revenue REAL DEFAULT 0,
      date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS capacity_pool (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER REFERENCES drivers(id),
      vehicle_id INTEGER REFERENCES vehicles(id),
      city TEXT,
      status TEXT DEFAULT 'online',
      lat REAL,
      lng REAL,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count
  if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (phone, password, name, role, company_name) VALUES (?, ?, ?, ?, ?)')
    insertUser.run('13800138001', '123456', '张货主', 'shipper', '朝阳贸易公司')
    insertUser.run('13800138002', '123456', '李司机', 'driver', null)
    insertUser.run('13800138003', '123456', '王管理员', 'admin', null)

    const insertDriver = db.prepare('INSERT INTO drivers (user_id, real_name, phone, status, id_card, driver_license) VALUES (?, ?, ?, ?, ?, ?)')
    insertDriver.run(2, '李司机', '13800138002', 'verified', '110101199001011234', '110000123456')

    const insertVehicle = db.prepare('INSERT INTO vehicles (driver_id, plate_number, vehicle_type, vehicle_length, max_weight, max_volume) VALUES (?, ?, ?, ?, ?, ?)')
    insertVehicle.run(1, '京A12345', '厢货', 4.2, 5, 15)

    const insertOrder = db.prepare('INSERT INTO orders (order_no, shipper_id, order_type, cargo_type, cargo_weight, cargo_volume, loading_address, unloading_address, distance, price, platform_fee, driver_income, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    insertOrder.run('ORD20240100001', 1, 'instant', '日用品', 0.5, 2, '北京市朝阳区建国路88号', '北京市海淀区中关村大街1号', 18.5, 120, 12, 108, 'completed')
  }

  console.log('Database initialized successfully')
}

export { db, initDatabase }
