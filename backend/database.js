const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
console.log('Connected to SQLite database');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id TEXT UNIQUE,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      object_type TEXT NOT NULL,
      object_id TEXT NOT NULL,
      object_data TEXT,
      source_page TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0,
      UNIQUE(user_id, object_type, object_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      favorite_id INTEGER NOT NULL,
      tag TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (favorite_id) REFERENCES favorites(id)
    );

    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(object_type);
    CREATE INDEX IF NOT EXISTS idx_tags_favorite ON tags(favorite_id);
    CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags(tag);
  `);

  const bcrypt = require('bcryptjs');
  const defaultPassword = bcrypt.hashSync('123456', 10);
  
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@example.com');
  if (!existingUser) {
    db.prepare(`
      INSERT INTO users (member_id, email, password, name)
      VALUES ('M000001', 'demo@example.com', ?, 'Demo User')
    `).run(defaultPassword);
    console.log('Demo user created: demo@example.com / 123456');
  }
}

initializeDatabase();

function extractParamsAndCallback(args) {
  const params = [];
  let callback = null;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (typeof arg === 'function') {
      callback = arg;
    } else if (Array.isArray(arg)) {
      params.push(...arg);
    } else {
      params.push(arg);
    }
  }
  
  return { params, callback };
}

db.get = function(sql) {
  const { params, callback } = extractParamsAndCallback(Array.from(arguments).slice(1));
  
  try {
    const stmt = db.prepare(sql);
    const result = stmt.get(...params);
    
    if (callback) {
      callback(null, result);
    }
    return result;
  } catch (err) {
    console.error('Database get error:', err.message, 'SQL:', sql, 'Params:', params);
    if (callback) {
      callback(err, null);
      return null;
    }
    throw err;
  }
};

db.all = function(sql) {
  const { params, callback } = extractParamsAndCallback(Array.from(arguments).slice(1));
  
  try {
    const stmt = db.prepare(sql);
    const result = stmt.all(...params);
    
    if (callback) {
      callback(null, result);
    }
    return result;
  } catch (err) {
    console.error('Database all error:', err.message, 'SQL:', sql, 'Params:', params);
    if (callback) {
      callback(err, null);
      return [];
    }
    throw err;
  }
};

db.run = function(sql) {
  const { params, callback } = extractParamsAndCallback(Array.from(arguments).slice(1));
  
  try {
    const stmt = db.prepare(sql);
    const info = stmt.run(...params);
    
    const result = { 
      lastID: info.lastInsertRowid, 
      changes: info.changes 
    };
    
    if (callback) {
      callback(null, result);
    }
    return result;
  } catch (err) {
    console.error('Database run error:', err.message, 'SQL:', sql, 'Params:', params);
    if (callback) {
      callback(err, null);
      return { lastID: 0, changes: 0 };
    }
    throw err;
  }
};

db.serialize = function(callback) {
  if (callback) {
    callback();
  }
};

db.prepare = function(sql) {
  return Database.prototype.prepare.call(db, sql);
};

db.exec = function(sql) {
  return Database.prototype.exec.call(db, sql);
};

module.exports = db;
