const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

let db = null;
const DB_PATH = path.resolve(__dirname, '../../../data/app.sqlite');

const initDb = async () => {
  if (db) return db;

  const SQL = await initSqlJs();
  
  // 如果数据库文件存在，加载它
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // 初始化表结构
  initializeTables(db);
  
  // 初始化默认数据
  initializeDefaultData(db);

  // 保存数据库
  saveDatabase();

  return db;
};

const initializeTables = (db) => {
  // 用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      department TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      version INTEGER DEFAULT 1
    )
  `);

  // 岗位表
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 用户岗位关联表
  db.run(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (role_id) REFERENCES roles(id),
      UNIQUE(user_id, role_id)
    )
  `);

  // 权限表
  db.run(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      module TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 岗位权限关联表
  db.run(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id),
      FOREIGN KEY (permission_id) REFERENCES permissions(id),
      UNIQUE(role_id, permission_id)
    )
  `);

  // 主单表
  db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_no TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'draft',
      current_node TEXT DEFAULT 'collect',
      assignee_id INTEGER,
      reporter_id INTEGER,
      expected_finish_time DATETIME,
      attachments TEXT,
      version INTEGER DEFAULT 1,
      is_locked INTEGER DEFAULT 0,
      locked_by INTEGER,
      locked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assignee_id) REFERENCES users(id),
      FOREIGN KEY (reporter_id) REFERENCES users(id)
    )
  `);

  // 明细表
  db.run(`
    CREATE TABLE IF NOT EXISTS ticket_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      item_type TEXT NOT NULL,
      item_key TEXT NOT NULL,
      item_value TEXT,
      item_status TEXT DEFAULT 'pending',
      sequence INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    )
  `);

  // 指标表
  db.run(`
    CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER,
      name TEXT NOT NULL,
      code TEXT,
      category TEXT,
      metric_type TEXT NOT NULL,
      value TEXT,
      unit TEXT,
      threshold TEXT,
      description TEXT,
      source TEXT,
      collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      version INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    )
  `);

  // 日志表
  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER,
      log_level TEXT DEFAULT 'info',
      log_source TEXT,
      log_content TEXT NOT NULL,
      log_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_locked INTEGER DEFAULT 0,
      locked_by INTEGER,
      locked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    )
  `);

  // 告警规则表
  db.run(`
    CREATE TABLE IF NOT EXISTS alert_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      description TEXT,
      rule_type TEXT NOT NULL,
      metric_name TEXT,
      condition TEXT NOT NULL,
      threshold TEXT,
      duration INTEGER,
      severity TEXT DEFAULT 'warning',
      status INTEGER DEFAULT 1,
      is_dedup INTEGER DEFAULT 0,
      dedup_window INTEGER DEFAULT 300,
      dedup_key TEXT,
      version INTEGER DEFAULT 1,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 告警事件表
  db.run(`
    CREATE TABLE IF NOT EXISTS alert_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_rule_id INTEGER,
      ticket_id INTEGER,
      event_key TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      severity TEXT,
      status TEXT DEFAULT 'firing',
      metric_value TEXT,
      threshold TEXT,
      first_triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      dedup_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (alert_rule_id) REFERENCES alert_rules(id),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    )
  `);

  // 通知渠道表
  db.run(`
    CREATE TABLE IF NOT EXISTS notification_channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      channel_type TEXT NOT NULL,
      config TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 通知记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER,
      alert_event_id INTEGER,
      channel_id INTEGER,
      recipient_id INTEGER,
      recipient_type TEXT,
      title TEXT NOT NULL,
      content TEXT,
      status TEXT DEFAULT 'pending',
      send_count INTEGER DEFAULT 0,
      last_send_at DATETIME,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (alert_event_id) REFERENCES alert_events(id),
      FOREIGN KEY (channel_id) REFERENCES notification_channels(id),
      FOREIGN KEY (recipient_id) REFERENCES users(id)
    )
  `);

  // 消息表（待办）
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      ticket_id INTEGER,
      title TEXT NOT NULL,
      content TEXT,
      message_type TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'unread',
      is_read INTEGER DEFAULT 0,
      action_required TEXT,
      action_params TEXT,
      read_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    )
  `);

  // 状态流转记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS state_transitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      from_state TEXT NOT NULL,
      to_state TEXT NOT NULL,
      from_node TEXT,
      to_node TEXT,
      action TEXT NOT NULL,
      operator_id INTEGER,
      comment TEXT,
      details TEXT,
      version INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    )
  `);

  // 操作日志表（审计）
  db.run(`
    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      module TEXT,
      action TEXT,
      target_type TEXT,
      target_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 仪表盘配置表
  db.run(`
    CREATE TABLE IF NOT EXISTS dashboard_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT,
      description TEXT,
      config TEXT NOT NULL,
      owner_id INTEGER,
      is_public INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  // 附件表
  db.run(`
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER,
      file_name TEXT NOT NULL,
      file_path TEXT,
      file_size INTEGER,
      file_type TEXT,
      uploaded_by INTEGER,
      verify_status TEXT DEFAULT 'pending',
      verify_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
  `);

  // 幂等请求记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS idempotent_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idempotency_key TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      request_path TEXT,
      request_method TEXT,
      request_body TEXT,
      response_status INTEGER,
      response_body TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    )
  `);

  // 创建索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_tickets_no ON tickets(ticket_no)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_alert_events_status ON alert_events(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_state_transitions_ticket ON state_transitions(ticket_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_operation_logs_user ON operation_logs(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_metrics_ticket ON metrics(ticket_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_ticket ON logs(ticket_id)`);
};

