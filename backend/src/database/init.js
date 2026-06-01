require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || './data/ssl_manager.db';
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const init = () => {
  console.log('初始化数据库...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      root_domain TEXT NOT NULL,
      sub_domain TEXT DEFAULT '@',
      full_domain TEXT NOT NULL,
      business_owner TEXT,
      dns_provider TEXT,
      cert_type TEXT DEFAULT 'DV',
      contact_person TEXT,
      contact_email TEXT,
      priority_level TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(root_domain, sub_domain)
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id INTEGER,
      ca_provider TEXT NOT NULL,
      serial_number TEXT UNIQUE,
      common_name TEXT NOT NULL,
      san_list TEXT,
      key_storage TEXT,
      deploy_locations TEXT,
      auto_renew INTEGER DEFAULT 0,
      issue_date DATETIME,
      expiry_date DATETIME,
      algorithm TEXT DEFAULT 'RSA-2048',
      status TEXT DEFAULT 'valid',
      cert_content TEXT,
      private_key_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS renewal_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cert_id INTEGER,
      domain_id INTEGER,
      task_type TEXT NOT NULL,
      trigger_days INTEGER,
      status TEXT DEFAULT 'pending',
      validation_status TEXT DEFAULT 'pending',
      issue_status TEXT DEFAULT 'pending',
      deploy_status TEXT DEFAULT 'pending',
      verify_status TEXT DEFAULT 'pending',
      assignee TEXT,
      due_date DATETIME,
      completed_at DATETIME,
      failure_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cert_id) REFERENCES certificates(id) ON DELETE CASCADE,
      FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS change_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain_id INTEGER,
      cert_id INTEGER,
      task_id INTEGER,
      change_type TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT,
      old_value TEXT,
      new_value TEXT,
      operator TEXT,
      screenshot_path TEXT,
      rollback_action TEXT,
      status TEXT DEFAULT 'success',
      failure_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL,
      FOREIGN KEY (cert_id) REFERENCES certificates(id) ON DELETE SET NULL,
      FOREIGN KEY (task_id) REFERENCES renewal_tasks(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      level TEXT NOT NULL,
      domain_id INTEGER,
      cert_id INTEGER,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
      FOREIGN KEY (cert_id) REFERENCES certificates(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_certs_expiry ON certificates(expiry_date);
    CREATE INDEX IF NOT EXISTS idx_domains_full ON domains(full_domain);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON renewal_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_logs_type ON change_logs(change_type);
  `);

  const bcrypt = require('bcryptjs');
  const adminPassword = bcrypt.hashSync('admin123', 10);
  
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO users (username, password, role, email)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run('admin', adminPassword, 'admin', 'admin@example.com');

  console.log('数据库初始化完成！');
  console.log('默认管理员账号: admin / admin123');
};

init();
db.close();
