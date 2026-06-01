const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      owner_id TEXT NOT NULL,
      tech_stack TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS environments (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (app_id) REFERENCES applications(id),
      UNIQUE(app_id, name)
    );

    CREATE TABLE IF NOT EXISTS config_versions (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      env_id TEXT NOT NULL,
      version TEXT NOT NULL,
      config_content TEXT NOT NULL,
      config_type TEXT DEFAULT 'json',
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      comment TEXT,
      status TEXT DEFAULT 'draft',
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (env_id) REFERENCES environments(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS config_keys (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      env_id TEXT NOT NULL,
      key_name TEXT NOT NULL,
      key_value TEXT NOT NULL,
      is_secret INTEGER DEFAULT 0,
      version_id TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (env_id) REFERENCES environments(id),
      FOREIGN KEY (version_id) REFERENCES config_versions(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS execution_tasks (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      env_id TEXT NOT NULL,
      version_id TEXT NOT NULL,
      task_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      reason TEXT NOT NULL,
      gray_strategy TEXT NOT NULL,
      gray_percentage INTEGER DEFAULT 0,
      created_by TEXT NOT NULL,
      approved_by TEXT,
      executed_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      scheduled_at TEXT,
      started_at TEXT,
      completed_at TEXT,
      status TEXT DEFAULT 'pending',
      rollback_path TEXT,
      impact_scope TEXT,
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (env_id) REFERENCES environments(id),
      FOREIGN KEY (version_id) REFERENCES config_versions(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id),
      FOREIGN KEY (executed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS task_execution_logs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      action TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      details TEXT,
      before_state TEXT,
      after_state TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES execution_tasks(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS change_orders (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      app_id TEXT,
      task_id TEXT,
      created_by TEXT NOT NULL,
      approved_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      approved_at TEXT,
      status TEXT DEFAULT 'draft',
      risk_level TEXT DEFAULT 'medium',
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (task_id) REFERENCES execution_tasks(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      level TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      task_id TEXT,
      app_id TEXT,
      responsible_id TEXT,
      suggested_action TEXT,
      close_reason TEXT,
      closed_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      closed_at TEXT,
      status TEXT DEFAULT 'open',
      FOREIGN KEY (task_id) REFERENCES execution_tasks(id),
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (responsible_id) REFERENCES users(id),
      FOREIGN KEY (closed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS api_call_logs (
      id TEXT PRIMARY KEY,
      app_id TEXT,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      request_params TEXT,
      response_status INTEGER,
      duration INTEGER,
      caller_ip TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      app_id TEXT,
      resource_type TEXT NOT NULL,
      action TEXT NOT NULL,
      granted_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (app_id) REFERENCES applications(id),
      FOREIGN KEY (granted_by) REFERENCES users(id),
      UNIQUE(user_id, app_id, resource_type, action)
    );
  `);

  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');
  
  const adminId = uuidv4();
  const devId = uuidv4();
  const opsId = uuidv4();
  const ownerId = uuidv4();
  const securityId = uuidv4();

  const checkUser = db.prepare('SELECT COUNT(*) as count FROM users');
  const userCount = checkUser.get();
  
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password, role, name, email)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(adminId, 'admin', bcrypt.hashSync('admin123', 10), 'admin', '系统管理员', 'admin@example.com');
    insertUser.run(devId, 'developer', bcrypt.hashSync('dev123', 10), 'developer', '张三', 'zhangsan@example.com');
    insertUser.run(opsId, 'operator', bcrypt.hashSync('ops123', 10), 'operator', '李四', 'lisi@example.com');
    insertUser.run(ownerId, 'owner', bcrypt.hashSync('owner123', 10), 'owner', '王五', 'wangwu@example.com');
    insertUser.run(securityId, 'security', bcrypt.hashSync('sec123', 10), 'security', '赵六', 'zhaoliu@example.com');

    const appId1 = uuidv4();
    const appId2 = uuidv4();
    
    const insertApp = db.prepare(`
      INSERT INTO applications (id, name, code, description, owner_id, tech_stack)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertApp.run(appId1, '用户中心服务', 'user-center', '用户认证与管理服务', ownerId, 'Node.js');
    insertApp.run(appId2, '订单服务', 'order-service', '订单处理与管理服务', ownerId, 'Java');

    const envId1 = uuidv4();
    const envId2 = uuidv4();
    const envId3 = uuidv4();
    const envId4 = uuidv4();
    
    const insertEnv = db.prepare(`
      INSERT INTO environments (id, app_id, name, description)
      VALUES (?, ?, ?, ?)
    `);
    insertEnv.run(envId1, appId1, '开发环境', '开发人员日常开发使用');
    insertEnv.run(envId2, appId1, '生产环境', '线上正式运行环境');
    insertEnv.run(envId3, appId2, '开发环境', '开发人员日常开发使用');
    insertEnv.run(envId4, appId2, '生产环境', '线上正式运行环境');

    const insertPerm = db.prepare(`
      INSERT INTO permissions (id, user_id, app_id, resource_type, action, granted_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertPerm.run(uuidv4(), devId, appId1, 'config', 'read', adminId);
    insertPerm.run(uuidv4(), devId, appId1, 'config', 'write', adminId);
    insertPerm.run(uuidv4(), opsId, appId1, 'task', 'execute', adminId);
    insertPerm.run(uuidv4(), opsId, appId2, 'task', 'execute', adminId);
  }
};

initDatabase();

module.exports = db;
