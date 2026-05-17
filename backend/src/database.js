const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath, { verbose: console.log });

const initDatabase = () => {
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
    name TEXT,
    phone TEXT UNIQUE,
    avatar TEXT,
    id_card TEXT,
    teacher_cert TEXT,
    id_card_verified INTEGER DEFAULT 0,
    teacher_cert_verified INTEGER DEFAULT 0,
    is_online INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS student_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    grade TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS teacher_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    subjects TEXT,
    experience INTEGER,
    introduction TEXT,
    hourly_rate REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS tutoring_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    name TEXT,
    grade TEXT,
    phone TEXT,
    location TEXT,
    latitude REAL,
    longitude REAL,
    time TEXT,
    subject TEXT,
    student_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'completed', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER UNIQUE,
    student_id INTEGER,
    teacher_id INTEGER,
    status TEXT DEFAULT 'ongoing' CHECK(status IN ('ongoing', 'completed', 'cancelled')),
    start_time DATETIME,
    end_time DATETIME,
    total_amount REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES tutoring_requests(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS class_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    start_time DATETIME,
    end_time DATETIME,
    duration INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER UNIQUE,
    student_id INTEGER,
    teacher_id INTEGER,
    rating INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    sender_id INTEGER,
    content TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS address_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    address TEXT,
    latitude REAL,
    longitude REAL,
    used_count INTEGER DEFAULT 1,
    last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_requests_status ON tutoring_requests(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_student ON orders(student_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_teacher ON orders(teacher_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_order ON messages(order_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_address_user ON address_history(user_id)`);
};

const runQuery = (sql, params = []) => {
  const stmt = db.prepare(sql);
  const result = stmt.run(params);
  return { 
    lastID: result.lastInsertRowid, 
    changes: result.changes 
  };
};

const getQuery = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.get(params);
};

const allQuery = (sql, params = []) => {
  const stmt = db.prepare(sql);
  return stmt.all(params);
};

module.exports = {
  initDatabase,
  runQuery,
  getQuery,
  allQuery,
  db
};
