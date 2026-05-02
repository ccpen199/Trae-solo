const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 确保数据目录存在
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

// 启用外键约束
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 初始化数据库表
function initDatabase() {
  // 1. 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL, -- developer, tester, ops, release_manager
      email TEXT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. 部署环境表
  db.exec(`
    CREATE TABLE IF NOT EXISTS environments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      environment_type TEXT NOT NULL, -- dev, test, staging, prod
      config TEXT, -- JSON 格式的环境配置
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. 流水线表
  db.exec(`
    CREATE TABLE IF NOT EXISTS pipelines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      project_name TEXT NOT NULL,
      repo_url TEXT,
      branch TEXT DEFAULT 'main',
      status TEXT DEFAULT 'draft', -- draft, active, paused, archived
      stages TEXT, -- JSON 格式的阶段配置: [{name, order, type}]
      created_by TEXT NOT NULL,
      is_locked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 4. 变量表（支持并发锁定）
  db.exec(`
    CREATE TABLE IF NOT EXISTS variables (
      id TEXT PRIMARY KEY,
      pipeline_id TEXT NOT NULL,
      environment_id TEXT,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      variable_type TEXT DEFAULT 'string', -- string, secret, number, boolean
      is_secret INTEGER DEFAULT 0,
      is_locked INTEGER DEFAULT 0, -- 锁定标志，防止并发修改
      locked_by TEXT,
      locked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pipeline_id) REFERENCES pipelines(id),
      FOREIGN KEY (environment_id) REFERENCES environments(id),
      FOREIGN KEY (locked_by) REFERENCES users(id),
      UNIQUE(pipeline_id, environment_id, key)
    )
  `);

  // 5. 主单表（CI/CD 主流程单）
  db.exec(`
    CREATE TABLE IF NOT EXISTS main_orders (
      id TEXT PRIMARY KEY,
      order_no TEXT NOT NULL UNIQUE, -- 主单号，如 CI202405010001
      pipeline_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      commit_hash TEXT,
      commit_message TEXT,
      attachments TEXT, -- JSON 格式附件列表
      status TEXT NOT NULL, -- pending_code, pending_trigger, pending_build, pending_deploy, pending_monitor, completed, failed, rolled_back
      current_stage TEXT,
      assignee_id TEXT, -- 当前责任人
      creator_id TEXT NOT NULL,
      expected_completion_at DATETIME,
      started_at DATETIME,
      completed_at DATETIME,
      total_duration INTEGER, -- 秒
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pipeline_id) REFERENCES pipelines(id),
      FOREIGN KEY (assignee_id) REFERENCES users(id),
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);

  // 6. 明细表（流程节点明细）
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      main_order_id TEXT NOT NULL,
      item_no TEXT NOT NULL, -- 明细单号
      stage_name TEXT NOT NULL, -- 阶段名称: code_submit, trigger, build_test, deploy, monitor
      stage_order INTEGER NOT NULL,
      status TEXT NOT NULL, -- pending, in_progress, completed, failed, skipped
      assignee_id TEXT,
      started_at DATETIME,
      completed_at DATETIME,
      duration INTEGER, -- 秒
      result_data TEXT, -- JSON 格式的结果数据
      error_message TEXT,
      retry_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id),
      FOREIGN KEY (assignee_id) REFERENCES users(id)
    )
  `);

  // 7. 构建任务表
  db.exec(`
    CREATE TABLE IF NOT EXISTS build_tasks (
      id TEXT PRIMARY KEY,
      order_item_id TEXT NOT NULL,
      pipeline_id TEXT NOT NULL,
      build_number INTEGER NOT NULL,
      commit_hash TEXT,
      branch TEXT,
      status TEXT NOT NULL, -- pending, running, success, failed, cancelled
      build_type TEXT, -- full, incremental
      config TEXT, -- JSON 构建配置
      log_path TEXT,
      started_at DATETIME,
      completed_at DATETIME,
      duration INTEGER,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_item_id) REFERENCES order_items(id),
      FOREIGN KEY (pipeline_id) REFERENCES pipelines(id)
    )
  `);

  // 8. 制品表
  db.exec(`
    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      build_task_id TEXT NOT NULL,
      name TEXT NOT NULL,
      artifact_type TEXT NOT NULL, -- jar, war, docker, npm, zip
      version TEXT NOT NULL,
      file_path TEXT,
      file_size INTEGER,
      checksum TEXT,
      storage_type TEXT DEFAULT 'local',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (build_task_id) REFERENCES build_tasks(id)
    )
  `);

  // 9. 操作日志表
  db.exec(`
    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL, -- create, update, delete, trigger, approve, reject, rollback, retry
      module TEXT NOT NULL, -- pipeline, order, build, deploy, variable, environment
      record_id TEXT NOT NULL,
      old_value TEXT, -- JSON
      new_value TEXT, -- JSON
      description TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 10. 消息待办表
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      main_order_id TEXT,
      order_item_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      todo_type TEXT NOT NULL, -- approval, notification, task, warning
      status TEXT DEFAULT 'pending', -- pending, read, completed, dismissed
      priority TEXT DEFAULT 'medium', -- low, medium, high, critical
      due_at DATETIME,
      action_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id),
      FOREIGN KEY (order_item_id) REFERENCES order_items(id)
    )
  `);

  // 11. 时间轴表
  db.exec(`
    CREATE TABLE IF NOT EXISTS timeline (
      id TEXT PRIMARY KEY,
      main_order_id TEXT NOT NULL,
      order_item_id TEXT,
      actor_id TEXT,
      actor_name TEXT,
      action TEXT NOT NULL,
      action_text TEXT NOT NULL,
      details TEXT, -- JSON 格式的详细信息
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id),
      FOREIGN KEY (order_item_id) REFERENCES order_items(id),
      FOREIGN KEY (actor_id) REFERENCES users(id)
    )
  `);

  // 12. 审批记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      main_order_id TEXT NOT NULL,
      order_item_id TEXT,
      approver_id TEXT NOT NULL,
      approval_type TEXT NOT NULL, -- deploy, rollback, retry, config_change
      decision TEXT NOT NULL, -- approve, reject, reassign, supplement
      comment TEXT,
      attachments TEXT, -- JSON
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id),
      FOREIGN KEY (order_item_id) REFERENCES order_items(id),
      FOREIGN KEY (approver_id) REFERENCES users(id)
    )
  `);

  // 创建索引以提高查询性能
  db.exec(`CREATE INDEX IF NOT EXISTS idx_main_orders_status ON main_orders(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_main_orders_assignee ON main_orders(assignee_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_main_orders_creator ON main_orders(creator_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_order_items_main ON order_items(main_order_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id, status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_timeline_order ON timeline(main_order_id, created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_logs_record ON operation_logs(module, record_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_variables_pipeline ON variables(pipeline_id, is_locked)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_build_tasks_pipeline ON build_tasks(pipeline_id, created_at DESC)`);
}

// 初始化默认数据
function initSeedData() {
  const { v4: uuidv4 } = require('uuid');
  const bcrypt = require('bcryptjs');

  // 检查是否已有数据
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log('已有初始数据，跳过初始化');
    return;
  }

  const saltRounds = 10;

  // 创建默认用户
  const users = [
    {
      id: uuidv4(),
      username: 'dev1',
      password: bcrypt.hashSync('123456', saltRounds),
      name: '开发人员一',
      role: 'developer',
      email: 'dev1@example.com'
    },
    {
      id: uuidv4(),
      username: 'test1',
      password: bcrypt.hashSync('123456', saltRounds),
      name: '测试人员一',
      role: 'tester',
      email: 'test1@example.com'
    },
    {
      id: uuidv4(),
      username: 'ops1',
      password: bcrypt.hashSync('123456', saltRounds),
      name: '运维人员一',
      role: 'ops',
      email: 'ops1@example.com'
    },
    {
      id: uuidv4(),
      username: 'rm1',
      password: bcrypt.hashSync('123456', saltRounds),
      name: '发布经理一',
      role: 'release_manager',
      email: 'rm1@example.com'
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password, name, role, email)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const user of users) {
    insertUser.run(user.id, user.username, user.password, user.name, user.role, user.email);
  }

  // 创建默认环境
  const environments = [
    {
      id: uuidv4(),
      name: '开发环境',
      environment_type: 'dev',
      description: '日常开发环境'
    },
    {
      id: uuidv4(),
      name: '测试环境',
      environment_type: 'test',
      description: '功能测试环境'
    },
    {
      id: uuidv4(),
      name: '预发布环境',
      environment_type: 'staging',
      description: '预发布验证环境'
    },
    {
      id: uuidv4(),
      name: '生产环境',
      environment_type: 'prod',
      description: '生产环境'
    }
  ];

  const insertEnv = db.prepare(`
    INSERT INTO environments (id, name, environment_type, description)
    VALUES (?, ?, ?, ?)
  `);

  for (const env of environments) {
    insertEnv.run(env.id, env.name, env.environment_type, env.description);
  }

  // 创建默认流水线
  const devUserId = users[0].id;
  const pipelineId = uuidv4();
  
  const insertPipeline = db.prepare(`
    INSERT INTO pipelines (id, name, project_name, stages, created_by, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const defaultStages = JSON.stringify([
    { name: '代码提交', stage_name: 'code_submit', order: 1, type: 'manual' },
    { name: '触发流水线', stage_name: 'trigger', order: 2, type: 'manual' },
    { name: '构建测试', stage_name: 'build_test', order: 3, type: 'auto' },
    { name: '部署', stage_name: 'deploy', order: 4, type: 'manual' },
    { name: '监控回滚', stage_name: 'monitor', order: 5, type: 'manual' }
  ]);

  insertPipeline.run(
    pipelineId,
    '默认CI/CD流水线',
    '示例项目',
    defaultStages,
    devUserId,
    'active'
  );

  console.log('初始数据创建完成');
  console.log('默认账号: dev1/test1/ops1/rm1, 密码: 123456');
}

module.exports = {
  db,
  initDatabase,
  initSeedData
};
