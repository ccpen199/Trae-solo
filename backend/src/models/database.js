const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      discount_rate REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS matters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      client_id INTEGER NOT NULL,
      billing_method TEXT NOT NULL DEFAULT 'hourly',
      partner_id INTEGER,
      budget_limit REAL,
      discount_rate REAL DEFAULT 0,
      non_billable_items TEXT,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (partner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      rate_amount REAL NOT NULL,
      effective_date DATE NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS time_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      matter_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      hours REAL NOT NULL,
      is_billable INTEGER DEFAULT 1,
      rate_amount REAL,
      status TEXT DEFAULT 'pending',
      reviewer_id INTEGER,
      review_notes TEXT,
      reviewed_at DATETIME,
      invoice_id INTEGER,
      attachments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (matter_id) REFERENCES matters(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      client_id INTEGER NOT NULL,
      matter_id INTEGER,
      total_hours REAL DEFAULT 0,
      time_fee REAL DEFAULT 0,
      fixed_fee REAL DEFAULT 0,
      advance_fee REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'draft',
      client_confirmed_at DATETIME,
      invoiced_at DATETIME,
      paid_amount REAL DEFAULT 0,
      paid_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (matter_id) REFERENCES matters(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date DATE NOT NULL,
      payment_method TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const insertUser = db.prepare('INSERT INTO users (username, name, role) VALUES (?, ?, ?)');
    insertUser.run('admin', '管理员', 'admin');
    insertUser.run('partner1', '张合伙人', 'partner');
    insertUser.run('lawyer1', '李律师', 'lawyer');
    insertUser.run('assistant1', '王助理', 'assistant');
    insertUser.run('finance1', '赵财务', 'finance');

    const insertRate = db.prepare('INSERT INTO rates (user_id, rate_amount, effective_date) VALUES (?, ?, ?)');
    insertRate.run(2, 800, '2024-01-01');
    insertRate.run(3, 500, '2024-01-01');
    insertRate.run(4, 200, '2024-01-01');
  }
};

module.exports = { db, initTables };
