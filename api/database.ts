import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import bcryptjs from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbDir = path.resolve(__dirname, '../data')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = path.resolve(dbDir, 'app.sqlite')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('farmer','village','township','supervisor')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS households (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    head_name TEXT NOT NULL,
    id_card TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    eligibility_status TEXT NOT NULL DEFAULT 'qualified' CHECK(eligibility_status IN ('qualified','disqualified','pending','restricted')),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS household_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    id_card TEXT NOT NULL,
    household_registration TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS parcels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    household_id INTEGER NOT NULL REFERENCES households(id),
    parcel_code TEXT NOT NULL UNIQUE,
    coordinates TEXT,
    area REAL NOT NULL,
    usage TEXT NOT NULL CHECK(usage IN ('residence','production','business','other')),
    ownership_cert TEXT,
    ownership_status TEXT NOT NULL DEFAULT 'unconfirmed' CHECK(ownership_status IN ('confirmed','unconfirmed','transferring','exited')),
    boundary_east TEXT,
    boundary_west TEXT,
    boundary_south TEXT,
    boundary_north TEXT,
    photos TEXT DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS parcel_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parcel_id INTEGER NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL,
    description TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    changed_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_code TEXT NOT NULL UNIQUE,
    household_id INTEGER NOT NULL REFERENCES households(id),
    parcel_id INTEGER REFERENCES parcels(id),
    type TEXT NOT NULL CHECK(type IN ('new_build','rebuild','expand','exit','transfer')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','village_review','township_review','supervisor_filing','approved','rejected','returned')),
    materials TEXT DEFAULT '[]',
    remarks TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS approval_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    stage TEXT NOT NULL CHECK(stage IN ('village_review','township_review','supervisor_filing')),
    action TEXT NOT NULL CHECK(action IN ('approve','reject','return')),
    opinion TEXT,
    operator_id INTEGER NOT NULL REFERENCES users(id),
    operated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS anomalies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anomaly_type TEXT NOT NULL CHECK(anomaly_type IN ('over_area','multi_homestead','missing_material','disputed_parcel','illegal_construction')),
    household_id INTEGER REFERENCES households(id),
    parcel_id INTEGER REFERENCES parcels(id),
    application_id INTEGER REFERENCES applications(id),
    description TEXT NOT NULL,
    rectify_status TEXT NOT NULL DEFAULT 'pending' CHECK(rectify_status IN ('pending','in_progress','completed','overdue')),
    rectify_requirement TEXT,
    deadline TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS rectify_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anomaly_id INTEGER NOT NULL REFERENCES anomalies(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    result TEXT,
    deadline TEXT,
    operator_id INTEGER NOT NULL REFERENCES users(id),
    operated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','cancelled')),
    application_ids TEXT DEFAULT '[]',
    deadline TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_households_head_name ON households(head_name);
  CREATE INDEX IF NOT EXISTS idx_households_id_card ON households(id_card);
  CREATE INDEX IF NOT EXISTS idx_households_eligibility ON households(eligibility_status);
  CREATE INDEX IF NOT EXISTS idx_households_created_by ON households(created_by);
  CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id);
  CREATE INDEX IF NOT EXISTS idx_parcels_household_id ON parcels(household_id);
  CREATE INDEX IF NOT EXISTS idx_parcels_parcel_code ON parcels(parcel_code);
  CREATE INDEX IF NOT EXISTS idx_parcels_usage ON parcels(usage);
  CREATE INDEX IF NOT EXISTS idx_parcels_ownership_status ON parcels(ownership_status);
  CREATE INDEX IF NOT EXISTS idx_parcel_changes_parcel_id ON parcel_changes(parcel_id);
  CREATE INDEX IF NOT EXISTS idx_applications_app_code ON applications(app_code);
  CREATE INDEX IF NOT EXISTS idx_applications_household_id ON applications(household_id);
  CREATE INDEX IF NOT EXISTS idx_applications_parcel_id ON applications(parcel_id);
  CREATE INDEX IF NOT EXISTS idx_applications_type ON applications(type);
  CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
  CREATE INDEX IF NOT EXISTS idx_applications_created_by ON applications(created_by);
  CREATE INDEX IF NOT EXISTS idx_approval_records_application_id ON approval_records(application_id);
  CREATE INDEX IF NOT EXISTS idx_approval_records_stage ON approval_records(stage);
  CREATE INDEX IF NOT EXISTS idx_anomalies_type ON anomalies(anomaly_type);
  CREATE INDEX IF NOT EXISTS idx_anomalies_household_id ON anomalies(household_id);
  CREATE INDEX IF NOT EXISTS idx_anomalies_parcel_id ON anomalies(parcel_id);
  CREATE INDEX IF NOT EXISTS idx_anomalies_rectify_status ON anomalies(rectify_status);
  CREATE INDEX IF NOT EXISTS idx_rectify_records_anomaly_id ON rectify_records(anomaly_id);
  CREATE INDEX IF NOT EXISTS idx_notices_status ON notices(status);
  CREATE INDEX IF NOT EXISTS idx_notices_created_by ON notices(created_by);
`)

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
if (userCount.count === 0) {
  const hashedPassword = bcryptjs.hashSync('123456', 10)

  const insertUser = db.prepare(
    'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)'
  )

  const userIds = [
    insertUser.run('admin', hashedPassword, '管理员', 'supervisor'),
    insertUser.run('platform', hashedPassword, '平台运营', 'township'),
    insertUser.run('ops', hashedPassword, '运维人员', 'village'),
    insertUser.run('farmer1', hashedPassword, '张三', 'farmer'),
    insertUser.run('village1', hashedPassword, '李村长', 'village'),
    insertUser.run('township1', hashedPassword, '王镇长', 'township'),
    insertUser.run('supervisor1', hashedPassword, '赵督导', 'supervisor'),
  ].map(r => r.lastInsertRowid)

  const insertHousehold = db.prepare(
    'INSERT INTO households (head_name, id_card, address, phone, eligibility_status, created_by) VALUES (?, ?, ?, ?, ?, ?)'
  )

  const householdData = [
    ['张三', '320123199001011234', '幸福村1组1号', '13800000001', 'qualified'],
    ['李四', '320123199002022345', '幸福村1组2号', '13800000002', 'qualified'],
    ['王五', '320123199003033456', '幸福村2组1号', '13800000003', 'qualified'],
    ['赵六', '320123199004044567', '幸福村2组2号', '13800000004', 'qualified'],
    ['孙七', '320123199005055678', '和谐村1组1号', '13800000005', 'qualified'],
    ['周八', '320123199006066789', '和谐村1组2号', '13800000006', 'qualified'],
    ['吴九', '320123199007077890', '和谐村2组1号', '13800000007', 'pending'],
    ['郑十', '320123199008088901', '和谐村2组2号', '13800000008', 'qualified'],
    ['冯冬', '320123199009099012', '团结村1组1号', '13800000009', 'disqualified'],
    ['陈南', '320123199010100123', '团结村1组2号', '13800000010', 'qualified'],
  ]

  const householdIds: number[] = []
  for (const [headName, idCard, address, phone, status] of householdData) {
    const result = insertHousehold.run(headName, idCard, address, phone, status, userIds[0])
    householdIds.push(result.lastInsertRowid as number)
  }

  const insertMember = db.prepare(
    'INSERT INTO household_members (household_id, name, relationship, id_card, household_registration) VALUES (?, ?, ?, ?, ?)'
  )

  const memberData = [
    [householdIds[0], '张三', '户主', '320123199001011234', '幸福村'],
    [householdIds[0], '张妻', '配偶', '320123199101011235', '幸福村'],
    [householdIds[0], '张子', '子女', '320123201501011236', '幸福村'],
    [householdIds[1], '李四', '户主', '320123199002022345', '幸福村'],
    [householdIds[1], '李妻', '配偶', '320123199202022346', '幸福村'],
    [householdIds[2], '王五', '户主', '320123199003033456', '幸福村'],
    [householdIds[3], '赵六', '户主', '320123199004044567', '幸福村'],
    [householdIds[3], '赵妻', '配偶', '320123199404044568', '幸福村'],
    [householdIds[4], '孙七', '户主', '320123199005055678', '和谐村'],
    [householdIds[5], '周八', '户主', '320123199006066789', '和谐村'],
    [householdIds[6], '吴九', '户主', '320123199007077890', '和谐村'],
    [householdIds[7], '郑十', '户主', '320123199008088901', '和谐村'],
    [householdIds[8], '冯冬', '户主', '320123199009099012', '团结村'],
    [householdIds[9], '陈南', '户主', '320123199010100123', '团结村'],
  ]

  for (const [hid, name, rel, idCard, reg] of memberData) {
    insertMember.run(hid, name, rel, idCard, reg)
  }

  const insertParcel = db.prepare(
    `INSERT INTO parcels (household_id, parcel_code, coordinates, area, usage, ownership_cert, ownership_status, boundary_east, boundary_west, boundary_south, boundary_north)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const parcelData = [
    [householdIds[0], 'ZJ2024001', '118.5,32.1', 120.5, 'residence', '鄂宅基地证001', 'confirmed', '张某地', '李某地', '道路', '河沟'],
    [householdIds[1], 'ZJ2024002', '118.6,32.2', 135.0, 'residence', '鄂宅基地证002', 'confirmed', '王某地', '赵某地', '水渠', '田埂'],
    [householdIds[2], 'ZJ2024003', '118.7,32.3', 200.0, 'residence', null, 'unconfirmed', '道路', '孙某地', '沟渠', '山坡'],
    [householdIds[3], 'ZJ2024004', '118.8,32.4', 110.0, 'production', '鄂宅基地证004', 'confirmed', '赵某地', '周某地', '道路', '围墙'],
    [householdIds[4], 'ZJ2024005', '118.9,32.5', 150.0, 'residence', '鄂宅基地证005', 'confirmed', '孙某地', '吴某地', '公路', '水塘'],
    [householdIds[5], 'ZJ2024006', '119.0,32.6', 180.0, 'business', '鄂宅基地证006', 'confirmed', '周某地', '郑某地', '街道', '后山'],
    [householdIds[6], 'ZJ2024007', '119.1,32.7', 90.0, 'residence', null, 'unconfirmed', '吴某地', '冯某地', '小路', '田地'],
    [householdIds[7], 'ZJ2024008', '119.2,32.8', 160.0, 'residence', '鄂宅基地证008', 'transferring', '郑某地', '陈某地', '公路', '河流'],
    [householdIds[8], 'ZJ2024009', '119.3,32.9', 300.0, 'residence', null, 'unconfirmed', '冯某地', '张某地', '道路', '山脚'],
    [householdIds[9], 'ZJ2024010', '119.4,33.0', 125.0, 'other', '鄂宅基地证010', 'confirmed', '陈某地', '李某地', '围墙', '水沟'],
  ]

  const parcelIds: number[] = []
  for (const [hid, code, coord, area, usage, cert, status, be, bw, bs, bn] of parcelData) {
    const result = insertParcel.run(hid, code, coord, area, usage, cert, status, be, bw, bs, bn)
    parcelIds.push(result.lastInsertRowid as number)
  }

  const insertApplication = db.prepare(
    `INSERT INTO applications (app_code, household_id, parcel_id, type, status, materials, remarks, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const appData = [
    ['SQ2024001', householdIds[0], parcelIds[0], 'rebuild', 'village_review', '[]', '房屋老旧需要翻建', userIds[0]],
    ['SQ2024002', householdIds[2], parcelIds[2], 'new_build', 'township_review', '[]', '子女成家需新建住宅', userIds[0]],
    ['SQ2024003', householdIds[7], parcelIds[7], 'transfer', 'submitted', '[]', '宅基地转让给同村村民', userIds[0]],
    ['SQ2024004', householdIds[4], parcelIds[4], 'expand', 'draft', '[]', '家庭人口增加需扩建', userIds[0]],
    ['SQ2024005', householdIds[8], parcelIds[8], 'exit', 'supervisor_filing', '[]', '自愿退出宅基地', userIds[0]],
  ]

  const appIds: number[] = []
  for (const [code, hid, pid, type, status, mats, remarks, cid] of appData) {
    const result = insertApplication.run(code, hid, pid, type, status, mats, remarks, cid)
    appIds.push(result.lastInsertRowid as number)
  }

  const insertApproval = db.prepare(
    'INSERT INTO approval_records (application_id, stage, action, opinion, operator_id) VALUES (?, ?, ?, ?, ?)'
  )
  insertApproval.run(appIds[0], 'village_review', 'approve', '符合条件同意上报', userIds[1])
  insertApproval.run(appIds[1], 'village_review', 'approve', '同意上报审批', userIds[1])
  insertApproval.run(appIds[1], 'township_review', 'approve', '材料齐全同意上报备案', userIds[2])
  insertApproval.run(appIds[4], 'village_review', 'approve', '同意上报', userIds[1])
  insertApproval.run(appIds[4], 'township_review', 'approve', '同意备案', userIds[2])

  const insertAnomaly = db.prepare(
    `INSERT INTO anomalies (anomaly_type, household_id, parcel_id, application_id, description, rectify_status, rectify_requirement, deadline, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  insertAnomaly.run('over_area', householdIds[8], parcelIds[8], null, '宅基地面积超标，实际面积300平方米超出标准', 'pending', '需在规定时间内退出超标部分', '2025-03-01', userIds[2])
  insertAnomaly.run('multi_homestead', householdIds[0], parcelIds[0], null, '疑似一户多宅，该户名下存在多块宅基地', 'in_progress', '需核实并退出多余宅基地', '2025-04-01', userIds[2])

  const insertNotice = db.prepare(
    `INSERT INTO notices (title, content, status, application_ids, deadline, created_by) VALUES (?, ?, ?, ?, ?, ?)`
  )
  insertNotice.run('2024年第四季度宅基地审批公示', '经村民委员会审核、镇人民政府审批，现将以下宅基地申请予以公示。公示期为7天，如有异议请向村委会反映。', 'active', JSON.stringify([appIds[0], appIds[1]]), '2025-01-15', userIds[1])
  insertNotice.run('2024年度宅基地退出补偿公示', '现将本年度自愿退出宅基地的农户及补偿方案予以公示，公示期为15天。', 'active', JSON.stringify([appIds[4]]), '2025-02-01', userIds[2])
}

export default db
