const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/app.sqlite');

const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  -- 用户表
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 主单表
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    plate_number TEXT NOT NULL,
    vehicle_type TEXT DEFAULT 'car',
    status TEXT NOT NULL DEFAULT 'pending_entry',
    current_handler INTEGER,
    entry_time DATETIME,
    exit_time DATETIME,
    parking_space_id INTEGER,
    monthly_card_id INTEGER,
    total_amount REAL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    version INTEGER DEFAULT 1
  );

  -- 明细表
  CREATE TABLE IF NOT EXISTS order_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    detail_type TEXT NOT NULL,
    description TEXT,
    amount REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    handler INTEGER,
    processed_at DATETIME,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  -- 车牌识别记录表
  CREATE TABLE IF NOT EXISTS license_plate_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    plate_number TEXT NOT NULL,
    recognition_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    image_path TEXT,
    confidence REAL DEFAULT 1,
    location_lat REAL,
    location_lng REAL,
    direction TEXT,
    gate_id TEXT,
    operator_id INTEGER,
    status TEXT DEFAULT 'pending',
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  -- 车位表
  CREATE TABLE IF NOT EXISTS parking_spaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    space_no TEXT UNIQUE NOT NULL,
    area TEXT,
    type TEXT DEFAULT 'standard',
    status TEXT DEFAULT 'available',
    current_order_id INTEGER,
    floor INTEGER DEFAULT 1,
    section TEXT,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 计费规则表
  CREATE TABLE IF NOT EXISTS billing_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name TEXT NOT NULL,
    vehicle_type TEXT DEFAULT 'car',
    free_minutes INTEGER DEFAULT 15,
    hourly_rate REAL DEFAULT 5,
    daily_max REAL DEFAULT 50,
    monthly_rate REAL DEFAULT 300,
    night_start_time TEXT DEFAULT '22:00',
    night_end_time TEXT DEFAULT '06:00',
    night_rate REAL DEFAULT 2,
    is_active INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 月卡表
  CREATE TABLE IF NOT EXISTS monthly_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_no TEXT UNIQUE NOT NULL,
    plate_number TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    owner_phone TEXT,
    card_type TEXT DEFAULT 'standard',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    amount REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    remaining_days INTEGER,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER
  );

  -- 支付记录表
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_no TEXT UNIQUE NOT NULL,
    order_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'wechat',
    status TEXT DEFAULT 'pending',
    transaction_id TEXT,
    paid_at DATETIME,
    operator_id INTEGER,
    remark TEXT,
    is_locked INTEGER DEFAULT 0,
    locked_at DATETIME,
    locked_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  -- 消息通知表
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_id INTEGER,
    message_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    status TEXT DEFAULT 'unread',
    is_todo INTEGER DEFAULT 0,
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  -- 操作日志表
  CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    remark TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 时间轴表
  CREATE TABLE IF NOT EXISTS timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    event_title TEXT NOT NULL,
    event_content TEXT,
    operator_id INTEGER,
    operator_name TEXT,
    status_from TEXT,
    status_to TEXT,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  -- 异常队列表
  CREATE TABLE IF NOT EXISTS exceptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    exception_type TEXT NOT NULL,
    severity TEXT DEFAULT 'normal',
    title TEXT NOT NULL,
    description TEXT,
    original_data TEXT,
    compensation_data TEXT,
    status TEXT DEFAULT 'pending',
    handler_id INTEGER,
    processed_at DATETIME,
    result TEXT,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  -- 报统计表
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_date DATE NOT NULL,
    report_type TEXT NOT NULL,
    total_orders INTEGER DEFAULT 0,
    total_amount REAL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    monthly_card_count INTEGER DEFAULT 0,
    exception_count INTEGER DEFAULT 0,
    avg_parking_duration INTEGER DEFAULT 0,
    peak_hour_orders INTEGER DEFAULT 0,
    data JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(report_date, report_type)
  );

  -- 轨迹记录表
  CREATE TABLE IF NOT EXISTS trajectories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    speed REAL,
    direction REAL,
    accuracy REAL,
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source TEXT DEFAULT 'gps',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );
`);

const initData = () => {
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('admin');
  if (adminExists.count === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, name, role, phone, email)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('admin', hashedPassword, '系统管理员', 'admin', '13800138000', 'admin@parking.com');
    insertUser.run('owner', hashedPassword, '车主用户', 'owner', '13800138001', 'owner@parking.com');
    insertUser.run('toll', hashedPassword, '收费员', 'toll', '13800138002', 'toll@parking.com');
    insertUser.run('operator', hashedPassword, '场地方', 'operator', '13800138003', 'operator@parking.com');
    insertUser.run('finance', hashedPassword, '财务', 'finance', '13800138004', 'finance@parking.com');
    insertUser.run('maintain', hashedPassword, '运维', 'maintain', '13800138005', 'maintain@parking.com');
  }

  const ruleExists = db.prepare('SELECT COUNT(*) as count FROM billing_rules').get();
  if (ruleExists.count === 0) {
    const insertRule = db.prepare(`
      INSERT INTO billing_rules (rule_name, vehicle_type, free_minutes, hourly_rate, daily_max, monthly_rate)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertRule.run('小型车标准计费', 'car', 15, 5, 50, 300);
    insertRule.run('大型车标准计费', 'truck', 15, 8, 80, 500);
  }

  const spaceExists = db.prepare('SELECT COUNT(*) as count FROM parking_spaces').get();
  if (spaceExists.count === 0) {
    const insertSpace = db.prepare(`
      INSERT INTO parking_spaces (space_no, area, type, floor, section)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (let i = 1; i <= 50; i++) {
      const no = String(i).padStart(3, '0');
      insertSpace.run(`A-${no}`, 'A区', 'standard', 1, 'A');
    }
    for (let i = 1; i <= 30; i++) {
      const no = String(i).padStart(3, '0');
      insertSpace.run(`B-${no}`, 'B区', 'standard', 1, 'B');
    }
  }
};

initData();

module.exports = db;