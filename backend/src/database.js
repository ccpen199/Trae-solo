const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS riders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'offline',
      latitude REAL,
      longitude REAL,
      on_time_rate REAL DEFAULT 95.0,
      load_capacity INTEGER DEFAULT 20,
      total_orders INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rider_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rider_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      proficiency REAL DEFAULT 0.5,
      FOREIGN KEY (rider_id) REFERENCES riders(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT,
      weight REAL DEFAULT 0,
      pickup_address TEXT NOT NULL,
      pickup_lat REAL,
      pickup_lng REAL,
      pickup_name TEXT,
      pickup_phone TEXT,
      delivery_address TEXT NOT NULL,
      delivery_lat REAL,
      delivery_lng REAL,
      delivery_name TEXT,
      delivery_phone TEXT,
      status TEXT DEFAULT 'pending',
      rider_id INTEGER,
      matched_at DATETIME,
      pickup_at DATETIME,
      delivered_at DATETIME,
      estimated_delivery DATETIME,
      timeout_count INTEGER DEFAULT 0,
      is_backup INTEGER DEFAULT 0,
      enterprise_type TEXT,
      custom_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rider_id) REFERENCES riders(id)
    );

    CREATE TABLE IF NOT EXISTS order_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      rider_id INTEGER,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS signatures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      signer_name TEXT NOT NULL,
      signature_data TEXT NOT NULL,
      photo_path TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS enterprise_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_type TEXT UNIQUE NOT NULL,
      config TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS document_archives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      document_type TEXT,
      archive_data TEXT,
      archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_rider ON orders(rider_id);
    CREATE INDEX IF NOT EXISTS idx_riders_status ON riders(status);
    CREATE INDEX IF NOT EXISTS idx_tracking_order ON order_tracking(order_id);
  `);

  const riderCount = db.prepare('SELECT COUNT(*) as count FROM riders').get().count;
  if (riderCount === 0) {
    const insertRider = db.prepare(`
      INSERT INTO riders (name, phone, status, latitude, longitude, on_time_rate, load_capacity, total_orders)
      VALUES (?, ?, 'online', ?, ?, ?, ?, ?)
    `);
    
    const riders = [
      ['张三', '13800138001', 31.2304, 121.4737, 98.5, 25, 156],
      ['李四', '13800138002', 31.2204, 121.4837, 95.2, 30, 89],
      ['王五', '13800138003', 31.2404, 121.4637, 99.1, 15, 234],
      ['赵六', '13800138004', 31.2104, 121.4937, 92.8, 35, 67],
      ['钱七', '13800138005', 31.2504, 121.4537, 97.3, 20, 178]
    ];

    riders.forEach(r => insertRider.run(...r));

    const insertSkill = db.prepare(`
      INSERT INTO rider_skills (rider_id, category, proficiency)
      VALUES (?, ?, ?)
    `);

    const skills = [
      [1, 'document', 0.95],
      [1, 'pharmacy', 0.85],
      [2, 'fresh', 0.90],
      [2, 'pet', 0.75],
      [3, 'document', 0.98],
      [3, 'pharmacy', 0.92],
      [4, 'fresh', 0.88],
      [4, 'pet', 0.95],
      [5, 'pharmacy', 0.85],
      [5, 'document', 0.80]
    ];

    skills.forEach(s => insertSkill.run(...s));

    const insertConfig = db.prepare(`
      INSERT INTO enterprise_configs (enterprise_type, config)
      VALUES (?, ?)
    `);

    insertConfig.run('pharmacy', JSON.stringify({
      name: '连锁药店',
      requireIdCheck: true,
      requirePrescriptionPhoto: true,
      temperatureControl: '2-8℃',
      deliverySOP: ['核验处方', '温箱检查', '签收确认', '回执上传']
    }));

    insertConfig.run('lawfirm', JSON.stringify({
      name: '律所',
      autoArchive: true,
      requireSignerId: true,
      archiveFields: ['orderNo', 'signerName', 'signature', 'timestamp', 'deliveryAddress']
    }));

    const insertOrder = db.prepare(`
      INSERT INTO orders (
        order_no, category, sub_category, weight,
        pickup_address, pickup_lat, pickup_lng, pickup_name, pickup_phone,
        delivery_address, delivery_lat, delivery_lng, delivery_name, delivery_phone,
        status, rider_id, created_at, matched_at, pickup_at, delivered_at, enterprise_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date();
    const formatDate = (d) => d.toISOString().replace('T', ' ').replace('Z', '');
    const orders = [
      ['SD2605290001', 'document', '保密协议', 0.5,
       '上海市浦东新区陆家嘴金融中心88号', 31.235, 121.505, '王经理', '13900001001',
       '上海市静安区南京西路1266号恒隆广场', 31.228, 121.455, '李律师', '13800002001',
       'delivered', 1,
       formatDate(new Date(now.getTime() - 3600000)),
       formatDate(new Date(now.getTime() - 3300000)),
       formatDate(new Date(now.getTime() - 3000000)),
       formatDate(new Date(now.getTime() - 1800000)),
       'lawfirm'],
      ['SD2605290002', 'pharmacy', '处方药', 0.3,
       '上海市徐汇区淮海中路999号国大药房', 31.215, 121.445, '药房张药师', '13900001002',
       '上海市长宁区古北路1088号', 31.205, 121.415, '陈先生', '13800002002',
       'picking', 3,
       formatDate(new Date(now.getTime() - 1800000)),
       formatDate(new Date(now.getTime() - 1500000)),
       formatDate(new Date(now.getTime() - 1200000)),
       null, 'pharmacy'],
      ['SD2605290003', 'fresh', '海鲜水产', 5,
       '上海市杨浦区军工路2866号水产市场', 31.275, 121.535, '水产老板', '13900001003',
       '上海市普陀区长寿路360号', 31.245, 121.435, '刘女士', '13800002003',
       'matched', 2,
       formatDate(new Date(now.getTime() - 600000)),
       formatDate(new Date(now.getTime() - 300000)),
       null, null, null],
      ['SD2605290004', 'pet', '宠物猫', 8,
       '上海市闵行区虹梅路268号宠物医院', 31.185, 121.405, '兽医周医生', '13900001004',
       '上海市宝山区共和新路5000号', 31.305, 121.465, '赵小姐', '13800002004',
       'pending', null,
       formatDate(now),
       null, null, null, null],
      ['SD2605290005', 'document', '合同文件', 0.8,
       '北京市朝阳区建国门外大街1号国贸大厦', 39.908, 116.445, '孙总', '13900001005',
       '北京市海淀区中关村大街1号', 39.985, 116.315, '吴经理', '13800002005',
       'delivered', 5,
       formatDate(new Date(now.getTime() - 7200000)),
       formatDate(new Date(now.getTime() - 6900000)),
       formatDate(new Date(now.getTime() - 6600000)),
       formatDate(new Date(now.getTime() - 5400000)),
       'lawfirm']
    ];

    orders.forEach(o => insertOrder.run(...o));

    const insertTracking = db.prepare(`
      INSERT INTO order_tracking (order_id, rider_id, latitude, longitude, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);

    const trackingPoints = [
      [2, 3, 31.215, 121.445, formatDate(new Date(now.getTime() - 1500000))],
      [2, 3, 31.212, 121.435, formatDate(new Date(now.getTime() - 1200000))],
      [2, 3, 31.209, 121.425, formatDate(new Date(now.getTime() - 900000))],
      [2, 3, 31.207, 121.420, formatDate(new Date(now.getTime() - 600000))],
      [3, 2, 31.275, 121.535, formatDate(new Date(now.getTime() - 500000))],
      [3, 2, 31.268, 121.520, formatDate(new Date(now.getTime() - 300000))],
      [5, 5, 39.908, 116.445, formatDate(new Date(now.getTime() - 6900000))],
      [5, 5, 39.935, 116.410, formatDate(new Date(now.getTime() - 6300000))],
      [5, 5, 39.965, 116.360, formatDate(new Date(now.getTime() - 5700000))]
    ];

    trackingPoints.forEach(t => insertTracking.run(...t));

    const insertSignature = db.prepare(`
      INSERT INTO signatures (order_id, signer_name, signature_data, photo_path, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const signatures = [
      [1, '李律师', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 
       '/uploads/sign_1_photo.jpg', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)'],
      [5, '吴经理', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
       '/uploads/sign_5_photo.jpg', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0)']
    ];

    signatures.forEach(s => insertSignature.run(...s));

    const insertComplaint = db.prepare(`
      INSERT INTO complaints (order_id, category, description, status)
      VALUES (?, ?, ?, ?)
    `);

    const complaints = [
      [1, 'packaging', '文件袋有轻微破损', 'resolved'],
      [5, 'late', '配送延误15分钟', 'pending'],
      [5, 'attitude', '骑手态度需要改进', 'pending']
    ];

    complaints.forEach(c => insertComplaint.run(...c));

    const insertArchive = db.prepare(`
      INSERT INTO document_archives (order_id, document_type, archive_data)
      VALUES (?, ?, ?)
    `);

    const archives = [
      [1, 'delivery_receipt', JSON.stringify({
        orderNo: 'SD2605290001',
        signerName: '李律师',
        signature: '已签名',
        timestamp: new Date(now - 1800000).toISOString(),
        deliveryAddress: '上海市静安区南京西路1266号恒隆广场',
        watermark: '签收时间: ' + new Date(now - 1800000).toLocaleString('zh-CN')
      })],
      [5, 'delivery_receipt', JSON.stringify({
        orderNo: 'SD2605290005',
        signerName: '吴经理',
        signature: '已签名',
        timestamp: new Date(now - 5400000).toISOString(),
        deliveryAddress: '北京市海淀区中关村大街1号',
        watermark: '签收时间: ' + new Date(now - 5400000).toLocaleString('zh-CN')
      })]
    ];

    archives.forEach(a => insertArchive.run(...a));
  }
}

initDatabase();

module.exports = db;
