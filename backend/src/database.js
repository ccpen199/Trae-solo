const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee',
      department TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS directories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES directories(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT DEFAULT '#1890ff',
      description TEXT,
      is_locked INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_order_no TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      summary TEXT,
      directory_id INTEGER,
      responsible_id INTEGER,
      expected_completion_date DATE,
      status TEXT NOT NULL DEFAULT 'pending_creation',
      current_step TEXT NOT NULL DEFAULT 'create',
      version INTEGER DEFAULT 1,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (directory_id) REFERENCES directories(id),
      FOREIGN KEY (responsible_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS document_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      field_name TEXT NOT NULL,
      field_value TEXT,
      version INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id)
    );

    CREATE TABLE IF NOT EXISTS document_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id),
      FOREIGN KEY (tag_id) REFERENCES tags(id),
      UNIQUE(document_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      version INTEGER DEFAULT 1,
      copyright_status TEXT DEFAULT 'pending',
      copyright_expiry_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id)
    );

    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      version_no INTEGER NOT NULL,
      title TEXT,
      content TEXT,
      change_log TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id INTEGER,
      action TEXT NOT NULL,
      is_allowed INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS todo_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      document_id INTEGER NOT NULL,
      message_type TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (document_id) REFERENCES documents(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workflow_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      step_name TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      handler_id INTEGER,
      status TEXT DEFAULT 'pending',
      started_at DATETIME,
      completed_at DATETIME,
      comment TEXT,
      FOREIGN KEY (document_id) REFERENCES documents(id),
      FOREIGN KEY (handler_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS conflict_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      version_no INTEGER NOT NULL,
      conflict_type TEXT NOT NULL,
      user_id INTEGER,
      original_content TEXT,
      conflicting_content TEXT,
      resolved_content TEXT,
      is_resolved INTEGER DEFAULT 0,
      resolved_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (resolved_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      event_title TEXT NOT NULL,
      event_details TEXT,
      user_id INTEGER,
      user_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS external_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      link_url TEXT NOT NULL,
      link_name TEXT,
      is_valid INTEGER DEFAULT 1,
      last_checked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id)
    );

    CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
    CREATE INDEX IF NOT EXISTS idx_documents_main_order ON documents(main_order_no);
    CREATE INDEX IF NOT EXISTS idx_documents_directory ON documents(directory_id);
    CREATE INDEX IF NOT EXISTS idx_todo_messages_user ON todo_messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_versions_document ON versions(document_id, version_no);
  `);

  const bcrypt = require('bcryptjs');
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const userPassword = bcrypt.hashSync('user123', 10);

  const users = [
    { username: 'admin', password: adminPassword, name: '系统管理员', role: 'admin', department: '技术部', email: 'admin@example.com' },
    { username: 'kmanager', password: userPassword, name: '张管理员', role: 'knowledge_manager', department: '知识管理部', email: 'km@example.com' },
    { username: 'expert', password: userPassword, name: '李专家', role: 'expert', department: '研发部', email: 'expert@example.com' },
    { username: 'cs', password: userPassword, name: '王客服', role: 'customer_service', department: '客服部', email: 'cs@example.com' },
    { username: 'newbie', password: userPassword, name: '赵新人', role: 'newbie', department: '市场部', email: 'newbie@example.com' },
    { username: 'employee', password: userPassword, name: '孙员工', role: 'employee', department: '销售部', email: 'employee@example.com' }
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, password, name, role, department, email)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  users.forEach(user => {
    insertUser.run(user.username, user.password, user.name, user.role, user.department, user.email);
  });

  const defaultPermissions = [
    { role: 'admin', resource_type: 'all', resource_id: null, action: 'all' },
    { role: 'knowledge_manager', resource_type: 'document', resource_id: null, action: 'review' },
    { role: 'knowledge_manager', resource_type: 'document', resource_id: null, action: 'publish' },
    { role: 'knowledge_manager', resource_type: 'tag', resource_id: null, action: 'manage' },
    { role: 'expert', resource_type: 'document', resource_id: null, action: 'create' },
    { role: 'expert', resource_type: 'document', resource_id: null, action: 'edit' },
    { role: 'expert', resource_type: 'document', resource_id: null, action: 'review' },
    { role: 'employee', resource_type: 'document', resource_id: null, action: 'create' },
    { role: 'employee', resource_type: 'document', resource_id: null, action: 'view' },
    { role: 'employee', resource_type: 'document', resource_id: null, action: 'search' },
    { role: 'customer_service', resource_type: 'document', resource_id: null, action: 'view' },
    { role: 'customer_service', resource_type: 'document', resource_id: null, action: 'search' },
    { role: 'newbie', resource_type: 'document', resource_id: null, action: 'view' },
    { role: 'newbie', resource_type: 'document', resource_id: null, action: 'search' }
  ];

  const insertPermission = db.prepare(`
    INSERT OR IGNORE INTO permissions (role, resource_type, resource_id, action, is_allowed)
    VALUES (?, ?, ?, ?, 1)
  `);

  defaultPermissions.forEach(perm => {
    insertPermission.run(perm.role, perm.resource_type, perm.resource_id, perm.action);
  });

  const defaultTags = [
    { name: '产品文档', color: '#1890ff', description: '产品相关文档' },
    { name: '技术文档', color: '#52c41a', description: '技术相关文档' },
    { name: '操作指南', color: '#faad14', description: '操作指南文档' },
    { name: 'FAQ', color: '#f5222d', description: '常见问题解答' },
    { name: '培训资料', color: '#722ed1', description: '培训相关资料' }
  ];

  const insertTag = db.prepare(`
    INSERT OR IGNORE INTO tags (name, color, description, created_by)
    VALUES (?, ?, ?, 1)
  `);

  defaultTags.forEach(tag => {
    insertTag.run(tag.name, tag.color, tag.description);
  });

  const defaultDirs = [
    { name: '产品中心', parent_id: null, sort_order: 1 },
    { name: '研发中心', parent_id: null, sort_order: 2 },
    { name: '运营中心', parent_id: null, sort_order: 3 },
    { name: '客服中心', parent_id: null, sort_order: 4 },
    { name: '培训中心', parent_id: null, sort_order: 5 }
  ];

  const insertDir = db.prepare(`
    INSERT OR IGNORE INTO directories (name, parent_id, sort_order, created_by)
    VALUES (?, ?, ?, 1)
  `);

  defaultDirs.forEach(dir => {
    insertDir.run(dir.name, dir.parent_id, dir.sort_order);
  });

  console.log('数据库初始化完成');
};

module.exports = {
  db,
  initDatabase
};
