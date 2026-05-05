const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

const initDatabase = () => {
  db.exec(`
    -- 分公司表
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      parent_id INTEGER DEFAULT 0,
      is_headquarters INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 岗位表
    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      permissions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      erp_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      branch_id INTEGER NOT NULL,
      position_id INTEGER NOT NULL,
      status INTEGER DEFAULT 1,
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches (id),
      FOREIGN KEY (position_id) REFERENCES positions (id)
    );

    -- 用户操作日志（变更记录）
    CREATE TABLE IF NOT EXISTS user_change_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      field TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changer_id INTEGER NOT NULL,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (changer_id) REFERENCES users (id)
    );

    -- 配送中心表
    CREATE TABLE IF NOT EXISTS distribution_centers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      branch_id INTEGER NOT NULL,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches (id)
    );

    -- 库房表
    CREATE TABLE IF NOT EXISTS warehouses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      distribution_center_id INTEGER NOT NULL,
      branch_id INTEGER NOT NULL,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (distribution_center_id) REFERENCES distribution_centers (id),
      FOREIGN KEY (branch_id) REFERENCES branches (id)
    );

    -- 调度配置表
    CREATE TABLE IF NOT EXISTS scheduling_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      distribution_center_id INTEGER NOT NULL,
      warehouse_id INTEGER NOT NULL,
      order_type TEXT NOT NULL,
      min_items INTEGER DEFAULT 1,
      max_items INTEGER,
      min_volume REAL,
      max_volume REAL,
      min_weight REAL,
      max_weight REAL,
      status INTEGER DEFAULT 1,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (distribution_center_id) REFERENCES distribution_centers (id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    );

    -- 订单主表
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      order_type TEXT NOT NULL,
      order_status TEXT DEFAULT 'pending',
      is_scheduled INTEGER DEFAULT 0,
      is_self_pickup INTEGER DEFAULT 0,
      is_same_day INTEGER DEFAULT 0,
      has_timing_calculated INTEGER DEFAULT 1,
      calendar_consistent INTEGER DEFAULT 1,
      receiver_name TEXT,
      receiver_phone TEXT,
      receiver_landline TEXT,
      appointment_date TEXT,
      appointment_time TEXT,
      item_count INTEGER DEFAULT 1,
      volume REAL,
      weight REAL,
      distribution_center_id INTEGER,
      warehouse_id INTEGER,
      branch_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 订单锁表（防止并发处理）
    CREATE TABLE IF NOT EXISTS order_locks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      batch_id TEXT NOT NULL,
      locked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (order_id) REFERENCES orders (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    -- 调度记录表
    CREATE TABLE IF NOT EXISTS scheduling_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      batch_id TEXT NOT NULL,
      action TEXT NOT NULL,
      old_receiver_name TEXT,
      new_receiver_name TEXT,
      old_receiver_phone TEXT,
      new_receiver_phone TEXT,
      old_receiver_landline TEXT,
      new_receiver_landline TEXT,
      old_appointment_date TEXT,
      new_appointment_date TEXT,
      old_appointment_time TEXT,
      new_appointment_time TEXT,
      exception_remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    -- 恶意拒收客户表
    CREATE TABLE IF NOT EXISTS malicious_rejects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receiver_phone TEXT UNIQUE NOT NULL,
      reject_count INTEGER DEFAULT 1,
      last_reject_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (order_status);
    CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders (branch_id);
    CREATE INDEX IF NOT EXISTS idx_orders_scheduled ON orders (is_scheduled);
    CREATE INDEX IF NOT EXISTS idx_order_locks_user ON order_locks (user_id);
    CREATE INDEX IF NOT EXISTS idx_order_locks_expires ON order_locks (expires_at);
    CREATE INDEX IF NOT EXISTS idx_scheduling_configs_dc ON scheduling_configs (distribution_center_id);
    CREATE INDEX IF NOT EXISTS idx_scheduling_configs_wh ON scheduling_configs (warehouse_id);
  `);

  console.log('数据库初始化完成');
};

