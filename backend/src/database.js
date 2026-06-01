const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  const createTables = `
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      owner TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS environments (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_versions (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      version TEXT NOT NULL,
      description TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS secrets (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      env_id TEXT NOT NULL,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (app_id) REFERENCES applications(id) ON DELETE CASCADE,
      FOREIGN KEY (env_id) REFERENCES environments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      env_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      cron_expr TEXT,
      command TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS executions (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TEXT DEFAULT CURRENT_TIMESTAMP,
      ended_at TEXT,
      result TEXT,
      error_log TEXT,
      created_by TEXT,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS call_logs (
      id TEXT PRIMARY KEY,
      execution_id TEXT NOT NULL,
      api_name TEXT NOT NULL,
      request_data TEXT,
      response_data TEXT,
      status TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS change_orders (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      status TEXT DEFAULT 'draft',
      created_by TEXT NOT NULL,
      reviewed_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      submitted_at TEXT,
      reviewed_at TEXT,
      reason TEXT
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      app_id TEXT,
      task_id TEXT,
      type TEXT NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      resolution TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      app_id TEXT,
      role TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.exec(createTables);

  const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='applications'");
  const tableExists = stmt.get();
  
  if (!tableExists || !db.prepare('SELECT COUNT(*) as count FROM applications').get().count) {
    seedData();
  }
}

function seedData() {
  const { v4: uuidv4 } = require('uuid');

  const appId = uuidv4();
  const envDevId = uuidv4();
  const envProdId = uuidv4();
  const taskId = uuidv4();

  const insertApp = db.prepare(`
    INSERT INTO applications (id, name, description, owner, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertApp.run(appId, '订单处理系统', '核心订单处理微服务', 'zhangsan', 'active');

  const insertEnv = db.prepare(`
    INSERT INTO environments (id, app_id, name, type, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertEnv.run(envDevId, appId, '开发环境', 'dev', 'active');
  insertEnv.run(envProdId, appId, '生产环境', 'prod', 'active');

  const insertTask = db.prepare(`
    INSERT INTO tasks (id, app_id, env_id, name, type, cron_expr, command, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTask.run(taskId, appId, envDevId, '每日订单统计', 'cron', '0 0 2 * * *', 'node scripts/daily-stats.js', 'active', 'admin');

  const insertPerm = db.prepare(`
    INSERT INTO permissions (id, user_id, app_id, role)
    VALUES (?, ?, ?, ?)
  `);
  insertPerm.run(uuidv4(), 'admin', null, 'admin');
  insertPerm.run(uuidv4(), 'zhangsan', appId, 'owner');
  insertPerm.run(uuidv4(), 'lisi', appId, 'developer');

  console.log('数据库初始化完成，已插入示例数据');
}

initDatabase();

module.exports = db;
