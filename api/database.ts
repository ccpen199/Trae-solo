import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'

const dbPath = process.env.DB_PATH || './data/app.sqlite'
const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath)

const dbDir = path.dirname(resolvedPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(resolvedPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER REFERENCES organizations(id),
    type TEXT NOT NULL CHECK(type IN ('group', 'branch', 'fleet')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('group_admin', 'branch_admin', 'dispatcher', 'safety_officer', 'api_consumer')),
    org_id INTEGER REFERENCES organizations(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    license_number TEXT,
    org_id INTEGER REFERENCES organizations(id),
    score INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sn TEXT NOT NULL UNIQUE,
    protocol TEXT NOT NULL CHECK(protocol IN ('JTT808', 'GBT35658')),
    firmware_version TEXT DEFAULT '1.0.0',
    vehicle_id INTEGER REFERENCES vehicles(id),
    org_id INTEGER REFERENCES organizations(id),
    status TEXT DEFAULT 'offline' CHECK(status IN ('online', 'offline', 'upgrading')),
    last_heartbeat DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_number TEXT NOT NULL UNIQUE,
    vin TEXT,
    org_id INTEGER REFERENCES organizations(id),
    device_id INTEGER REFERENCES devices(id),
    driver_id INTEGER REFERENCES drivers(id),
    status TEXT DEFAULT 'offline' CHECK(status IN ('online', 'offline', 'alarm')),
    lat REAL DEFAULT 0,
    lng REAL DEFAULT 0,
    speed REAL DEFAULT 0,
    heading REAL DEFAULT 0,
    last_location_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('circle', 'polygon')),
    coordinates TEXT NOT NULL,
    radius REAL,
    enabled INTEGER DEFAULT 1,
    alert_type TEXT NOT NULL CHECK(alert_type IN ('enter', 'exit', 'both')),
    org_id INTEGER REFERENCES organizations(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fence_bindings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fence_id INTEGER REFERENCES fences(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    fleet_id INTEGER REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('fence_violation', 'overspeed', 'abnormal_stop', 'fatigue', 'harsh_accel', 'harsh_brake')),
    level TEXT NOT NULL CHECK(level IN ('critical', 'warning', 'info')),
    vehicle_id INTEGER REFERENCES vehicles(id),
    driver_id INTEGER REFERENCES drivers(id),
    lat REAL,
    lng REAL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'acknowledged', 'resolved', 'dismissed')),
    processed_by INTEGER REFERENCES users(id),
    processed_at DATETIME,
    remark TEXT,
    confirm_at DATETIME,
    confirm_by INTEGER REFERENCES users(id),
    confirm_note TEXT,
    resolve_at DATETIME,
    resolve_by INTEGER REFERENCES users(id),
    resolve_note TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alert_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id INTEGER NOT NULL REFERENCES alerts(id),
    action TEXT NOT NULL CHECK(action IN ('acknowledge', 'resolve', 'dismiss', 'review')),
    processed_by INTEGER REFERENCES users(id),
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    note TEXT
);

CREATE TABLE IF NOT EXISTS trajectory_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    speed REAL DEFAULT 0,
    heading REAL DEFAULT 0,
    timestamp DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trajectory_vehicle_time ON trajectory_points(vehicle_id, timestamp);

CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    org_id INTEGER REFERENCES organizations(id),
    stops TEXT
);

CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id INTEGER REFERENCES routes(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    driver_id INTEGER REFERENCES drivers(id),
    planned_departure DATETIME,
    actual_departure DATETIME,
    planned_arrival DATETIME,
    actual_arrival DATETIME,
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'on_time', 'late', 'early', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS behavior_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_id INTEGER REFERENCES drivers(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    type TEXT NOT NULL CHECK(type IN ('harsh_accel', 'harsh_brake', 'fatigue', 'overspeed')),
    lat REAL,
    lng REAL,
    value REAL,
    timestamp DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_behavior_driver_time ON behavior_events(driver_id, timestamp);

CREATE TABLE IF NOT EXISTS upgrade_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER REFERENCES devices(id),
    from_version TEXT,
    to_version TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'failed')),
    started_at DATETIME,
    completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_hash TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    permissions TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);

