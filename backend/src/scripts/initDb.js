const db = require('../db');
const bcrypt = require('bcryptjs');

const initDatabase = () => {
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'consultant', 'teacher', 'admin')),
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS student_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id),
      gpa REAL,
      gre INTEGER,
      gmat INTEGER,
      toefl INTEGER,
      ielts REAL,
      background_activities TEXT,
      target_countries TEXT,
      budget REAL,
      application_season TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES student_profiles(id),
      type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      uploaded_by INTEGER REFERENCES users(id),
      access_roles TEXT DEFAULT 'admin,consultant,teacher',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS school_schemes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES student_profiles(id),
      school_name TEXT NOT NULL,
      major TEXT NOT NULL,
      application_round TEXT,
      deadline DATETIME,
      difficulty_rating TEXT CHECK(difficulty_rating IN ('safety', 'target', 'reach')),
      consultant_suggestion TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'confirmed', 'locked')),
      confirmed_by INTEGER REFERENCES users(id),
      confirmed_at DATETIME,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS material_checklists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheme_id INTEGER REFERENCES school_schemes(id),
      item_name TEXT NOT NULL,
      required BOOLEAN DEFAULT 1,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'submitted', 'approved')),
      submitted_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS essays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheme_id INTEGER REFERENCES school_schemes(id),
      title TEXT NOT NULL,
      word_limit INTEGER,
      current_version INTEGER DEFAULT 1,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'reviewing', 'revised', 'confirmed', 'submitted')),
      confirmed_by INTEGER REFERENCES users(id),
      confirmed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS essay_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      essay_id INTEGER REFERENCES essays(id),
      version_number INTEGER NOT NULL,
      content TEXT,
      file_path TEXT,
      comments TEXT,
      submitted_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheme_id INTEGER REFERENCES school_schemes(id),
      account TEXT,
      submitted_at DATETIME,
      application_fee REAL,
      supplement_items TEXT,
      interview_date DATETIME,
      interview_result TEXT,
      admission_result TEXT CHECK(admission_result IN ('pending', 'admitted', 'rejected', 'waitlisted', 'deferred')),
      admission_date DATETIME,
      scholarship_amount REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      related_type TEXT NOT NULL,
      related_id INTEGER NOT NULL,
      reminder_date DATETIME NOT NULL,
      message TEXT NOT NULL,
      assignee_id INTEGER REFERENCES users(id),
      is_sent BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const password = bcrypt.hashSync('admin123', 10);
  
  const adminUser = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminUser) {
    db.prepare('INSERT INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?, ?)')
      .run('admin', password, '系统管理员', 'admin', 'admin@example.com');
  }

  const consultantUser = db.prepare('SELECT id FROM users WHERE username = ?').get('consultant1');
  if (!consultantUser) {
    db.prepare('INSERT INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?, ?)')
      .run('consultant1', password, '张顾问', 'consultant', 'consultant1@example.com');
  }

  const teacherUser = db.prepare('SELECT id FROM users WHERE username = ?').get('teacher1');
  if (!teacherUser) {
    db.prepare('INSERT INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?, ?)')
      .run('teacher1', password, '李老师', 'teacher', 'teacher1@example.com');
  }

  const studentUser = db.prepare('SELECT id FROM users WHERE username = ?').get('student1');
  if (!studentUser) {
    const insertStudentUser = db.prepare('INSERT INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?, ?)');
    const result = insertStudentUser.run('student1', password, '王同学', 'student', 'student1@example.com');
    
    db.prepare('INSERT INTO student_profiles (user_id, gpa, toefl, target_countries, application_season, budget) VALUES (?, ?, ?, ?, ?, ?)')
      .run(result.lastInsertRowid, 3.8, 105, '美国,英国', '2025 Fall', 500000);
  }

  console.log('数据库初始化完成！');
  console.log('默认账号: admin / consultant1 / teacher1 / student1');
  console.log('默认密码: admin123');
};

initDatabase();
