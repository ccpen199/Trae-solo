import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone VARCHAR(20) UNIQUE NOT NULL,
      nickname VARCHAR(50) NOT NULL,
      password_hash VARCHAR(255) NOT NULL DEFAULT '',
      role VARCHAR(20) NOT NULL DEFAULT 'sender',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS waybills (
      id VARCHAR(32) PRIMARY KEY,
      tracking_no VARCHAR(20) UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id),
      sender_name VARCHAR(50) NOT NULL,
      sender_phone VARCHAR(20) NOT NULL,
      sender_address VARCHAR(255) NOT NULL,
      receiver_name VARCHAR(50) NOT NULL,
      receiver_phone VARCHAR(20) NOT NULL,
      receiver_address VARCHAR(255) NOT NULL,
      item_type VARCHAR(50) NOT NULL,
      weight DECIMAL(10,2) NOT NULL,
      volume DECIMAL(10,2),
      is_special BOOLEAN DEFAULT 0,
      special_desc TEXT,
      service_level VARCHAR(20) NOT NULL DEFAULT 'standard',
      pickup_time DATETIME NOT NULL,
      freight DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      outlet_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tracking_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      waybill_id VARCHAR(32) REFERENCES waybills(id),
      status VARCHAR(50) NOT NULL,
      location VARCHAR(255) NOT NULL,
      description TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS outlets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      address VARCHAR(255) NOT NULL,
      lng DECIMAL(10,6) NOT NULL,
      lat DECIMAL(10,6) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      business_hours VARCHAR(100) NOT NULL,
      service_tags TEXT,
      avg_response_time DECIMAL(10,2) DEFAULT 0,
      complaint_rate DECIMAL(5,4) DEFAULT 0,
      on_time_rate DECIMAL(5,4) DEFAULT 0,
      rating DECIMAL(2,1) DEFAULT 5.0
    );

    CREATE TABLE IF NOT EXISTS after_sale_claims (
      id VARCHAR(32) PRIMARY KEY,
      waybill_id VARCHAR(32) REFERENCES waybills(id),
      user_id INTEGER REFERENCES users(id),
      type VARCHAR(20) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      images TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clv_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER REFERENCES users(id) UNIQUE,
      total_orders INTEGER DEFAULT 0,
      total_amount DECIMAL(12,2) DEFAULT 0,
      order_frequency DECIMAL(10,2) DEFAULT 0,
      avg_order_value DECIMAL(10,2) DEFAULT 0,
      churn_risk DECIMAL(5,4) DEFAULT 0,
      clv_score DECIMAL(12,2) DEFAULT 0,
      tier VARCHAR(20) DEFAULT 'low',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_waybills_user_id ON waybills(user_id);
    CREATE INDEX IF NOT EXISTS idx_waybills_tracking_no ON waybills(tracking_no);
    CREATE INDEX IF NOT EXISTS idx_tracking_events_waybill_id ON tracking_events(waybill_id);
    CREATE INDEX IF NOT EXISTS idx_claims_user_id ON after_sale_claims(user_id);
    CREATE INDEX IF NOT EXISTS idx_claims_waybill_id ON after_sale_claims(waybill_id);
    CREATE INDEX IF NOT EXISTS idx_outlets_lng_lat ON outlets(lng, lat);
  `);
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const insertUser = db.prepare(
    'INSERT INTO users (phone, nickname, role, password_hash) VALUES (?, ?, ?, ?)'
  );
  insertUser.run('13800138000', '张先生', 'sender', '');
  insertUser.run('13900139000', '李女士', 'receiver', '');
  insertUser.run('13700137000', '王管理员', 'admin', '');

  const insertOutlet = db.prepare(
    'INSERT INTO outlets (name, address, lng, lat, phone, business_hours, service_tags, avg_response_time, complaint_rate, on_time_rate, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const outlets = [
    ['中通快递(朝阳国贸网点)', '北京市朝阳区建国路88号SOHO现代城A座', 116.4699, 39.9087, '010-65678901', '08:00-20:00', '上门取件,当日达,冷链,国际件', 1.2, 0.012, 0.968, 4.8],
    ['中通快递(海淀中关村网点)', '北京市海淀区中关村大街27号中关村大厦B1层', 116.3167, 39.9833, '010-82678902', '08:00-21:00', '上门取件,次日达,代收点,电子面单', 0.9, 0.008, 0.982, 4.9],
    ['中通快递(西城金融街网点)', '北京市西城区金融街15号鑫茂大厦', 116.3600, 39.9150, '010-66578903', '09:00-19:00', '上门取件,商务件,次日达', 1.5, 0.015, 0.955, 4.6],
    ['中通快递(东城东单网点)', '北京市东城区东单北大街3号', 116.4167, 39.9167, '010-65278904', '08:00-20:00', '上门取件,当日达,代收点', 1.1, 0.010, 0.972, 4.7],
    ['中通快递(丰台科技园网点)', '北京市丰台区科学城海鹰路6号', 116.2833, 39.8333, '010-83678905', '08:00-20:00', '上门取件,次日达,大件物流', 1.3, 0.018, 0.945, 4.5],
    ['中通快递(通州梨园网点)', '北京市通州区梨园镇云景东路88号', 116.6500, 39.9000, '010-81578906', '08:00-20:00', '上门取件,次日达,社区配送', 1.8, 0.022, 0.935, 4.3],
    ['中通快递(昌平回龙观网点)', '北京市昌平区回龙观镇西大街111号', 116.3333, 40.0667, '010-80778907', '08:00-20:00', '上门取件,次日达,社区配送', 1.6, 0.020, 0.940, 4.4],
    ['中通快递(大兴亦庄网点)', '北京市大兴区亦庄经济开发区荣华中路8号', 116.5000, 39.7833, '010-67878908', '08:00-20:00', '上门取件,当日达,商务件,冷链', 1.0, 0.009, 0.978, 4.8],
    ['中通快递(上海陆家嘴网点)', '上海市浦东新区陆家嘴环路1000号', 121.5050, 31.2400, '021-58678901', '08:00-21:00', '上门取件,当日达,国际件,冷链', 0.8, 0.006, 0.988, 4.9],
    ['中通快递(上海静安寺网点)', '上海市静安区南京西路1788号', 121.4480, 31.2300, '021-62678902', '08:00-20:00', '上门取件,次日达,商务件', 1.0, 0.009, 0.976, 4.7],
    ['中通快递(广州天河网点)', '广州市天河区体育西路103号维多利广场', 113.3240, 23.1360, '020-38678901', '08:00-21:00', '上门取件,当日达,次日达,国际件', 0.9, 0.007, 0.985, 4.9],
    ['中通快递(深圳福田网点)', '深圳市福田区深南大道6011号NEO大厦', 114.0570, 22.5420, '0755-82678901', '08:00-22:00', '上门取件,当日达,国际件,冷链,商务件', 0.7, 0.005, 0.992, 5.0],
    ['中通快递(成都春熙路网点)', '成都市锦江区春熙路北段29号', 104.0810, 30.6530, '028-86678901', '08:00-20:00', '上门取件,次日达,社区配送', 1.4, 0.016, 0.950, 4.5],
    ['中通快递(杭州西湖网点)', '杭州市西湖区文三路478号华星时代广场', 120.1280, 30.2740, '0571-88678901', '08:00-21:00', '上门取件,当日达,次日达,电子面单', 0.9, 0.008, 0.980, 4.8],
    ['中通快递(武汉江汉路网点)', '武汉市江汉区江汉路129号中心百货', 114.2830, 30.5830, '027-82678901', '08:00-20:00', '上门取件,次日达,代收点', 1.2, 0.013, 0.965, 4.6],
  ];
  outlets.forEach(o => insertOutlet.run(...o));

  const insertWaybill = db.prepare(
    `INSERT INTO waybills (id, tracking_no, user_id, sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, item_type, weight, volume, is_special, special_desc, service_level, pickup_time, freight, status, outlet_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const waybills = [
    ['wb001', 'ZT7890123456789', 1, '张先生', '13800138000', '北京市朝阳区建国路88号', '李女士', '13900139000', '上海市浦东新区陆家嘴环路1000号', '服装', 1.5, null, 0, null, 'standard', '2026-06-14 14:00:00', 18.0, 'inTransit', 1],
    ['wb002', 'ZT7890123456790', 1, '张先生', '13800138000', '北京市海淀区中关村大街27号', '王总', '13600136000', '广州市天河区体育西路103号', '电子产品', 0.8, null, 0, null, 'nextday', '2026-06-14 10:00:00', 32.0, 'delivering', 2],
    ['wb003', 'ZT7890123456791', 1, '张先生', '13800138000', '北京市西城区金融街15号', '赵经理', '13500135000', '深圳市福田区深南大道6011号', '文件', 0.3, null, 0, null, 'standard', '2026-06-13 15:30:00', 12.0, 'signed', 3],
    ['wb004', 'ZT7890123456792', 1, '张先生', '13800138000', '北京市东城区东单北大街3号', '孙女士', '13400134000', '杭州市西湖区文三路478号', '生鲜', 3.2, null, 1, '需冷链运输，保持0-4℃', 'nextday', '2026-06-14 09:00:00', 45.0, 'picked', 4],
    ['wb005', 'ZT7890123456793', 1, '张先生', '13800138000', '北京市丰台区科学城海鹰路6号', '周先生', '13300133000', '成都市锦江区春熙路北段29号', '图书', 2.5, null, 0, null, 'secondDay', '2026-06-15 14:00:00', 22.0, 'pending', 5],
  ];
  waybills.forEach(w => insertWaybill.run(...w));

  const insertEvent = db.prepare(
    'INSERT INTO tracking_events (waybill_id, status, location, description, timestamp) VALUES (?, ?, ?, ?, ?)'
  );
  const events = [
    ['wb001', 'picked', '北京市朝阳区', '快递员已上门取件', '2026-06-13 15:20:00'],
    ['wb001', 'inTransit', '北京转运中心', '快件已到达【北京转运中心】', '2026-06-13 20:45:00'],
    ['wb001', 'inTransit', '北京航空部', '快件已从【北京转运中心】发出，下一站【上海转运中心】', '2026-06-14 02:30:00'],
    ['wb001', 'inTransit', '上海转运中心', '快件已到达【上海转运中心】', '2026-06-14 08:15:00'],
    ['wb002', 'picked', '北京市海淀区', '快递员已上门取件', '2026-06-13 11:30:00'],
    ['wb002', 'inTransit', '北京航空部', '快件已从【北京航空部】发出', '2026-06-13 18:00:00'],
    ['wb002', 'inTransit', '广州转运中心', '快件已到达【广州转运中心】', '2026-06-14 06:20:00'],
    ['wb002', 'delivering', '广州市天河区', '快件正在派送中，快递员：陈师傅 13800001111', '2026-06-14 09:00:00'],
    ['wb003', 'picked', '北京市西城区', '快递员已上门取件', '2026-06-12 16:00:00'],
    ['wb003', 'inTransit', '北京转运中心', '快件已到达【北京转运中心】', '2026-06-12 22:00:00'],
    ['wb003', 'inTransit', '深圳转运中心', '快件已到达【深圳转运中心】', '2026-06-13 10:30:00'],
    ['wb003', 'delivering', '深圳市福田区', '快件正在派送中', '2026-06-13 14:00:00'],
    ['wb003', 'signed', '深圳市福田区', '快件已签收，签收人：本人', '2026-06-13 16:45:00'],
    ['wb004', 'picked', '北京市东城区', '快递员已上门取件（冷链）', '2026-06-14 09:30:00'],
  ];
  events.forEach(e => insertEvent.run(...e));

  const insertClaim = db.prepare(
    'INSERT INTO after_sale_claims (id, waybill_id, user_id, type, amount, description, images, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const claims = [
    ['cl001', 'wb003', 1, 'damage', 200, '文件袋外包装破损，内部文件有折痕', '[]', 'reviewing', '2026-06-13 18:00:00', '2026-06-13 19:30:00'],
    ['cl002', 'wb001', 1, 'lost', 580, '包裹内一件衬衫丢失，怀疑中转环节问题', '["/uploads/cl002_1.jpg","/uploads/cl002_2.jpg"]', 'approved', '2026-06-14 10:00:00', '2026-06-14 14:20:00'],
  ];
  claims.forEach(c => insertClaim.run(...c));

  const insertCLV = db.prepare(
    'INSERT INTO clv_data (customer_id, total_orders, total_amount, order_frequency, avg_order_value, churn_risk, clv_score, tier) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  insertCLV.run(1, 23, 3680.5, 1.92, 160.02, 0.08, 4520.0, 'high');
  insertCLV.run(2, 8, 520.0, 0.67, 65.0, 0.25, 420.0, 'low');
}

initDatabase();
seedData();

export default db;
