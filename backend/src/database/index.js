const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

let dbInstance = null;

class DatabaseWrapper {
  constructor(db) {
    this.db = db;
  }

  prepare(sql) {
    const stmt = this.db.prepare(sql);
    return {
      get: (...params) => {
        return new Promise((resolve, reject) => {
          stmt.get(...params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
      },
      all: (...params) => {
        return new Promise((resolve, reject) => {
          stmt.all(...params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
      },
      run: (...params) => {
        return new Promise((resolve, reject) => {
          stmt.run(...params, function(err) {
            if (err) reject(err);
            else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
          });
        });
      }
    };
  }

  get(sql, ...params) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, ...params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, ...params) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, ...params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  run(sql, ...params) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, ...params, function(err) {
        if (err) reject(err);
        else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
      });
    });
  }

  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

function initDatabase() {
  if (dbInstance) return dbInstance;

  const dbPath = path.resolve(__dirname, '../../', config.db.path);
  const dbDir = path.dirname(dbPath);
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  logger.info(`初始化数据库: ${dbPath}`);
  const db = new sqlite3.Database(dbPath);

  const wrapper = new DatabaseWrapper(db);
  initTables(db);
  initDefaultAdmin(db);

  dbInstance = wrapper;
  return dbInstance;
}

function initTables(db) {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      role TEXT DEFAULT 'user',
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS product_bars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      category_id INTEGER,
      leaf_node_id INTEGER,
      status INTEGER DEFAULT 1,
      view_count INTEGER DEFAULT 0,
      member_count INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      sort INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS leaf_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER,
      external_id TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS bar_owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bar_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'owner',
      status INTEGER DEFAULT 1,
      approved_by INTEGER,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bar_id) REFERENCES product_bars(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bar_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      entry_type TEXT DEFAULT 'text',
      sort INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bar_id) REFERENCES product_bars(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL,
      content_type TEXT NOT NULL,
      content_data TEXT NOT NULL,
      sort INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS bar_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bar_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status INTEGER DEFAULT 1,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bar_id) REFERENCES product_bars(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(bar_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_bars_leaf ON product_bars(leaf_node_id)`,
    `CREATE INDEX IF NOT EXISTS idx_bars_status ON product_bars(status)`,
    `CREATE INDEX IF NOT EXISTS idx_entries_bar ON entries(bar_id)`,
    `CREATE INDEX IF NOT EXISTS idx_contents_entry ON contents(entry_id)`,
    `CREATE INDEX IF NOT EXISTS idx_owners_bar ON bar_owners(bar_id)`
  ];

  tables.forEach(sql => {
    db.run(sql);
  });

  logger.info('数据库表初始化完成');
}

function initDefaultAdmin(db) {
  db.get('SELECT id FROM users WHERE role = ?', ['admin'], (err, row) => {
    if (err) {
      logger.error('检查管理员账户错误:', err);
      return;
    }
    if (row) {
      logger.info('管理员账户已存在，跳过初始化');
      return;
    }

    const hashedPassword = bcrypt.hashSync(config.admin.defaultPassword, 10);
    db.run(`
      INSERT INTO users (username, password, nickname, role, status)
      VALUES (?, ?, ?, ?, 1)
    `, [
      config.admin.defaultUsername,
      hashedPassword,
      '系统管理员',
      'admin'
    ], (err) => {
      if (err) {
        logger.error('创建管理员账户错误:', err);
      } else {
        logger.info('默认管理员账户已创建');
      }
    });
  });
}

function getDb() {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

module.exports = { initDatabase, getDb };
