const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('开始创建数据库表...');

  db.run(`PRAGMA foreign_keys = ON`);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      real_name TEXT,
      phone TEXT UNIQUE,
      role TEXT NOT NULL DEFAULT 'resident',
      avatar TEXT,
      status TEXT DEFAULT 'pending',
      id_card TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS buildings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      floors INTEGER DEFAULT 30,
      units_per_floor INTEGER DEFAULT 4,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      building_id INTEGER,
      unit_number TEXT NOT NULL,
      floor INTEGER,
      area REAL,
      owner_id INTEGER,
      status TEXT DEFAULT 'vacant',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (building_id) REFERENCES buildings(id),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      relation TEXT DEFAULT 'owner',
      bind_status TEXT DEFAULT 'pending',
      verified_at DATETIME,
      verified_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS access_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'door',
      location TEXT,
      building_id INTEGER,
      status TEXT DEFAULT 'online',
      last_health REAL DEFAULT 100,
      last_check DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (building_id) REFERENCES buildings(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS access_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      device_id INTEGER,
      access_type TEXT DEFAULT 'card',
      access_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      result TEXT DEFAULT 'success',
      temperature REAL,
      mask_detected INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (device_id) REFERENCES access_devices(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_name TEXT NOT NULL,
      visitor_phone TEXT,
      visitor_id_card TEXT,
      host_user_id INTEGER,
      host_room_id INTEGER,
      valid_from DATETIME NOT NULL,
      valid_to DATETIME NOT NULL,
      access_areas TEXT,
      access_buildings TEXT,
      auth_code TEXT UNIQUE,
      status TEXT DEFAULT 'active',
      qr_code TEXT,
      temperature REAL,
      checkin_time DATETIME,
      checkout_time DATETIME,
      is_overstay INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (host_user_id) REFERENCES users(id),
      FOREIGN KEY (host_room_id) REFERENCES rooms(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS access_grants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_id INTEGER NOT NULL,
      building_id INTEGER NOT NULL,
      device_id INTEGER,
      granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (visitor_id) REFERENCES visitors(id),
      FOREIGN KEY (building_id) REFERENCES buildings(id),
      FOREIGN KEY (device_id) REFERENCES access_devices(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS product_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      sort_order INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      license_no TEXT,
      license_image TEXT,
      category_id INTEGER,
      contact_name TEXT,
      contact_phone TEXT,
      address TEXT,
      rating REAL DEFAULT 5,
      qualification_status TEXT DEFAULT 'pending',
      status TEXT DEFAULT 'active',
      verified_at DATETIME,
      verified_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES product_categories(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category_id INTEGER,
      merchant_id INTEGER,
      price REAL NOT NULL,
      original_price REAL,
      stock INTEGER DEFAULT 0,
      stock_warning INTEGER DEFAULT 10,
      image TEXT,
      status TEXT DEFAULT 'on_sale',
      expiry_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES product_categories(id),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      pay_status TEXT DEFAULT 'unpaid',
      pay_time DATETIME,
      coupon_id INTEGER,
      visitor_id INTEGER,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT,
      type TEXT DEFAULT 'discount',
      value REAL,
      min_amount REAL DEFAULT 0,
      user_id INTEGER,
      status TEXT DEFAULT 'unused',
      used_at DATETIME,
      order_id INTEGER,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      type TEXT DEFAULT 'notice',
      target_roles TEXT,
      published_by INTEGER,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS announcement_reads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      announcement_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (announcement_id) REFERENCES announcements(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      level TEXT DEFAULT 'warning',
      title TEXT NOT NULL,
      content TEXT,
      device_id INTEGER,
      building_id INTEGER,
      related_user_id INTEGER,
      status TEXT DEFAULT 'pending',
      handled_by INTEGER,
      handled_at DATETIME,
      handle_result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES access_devices(id),
      FOREIGN KEY (building_id) REFERENCES buildings(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS security_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      level TEXT DEFAULT 'normal',
      description TEXT,
      device_id INTEGER,
      building_id INTEGER,
      involved_user_id INTEGER,
      involved_visitor_id INTEGER,
      status TEXT DEFAULT 'open',
      handled_by INTEGER,
      handled_at DATETIME,
      closure_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES access_devices(id),
      FOREIGN KEY (building_id) REFERENCES buildings(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS device_health_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      health_score REAL,
      temperature REAL,
      network_status TEXT,
      battery_level REAL,
      check_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES access_devices(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER,
      product_id INTEGER,
      user_id INTEGER,
      rating INTEGER,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      change_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      stock_before INTEGER,
      stock_after INTEGER,
      operator_id INTEGER,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  console.log('数据库表创建完成！');

  db.run(`
    INSERT OR IGNORE INTO users (username, password, real_name, phone, role, status, id_card) VALUES
    ('admin', 'admin123', '系统管理员', '13800000000', 'admin', 'verified', '110101199001010001'),
    ('property', 'prop123', '物业管理员', '13800000001', 'property', 'verified', '110101199002020002'),
    ('resident1', 'res123', '业主张三', '13800000002', 'resident', 'verified', '110101199003030003'),
    ('resident2', 'res456', '住户李四', '13800000003', 'resident', 'pending', '110101199004040004'),
    ('merchant1', 'mer123', '商户王老板', '13800000004', 'merchant', 'verified', '110101199005050005')
  `);

  db.run(`
    INSERT OR IGNORE INTO buildings (name, address, floors, units_per_floor) VALUES
    ('1号楼', '小区东区', 30, 4),
    ('2号楼', '小区东区', 28, 4),
    ('3号楼', '小区西区', 32, 6),
    ('5号楼', '小区西区', 25, 4)
  `);

  db.run(`
    INSERT OR IGNORE INTO rooms (building_id, unit_number, floor, area, owner_id, status) VALUES
    (1, '1-101', 1, 89.5, 3, 'occupied'),
    (1, '1-102', 1, 92.0, 3, 'occupied'),
    (1, '1-201', 2, 89.5, NULL, 'vacant'),
    (2, '2-503', 5, 105.0, 4, 'occupied'),
    (3, '3-1202', 12, 78.0, NULL, 'vacant')
  `);

  db.run(`
    INSERT OR IGNORE INTO user_rooms (user_id, room_id, relation, bind_status, verified_at, verified_by) VALUES
    (3, 1, 'owner', 'verified', CURRENT_TIMESTAMP, 2),
    (3, 2, 'owner', 'verified', CURRENT_TIMESTAMP, 2),
    (4, 4, 'tenant', 'pending', NULL, NULL)
  `);

  db.run(`
    INSERT OR IGNORE INTO access_devices (name, type, location, building_id, status, last_health) VALUES
    ('1号楼大门', 'door', '1号楼单元门', 1, 'online', 98),
    ('1号楼电梯', 'elevator', '1号楼电梯间', 1, 'online', 95),
    ('2号楼大门', 'door', '2号楼单元门', 2, 'online', 92),
    ('3号楼大门', 'door', '3号楼单元门', 3, 'warning', 75),
    ('小区东门', 'gate', '小区东门', NULL, 'online', 99),
    ('小区南门', 'gate', '小区南门', NULL, 'online', 97)
  `);

  db.run(`
    INSERT OR IGNORE INTO product_categories (name, parent_id, sort_order) VALUES
    ('生活服务', NULL, 1),
    ('便民维修', 1, 1),
    ('家政清洁', 1, 2),
    ('生鲜配送', 1, 3),
    ('社区团购', NULL, 2),
    ('蔬果', 5, 1),
    ('日用百货', 5, 2)
  `);

  db.run(`
    INSERT OR IGNORE INTO merchants (name, license_no, category_id, contact_name, contact_phone, address, rating, qualification_status, status, verified_at, verified_by) VALUES
    ('快修服务中心', 'XXX12345', 2, '王经理', '13900000001', '小区商业街1号', 4.8, 'verified', 'active', CURRENT_TIMESTAMP, 2),
    ('洁家家政', 'XXX67890', 3, '李阿姨', '13900000002', '小区商业街2号', 4.9, 'verified', 'active', CURRENT_TIMESTAMP, 2),
    ('鲜果园', 'XXX11111', 6, '张老板', '13900000003', '小区商业街3号', 4.7, 'verified', 'active', CURRENT_TIMESTAMP, 2),
    ('便民超市', 'XXX22222', 7, '刘店长', '13900000004', '小区商业街5号', 4.6, 'pending', 'active', NULL, NULL)
  `);

  db.run(`
    INSERT OR IGNORE INTO products (name, description, category_id, merchant_id, price, original_price, stock, stock_warning, status, expiry_date) VALUES
    ('空调维修服务', '专业空调维修、清洗、加氟', 2, 1, 150.00, 180.00, 20, 5, 'on_sale', NULL),
    ('家庭深度清洁', '120平米以内全屋深度清洁', 3, 2, 299.00, 399.00, 10, 3, 'on_sale', NULL),
    ('新鲜蔬菜套餐', '当季新鲜蔬菜5斤装', 6, 3, 39.90, 49.90, 100, 20, 'on_sale', NULL),
    ('精品水果礼盒', '进口水果礼盒5kg', 6, 3, 168.00, 198.00, 30, 5, 'on_sale', NULL),
    ('大米10kg装', '东北五常大米', 7, 4, 79.90, 89.90, 8, 10, 'on_sale', NULL)
  `);

  db.run(`
    INSERT OR IGNORE INTO visitors (visitor_name, visitor_phone, visitor_id_card, host_user_id, host_room_id, valid_from, valid_to, access_areas, access_buildings, auth_code, status, temperature, checkin_time, created_by) VALUES
    ('访客小明', '13700000001', '110101199501010001', 3, 1, datetime('now', '-1 hour'), datetime('now', '+1 day'), '1号楼,小区东门', '1', 'AUTH20240101001', 'active', 36.5, datetime('now', '-30 minutes'), 3),
    ('快递员小王', '13700000002', NULL, 3, 1, datetime('now'), datetime('now', '+2 hours'), '1号楼,小区东门', '1', 'AUTH20240101002', 'active', NULL, NULL, 3),
    ('装修工人老李', '13700000003', '110101198001010003', 4, 4, datetime('now', '-3 hours'), datetime('now', '+5 hours'), '2号楼,小区东门', '2', 'AUTH20240101003', 'overdue', 36.8, datetime('now', '-2 hours'), 4)
  `);

  db.run(`
    INSERT OR IGNORE INTO access_records (user_id, device_id, access_type, result, temperature, mask_detected) VALUES
    (3, 1, 'card', 'success', 36.5, 1),
    (3, 2, 'card', 'success', 36.5, 1),
    (NULL, 1, 'qrcode', 'success', 36.5, 1),
    (4, 3, 'card', 'success', 36.7, 1),
    (NULL, 4, 'card', 'fail', 37.8, 0)
  `);

  db.run(`
    INSERT OR IGNORE INTO orders (order_no, user_id, product_id, quantity, total_amount, status, pay_status, pay_time) VALUES
    ('ORD20240101001', 3, 1, 1, 150.00, 'completed', 'paid', datetime('now', '-2 hours')),
    ('ORD20240101002', 3, 3, 2, 79.80, 'paid', 'paid', datetime('now', '-1 hour')),
    ('ORD20240101003', 4, 2, 1, 299.00, 'pending', 'unpaid', NULL)
  `);

  db.run(`
    INSERT OR IGNORE INTO coupons (code, name, type, value, min_amount, user_id, status, expires_at) VALUES
    ('NEW50', '新人优惠券50元', 'discount', 50.00, 200.00, 3, 'unused', datetime('now', '+30 days')),
    ('SERVICE10', '服务满减券10元', 'discount', 10.00, 100.00, 3, 'used', datetime('now', '-1 day')),
    ('FRESH20', '生鲜满减券20元', 'discount', 20.00, 99.00, 4, 'unused', datetime('now', '+15 days'))
  `);

  db.run(`
    INSERT OR IGNORE INTO announcements (title, content, type, target_roles, published_by, status) VALUES
    ('关于小区门禁系统升级通知', '为提升小区安全，将于本周六凌晨2-4点进行门禁系统升级，期间门禁暂停使用，请各位业主提前做好安排。', 'notice', 'all', 1, 'published'),
    ('春节期间安全提醒', '春节期间请注意防火防盗，外出时请关好门窗，祝大家新年快乐！', 'warning', 'all', 1, 'published'),
    ('物业服务满意度调查', '诚邀您参与物业服务满意度调查，您的意见对我们很重要。', 'survey', 'resident,merchant', 2, 'published')
  `);

  db.run(`
    INSERT OR IGNORE INTO announcement_reads (announcement_id, user_id) VALUES
    (1, 3),
    (1, 4)
  `);

  db.run(`
    INSERT OR IGNORE INTO alerts (type, level, title, content, device_id, building_id, status, handled_by, handled_at, handle_result) VALUES
    ('device_offline', 'critical', '3号楼门禁离线', '3号楼大门门禁设备已离线30分钟', 4, 3, 'resolved', 2, datetime('now', '-1 hour'), '已联系维修人员，设备已恢复正常'),
    ('high_temperature', 'warning', '体温异常检测', '检测到高温人员37.8度，未戴口罩', 4, NULL, 'resolved', 2, datetime('now', '-30 minutes'), '已拦截并登记，人员拒绝进入'),
    ('stock_warning', 'info', '库存预警', '大米10kg装库存不足', NULL, NULL, 'pending', NULL, NULL, NULL),
    ('overstay_visitor', 'warning', '访客超时滞留', '访客老李已超时滞留2小时', NULL, 2, 'pending', NULL, NULL, NULL)
  `);

  db.run(`
    INSERT OR IGNORE INTO security_events (event_type, level, description, device_id, building_id, involved_user_id, status, handled_by, handled_at, closure_note) VALUES
    ('unauthorized_access', 'warning', '15:30有人试图尾随进入1号楼', 1, 1, NULL, 'closed', 2, datetime('now', '-3 hours'), '已核实为尾随人员，已劝离'),
    ('suspicious_activity', 'warning', '监控检测到可疑人员在停车场徘徊', NULL, NULL, NULL, 'open', NULL, NULL, NULL),
    ('fire_alarm', 'critical', '2号楼烟感报警', NULL, 2, 4, 'closed', 2, datetime('now', '-5 hours'), '误报，已确认正常')
  `);

  db.run(`
    INSERT OR IGNORE INTO device_health_logs (device_id, health_score, temperature, network_status, battery_level) VALUES
    (1, 98, 25, 'online', 100),
    (2, 95, 26, 'online', 95),
    (3, 92, 24, 'online', 88),
    (4, 75, 28, 'unstable', 60),
    (4, 60, 30, 'offline', 20)
  `);

  db.run(`
    INSERT OR IGNORE INTO reviews (merchant_id, product_id, user_id, rating, content) VALUES
    (1, 1, 3, 5, '师傅很专业，维修很到位！'),
    (3, 3, 3, 5, '蔬菜很新鲜，送货也很快'),
    (2, 2, 4, 4, '清洁阿姨很认真，就是稍微有点贵')
  `);

  db.run(`
    INSERT OR IGNORE INTO inventory_logs (product_id, change_type, quantity, stock_before, stock_after, operator_id, remark) VALUES
    (5, 'sale', -2, 10, 8, 2, '订单购买'),
    (3, 'restock', 50, 50, 100, 2, '补货入库'),
    (5, 'warning', 0, 8, 8, 2, '库存预警触发')
  `);

  console.log('初始数据插入完成！');
});

db.close();
