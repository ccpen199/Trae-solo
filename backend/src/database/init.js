const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      license_number TEXT,
      car_model TEXT,
      car_plate TEXT,
      current_lat REAL,
      current_lng REAL,
      status TEXT DEFAULT 'offline',
      rating REAL DEFAULT 5.0,
      order_count INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS passengers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      rating REAL DEFAULT 5.0,
      order_count INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_main (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      passenger_id TEXT NOT NULL,
      driver_id TEXT,
      start_address TEXT NOT NULL,
      start_lat REAL NOT NULL,
      start_lng REAL NOT NULL,
      end_address TEXT NOT NULL,
      end_lat REAL NOT NULL,
      end_lng REAL NOT NULL,
      expected_eta INTEGER,
      estimated_distance REAL,
      estimated_price REAL,
      actual_distance REAL,
      actual_price REAL,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_status TEXT DEFAULT 'pending',
      ride_type TEXT DEFAULT 'standard',
      passenger_note TEXT,
      expected_complete_time INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (passenger_id) REFERENCES passengers(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS order_detail (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      detail_type TEXT NOT NULL,
      detail_content TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (order_id) REFERENCES order_main(id)
    );

    CREATE TABLE IF NOT EXISTS status_flow (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      operator_id TEXT,
      operator_role TEXT,
      reason TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (order_id) REFERENCES order_main(id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      related_type TEXT,
      related_id TEXT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (order_id) REFERENCES order_main(id)
    );

    CREATE TABLE IF NOT EXISTS comments_approvals (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      content TEXT,
      rating INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (order_id) REFERENCES order_main(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_role TEXT NOT NULL,
      order_id TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (order_id) REFERENCES order_main(id)
    );

    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_role TEXT NOT NULL,
      order_id TEXT NOT NULL,
      task_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      due_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (order_id) REFERENCES order_main(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS statistics_snapshots (
      id TEXT PRIMARY KEY,
      snapshot_date TEXT NOT NULL,
      snapshot_type TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS driver_locations (
      id TEXT PRIMARY KEY,
      driver_id TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      accuracy REAL,
      speed REAL,
      heading REAL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS order_tracks (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      driver_id TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      accuracy REAL,
      speed REAL,
      heading REAL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (order_id) REFERENCES order_main(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS exceptions (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      exception_type TEXT NOT NULL,
      description TEXT,
      original_data TEXT,
      status TEXT DEFAULT 'pending',
      handled_by TEXT,
      handled_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (order_id) REFERENCES order_main(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      passenger_id TEXT NOT NULL,
      driver_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT,
      transaction_id TEXT,
      status TEXT DEFAULT 'pending',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (order_id) REFERENCES order_main(id),
      FOREIGN KEY (passenger_id) REFERENCES passengers(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS safety_reports (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      reporter_id TEXT NOT NULL,
      reporter_role TEXT NOT NULL,
      report_type TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      handled_by TEXT,
      handled_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (order_id) REFERENCES order_main(id)
    );

    CREATE TABLE IF NOT EXISTS geofences (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      center_lat REAL NOT NULL,
      center_lng REAL NOT NULL,
      radius REAL NOT NULL,
      status TEXT DEFAULT 'active',
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_order_main_status ON order_main(status);
    CREATE INDEX IF NOT EXISTS idx_order_main_passenger ON order_main(passenger_id);
    CREATE INDEX IF NOT EXISTS idx_order_main_driver ON order_main(driver_id);
    CREATE INDEX IF NOT EXISTS idx_order_main_created ON order_main(created_at);
    CREATE INDEX IF NOT EXISTS idx_status_flow_order ON status_flow(order_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_driver_locations_driver ON driver_locations(driver_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_order_tracks_order ON order_tracks(order_id);
    CREATE INDEX IF NOT EXISTS idx_exceptions_order ON exceptions(order_id);
  `);

  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const { v4: uuidv4 } = require('uuid');
    
    const adminId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, username, password, role, name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(adminId, 'admin', 'admin123', 'admin', '系统管理员', '10000000000');

    const dispatcherId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, username, password, role, name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(dispatcherId, 'dispatcher', '123456', 'dispatcher', '调度员小张', '13800138001');

    const csId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, username, password, role, name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(csId, 'cs', '123456', 'customer_service', '客服小李', '13800138002');

    const riskId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, username, password, role, name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(riskId, 'risk', '123456', 'risk_control', '风控小王', '13800138003');

    const passengerId1 = uuidv4();
    const pUserId1 = uuidv4();
    db.prepare(`
      INSERT INTO users (id, username, password, role, name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(pUserId1, 'passenger1', '123456', 'passenger', '乘客张三', '13900139001');
    db.prepare(`
      INSERT INTO passengers (id, user_id)
      VALUES (?, ?)
    `).run(passengerId1, pUserId1);

    const driverId1 = uuidv4();
    const dUserId1 = uuidv4();
    db.prepare(`
      INSERT INTO users (id, username, password, role, name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(dUserId1, 'driver1', '123456', 'driver', '司机李四', '13700137001');
    db.prepare(`
      INSERT INTO drivers (id, user_id, license_number, car_model, car_plate, current_lat, current_lng, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(driverId1, dUserId1, 'A12345678', '大众帕萨特', '京A12345', 39.9042, 116.4074, 'idle');

    const driverId2 = uuidv4();
    const dUserId2 = uuidv4();
    db.prepare(`
      INSERT INTO users (id, username, password, role, name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(dUserId2, 'driver2', '123456', 'driver', '司机王五', '13700137002');
    db.prepare(`
      INSERT INTO drivers (id, user_id, license_number, car_model, car_plate, current_lat, current_lng, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(driverId2, dUserId2, 'B87654321', '丰田凯美瑞', '京B54321', 39.9142, 116.4174, 'idle');
  }

  const geofenceExists = db.prepare('SELECT id FROM geofences LIMIT 1').get();
  if (!geofenceExists) {
    const { v4: uuidv4 } = require('uuid');
    
    db.prepare(`
      INSERT INTO geofences (id, name, type, center_lat, center_lng, radius)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), '国贸商圈', 'business', 39.9087, 116.4605, 2000);
    
    db.prepare(`
      INSERT INTO geofences (id, name, type, center_lat, center_lng, radius)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), '北京站', 'transport', 39.9042, 116.4274, 1500);
    
    db.prepare(`
      INSERT INTO geofences (id, name, type, center_lat, center_lng, radius)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), '首都机场T3', 'airport', 40.0799, 116.6031, 3000);
  }
};

initTables();

module.exports = db;
