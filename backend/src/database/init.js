const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'invigilator', 'student')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    duration INTEGER NOT NULL,
    max_screen_switches INTEGER DEFAULT 5,
    require_camera BOOLEAN DEFAULT 1,
    allow_late_minutes INTEGER DEFAULT 0,
    allowed_devices TEXT DEFAULT 'desktop',
    question_bank TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'ended')),
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS exam_students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER REFERENCES exams(id),
    student_id INTEGER REFERENCES users(id),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'in_progress', 'submitted', 'absent')),
    identity_verified BOOLEAN DEFAULT 0,
    device_checked BOOLEAN DEFAULT 0,
    promise_accepted BOOLEAN DEFAULT 0,
    entered_at DATETIME,
    submitted_at DATETIME,
    score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, student_id)
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER REFERENCES exams(id),
    type TEXT NOT NULL CHECK(type IN ('single', 'multiple', 'essay')),
    content TEXT NOT NULL,
    options TEXT,
    correct_answer TEXT,
    score INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_student_id INTEGER REFERENCES exam_students(id),
    question_id INTEGER REFERENCES questions(id),
    answer TEXT,
    is_correct BOOLEAN,
    score INTEGER,
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_student_id, question_id)
  );

  CREATE TABLE IF NOT EXISTS anomalies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_student_id INTEGER REFERENCES exam_students(id),
    type TEXT NOT NULL CHECK(type IN (
      'screen_switch', 'page_leave', 'network_disconnect',
      'abnormal_submit', 'suspicious_behavior', 'camera_failure',
      'late_entry', 'multiple_login'
    )),
    description TEXT,
    screenshot_path TEXT,
    risk_score INTEGER DEFAULT 0,
    handled BOOLEAN DEFAULT 0,
    handled_by INTEGER REFERENCES users(id),
    handle_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_student_id INTEGER REFERENCES exam_students(id),
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

const insertAdmin = db.prepare(`
  INSERT OR IGNORE INTO users (username, password, name, role)
  VALUES (?, ?, ?, ?)
`);

insertAdmin.run('admin', bcrypt.hashSync('admin123', salt), '系统管理员', 'admin');
insertAdmin.run('invigilator1', bcrypt.hashSync('inv123', salt), '张老师', 'invigilator');
insertAdmin.run('student1', bcrypt.hashSync('stu123', salt), '张三', 'student');
insertAdmin.run('student2', bcrypt.hashSync('stu123', salt), '李四', 'student');

console.log('Database initialized successfully');
db.close();
