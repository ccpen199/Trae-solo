const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dbDir, 'app.sqlite');
const db = new sqlite3.Database(dbPath);

const initSchema = () => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS main_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_no TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING_LOCATION',
        user_id TEXT NOT NULL,
        user_role TEXT NOT NULL,
        origin_lat REAL,
        origin_lng REAL,
        origin_address TEXT,
        dest_lat REAL,
        dest_lng REAL,
        dest_address TEXT,
        expected_arrival_time DATETIME,
        current_responsible_role TEXT,
        current_responsible_id TEXT,
        eta_seconds INTEGER,
        distance_meters INTEGER,
        route_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_deleted INTEGER DEFAULT 0
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS order_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_no TEXT NOT NULL,
        detail_no TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING_LOCATION',
        poi_type TEXT,
        poi_name TEXT,
        poi_lat REAL,
        poi_lng REAL,
        poi_address TEXT,
        sequence INTEGER,
        arrival_time_actual DATETIME,
        departure_time_actual DATETIME,
        eta_seconds INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_no) REFERENCES main_orders(order_no)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS pois (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        poi_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        address TEXT,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        category TEXT,
        is_locked INTEGER DEFAULT 0,
        locked_by_order TEXT,
        locked_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS trajectories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trajectory_id TEXT UNIQUE NOT NULL,
        order_no TEXT NOT NULL,
        driver_id TEXT,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        speed_kmh REAL,
        heading_deg REAL,
        accuracy_meters REAL,
        timestamp DATETIME NOT NULL,
        sequence INTEGER,
        is_abnormal INTEGER DEFAULT 0,
        abnormal_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_no) REFERENCES main_orders(order_no)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT UNIQUE NOT NULL,
        order_no TEXT NOT NULL,
        target_role TEXT NOT NULL,
        target_id TEXT NOT NULL,
        message_type TEXT NOT NULL,
        title TEXT,
        content TEXT,
        is_read INTEGER DEFAULT 0,
        read_at DATETIME,
        action_required TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_no) REFERENCES main_orders(order_no)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS operation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_id TEXT UNIQUE NOT NULL,
        order_no TEXT NOT NULL,
        operator_role TEXT NOT NULL,
        operator_id TEXT NOT NULL,
        action TEXT NOT NULL,
        from_status TEXT,
        to_status TEXT,
        comment TEXT,
        attachments_json TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_no) REFERENCES main_orders(order_no)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS timeline_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT UNIQUE NOT NULL,
        order_no TEXT NOT NULL,
        event_type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        actor_role TEXT,
        actor_id TEXT,
        attachments_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_no) REFERENCES main_orders(order_no)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS exception_queues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exception_id TEXT UNIQUE NOT NULL,
        order_no TEXT NOT NULL,
        exception_type TEXT NOT NULL,
        severity TEXT DEFAULT 'MEDIUM',
        status TEXT DEFAULT 'PENDING',
        original_trajectory_json TEXT,
        compensation_data_json TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        assigned_role TEXT,
        assigned_id TEXT,
        resolved_at DATETIME,
        resolution_comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_no) REFERENCES main_orders(order_no)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS route_selections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        route_id TEXT UNIQUE NOT NULL,
        order_no TEXT NOT NULL,
        route_type TEXT NOT NULL,
        distance_meters INTEGER,
        duration_seconds INTEGER,
        traffic_level TEXT,
        route_summary TEXT,
        is_selected INTEGER DEFAULT 0,
        selected_by_role TEXT,
        selected_by_id TEXT,
        selected_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_no) REFERENCES main_orders(order_no)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        attachment_id TEXT UNIQUE NOT NULL,
        order_no TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_type TEXT,
        file_size_bytes INTEGER,
        storage_path TEXT,
        uploaded_by_role TEXT,
        uploaded_by_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_no) REFERENCES main_orders(order_no)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        user_name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`CREATE INDEX IF NOT EXISTS idx_main_orders_status ON main_orders(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_main_orders_order_no ON main_orders(order_no)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_messages_target ON messages(target_role, target_id, is_read)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_trajectories_order ON trajectories(order_no, timestamp)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_exception_queues_status ON exception_queues(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_operation_logs_order ON operation_logs(order_no, created_at)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_timeline_events_order ON timeline_events(order_no, created_at)`);

    const users = [
      { user_id: 'U001', user_name: '张三(用户)', role: 'USER', phone: '13800138001' },
      { user_id: 'U002', user_name: '李四(司机)', role: 'DRIVER', phone: '13800138002' },
      { user_id: 'U003', user_name: '王五(调度员)', role: 'DISPATCHER', phone: '13800138003' },
      { user_id: 'U004', user_name: '赵六(地图服务商)', role: 'MAP_PROVIDER', phone: '13800138004' },
      { user_id: 'U005', user_name: '钱七(运营)', role: 'OPERATOR', phone: '13800138005' }
    ];

    const insertUser = db.prepare('INSERT OR IGNORE INTO users (user_id, user_name, role, phone) VALUES (?, ?, ?, ?)');
    users.forEach(user => {
      insertUser.run(user.user_id, user.user_name, user.role, user.phone);
    });
    insertUser.finalize();

    const pois = [
      { poi_id: 'POI001', name: '北京西站', address: '北京市丰台区莲花池东路', lat: 39.8947, lng: 116.3225, category: '交通枢纽' },
      { poi_id: 'POI002', name: '天安门广场', address: '北京市东城区长安街', lat: 39.9055, lng: 116.3976, category: '景点' },
      { poi_id: 'POI003', name: '中关村软件园', address: '北京市海淀区西北旺东路', lat: 40.0499, lng: 116.2851, category: '科技园' },
      { poi_id: 'POI004', name: '首都国际机场T3', address: '北京市顺义区机场西路', lat: 40.0799, lng: 116.6031, category: '交通枢纽' },
      { poi_id: 'POI005', name: '国贸CBD', address: '北京市朝阳区建国门外大街', lat: 39.9087, lng: 116.4605, category: '商业区' }
    ];

    const insertPoi = db.prepare('INSERT OR IGNORE INTO pois (poi_id, name, address, lat, lng, category) VALUES (?, ?, ?, ?, ?, ?)');
    pois.forEach(poi => {
      insertPoi.run(poi.poi_id, poi.name, poi.address, poi.lat, poi.lng, poi.category);
    });
    insertPoi.finalize();

    console.log('数据库初始化完成');
  });
};

module.exports = {
  db,
  initSchema
};