const initializeDefaultData = (db) => {
  // 检查是否已有岗位数据
  const roleCount = db.exec("SELECT COUNT(*) as count FROM roles");
  if (roleCount.length === 0 || roleCount[0].values[0][0] === 0) {
    // 插入默认岗位
    db.run(`
      INSERT INTO roles (code, name, description) VALUES
      ('admin', '系统管理员', '系统管理员，拥有所有权限'),
      ('ops', '运维工程师', '负责指标采集和系统维护'),
      ('dev', '开发工程师', '负责代码开发和问题排查'),
      ('oncall', '值班人员', '负责值班响应和告警处理'),
      ('manager', '管理者', '负责审批和报表查看')
    `);
  }

  // 检查是否已有权限数据
  const permCount = db.exec("SELECT COUNT(*) as count FROM permissions");
  if (permCount.length === 0 || permCount[0].values[0][0] === 0) {
    // 插入默认权限
    db.run(`
      INSERT INTO permissions (code, name, module, description) VALUES
      ('ticket:create', '创建工单', 'ticket', '创建新工单'),
      ('ticket:view', '查看工单', 'ticket', '查看工单详情'),
      ('ticket:edit', '编辑工单', 'ticket', '编辑工单信息'),
      ('ticket:assign', '分配工单', 'ticket', '分配工单责任人'),
      ('ticket:close', '关闭工单', 'ticket', '关闭工单'),
      ('metric:collect', '采集指标', 'metric', '采集系统指标'),
      ('metric:view', '查看指标', 'metric', '查看指标数据'),
      ('rule:create', '创建规则', 'rule', '创建告警规则'),
      ('rule:edit', '编辑规则', 'rule', '编辑告警规则'),
      ('rule:view', '查看规则', 'rule', '查看告警规则'),
      ('alert:view', '查看告警', 'alert', '查看告警事件'),
      ('alert:handle', '处理告警', 'alert', '处理告警事件'),
      ('notify:send', '发送通知', 'notify', '发送通知消息'),
      ('notify:view', '查看通知', 'notify', '查看通知记录'),
      ('dashboard:view', '查看仪表盘', 'dashboard', '查看仪表盘'),
      ('dashboard:edit', '编辑仪表盘', 'dashboard', '编辑仪表盘配置'),
      ('audit:view', '查看审计', 'audit', '查看操作日志'),
      ('user:view', '查看用户', 'user', '查看用户信息'),
      ('user:edit', '编辑用户', 'user', '编辑用户信息')
    `);
  }

  // 检查是否已有用户数据
  const userCount = db.exec("SELECT COUNT(*) as count FROM users");
  if (userCount.length === 0 || userCount[0].values[0][0] === 0) {
    // 使用简单密码 123456
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('123456', 10);
    
    // 插入默认用户
    db.run(`
      INSERT INTO users (username, password, name, email, department) VALUES
      ('admin', ?, '管理员', 'admin@example.com', '技术部'),
      ('ops01', ?, '运维张三', 'ops01@example.com', '运维部'),
      ('dev01', ?, '开发李四', 'dev01@example.com', '开发部'),
      ('oncall01', ?, '值班王五', 'oncall01@example.com', '运维部'),
      ('manager01', ?, '经理赵六', 'manager01@example.com', '技术部')
    `, [hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword]);

    // 关联用户和岗位
    db.run(`
      INSERT INTO user_roles (user_id, role_id)
      SELECT u.id, r.id FROM users u CROSS JOIN roles r
      WHERE (u.username = 'admin' AND r.code = 'admin')
         OR (u.username = 'ops01' AND r.code = 'ops')
         OR (u.username = 'dev01' AND r.code = 'dev')
         OR (u.username = 'oncall01' AND r.code = 'oncall')
         OR (u.username = 'manager01' AND r.code = 'manager')
    `);

    // 给各岗位分配权限
    db.run(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
      WHERE r.code = 'admin'
    `);

    db.run(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.code = 'ops' AND p.code IN (
        'ticket:create', 'ticket:view', 'ticket:edit',
        'metric:collect', 'metric:view',
        'rule:view',
        'alert:view', 'alert:handle',
        'notify:view',
        'dashboard:view'
      )
    `);

    db.run(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.code = 'dev' AND p.code IN (
        'ticket:view', 'ticket:edit',
        'metric:view',
        'rule:view',
        'alert:view', 'alert:handle',
        'notify:view',
        'dashboard:view'
      )
    `);

    db.run(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.code = 'oncall' AND p.code IN (
        'ticket:view', 'ticket:edit',
        'metric:view',
        'alert:view', 'alert:handle',
        'notify:view', 'notify:send',
        'dashboard:view'
      )
    `);

    db.run(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.code = 'manager' AND p.code IN (
        'ticket:view', 'ticket:assign',
        'metric:view',
        'rule:view', 'rule:create', 'rule:edit',
        'alert:view',
        'notify:view',
        'dashboard:view', 'dashboard:edit',
        'audit:view',
        'user:view'
      )
    `);
  }

  // 检查是否已有通知渠道
  const channelCount = db.exec("SELECT COUNT(*) as count FROM notification_channels");
  if (channelCount.length === 0 || channelCount[0].values[0][0] === 0) {
    db.run(`
      INSERT INTO notification_channels (name, channel_type, config) VALUES
      ('默认邮件', 'email', '{"host":"smtp.example.com","port":587}'),
      ('默认Webhook', 'webhook', '{"url":"http://localhost:11812/webhook"}'),
      ('默认短信', 'sms', '{}')
    `);
  }
};

const saveDatabase = () => {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
};

const query = (sql, params = []) => {
  if (!db) throw new Error('数据库未初始化');
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();
  
  return results;
};

const run = (sql, params = []) => {
  if (!db) throw new Error('数据库未初始化');
  db.run(sql, params);
  saveDatabase();
  
  const lastIdResult = db.exec("SELECT last_insert_rowid() as id");
  const lastId = lastIdResult.length > 0 ? lastIdResult[0].values[0][0] : null;
  
  return { lastInsertRowid: lastId, changes: db.getRowsModified() };
};

const getDb = () => db;

module.exports = {
  initDb,
  query,
  run,
  saveDatabase,
  getDb
};
