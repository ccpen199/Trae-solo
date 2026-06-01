const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbPath = path.join(__dirname, '../../', process.env.DATABASE_PATH || './data/app.sqlite');
const dbDir = path.dirname(dbPath);

require('fs').mkdirSync(dbDir, { recursive: true });

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`PRAGMA foreign_keys = ON`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'assistant')),
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    submit_format TEXT NOT NULL,
    deadline DATETIME NOT NULL,
    similarity_threshold REAL NOT NULL DEFAULT 80,
    allow_resubmit INTEGER NOT NULL DEFAULT 0,
    plagiarism_scope TEXT NOT NULL DEFAULT 'all',
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    parsed_content TEXT,
    submit_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    status TEXT NOT NULL DEFAULT 'submitted',
    FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS plagiarism_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL,
    compared_submission_id INTEGER NOT NULL,
    similarity REAL NOT NULL,
    similar_segments TEXT,
    matched_rules TEXT,
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_valid_citation INTEGER DEFAULT 0,
    marked_by INTEGER,
    FOREIGN KEY (submission_id) REFERENCES submissions(id),
    FOREIGN KEY (compared_submission_id) REFERENCES submissions(id),
    FOREIGN KEY (marked_by) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS appeals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    teacher_comment TEXT,
    reviewed_by INTEGER,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    teacher_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS course_enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(course_id, user_id)
  )`);

  const stmt = db.prepare('INSERT OR IGNORE INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?, ?)');
  
  const salt = bcrypt.genSaltSync(10);
  stmt.run('teacher1', bcrypt.hashSync('123456', salt), '张老师', 'teacher', 'teacher1@example.com');
  stmt.run('assistant1', bcrypt.hashSync('123456', salt), '李助教', 'assistant', 'assistant1@example.com');
  stmt.run('student1', bcrypt.hashSync('123456', salt), '学生甲', 'student', 'student1@example.com');
  stmt.run('student2', bcrypt.hashSync('123456', salt), '学生乙', 'student', 'student2@example.com');
  stmt.finalize();

  console.log('Database initialized successfully!');
  console.log('Default users created:');
  console.log('  - Teacher: teacher1 / 123456');
  console.log('  - Assistant: assistant1 / 123456');
  console.log('  - Student1: student1 / 123456');
  console.log('  - Student2: student2 / 123456');
});

db.close();
