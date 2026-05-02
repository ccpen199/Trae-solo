import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/app.sqlite');

const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS business_orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS invoice_requests (
      id TEXT PRIMARY KEY,
      order_no TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      invoice_title TEXT NOT NULL,
      tax_no TEXT NOT NULL,
      bank_account TEXT,
      bank_name TEXT,
      address TEXT,
      phone TEXT,
      amount REAL NOT NULL,
      items TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      invoice_no TEXT,
      invoice_code TEXT,
      invoice_url TEXT,
      delivered_at TIMESTAMP,
      settled_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_no) REFERENCES business_orders(order_no)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      invoice_id TEXT,
      order_no TEXT,
      action TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      operator_role TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS delivery_records (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      recipient TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      sent_at TIMESTAMP,
      read_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoice_requests(id)
    );

    CREATE TABLE IF NOT EXISTS red_credit_records (
      id TEXT PRIMARY KEY,
      original_invoice_id TEXT NOT NULL,
      original_invoice_no TEXT NOT NULL,
      red_invoice_no TEXT,
      red_invoice_code TEXT,
      reason TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      red_message TEXT,
      submitted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (original_invoice_id) REFERENCES invoice_requests(id)
    );

    CREATE TABLE IF NOT EXISTS invoice_quota (
      id TEXT PRIMARY KEY,
      period TEXT NOT NULL,
      total_quota REAL DEFAULT 1000000,
      used_quota REAL DEFAULT 0,
      remaining_quota REAL DEFAULT 1000000,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS compliance_reports (
      id TEXT PRIMARY KEY,
      report_type TEXT NOT NULL,
      period TEXT NOT NULL,
      generated_by TEXT NOT NULL,
      file_path TEXT,
      statistics TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS risk_alerts (
      id TEXT PRIMARY KEY,
      invoice_id TEXT,
      risk_type TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      description TEXT NOT NULL,
      is_resolved INTEGER DEFAULT 0,
      resolved_at TIMESTAMP,
      resolved_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const userExists = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userExists.count === 0) {
    const users = [
      { id: 'user_001', username: 'customer01', password: bcrypt.hashSync('123456', 10), role: 'customer', name: '张三客户', email: 'customer01@example.com' },
      { id: 'user_002', username: 'finance01', password: bcrypt.hashSync('123456', 10), role: 'finance', name: '李财务', email: 'finance01@example.com' },
      { id: 'user_003', username: 'tax01', password: bcrypt.hashSync('123456', 10), role: 'tax', name: '王税务', email: 'tax01@example.com' },
      { id: 'user_004', username: 'sales01', password: bcrypt.hashSync('123456', 10), role: 'sales', name: '赵销售', email: 'sales01@example.com' }
    ];

    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password, role, name, email)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    users.forEach(user => {
      insertUser.run(user.id, user.username, user.password, user.role, user.name, user.email);
    });

    const orders = [
      { id: 'order_001', order_no: 'ORD20240001', customer_id: 'user_001', customer_name: '张三客户', amount: 50000, status: 'invoiced' },
      { id: 'order_002', order_no: 'ORD20240002', customer_id: 'user_001', customer_name: '张三客户', amount: 30000, status: 'pending' }
    ];

    const insertOrder = db.prepare(`
      INSERT INTO business_orders (id, order_no, customer_id, customer_name, amount, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    orders.forEach(order => {
      insertOrder.run(order.id, order.order_no, order.customer_id, order.customer_name, order.amount, order.status);
    });

    const period = new Date().toISOString().slice(0, 7);
    db.prepare(`
      INSERT INTO invoice_quota (id, period, total_quota, used_quota, remaining_quota)
      VALUES (?, ?, ?, ?, ?)
    `).run('quota_001', period, 1000000, 0, 1000000);
  }
};

initDb();

export default db;
