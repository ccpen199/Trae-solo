const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('investor', 'risk_officer', 'exchange_admin', 'financial_settler')),
      name TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS funds (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      total_balance REAL DEFAULT 1000000.0,
      available_balance REAL DEFAULT 1000000.0,
      frozen_balance REAL DEFAULT 0.0,
      total_profit_loss REAL DEFAULT 0.0,
      currency TEXT DEFAULT 'CNY',
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS securities (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'stock',
      base_price REAL NOT NULL,
      current_price REAL NOT NULL,
      prev_close REAL NOT NULL,
      open REAL,
      high REAL,
      low REAL,
      volume INTEGER DEFAULT 0,
      amount REAL DEFAULT 0,
      status TEXT DEFAULT 'trading',
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE TABLE IF NOT EXISTS market_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      security_code TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      price REAL NOT NULL,
      volume INTEGER DEFAULT 0,
      bid_price_1 REAL,
      bid_volume_1 INTEGER,
      bid_price_2 REAL,
      bid_volume_2 INTEGER,
      bid_price_3 REAL,
      bid_volume_3 INTEGER,
      bid_price_4 REAL,
      bid_volume_4 INTEGER,
      bid_price_5 REAL,
      bid_volume_5 INTEGER,
      ask_price_1 REAL,
      ask_volume_1 INTEGER,
      ask_price_2 REAL,
      ask_volume_2 INTEGER,
      ask_price_3 REAL,
      ask_volume_3 INTEGER,
      ask_price_4 REAL,
      ask_volume_4 INTEGER,
      ask_price_5 REAL,
      ask_volume_5 INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE INDEX IF NOT EXISTS idx_market_data_security ON market_data(security_code);
    CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON market_data(timestamp);

    CREATE TABLE IF NOT EXISTS positions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      security_code TEXT NOT NULL,
      total_quantity INTEGER DEFAULT 0,
      available_quantity INTEGER DEFAULT 0,
      frozen_quantity INTEGER DEFAULT 0,
      avg_cost_price REAL DEFAULT 0.0,
      current_price REAL DEFAULT 0.0,
      market_value REAL DEFAULT 0.0,
      profit_loss REAL DEFAULT 0.0,
      profit_loss_ratio REAL DEFAULT 0.0,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_positions_user_security ON positions(user_id, security_code);

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      security_code TEXT NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('buy', 'sell')),
      order_type TEXT DEFAULT 'limit',
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      filled_quantity INTEGER DEFAULT 0,
      filled_amount REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'submitted', 'accepted', 'partially_filled', 'filled', 'cancelled', 'rejected')),
      risk_status TEXT DEFAULT 'pending' CHECK(risk_status IN ('pending', 'passed', 'failed')),
      risk_reason TEXT,
      match_status TEXT DEFAULT 'pending' CHECK(match_status IN ('pending', 'matching', 'matched', 'partially_matched')),
      submitted_at INTEGER,
      accepted_at INTEGER,
      matched_at INTEGER,
      cancelled_at INTEGER,
      rejected_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      trade_no TEXT UNIQUE NOT NULL,
      order_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      security_code TEXT NOT NULL,
      direction TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      amount REAL NOT NULL,
      commission REAL DEFAULT 0.0,
      stamp_tax REAL DEFAULT 0.0,
      transfer_fee REAL DEFAULT 0.0,
      settlement_date TEXT,
      status TEXT DEFAULT 'pending',
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
    CREATE INDEX IF NOT EXISTS idx_trades_order ON trades(order_id);
    CREATE INDEX IF NOT EXISTS idx_trades_created ON trades(created_at);

    CREATE TABLE IF NOT EXISTS risk_check_logs (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      check_type TEXT NOT NULL,
      check_result TEXT NOT NULL CHECK(check_result IN ('passed', 'failed')),
      check_message TEXT,
      check_details TEXT,
      timestamp INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_risk_logs_user ON risk_check_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_risk_logs_timestamp ON risk_check_logs(timestamp);

    CREATE TABLE IF NOT EXISTS settlement_reports (
      id TEXT PRIMARY KEY,
      report_date TEXT NOT NULL,
      user_id TEXT NOT NULL,
      opening_balance REAL NOT NULL,
      closing_balance REAL NOT NULL,
      total_buy_amount REAL DEFAULT 0.0,
      total_sell_amount REAL DEFAULT 0.0,
      total_commission REAL DEFAULT 0.0,
      total_stamp_tax REAL DEFAULT 0.0,
      total_transfer_fee REAL DEFAULT 0.0,
      position_profit_loss REAL DEFAULT 0.0,
      net_profit_loss REAL DEFAULT 0.0,
      status TEXT DEFAULT 'generated',
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_settlement_date_user ON settlement_reports(report_date, user_id);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      username TEXT,
      role TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      status TEXT DEFAULT 'success',
      error_message TEXT,
      timestamp INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      reason TEXT,
      operator_id TEXT,
      operator_name TEXT,
      timestamp INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE INDEX IF NOT EXISTS idx_order_history_order ON order_status_history(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_history_timestamp ON order_status_history(timestamp);

    CREATE TABLE IF NOT EXISTS websocket_subscriptions (
      id TEXT PRIMARY KEY,
      connection_id TEXT NOT NULL,
      user_id TEXT,
      subscription_type TEXT NOT NULL CHECK(subscription_type IN ('market_data', 'order_updates', 'trade_updates')),
      security_code TEXT,
      subscribed_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    );
  `);

  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existingUsers.count === 0) {
    const hashedPassword = bcrypt.hashSync('123456', 10);

    const users = [
      { id: uuidv4(), username: 'investor1', password: hashedPassword, role: 'investor', name: '张三', status: 'active' },
      { id: uuidv4(), username: 'risk_officer', password: hashedPassword, role: 'risk_officer', name: '李风控', status: 'active' },
      { id: uuidv4(), username: 'exchange_admin', password: hashedPassword, role: 'exchange_admin', name: '王管理', status: 'active' },
      { id: uuidv4(), username: 'financial_settler', password: hashedPassword, role: 'financial_settler', name: '赵财务', status: 'active' },
    ];

    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password, role, name, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertFund = db.prepare(`
      INSERT INTO funds (id, user_id, total_balance, available_balance, frozen_balance, total_profit_loss)
      VALUES (?, ?, ?, ?, 0, 0)
    `);

    for (const user of users) {
      insertUser.run(user.id, user.username, user.password, user.role, user.name, user.status);
      if (user.role === 'investor') {
        insertFund.run(uuidv4(), user.id, 1000000.0, 1000000.0);
      }
    }

    const securities = [
      { id: uuidv4(), code: '600519', name: '贵州茅台', type: 'stock', base_price: 1800.0, current_price: 1800.0, prev_close: 1780.0, open: 1785.0, high: 1805.0, low: 1780.0 },
      { id: uuidv4(), code: '000858', name: '五粮液', type: 'stock', base_price: 150.0, current_price: 150.0, prev_close: 148.5, open: 149.0, high: 151.0, low: 148.0 },
      { id: uuidv4(), code: '000001', name: '平安银行', type: 'stock', base_price: 12.5, current_price: 12.5, prev_close: 12.3, open: 12.35, high: 12.6, low: 12.2 },
      { id: uuidv4(), code: '601318', name: '中国平安', type: 'stock', base_price: 45.0, current_price: 45.0, prev_close: 44.5, open: 44.6, high: 45.2, low: 44.3 },
      { id: uuidv4(), code: '300750', name: '宁德时代', type: 'stock', base_price: 200.0, current_price: 200.0, prev_close: 198.0, open: 199.0, high: 202.0, low: 197.5 },
    ];

    const insertSecurity = db.prepare(`
      INSERT INTO securities (id, code, name, type, base_price, current_price, prev_close, open, high, low)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const sec of securities) {
      insertSecurity.run(sec.id, sec.code, sec.name, sec.type, sec.base_price, sec.current_price, sec.prev_close, sec.open, sec.high, sec.low);
    }
  }

  console.log('数据库初始化完成');
};

module.exports = { db, initDatabase };
