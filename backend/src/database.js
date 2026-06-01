const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', '..', 'data', 'app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_number TEXT UNIQUE NOT NULL,
      conflict_type TEXT NOT NULL,
      incident_location TEXT NOT NULL,
      incident_time TEXT,
      appeal_content TEXT NOT NULL,
      urgency_level TEXT DEFAULT 'normal',
      is_sensitive INTEGER DEFAULT 0,
      status TEXT DEFAULT 'registered',
      risk_level TEXT DEFAULT 'low',
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      role TEXT,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS evidences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT,
      upload_time TEXT DEFAULT CURRENT_TIMESTAMP,
      stage TEXT DEFAULT 'registration',
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS investigation_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      visit_time TEXT NOT NULL,
      investigator TEXT NOT NULL,
      visit_location TEXT,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS related_persons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      relation TEXT,
      description TEXT,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS risk_assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      assessor TEXT,
      risk_level TEXT NOT NULL,
      assessment_content TEXT,
      escalation_required INTEGER DEFAULT 0,
      assessment_time TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mediation_meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      meeting_time TEXT NOT NULL,
      meeting_location TEXT,
      mediator TEXT NOT NULL,
      participants TEXT,
      dispute_focus TEXT,
      mediation_plan TEXT,
      result TEXT,
      next_step TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mediation_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      upload_time TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meeting_id) REFERENCES mediation_meetings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agreements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      agreement_number TEXT UNIQUE,
      sign_date TEXT,
      content TEXT NOT NULL,
      performance_nodes TEXT,
      signed_file_path TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS follow_ups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      follow_up_time TEXT NOT NULL,
      follow_up_person TEXT NOT NULL,
      result TEXT NOT NULL,
      has_dispute_again INTEGER DEFAULT 0,
      dispute_again_description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS performance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agreement_id INTEGER NOT NULL,
      node_name TEXT NOT NULL,
      planned_date TEXT,
      actual_date TEXT,
      status TEXT DEFAULT 'pending',
      remark TEXT,
      FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, name, role, phone)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertUser.run('admin', 'admin123', '系统管理员', 'admin', '13800138000');
    insertUser.run('mediator', 'mediator123', '张调解员', 'mediator', '13800138001');
    insertUser.run('grid', 'grid123', '李网格员', 'grid', '13800138002');
  }
}

initDatabase();

module.exports = db;