CREATE TABLE IF NOT EXISTS api_call_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_key_id INTEGER REFERENCES api_keys(id),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_logs_key_time ON api_call_logs(api_key_id, timestamp);
`)

function ensureUsers() {
  const requiredUsers = [
    { username: 'admin', password: 'admin123', role: 'group_admin', orgId: 1 },
    { username: 'platform', password: 'platform123', role: 'branch_admin', orgId: 2 },
    { username: 'ops', password: 'ops123', role: 'dispatcher', orgId: 4 },
    { username: 'safety', password: 'safety123', role: 'safety_officer', orgId: 5 },
  ]
  const upsertUser = db.prepare('INSERT OR IGNORE INTO users (username, password_hash, role, org_id) VALUES (?, ?, ?, ?)')
  for (const u of requiredUsers) {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(u.username) as any
    if (!existing) {
      upsertUser.run(u.username, bcrypt.hashSync(u.password, 10), u.role, u.orgId)
    }
  }
}

function ensureAlertColumns() {
  const columns = db.prepare("PRAGMA table_info(alerts)").all() as any[]
  const columnNames = columns.map((c: any) => c.name)
  const alertsAlters = [
    ['confirm_at', 'DATETIME'],
    ['confirm_by', 'INTEGER REFERENCES users(id)'],
    ['confirm_note', 'TEXT'],
    ['resolve_at', 'DATETIME'],
    ['resolve_by', 'INTEGER REFERENCES users(id)'],
    ['resolve_note', 'TEXT'],
  ]
  for (const [col, type] of alertsAlters) {
    if (!columnNames.includes(col)) {
      db.exec(`ALTER TABLE alerts ADD COLUMN ${col} ${type}`)
    }
  }
}

function seed() {
  ensureAlertColumns()
  const orgCount = (db.prepare('SELECT COUNT(*) as count FROM organizations').get() as any).count
  if (orgCount > 0) {
    ensureUsers()
    return
  }

  db.pragma('foreign_keys = OFF')

  const insertOrg = db.prepare('INSERT INTO organizations (id, name, parent_id, type) VALUES (?, ?, ?, ?)')
  insertOrg.run(1, '华运集团', null, 'group')
  insertOrg.run(2, '东部分公司', 1, 'branch')
  insertOrg.run(3, '西部分公司', 1, 'branch')
  insertOrg.run(4, '一车队', 2, 'fleet')
  insertOrg.run(5, '二车队', 2, 'fleet')
  insertOrg.run(6, '三车队', 3, 'fleet')

  const insertUser = db.prepare('INSERT INTO users (username, password_hash, role, org_id) VALUES (?, ?, ?, ?)')
  insertUser.run('admin', bcrypt.hashSync('admin123', 10), 'group_admin', 1)
  insertUser.run('platform', bcrypt.hashSync('platform123', 10), 'branch_admin', 2)
  insertUser.run('ops', bcrypt.hashSync('ops123', 10), 'dispatcher', 4)
  insertUser.run('safety', bcrypt.hashSync('safety123', 10), 'safety_officer', 5)

  const insertDriver = db.prepare('INSERT INTO drivers (id, name, license_number, org_id, score) VALUES (?, ?, ?, ?, ?)')
  insertDriver.run(1, '张伟', '110101199001011234', 4, 92)
  insertDriver.run(2, '李强', '110101198505052345', 4, 85)
  insertDriver.run(3, '王磊', '110101199203033456', 5, 78)
  insertDriver.run(4, '刘洋', '110101198812124567', 5, 95)
  insertDriver.run(5, '陈静', '110101199107075678', 6, 88)
  insertDriver.run(6, '赵鹏', '110101198609096789', 6, 72)

  const insertDevice = db.prepare('INSERT INTO devices (id, sn, protocol, firmware_version, vehicle_id, org_id, status, last_heartbeat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  const now = new Date().toISOString()
  insertDevice.run(1, 'JTT808-SN001', 'JTT808', '2.1.0', 1, 4, 'online', now)
  insertDevice.run(2, 'JTT808-SN002', 'JTT808', '2.1.0', 2, 4, 'online', now)
  insertDevice.run(3, 'GBT35658-SN003', 'GBT35658', '1.3.2', 3, 5, 'online', now)
  insertDevice.run(4, 'GBT35658-SN004', 'GBT35658', '1.3.2', 4, 5, 'offline', now)
  insertDevice.run(5, 'JTT808-SN005', 'JTT808', '2.0.5', 5, 6, 'online', now)
  insertDevice.run(6, 'JTT808-SN006', 'JTT808', '2.1.0', 6, 6, 'offline', now)
  insertDevice.run(7, 'GBT35658-SN007', 'GBT35658', '1.3.0', 7, 4, 'online', now)
  insertDevice.run(8, 'JTT808-SN008', 'JTT808', '2.0.5', 8, 5, 'offline', now)

  const insertVehicle = db.prepare('INSERT INTO vehicles (id, plate_number, vin, org_id, device_id, driver_id, status, lat, lng, speed, heading, last_location_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  insertVehicle.run(1, '京A·12345', 'LSVAU2180N2012345', 4, 1, 1, 'online', 39.9142, 116.4074, 45.0, 90, now)
  insertVehicle.run(2, '京A·23456', 'LSVAU2180N2023456', 4, 2, 2, 'online', 39.9289, 116.3883, 60.0, 180, now)
  insertVehicle.run(3, '京A·34567', 'LSVAU2180N2034567', 5, 3, 3, 'online', 39.9042, 116.4274, 30.0, 270, now)
  insertVehicle.run(4, '京A·45678', 'LSVAU2180N2045678', 5, 4, 4, 'offline', 39.9200, 116.4100, 0, 0, now)
  insertVehicle.run(5, '京B·56789', 'LSVAU2180N2056789', 6, 5, 5, 'online', 39.9350, 116.3950, 55.0, 45, now)
  insertVehicle.run(6, '京B·67890', 'LSVAU2180N2067890', 6, 6, 6, 'offline', 39.9100, 116.4200, 0, 0, now)
  insertVehicle.run(7, '京C·11111', 'LSVAU2180N2071111', 4, 7, 1, 'alarm', 39.9250, 116.4150, 82.0, 120, now)
  insertVehicle.run(8, '京C·22222', 'LSVAU2180N2082222', 5, 8, 3, 'offline', 39.9180, 116.4320, 0, 0, now)

  const insertFence = db.prepare('INSERT INTO fences (id, name, type, coordinates, radius, enabled, alert_type, org_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  insertFence.run(1, '总部围栏', 'circle', '[{"lat":39.9142,"lng":116.4074}]', 3000, 1, 'exit', 1)
  insertFence.run(2, '东部运营区', 'circle', '[{"lat":39.9289,"lng":116.3883}]', 5000, 1, 'both', 2)
  insertFence.run(3, '西部分公司区域', 'polygon', '[{"lat":39.9350,"lng":116.3700},{"lat":39.9350,"lng":116.4200},{"lat":39.9000,"lng":116.4200},{"lat":39.9000,"lng":116.3700}]', null, 1, 'enter', 3)

  const insertFenceBinding = db.prepare('INSERT INTO fence_bindings (fence_id, vehicle_id, fleet_id) VALUES (?, ?, ?)')
  insertFenceBinding.run(1, 1, null)
  insertFenceBinding.run(1, 2, null)
  insertFenceBinding.run(2, null, 4)
  insertFenceBinding.run(3, 5, null)

  const alertTypes = ['fence_violation', 'overspeed', 'abnormal_stop', 'fatigue', 'harsh_accel', 'harsh_brake']
  const alertLevels = ['critical', 'warning', 'info']
  const alertStatuses = ['pending', 'acknowledged', 'resolved', 'dismissed']
  const insertAlert = db.prepare('INSERT INTO alerts (type, level, vehicle_id, driver_id, lat, lng, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  const alertsData: any[] = []
  for (let i = 1; i <= 22; i++) {
    const vId = ((i - 1) % 8) + 1
    const dId = ((i - 1) % 6) + 1
    const aType = alertTypes[(i - 1) % 6]
    const aLevel = aType === 'overspeed' || aType === 'fence_violation' ? 'critical' : alertLevels[(i - 1) % 3]
    const aStatus = alertStatuses[(i - 1) % 4]
    const hoursAgo = Math.floor(Math.random() * 72)
    const ts = new Date(Date.now() - hoursAgo * 3600000).toISOString()
    const lat = 39.90 + (Math.random() - 0.5) * 0.06
    const lng = 116.38 + (Math.random() - 0.5) * 0.06
    alertsData.push([aType, aLevel, vId, dId, lat, lng, aStatus, ts])
  }
  const insertAlertTxn = db.transaction((items: any[]) => {
    for (const item of items) {
      insertAlert.run(...item)
    }
  })
  insertAlertTxn(alertsData)

  const insertRoute = db.prepare('INSERT INTO routes (id, name, org_id, stops) VALUES (?, ?, ?, ?)')
  insertRoute.run(1, '1路公交', 4, '[{"name":"北京站","lat":39.9029,"lng":116.4271},{"name":"建国门","lat":39.9078,"lng":116.4355},{"name":"朝阳门","lat":39.9219,"lng":116.4345},{"name":"东直门","lat":39.9432,"lng":116.4315}]')
  insertRoute.run(2, '2路公交', 5, '[{"name":"西直门","lat":39.9416,"lng":116.3531},{"name":"阜成门","lat":39.9292,"lng":116.3587},{"name":"复兴门","lat":39.9082,"lng":116.3577},{"name":"宣武门","lat":39.8988,"lng":116.3729}]')
  insertRoute.run(3, '3路公交', 6, '[{"name":"安定门","lat":39.9478,"lng":116.4053},{"name":"鼓楼","lat":39.9412,"lng":116.3912},{"name":"地安门","lat":39.9342,"lng":116.3885},{"name":"平安里","lat":39.9285,"lng":116.3665}]')

  const insertSchedule = db.prepare('INSERT INTO schedules (route_id, vehicle_id, driver_id, planned_departure, actual_departure, planned_arrival, actual_arrival, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  const today = new Date().toISOString().split('T')[0]
  for (let r = 1; r <= 3; r++) {
    for (let t = 0; t < 5; t++) {
      const hour = 6 + t * 3
      const vId = ((r - 1) * 3 + t) % 8 + 1
      const dId = ((r - 1) * 2 + t) % 6 + 1
      const plannedDep = `${today} ${String(hour).padStart(2, '0')}:00:00`
      const delayMin = Math.floor(Math.random() * 20) - 5
      const actualDep = `${today} ${String(hour).padStart(2, '0')}:${String(Math.max(0, delayMin)).padStart(2, '0')}:00`
      const plannedArr = `${today} ${String(hour + 1).padStart(2, '0')}:00:00`
      const arrDelay = delayMin + Math.floor(Math.random() * 10)
      const actualArr = `${today} ${String(hour + 1).padStart(2, '0')}:${String(Math.max(0, Math.min(59, arrDelay))).padStart(2, '0')}:00`
      let status = 'on_time'
      if (Math.abs(delayMin) <= 3) status = 'on_time'
      else if (delayMin > 3) status = 'late'
      else status = 'early'
      if (t === 4 && r === 1) status = 'cancelled'
      insertSchedule.run(r, vId, dId, plannedDep, actualDep, plannedArr, actualArr, status)
    }
  }

  const insertBehavior = db.prepare('INSERT INTO behavior_events (driver_id, vehicle_id, type, lat, lng, value, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
  const behaviorTypes = ['harsh_accel', 'harsh_brake', 'fatigue', 'overspeed']
  const behaviorsData: any[] = []
  for (let i = 1; i <= 35; i++) {
    const dId = ((i - 1) % 6) + 1
    const vId = ((i - 1) % 8) + 1
    const bType = behaviorTypes[(i - 1) % 4]
    const hoursAgo = Math.floor(Math.random() * 168)
    const ts = new Date(Date.now() - hoursAgo * 3600000).toISOString()
    const lat = 39.90 + (Math.random() - 0.5) * 0.06
    const lng = 116.38 + (Math.random() - 0.5) * 0.06
    let value = 0
    if (bType === 'harsh_accel') value = 2.5 + Math.random() * 3
    else if (bType === 'harsh_brake') value = -(3 + Math.random() * 4)
    else if (bType === 'overspeed') value = 80 + Math.random() * 40
    else if (bType === 'fatigue') value = 30 + Math.random() * 60
    behaviorsData.push([dId, vId, bType, lat, lng, value, ts])
  }
  const insertBehaviorTxn = db.transaction((items: any[]) => {
    for (const item of items) {
      insertBehavior.run(...item)
    }
  })
  insertBehaviorTxn(behaviorsData)

  const insertApiKey = db.prepare('INSERT INTO api_keys (id, key_hash, name, permissions, created_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
  insertApiKey.run(1, bcrypt.hashSync('vmk_live_abc123def456', 10), '生产环境密钥', '["vehicles:read","alerts:read"]', 1, new Date().toISOString(), new Date(Date.now() + 365 * 86400000).toISOString())
  insertApiKey.run(2, bcrypt.hashSync('vmk_test_xyz789', 10), '测试环境密钥', '["vehicles:read","trajectory:read"]', 1, new Date().toISOString(), new Date(Date.now() + 180 * 86400000).toISOString())

  const insertTrajectory = db.prepare('INSERT INTO trajectory_points (vehicle_id, lat, lng, speed, heading, timestamp) VALUES (?, ?, ?, ?, ?, ?)')
  const trajectoryTxn = db.transaction(() => {
    for (let vId = 1; vId <= 8; vId++) {
      const vehicle = (db.prepare('SELECT lat, lng, speed, heading FROM vehicles WHERE id = ?').get(vId)) as any
      let baseLat = vehicle?.lat || 39.9142
      let baseLng = vehicle?.lng || 116.4074
      const baseSpeed = vehicle?.speed || 40
      const baseHeading = vehicle?.heading || 90
      const nowMs = Date.now()
      const pointsCount = 288
      for (let p = pointsCount; p >= 0; p--) {
        const ts = new Date(nowMs - p * 300000).toISOString()
        const latOffset = (Math.random() - 0.5) * 0.002
        const lngOffset = (Math.random() - 0.5) * 0.002
        const lat = baseLat + latOffset + (p < 200 ? (200 - p) * 0.00005 : 0)
        const lng = baseLng + lngOffset + (p < 200 ? (200 - p) * 0.00005 : 0)
        const speed = vId === 4 || vId === 6 || vId === 8 ? 0 : Math.max(0, baseSpeed + (Math.random() - 0.5) * 20)
        const heading = (baseHeading + (Math.random() - 0.5) * 30 + 360) % 360
        insertTrajectory.run(vId, Math.round(lat * 100000) / 100000, Math.round(lng * 100000) / 100000, Math.round(speed * 10) / 10, Math.round(heading * 10) / 10, ts)
      }
    }
  })
  trajectoryTxn()

  db.pragma('foreign_keys = ON')
}

seed()

export default db
