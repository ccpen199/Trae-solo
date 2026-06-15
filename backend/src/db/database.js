const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS platforms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      logo TEXT,
      base_price REAL DEFAULT 0,
      per_km_price REAL DEFAULT 0,
      per_kg_price REAL DEFAULT 0,
      min_delivery_time INTEGER DEFAULT 30,
      max_delivery_time INTEGER DEFAULT 120,
      capacity_saturation REAL DEFAULT 0.5,
      on_time_rate REAL DEFAULT 0.95,
      loss_rate REAL DEFAULT 0.01,
      complaint_rate REAL DEFAULT 0.02,
      status TEXT DEFAULT 'active',
      commission_rate REAL DEFAULT 0.05,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_name TEXT,
      contact_phone TEXT,
      address TEXT,
      latitude REAL,
      longitude REAL,
      balance REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      merchant_id INTEGER NOT NULL,
      sender_name TEXT,
      sender_phone TEXT,
      sender_address TEXT NOT NULL,
      sender_lat REAL,
      sender_lng REAL,
      receiver_name TEXT NOT NULL,
      receiver_phone TEXT NOT NULL,
      receiver_address TEXT NOT NULL,
      receiver_lat REAL,
      receiver_lng REAL,
      goods_name TEXT,
      goods_weight REAL DEFAULT 0,
      goods_value REAL DEFAULT 0,
      distance REAL DEFAULT 0,
      expected_delivery_time INTEGER,
      urgency TEXT DEFAULT 'normal',
      total_fee REAL DEFAULT 0,
      platform_fee REAL DEFAULT 0,
      platform_id INTEGER,
      platform_order_no TEXT,
      status TEXT DEFAULT 'pending',
      delivery_status TEXT DEFAULT 'pending',
      rider_name TEXT,
      rider_phone TEXT,
      estimated_arrival_time DATETIME,
      picked_up_at DATETIME,
      delivered_at DATETIME,
      cancel_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id),
      FOREIGN KEY (platform_id) REFERENCES platforms(id)
    );

    CREATE TABLE IF NOT EXISTS order_tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      description TEXT,
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS after_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      reason TEXT,
      new_address TEXT,
      new_lat REAL,
      new_lng REAL,
      status TEXT DEFAULT 'processing',
      platform_ack BOOLEAN DEFAULT 0,
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS compensations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      merchant_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL DEFAULT 0,
      coupon_code TEXT,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      review_result TEXT,
      reviewed_at DATETIME,
      triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      settlement_no TEXT UNIQUE NOT NULL,
      merchant_id INTEGER NOT NULL,
      platform_id INTEGER NOT NULL,
      period TEXT NOT NULL,
      total_orders INTEGER DEFAULT 0,
      total_amount REAL DEFAULT 0,
      commission_amount REAL DEFAULT 0,
      settlement_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id),
      FOREIGN KEY (platform_id) REFERENCES platforms(id)
    );

    CREATE TABLE IF NOT EXISTS settlement_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      settlement_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      order_amount REAL DEFAULT 0,
      commission_amount REAL DEFAULT 0,
      FOREIGN KEY (settlement_id) REFERENCES settlements(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);

  try {
    db.prepare('ALTER TABLE compensations ADD COLUMN review_result TEXT').run();
  } catch (e) {}
  try {
    db.prepare('ALTER TABLE compensations ADD COLUMN reviewed_at DATETIME').run();
  } catch (e) {}

  const platformCount = db.prepare('SELECT COUNT(*) as count FROM platforms').get().count;
  if (platformCount === 0) {
    const insertPlatform = db.prepare(`
      INSERT INTO platforms (code, name, logo, base_price, per_km_price, per_kg_price,
        min_delivery_time, max_delivery_time, capacity_saturation, on_time_rate, loss_rate,
        complaint_rate, commission_rate, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const platforms = [
      ['dada', '达达快送', '🚴', 8, 2.5, 0.5, 30, 90, 0.6, 0.96, 0.008, 0.015, 0.05, 'active'],
      ['sf-city', '顺丰同城', '📦', 12, 3, 0.8, 25, 60, 0.4, 0.98, 0.005, 0.01, 0.06, 'active'],
      ['shansong', '闪送', '⚡', 10, 3.5, 1, 20, 45, 0.3, 0.97, 0.006, 0.012, 0.07, 'active'],
      ['meituan', '美团众包', '🍔', 7, 2.2, 0.4, 35, 120, 0.7, 0.93, 0.012, 0.025, 0.045, 'active'],
      ['eleme', '蜂鸟即配', '🐦', 7.5, 2.3, 0.45, 30, 100, 0.65, 0.94, 0.01, 0.022, 0.048, 'active'],
      ['uu', 'UU跑腿', '🏃', 9, 2.8, 0.6, 25, 80, 0.5, 0.95, 0.009, 0.018, 0.055, 'active'],
      ['fengniao', '点我达', '🎯', 8.5, 2.6, 0.5, 30, 90, 0.55, 0.94, 0.011, 0.02, 0.052, 'active'],
      ['jitu', '极兔速递', '🐰', 6, 2, 0.3, 45, 180, 0.45, 0.91, 0.015, 0.03, 0.04, 'active'],
      ['jingdong', '京东到家', '🛒', 11, 2.9, 0.7, 25, 60, 0.35, 0.97, 0.007, 0.013, 0.065, 'active'],
      ['suning', '苏宁秒达', '⏱️', 9.5, 2.7, 0.55, 30, 75, 0.4, 0.95, 0.008, 0.016, 0.058, 'active'],
      ['baishi', '百世闪送', '💨', 7, 2.1, 0.35, 40, 150, 0.6, 0.92, 0.013, 0.028, 0.042, 'active'],
      ['deppon', '德邦快递', '🚚', 15, 4, 1.5, 40, 120, 0.25, 0.98, 0.004, 0.008, 0.08, 'active'],
    ];

    for (const p of platforms) {
      insertPlatform.run(...p);
    }
  }

  const merchantCount = db.prepare('SELECT COUNT(*) as count FROM merchants').get().count;
  if (merchantCount === 0) {
    const insertMerchant = db.prepare(`
      INSERT INTO merchants (name, contact_name, contact_phone, address, latitude, longitude, balance)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertMerchant.run('美味鲜花店', '张经理', '13800138001', '北京市朝阳区建国路88号', 39.9087, 116.4572, 5000);
    insertMerchant.run('鲜果时光', '李老板', '13800138002', '北京市海淀区中关村大街1号', 39.9847, 116.3056, 3200);
  }

  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  if (orderCount === 0) {
    const insertOrder = db.prepare(`
      INSERT INTO orders (order_no, merchant_id, sender_name, sender_phone, sender_address,
        sender_lat, sender_lng, receiver_name, receiver_phone, receiver_address,
        receiver_lat, receiver_lng, goods_name, goods_weight, goods_value, distance,
        expected_delivery_time, urgency, total_fee, platform_fee, platform_id,
        platform_order_no, status, delivery_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleOrders = [
      ['DD202401150001', 1, '张经理', '13800138001', '北京市朝阳区建国路88号', 39.9087, 116.4572,
        '王女士', '13900139001', '北京市东城区王府井大街138号', 39.9147, 116.4107,
        '玫瑰花束', 0.5, 299, 5.2, 45, 'normal', 28, 26.6, 1, 'DADA20240115001',
        'assigned', 'delivering'],
      ['DD202401150002', 1, '张经理', '13800138001', '北京市朝阳区建国路88号', 39.9087, 116.4572,
        '李先生', '13900139002', '北京市西城区西单北大街120号', 39.9128, 116.3763,
        '生日蛋糕', 1.2, 198, 8.5, 60, 'urgent', 42, 39.5, 2, 'SF20240115002',
        'assigned', 'picked'],
      ['DD202401150003', 2, '李老板', '13800138002', '北京市海淀区中关村大街1号', 39.9847, 116.3056,
        '赵先生', '13900139003', '北京市西城区金融街7号', 39.9145, 116.3627,
        '水果礼盒', 3, 158, 12.3, 90, 'normal', 38, 36.2, 4, 'MT20240115003',
        'pending', 'pending'],
      ['DD202401150004', 1, '张经理', '13800138001', '北京市朝阳区建国路88号', 39.9087, 116.4572,
        '陈女士', '13900139004', '北京市丰台区丰台路1号', 39.8639, 116.2869,
        '文件资料', 0.3, 50, 18.6, 120, 'normal', 52, 49.4, 3, 'SS20240115004',
        'assigned', 'delivered'],
      ['DD202401150005', 2, '李老板', '13800138002', '北京市海淀区中关村大街1号', 39.9847, 116.3056,
        '周先生', '13900139005', '北京市朝阳区三里屯路19号', 39.9367, 116.4556,
        '进口水果', 2.5, 268, 10.1, 75, 'urgent', 45, 42.8, 3, 'SS20240115005',
        'assigned', 'delivering'],
    ];

    for (const o of sampleOrders) {
      insertOrder.run(...o);
    }

    const insertTrack = db.prepare(`
      INSERT INTO order_tracks (order_id, status, description, location)
      VALUES (?, ?, ?, ?)
    `);

    const tracks = [
      [1, 'pending', '订单已创建，等待分配', '北京市朝阳区建国路88号'],
      [1, 'assigned', '已分配达达快送骑手', '北京市朝阳区建国路88号'],
      [1, 'picked', '骑手已取货', '北京市朝阳区建国路88号'],
      [1, 'delivering', '配送中', '北京市朝阳区'],
      [2, 'pending', '订单已创建，等待分配', '北京市朝阳区建国路88号'],
      [2, 'assigned', '已分配顺丰同城骑手', '北京市朝阳区建国路88号'],
      [2, 'picked', '骑手已取货，正在配送', '北京市朝阳区建国路88号'],
      [4, 'pending', '订单已创建，等待分配', '北京市朝阳区建国路88号'],
      [4, 'assigned', '已分配闪送骑手', '北京市朝阳区建国路88号'],
      [4, 'picked', '骑手已取货', '北京市朝阳区建国路88号'],
      [4, 'delivering', '配送中', '北京市朝阳区'],
      [4, 'delivered', '已送达', '北京市丰台区丰台路1号'],
      [5, 'pending', '订单已创建，等待分配', '北京市海淀区中关村大街1号'],
      [5, 'assigned', '已分配闪送骑手', '北京市海淀区中关村大街1号'],
      [5, 'picked', '骑手已取货', '北京市海淀区中关村大街1号'],
      [5, 'delivering', '配送中', '北京市海淀区'],
    ];

    for (const t of tracks) {
      insertTrack.run(...t);
    }
  }

  console.log('Database initialized successfully');
}

initDatabase();

module.exports = db;
