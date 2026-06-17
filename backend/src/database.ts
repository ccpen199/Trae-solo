import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbPath = path.resolve(__dirname, '../data.db');
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function addColumnIfMissing(table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (columns.some((item) => item.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      nickname TEXT,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      balance REAL DEFAULT 0,
      referrer_id TEXT,
      level INTEGER DEFAULT 0,
      total_commission REAL DEFAULT 0,
      available_commission REAL DEFAULT 0,
      is_virtual INTEGER DEFAULT 0,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (referrer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_relations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      parent_id TEXT NOT NULL,
      depth INTEGER NOT NULL,
      created_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (parent_id) REFERENCES users(id),
      UNIQUE(user_id, parent_id, depth)
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      api_endpoint TEXT,
      api_key TEXT,
      api_secret TEXT,
      status INTEGER DEFAULT 1,
      settlement_ratio REAL DEFAULT 0.9,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      icon TEXT,
      sort INTEGER DEFAULT 0,
      parent_id TEXT,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category_id TEXT,
      supplier_id TEXT,
      supplier_product_id TEXT,
      sku_type TEXT NOT NULL,
      face_value REAL,
      price REAL NOT NULL,
      cost_price REAL NOT NULL,
      commission_rate REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      stock_warning INTEGER DEFAULT 10,
      image TEXT,
      description TEXT,
      status INTEGER DEFAULT 1,
      sort INTEGER DEFAULT 0,
      is_hot INTEGER DEFAULT 0,
      recharge_type TEXT DEFAULT 'auto',
      region_limit TEXT,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      rules TEXT NOT NULL,
      priority INTEGER DEFAULT 0,
      start_time INTEGER,
      end_time INTEGER,
      status INTEGER DEFAULT 1,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT,
      supplier_id TEXT,
      order_no TEXT UNIQUE NOT NULL,
      recharge_account TEXT,
      quantity INTEGER DEFAULT 1,
      face_value REAL,
      unit_price REAL,
      original_amount REAL,
      discount_amount REAL DEFAULT 0,
      final_amount REAL NOT NULL,
      commission_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      supplier_order_id TEXT,
      supplier_code TEXT,
      fail_reason TEXT,
      diagnostic_result TEXT,
      retry_count INTEGER DEFAULT 0,
      channel_switched INTEGER DEFAULT 0,
      pay_time INTEGER,
      recharge_time INTEGER,
      finish_time INTEGER,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS commission_records (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      from_user_id TEXT NOT NULL,
      level INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      settled_at INTEGER,
      created_at INTEGER,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (from_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS card_pool (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      supplier_id TEXT NOT NULL,
      card_number TEXT NOT NULL,
      card_password TEXT NOT NULL,
      encrypted_card TEXT,
      encrypted_password TEXT,
      batch_no TEXT,
      status TEXT DEFAULT 'available',
      order_id TEXT,
      expire_time INTEGER,
      created_at INTEGER,
      used_at INTEGER,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS risk_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      ip TEXT,
      region TEXT,
      action TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      detail TEXT,
      blocked INTEGER DEFAULT 0,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS ip_blacklist (
      id TEXT PRIMARY KEY,
      ip TEXT UNIQUE NOT NULL,
      reason TEXT,
      expire_time INTEGER,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS region_limits (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      region_code TEXT NOT NULL,
      allow INTEGER DEFAULT 0,
      created_at INTEGER,
      UNIQUE(product_id, region_code)
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      supplier_id TEXT NOT NULL,
      period TEXT NOT NULL,
      total_orders INTEGER DEFAULT 0,
      total_amount REAL DEFAULT 0,
      settlement_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      invoice_no TEXT,
      invoice_status TEXT DEFAULT 'pending',
      paid_at INTEGER,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS settlement_items (
      id TEXT PRIMARY KEY,
      settlement_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      amount REAL NOT NULL,
      cost_amount REAL NOT NULL,
      FOREIGN KEY (settlement_id) REFERENCES settlements(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS recharge_channels (
      id TEXT PRIMARY KEY,
      name TEXT,
      product_id TEXT NOT NULL,
      supplier_id TEXT NOT NULL,
      priority INTEGER DEFAULT 0,
      success_rate REAL DEFAULT 1,
      last_fail_time INTEGER,
      status INTEGER DEFAULT 1,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS channel_switch_logs (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      from_channel_id INTEGER,
      to_channel_id INTEGER,
      from_supplier_id TEXT,
      to_supplier_id TEXT,
      reason TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS stock_sync_history (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      before_stock INTEGER NOT NULL,
      after_stock INTEGER NOT NULL,
      variance INTEGER NOT NULL,
      sync_time INTEGER NOT NULL,
      sync_batch TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE INDEX IF NOT EXISTS idx_stock_sync_product ON stock_sync_history(product_id);
    CREATE INDEX IF NOT EXISTS idx_stock_sync_time ON stock_sync_history(sync_time);

    CREATE TABLE IF NOT EXISTS card_crypto_logs (
      id TEXT PRIMARY KEY,
      card_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      operator_id TEXT,
      operator_role TEXT,
      encryption_method TEXT,
      key_version TEXT,
      decrypted_preview TEXT,
      ip_address TEXT,
      reason TEXT,
      success INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (card_id) REFERENCES card_pool(id)
    );

    CREATE TABLE IF NOT EXISTS profit_share_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id TEXT NOT NULL,
      level1_ratio REAL DEFAULT 0.08,
      level2_ratio REAL DEFAULT 0.04,
      level3_ratio REAL DEFAULT 0.02,
      supplier_ratio REAL DEFAULT 0.7,
      platform_ratio REAL DEFAULT 0.3,
      updated_at INTEGER,
      updated_by TEXT
    );

    CREATE TABLE IF NOT EXISTS error_code_mapping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_code TEXT NOT NULL,
      error_code TEXT NOT NULL,
      user_message TEXT NOT NULL,
      solution TEXT,
      auto_retry INTEGER DEFAULT 0,
      switch_channel INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_card_pool_product ON card_pool(product_id);
    CREATE INDEX IF NOT EXISTS idx_card_pool_status ON card_pool(status);
    CREATE INDEX IF NOT EXISTS idx_risk_user ON risk_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_risk_created ON risk_logs(created_at);
  `);

  addColumnIfMissing('orders', 'channel_id', 'INTEGER');
  addColumnIfMissing('recharge_channels', 'name', 'TEXT');
  db.prepare(`
    UPDATE recharge_channels
    SET name = '通道' || COALESCE(priority, 0)
    WHERE name IS NULL OR TRIM(name) = ''
  `).run();
  addColumnIfMissing('card_crypto_logs', 'key_version', 'TEXT');
  addColumnIfMissing('card_crypto_logs', 'ip_address', 'TEXT');
  addColumnIfMissing('card_crypto_logs', 'reason', 'TEXT');
  addColumnIfMissing('card_crypto_logs', 'success', 'INTEGER DEFAULT 1');
  addColumnIfMissing('card_pool', 'batch_no', 'TEXT');
  addColumnIfMissing('settlements', 'invoice_no', 'TEXT');
  addColumnIfMissing('settlements', 'invoice_amount', 'REAL');
  addColumnIfMissing('settlements', 'invoice_date', 'INTEGER');
}
