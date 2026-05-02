const { db, runAsync } = require('../config/database');
const bcrypt = require('bcryptjs');

const ROLES = {
  CONSUMER: 'consumer',
  DESIGNER: 'designer',
  OPERATOR: 'operator',
  SALES: 'sales'
};

const STATUS = {
  PENDING_MODEL_LOAD: 'pending_model_load',
  PENDING_INTERACTION: 'pending_interaction',
  PENDING_CONFIG_SELECTION: 'pending_config_selection',
  PENDING_QUOTE: 'pending_quote',
  PENDING_LEAD: 'pending_lead',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
  REJECTED: 'rejected',
  DEGRADED: 'degraded'
};

const ACTIONS = {
  SUBMIT_MODEL: 'submit_model',
  APPROVE: 'approve',
  REJECT: 'reject',
  SUPPLEMENT: 'supplement',
  TRANSFER: 'transfer',
  SELECT_CONFIG: 'select_config',
  GENERATE_QUOTE: 'generate_quote',
  SUBMIT_LEAD: 'submit_lead',
  CANCEL: 'cancel',
  REVERT: 'revert'
};

async function initDatabase() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT,
        email TEXT,
        phone TEXT,
        department TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS main_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_no TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        model_name TEXT,
        model_url TEXT,
        model_type TEXT,
        description TEXT,
        current_status TEXT NOT NULL,
        responsible_role TEXT,
        responsible_user_id INTEGER,
        expect_complete_time DATETIME,
        cost_limit REAL,
        actual_cost REAL,
        is_archived INTEGER DEFAULT 0,
        is_locked INTEGER DEFAULT 0,
        locked_by INTEGER,
        locked_at DATETIME,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (responsible_user_id) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (locked_by) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS order_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        main_order_id INTEGER NOT NULL,
        detail_no TEXT NOT NULL,
        material_name TEXT,
        material_url TEXT,
        hotspot_config TEXT,
        config_data TEXT,
        status TEXT,
        sequence INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (main_order_id) REFERENCES main_orders(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS status_transitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        main_order_id INTEGER NOT NULL,
        from_status TEXT NOT NULL,
        to_status TEXT NOT NULL,
        transition_type TEXT NOT NULL,
        action TEXT NOT NULL,
        operator_id INTEGER,
        operator_role TEXT,
        comment TEXT,
        reason TEXT,
        extra_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (main_order_id) REFERENCES main_orders(id),
        FOREIGN KEY (operator_id) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS operation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        user_role TEXT,
        action TEXT NOT NULL,
        target_type TEXT,
        target_id INTEGER,
        before_data TEXT,
        after_data TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS timeline_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        main_order_id INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        operator_id INTEGER,
        operator_role TEXT,
        operator_name TEXT,
        title TEXT,
        content TEXT,
        attachments TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (main_order_id) REFERENCES main_orders(id),
        FOREIGN KEY (operator_id) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        main_order_id INTEGER,
        title TEXT NOT NULL,
        content TEXT,
        type TEXT,
        is_read INTEGER DEFAULT 0,
        read_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (main_order_id) REFERENCES main_orders(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS config_locks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        main_order_id INTEGER NOT NULL,
        locked_by INTEGER NOT NULL,
        locked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (main_order_id) REFERENCES main_orders(id),
        FOREIGN KEY (locked_by) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS degradation_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        main_order_id INTEGER NOT NULL,
        degrade_type TEXT NOT NULL,
        reason TEXT,
        trigger_condition TEXT,
        judgement_basis TEXT,
        original_status TEXT,
        target_status TEXT,
        operator_id INTEGER,
        is_resolved INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (main_order_id) REFERENCES main_orders(id),
        FOREIGN KEY (operator_id) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS correction_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        main_order_id INTEGER NOT NULL,
        correction_type TEXT NOT NULL,
        original_order_id INTEGER,
        reason TEXT,
        operator_id INTEGER,
        operator_role TEXT,
        before_snapshot TEXT,
        after_snapshot TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (main_order_id) REFERENCES main_orders(id),
        FOREIGN KEY (operator_id) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS prompt_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL,
        prompt_text TEXT NOT NULL,
        model_type TEXT,
        is_active INTEGER DEFAULT 0,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS prompt_evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt_version_id INTEGER,
        main_order_id INTEGER,
        score REAL,
        evaluation_data TEXT,
        evaluator_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (prompt_version_id) REFERENCES prompt_versions(id),
        FOREIGN KEY (main_order_id) REFERENCES main_orders(id),
        FOREIGN KEY (evaluator_id) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS model_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_name TEXT NOT NULL,
        rule_type TEXT NOT NULL,
        model_type TEXT,
        conditions TEXT,
        actions TEXT,
        priority INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        main_order_id INTEGER,
        file_name TEXT NOT NULL,
        file_path TEXT,
        file_type TEXT,
        file_size INTEGER,
        uploaded_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (main_order_id) REFERENCES main_orders(id),
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);

    try {
      db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_status ON main_orders(current_status)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_responsible ON main_orders(responsible_user_id)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_no ON main_orders(order_no)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_transitions_order ON status_transitions(main_order_id)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_timeline_order ON timeline_events(main_order_id)`);
    } catch (e) {
      console.log('索引已存在或创建失败:', e.message);
    }

    const hashedPassword = await bcrypt.hash('123456', 10);

    const users = [
      { username: 'consumer1', role: ROLES.CONSUMER, name: '消费者用户1', email: 'c1@test.com', phone: '13800138001' },
      { username: 'designer1', role: ROLES.DESIGNER, name: '设计师用户1', email: 'd1@test.com', phone: '13800138002', department: '设计部' },
      { username: 'operator1', role: ROLES.OPERATOR, name: '运营用户1', email: 'o1@test.com', phone: '13800138003', department: '运营部' },
      { username: 'sales1', role: ROLES.SALES, name: '销售用户1', email: 's1@test.com', phone: '13800138004', department: '销售部' }
    ];

    for (const user of users) {
      try {
        const existing = db.prepare(`SELECT id FROM users WHERE username = ?`).get(user.username);
        if (!existing) {
          db.prepare(
            `INSERT INTO users (username, password, role, name, email, phone, department) VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).run(user.username, hashedPassword, user.role, user.name, user.email, user.phone, user.department || null);
        }
      } catch (e) {
        console.log(`用户 ${user.username} 可能已存在:`, e.message);
      }
    }

    const existingRules = db.prepare(`SELECT COUNT(*) as count FROM model_rules`).get();
    if (existingRules.count === 0) {
      const rules = [
        { rule_name: '家具模型默认材质', rule_type: 'material_default', model_type: 'furniture', 
          conditions: '{"model_type":"furniture"}', actions: '{"default_material":"wood"}', priority: 1 },
        { rule_name: '汽车模型旋转限制', rule_type: 'rotation_limit', model_type: 'car',
          conditions: '{"model_type":"car"}', actions: '{"min_angle":0,"max_angle":360}', priority: 1 },
        { rule_name: '设备模型缩放限制', rule_type: 'zoom_limit', model_type: 'equipment',
          conditions: '{"model_type":"equipment"}', actions: '{"min_zoom":0.5,"max_zoom":3.0}', priority: 1 }
      ];

      for (const rule of rules) {
        db.prepare(
          `INSERT INTO model_rules (rule_name, rule_type, model_type, conditions, actions, priority) VALUES (?, ?, ?, ?, ?, ?)`
        ).run(rule.rule_name, rule.rule_type, rule.model_type, rule.conditions, rule.actions, rule.priority);
      }
    }

    console.log('数据库初始化完成');
  } catch (err) {
    console.error('数据库初始化失败:', err);
    throw err;
  }
}

module.exports = {
  initDatabase,
  ROLES,
  STATUS,
  ACTIONS
};
