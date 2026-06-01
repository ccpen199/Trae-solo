const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'accountant', 'manager', 'client')),
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      tax_id TEXT UNIQUE,
      contact_person TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      contract_start_date DATE,
      contract_end_date DATE,
      tax_types TEXT,
      invoice_scale INTEGER DEFAULT 0,
      service_package TEXT,
      delivery_habit TEXT,
      assigned_accountant_id INTEGER,
      risk_level TEXT DEFAULT 'normal' CHECK(risk_level IN ('normal', 'medium', 'high')),
      risk_notes TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'pending')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_accountant_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('invoice', 'bank', 'salary', 'expense')),
      file_name TEXT,
      file_path TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'received', 'verified', 'rejected')),
      notes TEXT,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS missing_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      reminder_sent BOOLEAN DEFAULT 0,
      todo_created BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS accounting_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      voucher_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'processing' CHECK(status IN ('processing', 'completed', 'reviewed')),
      handled_by INTEGER,
      reviewed_by INTEGER,
      review_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (handled_by) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tax_declarations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      tax_type TEXT NOT NULL,
      tax_amount DECIMAL(15,2) DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'submitted', 'success', 'failed', 'overdue')),
      declaration_date DATE,
      handled_by INTEGER,
      reviewed_by INTEGER,
      review_notes TEXT,
      is_overdue BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (handled_by) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS monthly_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      revenue DECIMAL(15,2) DEFAULT 0,
      cost DECIMAL(15,2) DEFAULT 0,
      profit DECIMAL(15,2) DEFAULT 0,
      tax_amount DECIMAL(15,2) DEFAULT 0,
      voucher_count INTEGER DEFAULT 0,
      content TEXT,
      sent_at DATETIME,
      read_at DATETIME,
      is_read BOOLEAN DEFAULT 0,
      client_feedback TEXT,
      renewal_opportunity TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS renewals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      contract_end_date DATE NOT NULL,
      reminder_sent BOOLEAN DEFAULT 0,
      reminder_date DATE,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'renewed', 'lost')),
      renewed_date DATE,
      new_contract_end_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      related_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      assignee_id INTEGER,
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
      due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assignee_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      related_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, role, name, phone, email)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('admin', hash, 'admin', '系统管理员', '13800138000', 'admin@example.com');
    insertUser.run('accountant1', hash, 'accountant', '张会计', '13800138001', 'zhang@example.com');
    insertUser.run('manager1', hash, 'manager', '李主管', '13800138002', 'li@example.com');
    insertUser.run('client1', hash, 'client', '客户A企业', '13800138003', 'client@example.com');

    const insertClient = db.prepare(`
      INSERT INTO clients (company_name, tax_id, contact_person, contact_phone, 
        contract_start_date, contract_end_date, tax_types, invoice_scale, 
        service_package, assigned_accountant_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertClient.run(
      '测试科技有限公司',
      '91110000123456789X',
      '王总',
      '13900139000',
      '2024-01-01',
      '2025-01-01',
      '增值税,企业所得税,个人所得税',
      50,
      '标准套餐',
      2
    );
  }
};

initTables();

module.exports = db;
