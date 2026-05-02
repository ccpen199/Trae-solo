require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      real_name TEXT,
      id_card TEXT,
      phone TEXT,
      email TEXT,
      status TEXT DEFAULT 'pending',
      bank_card_number TEXT,
      bank_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_number TEXT UNIQUE NOT NULL,
      account_type TEXT DEFAULT 'personal',
      balance INTEGER DEFAULT 0,
      frozen_balance INTEGER DEFAULT 0,
      currency TEXT DEFAULT 'CNY',
      status TEXT DEFAULT 'active',
      daily_limit INTEGER DEFAULT 100000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      transaction_no TEXT UNIQUE NOT NULL,
      from_account_id TEXT,
      to_account_id TEXT,
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'CNY',
      transaction_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      description TEXT,
      merchant_id TEXT,
      merchant_name TEXT,
      risk_score REAL DEFAULT 0,
      risk_level TEXT DEFAULT 'low',
      risk_reason TEXT,
      anti_fraud_status TEXT DEFAULT 'pending',
      aml_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ledger_entries (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      entry_type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES transactions (id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS reconciliations (
      id TEXT PRIMARY KEY,
      reconciliation_date DATE NOT NULL,
      total_count INTEGER DEFAULT 0,
      matched_count INTEGER DEFAULT 0,
      unmatched_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      total_amount INTEGER DEFAULT 0,
      matched_amount INTEGER DEFAULT 0,
      unmatched_amount INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS reconciliation_items (
      id TEXT PRIMARY KEY,
      reconciliation_id TEXT NOT NULL,
      transaction_id TEXT,
      item_type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      expected_amount INTEGER,
      actual_amount INTEGER,
      status TEXT DEFAULT 'pending',
      handler_remark TEXT,
      handled_by TEXT,
      handled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reconciliation_id) REFERENCES reconciliations (id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS risk_events (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      transaction_id TEXT,
      event_type TEXT NOT NULL,
      risk_level TEXT DEFAULT 'medium',
      risk_score REAL DEFAULT 0,
      risk_reason TEXT,
      details TEXT,
      status TEXT DEFAULT 'pending',
      is_handled INTEGER DEFAULT 0,
      handled_by TEXT,
      handled_remark TEXT,
      handled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      operator_role TEXT,
      operation_type TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      detail TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS hash_chains (
      id TEXT PRIMARY KEY,
      block_height INTEGER NOT NULL,
      previous_hash TEXT,
      current_hash TEXT NOT NULL,
      merkle_root TEXT,
      transaction_ids TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      block_type TEXT DEFAULT 'transaction'
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS merchants (
      id TEXT PRIMARY KEY,
      merchant_name TEXT NOT NULL,
      merchant_no TEXT UNIQUE NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      status TEXT DEFAULT 'active',
      business_license TEXT,
      daily_limit INTEGER DEFAULT 1000000,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      notification_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      related_transaction_id TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS electronic_vouchers (
      id TEXT PRIMARY KEY,
      voucher_no TEXT UNIQUE NOT NULL,
      transaction_id TEXT NOT NULL,
      transaction_no TEXT,
      from_user_name TEXT,
      to_user_name TEXT,
      from_account TEXT,
      to_account TEXT,
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'CNY',
      voucher_type TEXT NOT NULL,
      hash TEXT NOT NULL,
      remark TEXT,
      transfer_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec('CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions (from_account_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions (to_account_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_transactions_no ON transactions (transaction_no)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions (created_at)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_ledger_transaction ON ledger_entries (transaction_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts (user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_risk_user ON risk_events (user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_risk_transaction ON risk_events (transaction_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_hash_block ON hash_chains (block_height)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_voucher_transaction ON electronic_vouchers (transaction_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_reconciliation_date ON reconciliations (reconciliation_date)');
};

const insertSeedData = () => {
  const crypto = require('crypto');
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  const adminId = 'admin-001';
  const adminPassword = bcrypt.hashSync('admin123', 10);
  
  const insertAdmin = db.prepare(`
    INSERT OR IGNORE INTO users (id, username, password_hash, real_name, status, phone, email, created_at)
    VALUES (?, ?, ?, ?, 'active', ?, ?, CURRENT_TIMESTAMP)
  `);
  insertAdmin.run(adminId, 'admin', adminPassword, '系统管理员', '13800138000', 'admin@wallet.com');

  const merchantId = 'merchant-001';
  const merchantNo = 'M2026000001';
  
  const insertMerchant = db.prepare(`
    INSERT OR IGNORE INTO merchants (id, merchant_name, merchant_no, contact_person, phone, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
  `);
  insertMerchant.run(merchantId, '测试商户', merchantNo, '张三', '13900139001');

  const checkGenesis = db.prepare('SELECT * FROM hash_chains WHERE block_height = 0');
  const genesisExists = checkGenesis.get();
  
  if (!genesisExists) {
    const genesisHash = crypto.createHash('sha256').update('genesis_block_' + Date.now()).digest('hex');
    const insertGenesis = db.prepare(`
      INSERT INTO hash_chains (id, block_height, previous_hash, current_hash, merkle_root, block_type, timestamp)
      VALUES (?, 0, '0', ?, ?, 'genesis', CURRENT_TIMESTAMP)
    `);
    insertGenesis.run('hash-' + uuidv4().substring(0, 8), genesisHash, genesisHash);
  }
};

try {
  initTables();
  insertSeedData();
  console.log('✅ 数据库初始化完成！');
  console.log('📌 管理账号: admin / admin123');
  console.log('📌 测试商户号: M2026000001');
} catch (err) {
  console.error('❌ 数据库初始化失败:', err);
  process.exit(1);
} finally {
  db.close();
}
