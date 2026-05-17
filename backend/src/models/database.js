const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS verification_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  subject TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS class_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  user_id INTEGER,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'student',
  group_id INTEGER,
  tags TEXT,
  score INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS homeworks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  subject TEXT,
  type TEXT,
  knowledge_points TEXT,
  student_scope TEXT,
  status TEXT DEFAULT 'draft',
  publish_time DATETIME,
  deadline DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  FOREIGN KEY (class_id) REFERENCES classes(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS homework_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  homework_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  answer TEXT,
  order_num INTEGER DEFAULT 0,
  FOREIGN KEY (homework_id) REFERENCES homeworks(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS homework_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  homework_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  answers TEXT,
  correct_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  accuracy REAL DEFAULT 0,
  duration INTEGER,
  voice_comment TEXT,
  submitted_at DATETIME,
  viewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (homework_id) REFERENCES homeworks(id),
  FOREIGN KEY (student_id) REFERENCES class_members(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS class_notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS class_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  sender_id INTEGER,
  sender_name TEXT,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id)
)`);

module.exports = db;