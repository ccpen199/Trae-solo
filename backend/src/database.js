const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    initiator_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_hash TEXT,
    initial_timestamp TEXT,
    initial_time_token TEXT,
    status TEXT DEFAULT 'draft',
    certificate_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS signers (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL,
    user_id TEXT,
    user_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    identity_verified INTEGER DEFAULT 0,
    sign_status TEXT DEFAULT 'pending',
    signed_at DATETIME,
    signature_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS seals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    seal_name TEXT NOT NULL,
    seal_type TEXT DEFAULT 'personal',
    seal_image BLOB,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS evidence_blocks (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL,
    block_type TEXT NOT NULL,
    block_hash TEXT NOT NULL,
    previous_hash TEXT,
    timestamp TEXT NOT NULL,
    time_token TEXT,
    operation TEXT NOT NULL,
    operator_id TEXT,
    operator_name TEXT,
    raw_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL,
    certificate_number TEXT UNIQUE,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    valid_until DATETIME,
    issuer TEXT DEFAULT '电子签约系统证书机构',
    certificate_data TEXT,
    ca_signature TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    contract_id TEXT,
    user_id TEXT,
    user_name TEXT,
    action TEXT NOT NULL,
    description TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    email TEXT,
    phone TEXT,
    real_name TEXT,
    identity_verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS file_versions (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    timestamp TEXT,
    operator_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id)
  )
`);

const adminPassword = crypto
  .createHash('sha256')
  .update('admin123')
  .digest('hex');

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, username, password, role, real_name, identity_verified)
  VALUES (?, ?, ?, ?, ?, ?)
`);

insertUser.run('admin-001', 'admin', adminPassword, 'legal_expert', '法务管理员', 1);
insertUser.run('user-001', 'initiator', adminPassword, 'user', '发起方测试用户', 1);
insertUser.run('user-002', 'signer', adminPassword, 'user', '签署方测试用户', 1);

class DatabaseWrapper {
  constructor(db) {
    this.db = db;
  }

  run(sql, ...args) {
    const hasCallback = typeof args[args.length - 1] === 'function';
    const callback = hasCallback ? args.pop() : null;
    const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
    
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(...params);
      const wrappedResult = {
        lastID: result.lastInsertRowid,
        changes: result.changes
      };
      
      if (callback) {
        callback(null, wrappedResult);
      }
      return wrappedResult;
    } catch (err) {
      if (callback) {
        callback(err);
        return;
      }
      throw err;
    }
  }

  get(sql, ...args) {
    const hasCallback = typeof args[args.length - 1] === 'function';
    const callback = hasCallback ? args.pop() : null;
    const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
    
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.get(...params);
      
      if (callback) {
        callback(null, result);
      }
      return result;
    } catch (err) {
      if (callback) {
        callback(err);
        return;
      }
      throw err;
    }
  }

  all(sql, ...args) {
    const hasCallback = typeof args[args.length - 1] === 'function';
    const callback = hasCallback ? args.pop() : null;
    const params = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
    
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.all(...params);
      
      if (callback) {
        callback(null, result);
      }
      return result;
    } catch (err) {
      if (callback) {
        callback(err);
        return;
      }
      throw err;
    }
  }

  serialize(callback) {
    if (callback) {
      callback();
    }
  }
}

const wrappedDb = new DatabaseWrapper(db);

wrappedDb.close = () => db.close();

module.exports = wrappedDb;
