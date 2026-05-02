const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const dbPath = path.resolve(__dirname, '../../', config.dbPath);
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      leader_id TEXT,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      avatar TEXT,
      department_id TEXT,
      role_id TEXT,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bots (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      avatar TEXT,
      type TEXT DEFAULT 'auto',
      config TEXT,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS main_orders (
      id TEXT PRIMARY KEY,
      order_no TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      current_step TEXT NOT NULL DEFAULT 'org_sync',
      initiator_id TEXT NOT NULL,
      current_owner_id TEXT,
      expected_time TEXT,
      priority TEXT DEFAULT 'normal',
      chat_ids TEXT,
      data_content TEXT,
      lock_version INTEGER DEFAULT 0,
      is_locked INTEGER DEFAULT 0,
      locked_by TEXT,
      locked_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_details (
      id TEXT PRIMARY KEY,
      main_order_id TEXT NOT NULL,
      step TEXT NOT NULL,
      sub_type TEXT,
      title TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      owner_id TEXT,
      data_content TEXT,
      parent_id TEXT,
      sort_order INTEGER DEFAULT 0,
      lock_version INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS status_flow (
      id TEXT PRIMARY KEY,
      main_order_id TEXT NOT NULL,
      detail_id TEXT,
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      from_step TEXT,
      to_step TEXT,
      operator_id TEXT NOT NULL,
      operator_type TEXT DEFAULT 'employee',
      action TEXT,
      reason TEXT,
      remark TEXT,
      data_snapshot TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      main_order_id TEXT,
      detail_id TEXT,
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      version TEXT DEFAULT '1.0',
      parent_id TEXT,
      owner_id TEXT NOT NULL,
      status INTEGER DEFAULT 1,
      copyright_status TEXT DEFAULT 'authorized',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comments_approvals (
      id TEXT PRIMARY KEY,
      main_order_id TEXT NOT NULL,
      detail_id TEXT,
      type TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      operator_type TEXT DEFAULT 'employee',
      action TEXT NOT NULL,
      content TEXT,
      attachment_ids TEXT,
      result TEXT,
      next_owner_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      receiver_id TEXT NOT NULL,
      receiver_type TEXT DEFAULT 'employee',
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      related_type TEXT,
      related_id TEXT,
      related_step TEXT,
      is_read INTEGER DEFAULT 0,
      read_at TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      operator_id TEXT NOT NULL,
      operator_type TEXT DEFAULT 'employee',
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stat_snapshots (
      id TEXT PRIMARY KEY,
      snapshot_date TEXT NOT NULL,
      snapshot_type TEXT NOT NULL,
      department_id TEXT,
      owner_id TEXT,
      total_count INTEGER DEFAULT 0,
      pending_count INTEGER DEFAULT 0,
      processing_count INTEGER DEFAULT 0,
      completed_count INTEGER DEFAULT 0,
      rejected_count INTEGER DEFAULT 0,
      timeout_count INTEGER DEFAULT 0,
      data_content TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT,
      description TEXT,
      owner_id TEXT,
      avatar TEXT,
      status INTEGER DEFAULT 1,
      is_locked INTEGER DEFAULT 0,
      locked_by TEXT,
      locked_at TEXT,
      last_message_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_members (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      member_type TEXT DEFAULT 'employee',
      role TEXT DEFAULT 'member',
      is_muted INTEGER DEFAULT 0,
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_type TEXT DEFAULT 'employee',
      type TEXT NOT NULL DEFAULT 'text',
      content TEXT,
      attachment_id TEXT,
      related_type TEXT,
      related_id TEXT,
      is_read INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      reply_to_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      type TEXT NOT NULL,
      level TEXT DEFAULT 'normal',
      rule_config TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      creator_id TEXT NOT NULL,
      publish_time TEXT,
      expire_time TEXT,
      scope_type TEXT DEFAULT 'all',
      scope_ids TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conflict_records (
      id TEXT PRIMARY KEY,
      main_order_id TEXT NOT NULL,
      detail_id TEXT,
      conflict_type TEXT NOT NULL,
      operator_id TEXT NOT NULL,
      other_operator_id TEXT,
      old_version INTEGER,
      new_version INTEGER,
      base_content TEXT,
      our_content TEXT,
      their_content TEXT,
      resolved_content TEXT,
      status TEXT DEFAULT 'pending',
      resolved_at TEXT,
      resolver_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS todo_items (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      owner_type TEXT DEFAULT 'employee',
      main_order_id TEXT NOT NULL,
      detail_id TEXT,
      step TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'pending',
      due_time TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const insertRole = db.prepare(`
    INSERT OR IGNORE INTO roles (id, name, code, description) VALUES (?, ?, ?, ?)
  `);

  const rolesData = [
    ['r001', '超级管理员', 'admin', '系统超级管理员'],
    ['r002', '部门负责人', 'dept_leader', '部门负责人'],
    ['r003', '普通员工', 'employee', '普通员工'],
  ];

  rolesData.forEach(role => insertRole.run(...role));

  const insertDept = db.prepare(`
    INSERT OR IGNORE INTO departments (id, name, parent_id, leader_id) VALUES (?, ?, ?, ?)
  `);

  const deptsData = [
    ['d001', '总公司', null, null],
    ['d002', '技术部', 'd001', null],
    ['d003', '人事部', 'd001', null],
  ];

  deptsData.forEach(dept => insertDept.run(...dept));

  const insertEmployee = db.prepare(`
    INSERT OR IGNORE INTO employees (id, username, password, name, email, phone, avatar, department_id, role_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const employeesData = [
    ['e001', 'admin', '$2a$10$examplehash1', '管理员', 'admin@company.com', '13800138000', null, 'd001', 'r001'],
    ['e002', 'zhangsan', '$2a$10$examplehash2', '张三', 'zhangsan@company.com', '13800138001', null, 'd002', 'r002'],
    ['e003', 'lisi', '$2a$10$examplehash3', '李四', 'lisi@company.com', '13800138002', null, 'd002', 'r003'],
    ['e004', 'wangwu', '$2a$10$examplehash4', '王五', 'wangwu@company.com', '13800138003', null, 'd003', 'r002'],
  ];

  employeesData.forEach(emp => insertEmployee.run(...emp));

  const insertBot = db.prepare(`
    INSERT OR IGNORE INTO bots (id, name, code, description) VALUES (?, ?, ?, ?)
  `);

  const botsData = [
    ['b001', '组织同步机器人', 'org_sync_bot', '自动处理组织同步相关事务'],
    ['b002', '公告规则机器人', 'announcement_bot', '自动执行公告规则引擎'],
    ['b003', '冲突合并机器人', 'conflict_bot', '自动处理协同编辑冲突'],
    ['b004', '内容审核机器人', 'audit_bot', '自动进行内容审核'],
  ];

  botsData.forEach(bot => insertBot.run(...bot));

  console.log('数据库初始化完成');
};

const getDb = () => db;

module.exports = {
  initDatabase,
  getDb,
};
