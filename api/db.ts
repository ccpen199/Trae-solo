import { DatabaseSync, type StatementSync } from 'node:sqlite'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

type SqliteParam = string | number | bigint | null | Buffer

class StatementCompat {
  constructor(private statement: StatementSync) {}

  get(...params: SqliteParam[]) {
    return this.statement.get(...params)
  }

  all(...params: SqliteParam[]) {
    return this.statement.all(...params)
  }

  run(...params: SqliteParam[]) {
    return this.statement.run(...params)
  }
}

class DatabaseCompat {
  private database: DatabaseSync

  constructor(filename: string) {
    this.database = new DatabaseSync(filename)
  }

  prepare(sql: string) {
    return new StatementCompat(this.database.prepare(sql))
  }

  exec(sql: string) {
    return this.database.exec(sql)
  }

  pragma(sql: string) {
    return this.database.exec(`PRAGMA ${sql}`)
  }

  close() {
    return this.database.close()
  }
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'data')
const uploadsDir = path.join(__dirname, '..', 'uploads')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'app.sqlite')
const db = new DatabaseCompat(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK(role IN ('nurse','family','admin','regulator')),
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS nurses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    license_number TEXT UNIQUE,
    qualification TEXT,
    latitude REAL DEFAULT 0,
    longitude REAL DEFAULT 0,
    rating REAL DEFAULT 5.0,
    total_services INTEGER DEFAULT 0,
    today_load INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','verified','suspended','offline','online')),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS nurse_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nurse_id INTEGER NOT NULL REFERENCES nurses(id),
    ocr_result TEXT,
    health_committee_result TEXT,
    credit_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','ocr_done','compared','verified','rejected')),
    verified_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    sop TEXT,
    contraindications TEXT,
    price REAL NOT NULL DEFAULT 0,
    duration_minutes INTEGER DEFAULT 60,
    required_qualification TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive')),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_user_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    id_number TEXT,
    medical_summary TEXT,
    address TEXT,
    phone TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER REFERENCES patients(id),
    nurse_id INTEGER REFERENCES nurses(id),
    service_id INTEGER NOT NULL REFERENCES services(id),
    family_user_id INTEGER REFERENCES users(id),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','dispatched','accepted','in_progress','completed','cancelled')),
    scheduled_at TEXT,
    completed_at TEXT,
    address TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS service_tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    recorded_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS service_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    photo_type TEXT NOT NULL CHECK(photo_type IN ('before','after','document')),
    file_path TEXT NOT NULL,
    taken_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS family_confirmations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    signature_data TEXT,
    confirmed_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS insurance_policies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    insurance_type TEXT NOT NULL CHECK(insurance_type IN ('liability','accident')),
    policy_number TEXT UNIQUE,
    premium REAL DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','claimed','expired')),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS education_courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    credit_value INTEGER DEFAULT 1,
    category TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive')),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS education_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nurse_id INTEGER NOT NULL REFERENCES nurses(id),
    course_id INTEGER NOT NULL REFERENCES education_courses(id),
    status TEXT DEFAULT 'enrolled' CHECK(status IN ('enrolled','completed','failed')),
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id INTEGER,
    details TEXT,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS adverse_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_id INTEGER NOT NULL REFERENCES users(id),
    order_id INTEGER REFERENCES orders(id),
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('mild','moderate','severe','critical')),
    description TEXT NOT NULL,
    status TEXT DEFAULT 'reported' CHECK(status IN ('reported','investigating','resolved','closed')),
    created_at TEXT DEFAULT (datetime('now'))
);
`)

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }

if (userCount.count === 0) {
  const adminHash = bcrypt.hashSync('admin123', 10)
  const regulatorHash = bcrypt.hashSync('regulator123', 10)
  const nurse1Hash = bcrypt.hashSync('nurse123', 10)
  const nurse2Hash = bcrypt.hashSync('nurse456', 10)
  const nurse3Hash = bcrypt.hashSync('nurse789', 10)
  const family1Hash = bcrypt.hashSync('family123', 10)
  const family2Hash = bcrypt.hashSync('family456', 10)
  const platformHash = bcrypt.hashSync('platform123', 10)
  const opsHash = bcrypt.hashSync('ops123', 10)
  const hospitalHash = bcrypt.hashSync('hospital123', 10)

  const insertUser = db.prepare(
    'INSERT INTO users (username, password_hash, phone, role, name) VALUES (?, ?, ?, ?, ?)'
  )

  const adminId = insertUser.run('admin', adminHash, '13800000000', 'admin', '系统管理员').lastInsertRowid
  const regulatorId = insertUser.run('regulator', regulatorHash, '13800000001', 'regulator', '监管员').lastInsertRowid
  insertUser.run('platform', platformHash, '13800000002', 'admin', '平台运营')
  insertUser.run('ops', opsHash, '13800000003', 'admin', '运维工程师')
  insertUser.run('hospital', hospitalHash, '13800000004', 'admin', '医疗机构管理员')
  const nurse1UserId = insertUser.run('nurse1', nurse1Hash, '13900000001', 'nurse', '张护士').lastInsertRowid
  const nurse2UserId = insertUser.run('nurse2', nurse2Hash, '13900000002', 'nurse', '李护士').lastInsertRowid
  const nurse3UserId = insertUser.run('nurse3', nurse3Hash, '13900000003', 'nurse', '王护士').lastInsertRowid
  const family1UserId = insertUser.run('family1', family1Hash, '13700000001', 'family', '刘家属').lastInsertRowid
  const family2UserId = insertUser.run('family2', family2Hash, '13700000002', 'family', '陈家属').lastInsertRowid

  const insertNurse = db.prepare(
    'INSERT INTO nurses (user_id, license_number, qualification, latitude, longitude, rating, total_services, today_load, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )

  const nurse1Id = insertNurse.run(nurse1UserId, 'NUR-2024-001', 'registered_nurse', 31.2304, 121.4737, 4.8, 56, 2, 'online').lastInsertRowid
  const nurse2Id = insertNurse.run(nurse2UserId, 'NUR-2024-002', 'senior_nurse', 31.2404, 121.4837, 4.9, 102, 1, 'online').lastInsertRowid
  const nurse3Id = insertNurse.run(nurse3UserId, 'NUR-2024-003', 'registered_nurse', 31.2204, 121.4637, 4.6, 33, 0, 'offline').lastInsertRowid

  const insertVerification = db.prepare(
    'INSERT INTO nurse_verifications (nurse_id, ocr_result, health_committee_result, credit_score, status, verified_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
  insertVerification.run(nurse1Id, '{"name":"张护士","license":"NUR-2024-001","type":"registered_nurse"}', '{"name":"张护士","license":"NUR-2024-001","valid":true}', 85, 'verified', '2024-01-15T10:00:00Z')
  insertVerification.run(nurse2Id, '{"name":"李护士","license":"NUR-2024-002","type":"senior_nurse"}', '{"name":"李护士","license":"NUR-2024-002","valid":true}', 92, 'verified', '2024-01-16T10:00:00Z')
  insertVerification.run(nurse3Id, '{"name":"王护士","license":"NUR-2024-003","type":"registered_nurse"}', '{"name":"王护士","license":"NUR-2024-003","valid":true}', 78, 'verified', '2024-01-17T10:00:00Z')

  const insertService = db.prepare(
    'INSERT INTO services (name, category, sop, contraindications, price, duration_minutes, required_qualification) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const service1Id = insertService.run(
    '上门打针', 'injection',
    '1. 核对医嘱及患者信息\n2. 准备药品及注射器材\n3. 严格执行无菌操作\n4. 选择合适注射部位\n5. 注射后观察15分钟',
    '1. 对该药物过敏者禁用\n2. 严重出血性疾病患者禁用肌注\n3. 注射部位有感染或皮肤病者禁用',
    80, 30, 'registered_nurse'
  ).lastInsertRowid
  const service2Id = insertService.run(
    'PICC维护', 'picc',
    '1. 评估穿刺点及周围皮肤\n2. 消毒穿刺点及导管\n3. 更换敷料及接头\n4. 冲管及封管\n5. 记录导管刻度',
    '1. 穿刺点感染期间禁止维护\n2. 导管断裂或破损需立即处理\n3. 对敷料材质过敏者更换材质',
    150, 45, 'senior_nurse'
  ).lastInsertRowid
  const service3Id = insertService.run(
    '产后访视', 'postpartum',
    '1. 评估产妇生命体征\n2. 检查子宫复旧及恶露\n3. 评估乳房及哺乳情况\n4. 检查会阴或腹部伤口\n5. 新生儿脐带护理指导',
    '1. 产后大出血需立即转诊\n2. 严重产褥感染需住院治疗\n3. 产妇精神异常需心理科转诊',
    120, 60, 'registered_nurse'
  ).lastInsertRowid
  const service4Id = insertService.run(
    '安宁疗护', 'hospice',
    '1. 评估患者疼痛及症状\n2. 提供舒适护理\n3. 心理及精神支持\n4. 家属哀伤辅导\n5. 协助医疗决策',
    '1. 急性可逆性疾病需先治疗\n2. 患者或家属拒绝安宁疗护\n3. 需要ICU级别的生命支持',
    200, 90, 'senior_nurse'
  ).lastInsertRowid

  const insertPatient = db.prepare(
    'INSERT INTO patients (family_user_id, name, id_number, medical_summary, address, phone) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const patient1Id = insertPatient.run(family1UserId, '刘大爷', '310101194501011234', '高血压、糖尿病，需定期注射胰岛素', '上海市黄浦区南京东路100号', '13700000001').lastInsertRowid
  const patient2Id = insertPatient.run(family1UserId, '刘大妈', '310101194803051234', '膝关节退行性病变，PICC置管中', '上海市黄浦区南京东路100号', '13700000001').lastInsertRowid
  const patient3Id = insertPatient.run(family2UserId, '陈小明', '310101202001011234', '新生儿，需产后访视', '上海市浦东新区陆家嘴环路500号', '13700000002').lastInsertRowid

  const insertOrder = db.prepare(
    'INSERT INTO orders (patient_id, nurse_id, service_id, family_user_id, status, scheduled_at, address, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  insertOrder.run(patient1Id, nurse1Id, service1Id, family1UserId, 'accepted', '2024-03-15T09:00:00Z', '上海市黄浦区南京东路100号', '需空腹注射胰岛素')
  insertOrder.run(patient2Id, nurse2Id, service2Id, family1UserId, 'in_progress', '2024-03-15T10:00:00Z', '上海市黄浦区南京东路100号', 'PICC每周维护')
  insertOrder.run(patient3Id, null, service3Id, family2UserId, 'pending', '2024-03-16T14:00:00Z', '上海市浦东新区陆家嘴环路500号', '第一次产后访视')

  const insertCourse = db.prepare(
    'INSERT INTO education_courses (title, credit_value, category) VALUES (?, ?, ?)'
  )
  insertCourse.run('护理伦理', 2, 'ethics')
  insertCourse.run('急救技能', 3, 'emergency')
}

export default db
