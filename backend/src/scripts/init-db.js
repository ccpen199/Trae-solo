const db = require('../config/database');
const bcrypt = require('bcryptjs');

const initDatabase = () => {
  db.exec(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 主单表
    CREATE TABLE IF NOT EXISTS main_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending_collect',
      current_node TEXT NOT NULL DEFAULT 'collect',
      creator_id INTEGER NOT NULL,
      assignee_id INTEGER,
      expected_finish_time DATETIME,
      priority TEXT DEFAULT 'normal',
      tags TEXT,
      is_locked INTEGER DEFAULT 0,
      locked_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id),
      FOREIGN KEY (assignee_id) REFERENCES users(id),
      FOREIGN KEY (locked_by) REFERENCES users(id)
    );

    -- 明细表
    CREATE TABLE IF NOT EXISTS order_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_order_id INTEGER NOT NULL,
      detail_no TEXT UNIQUE NOT NULL,
      log_source TEXT,
      log_path TEXT,
      log_format TEXT,
      log_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending_collect',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id) ON DELETE CASCADE
    );

    -- 采集器配置表
    CREATE TABLE IF NOT EXISTS collectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_order_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      config TEXT,
      status TEXT DEFAULT 'draft',
      last_collect_time DATETIME,
      collect_interval INTEGER DEFAULT 60,
      is_enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id) ON DELETE CASCADE
    );

    -- 日志索引表
    CREATE TABLE IF NOT EXISTS log_indices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_order_id INTEGER NOT NULL,
      index_name TEXT NOT NULL,
      index_type TEXT,
      shard_count INTEGER DEFAULT 1,
      replica_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      total_docs INTEGER DEFAULT 0,
      storage_size INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id) ON DELETE CASCADE
    );

    -- 查询语言规则表
    CREATE TABLE IF NOT EXISTS query_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_order_id INTEGER NOT NULL,
      rule_name TEXT NOT NULL,
      rule_type TEXT,
      query_template TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id) ON DELETE CASCADE
    );

    -- 字段解析规则表
    CREATE TABLE IF NOT EXISTS field_parsers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_order_id INTEGER NOT NULL,
      field_name TEXT NOT NULL,
      field_type TEXT DEFAULT 'string',
      parser_type TEXT,
      parser_pattern TEXT,
      is_required INTEGER DEFAULT 0,
      is_indexed INTEGER DEFAULT 1,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id) ON DELETE CASCADE
    );

    -- 告警表
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_order_id INTEGER NOT NULL,
      alert_name TEXT NOT NULL,
      alert_level TEXT DEFAULT 'info',
      alert_type TEXT,
      trigger_condition TEXT,
      status TEXT DEFAULT 'pending',
      is_locked INTEGER DEFAULT 0,
      locked_by INTEGER,
      triggered_at DATETIME,
      resolved_at DATETIME,
      assignee_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (assignee_id) REFERENCES users(id),
      FOREIGN KEY (locked_by) REFERENCES users(id)
    );

    -- 时间轴/操作日志表
    CREATE TABLE IF NOT EXISTS timelines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_order_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      action_type TEXT,
      operator_id INTEGER NOT NULL,
      content TEXT,
      attachments TEXT,
      from_status TEXT,
      to_status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    -- 消息通知表
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      main_order_id INTEGER,
      title TEXT NOT NULL,
      content TEXT,
      message_type TEXT,
      is_read INTEGER DEFAULT 0,
      read_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id) ON DELETE CASCADE
    );

    -- 附件表
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_order_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      uploader_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_order_id) REFERENCES main_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (uploader_id) REFERENCES users(id)
    );

    -- 操作日志审计表
    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 统计汇总表
    CREATE TABLE IF NOT EXISTS statistics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stat_date DATE NOT NULL,
      stat_type TEXT NOT NULL,
      stat_key TEXT,
      stat_value INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(stat_date, stat_type, stat_key)
    );

    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_main_orders_status ON main_orders(status);
    CREATE INDEX IF NOT EXISTS idx_main_orders_creator ON main_orders(creator_id);
    CREATE INDEX IF NOT EXISTS idx_main_orders_assignee ON main_orders(assignee_id);
    CREATE INDEX IF NOT EXISTS idx_main_orders_order_no ON main_orders(order_no);
    CREATE INDEX IF NOT EXISTS idx_timelines_main_order ON timelines(main_order_id);
    CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);

  const saltRounds = 10;
  const hashedPassword = bcrypt.hashSync('123456', saltRounds);

  const users = [
    { username: 'dev', password: hashedPassword, name: '开发人员', role: 'developer', email: 'dev@example.com', department: '研发部' },
    { username: 'ops', password: hashedPassword, name: '运维人员', role: 'operator', email: 'ops@example.com', department: '运维部' },
    { username: 'sec', password: hashedPassword, name: '安全人员', role: 'security', email: 'sec@example.com', department: '安全部' },
    { username: 'analyst', password: hashedPassword, name: '数据分析', role: 'analyst', email: 'analyst@example.com', department: '数据部' },
    { username: 'admin', password: hashedPassword, name: '管理员', role: 'admin', email: 'admin@example.com', department: '管理部' }
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, password, name, role, email, department)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const user of users) {
    insertUser.run(user.username, user.password, user.name, user.role, user.email, user.department);
  }

  console.log('数据库初始化完成！');
  console.log('默认用户: dev/123456, ops/123456, sec/123456, analyst/123456, admin/123456');
};

try {
  initDatabase();
} catch (error) {
  console.error('数据库初始化失败:', error);
} finally {
  db.close();
}
