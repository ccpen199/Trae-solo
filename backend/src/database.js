const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT,
      phone TEXT,
      address TEXT,
      qualification_ids TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      license_number TEXT UNIQUE,
      license_expiry DATE,
      cold_chain_cert BOOLEAN DEFAULT 0,
      cert_expiry DATE,
      phone TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate_number TEXT UNIQUE,
      vehicle_type TEXT,
      temp_zones TEXT,
      min_temp REAL,
      max_temp REAL,
      device_id TEXT,
      device_status TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'idle',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS temperature_probes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      probe_id TEXT UNIQUE,
      vehicle_id INTEGER,
      status TEXT DEFAULT 'active',
      last_calibration DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE,
      drug_batch TEXT NOT NULL,
      drug_name TEXT,
      temp_zone_required TEXT,
      min_temp REAL,
      max_temp REAL,
      customer_id INTEGER,
      deadline DATETIME,
      qualifications_required TEXT,
      probe_id TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS dispatches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      vehicle_id INTEGER,
      driver_id INTEGER,
      scheduled_time DATETIME,
      actual_departure DATETIME,
      actual_arrival DATETIME,
      route TEXT,
      status TEXT DEFAULT 'scheduled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS temperature_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dispatch_id INTEGER,
      probe_id TEXT,
      temperature REAL,
      location TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_alert BOOLEAN DEFAULT 0,
      alert_type TEXT,
      FOREIGN KEY (dispatch_id) REFERENCES dispatches(id)
    );

    CREATE TABLE IF NOT EXISTS gps_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dispatch_id INTEGER,
      latitude REAL,
      longitude REAL,
      speed REAL,
      door_open BOOLEAN DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dispatch_id) REFERENCES dispatches(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dispatch_id INTEGER,
      alert_type TEXT,
      alert_level TEXT,
      message TEXT,
      status TEXT DEFAULT 'pending',
      handled_by TEXT,
      handled_at DATETIME,
      handling_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dispatch_id) REFERENCES dispatches(id)
    );

    CREATE TABLE IF NOT EXISTS signoffs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dispatch_id INTEGER,
      receiver_name TEXT,
      receiver_id TEXT,
      signoff_time DATETIME,
      temperature REAL,
      photo_url TEXT,
      status TEXT,
      exception_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dispatch_id) REFERENCES dispatches(id)
    );

    CREATE TABLE IF NOT EXISTS audits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      dispatch_id INTEGER,
      action_type TEXT,
      action_details TEXT,
      operator TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (dispatch_id) REFERENCES dispatches(id)
    );
  `);

  const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
  if (customerCount === 0) {
    const insertCustomer = db.prepare('INSERT INTO customers (name, contact, phone, address, qualification_ids) VALUES (?, ?, ?, ?, ?)');
    insertCustomer.run('北京协和医院', '张主任', '13800138001', '北京市东城区王府井帅府园1号', 'LIC001,LIC002');
    insertCustomer.run('上海瑞金医院', '李药师', '13800138002', '上海市黄浦区瑞金二路197号', 'LIC001');
    insertCustomer.run('广州中山医院', '王护士长', '13800138003', '广州市越秀区中山二路58号', 'LIC001,LIC003');
  }

  const driverCount = db.prepare('SELECT COUNT(*) as count FROM drivers').get().count;
  if (driverCount === 0) {
    const insertDriver = db.prepare('INSERT INTO drivers (name, license_number, license_expiry, cold_chain_cert, cert_expiry, phone) VALUES (?, ?, ?, ?, ?, ?)');
    insertDriver.run('张三', 'A12345678', '2026-12-31', 1, '2026-06-30', '13900139001');
    insertDriver.run('李四', 'B87654321', '2027-03-15', 1, '2025-12-31', '13900139002');
    insertDriver.run('王五', 'C11223344', '2026-08-20', 0, null, '13900139003');
  }

  const vehicleCount = db.prepare('SELECT COUNT(*) as count FROM vehicles').get().count;
  if (vehicleCount === 0) {
    const insertVehicle = db.prepare('INSERT INTO vehicles (plate_number, vehicle_type, temp_zones, min_temp, max_temp, device_id, device_status) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertVehicle.run('京A12345', '冷藏车', 'cold', 2, 8, 'DEV001', 'normal');
    insertVehicle.run('沪B67890', '冷冻车', 'frozen', -25, -15, 'DEV002', 'normal');
    insertVehicle.run('粤C11111', '冷藏车', 'cold', 2, 8, 'DEV003', 'offline');
  }

  const probeCount = db.prepare('SELECT COUNT(*) as count FROM temperature_probes').get().count;
  if (probeCount === 0) {
    const insertProbe = db.prepare('INSERT INTO temperature_probes (probe_id, vehicle_id, last_calibration) VALUES (?, ?, ?)');
    insertProbe.run('PROBE001', 1, '2026-01-15');
    insertProbe.run('PROBE002', 2, '2026-02-20');
    insertProbe.run('PROBE003', 3, '2025-06-10');
  }
}

module.exports = { db, initDatabase };
