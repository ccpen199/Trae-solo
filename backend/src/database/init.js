require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || './data/app.db';
const db = new Database(dbPath);

db.exec(`PRAGMA foreign_keys = ON`);

db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  id_card TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  max_amount REAL NOT NULL,
  min_amount REAL NOT NULL,
  interest_rate REAL NOT NULL,
  term_min INTEGER NOT NULL,
  term_max INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS credit_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  id_card_front TEXT,
  id_card_back TEXT,
  ocr_data TEXT,
  personal_info TEXT,
  contact_info TEXT,
  approved_amount REAL,
  approved_term INTEGER,
  reject_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS loan_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  credit_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  term INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (credit_id) REFERENCES credit_applications(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS repayments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  principal REAL NOT NULL,
  interest REAL NOT NULL,
  period INTEGER NOT NULL,
  due_date DATETIME NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loan_applications(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const defaultPassword = bcrypt.hashSync('123456', 10);
  db.prepare('INSERT INTO users (phone, password, name) VALUES (?, ?, ?)').run(
    '13800138000', defaultPassword, '测试用户'
  );
}

const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (productCount.count === 0) {
  const products = [
    ['极速贷', '快速审批，当天放款', 200000, 10000, 0.0005, 3, 24],
    ['经营贷', '专为小微企业打造', 500000, 50000, 0.0004, 6, 36],
    ['消费贷', '灵活分期，轻松消费', 100000, 5000, 0.0006, 3, 12]
  ];
  const insertProduct = db.prepare(
    'INSERT INTO products (name, description, max_amount, min_amount, interest_rate, term_min, term_max) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  products.forEach(p => insertProduct.run(...p));
}

console.log('Database initialized successfully');

module.exports = db;
