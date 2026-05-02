const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const dbDir = path.dirname(dbPath);

const fs = require('fs');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);

const schema = [
  `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_code TEXT UNIQUE NOT NULL,
    role_name TEXT NOT NULL,
    permissions TEXT NOT NULL,
    description TEXT
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id TEXT UNIQUE NOT NULL,
    station_name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    order_index INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id TEXT UNIQUE NOT NULL,
    route_name TEXT NOT NULL,
    route_code TEXT NOT NULL,
    start_station TEXT NOT NULL,
    end_station TEXT NOT NULL,
    station_order TEXT NOT NULL,
    distance_km REAL NOT NULL,
    estimated_duration_min INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id TEXT UNIQUE NOT NULL,
    plate_number TEXT UNIQUE NOT NULL,
    vehicle_type TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    status TEXT DEFAULT 'idle',
    current_latitude REAL,
    current_longitude REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    license_number TEXT NOT NULL,
    phone TEXT,
    status TEXT DEFAULT 'idle',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id TEXT UNIQUE NOT NULL,
    route_id TEXT NOT NULL,
    driver_id TEXT,
    vehicle_id TEXT,
    departure_time DATETIME NOT NULL,
    estimated_arrival_time DATETIME,
    status TEXT DEFAULT 'draft',
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(route_id),
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS main_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    main_order_no TEXT UNIQUE NOT NULL,
    schedule_id TEXT NOT NULL,
    route_id TEXT NOT NULL,
    current_status TEXT NOT NULL,
    previous_status TEXT,
    status_flow TEXT NOT NULL,
    assigned_to TEXT,
    expected_completion_time DATETIME,
    attachments TEXT,
    remarks TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id),
    FOREIGN KEY (route_id) REFERENCES routes(route_id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS order_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    detail_id TEXT UNIQUE NOT NULL,
    main_order_no TEXT NOT NULL,
    station_id TEXT NOT NULL,
    station_name TEXT NOT NULL,
    scheduled_arrival_time DATETIME,
    actual_arrival_time DATETIME,
    status TEXT DEFAULT 'pending',
    passenger_count INTEGER DEFAULT 0,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (main_order_no) REFERENCES main_orders(main_order_no),
    FOREIGN KEY (station_id) REFERENCES stations(station_id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS vehicle_tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id TEXT UNIQUE NOT NULL,
    vehicle_id TEXT NOT NULL,
    main_order_no TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    speed REAL,
    direction REAL,
    track_time DATETIME NOT NULL,
    is_anomaly INTEGER DEFAULT 0,
    anomaly_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS arrival_predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prediction_id TEXT UNIQUE NOT NULL,
    main_order_no TEXT NOT NULL,
    station_id TEXT NOT NULL,
    predicted_arrival_time DATETIME NOT NULL,
    confidence REAL,
    prediction_source TEXT,
    is_verified INTEGER DEFAULT 0,
    verified_by TEXT,
    verified_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (main_order_no) REFERENCES main_orders(main_order_no)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS alarms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alarm_id TEXT UNIQUE NOT NULL,
    alarm_type TEXT NOT NULL,
    alarm_level TEXT NOT NULL,
    main_order_no TEXT,
    vehicle_id TEXT,
    track_id TEXT,
    message TEXT NOT NULL,
    is_handled INTEGER DEFAULT 0,
    handled_by TEXT,
    handled_at DATETIME,
    handle_result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (main_order_no) REFERENCES main_orders(main_order_no)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_id TEXT UNIQUE NOT NULL,
    main_order_no TEXT,
    operation_type TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    operator_id TEXT NOT NULL,
    operator_name TEXT,
    source_client TEXT NOT NULL,
    related_order TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT UNIQUE NOT NULL,
    main_order_no TEXT NOT NULL,
    message_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    receiver_id TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    read_at DATETIME,
    action_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (main_order_no) REFERENCES main_orders(main_order_no)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS timeline_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT UNIQUE NOT NULL,
    main_order_no TEXT NOT NULL,
    event_type TEXT NOT NULL,
    status_from TEXT,
    status_to TEXT,
    operator_id TEXT,
    operator_name TEXT,
    comment TEXT,
    attachments TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (main_order_no) REFERENCES main_orders(main_order_no)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS station_locks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lock_id TEXT UNIQUE NOT NULL,
    station_id TEXT NOT NULL,
    main_order_no TEXT NOT NULL,
    locked_by TEXT NOT NULL,
    locked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_released INTEGER DEFAULT 0,
    released_at DATETIME,
    FOREIGN KEY (station_id) REFERENCES stations(station_id),
    FOREIGN KEY (main_order_no) REFERENCES main_orders(main_order_no)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS exception_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    queue_id TEXT UNIQUE NOT NULL,
    exception_type TEXT NOT NULL,
    main_order_no TEXT,
    vehicle_id TEXT,
    track_id TEXT,
    original_data TEXT NOT NULL,
    compensation_data TEXT,
    status TEXT DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    next_retry_at DATETIME,
    handled_by TEXT,
    handled_at DATETIME,
    handle_result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `
];

