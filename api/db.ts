import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'buyer',
      avatar TEXT,
      real_name TEXT,
      id_card TEXT,
      is_verified INTEGER DEFAULT 0,
      is_signed INTEGER DEFAULT 0,
      payment_password TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enterprises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      credit_code TEXT UNIQUE,
      industry TEXT,
      scale TEXT,
      region TEXT,
      address TEXT,
      contact_person TEXT,
      contact_phone TEXT,
      business_license TEXT,
      qualifications TEXT,
      certifications TEXT,
      is_verified INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS demands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      industry TEXT,
      process TEXT,
      quantity INTEGER,
      unit TEXT,
      budget_min REAL,
      budget_max REAL,
      region TEXT,
      delivery_date DATETIME,
      attachments TEXT,
      status TEXT DEFAULT 'draft',
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT,
      specifications TEXT,
      price REAL,
      unit TEXT,
      images TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
    );

    CREATE TABLE IF NOT EXISTS capabilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT,
      equipment TEXT,
      capacity TEXT,
      certifications TEXT,
      region TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      demand_id INTEGER NOT NULL,
      enterprise_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      price REAL NOT NULL,
      unit TEXT,
      delivery_days INTEGER,
      delivery_date DATETIME,
      description TEXT,
      remark TEXT,
      attachments TEXT,
      status TEXT DEFAULT 'pending',
      is_accepted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (demand_id) REFERENCES demands(id),
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      demand_id INTEGER NOT NULL,
      enterprise_id INTEGER NOT NULL,
      match_score REAL,
      match_reason TEXT,
      status TEXT DEFAULT 'pending',
      project_manager_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (demand_id) REFERENCES demands(id),
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id),
      FOREIGN KEY (project_manager_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      demand_id INTEGER,
      quote_id INTEGER,
      buyer_id INTEGER NOT NULL,
      supplier_id INTEGER NOT NULL,
      enterprise_id INTEGER,
      type TEXT DEFAULT 'industrial',
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      contract_url TEXT,
      payment_status TEXT DEFAULT 'unpaid',
      delivery_status TEXT DEFAULT 'pending',
      paid_at DATETIME,
      delivered_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (demand_id) REFERENCES demands(id),
      FOREIGN KEY (quote_id) REFERENCES quotes(id),
      FOREIGN KEY (buyer_id) REFERENCES users(id),
      FOREIGN KEY (supplier_id) REFERENCES users(id),
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      balance REAL DEFAULT 0,
      frozen_balance REAL DEFAULT 0,
      currency TEXT DEFAULT 'CNY',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      payment_method TEXT,
      transaction_no TEXT UNIQUE,
      status TEXT DEFAULT 'pending',
      remark TEXT,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      approved_by INTEGER,
      approved_at DATETIME,
      refunded_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      buyer_id INTEGER NOT NULL,
      supplier_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      file_url TEXT,
      status TEXT DEFAULT 'draft',
      buyer_signed_at DATETIME,
      supplier_signed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (buyer_id) REFERENCES users(id),
      FOREIGN KEY (supplier_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      related_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('123456', 10);

    db.exec(`
      INSERT INTO users (username, email, phone, password, role, real_name, is_verified, is_signed) VALUES
      ('admin', 'admin@okodm.com', '13800000000', '${hashedPassword}', 'admin', '系统管理员', 1, 1),
      ('buyer01', 'buyer01@okodm.com', '13800000001', '${hashedPassword}', 'buyer', '张需方', 1, 1),
      ('supplier01', 'supplier01@okodm.com', '13800000002', '${hashedPassword}', 'supplier', '李供方', 1, 1),
      ('manager01', 'manager01@okodm.com', '13800000003', '${hashedPassword}', 'manager', '王经理', 1, 1);
    `);

    db.exec(`
      INSERT INTO enterprises (user_id, name, credit_code, industry, region, contact_person, contact_phone, is_verified, status) VALUES
      (3, '深圳智造科技有限公司', '91440300MA5EXAMPLE', '电子制造', '广东省深圳市', '李供方', '13800000002', 1, 'approved');
    `);

    db.exec(`
      INSERT INTO accounts (user_id, balance) VALUES
      (2, 100000),
      (3, 50000),
      (4, 0);
    `);

    db.exec(`
      INSERT INTO demands (user_id, title, description, industry, process, quantity, unit, budget_min, budget_max, region, status) VALUES
      (2, 'PCB电路板批量生产', '需要生产10000片PCB电路板，要求4层板，沉金工艺，符合ROHS标准', '电子制造', 'PCB制作', 10000, '片', 50000, 80000, '广东省', 'published');
    `);

    db.exec(`
      INSERT INTO capabilities (enterprise_id, name, category, description, region, capacity) VALUES
      (1, 'PCB电路板制造', '电子制造', '专业PCB制造，可生产2-32层板，具备沉金、镀金、OSP等表面处理工艺', '广东省深圳市', '月产能50000平方米');
    `);
  }
}

export default db;
