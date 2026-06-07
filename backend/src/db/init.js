const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const ensureColumn = (table, column, definition) => {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all().map((item) => item.name);
  if (!columns.includes(column)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
};

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS shippers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT,
      type TEXT DEFAULT 'personal',
      password TEXT NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      id_card TEXT UNIQUE,
      driver_license TEXT,
      vehicle_license TEXT,
      vehicle_type TEXT,
      vehicle_number TEXT,
      vehicle_weight REAL,
      vehicle_volume REAL,
      service_score REAL DEFAULT 5.0,
      order_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      lat REAL,
      lng REAL,
      online INTEGER DEFAULT 0,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      shipper_id INTEGER NOT NULL,
      driver_id INTEGER,
      cargo_type TEXT NOT NULL,
      cargo_weight REAL,
      cargo_volume REAL,
      cargo_desc TEXT,
      start_address TEXT NOT NULL,
      start_lat REAL NOT NULL,
      start_lng REAL NOT NULL,
      end_address TEXT NOT NULL,
      end_lat REAL NOT NULL,
      end_lng REAL NOT NULL,
      distance REAL NOT NULL,
      vehicle_type TEXT NOT NULL,
      loading_requirement TEXT,
      price REAL NOT NULL,
      price_detail TEXT,
      insured_value REAL DEFAULT 0,
      insurance_fee REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      remark TEXT,
      estimated_arrival DATETIME,
      accepted_at DATETIME,
      picked_at DATETIME,
      delivered_at DATETIME,
      completed_at DATETIME,
      signed_at DATETIME,
      driver_signed_at DATETIME,
      shipper_signed_at DATETIME,
      is_on_time INTEGER DEFAULT 1,
      has_damage INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shipper_id) REFERENCES shippers(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS insurance_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      policy_no TEXT UNIQUE NOT NULL,
      insured_value REAL NOT NULL,
      premium REAL NOT NULL,
      status TEXT DEFAULT 'active',
      claim_amount REAL,
      claim_status TEXT,
      claim_desc TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS order_evidences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      driver_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      file_url TEXT NOT NULL,
      thumbnail_url TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER UNIQUE NOT NULL,
      shipper_id INTEGER NOT NULL,
      driver_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (shipper_id) REFERENCES shippers(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS express_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      express_company TEXT NOT NULL,
      tracking_no TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      latest_info TEXT,
      track_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'operator',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      complainant_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      handler_id INTEGER,
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      handled_at DATETIME,
      FOREIGN KEY (order_id) REFERENCES orders(id)
	    );
	  `);

  [
    ['orders', 'cargo_desc', 'TEXT'],
    ['orders', 'price_detail', 'TEXT'],
    ['orders', 'insurance_fee', 'REAL DEFAULT 0'],
    ['orders', 'status', "TEXT DEFAULT 'pending'"],
    ['orders', 'remark', 'TEXT'],
    ['orders', 'estimated_arrival', 'DATETIME'],
    ['orders', 'accepted_at', 'DATETIME'],
    ['orders', 'picked_at', 'DATETIME'],
    ['orders', 'delivered_at', 'DATETIME'],
    ['orders', 'completed_at', 'DATETIME'],
    ['orders', 'signed_at', 'DATETIME'],
    ['orders', 'driver_signed_at', 'DATETIME'],
    ['orders', 'shipper_signed_at', 'DATETIME'],
    ['orders', 'is_on_time', 'INTEGER DEFAULT 1'],
    ['orders', 'has_damage', 'INTEGER DEFAULT 0'],
    ['orders', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP']
  ].forEach(([table, column, definition]) => ensureColumn(table, column, definition));

  [
    ['complaints', 'complainant_id', 'INTEGER DEFAULT 1'],
    ['complaints', 'content', 'TEXT DEFAULT ""'],
    ['complaints', 'handler_id', 'INTEGER'],
    ['complaints', 'result', 'TEXT'],
    ['complaints', 'handled_at', 'DATETIME']
  ].forEach(([table, column, definition]) => ensureColumn(table, column, definition));

  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
  if (adminCount.count === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admin_users (username, password, role) VALUES (?, ?, ?)').run('admin', hash, 'super_admin');
  }

  const shipperCount = db.prepare('SELECT COUNT(*) as count FROM shippers').get();
  if (shipperCount.count === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('123456', 10);
    const insertShipper = db.prepare('INSERT INTO shippers (phone, name, password, type) VALUES (?, ?, ?, ?)');
    insertShipper.run('13900139001', '张三', hash, 'personal');
    insertShipper.run('13900139002', '李四', hash, 'personal');
  }

  const driverCount = db.prepare('SELECT COUNT(*) as count FROM drivers').get();
  if (driverCount.count === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('123456', 10);
    const insertDriver = db.prepare('INSERT INTO drivers (phone, name, password, vehicle_type, vehicle_number, service_score, status, online, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertDriver.run('13800138001', '张师傅', hash, '小面', '京A12345', 4.8, 'approved', 1, 39.9042, 116.4074);
    insertDriver.run('13800138002', '李师傅', hash, '中面', '京B23456', 4.9, 'approved', 1, 39.9142, 116.4174);
    insertDriver.run('13800138003', '王师傅', hash, '金杯', '京C34567', 4.7, 'approved', 1, 39.8942, 116.3974);
    insertDriver.run('13800138004', '赵师傅', hash, '厢货', '京D45678', 4.6, 'approved', 1, 39.9242, 116.4274);
  }

  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  if (orderCount.count === 0) {
    const now = Date.now();
    const insertOrder = db.prepare(`INSERT INTO orders (
      order_no, shipper_id, driver_id, start_address, end_address, distance, vehicle_type, cargo_type, cargo_weight, cargo_volume, loading_requirement, insured_value, price, status, created_at, accepted_at, picked_at, delivered_at, completed_at, is_on_time, has_damage, start_lat, start_lng, end_lat, end_lng, cargo_desc, remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insertReview = db.prepare('INSERT INTO reviews (order_id, shipper_id, driver_id, score, content, created_at) VALUES (?, ?, ?, ?, ?, ?)');
	    const insertComplaint = db.prepare('INSERT INTO complaints (order_id, complainant_id, type, content, status, created_at, result) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const insertInsurance = db.prepare('INSERT INTO insurance_orders (order_id, policy_no, insured_value, premium, status, created_at) VALUES (?, ?, ?, ?, ?, ?)');

    const orders = [
      { no: 'FY202606040001', sid: 1, did: 1, start: '北京市朝阳区国贸', end: '北京市海淀区中关村', dist: 18, vt: '小面', ct: '日用品', cw: 100, cv: 1, lr: '', iv: 0, price: 158, status: 'completed', onTime: 1, damage: 0, daysAgo: 0, hasReview: true, rating: 5, hasComplaint: false, hasInsurance: false, desc: '衣物、书籍', remark: '' },
      { no: 'FY202606040002', sid: 2, did: 2, start: '北京市西城区金融街', end: '北京市东城区王府井', dist: 8, vt: '中面', ct: '家电家具', cw: 500, cv: 5, lr: 'need_help', iv: 2000, price: 320, status: 'completed', onTime: 1, damage: 0, daysAgo: 0, hasReview: true, rating: 5, hasComplaint: false, hasInsurance: true, desc: '沙发、茶几、电视柜', remark: '无电梯，需搬运' },
      { no: 'FY202606030003', sid: 1, did: 3, start: '北京市丰台区丽泽', end: '北京市通州区梨园', dist: 35, vt: '金杯', ct: '建材', cw: 1200, cv: 8, lr: 'heavy', iv: 5000, price: 580, status: 'completed', onTime: 0, damage: 0, daysAgo: 1, hasReview: true, rating: 3, hasComplaint: true, ctype: '运输延误', cdesc: '司机迟到40分钟', cstatus: 'resolved', hasInsurance: true, desc: '瓷砖、木地板、水泥', remark: '货物较重' },
      { no: 'FY202606020004', sid: 2, did: 1, start: '北京市石景山区古城', end: '北京市朝阳区三里屯', dist: 25, vt: '小面', ct: '电子产品', cw: 80, cv: 0.5, lr: '', iv: 10000, price: 268, status: 'completed', onTime: 1, damage: 1, daysAgo: 2, hasReview: true, rating: 2, hasComplaint: true, ctype: '货物破损', cdesc: '屏幕外壳有划痕', cstatus: 'processing', hasInsurance: true, desc: '显示器2台', remark: '小心轻放' },
      { no: 'FY202606010005', sid: 1, did: 4, start: '北京市大兴区亦庄', end: '北京市昌平区回龙观', dist: 42, vt: '厢货', ct: '食品', cw: 2000, cv: 10, lr: 'need_help', iv: 3000, price: 890, status: 'completed', onTime: 1, damage: 0, daysAgo: 3, hasReview: true, rating: 4, hasComplaint: false, hasInsurance: true, desc: '饮料、零食', remark: '需冷藏' },
      { no: 'FY202605310006', sid: 2, did: 2, start: '北京市顺义区机场', end: '北京市朝阳区望京', dist: 28, vt: '中面', ct: '日用品', cw: 300, cv: 3, lr: '', iv: 0, price: 245, status: 'completed', onTime: 1, damage: 0, daysAgo: 4, hasReview: true, rating: 5, hasComplaint: false, hasInsurance: false, desc: '行李箱3个', remark: '' },
      { no: 'FY202606040007', sid: 1, did: 3, start: '北京市海淀区五道口', end: '北京市丰台区总部基地', dist: 12, vt: '金杯', ct: '家电家具', cw: 800, cv: 6, lr: 'need_help', iv: 0, price: 228, status: 'in_transit', onTime: 1, damage: 0, daysAgo: 0, hasReview: false, hasComplaint: false, hasInsurance: false, desc: '冰箱、洗衣机', remark: '' },
      { no: 'FY202606040008', sid: 2, did: 4, start: '北京市朝阳区CBD', end: '北京市西城区西单', dist: 6, vt: '小面', ct: '其他', cw: 50, cv: 0.3, lr: '', iv: 0, price: 85, status: 'accepted', onTime: 1, damage: 0, daysAgo: 0, hasReview: false, hasComplaint: false, hasInsurance: false, desc: '文件资料', remark: '' },
      { no: 'FY202606040009', sid: 1, did: null, start: '北京市东城区东直门', end: '北京市海淀区上地', dist: 22, vt: '中面', ct: '建材', cw: 600, cv: 4, lr: '', iv: 1000, price: 368, status: 'pending', onTime: 1, damage: 0, daysAgo: 0, hasReview: false, hasComplaint: false, hasInsurance: true, desc: '管材、五金', remark: '' },
      { no: 'FY202605300010', sid: 2, did: 1, start: '北京市房山区长阳', end: '北京市门头沟区永定', dist: 30, vt: '小面', ct: '日用品', cw: 200, cv: 2, lr: '', iv: 0, price: 210, status: 'completed', onTime: 1, damage: 0, daysAgo: 5, hasReview: true, rating: 5, hasComplaint: false, hasInsurance: false, desc: '厨房用品', remark: '' },
      { no: 'FY2026052800011', sid: 1, did: 2, start: '北京市通州区台湖', end: '北京市朝阳区欢乐谷', dist: 15, vt: '中面', ct: '家电家具', cw: 400, cv: 4, lr: 'need_help', iv: 0, price: 195, status: 'completed', onTime: 1, damage: 0, daysAgo: 7, hasReview: true, rating: 4, hasComplaint: false, hasInsurance: false, desc: '衣柜、床', remark: '' },
      { no: 'FY2026052500012', sid: 2, did: 3, start: '北京市昌平区天通苑', end: '北京市朝阳区亚运村', dist: 20, vt: '金杯', ct: '食品', cw: 500, cv: 5, lr: '', iv: 0, price: 285, status: 'completed', onTime: 1, damage: 0, daysAgo: 10, hasReview: true, rating: 5, hasComplaint: false, hasInsurance: false, desc: '生鲜水果', remark: '' }
    ];

    orders.forEach((o) => {
      const d = new Date();
      d.setDate(d.getDate() - o.daysAgo);
      const createdAt = d.getTime();
      const acceptedAt = o.status !== 'pending' ? createdAt + 5 * 60 * 1000 : null;
      const pickedAt = o.status === 'in_transit' || o.status === 'completed' ? createdAt + 30 * 60 * 1000 : null;
      const deliveredAt = o.status === 'completed' ? createdAt + (o.dist * 3 + 30) * 60 * 1000 : null;
      const completedAt = o.status === 'completed' ? deliveredAt + 5 * 60 * 1000 : null;
      const startLat = 39.9087 + Math.random() * 0.02 - 0.01;
      const startLng = 116.4605 + Math.random() * 0.02 - 0.01;
      const endLat = 39.9842 + Math.random() * 0.02 - 0.01;
      const endLng = 116.3074 + Math.random() * 0.02 - 0.01;

      const result = insertOrder.run(
        o.no, o.sid, o.did, o.start, o.end, o.dist, o.vt, o.ct, o.cw, o.cv, o.lr, o.iv, o.price, o.status,
        createdAt, acceptedAt, pickedAt, deliveredAt, completedAt, o.onTime, o.damage,
        startLat, startLng, endLat, endLng, o.desc, o.remark
      );
      const orderId = result.lastInsertRowid;

      if (o.hasReview && completedAt) {
        const comments = ['服务很好，准时送达', '司机很负责，货物完好', '整体满意', '司机迟到了，希望改进', '货物有轻微破损'];
        insertReview.run(orderId, o.sid, o.did, o.rating, comments[o.rating - 1], completedAt + 10 * 60 * 1000);
      }

      if (o.hasComplaint) {
        const complaintCreated = completedAt + 30 * 60 * 1000;
	        const result = o.cstatus === 'resolved' ? '已协调司机补偿并完成回访' : null;
	        insertComplaint.run(orderId, o.sid, o.ctype, o.cdesc, o.cstatus, complaintCreated, result);
      }

      if (o.hasInsurance) {
        const premium = Math.round(o.iv * 0.003);
        insertInsurance.run(orderId, `INS${o.no}`, o.iv, premium, o.damage ? 'claiming' : 'active', createdAt);
      }
    });
  }
};

initTables();

module.exports = db;
