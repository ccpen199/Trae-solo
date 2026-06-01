const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_no TEXT UNIQUE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT NOT NULL,
      involved_persons TEXT,
      urgency TEXT NOT NULL DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'pending',
      reporter_name TEXT,
      reporter_phone TEXT,
      is_anonymous INTEGER DEFAULT 0,
      images TEXT,
      assigned_department TEXT,
      assigned_to INTEGER,
      deadline DATETIME,
      parent_incident_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (parent_incident_id) REFERENCES incidents(id)
    );

    CREATE TABLE IF NOT EXISTS incident_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      record_type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incident_id) REFERENCES incidents(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS incident_collaborators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incident_id) REFERENCES incidents(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(incident_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS parent_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      student_name TEXT NOT NULL,
      parent_name TEXT,
      parent_phone TEXT,
      notification_content TEXT,
      notified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notified_by INTEGER,
      FOREIGN KEY (incident_id) REFERENCES incidents(id),
      FOREIGN KEY (notified_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS medical_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      patient_name TEXT,
      symptoms TEXT,
      diagnosis TEXT,
      treatment TEXT,
      medicines TEXT,
      notes TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incident_id) REFERENCES incidents(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      cause_analysis TEXT,
      corrective_actions TEXT,
      responsible_person TEXT,
      follow_up_tasks TEXT,
      conclusion TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incident_id) REFERENCES incidents(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      content TEXT,
      incident_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (incident_id) REFERENCES incidents(id)
    );
  `);

  const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const result = stmt.get();
  if (result.count === 0) {
    const insertUser = db.prepare('INSERT INTO users (username, password, name, role, department, phone) VALUES (?, ?, ?, ?, ?, ?)');
    
    const users = [
      ['admin', 'admin123', '系统管理员', 'admin', '信息中心', '13800000000'],
      ['student1', 'student123', '张三', 'student', '计算机学院', '13800000001'],
      ['teacher1', 'teacher123', '李老师', 'teacher', '计算机学院', '13800000002'],
      ['security1', 'security123', '王保安', 'security', '保卫处', '13800000003'],
      ['doctor1', 'doctor123', '赵医生', 'doctor', '校医院', '13800000004'],
      ['manager1', 'manager123', '孙主任', 'manager', '学生处', '13800000005']
    ];

    users.forEach(u => {
      const hashedPassword = bcrypt.hashSync(u[1], 10);
      insertUser.run(u[0], hashedPassword, u[2], u[3], u[4], u[5]);
    });
  }
}

module.exports = { db, initDatabase };