const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_number TEXT UNIQUE NOT NULL,
      client_name TEXT NOT NULL,
      client_phone TEXT,
      respondent TEXT,
      dispute_type TEXT NOT NULL,
      claim_amount REAL DEFAULT 0,
      employment_relation TEXT,
      start_date TEXT,
      end_date TEXT,
      dispute_date TEXT,
      arbitration_deadline TEXT,
      lawyer_id INTEGER,
      lawyer_name TEXT,
      status TEXT DEFAULT 'pending',
      description TEXT,
      risk_warning TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS evidences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      claim_purpose TEXT,
      proof_purpose TEXT,
      file_path TEXT,
      uploaded_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id)
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      title TEXT NOT NULL,
      content TEXT,
      status TEXT DEFAULT 'draft',
      reviewer_id INTEGER,
      reviewer_name TEXT,
      reviewed_at TEXT,
      review_comment TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id)
    );

    CREATE TABLE IF NOT EXISTS hearings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      scheduled_date TEXT,
      scheduled_time TEXT,
      location TEXT,
      attendees TEXT,
      mediation_plan TEXT,
      ruling_result TEXT,
      ruling_date TEXT,
      execution_tasks TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS case_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      description TEXT,
      operator TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const insertUser = db.prepare('INSERT INTO users (username, name, role) VALUES (?, ?, ?)');
    insertUser.run('admin', '系统管理员', 'admin');
    insertUser.run('lawyer1', '张律师', 'lawyer');
    insertUser.run('lawyer2', '李律师', 'lawyer');
    insertUser.run('hr1', 'HR专员', 'hr');
    insertUser.run('staff1', '服务人员', 'staff');
  }
}

initDatabase();

module.exports = db;
