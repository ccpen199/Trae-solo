const Database = require('better-sqlite3');
const path = require('path');

function initDatabase() {
  const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_code TEXT UNIQUE NOT NULL,
      app_name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      owner_id INTEGER,
      tech_stack TEXT,
      status TEXT DEFAULT 'active',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS environments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      env_name TEXT NOT NULL,
      env_type TEXT NOT NULL,
      server_address TEXT,
      status TEXT DEFAULT 'active',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      version_number TEXT NOT NULL,
      env_id INTEGER,
      release_notes TEXT,
      status TEXT DEFAULT 'draft',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (env_id) REFERENCES environments(id)
    );

    CREATE TABLE IF NOT EXISTS version_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id INTEGER NOT NULL,
      change_type TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_by INTEGER,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (version_id) REFERENCES versions(id)
    );

    CREATE TABLE IF NOT EXISTS secrets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      env_id INTEGER,
      secret_name TEXT NOT NULL,
      secret_type TEXT NOT NULL,
      secret_value TEXT NOT NULL,
      encrypted INTEGER DEFAULT 1,
      valid_from DATETIME,
      valid_until DATETIME,
      status TEXT DEFAULT 'active',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS change_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      app_id INTEGER,
      env_id INTEGER,
      content TEXT,
      status TEXT DEFAULT 'created',
      priority TEXT DEFAULT 'medium',
      created_by INTEGER,
      submitted_by INTEGER,
      executed_by INTEGER,
      reviewed_by INTEGER,
      closed_by INTEGER,
      create_reason TEXT,
      submit_reason TEXT,
      execute_reason TEXT,
      review_reason TEXT,
      reject_reason TEXT,
      close_reason TEXT,
      scheduled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      submitted_at DATETIME,
      executed_at DATETIME,
      reviewed_at DATETIME,
      closed_at DATETIME,
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (env_id) REFERENCES environments(id)
    );

    CREATE TABLE IF NOT EXISTS execution_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_no TEXT UNIQUE NOT NULL,
      change_order_id INTEGER,
      task_type TEXT NOT NULL,
      target TEXT NOT NULL,
      parameters TEXT,
      status TEXT DEFAULT 'pending',
      result TEXT,
      started_at DATETIME,
      completed_at DATETIME,
      executed_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (change_order_id) REFERENCES change_orders(id)
    );

    CREATE TABLE IF NOT EXISTS call_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      api_name TEXT NOT NULL,
      method TEXT,
      request_url TEXT,
      request_body TEXT,
      response_status INTEGER,
      response_body TEXT,
      duration_ms INTEGER,
      called_by INTEGER,
      called_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES execution_tasks(id)
    );

    CREATE TABLE IF NOT EXISTS alarm_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alarm_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      source TEXT NOT NULL,
      message TEXT NOT NULL,
      related_id INTEGER,
      related_type TEXT,
      handle_result TEXT,
      handled_by INTEGER,
      handled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      operation TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      related_type TEXT NOT NULL,
      related_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS classification_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_name TEXT UNIQUE NOT NULL,
      rule_type TEXT NOT NULL,
      pattern TEXT,
      priority INTEGER DEFAULT 0,
      owner_id INTEGER,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id INTEGER,
      action TEXT NOT NULL,
      granted_by INTEGER,
      valid_from DATETIME,
      valid_until DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permission_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id INTEGER,
      action TEXT NOT NULL,
      allowed INTEGER NOT NULL,
      reason TEXT,
      audited_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const insertUser = db.prepare('INSERT INTO users (username, name, role, email) VALUES (?, ?, ?, ?)');
    insertUser.run('admin', '系统管理员', 'admin', 'admin@example.com');
    insertUser.run('engineer', '平台工程师', 'engineer', 'engineer@example.com');
    insertUser.run('operator', '运维人员', 'operator', 'operator@example.com');
    insertUser.run('developer', '开发者', 'developer', 'developer@example.com');
    insertUser.run('appowner', '应用负责人', 'appowner', 'appowner@example.com');
    insertUser.run('security', '安全管理员', 'security', 'security@example.com');
  }

  return db;
}

module.exports = { initDatabase };
