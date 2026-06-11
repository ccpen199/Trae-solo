import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const db = new Database(path.join(__dirname, 'data.db'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('street','community','property','building')),
    parent_id INTEGER,
    address TEXT,
    contact_phone TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (parent_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    permissions TEXT NOT NULL DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    avatar TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','disabled')),
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('gate','door','elevator','parking')),
    status TEXT NOT NULL DEFAULT 'online' CHECK(status IN ('online','offline','maintenance')),
    location TEXT,
    organization_id INTEGER NOT NULL,
    sn TEXT,
    firmware_version TEXT,
    last_heartbeat TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS access_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    device_id INTEGER NOT NULL,
    mode TEXT NOT NULL CHECK(mode IN ('bluetooth','nfc','qrcode','face')),
    direction TEXT DEFAULT 'in' CHECK(direction IN ('in','out')),
    success INTEGER DEFAULT 1,
    visitor_code TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (device_id) REFERENCES devices(id)
  );

  CREATE TABLE IF NOT EXISTS repair_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    urgency TEXT DEFAULT 'normal' CHECK(urgency IN ('urgent','high','normal','low')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','assigned','processing','feedback','completed','closed')),
    reporter_id INTEGER NOT NULL,
    assignee_id INTEGER,
    organization_id INTEGER NOT NULL,
    images TEXT,
    location TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (assignee_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS repair_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    images TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (order_id) REFERENCES repair_orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS repair_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (order_id) REFERENCES repair_orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    category TEXT DEFAULT 'general',
    review_status TEXT DEFAULT 'pending' CHECK(review_status IN ('pending','approved','rejected')),
    reviewer_id INTEGER,
    review_comment TEXT,
    images TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (author_id) REFERENCES users(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('property_fee','water','electricity','parking','other')),
    amount REAL NOT NULL,
    status TEXT DEFAULT 'unpaid' CHECK(status IN ('unpaid','paid','overdue')),
    period TEXT,
    due_date TEXT,
    paid_at TEXT,
    description TEXT,
    organization_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
  );

  CREATE TABLE IF NOT EXISTS payment_receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id INTEGER NOT NULL UNIQUE,
    receipt_no TEXT NOT NULL UNIQUE,
    amount REAL NOT NULL,
    paid_at TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (payment_id) REFERENCES payments(id)
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('urgent','high','normal','low')),
    target_scope TEXT DEFAULT '{}',
    status TEXT DEFAULT 'published' CHECK(status IN ('draft','published','archived')),
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (author_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS announcement_reads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    announcement_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    read_at TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(announcement_id, user_id),
    FOREIGN KEY (announcement_id) REFERENCES announcements(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS device_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    level TEXT NOT NULL CHECK(level IN ('critical','important','normal')),
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','processing','resolved')),
    handler_id INTEGER,
    handled_at TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (device_id) REFERENCES devices(id),
    FOREIGN KEY (handler_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS offline_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    payload TEXT NOT NULL,
    synced INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    synced_at TEXT,
    FOREIGN KEY (device_id) REFERENCES devices(id)
  );
`)

const countOrg = db.prepare('SELECT COUNT(*) as c FROM organizations').get() as { c: number }
if (countOrg.c === 0) {
  const insertOrg = db.prepare('INSERT INTO organizations (name, type, parent_id, address, contact_phone) VALUES (?,?,?,?,?)')
  const streetId = insertOrg.run('幸福街道', 'street', null, '幸福路1号', '0571-88000001').lastInsertRowid
  const communityId = insertOrg.run('阳光社区', 'community', streetId, '幸福路88号', '0571-88000002').lastInsertRowid
  const propertyId = insertOrg.run('阳光物业', 'property', communityId, '幸福路88号1楼', '0571-88000003').lastInsertRowid
  const buildingA = insertOrg.run('A栋', 'building', propertyId, '幸福路88号A栋', null).lastInsertRowid
  const buildingB = insertOrg.run('B栋', 'building', propertyId, '幸福路88号B栋', null).lastInsertRowid
  const buildingC = insertOrg.run('C栋', 'building', propertyId, '幸福路88号C栋', null).lastInsertRowid

  const insertRole = db.prepare('INSERT INTO roles (name, display_name, permissions) VALUES (?,?,?)')
  insertRole.run('street_admin', '街道管理员', JSON.stringify({
    organizations: true, roles: true, users: true, devices: true,
    access_records: true, repair_orders: true, community_posts: true,
    payments: true, announcements: true, reports: true, alerts: true
  }))
  insertRole.run('community_admin', '社区管理员', JSON.stringify({
    organizations: true, users: true, devices: true, access_records: true,
    repair_orders: true, community_posts: true, payments: true,
    announcements: true, reports: true, alerts: true
  }))
  insertRole.run('property_admin', '物业管理员', JSON.stringify({
    organizations: true, users: true, devices: true, access_records: true,
    repair_orders: true, community_posts: true, payments: true,
    announcements: true, alerts: true
  }))
  insertRole.run('owner_committee', '业委会成员', JSON.stringify({
    community_posts: true, repair_orders: true, payments: true,
    announcements: true, devices: ['read'], reports: ['read']
  }))
  insertRole.run('owner', '业主', JSON.stringify({
    community_posts: ['read', 'create'], repair_orders: ['read', 'create'],
    payments: ['read'], announcements: ['read']
  }))

  const hashedPw = bcrypt.hashSync('123456', 10)
  const insertUser = db.prepare('INSERT INTO users (phone, password, name, role_id, organization_id) VALUES (?,?,?,?,?)')
  insertUser.run('13800000001', hashedPw, '张街道', 1, streetId)
  insertUser.run('13800000002', hashedPw, '李社区', 2, communityId)
  insertUser.run('13800000003', hashedPw, '王物业', 3, propertyId)
  insertUser.run('13800000004', hashedPw, '赵业委', 4, communityId)
  insertUser.run('13800000005', hashedPw, '刘业主', 5, buildingA)
  insertUser.run('13800000006', hashedPw, '陈业主', 5, buildingB)
  insertUser.run('13800000007', hashedPw, '孙业主', 5, buildingC)
  insertUser.run('13800000008', hashedPw, '周维修', 3, propertyId)

  const insertDevice = db.prepare('INSERT INTO devices (name, type, status, location, organization_id, sn, firmware_version, last_heartbeat) VALUES (?,?,?,?,?,?,?,?)')
  const d1 = insertDevice.run('A栋大门', 'gate', 'online', 'A栋1楼入口', buildingA, 'SN-G001', 'v2.1.0', '2026-06-10 08:00:00').lastInsertRowid
  const d2 = insertDevice.run('B栋单元门', 'door', 'online', 'B栋1楼入口', buildingB, 'SN-D001', 'v2.0.3', '2026-06-10 07:58:00').lastInsertRowid
  const d3 = insertDevice.run('A栋电梯', 'elevator', 'maintenance', 'A栋', buildingA, 'SN-E001', 'v1.8.2', '2026-06-09 22:00:00').lastInsertRowid
  const d4 = insertDevice.run('地下车库闸机', 'parking', 'online', '地下一层', propertyId, 'SN-P001', 'v2.1.0', '2026-06-10 08:01:00').lastInsertRowid
  const d5 = insertDevice.run('C栋单元门', 'door', 'offline', 'C栋1楼入口', buildingC, 'SN-D002', 'v2.0.1', '2026-06-08 15:30:00').lastInsertRowid
  const d6 = insertDevice.run('B栋电梯', 'elevator', 'online', 'B栋', buildingB, 'SN-E002', 'v1.8.5', '2026-06-10 07:55:00').lastInsertRowid

  const now = '2026-06-10'
  const insertAccess = db.prepare('INSERT INTO access_records (user_id, device_id, mode, direction, success, visitor_code, created_at) VALUES (?,?,?,?,?,?,?)')
  insertAccess.run(5, d1, 'face', 'in', 1, null, `${now} 07:30:00`)
  insertAccess.run(6, d2, 'bluetooth', 'in', 1, null, `${now} 07:45:00`)
  insertAccess.run(5, d1, 'nfc', 'out', 1, null, `${now} 08:00:00`)
  insertAccess.run(7, d5, 'qrcode', 'in', 0, null, `${now} 08:10:00`)
  insertAccess.run(3, d4, 'face', 'in', 1, null, `${now} 08:15:00`)
  insertAccess.run(5, d4, 'bluetooth', 'in', 1, null, `${now} 08:20:00`)
  insertAccess.run(6, d2, 'nfc', 'out', 1, null, `${now} 09:00:00`)
  insertAccess.run(null, d1, 'qrcode', 'in', 1, 'VC20260610001', `${now} 09:10:00`)
  insertAccess.run(5, d1, 'face', 'in', 1, null, `${now} 17:30:00`)
  insertAccess.run(7, d5, 'bluetooth', 'in', 1, null, `${now} 17:45:00`)
  insertAccess.run(6, d4, 'nfc', 'out', 1, null, `${now} 18:00:00`)
  insertAccess.run(null, d2, 'qrcode', 'in', 1, 'VC20260610002', `${now} 14:00:00`)
  insertAccess.run(5, d1, 'nfc', 'in', 1, null, `${now} 07:35:00`)
  insertAccess.run(6, d6, 'bluetooth', 'in', 1, null, `${now} 07:50:00`)
  insertAccess.run(7, d5, 'face', 'out', 0, null, `${now} 18:30:00`)
  insertAccess.run(5, d4, 'bluetooth', 'out', 1, null, `${now} 19:00:00`)
  insertAccess.run(null, d4, 'qrcode', 'in', 1, 'VC20260610003', `${now} 10:00:00`)
  insertAccess.run(6, d2, 'nfc', 'in', 1, null, `${now} 19:30:00`)
  insertAccess.run(5, d1, 'face', 'out', 1, null, `${now} 20:00:00`)
  insertAccess.run(3, d4, 'bluetooth', 'out', 1, null, `${now} 20:30:00`)

  const insertRepair = db.prepare(`INSERT INTO repair_orders (order_no, title, description, category, urgency, status, reporter_id, assignee_id, organization_id, images, location, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
  const r1 = insertRepair.run('WX20260601001', 'A栋电梯故障', '电梯运行中异常抖动，有安全隐患', 'elevator', 'urgent', 'completed', 5, 8, propertyId, null, 'A栋电梯', '2026-06-01 09:00:00', '2026-06-03 16:00:00').lastInsertRowid
  const r2 = insertRepair.run('WX20260602001', 'B栋楼道灯不亮', '3楼楼道灯已坏一周', 'electrical', 'normal', 'processing', 6, 8, propertyId, null, 'B栋3楼', '2026-06-02 10:00:00', '2026-06-05 14:00:00').lastInsertRowid
  const r3 = insertRepair.run('WX20260605001', '地下车库漏水', '地下一层B区天花板渗水', 'plumbing', 'high', 'assigned', 7, 8, propertyId, null, '地下一层B区', '2026-06-05 08:00:00', '2026-06-06 09:00:00').lastInsertRowid
  const r4 = insertRepair.run('WX20260608001', 'C栋门禁失灵', 'C栋单元门无法正常开关', 'access', 'high', 'pending', 7, null, propertyId, null, 'C栋1楼入口', '2026-06-08 11:00:00', '2026-06-08 11:00:00').lastInsertRowid
  const r5 = insertRepair.run('WX20260609001', 'A栋外墙脱落', 'A栋北侧外墙瓷砖有脱落风险', 'structural', 'urgent', 'feedback', 5, 8, propertyId, null, 'A栋北侧', '2026-06-09 07:00:00', '2026-06-10 08:00:00').lastInsertRowid

  const insertFeedback = db.prepare('INSERT INTO repair_feedback (order_id, user_id, content, images, created_at) VALUES (?,?,?,?,?)')
  insertFeedback.run(r1, 8, '已检查电梯主控板，发现接触不良，已更换', null, '2026-06-02 10:00:00')
  insertFeedback.run(r1, 8, '更换完成，试运行正常', null, '2026-06-03 15:00:00')
  insertFeedback.run(r2, 8, '已采购灯管，预计明日更换', null, '2026-06-05 14:00:00')
  insertFeedback.run(r5, 8, '已搭建防护脚手架，等待外墙维修', null, '2026-06-10 08:00:00')

  const insertEval = db.prepare('INSERT INTO repair_evaluations (order_id, user_id, rating, comment, created_at) VALUES (?,?,?,?,?)')
  insertEval.run(r1, 5, 5, '维修及时，非常满意', '2026-06-03 18:00:00')

  const insertPost = db.prepare('INSERT INTO community_posts (title, content, author_id, category, review_status, reviewer_id, review_comment, images, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
  insertPost.run('小区绿化建议', '建议在A栋和B栋之间增加绿化带，改善居住环境', 5, 'suggestion', 'approved', 2, '建议已采纳', null, '2026-06-01 10:00:00', '2026-06-02 09:00:00')
  insertPost.run('停车位管理讨论', '当前停车位紧张，建议优化分配方案', 4, 'discussion', 'approved', 2, '已纳入议程', null, '2026-06-03 14:00:00', '2026-06-04 10:00:00')
  insertPost.run('物业费调整提案', '建议调整物业费标准，增加公共区域维护预算', 4, 'proposal', 'pending', null, null, null, '2026-06-05 09:00:00', '2026-06-05 09:00:00')
  insertPost.run('晚间健身活动', '提议每周三晚上组织社区健身活动', 6, 'activity', 'approved', 3, '好提议，物业可提供场地', null, '2026-06-06 16:00:00', '2026-06-07 11:00:00')
  insertPost.run('噪音投诉', '近期B栋夜间施工噪音过大，严重影响休息', 7, 'complaint', 'rejected', 3, '已核实为紧急维修，已要求控制施工时间', null, '2026-06-08 22:00:00', '2026-06-09 08:00:00')

  const insertPayment = db.prepare('INSERT INTO payments (user_id, type, amount, status, period, due_date, paid_at, description, organization_id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
  const p1 = insertPayment.run(5, 'property_fee', 2800, 'paid', '2026-06', '2026-06-30', '2026-06-05 10:00:00', '6月物业费', propertyId, '2026-06-01 00:00:00', '2026-06-05 10:00:00').lastInsertRowid
  insertPayment.run(5, 'water', 85.5, 'paid', '2026-05', '2026-06-15', '2026-06-03 14:00:00', '5月水费', propertyId, '2026-06-01 00:00:00', '2026-06-03 14:00:00')
  insertPayment.run(5, 'electricity', 210, 'unpaid', '2026-05', '2026-06-15', null, '5月电费', propertyId, '2026-06-01 00:00:00', '2026-06-01 00:00:00')
  insertPayment.run(6, 'property_fee', 3200, 'unpaid', '2026-06', '2026-06-30', null, '6月物业费', propertyId, '2026-06-01 00:00:00', '2026-06-01 00:00:00')
  insertPayment.run(6, 'parking', 400, 'paid', '2026-06', '2026-06-30', '2026-06-01 09:00:00', '6月停车费', propertyId, '2026-06-01 00:00:00', '2026-06-01 09:00:00')
  insertPayment.run(7, 'property_fee', 2600, 'overdue', '2026-05', '2026-05-31', null, '5月物业费', propertyId, '2026-05-01 00:00:00', '2026-06-01 00:00:00')
  insertPayment.run(7, 'water', 92, 'unpaid', '2026-05', '2026-06-15', null, '5月水费', propertyId, '2026-06-01 00:00:00', '2026-06-01 00:00:00')
  insertPayment.run(5, 'parking', 400, 'unpaid', '2026-06', '2026-06-30', null, '6月停车费', propertyId, '2026-06-01 00:00:00', '2026-06-01 00:00:00')
  insertPayment.run(6, 'electricity', 185, 'overdue', '2026-04', '2026-04-30', null, '4月电费', propertyId, '2026-04-01 00:00:00', '2026-05-01 00:00:00')
  insertPayment.run(7, 'other', 50, 'unpaid', '2026-06', '2026-06-30', null, '垃圾处理费', propertyId, '2026-06-01 00:00:00', '2026-06-01 00:00:00')

  const insertReceipt = db.prepare('INSERT INTO payment_receipts (payment_id, receipt_no, amount, paid_at, created_at) VALUES (?,?,?,?,?)')
  insertReceipt.run(p1, 'RCP20260605001', 2800, '2026-06-05 10:00:00', '2026-06-05 10:00:00')

  const insertAnnouncement = db.prepare('INSERT INTO announcements (title, content, author_id, priority, target_scope, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)')
  insertAnnouncement.run('关于电梯维修的通知', 'A栋电梯将于6月15日进行年度检修，届时暂停使用一天', 3, 'urgent', JSON.stringify({ org_ids: [buildingA] }), 'published', '2026-06-08 09:00:00', '2026-06-08 09:00:00')
  insertAnnouncement.run('端午节放假安排', '端午节期间物业值班安排：6月9日-10日正常值班', 3, 'normal', JSON.stringify({ org_ids: [propertyId, buildingA, buildingB, buildingC] }), 'published', '2026-06-06 10:00:00', '2026-06-06 10:00:00')
  insertAnnouncement.run('物业费缴纳提醒', '请各位业主于月底前缴纳本月物业费', 3, 'high', JSON.stringify({ org_ids: [buildingA, buildingB, buildingC] }), 'published', '2026-06-01 08:00:00', '2026-06-01 08:00:00')
  insertAnnouncement.run('社区文化活动报名', '本周六社区将举办文化活动，欢迎报名参加', 2, 'normal', JSON.stringify({ org_ids: [communityId] }), 'published', '2026-06-04 14:00:00', '2026-06-04 14:00:00')
  insertAnnouncement.run('防汛安全提示', '进入汛期，请注意关好门窗，避免财产损失', 1, 'high', JSON.stringify({ org_ids: [streetId] }), 'published', '2026-06-02 08:00:00', '2026-06-02 08:00:00')

  const insertAlert = db.prepare('INSERT INTO device_alerts (device_id, level, type, message, status, handler_id, handled_at, created_at) VALUES (?,?,?,?,?,?,?,?)')
  insertAlert.run(d3, 'critical', 'malfunction', '电梯主控板异常，需紧急检修', 'resolved', 8, '2026-06-02 10:00:00', '2026-06-01 08:00:00')
  insertAlert.run(d5, 'critical', 'offline', '设备离线超过24小时', 'active', null, null, '2026-06-08 16:00:00')
  insertAlert.run(d3, 'important', 'maintenance', '电梯已达维保周期', 'processing', 8, null, '2026-06-09 09:00:00')
  insertAlert.run(d1, 'normal', 'battery', '门禁备用电池电量低于30%', 'active', null, null, '2026-06-10 06:00:00')
  insertAlert.run(d4, 'normal', 'traffic', '车流量异常，超过阈值', 'active', null, null, '2026-06-10 07:30:00')

  const insertCache = db.prepare('INSERT INTO offline_cache (device_id, action, payload, synced, created_at, synced_at) VALUES (?,?,?,?,?,?)')
  insertCache.run(d5, 'access_log', JSON.stringify({ user_id: 7, mode: 'bluetooth', time: '2026-06-08 15:00:00' }), 0, '2026-06-08 15:00:00', null)
  insertCache.run(d5, 'heartbeat', JSON.stringify({ status: 'offline', time: '2026-06-08 15:30:00' }), 0, '2026-06-08 15:30:00', null)
  insertCache.run(d3, 'access_log', JSON.stringify({ user_id: 5, mode: 'nfc', time: '2026-06-09 21:00:00' }), 1, '2026-06-09 21:00:00', '2026-06-09 22:00:00')
}

export default db
