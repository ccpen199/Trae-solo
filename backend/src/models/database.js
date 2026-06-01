const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      permissions TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      real_name TEXT NOT NULL,
      role_id INTEGER NOT NULL,
      email TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      owner_id INTEGER,
      status TEXT DEFAULT 'development',
      callback_urls TEXT,
      logout_urls TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS environments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      base_url TEXT,
      status TEXT DEFAULT 'active',
      config TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id),
      UNIQUE(app_id, name)
    );

    CREATE TABLE IF NOT EXISTS app_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      version TEXT NOT NULL,
      description TEXT,
      changelog TEXT,
      status TEXT DEFAULT 'pending',
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS secrets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      env_id INTEGER NOT NULL,
      secret_type TEXT NOT NULL,
      secret_key TEXT NOT NULL,
      secret_value TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      expires_at DATETIME,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE,
      FOREIGN KEY (env_id) REFERENCES environments(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS change_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      change_no TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      app_id INTEGER,
      env_id INTEGER,
      status TEXT DEFAULT 'pending',
      reason TEXT NOT NULL,
      impact TEXT,
      recovery_path TEXT,
      created_by INTEGER NOT NULL,
      approved_by INTEGER,
      approved_at DATETIME,
      executed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (env_id) REFERENCES environments(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS execution_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT UNIQUE NOT NULL,
      change_order_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      app_id INTEGER,
      env_id INTEGER,
      status TEXT DEFAULT 'pending',
      params TEXT,
      result TEXT,
      error_message TEXT,
      started_at DATETIME,
      completed_at DATETIME,
      created_by INTEGER NOT NULL,
      executed_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (change_order_id) REFERENCES change_orders(id),
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (env_id) REFERENCES environments(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (executed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS call_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id TEXT UNIQUE NOT NULL,
      app_id INTEGER,
      env_id INTEGER,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      status_code INTEGER,
      request_params TEXT,
      response_body TEXT,
      duration INTEGER,
      client_ip TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (env_id) REFERENCES environments(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      level TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      app_id INTEGER,
      env_id INTEGER,
      status TEXT DEFAULT 'open',
      assignee_id INTEGER,
      suggested_action TEXT,
      close_reason TEXT,
      closed_by INTEGER,
      closed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (env_id) REFERENCES environments(id),
      FOREIGN KEY (assignee_id) REFERENCES users(id),
      FOREIGN KEY (closed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS recovery_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id TEXT UNIQUE NOT NULL,
      change_order_id INTEGER,
      task_id INTEGER,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      before_state TEXT,
      after_state TEXT,
      recovered_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (change_order_id) REFERENCES change_orders(id),
      FOREIGN KEY (task_id) REFERENCES execution_tasks(id),
      FOREIGN KEY (recovered_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_applications_owner ON applications(owner_id);
    CREATE INDEX IF NOT EXISTS idx_environments_app ON environments(app_id);
    CREATE INDEX IF NOT EXISTS idx_secrets_app_env ON secrets(app_id, env_id);
    CREATE INDEX IF NOT EXISTS idx_change_orders_app ON change_orders(app_id);
    CREATE INDEX IF NOT EXISTS idx_execution_tasks_app ON execution_tasks(app_id);
    CREATE INDEX IF NOT EXISTS idx_call_logs_app_time ON call_logs(app_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON audit_logs(user_id, created_at);
  `);

  const roleCount = db.prepare('SELECT COUNT(*) as count FROM roles').get().count;
  if (roleCount === 0) {
    const insertRole = db.prepare('INSERT INTO roles (name, description, permissions) VALUES (?, ?, ?)');
    insertRole.run('platform_engineer', '平台工程师', '["app:*","env:*","secret:*","change:*","task:*","audit:*","alert:*","user:*"]');
    insertRole.run('operator', '运维工程师', '["env:*","task:*","alert:*","log:*"]');
    insertRole.run('developer', '开发者', '["app:read","app:write","env:read","secret:read"]');
    insertRole.run('app_owner', '应用负责人', '["app:*","env:*","secret:*","change:*","audit:read"]');
    insertRole.run('security_admin', '安全管理员', '["audit:*","secret:*","alert:*","user:read"]');
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const password = bcrypt.hashSync('Admin@123', 10);
    const insertUser = db.prepare('INSERT INTO users (username, password, real_name, role_id, email) VALUES (?, ?, ?, ?, ?)');
    insertUser.run('admin', password, '系统管理员', 1, 'admin@sso.local');
    insertUser.run('operator', password, '运维小张', 2, 'operator@sso.local');
    insertUser.run('developer', password, '开发小李', 3, 'developer@sso.local');
    insertUser.run('owner', password, '应用负责人小王', 4, 'owner@sso.local');
    insertUser.run('security', password, '安全管理员', 5, 'security@sso.local');
  }
}

initDatabase();

module.exports = db;
