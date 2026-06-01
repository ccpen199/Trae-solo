const sqlite3 = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const db = new sqlite3(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  const createTables = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      pay_password TEXT,
      balance REAL DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS bank_cards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      card_number TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      card_type TEXT NOT NULL DEFAULT 'debit',
      card_holder TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS qr_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL,
      description TEXT,
      code_data TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      expires_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      payer_id TEXT NOT NULL,
      payee_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      description TEXT,
      qr_code_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      completed_at INTEGER,
      error_message TEXT,
      FOREIGN KEY (payer_id) REFERENCES users(id),
      FOREIGN KEY (payee_id) REFERENCES users(id),
      FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_payer ON transactions(payer_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_payee ON transactions(payee_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
    CREATE INDEX IF NOT EXISTS idx_qr_codes_user ON qr_codes(user_id);
    CREATE INDEX IF NOT EXISTS idx_bank_cards_user ON bank_cards(user_id);
  `;

  db.exec(createTables);

  const checkUsers = db.prepare('SELECT COUNT(*) as count FROM users');
  const result = checkUsers.get();
  if (result.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, phone, name, avatar, pay_password, balance)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    insertUser.run('user_001', '13800138001', '张三', '👤', '123456', 1000.00);
    insertUser.run('user_002', '13800138002', '李四', '👤', '123456', 500.00);
  }
};

initDatabase();

module.exports = db;
