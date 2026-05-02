const db = require('./database');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      bike_code TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'available',
      location_lat REAL,
      location_lng REAL,
      battery_level INTEGER DEFAULT 100,
      lock_id TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS locks (
      id TEXT PRIMARY KEY,
      lock_code TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'locked',
      vehicle_id TEXT,
      last_sync_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      lock_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending_scan',
      start_time DATETIME,
      end_time DATETIME,
      start_lat REAL,
      start_lng REAL,
      end_lat REAL,
      end_lng REAL,
      duration_minutes INTEGER DEFAULT 0,
      distance_km REAL DEFAULT 0,
      amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      actual_amount REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'unpaid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (lock_id) REFERENCES locks(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS order_details (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      detail_type TEXT NOT NULL,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS status_flows (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      operator_id TEXT,
      operator_role TEXT,
      action TEXT,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      message_type TEXT NOT NULL,
      target_role TEXT,
      target_user_id TEXT,
      order_id TEXT,
      vehicle_id TEXT,
      title TEXT NOT NULL,
      content TEXT,
      status TEXT DEFAULT 'unread',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      uploaded_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS exceptions (
      id TEXT PRIMARY KEY,
      exception_type TEXT NOT NULL,
      order_id TEXT,
      vehicle_id TEXT,
      user_id TEXT,
      status TEXT DEFAULT 'pending',
      title TEXT NOT NULL,
      description TEXT,
      reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      resolved_by TEXT,
      resolution TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS dispatches (
      id TEXT PRIMARY KEY,
      dispatch_no TEXT UNIQUE NOT NULL,
      order_id TEXT,
      vehicle_id TEXT,
      exception_id TEXT,
      dispatcher_id TEXT,
      operator_id TEXT,
      status TEXT DEFAULT 'pending',
      dispatch_type TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      expected_time DATETIME,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS repairs (
      id TEXT PRIMARY KEY,
      repair_no TEXT UNIQUE NOT NULL,
      vehicle_id TEXT NOT NULL,
      operator_id TEXT,
      status TEXT DEFAULT 'pending',
      fault_type TEXT NOT NULL,
      description TEXT,
      estimated_cost REAL,
      actual_cost REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS trails (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      accuracy REAL,
      speed REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      before_state TEXT,
      after_state TEXT,
      ip_address TEXT,
      user_agent TEXT,
      idempotent_key TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS idempotent_records (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      status TEXT DEFAULT 'processing',
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expired_at DATETIME
    )
  `);

  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync('123456', 10);

  const seedUsers = [
    { id: 'user_001', username: 'user1', password: hashedPassword, role: 'rider', name: '骑行用户1', phone: '13800138001' },
    { id: 'user_002', username: 'maintainer1', password: hashedPassword, role: 'maintainer', name: '运维员1', phone: '13800138002' },
    { id: 'user_003', username: 'dispatcher1', password: hashedPassword, role: 'dispatcher', name: '调度员1', phone: '13800138003' },
    { id: 'user_004', username: 'service1', password: hashedPassword, role: 'service', name: '客服1', phone: '13800138004' },
    { id: 'user_005', username: 'admin1', password: hashedPassword, role: 'admin', name: '管理员1', phone: '13800138005' },
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, username, password, role, name, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  seedUsers.forEach(user => {
    insertUser.run(user.id, user.username, user.password, user.role, user.name, user.phone);
  });

  const seedVehicles = [
    { id: 'bike_001', bike_code: 'BK00001', status: 'available', location_lat: 39.9042, location_lng: 116.4074, battery_level: 85, lock_id: 'lock_001' },
    { id: 'bike_002', bike_code: 'BK00002', status: 'available', location_lat: 39.9043, location_lng: 116.4075, battery_level: 92, lock_id: 'lock_002' },
    { id: 'bike_003', bike_code: 'BK00003', status: 'available', location_lat: 39.9044, location_lng: 116.4076, battery_level: 78, lock_id: 'lock_003' },
    { id: 'bike_004', bike_code: 'BK00004', status: 'in_use', location_lat: 39.9045, location_lng: 116.4077, battery_level: 65, lock_id: 'lock_004' },
    { id: 'bike_005', bike_code: 'BK00005', status: 'maintenance', location_lat: 39.9046, location_lng: 116.4078, battery_level: 45, lock_id: 'lock_005' },
  ];

  const insertVehicle = db.prepare(`
    INSERT OR IGNORE INTO vehicles (id, bike_code, status, location_lat, location_lng, battery_level, lock_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  seedVehicles.forEach(vehicle => {
    insertVehicle.run(vehicle.id, vehicle.bike_code, vehicle.status, vehicle.location_lat, vehicle.location_lng, vehicle.battery_level, vehicle.lock_id);
  });

  const seedLocks = [
    { id: 'lock_001', lock_code: 'LK00001', status: 'locked', vehicle_id: 'bike_001' },
    { id: 'lock_002', lock_code: 'LK00002', status: 'locked', vehicle_id: 'bike_002' },
    { id: 'lock_003', lock_code: 'LK00003', status: 'locked', vehicle_id: 'bike_003' },
    { id: 'lock_004', lock_code: 'LK00004', status: 'unlocked', vehicle_id: 'bike_004' },
    { id: 'lock_005', lock_code: 'LK00005', status: 'locked', vehicle_id: 'bike_005' },
  ];

  const insertLock = db.prepare(`
    INSERT OR IGNORE INTO locks (id, lock_code, status, vehicle_id)
    VALUES (?, ?, ?, ?)
  `);

  seedLocks.forEach(lock => {
    insertLock.run(lock.id, lock.lock_code, lock.status, lock.vehicle_id);
  });

  console.log('Database initialized with seed data');
};

module.exports = initDatabase;