const seedInitialData = () => {
  const bcrypt = require('bcryptjs');
  
  const headBranch = db.prepare(`
    SELECT id FROM branches WHERE code = 'HEAD'
  `).get();

  if (!headBranch) {
    db.prepare(`
      INSERT INTO branches (code, name, parent_id, is_headquarters)
      VALUES ('HEAD', '总公司', 0, 1)
    `).run();

    db.prepare(`
      INSERT INTO branches (code, name, parent_id, is_headquarters)
      VALUES ('BJ', '北京分公司', 1, 0)
    `).run();

    db.prepare(`
      INSERT INTO branches (code, name, parent_id, is_headquarters)
      VALUES ('SH', '上海分公司', 1, 0)
    `).run();
  }

  const adminPos = db.prepare(`
    SELECT id FROM positions WHERE code = 'ADMIN'
  `).get();

  if (!adminPos) {
    db.prepare(`
      INSERT INTO positions (code, name, description, permissions)
      VALUES ('ADMIN', '系统管理员', '系统管理员，拥有全部权限', '["admin","scheduler","viewer"]')
    `).run();

    db.prepare(`
      INSERT INTO positions (code, name, description, permissions)
      VALUES ('SCHEDULER', '调度员', '订单调度人员', '["scheduler"]')
    `).run();

    db.prepare(`
      INSERT INTO positions (code, name, description, permissions)
      VALUES ('VIEWER', '查看员', '只读查看人员', '["viewer"]')
    `).run();
  }

  const adminUser = db.prepare(`
    SELECT id FROM users WHERE erp_id = 'admin'
  `).get();

  if (!adminUser) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (erp_id, name, password, branch_id, position_id, status)
      VALUES ('admin', '系统管理员', ?, 1, 1, 1)
    `).run(hashedPassword);

    const schedulerPassword = bcrypt.hashSync('123456', 10);
    db.prepare(`
      INSERT INTO users (erp_id, name, password, branch_id, position_id, status)
      VALUES ('scheduler_bj', '北京调度员', ?, 2, 2, 1)
    `).run(schedulerPassword);

    db.prepare(`
      INSERT INTO users (erp_id, name, password, branch_id, position_id, status)
      VALUES ('scheduler_sh', '上海调度员', ?, 3, 2, 1)
    `).run(schedulerPassword);
  }

  const dcCheck = db.prepare(`
    SELECT id FROM distribution_centers WHERE code = 'BJDC01'
  `).get();

  if (!dcCheck) {
    db.prepare(`
      INSERT INTO distribution_centers (code, name, branch_id, status)
      VALUES ('BJDC01', '北京配送中心', 2, 1)
    `).run();

    db.prepare(`
      INSERT INTO distribution_centers (code, name, branch_id, status)
      VALUES ('SHDC01', '上海配送中心', 3, 1)
    `).run();

    db.prepare(`
      INSERT INTO warehouses (code, name, distribution_center_id, branch_id, status)
      VALUES ('BJWH01', '北京中心库房', 1, 2, 1)
    `).run();

    db.prepare(`
      INSERT INTO warehouses (code, name, distribution_center_id, branch_id, status)
      VALUES ('SHWH01', '上海中心库房', 2, 3, 1)
    `).run();
  }

  const configCheck = db.prepare(`
    SELECT id FROM scheduling_configs WHERE id = 1
  `).get();

  if (!configCheck) {
    db.prepare(`
      INSERT INTO scheduling_configs (
        distribution_center_id, warehouse_id, order_type,
        min_items, max_items, min_volume, max_volume,
        min_weight, max_weight, status, created_by
      ) VALUES (1, 1, 'standard', 1, 50, 0.1, 50.0, 1.0, 500.0, 1, 1)
    `).run();

    db.prepare(`
      INSERT INTO scheduling_configs (
        distribution_center_id, warehouse_id, order_type,
        min_items, max_items, min_volume, max_volume,
        min_weight, max_weight, status, created_by
      ) VALUES (2, 2, 'standard', 1, 50, 0.1, 50.0, 1.0, 500.0, 1, 1)
    `).run();
  }

  const orderCheck = db.prepare(`
    SELECT id FROM orders WHERE order_no = 'TEST20260504001'
  `).get();

  if (!orderCheck) {
    const orders = [
      {
        order_no: 'TEST20260504001',
        order_type: 'standard',
        order_status: 'pending',
        is_scheduled: 0,
        is_self_pickup: 0,
        is_same_day: 0,
        has_timing_calculated: 1,
        calendar_consistent: 1,
        receiver_name: '张三',
        receiver_phone: '13800138001',
        receiver_landline: '010-12345678',
        appointment_date: '2026-05-10',
        appointment_time: '09:00-12:00',
        item_count: 3,
        volume: 2.5,
        weight: 15.5,
        distribution_center_id: 1,
        warehouse_id: 1,
        branch_id: 2
      },
      {
        order_no: 'TEST20260504002',
        order_type: 'standard',
        order_status: 'pending',
        is_scheduled: 0,
        is_self_pickup: 0,
        is_same_day: 0,
        has_timing_calculated: 1,
        calendar_consistent: 1,
        receiver_name: '李四',
        receiver_phone: '13800138002',
        receiver_landline: '010-87654321',
        appointment_date: '2026-05-11',
        appointment_time: '14:00-18:00',
        item_count: 2,
        volume: 1.8,
        weight: 8.0,
        distribution_center_id: 1,
        warehouse_id: 1,
        branch_id: 2
      },
      {
        order_no: 'TEST20260504003',
        order_type: 'standard',
        order_status: 'pending',
        is_scheduled: 0,
        is_self_pickup: 0,
        is_same_day: 0,
        has_timing_calculated: 1,
        calendar_consistent: 1,
        receiver_name: '王五',
        receiver_phone: '13900139001',
        receiver_landline: '021-12345678',
        appointment_date: '2026-05-12',
        appointment_time: '09:00-12:00',
        item_count: 5,
        volume: 4.2,
        weight: 25.0,
        distribution_center_id: 2,
        warehouse_id: 2,
        branch_id: 3
      }
    ];

    const insertOrder = db.prepare(`
      INSERT INTO orders (
        order_no, order_type, order_status, is_scheduled, is_self_pickup,
        is_same_day, has_timing_calculated, calendar_consistent,
        receiver_name, receiver_phone, receiver_landline,
        appointment_date, appointment_time, item_count, volume, weight,
        distribution_center_id, warehouse_id, branch_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const order of orders) {
      insertOrder.run(
        order.order_no, order.order_type, order.order_status, order.is_scheduled,
        order.is_self_pickup, order.is_same_day, order.has_timing_calculated,
        order.calendar_consistent, order.receiver_name, order.receiver_phone,
        order.receiver_landline, order.appointment_date, order.appointment_time,
        order.item_count, order.volume, order.weight, order.distribution_center_id,
        order.warehouse_id, order.branch_id
      );
    }
  }

  console.log('初始数据插入完成');
};

module.exports = {
  db,
  initDatabase,
  seedInitialData
};
