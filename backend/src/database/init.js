const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const db = new Database(dbPath, { verbose: console.log });

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

const initTables = () => {
  const tables = {
    users: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
    navigation_orders: `
      CREATE TABLE IF NOT EXISTS navigation_orders (
        id TEXT PRIMARY KEY,
        order_no TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING_LOCATION',
        origin_lat REAL,
        origin_lng REAL,
        origin_address TEXT,
        dest_lat REAL,
        dest_lng REAL,
        dest_address TEXT,
        current_lat REAL,
        current_lng REAL,
        expected_arrival_time DATETIME,
        actual_arrival_time DATETIME,
        route_distance INTEGER,
        route_duration INTEGER,
        eta_seconds INTEGER,
        assigned_driver_id TEXT,
        po_id TEXT,
        priority INTEGER DEFAULT 0,
        attachments TEXT,
        remark TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (assigned_driver_id) REFERENCES users (id)
      )
    `,
    order_details: `
      CREATE TABLE IF NOT EXISTS order_details (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        seq INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        action_type TEXT NOT NULL,
        operator_id TEXT,
        operator_role TEXT,
        action_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        remark TEXT,
        attachments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES navigation_orders (id),
        FOREIGN KEY (operator_id) REFERENCES users (id)
      )
    `,
    routes: `
      CREATE TABLE IF NOT EXISTS routes (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        route_type TEXT NOT NULL,
        waypoints TEXT,
        distance INTEGER,
        duration INTEGER,
        polyline TEXT,
        is_selected INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES navigation_orders (id)
      )
    `,
    tracks: `
      CREATE TABLE IF NOT EXISTS tracks (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        accuracy REAL,
        speed REAL,
        bearing REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_drift INTEGER DEFAULT 0,
        source TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES navigation_orders (id)
      )
    `,
    pois: `
      CREATE TABLE IF NOT EXISTS pois (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        address TEXT,
        category TEXT,
        radius INTEGER DEFAULT 100,
        is_locked INTEGER DEFAULT 0,
        lock_order_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
    geofences: `
      CREATE TABLE IF NOT EXISTS geofences (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        radius INTEGER NOT NULL,
        polygon TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
    messages: `
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        message_type TEXT NOT NULL,
        content TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        read_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES navigation_orders (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `,
    operation_logs: `
      CREATE TABLE IF NOT EXISTS operation_logs (
        id TEXT PRIMARY KEY,
        order_id TEXT,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        detail TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES navigation_orders (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `,
    time_axis: `
      CREATE TABLE IF NOT EXISTS time_axis (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        operator_id TEXT,
        operator_name TEXT,
        operator_role TEXT,
        action_type TEXT NOT NULL,
        action_name TEXT NOT NULL,
        status_before TEXT,
        status_after TEXT,
        remark TEXT,
        attachments TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES navigation_orders (id)
      )
    `,
    exception_queue: `
      CREATE TABLE IF NOT EXISTS exception_queue (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        exception_type TEXT NOT NULL,
        exception_message TEXT,
        original_data TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retry INTEGER DEFAULT 3,
        status TEXT DEFAULT 'PENDING',
        next_retry_at DATETIME,
        resolved_at DATETIME,
        resolved_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES navigation_orders (id)
      )
    `,
  };

  for (const [name, sql] of Object.entries(tables)) {
    db.exec(sql);
  }

  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_orders_status ON navigation_orders(status)',
    'CREATE INDEX IF NOT EXISTS idx_orders_order_no ON navigation_orders(order_no)',
    'CREATE INDEX IF NOT EXISTS idx_tracks_order_id ON tracks(order_id)',
    'CREATE INDEX IF NOT EXISTS idx_messages_user_read ON messages(user_id, is_read)',
    'CREATE INDEX IF NOT EXISTS idx_exception_status ON exception_queue(status)',
    'CREATE INDEX IF NOT EXISTS idx_time_axis_order ON time_axis(order_id, created_at)',
  ];

  for (const indexSql of indexes) {
    db.exec(indexSql);
  }
};

const initSeeds = () => {
  const users = [
    { id: uuidv4(), username: 'admin', password: 'admin123', role: 'ADMIN', name: '系统管理员', phone: '13800138000' },
    { id: uuidv4(), username: 'user1', password: 'user123', role: 'USER', name: '张三', phone: '13800138001' },
    { id: uuidv4(), username: 'driver1', password: 'driver123', role: 'DRIVER', name: '李司机', phone: '13800138002' },
    { id: uuidv4(), username: 'dispatcher1', password: 'dispatcher123', role: 'DISPATCHER', name: '王调度', phone: '13800138003' },
    { id: uuidv4(), username: 'operator1', password: 'operator123', role: 'OPERATOR', name: '赵运营', phone: '13800138004' },
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, username, password, role, name, phone, created_at, updated_at)
    VALUES (@id, @username, @password, @role, @name, @phone, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  for (const user of users) {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    insertUser.run({ ...user, password: hashedPassword });
  }

  const pois = [
    { id: uuidv4(), name: '北京站', lat: 39.9042, lng: 116.4074, address: '北京市东城区毛家湾胡同甲13号', category: '交通枢纽', radius: 200 },
    { id: uuidv4(), name: '北京西站', lat: 39.8948, lng: 116.3226, address: '北京市丰台区莲花池东路118号', category: '交通枢纽', radius: 200 },
    { id: uuidv4(), name: '天安门广场', lat: 39.9055, lng: 116.3976, address: '北京市东城区天安门广场', category: '景点', radius: 300 },
    { id: uuidv4(), name: '中关村', lat: 39.9834, lng: 116.3169, address: '北京市海淀区中关村大街', category: '商业区', radius: 500 },
    { id: uuidv4(), name: '望京SOHO', lat: 40.0029, lng: 116.4704, address: '北京市朝阳区望京街道望京SOHO', category: '商业区', radius: 200 },
  ];

  const insertPOI = db.prepare(`
    INSERT OR IGNORE INTO pois (id, name, lat, lng, address, category, radius, is_locked, lock_order_id, created_at, updated_at)
    VALUES (@id, @name, @lat, @lng, @address, @category, @radius, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  for (const poi of pois) {
    insertPOI.run(poi);
  }
};

initTables();
initSeeds();

module.exports = db;
