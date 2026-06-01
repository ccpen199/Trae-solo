const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const projectDir = path.resolve(__dirname, '../..');
const dataDir = path.join(projectDir, 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const configuredPath = process.env.DB_PATH || './data/app.sqlite';
const dbPath = path.resolve(projectDir, configuredPath);
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    age INTEGER DEFAULT 0,
    gender TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS escorts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL,
    hospitals TEXT DEFAULT '',
    qualifications TEXT DEFAULT '',
    rating REAL DEFAULT 5.0,
    rating_count INTEGER DEFAULT 0,
    available_times TEXT DEFAULT '',
    forbidden_tags TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE,
    patient_id INTEGER NOT NULL,
    hospital TEXT NOT NULL,
    department TEXT NOT NULL,
    visit_date TEXT NOT NULL,
    visit_time TEXT NOT NULL,
    condition_summary TEXT DEFAULT '',
    escort_items TEXT DEFAULT '',
    special_needs TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    escort_id INTEGER,
    service_fee REAL DEFAULT 0,
    extra_fee REAL DEFAULT 0,
    total_fee REAL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (escort_id) REFERENCES escorts(id)
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    escort_id INTEGER NOT NULL,
    assigned_by TEXT DEFAULT '',
    reason TEXT DEFAULT '',
    assignment_type TEXT DEFAULT 'auto',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (escort_id) REFERENCES escorts(id)
  );

  CREATE TABLE IF NOT EXISTS service_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    location TEXT DEFAULT '',
    remark TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    created_by INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS settlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    escort_share REAL NOT NULL,
    platform_fee REAL NOT NULL,
    refund_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    complaint TEXT DEFAULT '',
    evidence TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    handle_result TEXT DEFAULT '',
    handler TEXT DEFAULT '',
    handle_time TEXT DEFAULT '',
    create_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS refunds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    reason TEXT NOT NULL,
    remark TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'submitted',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const escortCount = db.prepare('SELECT COUNT(*) AS count FROM escorts').get().count;

if (escortCount === 0) {
  const insertEscort = db.prepare(`
    INSERT INTO escorts (name, phone, city, hospitals, qualifications, rating, available_times, forbidden_tags, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  db.exec('BEGIN');
  try {
    insertEscort.run('张陪诊', '13800138001', '北京', '北京协和医院,301医院', '护士资格证,3年经验', 4.8, '周一至周五 9:00-18:00', '', 'active');
    insertEscort.run('李陪诊', '13800138002', '北京', '北京协和医院,中日友好医院', '护士资格证,5年经验', 4.9, '周一至周日 8:00-20:00', '', 'active');
    insertEscort.run('王陪诊', '13800138003', '上海', '上海瑞金医院,华山医院', '护士资格证,2年经验', 4.5, '周二至周六 9:00-17:00', '', 'active');
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Seed error:', err);
  }
}

module.exports = { db, projectDir };
