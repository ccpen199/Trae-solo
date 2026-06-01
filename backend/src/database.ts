import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const db = new Database(path.join(__dirname, '../', dbPath));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      real_name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      phone TEXT,
      security_level INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clue_no TEXT UNIQUE NOT NULL,
      source_channel TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      involved_persons TEXT,
      location TEXT,
      occur_time DATETIME,
      security_level INTEGER DEFAULT 1,
      category TEXT,
      status TEXT DEFAULT 'pending',
      attachments TEXT,
      creator_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS clue_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clue_id INTEGER NOT NULL,
      related_case TEXT,
      historical_clues TEXT,
      risk_tags TEXT,
      review_opinion TEXT,
      evidence TEXT,
      reviewer_id INTEGER,
      is_duplicate INTEGER DEFAULT 0,
      duplicate_clue_id INTEGER,
      reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clue_id) REFERENCES clues(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS dispatches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clue_id INTEGER NOT NULL,
      responsible_unit TEXT NOT NULL,
      deadline DATETIME NOT NULL,
      feedback_requirements TEXT,
      co_units TEXT,
      dispatcher_id INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clue_id) REFERENCES clues(id),
      FOREIGN KEY (dispatcher_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dispatch_id INTEGER NOT NULL,
      check_result TEXT,
      measures_taken TEXT,
      evidence_attachments TEXT,
      closing_opinion TEXT,
      is_returned INTEGER DEFAULT 0,
      return_reason TEXT,
      feedbacker_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dispatch_id) REFERENCES dispatches(id),
      FOREIGN KEY (feedbacker_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      details TEXT,
      ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS test_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_key TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL,
      result TEXT,
      user_id INTEGER,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  if (userCount.count === 0) {
    const bcrypt = require('bcryptjs');
    const defaultUsers = [
      { username: 'admin', password: 'admin123', real_name: '系统管理员', role: 'admin', security_level: 3 },
      { username: 'officer1', password: '123456', real_name: '张警官', role: 'officer', security_level: 2 },
      { username: 'officer2', password: '123456', real_name: '李警官', role: 'officer', security_level: 1 },
      { username: 'leader', password: '123456', real_name: '王领导', role: 'leader', security_level: 3 }
    ];

    const insertUser = db.prepare('INSERT INTO users (username, password, real_name, role, security_level) VALUES (?, ?, ?, ?, ?)');
    defaultUsers.forEach(user => {
      const hash = bcrypt.hashSync(user.password, 10);
      insertUser.run(user.username, hash, user.real_name, user.role, user.security_level);
    });
  }

  return db;
}

export default db;
