const sqlite3 = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = sqlite3(dbPath);

db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      id_card TEXT,
      phone TEXT,
      email TEXT,
      credit_problem_type TEXT NOT NULL,
      involved_institutions TEXT,
      overdue_reason TEXT,
      contract_file TEXT,
      fee_status TEXT DEFAULT 'pending',
      total_fee REAL DEFAULT 0,
      paid_fee REAL DEFAULT 0,
      contact_person TEXT,
      contact_phone TEXT,
      status TEXT DEFAULT 'active',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      material_type TEXT NOT NULL,
      material_name TEXT NOT NULL,
      file_path TEXT,
      status TEXT DEFAULT 'pending',
      audit_remark TEXT,
      audit_by INTEGER,
      audit_at DATETIME,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      remark TEXT,
      operator_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      before_screenshot TEXT,
      after_screenshot TEXT,
      institution_reply TEXT,
      service_conclusion TEXT,
      refund_status TEXT,
      final_balance REAL,
      closed_by INTEGER,
      closed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS todo_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date DATETIME,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE INDEX IF NOT EXISTS idx_customers_no ON customers(customer_no);
    CREATE INDEX IF NOT EXISTS idx_materials_customer ON materials(customer_id);
    CREATE INDEX IF NOT EXISTS idx_progress_customer ON progress(customer_id);
    CREATE INDEX IF NOT EXISTS idx_results_customer ON results(customer_id);
    CREATE INDEX IF NOT EXISTS idx_todo_status ON todo_items(status);
  `);

  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)')
      .run('admin', hash, 'admin', '系统管理员');
  }
}

module.exports = { db, initDatabase };
