import db from './database.ts';
import bcrypt from 'bcryptjs';

const dropTables = `
DROP TABLE IF EXISTS area_heatmap;
DROP TABLE IF EXISTS settlements;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS knight_credit_logs;
DROP TABLE IF EXISTS insurance_verifications;
DROP TABLE IF EXISTS exceptions;
DROP TABLE IF EXISTS dispatch_logs;
DROP TABLE IF EXISTS tracking_points;
DROP TABLE IF EXISTS waybill_status_log;
DROP TABLE IF EXISTS waybills;
DROP TABLE IF EXISTS knights;
DROP TABLE IF EXISTS merchants;
DROP TABLE IF EXISTS users;
`;

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','merchant','knight')),
  phone TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS merchants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  company_name TEXT NOT NULL,
  address TEXT,
  lat REAL,
  lng REAL,
  contact_name TEXT,
  contact_phone TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS knights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('certified','crowdsourced')),
  status TEXT DEFAULT 'offline' CHECK(status IN ('online','offline','busy','suspended')),
  lat REAL DEFAULT 0,
  lng REAL DEFAULT 0,
  credit_score INTEGER DEFAULT 100,
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  avg_rating REAL DEFAULT 5.0,
  capacity INTEGER DEFAULT 5,
  current_load INTEGER DEFAULT 0,
  last_active_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS waybills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT UNIQUE NOT NULL,
  merchant_id INTEGER REFERENCES merchants(id),
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  sender_lat REAL,
  sender_lng REAL,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  receiver_address TEXT NOT NULL,
  receiver_lat REAL,
  receiver_lng REAL,
  category TEXT NOT NULL CHECK(category IN ('food','fresh','document','gift')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','picked_up','delivering','signed','completed','cancelled')),
  knight_id INTEGER REFERENCES knights(id),
  insurance_value REAL DEFAULT 0,
  insurance_level TEXT DEFAULT 'basic' CHECK(insurance_level IN ('basic','standard','premium')),
  pickup_deadline TEXT,
  deliver_deadline TEXT,
  actual_pickup_time TEXT,
  actual_deliver_time TEXT,
  estimated_distance REAL,
  fee REAL DEFAULT 0,
  cancel_reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS waybill_status_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  waybill_id INTEGER REFERENCES waybills(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  operator_id INTEGER,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tracking_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  waybill_id INTEGER REFERENCES waybills(id),
  knight_id INTEGER REFERENCES knights(id),
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  speed REAL DEFAULT 0,
  heading REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dispatch_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  waybill_id INTEGER REFERENCES waybills(id),
  knight_id INTEGER REFERENCES knights(id),
  score REAL,
  distance_score REAL,
  load_score REAL,
  history_score REAL,
  insurance_score REAL,
  result TEXT CHECK(result IN ('assigned','rejected','timeout')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exceptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  waybill_id INTEGER REFERENCES waybills(id),
  type TEXT NOT NULL CHECK(type IN ('pickup_timeout','knight_offline','delivery_timeout')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','resolved','auto_reassigned')),
  original_knight_id INTEGER REFERENCES knights(id),
  new_knight_id INTEGER REFERENCES knights(id),
  resolved_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS insurance_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  waybill_id INTEGER REFERENCES waybills(id),
  photo_path TEXT,
  id_verified INTEGER DEFAULT 0,
  verifier_note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS knight_credit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  knight_id INTEGER REFERENCES knights(id),
  change_amount INTEGER NOT NULL,
  old_score INTEGER NOT NULL,
  new_score INTEGER NOT NULL,
  reason TEXT NOT NULL,
  type TEXT CHECK(type IN ('service_score','violation','bonus','penalty')),
  waybill_id INTEGER REFERENCES waybills(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  waybill_id INTEGER REFERENCES waybills(id),
  reporter_id INTEGER REFERENCES users(id),
  type TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','resolved')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  merchant_id INTEGER REFERENCES merchants(id),
  knight_id INTEGER REFERENCES knights(id),
  waybill_id INTEGER REFERENCES waybills(id),
  amount REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS area_heatmap (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  area_code TEXT NOT NULL,
  area_name TEXT,
  center_lat REAL,
  center_lng REAL,
  active_knights INTEGER DEFAULT 0,
  pending_orders INTEGER DEFAULT 0,
  gap_score REAL DEFAULT 0,
  recorded_at TEXT DEFAULT (datetime('now'))
);
`;

export function initDatabase() {
  const tableCount = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").get();
  
  if (!tableCount) {
    db.pragma('foreign_keys = OFF');
    db.exec(dropTables);
    db.exec(schema);
    db.pragma('foreign_keys = ON');
    seedData();
    console.log('Database initialized with seed data');
  } else {
    console.log('Database already exists, skipping initialization');
  }
}

function seedData() {
  const hash = bcrypt.hashSync('admin123', 10);

  const insertAdmin = db.prepare(
    'INSERT INTO users (username, password_hash, role, phone) VALUES (?, ?, ?, ?)'
  );
  const adminResult = insertAdmin.run('admin', hash, 'admin', '13800000000');
  const adminId = adminResult.lastInsertRowid as number;

  const merchant1Result = insertAdmin.run('merchant1', hash, 'merchant', '13800000001');
  const merchant1UserId = merchant1Result.lastInsertRowid as number;

  const merchant2Result = insertAdmin.run('merchant2', hash, 'merchant', '13800000002');
  const merchant2UserId = merchant2Result.lastInsertRowid as number;

  const insertMerchant = db.prepare(`
    INSERT INTO merchants (user_id, company_name, address, lat, lng, contact_name, contact_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertMerchant.run(
    merchant1UserId,
    'Shanghai Delicious Foods Co.',
    '123 Nanjing Road, Shanghai',
    31.2304,
    121.4737,
    'Zhang Wei',
    '13800000001'
  );
  insertMerchant.run(
    merchant2UserId,
    'Fresh Mart Delivery',
    '456 Huaihai Road, Shanghai',
    31.2250,
    121.4680,
    'Li Na',
    '13800000002'
  );

  const knightNames = [
    { name: 'Wang Qiang', type: 'certified', status: 'online', lat: 31.2310, lng: 121.4750, phone: '13900000001' },
    { name: 'Liu Ming', type: 'certified', status: 'online', lat: 31.2280, lng: 121.4700, phone: '13900000002' },
    { name: 'Chen Jie', type: 'certified', status: 'busy', lat: 31.2350, lng: 121.4800, phone: '13900000003' },
    { name: 'Yang Yang', type: 'crowdsourced', status: 'online', lat: 31.2260, lng: 121.4650, phone: '13900000004' },
    { name: 'Zhao Lei', type: 'crowdsourced', status: 'offline', lat: 31.2400, lng: 121.4850, phone: '13900000005' },
    { name: 'Sun Tao', type: 'certified', status: 'online', lat: 31.2330, lng: 121.4780, phone: '13900000006' },
    { name: 'Zhou Ping', type: 'crowdsourced', status: 'online', lat: 31.2290, lng: 121.4720, phone: '13900000007' },
    { name: 'Wu Hao', type: 'certified', status: 'offline', lat: 31.2370, lng: 121.4820, phone: '13900000008' },
    { name: 'Zheng Kai', type: 'crowdsourced', status: 'busy', lat: 31.2240, lng: 121.4630, phone: '13900000009' },
    { name: 'Feng Bin', type: 'certified', status: 'online', lat: 31.2320, lng: 121.4760, phone: '13900000010' },
  ];

  const insertKnightUser = db.prepare(
    'INSERT INTO users (username, password_hash, role, phone) VALUES (?, ?, ?, ?)'
  );
  const insertKnight = db.prepare(`
    INSERT INTO knights (user_id, name, phone, type, status, lat, lng, credit_score, total_orders, completed_orders, avg_rating, capacity, current_load, last_active_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  knightNames.forEach((knight, idx) => {
    const userResult = insertKnightUser.run(
      `knight${idx + 1}`,
      hash,
      'knight',
      knight.phone
    );
    const userId = userResult.lastInsertRowid as number;
    const totalOrders = Math.floor(Math.random() * 200) + 50;
    const completedOrders = Math.floor(totalOrders * (0.85 + Math.random() * 0.14));
    insertKnight.run(
      userId,
      knight.name,
      knight.phone,
      knight.type,
      knight.status,
      knight.lat,
      knight.lng,
      85 + Math.floor(Math.random() * 30),
      totalOrders,
      completedOrders,
      4.5 + Math.random() * 0.5,
      knight.type === 'certified' ? 8 : 5,
      knight.status === 'busy' ? Math.floor(Math.random() * 4) + 2 : 0,
      new Date().toISOString()
    );
  });

  const now = new Date();
  const eightMinLater = new Date(now.getTime() + 8 * 60000).toISOString();
  const oneHourLater = new Date(now.getTime() + 60 * 60000).toISOString();
  const tenMinAgo = new Date(now.getTime() - 10 * 60000).toISOString();
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60000).toISOString();

  const insertWaybill = db.prepare(`
    INSERT INTO waybills (order_no, merchant_id, sender_name, sender_phone, sender_address, sender_lat, sender_lng,
      receiver_name, receiver_phone, receiver_address, receiver_lat, receiver_lng, category, status, knight_id,
      insurance_value, insurance_level, pickup_deadline, deliver_deadline, actual_pickup_time, actual_deliver_time,
      estimated_distance, fee, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLog = db.prepare(`
    INSERT INTO waybill_status_log (waybill_id, from_status, to_status, operator_id, note)
    VALUES (?, ?, ?, ?, ?)
  `);

  let orderId = 1;

  const pendingOrderNo = `DD${Date.now()}0001`;
  const pendingResult = insertWaybill.run(
    pendingOrderNo,
    1,
    'Zhang Wei',
    '13800000001',
    '123 Nanjing Road, Shanghai',
    31.2304,
    121.4737,
    'Wang Fang',
    '13700000001',
    '789 Xizang Road, Shanghai',
    31.2380,
    121.4790,
    'food',
    'pending',
    null,
    0,
    'basic',
    eightMinLater,
    oneHourLater,
    null,
    null,
    2.5,
    15.0,
    now.toISOString(),
    now.toISOString()
  );
  insertLog.run(pendingResult.lastInsertRowid, null, 'pending', adminId, 'Order created');

  const acceptedOrderNo = `DD${Date.now()}0002`;
  const acceptedResult = insertWaybill.run(
    acceptedOrderNo,
    1,
    'Zhang Wei',
    '13800000001',
    '123 Nanjing Road, Shanghai',
    31.2304,
    121.4737,
    'Li Hua',
    '13700000002',
    '456 Yanan Road, Shanghai',
    31.2350,
    121.4680,
    'fresh',
    'accepted',
    1,
    200,
    'standard',
    eightMinLater,
    new Date(now.getTime() + 45 * 60000).toISOString(),
    null,
    null,
    3.0,
    20.0,
    tenMinAgo,
    tenMinAgo
  );
  insertLog.run(acceptedResult.lastInsertRowid, null, 'pending', adminId, 'Order created');
  insertLog.run(acceptedResult.lastInsertRowid, 'pending', 'accepted', 1, 'Knight accepted');

  const deliveringOrderNo = `DD${Date.now()}0003`;
  const deliveringResult = insertWaybill.run(
    deliveringOrderNo,
    2,
    'Li Na',
    '13800000002',
    '456 Huaihai Road, Shanghai',
    31.2250,
    121.4680,
    'Chen Ming',
    '13700000003',
    '123 People Square, Shanghai',
    31.2330,
    121.4740,
    'document',
    'delivering',
    3,
    500,
    'premium',
    new Date(now.getTime() - 5 * 60000).toISOString(),
    new Date(now.getTime() + 30 * 60000).toISOString(),
    new Date(now.getTime() - 3 * 60000).toISOString(),
    null,
    1.8,
    25.0,
    thirtyMinAgo,
    new Date(now.getTime() - 3 * 60000).toISOString()
  );
  insertLog.run(deliveringResult.lastInsertRowid, null, 'pending', adminId, 'Order created');
  insertLog.run(deliveringResult.lastInsertRowid, 'pending', 'accepted', 3, 'Knight accepted');
  insertLog.run(deliveringResult.lastInsertRowid, 'accepted', 'picked_up', 3, 'Package picked up');
  insertLog.run(deliveringResult.lastInsertRowid, 'picked_up', 'delivering', 3, 'Out for delivery');

  const completedOrderNo = `DD${Date.now()}0004`;
  const completedResult = insertWaybill.run(
    completedOrderNo,
    1,
    'Zhang Wei',
    '13800000001',
    '123 Nanjing Road, Shanghai',
    31.2304,
    121.4737,
    'Zhao Ying',
    '13700000004',
    '321 Century Avenue, Shanghai',
    31.2360,
    121.5000,
    'gift',
    'completed',
    2,
    0,
    'basic',
    new Date(now.getTime() - 60 * 60000).toISOString(),
    new Date(now.getTime() - 10 * 60000).toISOString(),
    new Date(now.getTime() - 55 * 60000).toISOString(),
    new Date(now.getTime() - 15 * 60000).toISOString(),
    5.0,
    30.0,
    new Date(now.getTime() - 90 * 60000).toISOString(),
    new Date(now.getTime() - 15 * 60000).toISOString()
  );
  insertLog.run(completedResult.lastInsertRowid, null, 'pending', adminId, 'Order created');
  insertLog.run(completedResult.lastInsertRowid, 'pending', 'accepted', 2, 'Knight accepted');
  insertLog.run(completedResult.lastInsertRowid, 'accepted', 'picked_up', 2, 'Package picked up');
  insertLog.run(completedResult.lastInsertRowid, 'picked_up', 'delivering', 2, 'Out for delivery');
  insertLog.run(completedResult.lastInsertRowid, 'delivering', 'signed', 4, 'Receiver signed');
  insertLog.run(completedResult.lastInsertRowid, 'signed', 'completed', adminId, 'System confirmed');

  const insertSettlement = db.prepare(`
    INSERT INTO settlements (merchant_id, knight_id, waybill_id, amount, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertSettlement.run(1, 2, completedResult.lastInsertRowid, 30.0, 'pending', new Date(now.getTime() - 15 * 60000).toISOString());
}
