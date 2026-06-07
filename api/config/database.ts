import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { env } from './env.js'
import { hashPasswordSync, hashEvidence, generateSignature } from '../utils/hash.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.resolve(__dirname, '../../', env.DB_PATH)
const dbDir = path.dirname(dbPath)

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

export const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_card_no TEXT UNIQUE NOT NULL,
    real_name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS permit_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plate_number TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    route TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reject_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS violation_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    violation_type TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    location TEXT,
    violation_time DATETIME NOT NULL,
    description TEXT,
    evidence_hash TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS accident_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_no TEXT UNIQUE NOT NULL,
    accident_time DATETIME NOT NULL,
    location TEXT NOT NULL,
    party_a_id INTEGER,
    party_b_id INTEGER,
    officer_id INTEGER,
    liability TEXT,
    status TEXT NOT NULL DEFAULT 'negotiating',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (party_a_id) REFERENCES users(id),
    FOREIGN KEY (party_b_id) REFERENCES users(id),
    FOREIGN KEY (officer_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS ebike_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    frame_number TEXT UNIQUE NOT NULL,
    motor_number TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    color TEXT NOT NULL,
    purchase_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS service_windows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    district TEXT NOT NULL,
    business_types TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    window_id INTEGER NOT NULL,
    date DATE NOT NULL,
    time_slots TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 10,
    FOREIGN KEY (window_id) REFERENCES service_windows(id)
  )`,
  `CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    window_id INTEGER NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    business_type TEXT NOT NULL,
    queue_number TEXT,
    status TEXT NOT NULL DEFAULT 'booked',
    rating INTEGER,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (window_id) REFERENCES service_windows(id)
  )`,
  `CREATE TABLE IF NOT EXISTS workflow_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_type TEXT NOT NULL,
    business_id INTEGER NOT NULL,
    current_stage TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    current_auditor_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS audit_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    auditor_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    opinion TEXT,
    signature TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES workflow_tasks(id)
  )`,
  `CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    cert_type TEXT NOT NULL,
    cert_number TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    signature TEXT,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS abnormal_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    alert_type TEXT NOT NULL,
    level TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS chatbot_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id TEXT UNIQUE NOT NULL,
    history TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS driver_archives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_card_no TEXT UNIQUE NOT NULL,
    license_number TEXT UNIQUE NOT NULL,
    license_type TEXT NOT NULL,
    issue_date DATE NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'normal'
  )`,
  `CREATE TABLE IF NOT EXISTS vehicle_archives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_number TEXT UNIQUE NOT NULL,
    id_card_no TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    frame_number TEXT UNIQUE NOT NULL,
    register_date DATE NOT NULL,
    inspection_status TEXT NOT NULL DEFAULT 'valid'
  )`,
  `CREATE TABLE IF NOT EXISTS ebike_archives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_number TEXT UNIQUE NOT NULL,
    id_card_no TEXT NOT NULL,
    frame_number TEXT UNIQUE NOT NULL,
    register_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'normal'
  )`,
  `CREATE TABLE IF NOT EXISTS monthly_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month TEXT UNIQUE NOT NULL,
    permit_count INTEGER DEFAULT 0,
    violation_count INTEGER DEFAULT 0,
    accident_count INTEGER DEFAULT 0,
    ebike_count INTEGER DEFAULT 0,
    appointment_count INTEGER DEFAULT 0,
    avg_process_time REAL DEFAULT 0,
    satisfaction_rate REAL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS idx_permit_user ON permit_applications(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_permit_status ON permit_applications(status)`,
  `CREATE INDEX IF NOT EXISTS idx_violation_user ON violation_reports(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_violation_status ON violation_reports(status)`,
  `CREATE INDEX IF NOT EXISTS idx_accident_party ON accident_records(party_a_id, party_b_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ebike_user ON ebike_registrations(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_appointment_user ON appointments(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_appointment_window ON appointments(window_id, appointment_date)`,
  `CREATE INDEX IF NOT EXISTS idx_workflow_business ON workflow_tasks(business_type, business_id)`,
  `CREATE INDEX IF NOT EXISTS idx_workflow_auditor ON workflow_tasks(current_auditor_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_cert_user ON certificates(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_alert_status ON abnormal_alerts(status)`,
]

export const initDatabase = (): void => {
  const transaction = db.transaction(() => {
    for (const ddl of DDL_STATEMENTS) {
      db.exec(ddl)
    }

    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
    if (userCount.count === 0) {
      seedInitialData()
    }
  })

  transaction()
}

const seedInitialData = (): void => {
  const passwordHash = hashPasswordSync('123456')

  const insertUser = db.prepare(`
    INSERT INTO users (id_card_no, real_name, phone, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `)

  const userId1 = insertUser.run('110101199001011234', '张三', '13800138001', passwordHash, 'user').lastInsertRowid as number
  const userId2 = insertUser.run('110101198001011234', '李审核', '13800138002', passwordHash, 'auditor').lastInsertRowid as number
  const userId3 = insertUser.run('110101197001011234', '王管理', '13800138003', passwordHash, 'admin').lastInsertRowid as number

  const insertWindow = db.prepare(`
    INSERT INTO service_windows (name, address, district, business_types)
    VALUES (?, ?, ?, ?)
  `)

  const windows = [
    { name: '朝阳车管所', address: '北京市朝阳区南四环东路18号', district: '朝阳区', businessTypes: JSON.stringify(['permit', 'violation', 'ebike', 'appointment']) },
    { name: '海淀车管所', address: '北京市海淀区西北旺后厂村路99号', district: '海淀区', businessTypes: JSON.stringify(['permit', 'violation', 'ebike', 'appointment']) },
    { name: '丰台车管所', address: '北京市丰台区梆子井甲18号', district: '丰台区', businessTypes: JSON.stringify(['permit', 'violation', 'ebike', 'appointment']) },
    { name: '东城车管所', address: '北京市东城区新中街68号', district: '东城区', businessTypes: JSON.stringify(['permit', 'violation', 'appointment']) },
    { name: '西城车管所', address: '北京市西城区赵登禹路303号', district: '西城区', businessTypes: JSON.stringify(['permit', 'violation', 'appointment']) },
    { name: '通州车管所', address: '北京市通州区运河东大街76号', district: '通州区', businessTypes: JSON.stringify(['permit', 'violation', 'ebike', 'appointment']) },
  ]

  const windowIds: number[] = []
  for (const window of windows) {
    const result = insertWindow.run(window.name, window.address, window.district, window.businessTypes)
    windowIds.push(result.lastInsertRowid as number)
  }

  const timeSlots = JSON.stringify([
    '09:00-09:30', '09:30-10:00', '10:00-10:30', '10:30-11:00',
    '11:00-11:30', '13:30-14:00', '14:00-14:30', '14:30-15:00',
    '15:00-15:30', '15:30-16:00', '16:00-16:30', '16:30-17:00',
  ])

  const insertSchedule = db.prepare(`
    INSERT INTO schedules (window_id, date, time_slots, capacity)
    VALUES (?, ?, ?, ?)
  `)

  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    for (const windowId of windowIds) {
      insertSchedule.run(windowId, dateStr, timeSlots, 10)
    }
  }

  const insertDriverArchive = db.prepare(`
    INSERT INTO driver_archives (id_card_no, license_number, license_type, issue_date, score, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  insertDriverArchive.run('110101199001011234', '11010119900101', 'C1', '2010-06-15', 3, 'normal')
  insertDriverArchive.run('110101198001011234', '11010119800101', 'A2', '2000-03-20', 0, 'normal')
  insertDriverArchive.run('110101197001011234', '11010119700101', 'A1A2D', '1995-08-10', 0, 'normal')

  const insertVehicleArchive = db.prepare(`
    INSERT INTO vehicle_archives (plate_number, id_card_no, vehicle_type, frame_number, register_date, inspection_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  insertVehicleArchive.run('京A12345', '110101199001011234', '小型轿车', 'LSVAM4183GC012345', '2020-05-20', 'valid')
  insertVehicleArchive.run('京B67890', '110101198001011234', '中型客车', 'LSVAM4183GC067890', '2018-09-15', 'valid')
  insertVehicleArchive.run('京C11111', '110101197001011234', '大型货车', 'LSVAM4183GC011111', '2015-02-28', 'valid')

  const insertEbikeArchive = db.prepare(`
    INSERT INTO ebike_archives (plate_number, id_card_no, frame_number, register_date, status)
    VALUES (?, ?, ?, ?, ?)
  `)

  insertEbikeArchive.run('京临A00001', '110101199001011234', '2023010001', '2023-01-15', 'normal')
  insertEbikeArchive.run('京临B00002', '110101198001011234', '2023060002', '2023-06-20', 'normal')

  const insertPermit = db.prepare(`
    INSERT INTO permit_applications (user_id, plate_number, vehicle_type, start_date, end_date, route, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  insertPermit.run(userId1, '冀F12345', '小型轿车', '2024-06-01', '2024-06-07', 'G4京港澳高速-西五环-北五环', 'approved')
  insertPermit.run(userId1, '冀F12345', '小型轿车', '2024-06-15', '2024-06-21', 'G4京港澳高速-西五环', 'pending')

  const insertViolation = db.prepare(`
    INSERT INTO violation_reports (user_id, violation_type, latitude, longitude, location, violation_time, description, evidence_hash, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const evidenceHash = hashEvidence('violation_evidence_001')
  insertViolation.run(
    userId1,
    '闯红灯',
    39.9042,
    116.4074,
    '朝阳区建国门外大街',
    '2024-05-28 08:30:00',
    '在红灯亮起后车辆仍继续通过路口',
    evidenceHash,
    'pending'
  )

  const insertAccident = db.prepare(`
    INSERT INTO accident_records (case_no, accident_time, location, party_a_id, party_b_id, officer_id, liability, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertAccident.run(
    'ACC202406010001',
    '2024-06-01 14:30:00',
    '海淀区中关村大街',
    userId1,
    userId2,
    userId3,
    '甲方主责，乙方次责',
    'determined'
  )

  const insertEbikeReg = db.prepare(`
    INSERT INTO ebike_registrations (user_id, frame_number, motor_number, brand, model, color, purchase_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertEbikeReg.run(
    userId1,
    '20240100001',
    'M20240100001',
    '雅迪',
    '冠能E8',
    '白色',
    '2024-01-10',
    'approved'
  )

  const insertWorkflow = db.prepare(`
    INSERT INTO workflow_tasks (business_type, business_id, current_stage, status, current_auditor_id)
    VALUES (?, ?, ?, ?, ?)
  `)

  const workflowId1 = insertWorkflow.run('permit', 2, 'review', 'pending', userId2).lastInsertRowid as number
  const workflowId2 = insertWorkflow.run('violation', 1, 'review', 'pending', userId2).lastInsertRowid as number

  const insertAudit = db.prepare(`
    INSERT INTO audit_records (task_id, auditor_id, action, opinion, signature)
    VALUES (?, ?, ?, ?, ?)
  `)

  const signature = generateSignature('permit_approved_1', env.JWT_SECRET)
  insertAudit.run(workflowId1, userId2, 'approve', '材料齐全，符合申请条件', signature)

  const insertCert = db.prepare(`
    INSERT INTO certificates (user_id, cert_type, cert_number, content, signature, valid_from, valid_to, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const permitCertContent = JSON.stringify({
    permitId: 1,
    plateNumber: '冀F12345',
    validDays: 7,
    route: 'G4京港澳高速-西五环-北五环',
  })
  const certSignature = generateSignature(permitCertContent, env.JWT_SECRET)
  insertCert.run(
    userId1,
    'permit',
    'BJJJZ2024060001',
    permitCertContent,
    certSignature,
    '2024-06-01',
    '2024-06-07',
    'active'
  )

  const insertAlert = db.prepare(`
    INSERT INTO abnormal_alerts (task_id, alert_type, level, description, status)
    VALUES (?, ?, ?, ?, ?)
  `)

  insertAlert.run(
    workflowId2,
    'evidence_mismatch',
    'high',
    '举报证据与描述存在差异，需要人工复核',
    'pending'
  )

  const insertStats = db.prepare(`
    INSERT INTO monthly_stats (month, permit_count, violation_count, accident_count, ebike_count, appointment_count, avg_process_time, satisfaction_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertStats.run('2024-05', 156, 89, 23, 67, 245, 1.8, 96.5)
  insertStats.run('2024-04', 142, 78, 31, 59, 228, 2.1, 95.8)
  insertStats.run('2024-03', 128, 65, 19, 52, 198, 2.3, 94.2)
}

export const getDb = (): Database.Database => db

export default db
