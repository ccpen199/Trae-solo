import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, '..', 'data.db')

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDatabase() {
  const tableCount = db.prepare("SELECT count(*) as c FROM sqlite_master WHERE type='table' AND name='users'").get() as { c: number }
  if (tableCount.c > 0) return

  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('consumer', 'technician', 'admin')),
      avatar TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE technician_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'suspended')),
      rating REAL NOT NULL DEFAULT 0,
      completed_orders INTEGER NOT NULL DEFAULT 0,
      lat REAL,
      lng REAL,
      skills TEXT
    );

    CREATE TABLE warehouses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL
    );

    CREATE TABLE devices (
      id TEXT PRIMARY KEY,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('phone', 'laptop', 'tablet', 'wearable')),
      release_year INTEGER,
      original_price REAL
    );

    CREATE TABLE diagnosis_rules (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL REFERENCES devices(id),
      fault_name TEXT NOT NULL,
      confidence REAL NOT NULL,
      estimated_price_min REAL NOT NULL,
      estimated_price_max REAL NOT NULL,
      estimated_time INTEGER NOT NULL,
      symptoms TEXT NOT NULL,
      required_parts TEXT
    );

    CREATE TABLE orders (
      id TEXT PRIMARY KEY,
      consumer_id TEXT NOT NULL REFERENCES users(id),
      technician_id TEXT REFERENCES users(id),
      device_id TEXT REFERENCES devices(id),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'arrived', 'repairing', 'verifying', 'completed', 'disputed')),
      total_price REAL NOT NULL DEFAULT 0,
      address TEXT NOT NULL,
      booked_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE timeline_events (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      status TEXT NOT NULL,
      operator_id TEXT REFERENCES users(id),
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE parts (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
      status TEXT NOT NULL DEFAULT 'in_stock' CHECK(status IN ('in_stock', 'reserved', 'used', 'transferred')),
      bound_order_id TEXT REFERENCES orders(id),
      inbound_batch TEXT NOT NULL,
      inbound_date TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE order_parts (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      part_code TEXT NOT NULL REFERENCES parts(code),
      quantity INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE escrows (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL UNIQUE REFERENCES orders(id),
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'frozen' CHECK(status IN ('frozen', 'released', 'refunded', 'disputed')),
      frozen_at TEXT NOT NULL DEFAULT (datetime('now')),
      released_at TEXT
    );

    CREATE TABLE video_records (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      url TEXT NOT NULL,
      duration REAL NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE complaints (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      consumer_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL CHECK(type IN ('quality', 'service', 'price', 'parts', 'other')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'investigating', 'resolved', 'arbitrating', 'closed')),
      description TEXT NOT NULL,
      result TEXT,
      compensation REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE complaint_timeline (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL REFERENCES complaints(id),
      action TEXT NOT NULL,
      operator_id TEXT REFERENCES users(id),
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX idx_orders_consumer ON orders(consumer_id);
    CREATE INDEX idx_orders_technician ON orders(technician_id);
    CREATE INDEX idx_orders_status ON orders(status);
    CREATE INDEX idx_parts_warehouse ON parts(warehouse_id);
    CREATE INDEX idx_parts_status ON parts(status);
    CREATE INDEX idx_complaints_status ON complaints(status);
    CREATE INDEX idx_complaints_order ON complaints(order_id);
    CREATE INDEX idx_timeline_order ON timeline_events(order_id);
  `)

  seedData()
}

function seedData() {
  const now = new Date().toISOString()

  const insertUser = db.prepare(`INSERT INTO users (id, phone, name, role, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?)`)

  const consumers = [
    { id: 'U001', phone: '13800001001', name: '张伟', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangwei' },
    { id: 'U002', phone: '13800001002', name: '李娜', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lina' },
    { id: 'U003', phone: '13800001003', name: '王芳', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangfang' },
  ]
  consumers.forEach(u => insertUser.run(u.id, u.phone, u.name, 'consumer', u.avatar, now))

  const technicians = [
    { id: 'U101', phone: '13900001001', name: '刘强', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liuqiang' },
    { id: 'U102', phone: '13900001002', name: '陈明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenming' },
    { id: 'U103', phone: '13900001003', name: '赵磊', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaolei' },
    { id: 'U104', phone: '13900001004', name: '孙鹏', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunpeng' },
    { id: 'U105', phone: '13900001005', name: '周杰', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhoujie' },
  ]
  technicians.forEach(u => insertUser.run(u.id, u.phone, u.name, 'technician', u.avatar, now))

  insertUser.run('U999', '13800009999', '管理员', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', now)

  const insertTechProfile = db.prepare(`INSERT INTO technician_profiles (id, user_id, status, rating, completed_orders, lat, lng, skills) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
  const techProfiles = [
    { id: 'TP01', user_id: 'U101', status: 'approved', rating: 4.8, completed_orders: 156, lat: 39.9042, lng: 116.4074, skills: '["iPhone维修","MacBook维修","iPad维修"]' },
    { id: 'TP02', user_id: 'U102', status: 'approved', rating: 4.6, completed_orders: 98, lat: 31.2304, lng: 121.4737, skills: '["三星维修","华为维修","小米维修"]' },
    { id: 'TP03', user_id: 'U103', status: 'approved', rating: 4.9, completed_orders: 203, lat: 39.9142, lng: 116.3874, skills: '["ThinkPad维修","MacBook维修","主板维修"]' },
    { id: 'TP04', user_id: 'U104', status: 'pending', rating: 0, completed_orders: 0, lat: 22.5431, lng: 114.0579, skills: '["华为维修","小米维修","平板维修"]' },
    { id: 'TP05', user_id: 'U105', status: 'approved', rating: 4.5, completed_orders: 67, lat: 31.2404, lng: 121.4837, skills: '["Apple Watch维修","小米手表维修","穿戴设备维修"]' },
  ]
  techProfiles.forEach(tp => insertTechProfile.run(tp.id, tp.user_id, tp.status, tp.rating, tp.completed_orders, tp.lat, tp.lng, tp.skills))

  const insertWarehouse = db.prepare(`INSERT INTO warehouses (id, name, address, lat, lng) VALUES (?, ?, ?, ?, ?)`)
  const warehouses = [
    { id: 'WH01', name: '北京仓', address: '北京市朝阳区建国路88号', lat: 39.9042, lng: 116.4074 },
    { id: 'WH02', name: '上海仓', address: '上海市浦东新区张江高科技园区', lat: 31.2304, lng: 121.4737 },
    { id: 'WH03', name: '深圳仓', address: '深圳市南山区科技园路1号', lat: 22.5431, lng: 114.0579 },
  ]
  warehouses.forEach(w => insertWarehouse.run(w.id, w.name, w.address, w.lat, w.lng))

  const insertDevice = db.prepare(`INSERT INTO devices (id, brand, model, type, release_year, original_price) VALUES (?, ?, ?, ?, ?, ?)`)
  const devices = [
    { id: 'D01', brand: 'Apple', model: 'iPhone 15 Pro', type: 'phone', release_year: 2023, original_price: 8999 },
    { id: 'D02', brand: 'Apple', model: 'MacBook Pro 14', type: 'laptop', release_year: 2023, original_price: 14999 },
    { id: 'D03', brand: 'Apple', model: 'iPad Air', type: 'tablet', release_year: 2024, original_price: 4799 },
    { id: 'D04', brand: 'Apple', model: 'Apple Watch S9', type: 'wearable', release_year: 2023, original_price: 2999 },
    { id: 'D05', brand: 'Samsung', model: 'Samsung S24', type: 'phone', release_year: 2024, original_price: 6999 },
    { id: 'D06', brand: 'Lenovo', model: 'ThinkPad X1', type: 'laptop', release_year: 2023, original_price: 11999 },
    { id: 'D07', brand: 'Huawei', model: 'Huawei MatePad', type: 'tablet', release_year: 2023, original_price: 3299 },
    { id: 'D08', brand: 'Xiaomi', model: 'Xiaomi Watch S3', type: 'wearable', release_year: 2024, original_price: 999 },
  ]
  devices.forEach(d => insertDevice.run(d.id, d.brand, d.model, d.type, d.release_year, d.original_price))

  const insertDiagRule = db.prepare(`INSERT INTO diagnosis_rules (id, device_id, fault_name, confidence, estimated_price_min, estimated_price_max, estimated_time, symptoms, required_parts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  const diagRules = [
    { id: 'DR01', device_id: 'D01', fault_name: '屏幕碎裂', confidence: 0.92, estimated_price_min: 1200, estimated_price_max: 1800, estimated_time: 60, symptoms: '["屏幕裂纹","触摸失灵","显示异常"]', required_parts: '[{"partCode":"P001","partName":"iPhone 15 Pro 屏幕","quantity":1}]' },
    { id: 'DR02', device_id: 'D01', fault_name: '电池老化', confidence: 0.88, estimated_price_min: 300, estimated_price_max: 500, estimated_time: 30, symptoms: '["电池续航短","充电发热","意外关机"]', required_parts: '[{"partCode":"P002","partName":"iPhone 15 Pro 电池","quantity":1}]' },
    { id: 'DR03', device_id: 'D02', fault_name: '键盘失灵', confidence: 0.85, estimated_price_min: 800, estimated_price_max: 1500, estimated_time: 90, symptoms: '["按键无反应","按键重复","键盘灯不亮"]', required_parts: '[{"partCode":"P003","partName":"MacBook Pro 14 键盘","quantity":1}]' },
    { id: 'DR04', device_id: 'D02', fault_name: '屏幕花屏', confidence: 0.78, estimated_price_min: 2500, estimated_price_max: 4000, estimated_time: 120, symptoms: '["显示花屏","闪屏","色差"]', required_parts: '[{"partCode":"P004","partName":"MacBook Pro 14 屏幕","quantity":1}]' },
    { id: 'DR05', device_id: 'D03', fault_name: '触摸失灵', confidence: 0.90, estimated_price_min: 600, estimated_price_max: 1000, estimated_time: 45, symptoms: '["触摸无反应","触摸漂移","局部失灵"]', required_parts: '[{"partCode":"P005","partName":"iPad Air 触控模组","quantity":1}]' },
    { id: 'DR06', device_id: 'D04', fault_name: '电池续航差', confidence: 0.82, estimated_price_min: 200, estimated_price_max: 400, estimated_time: 30, symptoms: '["续航短","充电慢","电量跳变"]', required_parts: '[{"partCode":"P006","partName":"Apple Watch S9 电池","quantity":1}]' },
    { id: 'DR07', device_id: 'D05', fault_name: '充电口故障', confidence: 0.87, estimated_price_min: 200, estimated_price_max: 500, estimated_time: 40, symptoms: '["无法充电","接触不良","充电口松动"]', required_parts: '[{"partCode":"P007","partName":"Samsung S24 充电尾插","quantity":1}]' },
    { id: 'DR08', device_id: 'D06', fault_name: '蓝屏死机', confidence: 0.75, estimated_price_min: 500, estimated_price_max: 2000, estimated_time: 120, symptoms: '["蓝屏","频繁死机","重启"]', required_parts: '[{"partCode":"P008","partName":"ThinkPad X1 内存条","quantity":1}]' },
    { id: 'DR09', device_id: 'D07', fault_name: '屏幕碎裂', confidence: 0.91, estimated_price_min: 500, estimated_price_max: 900, estimated_time: 50, symptoms: '["屏幕裂纹","触摸失灵","显示异常"]', required_parts: '[{"partCode":"P009","partName":"MatePad 屏幕","quantity":1}]' },
    { id: 'DR10', device_id: 'D08', fault_name: '表带断裂', confidence: 0.95, estimated_price_min: 50, estimated_price_max: 150, estimated_time: 15, symptoms: '["表带断裂","表带松动","佩戴不适"]', required_parts: '[{"partCode":"P010","partName":"Xiaomi Watch S3 表带","quantity":1}]' },
    { id: 'DR11', device_id: 'D01', fault_name: '主板故障', confidence: 0.65, estimated_price_min: 2000, estimated_price_max: 3500, estimated_time: 180, symptoms: '["无法开机","频繁重启","信号异常"]', required_parts: '[{"partCode":"P011","partName":"iPhone 15 Pro 主板","quantity":1}]' },
    { id: 'DR12', device_id: 'D05', fault_name: '屏幕碎裂', confidence: 0.93, estimated_price_min: 800, estimated_price_max: 1400, estimated_time: 60, symptoms: '["屏幕裂纹","触摸失灵","显示异常"]', required_parts: '[{"partCode":"P012","partName":"Samsung S24 屏幕","quantity":1}]' },
  ]
  diagRules.forEach(dr => insertDiagRule.run(dr.id, dr.device_id, dr.fault_name, dr.confidence, dr.estimated_price_min, dr.estimated_price_max, dr.estimated_time, dr.symptoms, dr.required_parts))

  const t = (offsetDays: number, hour = 10) => {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    d.setHours(hour, 0, 0, 0)
    return d.toISOString()
  }

  const insertOrder = db.prepare(`INSERT INTO orders (id, consumer_id, technician_id, device_id, status, total_price, address, booked_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  const orders = [
    { id: 'ORD001', consumer_id: 'U001', technician_id: 'U101', device_id: 'D01', status: 'completed', total_price: 1500, address: '北京市海淀区中关村大街1号', booked_at: t(-7, 14), created_at: t(-7, 9) },
    { id: 'ORD002', consumer_id: 'U001', technician_id: 'U103', device_id: 'D02', status: 'repairing', total_price: 0, address: '北京市朝阳区三里屯路19号', booked_at: t(-1, 15), created_at: t(-1, 10) },
    { id: 'ORD003', consumer_id: 'U002', technician_id: 'U102', device_id: 'D05', status: 'verifying', total_price: 900, address: '上海市静安区南京西路1266号', booked_at: t(-2, 11), created_at: t(-2, 8) },
    { id: 'ORD004', consumer_id: 'U003', technician_id: null, device_id: 'D03', status: 'pending', total_price: 0, address: '北京市东城区王府井大街138号', booked_at: t(1, 10), created_at: t(0, 8) },
    { id: 'ORD005', consumer_id: 'U002', technician_id: 'U101', device_id: 'D04', status: 'arrived', total_price: 0, address: '北京市西城区金融大街7号', booked_at: t(0, 14), created_at: t(0, 13) },
    { id: 'ORD006', consumer_id: 'U003', technician_id: 'U105', device_id: 'D08', status: 'accepted', total_price: 0, address: '上海市浦东新区陆家嘴环路1000号', booked_at: t(0, 16), created_at: t(0, 14) },
    { id: 'ORD007', consumer_id: 'U001', technician_id: 'U103', device_id: 'D06', status: 'disputed', total_price: 1800, address: '北京市海淀区五道口', booked_at: t(-5, 9), created_at: t(-5, 7) },
    { id: 'ORD008', consumer_id: 'U002', technician_id: 'U102', device_id: 'D07', status: 'completed', total_price: 700, address: '上海市徐汇区衡山路10号', booked_at: t(-10, 13), created_at: t(-10, 9) },
  ]
  orders.forEach(o => insertOrder.run(o.id, o.consumer_id, o.technician_id, o.device_id, o.status, o.total_price, o.address, o.booked_at, o.created_at))

  const insertTimeline = db.prepare(`INSERT INTO timeline_events (id, order_id, status, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
  const timelines = [
    { id: 'TL001', order_id: 'ORD001', status: 'pending', operator_id: 'U001', note: '用户提交维修工单', created_at: t(-7, 9) },
    { id: 'TL002', order_id: 'ORD001', status: 'accepted', operator_id: 'U101', note: '技师刘强已接单', created_at: t(-7, 9, 15) },
    { id: 'TL003', order_id: 'ORD001', status: 'arrived', operator_id: 'U101', note: '技师已到场签到', created_at: t(-7, 10, 5) },
    { id: 'TL004', order_id: 'ORD001', status: 'repairing', operator_id: 'U101', note: '开始维修，更换屏幕', created_at: t(-7, 10, 15) },
    { id: 'TL005', order_id: 'ORD001', status: 'verifying', operator_id: 'U101', note: '维修完成，等待验收', created_at: t(-7, 11, 15) },
    { id: 'TL006', order_id: 'ORD001', status: 'completed', operator_id: 'U001', note: '用户验收通过', created_at: t(-7, 14) },

    { id: 'TL007', order_id: 'ORD002', status: 'pending', operator_id: 'U001', note: '用户提交MacBook维修工单', created_at: t(-1, 10) },
    { id: 'TL008', order_id: 'ORD002', status: 'accepted', operator_id: 'U103', note: '技师赵磊已接单', created_at: t(-1, 10, 20) },
    { id: 'TL009', order_id: 'ORD002', status: 'arrived', operator_id: 'U103', note: '技师已到场签到', created_at: t(-1, 11) },
    { id: 'TL010', order_id: 'ORD002', status: 'repairing', operator_id: 'U103', note: '开始维修，检测键盘故障', created_at: t(-1, 11, 10) },

    { id: 'TL011', order_id: 'ORD003', status: 'pending', operator_id: 'U002', note: '用户提交三星手机维修工单', created_at: t(-2, 8) },
    { id: 'TL012', order_id: 'ORD003', status: 'accepted', operator_id: 'U102', note: '技师陈明已接单', created_at: t(-2, 8, 30) },
    { id: 'TL013', order_id: 'ORD003', status: 'arrived', operator_id: 'U102', note: '技师已到场签到', created_at: t(-2, 9, 20) },
    { id: 'TL014', order_id: 'ORD003', status: 'repairing', operator_id: 'U102', note: '开始维修，更换充电口', created_at: t(-2, 9, 30) },
    { id: 'TL015', order_id: 'ORD003', status: 'verifying', operator_id: 'U102', note: '维修完成，等待验收', created_at: t(-2, 10, 30) },

    { id: 'TL016', order_id: 'ORD004', status: 'pending', operator_id: 'U003', note: '用户提交iPad维修工单', created_at: t(0, 8) },

    { id: 'TL017', order_id: 'ORD005', status: 'pending', operator_id: 'U002', note: '用户提交Apple Watch维修工单', created_at: t(0, 13) },
    { id: 'TL018', order_id: 'ORD005', status: 'accepted', operator_id: 'U101', note: '技师刘强已接单', created_at: t(0, 13, 10) },
    { id: 'TL019', order_id: 'ORD005', status: 'arrived', operator_id: 'U101', note: '技师已到场签到', created_at: t(0, 13, 55) },

    { id: 'TL020', order_id: 'ORD006', status: 'pending', operator_id: 'U003', note: '用户提交小米手表维修工单', created_at: t(0, 14) },
    { id: 'TL021', order_id: 'ORD006', status: 'accepted', operator_id: 'U105', note: '技师周杰已接单', created_at: t(0, 14, 15) },

    { id: 'TL022', order_id: 'ORD007', status: 'pending', operator_id: 'U001', note: '用户提交ThinkPad维修工单', created_at: t(-5, 7) },
    { id: 'TL023', order_id: 'ORD007', status: 'accepted', operator_id: 'U103', note: '技师赵磊已接单', created_at: t(-5, 7, 20) },
    { id: 'TL024', order_id: 'ORD007', status: 'arrived', operator_id: 'U103', note: '技师已到场签到', created_at: t(-5, 8, 10) },
    { id: 'TL025', order_id: 'ORD007', status: 'repairing', operator_id: 'U103', note: '开始维修，更换内存', created_at: t(-5, 8, 30) },
    { id: 'TL026', order_id: 'ORD007', status: 'verifying', operator_id: 'U103', note: '维修完成，等待验收', created_at: t(-5, 11) },
    { id: 'TL027', order_id: 'ORD007', status: 'disputed', operator_id: 'U001', note: '用户对维修结果不满意，发起争议', created_at: t(-5, 15) },

    { id: 'TL028', order_id: 'ORD008', status: 'pending', operator_id: 'U002', note: '用户提交华为平板维修工单', created_at: t(-10, 9) },
    { id: 'TL029', order_id: 'ORD008', status: 'accepted', operator_id: 'U102', note: '技师陈明已接单', created_at: t(-10, 9, 20) },
    { id: 'TL030', order_id: 'ORD008', status: 'arrived', operator_id: 'U102', note: '技师已到场签到', created_at: t(-10, 10, 5) },
    { id: 'TL031', order_id: 'ORD008', status: 'repairing', operator_id: 'U102', note: '开始维修，更换屏幕', created_at: t(-10, 10, 15) },
    { id: 'TL032', order_id: 'ORD008', status: 'verifying', operator_id: 'U102', note: '维修完成，等待验收', created_at: t(-10, 11) },
    { id: 'TL033', order_id: 'ORD008', status: 'completed', operator_id: 'U002', note: '用户验收通过', created_at: t(-10, 13) },
  ]
  timelines.forEach(tl => insertTimeline.run(tl.id, tl.order_id, tl.status, tl.operator_id, tl.note, tl.created_at))

  const insertPart = db.prepare(`INSERT INTO parts (code, name, category, warehouse_id, status, bound_order_id, inbound_batch, inbound_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
  const parts = [
    { code: 'P001', name: 'iPhone 15 Pro 屏幕', category: '屏幕', warehouse_id: 'WH01', status: 'used', bound_order_id: 'ORD001', inbound_batch: 'BATCH-2024-001', inbound_date: t(-30) },
    { code: 'P002', name: 'iPhone 15 Pro 电池', category: '电池', warehouse_id: 'WH01', status: 'in_stock', bound_order_id: null, inbound_batch: 'BATCH-2024-002', inbound_date: t(-25) },
    { code: 'P003', name: 'MacBook Pro 14 键盘', category: '键盘', warehouse_id: 'WH01', status: 'reserved', bound_order_id: 'ORD002', inbound_batch: 'BATCH-2024-003', inbound_date: t(-20) },
    { code: 'P004', name: 'MacBook Pro 14 屏幕', category: '屏幕', warehouse_id: 'WH02', status: 'in_stock', bound_order_id: null, inbound_batch: 'BATCH-2024-004', inbound_date: t(-18) },
    { code: 'P005', name: 'iPad Air 触控模组', category: '触控', warehouse_id: 'WH01', status: 'in_stock', bound_order_id: null, inbound_batch: 'BATCH-2024-005', inbound_date: t(-15) },
    { code: 'P006', name: 'Apple Watch S9 电池', category: '电池', warehouse_id: 'WH02', status: 'reserved', bound_order_id: 'ORD005', inbound_batch: 'BATCH-2024-006', inbound_date: t(-12) },
    { code: 'P007', name: 'Samsung S24 充电尾插', category: '接口', warehouse_id: 'WH02', status: 'used', bound_order_id: 'ORD003', inbound_batch: 'BATCH-2024-007', inbound_date: t(-10) },
    { code: 'P008', name: 'ThinkPad X1 内存条', category: '内存', warehouse_id: 'WH01', status: 'used', bound_order_id: 'ORD007', inbound_batch: 'BATCH-2024-008', inbound_date: t(-8) },
    { code: 'P009', name: 'MatePad 屏幕', category: '屏幕', warehouse_id: 'WH03', status: 'used', bound_order_id: 'ORD008', inbound_batch: 'BATCH-2024-009', inbound_date: t(-15) },
    { code: 'P010', name: 'Xiaomi Watch S3 表带', category: '配件', warehouse_id: 'WH03', status: 'in_stock', bound_order_id: null, inbound_batch: 'BATCH-2024-010', inbound_date: t(-5) },
    { code: 'P011', name: 'iPhone 15 Pro 主板', category: '主板', warehouse_id: 'WH01', status: 'in_stock', bound_order_id: null, inbound_batch: 'BATCH-2024-011', inbound_date: t(-3) },
    { code: 'P012', name: 'Samsung S24 屏幕', category: '屏幕', warehouse_id: 'WH02', status: 'in_stock', bound_order_id: null, inbound_batch: 'BATCH-2024-012', inbound_date: t(-2) },
    { code: 'P013', name: 'iPhone 15 Pro 摄像头', category: '摄像头', warehouse_id: 'WH01', status: 'in_stock', bound_order_id: null, inbound_batch: 'BATCH-2024-013', inbound_date: t(-1) },
    { code: 'P014', name: 'MacBook Pro 14 电池', category: '电池', warehouse_id: 'WH02', status: 'in_stock', bound_order_id: null, inbound_batch: 'BATCH-2024-014', inbound_date: t(-1) },
    { code: 'P015', name: 'Huawei MatePad 电池', category: '电池', warehouse_id: 'WH03', status: 'in_stock', bound_order_id: null, inbound_batch: 'BATCH-2024-015', inbound_date: t(-1) },
    { code: 'P016', name: 'ThinkPad X1 硬盘', category: '硬盘', warehouse_id: 'WH01', status: 'in_stock', bound_order_id: null, inbound_batch: 'BATCH-2024-016', inbound_date: t(0) },
  ]
  parts.forEach(p => insertPart.run(p.code, p.name, p.category, p.warehouse_id, p.status, p.bound_order_id, p.inbound_batch, p.inbound_date))

  const insertOrderPart = db.prepare(`INSERT INTO order_parts (id, order_id, part_code, quantity) VALUES (?, ?, ?, ?)`)
  const orderParts = [
    { id: 'OP01', order_id: 'ORD001', part_code: 'P001', quantity: 1 },
    { id: 'OP02', order_id: 'ORD002', part_code: 'P003', quantity: 1 },
    { id: 'OP03', order_id: 'ORD003', part_code: 'P007', quantity: 1 },
    { id: 'OP04', order_id: 'ORD005', part_code: 'P006', quantity: 1 },
    { id: 'OP05', order_id: 'ORD007', part_code: 'P008', quantity: 1 },
    { id: 'OP06', order_id: 'ORD008', part_code: 'P009', quantity: 1 },
  ]
  orderParts.forEach(op => insertOrderPart.run(op.id, op.order_id, op.part_code, op.quantity))

  const insertEscrow = db.prepare(`INSERT INTO escrows (id, order_id, amount, status, frozen_at, released_at) VALUES (?, ?, ?, ?, ?, ?)`)
  const escrows = [
    { id: 'ESC01', order_id: 'ORD001', amount: 1500, status: 'released', frozen_at: t(-7, 9), released_at: t(-7, 14) },
    { id: 'ESC02', order_id: 'ORD002', amount: 1500, status: 'frozen', frozen_at: t(-1, 10), released_at: null },
    { id: 'ESC03', order_id: 'ORD003', amount: 900, status: 'frozen', frozen_at: t(-2, 8), released_at: null },
    { id: 'ESC04', order_id: 'ORD005', amount: 350, status: 'frozen', frozen_at: t(0, 13), released_at: null },
    { id: 'ESC05', order_id: 'ORD006', amount: 120, status: 'frozen', frozen_at: t(0, 14), released_at: null },
    { id: 'ESC06', order_id: 'ORD007', amount: 1800, status: 'disputed', frozen_at: t(-5, 7), released_at: null },
    { id: 'ESC07', order_id: 'ORD008', amount: 700, status: 'released', frozen_at: t(-10, 9), released_at: t(-10, 13) },
  ]
  escrows.forEach(e => insertEscrow.run(e.id, e.order_id, e.amount, e.status, e.frozen_at, e.released_at))

  const insertVideo = db.prepare(`INSERT INTO video_records (id, order_id, url, duration, recorded_at) VALUES (?, ?, ?, ?, ?)`)
  const videos = [
    { id: 'VID01', order_id: 'ORD001', url: 'https://storage.example.com/videos/ORD001_repair.mp4', duration: 3600, recorded_at: t(-7, 10, 15) },
    { id: 'VID02', order_id: 'ORD002', url: 'https://storage.example.com/videos/ORD002_repair.mp4', duration: 2400, recorded_at: t(-1, 11, 10) },
    { id: 'VID03', order_id: 'ORD003', url: 'https://storage.example.com/videos/ORD003_repair.mp4', duration: 1800, recorded_at: t(-2, 9, 30) },
    { id: 'VID04', order_id: 'ORD007', url: 'https://storage.example.com/videos/ORD007_repair.mp4', duration: 7200, recorded_at: t(-5, 8, 30) },
    { id: 'VID05', order_id: 'ORD008', url: 'https://storage.example.com/videos/ORD008_repair.mp4', duration: 2700, recorded_at: t(-10, 10, 15) },
  ]
  videos.forEach(v => insertVideo.run(v.id, v.order_id, v.url, v.duration, v.recorded_at))

  const insertComplaint = db.prepare(`INSERT INTO complaints (id, order_id, consumer_id, type, priority, status, description, result, compensation, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  const complaints = [
    { id: 'CMP01', order_id: 'ORD007', consumer_id: 'U001', type: 'quality', priority: 'high', status: 'investigating', description: 'ThinkPad X1 维修后仍然频繁蓝屏，维修质量不达标', result: null, compensation: null, created_at: t(-5, 15), updated_at: t(-4, 10) },
    { id: 'CMP02', order_id: 'ORD003', consumer_id: 'U002', type: 'price', priority: 'medium', status: 'accepted', description: '维修费用高于估价范围，认为定价不合理', result: null, compensation: null, created_at: t(-2, 11), updated_at: t(-2, 14) },
    { id: 'CMP03', order_id: 'ORD001', consumer_id: 'U001', type: 'service', priority: 'low', status: 'resolved', description: '技师迟到15分钟，但维修结果满意', result: '已向用户致歉并补偿优惠券', compensation: 50, created_at: t(-7, 14, 30), updated_at: t(-6, 10) },
  ]
  complaints.forEach(c => insertComplaint.run(c.id, c.order_id, c.consumer_id, c.type, c.priority, c.status, c.description, c.result, c.compensation, c.created_at, c.updated_at))

  const insertComplaintTimeline = db.prepare(`INSERT INTO complaint_timeline (id, complaint_id, action, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
  const complaintTimelines = [
    { id: 'CTL01', complaint_id: 'CMP01', action: 'submitted', operator_id: 'U001', note: '用户提交投诉', created_at: t(-5, 15) },
    { id: 'CTL02', complaint_id: 'CMP01', action: 'accepted', operator_id: 'U999', note: '管理员已受理', created_at: t(-5, 16) },
    { id: 'CTL03', complaint_id: 'CMP01', action: 'investigating', operator_id: 'U999', note: '正在调查维修质量', created_at: t(-4, 10) },

    { id: 'CTL04', complaint_id: 'CMP02', action: 'submitted', operator_id: 'U002', note: '用户提交投诉', created_at: t(-2, 11) },
    { id: 'CTL05', complaint_id: 'CMP02', action: 'accepted', operator_id: 'U999', note: '管理员已受理，核实定价', created_at: t(-2, 14) },

    { id: 'CTL06', complaint_id: 'CMP03', action: 'submitted', operator_id: 'U001', note: '用户提交投诉', created_at: t(-7, 14, 30) },
    { id: 'CTL07', complaint_id: 'CMP03', action: 'accepted', operator_id: 'U999', note: '管理员已受理', created_at: t(-7, 16) },
    { id: 'CTL08', complaint_id: 'CMP03', action: 'resolved', operator_id: 'U999', note: '已向用户致歉并补偿50元优惠券', created_at: t(-6, 10) },
  ]
  complaintTimelines.forEach(ctl => insertComplaintTimeline.run(ctl.id, ctl.complaint_id, ctl.action, ctl.operator_id, ctl.note, ctl.created_at))
}

initDatabase()

export default db
