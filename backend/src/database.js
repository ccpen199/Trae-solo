const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_no TEXT UNIQUE NOT NULL,
      channel TEXT NOT NULL,
      product TEXT NOT NULL,
      account_manager TEXT NOT NULL,
      applicant_name TEXT NOT NULL,
      applicant_phone TEXT NOT NULL,
      id_card TEXT,
      bank_card TEXT,
      contact_info TEXT,
      business_proof TEXT,
      application_amount REAL NOT NULL,
      approved_amount REAL,
      status TEXT NOT NULL DEFAULT 'pending',
      data_completeness INTEGER DEFAULT 0,
      version INTEGER DEFAULT 1,
      risk_tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS authorization_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      authorization_time DATETIME,
      authorization_scope TEXT,
      query_result TEXT,
      failure_reason TEXT,
      query_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT NOT NULL,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS screening_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      rule_name TEXT NOT NULL,
      rule_result TEXT NOT NULL,
      risk_level TEXT,
      handling_opinion TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS supplement_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      document_type TEXT NOT NULL,
      supplement_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      supplemented_by TEXT NOT NULL,
      old_data TEXT,
      new_data TEXT,
      notes TEXT,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS review_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      transfer_type TEXT NOT NULL,
      from_user TEXT NOT NULL,
      to_user TEXT NOT NULL,
      transfer_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      application_version INTEGER NOT NULL,
      data_snapshot TEXT,
      notes TEXT,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS todo_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      task_type TEXT NOT NULL,
      assignee TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const insertUser = db.prepare('INSERT INTO users (username, name, role) VALUES (?, ?, ?)');
    insertUser.run('admin', '系统管理员', 'admin');
    insertUser.run('manager1', '张经理', 'manager');
    insertUser.run('officer1', '李专员', 'officer');
    insertUser.run('reviewer1', '王风控', 'reviewer');
    insertUser.run('director1', '赵主管', 'director');
  }
}

module.exports = { db, initDatabase };
