import Database from 'better-sqlite3'
import { mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const dataDir = join(__dirname, '..', 'data')

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

const dbPath = join(dataDir, 'app.sqlite')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    id_card_encrypted TEXT,
    id_number TEXT,
    sukang_status TEXT NOT NULL DEFAULT 'green',
    verified INTEGER NOT NULL DEFAULT 0,
    verification_level INTEGER NOT NULL DEFAULT 0,
    verification_method TEXT,
    verification_expiry TEXT,
    last_verified_at TEXT,
    role TEXT NOT NULL DEFAULT 'citizen',
    street TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS verification_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    method TEXT NOT NULL,
    status TEXT NOT NULL,
    result TEXT,
    details TEXT,
    request_encrypted INTEGER NOT NULL DEFAULT 1,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS hospitals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    level TEXT NOT NULL DEFAULT '三甲',
    district TEXT NOT NULL DEFAULT '玄武区'
);
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id),
    name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER NOT NULL REFERENCES departments(id),
    name TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '主治医师',
    schedule TEXT NOT NULL DEFAULT '',
    fee INTEGER NOT NULL DEFAULT 12,
    specialty TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    doctor_id INTEGER NOT NULL REFERENCES doctors(id),
    appointment_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS tourist_spots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    district TEXT NOT NULL DEFAULT '玄武区',
    description TEXT NOT NULL DEFAULT '',
    daily_limit INTEGER NOT NULL DEFAULT 5000
);
CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    spot_id INTEGER NOT NULL REFERENCES tourist_spots(id),
    date TEXT NOT NULL,
    visitors INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending',
    visitor_names TEXT,
    confirmation_no TEXT,
    original_date TEXT,
    rescheduled_count INTEGER DEFAULT 0,
    cancelled_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, type)
);
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    item_name TEXT NOT NULL,
    department TEXT NOT NULL,
    materials TEXT NOT NULL DEFAULT '[]',
    ocr_data TEXT,
    signature_data TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    progress INTEGER NOT NULL DEFAULT 0,
    current_step INTEGER NOT NULL DEFAULT 0,
    estimated_completion TEXT,
    receipt_number TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS application_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    step INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    handler TEXT,
    remark TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
);
CREATE TABLE IF NOT EXISTS application_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    required INTEGER NOT NULL DEFAULT 1,
    ocr_data TEXT,
    uploaded_at TEXT,
    verified_at TEXT,
    verified_by TEXT,
    remark TEXT
);
CREATE TABLE IF NOT EXISTS ocr_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER REFERENCES applications(id),
    material_id INTEGER REFERENCES application_materials(id),
    file_name TEXT NOT NULL,
    result TEXT,
    edited_result TEXT,
    confidence REAL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    signature_data TEXT NOT NULL,
    confirmed INTEGER NOT NULL DEFAULT 0,
    confirmed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    ticket_no TEXT,
    type TEXT NOT NULL,
    street TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    images TEXT NOT NULL DEFAULT '[]',
    expected_days INTEGER NOT NULL DEFAULT 7,
    status TEXT NOT NULL DEFAULT 'pending',
    assigned_to INTEGER REFERENCES users(id),
    reply TEXT,
    urge_count INTEGER NOT NULL DEFAULT 0,
    last_urge_at TEXT,
    rating INTEGER,
    rating_comment TEXT,
    rated_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS complaint_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT '',
    comment TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS complaint_urges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS service_registry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    endpoint TEXT NOT NULL DEFAULT '',
    rate_limit_qps INTEGER NOT NULL DEFAULT 100,
    circuit_threshold REAL NOT NULL DEFAULT 0.5,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS service_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL REFERENCES service_registry(id),
    metric_type TEXT NOT NULL,
    value REAL NOT NULL,
    recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS ticket_route_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    street TEXT NOT NULL,
    department TEXT NOT NULL,
    complaint_type TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS knowledge_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '通用',
    keywords TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS delete_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    application_no TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    reason TEXT,
    identity_verified INTEGER NOT NULL DEFAULT 0,
    sms_verified INTEGER NOT NULL DEFAULT 0,
    applied_at TEXT NOT NULL DEFAULT (datetime('now')),
    cool_down_end TEXT NOT NULL,
    completed_at TEXT,
    cancelled_at TEXT,
    audit_log TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sensitive_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    action TEXT NOT NULL,
    field_name TEXT,
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    operator_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS privacy_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) UNIQUE,
    profile_visibility TEXT NOT NULL DEFAULT 'private',
    authorized_departments TEXT NOT NULL DEFAULT '[]',
    personalized_recommendations INTEGER NOT NULL DEFAULT 1,
    data_export_allowed INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_delete_applications_user ON delete_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_delete_applications_status ON delete_applications(status);
