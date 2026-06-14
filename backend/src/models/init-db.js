const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone VARCHAR(20) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100),
      avatar VARCHAR(255),
      rating DECIMAL(3,2) DEFAULT 5.00,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS couriers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone VARCHAR(20) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100),
      avatar VARCHAR(255),
      id_card VARCHAR(20),
      face_verified INTEGER DEFAULT 0,
      service_license VARCHAR(255),
      license_types TEXT,
      credit_score INTEGER DEFAULT 100,
      status VARCHAR(20) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS item_safety_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(50) NOT NULL,
      risk_factor DECIMAL(3,2) DEFAULT 1.0,
      icon VARCHAR(50),
      description TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      name VARCHAR(200) NOT NULL,
      category VARCHAR(100),
      safety_level_id INTEGER,
      features TEXT,
      feature_code VARCHAR(100),
      photos TEXT,
      special_requirements TEXT,
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (safety_level_id) REFERENCES item_safety_levels(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      courier_id INTEGER,
      pickup_address TEXT NOT NULL,
      pickup_lat DECIMAL(10,8),
      pickup_lng DECIMAL(11,8),
      delivery_address TEXT NOT NULL,
      delivery_lat DECIMAL(10,8),
      delivery_lng DECIMAL(11,8),
      distance_km DECIMAL(10,2),
      item_id INTEGER,
      safety_level_id INTEGER,
      status VARCHAR(30) DEFAULT 'pending',
      priority VARCHAR(20) DEFAULT 'normal',
      pickup_time DATETIME,
      delivery_deadline DATETIME,
      base_price DECIMAL(10,2),
      dynamic_price DECIMAL(10,2),
      final_price DECIMAL(10,2),
      insurance_id INTEGER,
      sla_minutes INTEGER DEFAULT 60,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES users(id),
      FOREIGN KEY (courier_id) REFERENCES couriers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS task_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      status VARCHAR(30) NOT NULL,
      operator_id INTEGER,
      operator_type VARCHAR(20),
      note TEXT,
      gps_location TEXT,
      photo VARCHAR(255),
      signature TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS time_pricing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time_start TIME NOT NULL,
      time_end TIME NOT NULL,
      price_multiplier DECIMAL(3,2) DEFAULT 1.0,
      name VARCHAR(50)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dynamic_pricing_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_type VARCHAR(50) NOT NULL,
      condition TEXT,
      price_adjustment DECIMAL(5,2) DEFAULT 1.0,
      priority INTEGER DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS insurance_policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      policy_number VARCHAR(50) UNIQUE NOT NULL,
      coverage_type VARCHAR(50) NOT NULL,
      premium DECIMAL(10,2) NOT NULL,
      coverage_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      reviewer_type VARCHAR(20) NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      photos TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS gps_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      courier_id INTEGER NOT NULL,
      latitude DECIMAL(10,8) NOT NULL,
      longitude DECIMAL(11,8) NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      speed DECIMAL(6,2),
      heading INTEGER,
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      FOREIGN KEY (courier_id) REFERENCES couriers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS exception_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      type VARCHAR(50) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'open',
      assigned_to INTEGER,
      resolution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS city_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_name VARCHAR(50) NOT NULL,
      district_name VARCHAR(50),
      geofence TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS restricted_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword VARCHAR(100) NOT NULL,
      category VARCHAR(50),
      severity VARCHAR(20) DEFAULT 'warning',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dispute_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      complainant_id INTEGER NOT NULL,
      respondent_id INTEGER,
      reason TEXT NOT NULL,
      evidence TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      arbitrator_id INTEGER,
      decision TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS courier_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      courier_id INTEGER NOT NULL,
      action_type VARCHAR(50) NOT NULL,
      action_detail TEXT,
      ip_address VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (courier_id) REFERENCES couriers(id)
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_courier ON tasks(courier_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_gps_task ON gps_tracking(task_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_task ON reviews(task_id)`);

  const insertSafetyLevel = db.prepare('INSERT OR IGNORE INTO item_safety_levels (id, name, risk_factor, icon, description) VALUES (?, ?, ?, ?, ?)');
  insertSafetyLevel.run(1, '活体', 1.5, '🐾', '活体动物，需要特殊处理和快速送达');
  insertSafetyLevel.run(2, '易碎', 1.3, '⚠️', '易碎物品，需要轻拿轻放');
  insertSafetyLevel.run(3, '时效敏感', 1.2, '⏰', '有时间限制的物品');
  insertSafetyLevel.run(4, '普通', 1.0, '📦', '普通物品，无特殊要求');
  insertSafetyLevel.finalize();

  const insertTimePricing = db.prepare('INSERT OR IGNORE INTO time_pricing (id, time_start, time_end, price_multiplier, name) VALUES (?, ?, ?, ?, ?)');
  insertTimePricing.run(1, '00:00', '06:00', 1.5, '深夜时段');
  insertTimePricing.run(2, '06:00', '09:00', 1.2, '早高峰');
  insertTimePricing.run(3, '09:00', '12:00', 1.0, '上午常规');
  insertTimePricing.run(4, '12:00', '14:00', 1.3, '午间高峰');
  insertTimePricing.run(5, '14:00', '18:00', 1.0, '下午常规');
  insertTimePricing.run(6, '18:00', '21:00', 1.4, '晚高峰');
  insertTimePricing.run(7, '21:00', '24:00', 1.2, '晚间时段');
  insertTimePricing.finalize();

  const insertPricingRule = db.prepare('INSERT OR IGNORE INTO dynamic_pricing_rules (id, rule_type, condition, price_adjustment, priority) VALUES (?, ?, ?, ?, ?)');
  insertPricingRule.run(1, 'distance', '0-5km', 1.0, 1);
  insertPricingRule.run(2, 'distance', '5-10km', 1.2, 1);
  insertPricingRule.run(3, 'distance', '10-20km', 1.5, 1);
  insertPricingRule.run(4, 'distance', '>20km', 2.0, 1);
  insertPricingRule.run(5, 'credit', 'courier_credit<60', 1.1, 2);
  insertPricingRule.run(6, 'demand', 'high_demand', 1.3, 3);
  insertPricingRule.finalize();

  const insertRestrictedItem = db.prepare('INSERT OR IGNORE INTO restricted_items (id, keyword, category, severity, is_active) VALUES (?, ?, ?, ?, ?)');
  insertRestrictedItem.run(1, '毒品', '违禁品', 'prohibited', 1);
  insertRestrictedItem.run(2, '枪支', '违禁品', 'prohibited', 1);
  insertRestrictedItem.run(3, '易燃易爆', '危险品', 'dangerous', 1);
  insertRestrictedItem.run(4, '管制刀具', '违禁品', 'prohibited', 1);
  insertRestrictedItem.run(5, '野生动物', '活体', 'warning', 1);
  insertRestrictedItem.finalize();

  console.log('数据库初始化完成');
});

db.close();
