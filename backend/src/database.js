const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite';
const db = new Database(path.join(__dirname, '..', dbPath), { verbose: console.log });

const initDatabase = () => {
  try {
    db.pragma('foreign_keys = ON');

    db.exec(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      gender TEXT,
      province TEXT,
      age INTEGER,
      alipay_account TEXT,
      alipay_name TEXT,
      balance REAL DEFAULT 0,
      score REAL DEFAULT 100,
      total_answers INTEGER DEFAULT 0,
      daily_answers INTEGER DEFAULT 0,
      last_answer_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS surveys (
      id TEXT PRIMARY KEY,
      publisher_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      target_gender TEXT,
      target_province TEXT,
      target_age_min INTEGER,
      target_age_max INTEGER,
      question_count INTEGER NOT NULL,
      total_surveys INTEGER NOT NULL,
      completed_surveys INTEGER DEFAULT 0,
      reward_per_question REAL NOT NULL,
      total_reward REAL NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (publisher_id) REFERENCES users(id)
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      survey_id TEXT NOT NULL,
      question_text TEXT NOT NULL,
      options TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (survey_id) REFERENCES surveys(id)
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS user_surveys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      survey_id TEXT NOT NULL,
      status TEXT DEFAULT 'in_progress',
      start_time TEXT NOT NULL,
      last_answer_time TEXT,
      current_question INTEGER DEFAULT 0,
      answers TEXT,
      end_time TEXT,
      reward REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (survey_id) REFERENCES surveys(id),
      UNIQUE(user_id, survey_id)
    )`);

    db.exec(`CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.exec(`CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_user_surveys_user ON user_surveys(user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_user_surveys_survey ON user_surveys(survey_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)`);

    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

const runQuery = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return Promise.resolve({ lastID: result.lastInsertRowid, changes: result.changes });
  } catch (error) {
    return Promise.reject(error);
  }
};

const getOne = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    const row = stmt.get(...params);
    return Promise.resolve(row);
  } catch (error) {
    return Promise.reject(error);
  }
};

const getAll = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    return Promise.resolve(rows);
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports = {
  initDatabase,
  runQuery,
  getOne,
  getAll,
  db
};
