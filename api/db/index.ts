import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { hashPassword, encryptAES256 } from '../utils/encryption.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_DIR = path.resolve(__dirname, '../../data')
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

const DB_PATH = path.join(DB_DIR, 'postal_regulatory.db')

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function createTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS outlets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      region_id TEXT NOT NULL,
      address TEXT,
      contact_phone TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      real_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('courier', 'outlet_admin', 'regional_supervisor', 'head_auditor')),
      outlet_id TEXT REFERENCES outlets(id),
      region_id TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS waybills (
      id TEXT PRIMARY KEY,
      tracking_no TEXT UNIQUE NOT NULL,
      regulatory_code TEXT UNIQUE NOT NULL,
      sender_name_enc TEXT NOT NULL,
      sender_phone_enc TEXT NOT NULL,
      sender_address_enc TEXT NOT NULL,
      sender_real_name_id TEXT,
      receiver_name_enc TEXT NOT NULL,
      receiver_phone_enc TEXT NOT NULL,
      receiver_address_enc TEXT NOT NULL,
      items_json_enc TEXT NOT NULL,
      weight REAL NOT NULL,
      volume REAL,
      freight REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'synced', 'pending_sync')),
      courier_id TEXT REFERENCES users(id),
      outlet_id TEXT REFERENCES outlets(id),
      qr_code TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS real_name_records (
      id TEXT PRIMARY KEY,
      encrypted_real_name_id TEXT UNIQUE NOT NULL,
      name_hash TEXT NOT NULL,
      id_number_hash TEXT NOT NULL,
      face_feature_hash TEXT,
      verified_source TEXT NOT NULL,
      verified_at TEXT NOT NULL DEFAULT (datetime('now')),
      user_id TEXT REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS exception_records (
      id TEXT PRIMARY KEY,
      waybill_id TEXT REFERENCES waybills(id),
      type TEXT NOT NULL CHECK (type IN ('id_suspicious', 'address_ambiguous', 'prohibited_item', 'liveness_failed')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'rejected')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
      description TEXT,
      handler_id TEXT REFERENCES users(id),
      review_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      operation_type TEXT NOT NULL,
      operation_desc TEXT NOT NULL,
      detail_json TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS login_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      username TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
      ip TEXT,
      location TEXT,
      device TEXT,
      fail_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS regulatory_orders (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal', 'low')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'submitted', 'approved', 'rejected')),
      deadline TEXT NOT NULL,
      issuer_id TEXT REFERENCES users(id),
      target_outlet_ids TEXT NOT NULL,
      feedback_content_enc TEXT,
      feedback_attachments TEXT,
      feedback_submitted_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_waybills_courier ON waybills(courier_id);
    CREATE INDEX IF NOT EXISTS idx_waybills_outlet ON waybills(outlet_id);
    CREATE INDEX IF NOT EXISTS idx_waybills_status ON waybills(status);
    CREATE INDEX IF NOT EXISTS idx_waybills_created ON waybills(created_at);
    CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exception_records(status);
    CREATE INDEX IF NOT EXISTS idx_exceptions_type ON exception_records(type);
    CREATE INDEX IF NOT EXISTS idx_exceptions_priority ON exception_records(priority);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_type ON audit_logs(operation_type);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_login_logs_status ON login_logs(status);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_outlet ON users(outlet_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON regulatory_orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_priority ON regulatory_orders(priority);
  `)
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function seedMockData(): void {
  const outletCount = db.prepare('SELECT COUNT(*) as count FROM outlets').get() as { count: number }
  if (outletCount.count > 0) {
    return
  }

  const passwordHash = hashPassword('123456')

  const insertOutlet = db.prepare(
    'INSERT INTO outlets (id, name, region_id, address, contact_phone) VALUES (?, ?, ?, ?, ?)'
  )
  const insertUser = db.prepare(
    'INSERT INTO users (id, username, password_hash, real_name, role, outlet_id, region_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )

  const outlet1Id = generateId()
  const outlet2Id = generateId()
  const outlet3Id = generateId()

  insertOutlet.run(outlet1Id, '朝阳区望京网点', 'region_beijing', '北京市朝阳区望京街道阜通东大街6号', '010-88880001')
  insertOutlet.run(outlet2Id, '海淀区中关村网点', 'region_beijing', '北京市海淀区中关村大街27号', '010-88880002')
  insertOutlet.run(outlet3Id, '东城区王府井网点', 'region_beijing', '北京市东城区王府井大街138号', '010-88880003')

  insertUser.run(generateId(), 'courier01', passwordHash, '张快递', 'courier', outlet1Id, 'region_beijing', 'active')
  insertUser.run(generateId(), 'courier02', passwordHash, '李速递', 'courier', outlet1Id, 'region_beijing', 'active')
  insertUser.run(generateId(), 'courier03', passwordHash, '王配送', 'courier', outlet2Id, 'region_beijing', 'active')
  insertUser.run(generateId(), 'courier04', passwordHash, '赵物流', 'courier', outlet3Id, 'region_beijing', 'active')

  insertUser.run(generateId(), 'outlet_admin01', passwordHash, '孙主任', 'outlet_admin', outlet1Id, 'region_beijing', 'active')
  insertUser.run(generateId(), 'outlet_admin02', passwordHash, '周经理', 'outlet_admin', outlet2Id, 'region_beijing', 'active')

  insertUser.run(generateId(), 'regional01', passwordHash, '吴监管', 'regional_supervisor', null, 'region_beijing', 'active')

  insertUser.run(generateId(), 'auditor01', passwordHash, '郑审计', 'head_auditor', null, 'all', 'active')

  const insertWaybill = db.prepare(
    `INSERT INTO waybills (
      id, tracking_no, regulatory_code,
      sender_name_enc, sender_phone_enc, sender_address_enc, sender_real_name_id,
      receiver_name_enc, receiver_phone_enc, receiver_address_enc,
      items_json_enc, weight, volume, freight,
      status, courier_id, outlet_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const now = new Date().toISOString()
  for (let i = 1; i <= 5; i++) {
    const waybillId = generateId()
    const trackingNo = 'SF' + String(100000000000 + i)
    const regulatoryCode = 'REG' + Date.now() + String(i).padStart(4, '0')
    const itemsJson = JSON.stringify([{ category: '日用品', name: '洗发水', quantity: 2, declaredValue: 50, isProhibited: false }])

    insertWaybill.run(
      waybillId,
      trackingNo,
      regulatoryCode,
      encryptAES256('寄件人' + i),
      encryptAES256('1380000000' + i),
      encryptAES256('北京市朝阳区望京街道寄件地址' + i),
      encryptAES256('RN' + i),
      encryptAES256('收件人' + i),
      encryptAES256('1390000000' + i),
      encryptAES256('北京市海淀区中关村大街收件地址' + i),
      encryptAES256(itemsJson),
      1.5 + i * 0.5,
      0.01 + i * 0.005,
      12 + i * 2,
      i % 3 === 0 ? 'synced' : i % 3 === 1 ? 'created' : 'pending_sync',
      'courier01',
      outlet1Id,
      now
    )
  }

  const insertException = db.prepare(
    `INSERT INTO exception_records (
      id, waybill_id, type, status, priority, description, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  )

  const waybillRows = db.prepare('SELECT id FROM waybills LIMIT 3').all() as Array<{ id: string }>
  if (waybillRows.length >= 3) {
    insertException.run(generateId(), waybillRows[0].id, 'id_suspicious', 'pending', 'high', '身份证照片模糊，疑似伪造证件', now)
    insertException.run(generateId(), waybillRows[1].id, 'address_ambiguous', 'reviewing', 'medium', '收件地址信息不完整，缺少门牌号', now)
    insertException.run(generateId(), waybillRows[2].id, 'prohibited_item', 'pending', 'high', 'X光安检疑似发现锂电池类禁寄物品', now)
  }

  const insertOrder = db.prepare(
    `INSERT INTO regulatory_orders (
      id, title, content, priority, status, deadline, issuer_id, target_outlet_ids, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  insertOrder.run(
    generateId(),
    '关于开展2024年第二季度实名寄递专项检查的通知',
    '根据国家邮政局要求，请各网点于本季度末前完成实名寄递自查工作，重点检查身份证核验流程落实情况，确保100%实名收寄。',
    'urgent',
    'pending',
    deadline,
    'auditor01',
    JSON.stringify([outlet1Id, outlet2Id, outlet3Id]),
    now
  )

  console.log('[DB] Mock data initialized successfully')
}

export function initDatabase(): void {
  createTables()
  seedMockData()
  console.log('[DB] Database initialized successfully at', DB_PATH)
}

export default db
