const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id TEXT UNIQUE NOT NULL,
      app_name TEXT NOT NULL,
      description TEXT,
      owner_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS environments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER REFERENCES applications(id),
      env_name TEXT NOT NULL,
      env_type TEXT NOT NULL,
      config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(app_id, env_name)
    );

    CREATE TABLE IF NOT EXISTS app_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER REFERENCES applications(id),
      version TEXT NOT NULL,
      change_log TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER REFERENCES applications(id),
      env_id INTEGER REFERENCES environments(id),
      key_name TEXT NOT NULL,
      api_key TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_by INTEGER REFERENCES users(id),
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS approval_workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER REFERENCES applications(id),
      workflow_name TEXT NOT NULL,
      workflow_type TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      is_active BOOLEAN DEFAULT 1,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS approval_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_id INTEGER REFERENCES approval_workflows(id),
      node_name TEXT NOT NULL,
      node_order INTEGER NOT NULL,
      approver_role TEXT,
      approver_id INTEGER REFERENCES users(id),
      node_type TEXT DEFAULT 'approval',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS change_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      app_id INTEGER REFERENCES applications(id),
      workflow_id INTEGER REFERENCES approval_workflows(id),
      change_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      config_data TEXT,
      status TEXT DEFAULT 'draft',
      current_node_id INTEGER REFERENCES approval_nodes(id),
      creator_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS approval_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES change_orders(id),
      node_id INTEGER REFERENCES approval_nodes(id),
      approver_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      comment TEXT,
      attachments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS execution_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_no TEXT UNIQUE NOT NULL,
      order_id INTEGER REFERENCES change_orders(id),
      app_id INTEGER REFERENCES applications(id),
      env_id INTEGER REFERENCES environments(id),
      task_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      executor_id INTEGER REFERENCES users(id),
      executed_at DATETIME,
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS call_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER REFERENCES applications(id),
      task_id INTEGER REFERENCES execution_tasks(id),
      api_key_id INTEGER REFERENCES api_keys(id),
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      request_data TEXT,
      response_data TEXT,
      status_code INTEGER,
      duration INTEGER,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alert_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER REFERENCES applications(id),
      task_id INTEGER REFERENCES execution_tasks(id),
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      resolved_at DATETIME,
      resolver_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exception_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER REFERENCES execution_tasks(id),
      order_id INTEGER REFERENCES change_orders(id),
      error_type TEXT NOT NULL,
      error_message TEXT NOT NULL,
      stack_trace TEXT,
      original_request TEXT,
      compensation_action TEXT,
      manual_notes TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS data_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER REFERENCES applications(id),
      model_name TEXT NOT NULL,
      model_code TEXT NOT NULL,
      description TEXT,
      fields TEXT,
      status TEXT DEFAULT 'draft',
      version INTEGER DEFAULT 1,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(app_id, model_code)
    );

    CREATE TABLE IF NOT EXISTS form_schemas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER REFERENCES applications(id),
      form_name TEXT NOT NULL,
      form_code TEXT NOT NULL,
      description TEXT,
      schema_config TEXT,
      layout_config TEXT,
      validation_rules TEXT,
      status TEXT DEFAULT 'draft',
      version INTEGER DEFAULT 1,
      model_id INTEGER REFERENCES data_models(id),
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(app_id, form_code)
    );

    CREATE TABLE IF NOT EXISTS form_instances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id INTEGER REFERENCES form_schemas(id),
      app_id INTEGER REFERENCES applications(id),
      form_data TEXT,
      status TEXT DEFAULT 'draft',
      workflow_instance_id INTEGER,
      creator_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS page_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER REFERENCES applications(id),
      page_name TEXT NOT NULL,
      page_code TEXT NOT NULL,
      page_type TEXT NOT NULL,
      page_config TEXT,
      form_id INTEGER REFERENCES form_schemas(id),
      model_id INTEGER REFERENCES data_models(id),
      status TEXT DEFAULT 'draft',
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(app_id, page_code)
    );

    CREATE TABLE IF NOT EXISTS flow_definitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER REFERENCES applications(id),
      flow_name TEXT NOT NULL,
      flow_code TEXT NOT NULL,
      description TEXT,
      nodes_config TEXT,
      edges_config TEXT,
      status TEXT DEFAULT 'draft',
      version INTEGER DEFAULT 1,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(app_id, flow_code)
    );

    CREATE TABLE IF NOT EXISTS component_library (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      component_type TEXT NOT NULL,
      component_name TEXT NOT NULL,
      component_icon TEXT,
      default_props TEXT,
      is_builtin BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    db.prepare(`
      INSERT INTO users (username, password, role, name, email)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', hashedPassword, 'admin', '系统管理员', 'admin@example.com');

    db.prepare(`
      INSERT INTO users (username, password, role, name, email)
      VALUES (?, ?, ?, ?, ?)
    `).run('operator', hashedPassword, 'operator', '运维工程师', 'operator@example.com');

    db.prepare(`
      INSERT INTO users (username, password, role, name, email)
      VALUES (?, ?, ?, ?, ?)
    `).run('developer', hashedPassword, 'developer', '开发者', 'dev@example.com');

    db.prepare(`
      INSERT INTO users (username, password, role, name, email)
      VALUES (?, ?, ?, ?, ?)
    `).run('owner', hashedPassword, 'owner', '应用负责人', 'owner@example.com');

    db.prepare(`
      INSERT INTO users (username, password, role, name, email)
      VALUES (?, ?, ?, ?, ?)
    `).run('security', hashedPassword, 'security', '安全管理员', 'security@example.com');
  }

  const componentCount = db.prepare('SELECT COUNT(*) as count FROM component_library').get().count;
  if (componentCount === 0) {
    const components = [
      { type: 'input', name: '单行输入', icon: '📝', props: '{"label":"输入框","placeholder":"请输入","required":false,"maxLength":100}' },
      { type: 'textarea', name: '多行输入', icon: '📄', props: '{"label":"文本域","placeholder":"请输入","required":false,"rows":4}' },
      { type: 'number', name: '数字输入', icon: '🔢', props: '{"label":"数字","placeholder":"请输入数字","required":false,"min":0,"max":999999}' },
      { type: 'select', name: '下拉选择', icon: '📋', props: '{"label":"选择框","placeholder":"请选择","required":false,"options":[]}' },
      { type: 'radio', name: '单选框组', icon: '🔘', props: '{"label":"单选","required":false,"options":[]}' },
      { type: 'checkbox', name: '多选框组', icon: '☑️', props: '{"label":"多选","required":false,"options":[]}' },
      { type: 'date', name: '日期选择', icon: '📅', props: '{"label":"日期","required":false,"format":"YYYY-MM-DD"}' },
      { type: 'datetime', name: '日期时间', icon: '⏰', props: '{"label":"日期时间","required":false}' },
      { type: 'upload', name: '文件上传', icon: '📎', props: '{"label":"附件","required":false,"maxCount":5,"accept":".jpg,.png,.pdf"}' },
      { type: 'user', name: '人员选择', icon: '👤', props: '{"label":"选择人员","required":false,"multiple":false}' },
      { type: 'dept', name: '部门选择', icon: '🏢', props: '{"label":"选择部门","required":false}' },
      { type: 'money', name: '金额输入', icon: '💰', props: '{"label":"金额","placeholder":"0.00","required":false,"currency":"CNY"}' },
      { type: 'phone', name: '手机号', icon: '📱', props: '{"label":"手机号","placeholder":"请输入手机号","required":false}' },
      { type: 'email', name: '邮箱', icon: '📧', props: '{"label":"邮箱","placeholder":"请输入邮箱","required":false}' },
      { type: 'divider', name: '分割线', icon: '➖', props: '{"label":""}' },
      { type: 'table', name: '子表格', icon: '📊', props: '{"label":"子表","columns":[]}' }
    ];

    components.forEach(comp => {
      db.prepare(`
        INSERT INTO component_library (component_type, component_name, component_icon, default_props)
        VALUES (?, ?, ?, ?)
      `).run(comp.type, comp.name, comp.icon, comp.props);
    });
  }
}

initDatabase();

module.exports = db;
