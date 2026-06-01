const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS whitelist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      merchant_name TEXT NOT NULL,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      merchant_name TEXT NOT NULL,
      id_card TEXT,
      real_name TEXT,
      registered INTEGER DEFAULT 0,
      register_agreed INTEGER DEFAULT 0,
      commission_agreed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enterprise_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      company_name TEXT,
      credit_code TEXT,
      legal_person TEXT,
      id_card TEXT,
      bank_card TEXT,
      bank_name TEXT,
      bank_mobile TEXT,
      verified INTEGER DEFAULT 0,
      verify_attempts INTEGER DEFAULT 0,
      last_verify_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS credit_apply (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      amount DECIMAL(12,2),
      available_limit DECIMAL(12,2),
      auth_signed INTEGER DEFAULT 0,
      face_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS commission_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      batch_no TEXT UNIQUE NOT NULL,
      total_amount DECIMAL(12,2) NOT NULL,
      advanced_amount DECIMAL(12,2) DEFAULT 0,
      status TEXT DEFAULT 'pending',
      has_invoice INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS advance_apply (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      batch_id INTEGER NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      status TEXT DEFAULT 'applying',
      contract_signed INTEGER DEFAULT 0,
      signature TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS verify_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      verify_type TEXT NOT NULL,
      attempt_date TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      UNIQUE(user_id, verify_type, attempt_date)
    );

    CREATE TABLE IF NOT EXISTS repayments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      advance_id INTEGER NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      status TEXT DEFAULT 'pending',
      due_date DATETIME,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const stmt = db.prepare('SELECT COUNT(*) as count FROM whitelist');
  const result = stmt.get();
  if (result.count === 0) {
    const insert = db.prepare('INSERT INTO whitelist (phone, merchant_name, status) VALUES (?, ?, ?)');
    insert.run('13800138000', '上海房产经纪有限公司', 1);
    insert.run('13900139000', '北京置业顾问有限公司', 1);
    insert.run('13700137000', '广州房产中介服务部', 1);
  }

  const batchStmt = db.prepare('SELECT COUNT(*) as count FROM commission_batches');
  const batchResult = batchStmt.get();
  if (batchResult.count === 0) {
    const insertBatch = db.prepare('INSERT INTO commission_batches (user_id, batch_no, total_amount, advanced_amount, status, has_invoice) VALUES (?, ?, ?, ?, ?, ?)');
    insertBatch.run(1, 'BATCH202405001', 50000.00, 0, 'pending', 1);
    insertBatch.run(1, 'BATCH202405002', 35000.00, 15000.00, 'partial', 1);
    insertBatch.run(1, 'BATCH202405003', 80000.00, 0, 'pending', 0);
  }

  console.log('Database initialized successfully');
}

module.exports = { db, initDatabase };
