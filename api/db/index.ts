import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const DB_PATH = process.env.DB_PATH || './data/app.sqlite'
const resolvedDbPath = path.resolve(process.cwd(), DB_PATH)

const dbDir = path.dirname(resolvedDbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(resolvedDbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export interface User {
  id: number
  username: string
  password_hash: string
  name: string
  id_card: string
  phone: string
  role: string
  avatar?: string
  status: string
  created_at: string
  updated_at: string
}

export interface PermitApplication {
  id: number
  user_id: number
  plate_number: string
  vehicle_type: string
  owner_name: string
  owner_id_card: string
  enter_date: string
  leave_date: string
  purpose: string
  destination: string
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'verified'
  permit_number?: string
  verified_at?: string
  reject_reason?: string
  created_at: string
  updated_at: string
}

export interface ViolationReport {
  id: number
  reporter_id: number
  plate_number: string
  violation_type: string
  violation_time: string
  location: string
  description: string
  evidence_files: string
  evidence_hash: string
  status: 'pending' | 'processing' | 'verified' | 'rejected'
  handler_id?: number
  result?: string
  created_at: string
  updated_at: string
}

export interface AccidentRecord {
  id: number
  reporter_id: number
  accident_time: string
  location: string
  description: string
  involved_parties: string
  evidence_files: string
  liability_result?: string
  status: 'pending' | 'negotiating' | 'confirmed' | 'closed'
  negotiation_messages: string
  created_at: string
  updated_at: string
}

export interface EbikeRegistration {
  id: number
  owner_id: number
  owner_name: string
  owner_id_card: string
  phone: string
  brand: string
  model: string
  frame_number: string
  motor_number: string
  purchase_date: string
  invoice_number: string
  license_plate?: string
  license_number?: string
  status: 'pending' | 'approved' | 'rejected'
  reject_reason?: string
  created_at: string
  updated_at: string
}

export interface AppointmentWindow {
  id: number
  business_type: string
  date: string
  start_time: string
  end_time: string
  max_capacity: number
  current_count: number
  status: 'available' | 'full' | 'closed'
}

export interface Appointment {
  id: number
  user_id: number
  window_id: number
  business_type: string
  appointment_date: string
  appointment_time: string
  queue_number: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  rating?: number
  comment?: string
  created_at: string
}

export interface ChatHistory {
  id: number
  user_id: number
  session_id: string
  question: string
  answer: string
  source_docs: string
  created_at: string
}

export interface WorkflowTask {
  id: number
  business_type: string
  business_id: number
  title: string
  applicant_id: number
  current_auditor_id?: number
  current_level: number
  total_levels: number
  status: 'pending' | 'approved' | 'rejected'
  audit_history: string
  created_at: string
  updated_at: string
}

export interface Certificate {
  id: number
  user_id: number
  cert_type: string
  cert_number: string
  holder_name: string
  holder_id_card: string
  issue_date: string
  expiry_date?: string
  status: 'valid' | 'expired' | 'revoked'
  verify_code: string
  created_at: string
}

export interface AuditRecord {
  id: number
  task_id: number
  auditor_id: number
  level: number
  action: 'approve' | 'reject'
  comment?: string
  created_at: string
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      id_card TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      avatar TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permit_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plate_number TEXT NOT NULL,
      vehicle_type TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      owner_id_card TEXT NOT NULL,
      enter_date TEXT NOT NULL,
      leave_date TEXT NOT NULL,
      purpose TEXT NOT NULL,
      destination TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      permit_number TEXT,
      verified_at TEXT,
      reject_reason TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS violation_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      plate_number TEXT NOT NULL,
      violation_type TEXT NOT NULL,
      violation_time TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      evidence_files TEXT NOT NULL,
      evidence_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      handler_id INTEGER,
      result TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (handler_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS accident_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      accident_time TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      involved_parties TEXT NOT NULL,
      evidence_files TEXT NOT NULL,
      liability_result TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      negotiation_messages TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ebike_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      owner_name TEXT NOT NULL,
      owner_id_card TEXT NOT NULL,
      phone TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      frame_number TEXT NOT NULL,
      motor_number TEXT NOT NULL,
      purchase_date TEXT NOT NULL,
      invoice_number TEXT NOT NULL,
      license_plate TEXT,
      license_number TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      reject_reason TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS appointment_windows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_type TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      max_capacity INTEGER NOT NULL DEFAULT 10,
      current_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'available',
      UNIQUE(business_type, date, start_time)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      window_id INTEGER NOT NULL,
      business_type TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      queue_number INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      rating INTEGER,
      comment TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (window_id) REFERENCES appointment_windows(id)
    );

    CREATE TABLE IF NOT EXISTS chat_histories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      session_id TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      source_docs TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workflow_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_type TEXT NOT NULL,
      business_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      applicant_id INTEGER NOT NULL,
      current_auditor_id INTEGER,
      current_level INTEGER NOT NULL DEFAULT 1,
      total_levels INTEGER NOT NULL DEFAULT 3,
      status TEXT NOT NULL DEFAULT 'pending',
      audit_history TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (applicant_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      auditor_id INTEGER NOT NULL,
      level INTEGER NOT NULL,
      action TEXT NOT NULL,
      comment TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES workflow_tasks(id),
      FOREIGN KEY (auditor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cert_type TEXT NOT NULL,
      cert_number TEXT UNIQUE NOT NULL,
      holder_name TEXT NOT NULL,
      holder_id_card TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      expiry_date TEXT,
      status TEXT NOT NULL DEFAULT 'valid',
      verify_code TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_permit_user_id ON permit_applications(user_id);
    CREATE INDEX IF NOT EXISTS idx_permit_status ON permit_applications(status);
    CREATE INDEX IF NOT EXISTS idx_permit_plate ON permit_applications(plate_number);
    CREATE INDEX IF NOT EXISTS idx_violation_reporter ON violation_reports(reporter_id);
    CREATE INDEX IF NOT EXISTS idx_violation_status ON violation_reports(status);
    CREATE INDEX IF NOT EXISTS idx_accident_reporter ON accident_records(reporter_id);
    CREATE INDEX IF NOT EXISTS idx_accident_status ON accident_records(status);
    CREATE INDEX IF NOT EXISTS idx_ebike_owner ON ebike_registrations(owner_id);
    CREATE INDEX IF NOT EXISTS idx_ebike_status ON ebike_registrations(status);
    CREATE INDEX IF NOT EXISTS idx_appointment_user ON appointments(user_id);
    CREATE INDEX IF NOT EXISTS idx_appointment_window ON appointments(window_id);
    CREATE INDEX IF NOT EXISTS idx_appointment_status ON appointments(status);
    CREATE INDEX IF NOT EXISTS idx_workflow_auditor ON workflow_tasks(current_auditor_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_status ON workflow_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_cert_user ON certificates(user_id);
    CREATE INDEX IF NOT EXISTS idx_cert_type ON certificates(cert_type);
    CREATE INDEX IF NOT EXISTS idx_cert_status ON certificates(status);
    CREATE INDEX IF NOT EXISTS idx_cert_number ON certificates(cert_number);
    CREATE INDEX IF NOT EXISTS idx_cert_verify ON certificates(verify_code);
  `)
}

initTables()

function initData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) {
    return
  }

  const passwordHash = '$2a$10$RUgCbAMlxOpvQRvh6sdgm.9UOLP8bTsJ.3Y/RBNhGuXKC5CtC0fQ.'

  db.prepare(`
    INSERT INTO users (username, password_hash, name, id_card, phone, role, avatar, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(
    'zhangsan',
    passwordHash,
    '张三',
    '110101199001011234',
    '13800138001',
    'user',
    null,
  )

  db.prepare(`
    INSERT INTO users (username, password_hash, name, id_card, phone, role, avatar, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(
    'lishenhe',
    passwordHash,
    '李审核',
    '110101198001011234',
    '13800138002',
    'auditor',
    null,
  )

  db.prepare(`
    INSERT INTO users (username, password_hash, name, id_card, phone, role, avatar, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
  `).run(
    'wangguanli',
    passwordHash,
    '王管理',
    '110101197001011234',
    '13800138003',
    'admin',
    null,
  )

  const today = new Date()
  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']
  const businessTypes = ['进京证办理', '电动车登记', '驾驶证业务', '机动车业务', '事故处理']

  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    
    for (const businessType of businessTypes) {
      for (const time of timeSlots) {
        const endTime = time.split(':')
        endTime[1] = String(parseInt(endTime[1]) + 30).padStart(2, '0')
        db.prepare(`
          INSERT INTO appointment_windows (business_type, date, start_time, end_time, max_capacity, current_count, status)
          VALUES (?, ?, ?, ?, ?, 0, 'available')
        `).run(
          businessType,
          dateStr,
          time,
          endTime.join(':'),
          10,
        )
      }
    }
  }

  for (let i = 1; i <= 5; i++) {
    db.prepare(`
      INSERT INTO permit_applications (user_id, plate_number, vehicle_type, owner_name, owner_id_card, enter_date, leave_date, purpose, destination, status, permit_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      1,
      `京A${String(10000 + i).padStart(5, '0')}`,
      i % 2 === 0 ? '小型轿车' : 'SUV',
      '张三',
      '110101199001011234',
      '2026-06-10',
      '2026-06-17',
      '商务出差',
      '北京市朝阳区',
      i % 3 === 0 ? 'approved' : i % 3 === 1 ? 'pending' : 'rejected',
      i % 3 === 0 ? `JJZ${Date.now()}${i}` : null,
    )
  }

  const violationTypes = ['闯红灯', '违停', '压线', '逆行', '超速', '不礼让行人']
  const locations = ['朝阳区建国路', '海淀区中关村大街', '东城区王府井大街', '西城区金融街', '丰台区南三环西路']

  for (let i = 1; i <= 5; i++) {
    db.prepare(`
      INSERT INTO violation_reports (reporter_id, plate_number, violation_type, violation_time, location, description, evidence_files, evidence_hash, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      1,
      `京B${String(20000 + i).padStart(5, '0')}`,
      violationTypes[i % violationTypes.length],
      new Date(Date.now() - i * 86400000).toISOString(),
      locations[i % locations.length],
      `在${locations[i % locations.length]}发现${violationTypes[i % violationTypes.length]}行为`,
      JSON.stringify([`/uploads/evidence/violation_${i}.jpg`]),
      `hash_${Date.now()}_${i}`,
      i % 3 === 0 ? 'verified' : i % 3 === 1 ? 'pending' : 'rejected',
    )
  }

  for (let i = 1; i <= 3; i++) {
    db.prepare(`
      INSERT INTO accident_records (reporter_id, accident_time, location, description, involved_parties, evidence_files, liability_result, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      1,
      new Date(Date.now() - i * 172800000).toISOString(),
      locations[i % locations.length],
      `${i}车追尾事故`,
      JSON.stringify([{ name: '张三', phone: '13800138001', plate: '京A12345' }, { name: '李四', phone: '13900139001', plate: '京B67890' }]),
      JSON.stringify([`/uploads/accident/accident_${i}_1.jpg`, `/uploads/accident/accident_${i}_2.jpg`]),
      i === 1 ? '甲方全责' : null,
      i === 1 ? 'closed' : i === 2 ? 'negotiating' : 'pending',
    )
  }

  const brands = ['雅迪', '爱玛', '小牛', '台铃', '绿源']
  const colors = ['黑色', '白色', '红色', '蓝色', '灰色']

  for (let i = 1; i <= 3; i++) {
    db.prepare(`
      INSERT INTO ebike_registrations (owner_id, owner_name, owner_id_card, phone, brand, model, frame_number, motor_number, purchase_date, invoice_number, license_plate, license_number, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      1,
      '张三',
      '110101199001011234',
      '13800138001',
      brands[i % brands.length],
      `${brands[i % brands.length]}T${i}`,
      `FRAME${String(100000 + i).padStart(6, '0')}`,
      `MOTOR${String(200000 + i).padStart(6, '0')}`,
      '2025-01-15',
      `INV${Date.now()}${i}`,
      i === 1 ? `京临${String(10000 + i).padStart(5, '0')}` : null,
      i === 1 ? `EBIKE${Date.now()}${i}` : null,
      i === 1 ? 'approved' : i === 2 ? 'pending' : 'rejected',
    )
  }

  const taskTypes = [
    { type: 'permit', title: '进京证审核' },
    { type: 'violation', title: '违法举报审核' },
    { type: 'ebike', title: '电动车登记审核' },
  ]

  for (let i = 1; i <= 5; i++) {
    const task = taskTypes[i % taskTypes.length]
    db.prepare(`
      INSERT INTO workflow_tasks (business_type, business_id, title, applicant_id, current_auditor_id, current_level, total_levels, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      task.type,
      i,
      `${task.title}-${i}`,
      1,
      2,
      1,
      3,
      i % 3 === 0 ? 'approved' : i % 3 === 1 ? 'pending' : 'rejected',
    )
  }

  for (let i = 1; i <= 3; i++) {
    db.prepare(`
      INSERT INTO certificates (user_id, cert_type, cert_number, holder_name, holder_id_card, issue_date, expiry_date, status, verify_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      1,
      i === 1 ? '进京证' : i === 2 ? '电子行驶证' : '驾驶证',
      `CERT${Date.now()}${i}`,
      '张三',
      '110101199001011234',
      '2026-01-01',
      '2027-01-01',
      'valid',
      `VERIFY${Date.now()}${i}`,
    )
  }

  console.log('Initial data inserted successfully')
}

initData()

export default db
