const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../../data/app.sqlite');

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('已连接到 SQLite 数据库');
    initTables();
  }
});

function initTables() {
  db.serialize(() => {
    db.run(`PRAGMA foreign_keys = ON`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'developer',
      name TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      environment TEXT NOT NULL DEFAULT 'dev',
      version TEXT NOT NULL DEFAULT '1.0.0',
      owner_id INTEGER,
      status TEXT NOT NULL DEFAULT 'active',
      api_key TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS mask_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      rule_type TEXT NOT NULL,
      pattern TEXT NOT NULL,
      replacement TEXT NOT NULL DEFAULT '***',
      version INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT UNIQUE NOT NULL,
      app_id INTEGER NOT NULL,
      rule_version INTEGER NOT NULL,
      operation_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT NOT NULL DEFAULT 'medium',
      requested_by INTEGER NOT NULL,
      approved_by INTEGER,
      executed_by INTEGER,
      input_data TEXT,
      output_data TEXT,
      error_message TEXT,
      remark TEXT,
      scheduled_at DATETIME,
      started_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (requested_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id),
      FOREIGN KEY (executed_by) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS call_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id TEXT UNIQUE NOT NULL,
      app_id INTEGER NOT NULL,
      task_id INTEGER,
      api_key TEXT NOT NULL,
      operation_type TEXT NOT NULL,
      request_method TEXT NOT NULL,
      request_path TEXT NOT NULL,
      request_body TEXT,
      response_status INTEGER NOT NULL,
      response_body TEXT,
      original_content TEXT,
      masked_content TEXT,
      processed_count INTEGER DEFAULT 0,
      error_message TEXT,
      client_ip TEXT,
      duration_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS change_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT UNIQUE NOT NULL,
      app_id INTEGER NOT NULL,
      change_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      old_value TEXT,
      new_value TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_by INTEGER NOT NULL,
      approved_by INTEGER,
      risk_level TEXT NOT NULL DEFAULT 'low',
      rollback_plan TEXT,
      executed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id TEXT UNIQUE NOT NULL,
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'warning',
      title TEXT NOT NULL,
      message TEXT,
      app_id INTEGER,
      task_id INTEGER,
      call_log_id INTEGER,
      status TEXT NOT NULL DEFAULT 'open',
      handled_by INTEGER,
      handled_at DATETIME,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (call_log_id) REFERENCES call_logs(id),
      FOREIGN KEY (handled_by) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      app_id INTEGER NOT NULL,
      permission_type TEXT NOT NULL,
      granted_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (granted_by) REFERENCES users(id),
      UNIQUE(user_id, app_id, permission_type)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_id TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    insertInitialData();
  });
}

function insertInitialData() {
  const bcrypt = require('bcryptjs');
  const defaultPassword = bcrypt.hashSync('admin123', 10);

  db.get(`SELECT COUNT(*) as count FROM users`, (err, row) => {
    if (row.count === 0) {
      db.run(`INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)`,
        ['admin', defaultPassword, 'admin', '系统管理员', 'admin@example.com']);
      db.run(`INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)`,
        ['devops', defaultPassword, 'ops', '运维工程师', 'devops@example.com']);
      db.run(`INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)`,
        ['developer', defaultPassword, 'developer', '开发人员', 'dev@example.com']);
      db.run(`INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)`,
        ['security', defaultPassword, 'security', '安全管理员', 'sec@example.com']);
      db.run(`INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)`,
        ['appowner', defaultPassword, 'appowner', '应用负责人', 'owner@example.com']);
    }
  });
}

module.exports = {
  db,
  run: (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  }),
  get: (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }),
  all: (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  })
};
