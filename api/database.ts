import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function loadProjectEnv() {
  const envPath = path.resolve(projectRoot, '.env');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadProjectEnv();

const dbPath = path.resolve(projectRoot, process.env.SQLITE_PATH || './data/logistics.db');

mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'individual',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pickup_appointments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    sender_name TEXT NOT NULL,
    sender_phone TEXT NOT NULL,
    sender_address TEXT NOT NULL,
    receiver_name TEXT NOT NULL,
    receiver_phone TEXT NOT NULL,
    receiver_address TEXT NOT NULL,
    pickup_date TEXT NOT NULL,
    pickup_time_slot TEXT NOT NULL CHECK(pickup_time_slot IN ('morning','afternoon','evening')),
    item_type TEXT NOT NULL DEFAULT 'general',
    weight REAL NOT NULL DEFAULT 1.0,
    estimated_fee REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','picked_up','cancelled')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS waybills (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    waybill_no TEXT NOT NULL UNIQUE,
    sender_name TEXT NOT NULL,
    sender_address TEXT NOT NULL,
    receiver_name TEXT NOT NULL,
    receiver_address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'created' CHECK(status IN ('created','picked_up','in_transit','delivered','returned')),
    service_level TEXT NOT NULL DEFAULT 'standard' CHECK(service_level IN ('standard','express','same_day')),
    weight REAL NOT NULL DEFAULT 1.0,
    fee REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tracking_nodes (
    id TEXT PRIMARY KEY,
    waybill_id TEXT NOT NULL REFERENCES waybills(id),
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS complaint_tickets (
    id TEXT PRIMARY KEY,
    waybill_id TEXT NOT NULL REFERENCES waybills(id),
    type TEXT NOT NULL CHECK(type IN ('damage','lost','delay','service','other')),
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','assigned','processing','resolved','closed')),
    assigned_branch TEXT,
    sla_deadline TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    waybill_id TEXT NOT NULL REFERENCES waybills(id),
    invoice_no TEXT NOT NULL UNIQUE,
    amount REAL NOT NULL,
    title TEXT NOT NULL,
    tax_no TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','issued','failed')),
    issued_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS membership_info (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
    points INTEGER NOT NULL DEFAULT 0,
    level TEXT NOT NULL DEFAULT 'normal' CHECK(level IN ('normal','silver','gold','svip')),
    svip_expiry TEXT,
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_used INTEGER NOT NULL DEFAULT 0,
    total_expired INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS points_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK(type IN ('earn','use','expire')),
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    operator TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    detail TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contraband_library (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    keywords TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK(risk_level IN ('low','medium','high'))
);

CREATE TABLE IF NOT EXISTS contraband_checks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    input_type TEXT NOT NULL CHECK(input_type IN ('image','text')),
    input_content TEXT NOT NULL,
    is_contraband INTEGER NOT NULL DEFAULT 0,
    risk_level TEXT NOT NULL DEFAULT 'none' CHECK(risk_level IN ('none','low','medium','high')),
    matched_items TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scan_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    waybill_no TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_phone TEXT NOT NULL,
    sender_address TEXT NOT NULL,
    receiver_name TEXT NOT NULL,
    receiver_phone TEXT NOT NULL,
    receiver_address TEXT NOT NULL,
    scan_type TEXT NOT NULL CHECK(scan_type IN ('barcode','ocr')),
    confidence REAL NOT NULL DEFAULT 0,
    is_edited INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS import_batches (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    total_count INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'processing' CHECK(status IN ('processing','completed','failed')),
    file_name TEXT,
    template TEXT,
    failed_reasons TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
);

CREATE TABLE IF NOT EXISTS print_batches (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    waybill_ids TEXT NOT NULL DEFAULT '[]',
    template TEXT NOT NULL DEFAULT 'standard',
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','printing','completed','failed')),
    total_count INTEGER NOT NULL DEFAULT 0,
    printed_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_waybills_user ON waybills(user_id);
CREATE INDEX IF NOT EXISTS idx_waybills_status ON waybills(status);
CREATE INDEX IF NOT EXISTS idx_waybills_no ON waybills(waybill_no);
CREATE INDEX IF NOT EXISTS idx_pickup_user ON pickup_appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_complaint_status ON complaint_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tracking_waybill ON tracking_nodes(waybill_id);
CREATE INDEX IF NOT EXISTS idx_points_user ON points_records(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_contraband_risk ON contraband_library(risk_level);
CREATE INDEX IF NOT EXISTS idx_scan_user ON scan_records(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_waybill ON scan_records(waybill_no);
`);

const insertUser = db.prepare(
  `INSERT OR IGNORE INTO users (id, phone, name, role) VALUES (?, ?, ?, ?)`
);
const insertWaybill = db.prepare(
  `INSERT OR IGNORE INTO waybills (id, user_id, waybill_no, sender_name, sender_address, receiver_name, receiver_address, status, service_level, weight, fee, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertTrackingNode = db.prepare(
  `INSERT OR IGNORE INTO tracking_nodes (id, waybill_id, time, location, status, description) VALUES (?, ?, ?, ?, ?, ?)`
);
const insertPickup = db.prepare(
  `INSERT OR IGNORE INTO pickup_appointments (id, user_id, sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, pickup_date, pickup_time_slot, item_type, weight, estimated_fee, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertComplaint = db.prepare(
  `INSERT OR IGNORE INTO complaint_tickets (id, waybill_id, type, description, status, assigned_branch, sla_deadline, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertInvoice = db.prepare(
  `INSERT OR IGNORE INTO invoices (id, waybill_id, invoice_no, amount, title, tax_no, status, issued_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertMembership = db.prepare(
  `INSERT OR IGNORE INTO membership_info (id, user_id, points, level, svip_expiry, total_earned, total_used, total_expired) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertPointsRecord = db.prepare(
  `INSERT OR IGNORE INTO points_records (id, user_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, ?, ?)`
);
const insertAuditLog = db.prepare(
  `INSERT OR IGNORE INTO audit_logs (id, user_id, operator, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
);
const insertContraband = db.prepare(
  `INSERT OR IGNORE INTO contraband_library (id, name, category, keywords, risk_level) VALUES (?, ?, ?, ?, ?)`
);
const insertScanRecord = db.prepare(
  `INSERT INTO scan_records (id, user_id, waybill_no, sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address, scan_type, confidence, is_edited, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

const seed = db.transaction(() => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  insertUser.run('u1', '13800138001', '张三', 'individual');
  insertUser.run('u2', '13800138002', '李商家', 'merchant');
  insertUser.run('u3', '13800138003', '王管理', 'admin');

  const waybills = [
    { id: 'w1', userId: 'u1', no: 'SF2025060100001', sender: '张三', senderAddr: '北京市朝阳区建国路88号', receiver: '李明', receiverAddr: '上海市浦东新区陆家嘴环路100号', status: 'delivered', level: 'standard', weight: 2.5, fee: 35.0, created: '2025-06-01 09:00:00', updated: '2025-06-03 14:30:00' },
    { id: 'w2', userId: 'u1', no: 'SF2025060200002', sender: '张三', senderAddr: '北京市朝阳区建国路88号', receiver: '王芳', receiverAddr: '广州市天河区珠江新城华夏路30号', status: 'in_transit', level: 'express', weight: 1.2, fee: 28.0, created: '2025-06-02 10:30:00', updated: '2025-06-04 08:00:00' },
    { id: 'w3', userId: 'u2', no: 'SF2025060300003', sender: '李商家', senderAddr: '杭州市西湖区文三路478号', receiver: '赵六', receiverAddr: '成都市武侯区天府大道999号', status: 'picked_up', level: 'standard', weight: 5.0, fee: 45.0, created: '2025-06-03 08:15:00', updated: '2025-06-03 18:00:00' },
    { id: 'w4', userId: 'u2', no: 'SF2025060400004', sender: '李商家', senderAddr: '杭州市西湖区文三路478号', receiver: '孙七', receiverAddr: '深圳市南山区科技园路1号', status: 'in_transit', level: 'same_day', weight: 0.8, fee: 52.0, created: '2025-06-04 07:00:00', updated: '2025-06-04 12:00:00' },
    { id: 'w5', userId: 'u1', no: 'SF2025060500005', sender: '张三', senderAddr: '北京市朝阳区建国路88号', receiver: '周八', receiverAddr: '武汉市江汉区中山大道200号', status: 'created', level: 'standard', weight: 3.3, fee: 38.0, created: '2025-06-05 11:00:00', updated: '2025-06-05 11:00:00' },
    { id: 'w6', userId: 'u2', no: 'SF2025060600006', sender: '李商家', senderAddr: '杭州市西湖区文三路478号', receiver: '吴九', receiverAddr: '南京市鼓楼区中山路300号', status: 'returned', level: 'express', weight: 1.0, fee: 30.0, created: '2025-06-06 09:30:00', updated: '2025-06-09 16:00:00' },
    { id: 'w7', userId: 'u1', no: 'SF2025060700007', sender: '张三', senderAddr: '北京市朝阳区建国路88号', receiver: '郑十', receiverAddr: '重庆市渝中区解放碑步行街50号', status: 'delivered', level: 'express', weight: 4.0, fee: 55.0, created: '2025-06-07 14:00:00', updated: '2025-06-09 10:20:00' },
    { id: 'w8', userId: 'u2', no: 'SF2025060800008', sender: '李商家', senderAddr: '杭州市西湖区文三路478号', receiver: '陈十一', receiverAddr: '西安市碑林区南大街150号', status: 'picked_up', level: 'standard', weight: 6.5, fee: 60.0, created: '2025-06-08 08:00:00', updated: '2025-06-08 17:30:00' },
    { id: 'w9', userId: 'u1', no: 'SF2025060900009', sender: '张三', senderAddr: '北京市朝阳区建国路88号', receiver: '何十二', receiverAddr: '长沙市岳麓区麓山南路36号', status: 'in_transit', level: 'standard', weight: 2.0, fee: 32.0, created: '2025-06-09 13:00:00', updated: '2025-06-10 09:00:00' },
    { id: 'w10', userId: 'u2', no: 'SF2025061000010', sender: '李商家', senderAddr: '杭州市西湖区文三路478号', receiver: '刘十三', receiverAddr: '天津市和平区南京路120号', status: 'created', level: 'same_day', weight: 0.5, fee: 48.0, created: '2025-06-10 06:30:00', updated: '2025-06-10 06:30:00' },
  ];

  for (const w of waybills) {
    insertWaybill.run(w.id, w.userId, w.no, w.sender, w.senderAddr, w.receiver, w.receiverAddr, w.status, w.level, w.weight, w.fee, w.created, w.updated);
  }

  const trackingNodes = [
    { id: 't1', waybillId: 'w1', time: '2025-06-01 09:30:00', location: '北京朝阳营业部', status: 'created', desc: '快件已揽收' },
    { id: 't2', waybillId: 'w1', time: '2025-06-01 18:00:00', location: '北京转运中心', status: 'in_transit', desc: '快件已发出，下一站上海转运中心' },
    { id: 't3', waybillId: 'w1', time: '2025-06-02 06:00:00', location: '上海转运中心', status: 'in_transit', desc: '快件已到达上海转运中心' },
    { id: 't4', waybillId: 'w1', time: '2025-06-02 14:00:00', location: '上海浦东营业部', status: 'in_transit', desc: '快件正在派送中' },
    { id: 't5', waybillId: 'w1', time: '2025-06-03 14:30:00', location: '上海浦东新区陆家嘴', status: 'delivered', desc: '快件已签收，签收人：本人' },

    { id: 't6', waybillId: 'w2', time: '2025-06-02 11:00:00', location: '北京朝阳营业部', status: 'created', desc: '快件已揽收' },
    { id: 't7', waybillId: 'w2', time: '2025-06-02 20:00:00', location: '北京转运中心', status: 'in_transit', desc: '快件已发出，下一站广州转运中心' },
    { id: 't8', waybillId: 'w2', time: '2025-06-03 10:00:00', location: '武汉转运中心', status: 'in_transit', desc: '快件途经武汉转运中心' },
    { id: 't9', waybillId: 'w2', time: '2025-06-04 08:00:00', location: '广州转运中心', status: 'in_transit', desc: '快件已到达广州转运中心，正在分拣' },

    { id: 't10', waybillId: 'w3', time: '2025-06-03 09:00:00', location: '杭州西湖营业部', status: 'created', desc: '快件已揽收' },
    { id: 't11', waybillId: 'w3', time: '2025-06-03 18:00:00', location: '杭州转运中心', status: 'picked_up', desc: '快件已到达转运中心，等待发车' },

    { id: 't12', waybillId: 'w4', time: '2025-06-04 07:30:00', location: '杭州西湖营业部', status: 'created', desc: '快件已揽收（当日达）' },
    { id: 't13', waybillId: 'w4', time: '2025-06-04 10:00:00', location: '杭州转运中心', status: 'in_transit', desc: '快件已发出，加急运输中' },
    { id: 't14', waybillId: 'w4', time: '2025-06-04 12:00:00', location: '深圳南山营业部', status: 'in_transit', desc: '快件正在派送中' },

    { id: 't15', waybillId: 'w6', time: '2025-06-06 10:00:00', location: '杭州西湖营业部', status: 'created', desc: '快件已揽收' },
    { id: 't16', waybillId: 'w6', time: '2025-06-06 18:00:00', location: '杭州转运中心', status: 'in_transit', desc: '快件已发出' },
    { id: 't17', waybillId: 'w6', time: '2025-06-07 14:00:00', location: '南京转运中心', status: 'in_transit', desc: '快件到达南京转运中心' },
    { id: 't18', waybillId: 'w6', time: '2025-06-08 10:00:00', location: '南京鼓楼营业部', status: 'in_transit', desc: '派送失败，收件人不在' },
    { id: 't19', waybillId: 'w6', time: '2025-06-09 16:00:00', location: '南京鼓楼营业部', status: 'returned', desc: '快件退回发件人' },

    { id: 't20', waybillId: 'w7', time: '2025-06-07 15:00:00', location: '北京朝阳营业部', status: 'created', desc: '快件已揽收' },
    { id: 't21', waybillId: 'w7', time: '2025-06-08 08:00:00', location: '重庆转运中心', status: 'in_transit', desc: '快件已到达重庆转运中心' },
    { id: 't22', waybillId: 'w7', time: '2025-06-09 10:20:00', location: '重庆渝中营业部', status: 'delivered', desc: '快件已签收，签收人：代收' },

    { id: 't23', waybillId: 'w9', time: '2025-06-09 14:00:00', location: '北京朝阳营业部', status: 'created', desc: '快件已揽收' },
    { id: 't24', waybillId: 'w9', time: '2025-06-09 22:00:00', location: '北京转运中心', status: 'in_transit', desc: '快件已发出，下一站长沙转运中心' },
    { id: 't25', waybillId: 'w9', time: '2025-06-10 09:00:00', location: '长沙转运中心', status: 'in_transit', desc: '快件已到达长沙转运中心' },
  ];

  for (const t of trackingNodes) {
    insertTrackingNode.run(t.id, t.waybillId, t.time, t.location, t.status, t.desc);
  }

  const pickups = [
    { id: 'p1', userId: 'u1', senderName: '张三', senderPhone: '13800138001', senderAddr: '北京市朝阳区建国路88号', receiverName: '李明', receiverPhone: '13900139001', receiverAddr: '上海市浦东新区陆家嘴环路100号', date: '2025-06-11', slot: 'morning', itemType: 'electronics', weight: 2.0, fee: 35.0, status: 'confirmed' },
    { id: 'p2', userId: 'u2', senderName: '李商家', senderPhone: '13800138002', senderAddr: '杭州市西湖区文三路478号', receiverName: '赵六', receiverPhone: '13900139002', receiverAddr: '成都市武侯区天府大道999号', date: '2025-06-11', slot: 'afternoon', itemType: 'clothing', weight: 5.0, fee: 45.0, status: 'pending' },
    { id: 'p3', userId: 'u1', senderName: '张三', senderPhone: '13800138001', senderAddr: '北京市朝阳区建国路88号', receiverName: '王芳', receiverPhone: '13900139003', receiverAddr: '广州市天河区珠江新城华夏路30号', date: '2025-06-12', slot: 'evening', itemType: 'documents', weight: 0.5, fee: 20.0, status: 'picked_up' },
    { id: 'p4', userId: 'u2', senderName: '李商家', senderPhone: '13800138002', senderAddr: '杭州市西湖区文三路478号', receiverName: '孙七', receiverPhone: '13900139004', receiverAddr: '深圳市南山区科技园路1号', date: '2025-06-10', slot: 'morning', itemType: 'food', weight: 3.0, fee: 50.0, status: 'picked_up' },
    { id: 'p5', userId: 'u1', senderName: '张三', senderPhone: '13800138001', senderAddr: '北京市朝阳区建国路88号', receiverName: '周八', receiverPhone: '13900139005', receiverAddr: '武汉市江汉区中山大道200号', date: '2025-06-09', slot: 'afternoon', itemType: 'general', weight: 1.5, fee: 25.0, status: 'cancelled' },
  ];

  for (const p of pickups) {
    insertPickup.run(p.id, p.userId, p.senderName, p.senderPhone, p.senderAddr, p.receiverName, p.receiverPhone, p.receiverAddr, p.date, p.slot, p.itemType, p.weight, p.fee, p.status);
  }

  const complaints = [
    { id: 'c1', waybillId: 'w6', type: 'lost', desc: '快件显示已签收但未收到包裹，联系快递员无回复', status: 'processing', branch: '南京鼓楼营业部', sla: '2025-06-12 16:00:00', created: '2025-06-09 17:00:00', updated: '2025-06-10 09:00:00' },
    { id: 'c2', waybillId: 'w1', type: 'damage', desc: '收到的电子产品外包装破损，内部产品有划痕', status: 'assigned', branch: '上海浦东营业部', sla: '2025-06-06 14:30:00', created: '2025-06-04 10:00:00', updated: '2025-06-04 15:00:00' },
    { id: 'c3', waybillId: 'w2', type: 'delay', desc: '快递已3天未更新物流信息，疑似滞留', status: 'pending', branch: null, sla: null, created: '2025-06-05 08:00:00', updated: '2025-06-05 08:00:00' },
    { id: 'c4', waybillId: 'w7', type: 'service', desc: '快递员态度恶劣，未经同意放在门口', status: 'resolved', branch: '重庆渝中营业部', sla: '2025-06-12 10:20:00', created: '2025-06-09 15:00:00', updated: '2025-06-10 11:00:00' },
  ];

  for (const c of complaints) {
    insertComplaint.run(c.id, c.waybillId, c.type, c.desc, c.status, c.branch, c.sla, c.created, c.updated);
  }

  const invoices = [
    { id: 'inv1', waybillId: 'w1', invoiceNo: 'INV202506010001', amount: 35.0, title: '北京张三科技有限公司', taxNo: '91110105MA01ABC1X2', status: 'issued', issuedAt: '2025-06-03 15:00:00', createdAt: '2025-06-01 10:00:00' },
    { id: 'inv2', waybillId: 'w4', invoiceNo: 'INV202506040002', amount: 52.0, title: '杭州李商家电子商务有限公司', taxNo: '91330106MA2BCD3X4L', status: 'pending', issuedAt: null, createdAt: '2025-06-04 08:00:00' },
    { id: 'inv3', waybillId: 'w7', invoiceNo: 'INV202506070003', amount: 55.0, title: '北京张三科技有限公司', taxNo: '91110105MA01ABC1X2', status: 'failed', issuedAt: null, createdAt: '2025-06-07 16:00:00' },
  ];

  for (const inv of invoices) {
    insertInvoice.run(inv.id, inv.waybillId, inv.invoiceNo, inv.amount, inv.title, inv.taxNo, inv.status, inv.issuedAt, inv.createdAt);
  }

  insertMembership.run('m1', 'u1', 1580, 'silver', null, 3200, 1400, 220);
  insertMembership.run('m2', 'u2', 8500, 'svip', '2026-06-30 23:59:59', 20000, 9500, 2000);
  insertMembership.run('m3', 'u3', 4200, 'gold', null, 8000, 3200, 600);

  const pointsRecords = [
    { id: 'pr1', userId: 'u1', type: 'earn', amount: 350, desc: '寄送快件 SF2025060100001 获得积分', createdAt: '2025-06-01 09:30:00' },
    { id: 'pr2', userId: 'u1', type: 'earn', amount: 280, desc: '寄送快件 SF2025060200002 获得积分', createdAt: '2025-06-02 11:00:00' },
    { id: 'pr3', userId: 'u1', type: 'use', amount: 200, desc: '兑换优惠券', createdAt: '2025-06-03 10:00:00' },
    { id: 'pr4', userId: 'u1', type: 'earn', amount: 550, desc: '寄送快件 SF2025060700007 获得积分', createdAt: '2025-06-07 15:00:00' },
    { id: 'pr5', userId: 'u1', type: 'expire', amount: 220, desc: '2024年度积分过期', createdAt: '2025-01-01 00:00:00' },
    { id: 'pr6', userId: 'u2', type: 'earn', amount: 4500, desc: '批量寄送订单积分', createdAt: '2025-06-03 09:00:00' },
    { id: 'pr7', userId: 'u2', type: 'earn', amount: 5200, desc: '批量寄送订单积分', createdAt: '2025-06-04 08:00:00' },
    { id: 'pr8', userId: 'u2', type: 'use', amount: 1200, desc: '兑换SVIP年卡', createdAt: '2025-05-01 10:00:00' },
    { id: 'pr9', userId: 'u3', type: 'earn', amount: 4000, desc: '系统奖励积分', createdAt: '2025-01-15 09:00:00' },
    { id: 'pr10', userId: 'u3', type: 'use', amount: 800, desc: '兑换礼品', createdAt: '2025-03-20 14:00:00' },
  ];

  for (const pr of pointsRecords) {
    insertPointsRecord.run(pr.id, pr.userId, pr.type, pr.amount, pr.desc, pr.createdAt);
  }

  const contrabandItems = [
    { id: 'cl1', name: '烟花爆竹', category: '易燃易爆', keywords: '烟花,爆竹,鞭炮,礼花,炮竹', risk: 'high' },
    { id: 'cl2', name: '汽油', category: '易燃易爆', keywords: '汽油,柴油,煤油,燃料油,石油', risk: 'high' },
    { id: 'cl3', name: '酒精（高浓度）', category: '易燃易爆', keywords: '酒精,乙醇,白酒,烈酒,消毒液', risk: 'medium' },
    { id: 'cl4', name: '硫酸', category: '化学品', keywords: '硫酸,盐酸,硝酸,强酸,腐蚀性液体', risk: 'high' },
    { id: 'cl5', name: '农药', category: '化学品', keywords: '农药,杀虫剂,除草剂,百草枯,有机磷', risk: 'high' },
    { id: 'cl6', name: '氢氧化钠', category: '化学品', keywords: '氢氧化钠,烧碱,火碱,苛性钠,强碱', risk: 'medium' },
    { id: 'cl7', name: '冰毒', category: '毒品', keywords: '冰毒,甲基苯丙胺,麻古,MA,水晶', risk: 'high' },
    { id: 'cl8', name: '海洛因', category: '毒品', keywords: '海洛因,白粉,四号,二乙酰吗啡', risk: 'high' },
    { id: 'cl9', name: '匕首', category: '管制刀具', keywords: '匕首,短剑,刺刀,三棱刀,跳刀', risk: 'high' },
    { id: 'cl10', name: '弹簧刀', category: '管制刀具', keywords: '弹簧刀,跳刀,甩刀,折叠刀,自动刀', risk: 'medium' },
    { id: 'cl11', name: '病原微生物', category: '生物制品', keywords: '病原体,细菌,病毒,培养物,菌株', risk: 'high' },
    { id: 'cl12', name: '医疗废弃物', category: '生物制品', keywords: '医疗废物,注射器,输液管,手术废弃物', risk: 'medium' },
    { id: 'cl13', name: '打火机（充气式）', category: '易燃易爆', keywords: '充气打火机,防风打火机,喷火枪', risk: 'low' },
  ];

  for (const cl of contrabandItems) {
    insertContraband.run(cl.id, cl.name, cl.category, cl.keywords, cl.risk);
  }

  const auditLogs = [
    { id: 'al1', userId: 'u3', operator: '王管理', action: 'login', target: 'system', detail: '管理员登录系统', createdAt: '2025-06-10 08:00:00' },
    { id: 'al2', userId: 'u3', operator: '王管理', action: 'update', target: 'waybill/SF2025060600006', detail: '更新运单状态为 returned', createdAt: '2025-06-09 16:00:00' },
    { id: 'al3', userId: 'u1', operator: '张三', action: 'create', target: 'waybill/SF2025060900009', detail: '创建新运单', createdAt: '2025-06-09 13:00:00' },
    { id: 'al4', userId: 'u2', operator: '李商家', action: 'create', target: 'pickup/p2', detail: '预约上门取件', createdAt: '2025-06-10 10:00:00' },
    { id: 'al5', userId: 'u3', operator: '王管理', action: 'assign', target: 'complaint/c1', detail: '将投诉工单分配至南京鼓楼营业部', createdAt: '2025-06-10 09:30:00' },
    { id: 'al6', userId: 'u2', operator: '王管理', action: 'svip_grant', target: 'membership/u2', detail: '授予SVIP会员权益 | 变更前: gold → 变更后: svip | 有效期: 2025-06-01 至 2026-05-31 | 原因: 年度优质商家奖励 | 审核人: 王管理', createdAt: '2025-06-01 00:00:00' },
    { id: 'al7', userId: 'u1', operator: '王管理', action: 'svip_upgrade', target: 'membership/u1', detail: '升级会员等级 | 变更前: normal → 变更后: silver | 原因: 累计寄件满30单自动升级 | 审核人: 系统自动', createdAt: '2025-05-15 14:30:00' },
    { id: 'al8', userId: 'u2', operator: '李商家', action: 'svip_renew', target: 'membership/u2', detail: 'SVIP会员续费 | 变更前: 有效期至2026-05-31 → 变更后: 有效期至2027-05-31 | 续费金额: ¥1299/年 | 审核人: 系统自动', createdAt: '2025-05-28 09:15:00' },
    { id: 'al9', userId: 'u3', operator: '王管理', action: 'points_adjust', target: 'membership/u2', detail: '积分调整 | 变更前: 8500 → 变更后: 10000 | 调整数量: +1500 | 原因: 618活动额外赠送 | 审核人: 王管理', createdAt: '2025-06-05 11:00:00' },
    { id: 'al10', userId: 'u3', operator: '王管理', action: 'benefit_grant', target: 'benefit/free_packaging', detail: '发放权益: 免费包装服务 | 发放对象: 李商家 | 有效期: 30天 | 数量: 5次 | 原因: 活动奖励 | 审核人: 王管理', createdAt: '2025-06-08 10:20:00' },
    { id: 'al11', userId: 'u3', operator: '王管理', action: 'svip_revoke', target: 'membership/u3', detail: '撤销SVIP权益 | 变更前: svip → 变更后: gold | 原因: 违规使用 | 审核人: 王管理 | 复核人: 陈总监', createdAt: '2025-06-03 16:45:00' },
    { id: 'al12', userId: 'u2', operator: '系统自动', action: 'points_expire', target: 'points/u2', detail: '积分过期 | 变更前: 9200 → 变更后: 9000 | 过期数量: 200 | 原因: 积分有效期满12个月', createdAt: '2025-06-07 00:00:00' },
    { id: 'al13', userId: 'u3', operator: '王管理', action: 'review', target: 'membership/u2', detail: 'SVIP权益发放复核 | 操作: 通过 | 复核意见: 符合优质商家标准 | 复核人: 王管理', createdAt: '2025-06-01 00:30:00' },
  ];

  for (const al of auditLogs) {
    insertAuditLog.run(al.id, al.userId, al.operator, al.action, al.target, al.detail, al.createdAt);
  }

  const importBatches = [
    { id: 'ib1', userId: 'u2', totalCount: 50, successCount: 47, failedCount: 3, status: 'completed', fileName: '6月订单批量导入.xlsx', template: 'standard',
      failedReasons: JSON.stringify([
        { row: 3, waybillNo: 'SF2025061000011', reason: '收件人手机号格式错误' },
        { row: 12, waybillNo: '', reason: '运单号不能为空' },
        { row: 28, waybillNo: 'SF2025061000028', reason: '收件地址不完整' },
      ]),
      createdAt: '2025-06-10 09:00:00', completedAt: '2025-06-10 09:00:45' },
    { id: 'ib2', userId: 'u2', totalCount: 30, successCount: 30, failedCount: 0, status: 'completed', fileName: '淘宝订单导出.csv', template: 'ecommerce',
      failedReasons: '[]',
      createdAt: '2025-06-08 14:30:00', completedAt: '2025-06-08 14:30:20' },
    { id: 'ib3', userId: 'u2', totalCount: 100, successCount: 95, failedCount: 5, status: 'completed', fileName: '618活动第一批.xlsx', template: 'standard',
      failedReasons: JSON.stringify([
        { row: 7, waybillNo: 'SF2025060500007', reason: '运单号已存在' },
        { row: 15, waybillNo: '', reason: '运单号为空' },
        { row: 33, waybillNo: 'SF2025060500033', reason: '收件人姓名为空' },
        { row: 56, waybillNo: 'SF2025060500056', reason: '重量超出范围（>50kg）' },
        { row: 89, waybillNo: 'SF2025060500089', reason: '寄件地址不支持取件' },
      ]),
      createdAt: '2025-06-05 08:00:00', completedAt: '2025-06-05 08:02:30' },
    { id: 'ib4', userId: 'u1', totalCount: 5, successCount: 5, failedCount: 0, status: 'completed', fileName: '个人寄件.csv', template: 'standard',
      failedReasons: '[]',
      createdAt: '2025-06-09 16:00:00', completedAt: '2025-06-09 16:00:05' },
  ];

  for (const ib of importBatches) {
    db.prepare(
      `INSERT OR IGNORE INTO import_batches (id, user_id, total_count, success_count, failed_count, status, file_name, template, failed_reasons, created_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(ib.id, ib.userId, ib.totalCount, ib.successCount, ib.failedCount, ib.status, ib.fileName, ib.template, ib.failedReasons, ib.createdAt, ib.completedAt);
  }

  const printBatches = [
    { id: 'pb1', userId: 'u2', waybillIds: '["w1","w2","w3"]', template: 'standard', status: 'completed', totalCount: 3, printedCount: 3,
      createdAt: '2025-06-10 10:00:00', completedAt: '2025-06-10 10:00:15' },
    { id: 'pb2', userId: 'u2', waybillIds: '["w5","w6","w7","w8","w9","w10"]', template: 'thermal', status: 'completed', totalCount: 6, printedCount: 6,
      createdAt: '2025-06-09 11:00:00', completedAt: '2025-06-09 11:00:45' },
    { id: 'pb3', userId: 'u2', waybillIds: '["w1","w2","w3","w4","w5"]', template: 'a4', status: 'failed', totalCount: 5, printedCount: 2,
      createdAt: '2025-06-07 14:00:00', completedAt: '2025-06-07 14:00:30' },
    { id: 'pb4', userId: 'u1', waybillIds: '["w1"]', template: 'standard', status: 'completed', totalCount: 1, printedCount: 1,
      createdAt: '2025-06-08 09:00:00', completedAt: '2025-06-08 09:00:03' },
  ];

  for (const pb of printBatches) {
    db.prepare(
      `INSERT OR IGNORE INTO print_batches (id, user_id, waybill_ids, template, status, total_count, printed_count, created_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(pb.id, pb.userId, pb.waybillIds, pb.template, pb.status, pb.totalCount, pb.printedCount, pb.createdAt, pb.completedAt);
  }
});

seed();

export default db;