CREATE INDEX IF NOT EXISTS idx_operation_logs_user ON operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_action ON operation_logs(action);
CREATE INDEX IF NOT EXISTS idx_sensitive_logs_user ON sensitive_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_logs_type ON sensitive_logs(type);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_application_progress_app ON application_progress(application_id);
CREATE INDEX IF NOT EXISTS idx_application_materials_app ON application_materials(application_id);
CREATE INDEX IF NOT EXISTS idx_ocr_records_app ON ocr_records(application_id);
CREATE INDEX IF NOT EXISTS idx_signatures_app ON signatures(application_id);
CREATE INDEX IF NOT EXISTS idx_complaints_user ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_service_metrics_service ON service_metrics(service_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_entries(category);
CREATE INDEX IF NOT EXISTS idx_verification_history_user ON verification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_history_type ON verification_history(type);
CREATE INDEX IF NOT EXISTS idx_verification_history_status ON verification_history(status);
`)

function columnExists(table: string, column: string): boolean {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[])
    .some((info) => info.name === column)
}

function addColumnIfMissing(table: string, column: string, definition: string) {
  if (!columnExists(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

addColumnIfMissing('users', 'id_number', 'TEXT')
addColumnIfMissing('users', 'verification_level', 'INTEGER NOT NULL DEFAULT 0')
addColumnIfMissing('users', 'verification_method', 'TEXT')
addColumnIfMissing('users', 'verification_expiry', 'TEXT')
addColumnIfMissing('users', 'last_verified_at', 'TEXT')
addColumnIfMissing('reservations', 'visitor_names', "TEXT NOT NULL DEFAULT '[]'")
addColumnIfMissing('reservations', 'confirmation_no', 'TEXT')

addColumnIfMissing('doctors', 'fee', 'INTEGER NOT NULL DEFAULT 12')
addColumnIfMissing('doctors', 'specialty', 'TEXT NOT NULL DEFAULT ""')
addColumnIfMissing('applications', 'current_step', 'INTEGER NOT NULL DEFAULT 0')
addColumnIfMissing('applications', 'estimated_completion', 'TEXT')
addColumnIfMissing('applications', 'receipt_number', 'TEXT')
addColumnIfMissing('applications', 'updated_at', 'TEXT')
db.prepare(`
  UPDATE applications
  SET updated_at = COALESCE(NULLIF(updated_at, ''), created_at, datetime('now'))
  WHERE updated_at IS NULL OR updated_at = ''
`).run()

addColumnIfMissing('complaints', 'ticket_no', 'TEXT')
addColumnIfMissing('complaints', 'images', "TEXT NOT NULL DEFAULT '[]'")
addColumnIfMissing('complaints', 'expected_days', 'INTEGER NOT NULL DEFAULT 7')
addColumnIfMissing('complaints', 'urge_count', 'INTEGER NOT NULL DEFAULT 0')
addColumnIfMissing('complaints', 'last_urge_at', 'TEXT')
addColumnIfMissing('complaints', 'rating', 'INTEGER')
addColumnIfMissing('complaints', 'rating_comment', 'TEXT')
addColumnIfMissing('complaints', 'rated_at', 'TEXT')
addColumnIfMissing('complaints', 'assignee_name', "TEXT NOT NULL DEFAULT ''")
addColumnIfMissing('complaints', 'updated_at', "TEXT NOT NULL DEFAULT (datetime('now'))")
db.prepare(`
  UPDATE complaints
  SET ticket_no = 'SQ' || strftime('%Y%m%d', COALESCE(created_at, 'now')) || printf('%05d', id)
  WHERE ticket_no IS NULL OR ticket_no = ''
`).run()
db.prepare("UPDATE complaints SET images = '[]' WHERE images IS NULL OR images = ''").run()
db.prepare(`
  UPDATE complaints
  SET expected_days = CASE type
    WHEN '安全隐患' THEN 3
    WHEN '市政设施' THEN 5
    WHEN '环境卫生' THEN 7
    WHEN '交通出行' THEN 7
    WHEN '噪音扰民' THEN 7
    ELSE 10
  END
  WHERE expected_days = 7
`).run()

db.exec(`
CREATE TABLE IF NOT EXISTS complaint_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT '',
    handler_name TEXT NOT NULL DEFAULT '',
    comment TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS complaint_urges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`)

db.exec(`
CREATE INDEX IF NOT EXISTS idx_complaints_ticket_no ON complaints(ticket_no);
CREATE INDEX IF NOT EXISTS idx_complaint_history_complaint ON complaint_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_urges_complaint ON complaint_urges(complaint_id);
`)

const existingComplaints = db.prepare('SELECT id, status, department, created_at FROM complaints').all() as any[]
for (const c of existingComplaints) {
  const historyCount = db.prepare('SELECT COUNT(*) as count FROM complaint_history WHERE complaint_id = ?').get(c.id) as { count: number }
  if (historyCount.count === 0) {
    db.prepare(`
      INSERT INTO complaint_history (complaint_id, status, department, comment, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(c.id, 'pending', c.department, '诉求已提交，正在分配处理部门', c.created_at)
    
    if (c.status !== 'pending') {
      db.prepare(`
        INSERT INTO complaint_history (complaint_id, status, department, comment)
        VALUES (?, ?, ?, ?)
      `).run(c.id, 'processing', c.department, `已分拨至${c.department || '相关部门'}，工作人员将尽快处理`)
    }
    
    if (c.status === 'replied' || c.status === 'completed') {
      db.prepare(`
        INSERT INTO complaint_history (complaint_id, status, department, comment)
        VALUES (?, ?, ?, ?)
      `).run(c.id, c.status, c.department, '部门已回复处理结果')
    }
  }
}

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
if (userCount.count === 0) {
  const adminHash = bcrypt.hashSync('admin123', 10)
  db.prepare(`INSERT INTO users (phone, password_hash, name, role, verified, sukang_status, street) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run('13800000001', adminHash, '系统管理员', 'admin', 1, 'green', '玄武区')

  const hospitals: [string, string, string][] = [
    ['鼓楼医院', '三甲', '鼓楼区'],
    ['江苏省人民医院', '三甲', '鼓楼区'],
    ['东南大学附属中大医院', '三甲', '鼓楼区'],
    ['南京市第一医院', '三甲', '秦淮区'],
    ['南京医科大学第二附属医院', '三甲', '鼓楼区'],
    ['南京市中医院', '三甲', '秦淮区'],
  ]
  const insertHospital = db.prepare('INSERT INTO hospitals (name, level, district) VALUES (?, ?, ?)')
  const hospitalIds: number[] = []
  for (const h of hospitals) {
    const r = insertHospital.run(h[0], h[1], h[2])
    hospitalIds.push(Number(r.lastInsertRowid))
  }

  const deptNames = ['内科', '外科', '骨科', '心血管内科', '神经内科', '消化内科', '呼吸内科', '妇产科', '儿科', '眼科']
  const insertDept = db.prepare('INSERT INTO departments (hospital_id, name) VALUES (?, ?)')
  const deptInfos: { deptId: number; hospitalName: string; deptName: string }[] = []
  for (let i = 0; i < hospitalIds.length; i++) {
    const hid = hospitalIds[i]
    const hospitalName = hospitals[i][0]
    let hospitalDepts: string[]
    if (hospitalName === '江苏省人民医院' || hospitalName === '东南大学附属中大医院') {
      const otherDepts = deptNames.filter(d => d !== '儿科')
      const shuffled = [...otherDepts].sort(() => Math.random() - 0.5)
      hospitalDepts = ['儿科', ...shuffled.slice(0, 3 + Math.floor(Math.random() * 3))]
    } else {
      const count = 4 + Math.floor(Math.random() * 4)
      const shuffled = [...deptNames].sort(() => Math.random() - 0.5)
      hospitalDepts = shuffled.slice(0, count)
    }
    for (const deptName of hospitalDepts) {
      const r = insertDept.run(hid, deptName)
      deptInfos.push({
        deptId: Number(r.lastInsertRowid),
        hospitalName,
        deptName
      })
    }
  }

  const doctorSurnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴']
  const doctorGivenNames = ['伟', '芳', '敏', '强', '丽', '磊', '军', '洋', '勇', '艳']
  const titles = ['主任医师', '副主任医师', '主治医师', '副主任医师']
  const schedules = ['周一至周五', '周一三五', '周二周四', '周一至周四', '周三周五']
  const generalSpecialties = ['心血管疾病', '消化系统疾病', '呼吸系统疾病', '神经系统疾病', '内分泌疾病', '骨科疾病', '妇产科疾病', '眼科疾病', '皮肤病']
  const insertDoctor = db.prepare('INSERT INTO doctors (department_id, name, title, schedule, fee, specialty) VALUES (?, ?, ?, ?, ?, ?)')
  
  function getFee(hospitalName: string, title: string): number {
    if (hospitalName === '江苏省人民医院') {
      if (title === '主任医师') return 35
      if (title === '副主任医师') return 22
      return 12
    } else if (hospitalName === '东南大学附属中大医院') {
      if (title === '主任医师') return 38
      if (title === '副主任医师') return 25
      return 15
    } else {
      if (title === '主任医师') return 30
      if (title === '副主任医师') return 20
      return 12
    }
  }
  
  function getDoctorName(hospitalName: string, deptName: string, index: number): string {
    const surname = doctorSurnames[index % doctorSurnames.length]
    const givenName = doctorGivenNames[index % doctorGivenNames.length]
    if (hospitalName === '江苏省人民医院') {
      return `省人医${surname}${givenName}`
    } else if (hospitalName === '东南大学附属中大医院') {
      return `中大${surname}${givenName}`
    }
    return surname + givenName
  }
  
  function getSpecialty(hospitalName: string, deptName: string, index: number): string {
    const baseSpecialty = generalSpecialties[index % generalSpecialties.length]
    if (hospitalName === '江苏省人民医院') {
      if (deptName === '儿科') {
        return `小儿呼吸系统疾病、小儿消化系统疾病，省人医特色儿科诊疗`
      }
      return `${baseSpecialty}，省人医特色诊疗`
    } else if (hospitalName === '东南大学附属中大医院') {
      if (deptName === '儿科') {
        return `小儿神经系统疾病、小儿内分泌疾病，中大特色儿科诊疗`
      }
      return `${baseSpecialty}，中大特色诊疗`
    }
    return baseSpecialty
  }
  
  for (const info of deptInfos) {
    const count = 2 + Math.floor(Math.random() * 3)
    for (let i = 0; i < count; i++) {
      const name = getDoctorName(info.hospitalName, info.deptName, i * 3 + info.deptId)
      const title = titles[Math.floor(Math.random() * titles.length)]
      const schedule = schedules[Math.floor(Math.random() * schedules.length)]
      const fee = getFee(info.hospitalName, title)
      const specialty = getSpecialty(info.hospitalName, info.deptName, i * 3 + info.deptId)
      insertDoctor.run(info.deptId, name, title, schedule, fee, specialty)
    }
  }

  const spots: [string, string, string, number][] = [
    ['中山陵', '玄武区', '中国近代伟大的民主革命先行者孙中山先生的陵寝，全国重点文物保护单位', 30000],
    ['夫子庙', '秦淮区', '中国四大文庙之一，秦淮风光带核心区域，集古迹游览、美食文化于一体', 50000],
    ['玄武湖', '玄武区', '江南最大的城内公园，中国最大的皇家园林湖泊，被誉为"金陵明珠"', 40000],
    ['明孝陵', '玄武区', '明朝开国皇帝朱元璋和皇后马氏的合葬陵墓，世界文化遗产', 25000],
    ['总统府', '玄武区', '中国近代建筑遗存中规模最大、保存最完整的建筑群，近代史博物馆', 20000],
    ['雨花台', '雨花台区', '全国重点文物保护单位，全国爱国主义教育示范基地，革命烈士陵园', 15000],
  ]
  const insertSpot = db.prepare('INSERT INTO tourist_spots (name, district, description, daily_limit) VALUES (?, ?, ?, ?)')
  for (const s of spots) {
    insertSpot.run(s[0], s[1], s[2], s[3])
  }

  const services: [string, string, string][] = [
    ['卫健委医疗服务', '卫健委', '/api/health'],
    ['交通出行查询', '交通局', '/api/transport'],
    ['文旅预约服务', '文旅局', '/api/tourism'],
    ['社保信息查询', '人社局', '/api/social-security'],
    ['户政办事指南', '公安局', '/api/police'],
  ]
  const insertService = db.prepare('INSERT INTO service_registry (name, department, endpoint) VALUES (?, ?, ?)')
  for (const s of services) {
    insertService.run(s[0], s[1], s[2])
  }

  const routeRules: [string, string, string, number][] = [
    ['玄武区', '玄武区城管局', '环境卫生', 1],
    ['玄武区', '玄武区城管局', '噪音扰民', 1],
    ['玄武区', '玄武区交通局', '交通出行', 1],
    ['玄武区', '玄武区住建局', '市政设施', 1],
    ['玄武区', '玄武区应急管理局', '安全隐患', 1],
    ['玄武区', '玄武区城管综合执法大队', '其他', 2],
    ['秦淮区', '秦淮区城管局', '环境卫生', 1],
    ['秦淮区', '秦淮区城管局', '噪音扰民', 1],
    ['秦淮区', '秦淮区交通局', '交通出行', 1],
    ['秦淮区', '秦淮区住建局', '市政设施', 1],
    ['秦淮区', '秦淮区应急管理局', '安全隐患', 1],
    ['秦淮区', '秦淮区城管综合执法大队', '其他', 2],
    ['建邺区', '建邺区城管局', '环境卫生', 1],
    ['建邺区', '建邺区城管局', '噪音扰民', 1],
    ['建邺区', '建邺区交通局', '交通出行', 1],
    ['建邺区', '建邺区住建局', '市政设施', 1],
    ['建邺区', '建邺区应急管理局', '安全隐患', 1],
    ['建邺区', '建邺区城管综合执法大队', '其他', 2],
    ['鼓楼区', '鼓楼区城管局', '环境卫生', 1],
    ['鼓楼区', '鼓楼区城管局', '噪音扰民', 1],
    ['鼓楼区', '鼓楼区交通局', '交通出行', 1],
    ['鼓楼区', '鼓楼区住建局', '市政设施', 1],
    ['鼓楼区', '鼓楼区应急管理局', '安全隐患', 1],
    ['鼓楼区', '鼓楼区城管综合执法大队', '其他', 2],
    ['浦口区', '浦口区城管局', '环境卫生', 1],
    ['浦口区', '浦口区交通局', '交通出行', 1],
    ['浦口区', '浦口区住建局', '市政设施', 1],
    ['浦口区', '浦口区应急管理局', '安全隐患', 1],
    ['浦口区', '浦口区城管综合执法大队', '其他', 2],
    ['栖霞区', '栖霞区城管局', '环境卫生', 1],
    ['栖霞区', '栖霞区交通局', '交通出行', 1],
    ['栖霞区', '栖霞区住建局', '市政设施', 1],
    ['栖霞区', '栖霞区应急管理局', '安全隐患', 1],
    ['栖霞区', '栖霞区城管综合执法大队', '其他', 2],
    ['雨花台区', '雨花台区城管局', '环境卫生', 1],
    ['雨花台区', '雨花台区交通局', '交通出行', 1],
    ['雨花台区', '雨花台区住建局', '市政设施', 1],
    ['雨花台区', '雨花台区应急管理局', '安全隐患', 1],
    ['雨花台区', '雨花台区城管综合执法大队', '其他', 2],
    ['江宁区', '江宁区城管局', '环境卫生', 1],
    ['江宁区', '江宁区交通局', '交通出行', 1],
    ['江宁区', '江宁区住建局', '市政设施', 1],
    ['江宁区', '江宁区应急管理局', '安全隐患', 1],
    ['江宁区', '江宁区城管综合执法大队', '其他', 2],
    ['六合区', '六合区城管局', '环境卫生', 1],
    ['六合区', '六合区交通局', '交通出行', 1],
    ['六合区', '六合区住建局', '市政设施', 1],
    ['六合区', '六合区应急管理局', '安全隐患', 1],
    ['六合区', '六合区城管综合执法大队', '其他', 2],
    ['溧水区', '溧水区城管局', '环境卫生', 1],
    ['溧水区', '溧水区交通局', '交通出行', 1],
    ['溧水区', '溧水区住建局', '市政设施', 1],
    ['溧水区', '溧水区应急管理局', '安全隐患', 1],
    ['溧水区', '溧水区城管综合执法大队', '其他', 2],
    ['高淳区', '高淳区城管局', '环境卫生', 1],
    ['高淳区', '高淳区交通局', '交通出行', 1],
    ['高淳区', '高淳区住建局', '市政设施', 1],
    ['高淳区', '高淳区应急管理局', '安全隐患', 1],
    ['高淳区', '高淳区城管综合执法大队', '其他', 2],
  ]
  const insertRule = db.prepare('INSERT INTO ticket_route_rules (street, department, complaint_type, priority) VALUES (?, ?, ?, ?)')
  for (const r of routeRules) {
    insertRule.run(r[0], r[1], r[2], r[3])
  }

  const knowledge: [string, string, string, string][] = [
    ['南京市居住证办理指南', '在南京居住满6个月即可申领居住证，需提供身份证、居住证明、就业证明或就读证明等材料。办理地点为居住地派出所或社区服务中心。', '户政', '["居住证","暂住证","居住证明"]'],
    ['社保卡申领流程', '南京市社保卡可通过"我的南京"APP在线申领，也可前往社保卡服务网点办理。需提供身份证原件及一寸白底照片。制卡周期约15个工作日。', '社保', '["社保卡","医保卡","市民卡"]'],
    ['机动车违章查询与处理', '可通过"交管12123"APP或南京交警微信公众号查询违章记录。罚款200元以下可在线处理，需绑定驾驶证和行驶证。', '交通', '["违章","罚款","交管","驾驶证"]'],
    ['公积金提取条件与流程', '南京公积金提取条件包括购房、还贷、租房、退休等。可通过"南京公积金"APP在线申请，一般3个工作日到账。', '住房', '["公积金","提取","住房","贷款"]'],
    ['新生儿落户办理', '新生儿出生后应在一个月内到父亲或母亲户籍所在地派出所办理落户。需提供出生医学证明、父母结婚证、户口簿等。', '户政', '["落户","新生儿","户口","出生"]'],
    ['南京市医保报销比例', '南京职工医保门诊报销比例：社区医院70%，三级医院60%。住院报销比例：社区医院95%，三级医院85%。居民医保报销比例略低。', '社保', '["医保","报销","医疗","保险"]'],
  ]
  const insertKnowledge = db.prepare('INSERT INTO knowledge_entries (title, content, category, keywords) VALUES (?, ?, ?, ?)')
  for (const k of knowledge) {
    insertKnowledge.run(k[0], k[1], k[2], k[3])
  }
}

db.prepare("UPDATE hospitals SET name = '南京鼓楼医院' WHERE name = '鼓楼医院'").run()
db.prepare("UPDATE hospitals SET district = '玄武区' WHERE name = '东南大学附属中大医院'").run()

export default db