schema.forEach(sql => {
  try {
    db.exec(sql);
  } catch (err) {
    console.error('Schema error:', err.message);
  }
});

const roles = [
  { role_code: 'dispatcher', role_name: '调度员', permissions: 'schedule:create,schedule:edit,schedule:submit,schedule:withdraw,route:view,station:view,vehicle:view,driver:view,alarm:view,statistics:view', description: '排班调度员' },
  { role_code: 'driver', role_name: '司机', permissions: 'schedule:view,task:execute,track:submit,arrival:confirm', description: '公交车司机' },
  { role_code: 'passenger', role_name: '乘客', permissions: 'route:view,schedule:view,arrival:query', description: '普通乘客' },
  { role_code: 'operator', role_name: '运营', permissions: 'schedule:review,schedule:approve,schedule:reject,statistics:view,report:export', description: '运营管理员' },
  { role_code: 'maintenance', role_name: '维修', permissions: 'vehicle:view,alarm:view,maintenance:record', description: '维修人员' }
];

const insertRole = db.prepare(`
  INSERT OR IGNORE INTO roles (role_code, role_name, permissions, description)
  VALUES (?, ?, ?, ?)
`);

roles.forEach(role => {
  insertRole.run(role.role_code, role.role_name, role.permissions, role.description);
});

const bcrypt = require('bcryptjs');

const defaultUsers = [
  { user_id: 'U001', username: 'dispatcher01', password: '123456', name: '张调度', role: 'dispatcher' },
  { user_id: 'U002', username: 'driver01', password: '123456', name: '李司机', role: 'driver' },
  { user_id: 'U003', username: 'operator01', password: '123456', name: '王运营', role: 'operator' }
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (user_id, username, password, name, role)
  VALUES (?, ?, ?, ?, ?)
`);

defaultUsers.forEach(user => {
  const hashedPassword = bcrypt.hashSync(user.password, 10);
  insertUser.run(user.user_id, user.username, hashedPassword, user.name, user.role);
});

const defaultStations = [
  { station_id: 'S001', station_name: '起点站', latitude: 39.9042, longitude: 116.4074, order_index: 1 },
  { station_id: 'S002', station_name: '第一站', latitude: 39.9142, longitude: 116.4174, order_index: 2 },
  { station_id: 'S003', station_name: '第二站', latitude: 39.9242, longitude: 116.4274, order_index: 3 },
  { station_id: 'S004', station_name: '终点站', latitude: 39.9342, longitude: 116.4374, order_index: 4 }
];

const insertStation = db.prepare(`
  INSERT OR IGNORE INTO stations (station_id, station_name, latitude, longitude, order_index)
  VALUES (?, ?, ?, ?, ?)
`);

defaultStations.forEach(station => {
  insertStation.run(station.station_id, station.station_name, station.latitude, station.longitude, station.order_index);
});

const defaultRoutes = [
  {
    route_id: 'R001',
    route_name: '1路公交',
    route_code: 'BUS-001',
    start_station: '起点站',
    end_station: '终点站',
    station_order: 'S001,S002,S003,S004',
    distance_km: 12.5,
    estimated_duration_min: 45
  }
];

const insertRoute = db.prepare(`
  INSERT OR IGNORE INTO routes (route_id, route_name, route_code, start_station, end_station, station_order, distance_km, estimated_duration_min)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

defaultRoutes.forEach(route => {
  insertRoute.run(route.route_id, route.route_name, route.route_code, route.start_station, route.end_station, route.station_order, route.distance_km, route.estimated_duration_min);
});

const defaultVehicles = [
  { vehicle_id: 'V001', plate_number: '京A12345', vehicle_type: '大巴', capacity: 40 },
  { vehicle_id: 'V002', plate_number: '京B67890', vehicle_type: '中巴', capacity: 25 }
];

const insertVehicle = db.prepare(`
  INSERT OR IGNORE INTO vehicles (vehicle_id, plate_number, vehicle_type, capacity)
  VALUES (?, ?, ?, ?)
`);

defaultVehicles.forEach(vehicle => {
  insertVehicle.run(vehicle.vehicle_id, vehicle.plate_number, vehicle.vehicle_type, vehicle.capacity);
});

const defaultDrivers = [
  { driver_id: 'D001', user_id: 'U002', license_number: 'A1-123456', phone: '13800138001' }
];

const insertDriver = db.prepare(`
  INSERT OR IGNORE INTO drivers (driver_id, user_id, license_number, phone)
  VALUES (?, ?, ?, ?)
`);

defaultDrivers.forEach(driver => {
  insertDriver.run(driver.driver_id, driver.user_id, driver.license_number, driver.phone);
});

module.exports = db;
