const { run, get, all, exec } = require('./database');
const bcrypt = require('bcryptjs');

const initDatabase = () => {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      nickname TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_upload',
      canvas_name TEXT,
      canvas_width INTEGER,
      canvas_height INTEGER,
      canvas_background TEXT,
      creator_id INTEGER,
      assignee_id INTEGER,
      expected_completion_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id),
      FOREIGN KEY (assignee_id) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS order_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      detail_type TEXT NOT NULL,
      detail_data TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      version INTEGER DEFAULT 1,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS layers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      image_id INTEGER,
      layer_name TEXT,
      layer_type TEXT NOT NULL,
      position_x INTEGER DEFAULT 0,
      position_y INTEGER DEFAULT 0,
      width INTEGER,
      height INTEGER,
      z_index INTEGER DEFAULT 0,
      opacity REAL DEFAULT 1,
      is_visible INTEGER DEFAULT 1,
      is_locked INTEGER DEFAULT 0,
      properties TEXT,
      version INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (image_id) REFERENCES images(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS filters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      layer_id INTEGER NOT NULL,
      filter_name TEXT NOT NULL,
      filter_params TEXT,
      is_applied INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (layer_id) REFERENCES layers(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS texts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      layer_id INTEGER NOT NULL,
      content TEXT,
      font_family TEXT,
      font_size INTEGER,
      font_color TEXT,
      font_weight TEXT,
      font_style TEXT,
      text_align TEXT,
      line_height REAL,
      letter_spacing REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (layer_id) REFERENCES layers(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_name TEXT NOT NULL,
      template_code TEXT UNIQUE,
      description TEXT,
      canvas_width INTEGER,
      canvas_height INTEGER,
      preview_image TEXT,
      category TEXT,
      is_locked INTEGER DEFAULT 0,
      locked_by INTEGER,
      locked_at DATETIME,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (locked_by) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS template_layers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      layer_name TEXT,
      layer_type TEXT NOT NULL,
      position_x INTEGER DEFAULT 0,
      position_y INTEGER DEFAULT 0,
      width INTEGER,
      height INTEGER,
      z_index INTEGER DEFAULT 0,
      opacity REAL DEFAULT 1,
      properties TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES templates(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS order_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      template_id INTEGER NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      applied_by INTEGER,
      status TEXT DEFAULT 'pending',
      review_comment TEXT,
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (template_id) REFERENCES templates(id),
      FOREIGN KEY (applied_by) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS exports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      export_format TEXT NOT NULL,
      export_width INTEGER,
      export_height INTEGER,
      file_path TEXT,
      file_name TEXT,
      file_size INTEGER,
      exported_by INTEGER,
      exported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      version INTEGER DEFAULT 1,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (exported_by) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      user_id INTEGER,
      action TEXT NOT NULL,
      action_detail TEXT,
      from_status TEXT,
      to_status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      user_id INTEGER,
      action TEXT NOT NULL,
      comment TEXT,
      action_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_id INTEGER,
      title TEXT NOT NULL,
      content TEXT,
      is_read INTEGER DEFAULT 0,
      message_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS inventory_locks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_type TEXT NOT NULL,
      resource_id INTEGER NOT NULL,
      lock_holder_id INTEGER,
      lock_reason TEXT,
      locked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (lock_holder_id) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS member_benefits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_level TEXT NOT NULL,
      benefit_code TEXT NOT NULL,
      benefit_name TEXT NOT NULL,
      benefit_value TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      promotion_name TEXT NOT NULL,
      promotion_code TEXT,
      promotion_type TEXT,
      discount_value REAL,
      discount_type TEXT,
      start_time DATETIME,
      end_time DATETIME,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS reverse_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_order_id INTEGER NOT NULL,
      reverse_type TEXT NOT NULL,
      reverse_reason TEXT,
      status TEXT DEFAULT 'pending',
      initiator_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (original_order_id) REFERENCES orders(id),
      FOREIGN KEY (initiator_id) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS statistics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stat_date DATE NOT NULL,
      stat_type TEXT NOT NULL,
      stat_key TEXT,
      stat_value INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(stat_date, stat_type, stat_key)
    )`
  ];

  tables.forEach(sql => {
    try {
      run(sql);
    } catch (error) {
      console.error('创建表失败:', error.message);
    }
  });

  const hashedPassword = bcrypt.hashSync('123456', 10);

  try {
    const existingUsers = all('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0]?.count === 0) {
      run(
        `INSERT INTO users (username, password, role, nickname, email) VALUES 
         ('design_op', ?, 'design_operation', '设计运营', 'design@example.com'),
         ('editor', ?, 'creator', '创作者', 'editor@example.com'),
         ('merchant', ?, 'merchant', '商家', 'merchant@example.com'),
         ('auditor', ?, 'auditor', '审核', 'auditor@example.com'),
         ('admin', ?, 'admin', '管理员', 'admin@example.com')`,
        [hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword]
      );
    }
  } catch (error) {
    console.log('用户数据已存在');
  }

  try {
    const existingTemplates = all('SELECT COUNT(*) as count FROM templates');
    if (existingTemplates[0]?.count === 0) {
      run(
        `INSERT INTO templates (template_name, template_code, description, canvas_width, canvas_height, category, created_by) VALUES 
         ('电商主图模板', 'TM001', '标准电商主图模板', 800, 800, 'ecommerce', 1),
         ('促销横幅模板', 'TM002', '促销活动横幅模板', 1200, 400, 'banner', 1),
         ('产品详情模板', 'TM003', '产品详情页模板', 750, 1000, 'detail', 1)`
      );
    }
  } catch (error) {
    console.log('模板数据已存在');
  }

  try {
    const existingBenefits = all('SELECT COUNT(*) as count FROM member_benefits');
    if (existingBenefits[0]?.count === 0) {
      run(
        `INSERT INTO member_benefits (member_level, benefit_code, benefit_name, benefit_value) VALUES 
         ('basic', 'EXPORT_LIMIT', '导出次数限制', '10'),
         ('basic', 'TEMPLATE_ACCESS', '模板访问权限', 'basic'),
         ('premium', 'EXPORT_LIMIT', '导出次数限制', '100'),
         ('premium', 'TEMPLATE_ACCESS', '模板访问权限', 'all'),
         ('premium', 'PRIORITY_SUPPORT', '优先支持', 'true'),
         ('vip', 'EXPORT_LIMIT', '导出次数限制', 'unlimited'),
         ('vip', 'TEMPLATE_ACCESS', '模板访问权限', 'all'),
         ('vip', 'PRIORITY_SUPPORT', '优先支持', 'true'),
         ('vip', 'CUSTOM_TEMPLATE', '自定义模板', 'true')`
      );
    }
  } catch (error) {
    console.log('会员权益数据已存在');
  }

  console.log('Database initialized successfully');
};

module.exports = initDatabase;
