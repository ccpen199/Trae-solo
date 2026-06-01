const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('platform_engineer', 'ops', 'developer', 'app_owner', 'security_admin')),
      name TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      owner_id INTEGER REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'deprecated')),
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS environments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      env_id TEXT UNIQUE NOT NULL,
      app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('dev', 'test', 'staging', 'prod')),
      base_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'maintenance')),
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS app_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id TEXT UNIQUE NOT NULL,
      app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
      version TEXT NOT NULL,
      commit_hash TEXT,
      changelog TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'deployed', 'rolled_back')),
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_id TEXT UNIQUE NOT NULL,
      app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
      env_id INTEGER REFERENCES environments(id) ON DELETE CASCADE,
      key_value TEXT NOT NULL,
      name TEXT NOT NULL,
      permissions TEXT,
      expires_at DATETIME,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'expired', 'revoked')),
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stress_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT UNIQUE NOT NULL,
      app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
      env_id INTEGER REFERENCES environments(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      api_endpoint TEXT NOT NULL,
      method TEXT NOT NULL DEFAULT 'GET' CHECK(method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
      headers TEXT,
      body TEXT,
      concurrency INTEGER NOT NULL DEFAULT 10,
      requests INTEGER NOT NULL DEFAULT 100,
      duration INTEGER,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
      result TEXT,
      scheduled_at DATETIME,
      started_at DATETIME,
      completed_at DATETIME,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS call_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id TEXT UNIQUE NOT NULL,
      task_id INTEGER REFERENCES stress_tasks(id) ON DELETE CASCADE,
      app_id INTEGER REFERENCES applications(id),
      env_id INTEGER REFERENCES environments(id),
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      status_code INTEGER,
      response_time INTEGER,
      request_headers TEXT,
      request_body TEXT,
      response_headers TEXT,
      response_body TEXT,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS change_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('config', 'deployment', 'key_rotation', 'access', 'emergency')),
      title TEXT NOT NULL,
      description TEXT,
      app_id INTEGER REFERENCES applications(id),
      env_id INTEGER REFERENCES environments(id),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'pending_approval', 'approved', 'rejected', 'executing', 'completed', 'rolled_back', 'cancelled')),
      reason TEXT NOT NULL,
      impact TEXT,
      recovery_path TEXT,
      requested_by INTEGER REFERENCES users(id),
      approved_by INTEGER REFERENCES users(id),
      executed_by INTEGER REFERENCES users(id),
      executed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('duplicate_execution', 'permission_escalation', 'config_misuse', 'task_failure', 'data_leak', 'system_error')),
      severity TEXT NOT NULL CHECK(severity IN ('critical', 'high', 'medium', 'low')),
      title TEXT NOT NULL,
      description TEXT,
      app_id INTEGER REFERENCES applications(id),
      task_id INTEGER REFERENCES stress_tasks(id),
      order_id INTEGER REFERENCES change_orders(id),
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'acknowledged', 'resolved', 'closed')),
      responsible_user_id INTEGER REFERENCES users(id),
      suggested_action TEXT,
      closure_basis TEXT,
      acknowledged_by INTEGER REFERENCES users(id),
      acknowledged_at DATETIME,
      resolved_by INTEGER REFERENCES users(id),
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_id TEXT UNIQUE NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      user_id INTEGER REFERENCES users(id),
      old_value TEXT,
      new_value TEXT,
      reason TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
      permission_type TEXT NOT NULL CHECK(permission_type IN ('read', 'write', 'execute', 'admin')),
      granted_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, app_id, permission_type)
    );

    CREATE INDEX IF NOT EXISTS idx_applications_owner ON applications(owner_id);
    CREATE INDEX IF NOT EXISTS idx_environments_app ON environments(app_id);
    CREATE INDEX IF NOT EXISTS idx_stress_tasks_app ON stress_tasks(app_id);
    CREATE INDEX IF NOT EXISTS idx_stress_tasks_env ON stress_tasks(env_id);
    CREATE INDEX IF NOT EXISTS idx_call_logs_task ON call_logs(task_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_change_orders_app ON change_orders(app_id);
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, role, name, email)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertUser.run('admin', defaultPassword, 'platform_engineer', '系统管理员', 'admin@example.com');
    insertUser.run('ops_user', defaultPassword, 'ops', '运维工程师', 'ops@example.com');
    insertUser.run('dev_user', defaultPassword, 'developer', '开发者', 'dev@example.com');
    insertUser.run('owner_user', defaultPassword, 'app_owner', '应用负责人', 'owner@example.com');
    insertUser.run('sec_user', defaultPassword, 'security_admin', '安全管理员', 'sec@example.com');
  }
};

module.exports = { db, initDatabase };
