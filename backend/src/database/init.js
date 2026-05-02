const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

const db = new Database(path.join(dbPath, 'app.sqlite'));
db.pragma('journal_mode = WAL');

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('lead_lawyer', 'assistant', 'client', 'finance')),
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_number TEXT UNIQUE,
      title TEXT NOT NULL,
      type TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'hearing', 'executing', 'closed', 'archived')),
      client_id INTEGER,
      lead_lawyer_id INTEGER,
      assistant_id INTEGER,
      description TEXT,
      court TEXT,
      case_value REAL DEFAULT 0,
      fee_amount REAL DEFAULT 0,
      cost_amount REAL DEFAULT 0,
      profit_amount REAL DEFAULT 0,
      hearing_date DATETIME,
      judgment_date DATETIME,
      closed_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES users(id),
      FOREIGN KEY (lead_lawyer_id) REFERENCES users(id),
      FOREIGN KEY (assistant_id) REFERENCES users(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS evidences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      uploaded_by INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT,
      file_path TEXT,
      file_name TEXT,
      file_size INTEGER,
      hash TEXT,
      blockchain_tx_id TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT,
      template_id TEXT,
      current_version INTEGER DEFAULT 1,
      is_draft INTEGER DEFAULT 1,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS document_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      content TEXT,
      edited_by INTEGER NOT NULL,
      diff_from_previous TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id),
      FOREIGN KEY (edited_by) REFERENCES users(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      amount REAL NOT NULL,
      category TEXT,
      description TEXT,
      recorded_by INTEGER NOT NULL,
      confirmed_at DATETIME,
      confirmed_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id),
      FOREIGN KEY (recorded_by) REFERENCES users(id),
      FOREIGN KEY (confirmed_by) REFERENCES users(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      event_date DATETIME,
      created_by INTEGER NOT NULL,
      reference_type TEXT,
      reference_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS communication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      type TEXT CHECK(type IN ('phone', 'email', 'meeting', 'other')),
      participants TEXT,
      content TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      reminder_type TEXT,
      title TEXT NOT NULL,
      description TEXT,
      reminder_date DATETIME NOT NULL,
      is_triggered INTEGER DEFAULT 0,
      triggered_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id)
    );
  `);

  const bcrypt = require('bcryptjs');
  const saltRounds = 10;

  const insertUser = (username, password, role, name) => {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (!existing) {
      const hash = bcrypt.hashSync(password, saltRounds);
      db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)').run(
        username, hash, role, name
      );
    }
  };

  insertUser('lawyer1', '123456', 'lead_lawyer', '张三律师');
  insertUser('assistant1', '123456', 'assistant', '李四助理');
  insertUser('client1', '123456', 'client', '王五客户');
  insertUser('finance1', '123456', 'finance', '赵六财务');

  console.log('数据库初始化完成');
};

createTables();

db.run = function(sql, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    params = [];
  }
  if (params === undefined) {
    params = [];
  }
  if (!Array.isArray(params)) {
    params = [params];
  }

  try {
    const stmt = this.prepare(sql);
    const result = stmt.run(...params);
    const resultObj = { lastID: result.lastInsertRowid, changes: result.changes };
    
    if (callback) {
      callback.call(resultObj, null);
    } else {
      return resultObj;
    }
  } catch (err) {
    if (callback) {
      callback(err);
    } else {
      throw err;
    }
  }
};

db.get = function(sql, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    params = [];
  }
  if (params === undefined) {
    params = [];
  }
  if (!Array.isArray(params)) {
    params = [params];
  }

  try {
    const stmt = this.prepare(sql);
    const row = stmt.get(...params);
    
    if (callback) {
      callback(null, row);
    } else {
      return row;
    }
  } catch (err) {
    if (callback) {
      callback(err, null);
    } else {
      throw err;
    }
  }
};

db.all = function(sql, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    params = [];
  }
  if (params === undefined) {
    params = [];
  }
  if (!Array.isArray(params)) {
    params = [params];
  }

  try {
    const stmt = this.prepare(sql);
    const rows = stmt.all(...params);
    
    if (callback) {
      callback(null, rows);
    } else {
      return rows;
    }
  } catch (err) {
    if (callback) {
      callback(err, null);
    } else {
      throw err;
    }
  }
};

module.exports = db;
