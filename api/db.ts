import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, '../data/fishing.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function initDb(): void {
  const d = getDb()

  d.exec(`
    CREATE TABLE IF NOT EXISTS vessels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      owner_name TEXT NOT NULL,
      owner_phone TEXT DEFAULT '',
      vessel_type TEXT NOT NULL,
      fishing_type TEXT NOT NULL,
      gps_device TEXT DEFAULT '',
      gps_status TEXT DEFAULT '正常',
      safety_device TEXT DEFAULT '',
      safety_status TEXT DEFAULT '正常',
      work_permit TEXT DEFAULT '',
      work_permit_status TEXT DEFAULT '有效',
      work_permit_expiry TEXT DEFAULT '',
      status TEXT DEFAULT '在港',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vessel_id INTEGER NOT NULL,
      cert_type TEXT NOT NULL,
      cert_number TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      status TEXT DEFAULT '有效',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (vessel_id) REFERENCES vessels(id)
    );

    CREATE TABLE IF NOT EXISTS declarations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vessel_id INTEGER NOT NULL,
      sea_area TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      expected_return TEXT NOT NULL,
      work_permit TEXT DEFAULT '',
      work_permit_status TEXT DEFAULT '有效',
      insurance_status TEXT DEFAULT '已投保',
      status TEXT DEFAULT '待核验',
      reject_reason TEXT DEFAULT '',
      verified_by TEXT DEFAULT '',
      approved_by TEXT DEFAULT '',
      verified_at TEXT,
      approved_at TEXT,
      actual_return TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (vessel_id) REFERENCES vessels(id)
    );

    CREATE TABLE IF NOT EXISTS declaration_crews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      declaration_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      id_number TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT DEFAULT '',
      FOREIGN KEY (declaration_id) REFERENCES declarations(id)
    );

    CREATE TABLE IF NOT EXISTS track_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vessel_id INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      speed REAL DEFAULT 0,
      heading REAL DEFAULT 0,
      recorded_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (vessel_id) REFERENCES vessels(id)
    );

    CREATE TABLE IF NOT EXISTS fences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      fence_type TEXT NOT NULL,
      coordinates TEXT NOT NULL,
      status TEXT DEFAULT '启用',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vessel_id INTEGER NOT NULL,
      fence_id INTEGER,
      alert_type TEXT NOT NULL,
      severity TEXT DEFAULT '警告',
      message TEXT NOT NULL,
      status TEXT DEFAULT '未处理',
      triggered_at TEXT DEFAULT (datetime('now','localtime')),
      resolved_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (vessel_id) REFERENCES vessels(id),
      FOREIGN KEY (fence_id) REFERENCES fences(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vessel_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT '待处置',
      resolution TEXT DEFAULT '',
      occurred_at TEXT DEFAULT (datetime('now','localtime')),
      resolved_at TEXT,
      created_by TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (vessel_id) REFERENCES vessels(id)
    );

    CREATE TABLE IF NOT EXISTS event_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      recipient TEXT NOT NULL,
      method TEXT NOT NULL,
      content TEXT DEFAULT '',
      sent_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (event_id) REFERENCES events(id)
    );

    CREATE TABLE IF NOT EXISTS event_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      respondent TEXT NOT NULL,
      content TEXT DEFAULT '',
      received_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (event_id) REFERENCES events(id)
    );
  `)

  seedData(d)
}

function seedData(d: Database.Database): void {
  const vesselCount = (d.prepare('SELECT COUNT(*) AS c FROM vessels').get() as { c: number }).c
  if (vesselCount > 0) return

  const insertVessel = d.prepare(`
    INSERT INTO vessels (name, code, owner_name, owner_phone, vessel_type, fishing_type, gps_device, gps_status, safety_device, safety_status, work_permit, work_permit_status, work_permit_expiry, status)
    VALUES (@name, @code, @owner_name, @owner_phone, @vessel_type, @fishing_type, @gps_device, @gps_status, @safety_device, @safety_status, @work_permit, @work_permit_status, @work_permit_expiry, @status)
  `)

  const vessels = [
    { name: '闽东渔001', code: 'MD-YU-001', owner_name: '张伟', owner_phone: '13800001001', vessel_type: '拖网', fishing_type: '底拖网', gps_device: '北斗BD-300', gps_status: '正常', safety_device: '救生筏×2', safety_status: '正常', work_permit: 'WP-2026-001', work_permit_status: '有效', work_permit_expiry: '2027-01-01', status: '在航' },
    { name: '闽东渔002', code: 'MD-YU-002', owner_name: '李明', owner_phone: '13800001002', vessel_type: '围网', fishing_type: '灯光围网', gps_device: '北斗BD-300', gps_status: '正常', safety_device: '救生筏×1', safety_status: '正常', work_permit: 'WP-2026-002', work_permit_status: '有效', work_permit_expiry: '2027-02-15', status: '在航' },
    { name: '闽东渔003', code: 'MD-YU-003', owner_name: '王强', owner_phone: '13800001003', vessel_type: '钓具', fishing_type: '延绳钓', gps_device: '北斗BD-200', gps_status: '正常', safety_device: '救生衣×6', safety_status: '正常', work_permit: 'WP-2026-003', work_permit_status: '有效', work_permit_expiry: '2026-12-31', status: '在港' },
    { name: '闽东渔005', code: 'MD-YU-005', owner_name: '赵刚', owner_phone: '13800001005', vessel_type: '刺网', fishing_type: '流刺网', gps_device: '北斗BD-200', gps_status: '离线', safety_device: '救生筏×1', safety_status: '正常', work_permit: 'WP-2026-004', work_permit_status: '有效', work_permit_expiry: '2027-03-20', status: '在航' },
    { name: '闽东渔006', code: 'MD-YU-006', owner_name: '张伟', owner_phone: '13800001001', vessel_type: '笼壶', fishing_type: '蟹笼', gps_device: '北斗BD-300', gps_status: '正常', safety_device: '救生筏×1', safety_status: '过期', work_permit: 'WP-2026-005', work_permit_status: '有效', work_permit_expiry: '2026-08-15', status: '在港' },
    { name: '闽东渔008', code: 'MD-YU-008', owner_name: '陈勇', owner_phone: '13800001008', vessel_type: '拖网', fishing_type: '底拖网', gps_device: '北斗BD-300', gps_status: '正常', safety_device: '救生筏×2', safety_status: '正常', work_permit: 'WP-2026-006', work_permit_status: '有效', work_permit_expiry: '2027-05-10', status: '维修' },
    { name: '闽东渔009', code: 'MD-YU-009', owner_name: '李明', owner_phone: '13800001002', vessel_type: '钓具', fishing_type: '手钓', gps_device: '', gps_status: '离线', safety_device: '救生衣×4', safety_status: '正常', work_permit: '', work_permit_status: '无效', work_permit_expiry: '', status: '在港' },
    { name: '闽东渔010', code: 'MD-YU-010', owner_name: '刘洋', owner_phone: '13800001010', vessel_type: '围网', fishing_type: '灯光围网', gps_device: '北斗BD-300', gps_status: '正常', safety_device: '救生筏×2', safety_status: '正常', work_permit: 'WP-2026-008', work_permit_status: '有效', work_permit_expiry: '2027-06-30', status: '在航' },
  ]

  const vesselIds: number[] = []
  for (const v of vessels) {
    const r = insertVessel.run(v)
    vesselIds.push(Number(r.lastInsertRowid))
  }

  const insertCert = d.prepare(`
    INSERT INTO certificates (vessel_id, cert_type, cert_number, issue_date, expiry_date, status)
    VALUES (@vessel_id, @cert_type, @cert_number, @issue_date, @expiry_date, @status)
  `)

  const certificates = [
    { vessel_id: vesselIds[0], cert_type: '渔业捕捞许可证', cert_number: 'FCL-2024-001', issue_date: '2024-01-15', expiry_date: '2026-01-14', status: '有效' },
    { vessel_id: vesselIds[0], cert_type: '船舶检验证书', cert_number: 'CJ-2024-001', issue_date: '2024-03-01', expiry_date: '2025-02-28', status: '有效' },
    { vessel_id: vesselIds[1], cert_type: '渔业捕捞许可证', cert_number: 'FCL-2024-002', issue_date: '2024-02-10', expiry_date: '2026-02-09', status: '有效' },
    { vessel_id: vesselIds[1], cert_type: '船舶检验证书', cert_number: 'CJ-2023-002', issue_date: '2023-06-01', expiry_date: '2025-05-31', status: '即将过期' },
    { vessel_id: vesselIds[2], cert_type: '渔业捕捞许可证', cert_number: 'FCL-2023-003', issue_date: '2023-05-20', expiry_date: '2025-05-19', status: '即将过期' },
    { vessel_id: vesselIds[3], cert_type: '渔业捕捞许可证', cert_number: 'FCL-2024-005', issue_date: '2024-04-10', expiry_date: '2026-04-09', status: '有效' },
    { vessel_id: vesselIds[3], cert_type: '船舶检验证书', cert_number: 'CJ-2024-005', issue_date: '2024-05-01', expiry_date: '2026-04-30', status: '有效' },
    { vessel_id: vesselIds[4], cert_type: '渔业捕捞许可证', cert_number: 'FCL-2022-006', issue_date: '2022-08-01', expiry_date: '2024-07-31', status: '已过期' },
    { vessel_id: vesselIds[5], cert_type: '渔业捕捞许可证', cert_number: 'FCL-2024-008', issue_date: '2024-01-10', expiry_date: '2026-01-09', status: '有效' },
    { vessel_id: vesselIds[5], cert_type: '船舶检验证书', cert_number: 'CJ-2024-008', issue_date: '2024-06-15', expiry_date: '2026-06-14', status: '有效' },
    { vessel_id: vesselIds[6], cert_type: '渔业捕捞许可证', cert_number: 'FCL-2023-009', issue_date: '2023-09-01', expiry_date: '2025-08-31', status: '即将过期' },
    { vessel_id: vesselIds[7], cert_type: '渔业捕捞许可证', cert_number: 'FCL-2024-010', issue_date: '2024-07-01', expiry_date: '2026-06-30', status: '有效' },
  ]

  for (const c of certificates) {
    insertCert.run(c)
  }

  const insertDecl = d.prepare(`
    INSERT INTO declarations (vessel_id, sea_area, departure_time, expected_return, work_permit, work_permit_status, insurance_status, status, reject_reason, verified_by, approved_by, verified_at, approved_at, actual_return)
    VALUES (@vessel_id, @sea_area, @departure_time, @expected_return, @work_permit, @work_permit_status, @insurance_status, @status, @reject_reason, @verified_by, @approved_by, @verified_at, @approved_at, @actual_return)
  `)

  const declarations = [
    { vessel_id: vesselIds[0], sea_area: '东海渔场', departure_time: '2026-05-20 06:00', expected_return: '2026-05-28 18:00', work_permit: 'WP-2026-001', work_permit_status: '有效', insurance_status: '已投保', status: '已通过', reject_reason: '', verified_by: '核查员甲', approved_by: '审批员甲', verified_at: '2026-05-19 14:00', approved_at: '2026-05-19 16:00', actual_return: null },
    { vessel_id: vesselIds[1], sea_area: '南海渔场', departure_time: '2026-05-22 05:00', expected_return: '2026-05-30 18:00', work_permit: 'WP-2026-002', work_permit_status: '有效', insurance_status: '已投保', status: '已通过', reject_reason: '', verified_by: '核查员乙', approved_by: '审批员乙', verified_at: '2026-05-21 10:00', approved_at: '2026-05-21 14:00', actual_return: null },
    { vessel_id: vesselIds[2], sea_area: '黄海渔场', departure_time: '2026-05-25 07:00', expected_return: '2026-06-02 18:00', work_permit: 'WP-2026-003', work_permit_status: '有效', insurance_status: '已投保', status: '待核验', reject_reason: '', verified_by: '', approved_by: '', verified_at: null, approved_at: null, actual_return: null },
    { vessel_id: vesselIds[3], sea_area: '东海渔场', departure_time: '2026-05-23 06:00', expected_return: '2026-05-29 18:00', work_permit: 'WP-2026-004', work_permit_status: '有效', insurance_status: '已投保', status: '已通过', reject_reason: '', verified_by: '核查员甲', approved_by: '审批员甲', verified_at: '2026-05-22 11:00', approved_at: '2026-05-22 15:00', actual_return: null },
    { vessel_id: vesselIds[4], sea_area: '南海渔场', departure_time: '2026-05-15 06:00', expected_return: '2026-05-22 18:00', work_permit: 'WP-2026-005', work_permit_status: '有效', insurance_status: '未投保', status: '已驳回', reject_reason: '保险未投保，不符合出航条件', verified_by: '核查员乙', approved_by: '', verified_at: '2026-05-14 09:00', approved_at: null, actual_return: null },
    { vessel_id: vesselIds[5], sea_area: '渤海渔场', departure_time: '2026-05-18 07:00', expected_return: '2026-05-25 18:00', work_permit: 'WP-2026-006', work_permit_status: '有效', insurance_status: '已投保', status: '已返港', reject_reason: '', verified_by: '核查员甲', approved_by: '审批员甲', verified_at: '2026-05-17 10:00', approved_at: '2026-05-17 14:00', actual_return: '2026-05-24 16:00' },
    { vessel_id: vesselIds[6], sea_area: '北部湾渔场', departure_time: '2026-05-26 06:00', expected_return: '2026-06-03 18:00', work_permit: 'WP-2026-007', work_permit_status: '有效', insurance_status: '已投保', status: '已核验', reject_reason: '', verified_by: '核查员乙', approved_by: '', verified_at: '2026-05-25 15:00', approved_at: null, actual_return: null },
    { vessel_id: vesselIds[7], sea_area: '东海渔场', departure_time: '2026-05-24 05:00', expected_return: '2026-05-31 18:00', work_permit: 'WP-2026-008', work_permit_status: '有效', insurance_status: '已投保', status: '已通过', reject_reason: '', verified_by: '核查员甲', approved_by: '审批员乙', verified_at: '2026-05-23 11:00', approved_at: '2026-05-23 16:00', actual_return: null },
    { vessel_id: vesselIds[0], sea_area: '黄海渔场', departure_time: '2026-05-01 06:00', expected_return: '2026-05-10 18:00', work_permit: 'WP-2026-009', work_permit_status: '有效', insurance_status: '已投保', status: '已返港', reject_reason: '', verified_by: '核查员甲', approved_by: '审批员甲', verified_at: '2026-04-30 10:00', approved_at: '2026-04-30 15:00', actual_return: '2026-05-09 17:00' },
    { vessel_id: vesselIds[1], sea_area: '南海渔场', departure_time: '2026-04-10 05:00', expected_return: '2026-04-20 18:00', work_permit: 'WP-2026-010', work_permit_status: '有效', insurance_status: '已投保', status: '已返港', reject_reason: '', verified_by: '核查员乙', approved_by: '审批员乙', verified_at: '2026-04-09 11:00', approved_at: '2026-04-09 15:00', actual_return: '2026-04-19 15:00' },
  ]

  const declIds: number[] = []
  for (const decl of declarations) {
    const r = insertDecl.run(decl)
    declIds.push(Number(r.lastInsertRowid))
  }

  const insertCrew = d.prepare(`
    INSERT INTO declaration_crews (declaration_id, name, id_number, role, phone)
    VALUES (@declaration_id, @name, @id_number, @role, @phone)
  `)

  const crews = [
    { declaration_id: declIds[0], name: '张伟', id_number: '350100198001011234', role: '船长', phone: '13800001001' },
    { declaration_id: declIds[0], name: '陈大海', id_number: '350100198505052345', role: '大副', phone: '13800002001' },
    { declaration_id: declIds[0], name: '林小波', id_number: '350100199001013456', role: '水手', phone: '13800003001' },
    { declaration_id: declIds[1], name: '李明', id_number: '350200198202021234', role: '船长', phone: '13800001002' },
    { declaration_id: declIds[1], name: '黄海波', id_number: '350200198706062345', role: '大副', phone: '13800002002' },
    { declaration_id: declIds[1], name: '吴小鱼', id_number: '350200199203033456', role: '水手', phone: '13800003002' },
    { declaration_id: declIds[1], name: '郑浪', id_number: '350200199304044567', role: '水手', phone: '13800003003' },
    { declaration_id: declIds[2], name: '王强', id_number: '350300198303031234', role: '船长', phone: '13800001003' },
    { declaration_id: declIds[2], name: '何涛', id_number: '350300198807072345', role: '大副', phone: '13800002003' },
    { declaration_id: declIds[3], name: '赵刚', id_number: '350400198404041234', role: '船长', phone: '13800001005' },
    { declaration_id: declIds[3], name: '孙洋', id_number: '350400198908082345', role: '大副', phone: '13800002004' },
    { declaration_id: declIds[3], name: '周帆', id_number: '350400199309093456', role: '水手', phone: '13800003004' },
    { declaration_id: declIds[4], name: '张伟', id_number: '350100198001011234', role: '船长', phone: '13800001001' },
    { declaration_id: declIds[5], name: '陈勇', id_number: '350500198606061234', role: '船长', phone: '13800001008' },
    { declaration_id: declIds[5], name: '马远航', id_number: '350500199101012345', role: '大副', phone: '13800002005' },
    { declaration_id: declIds[6], name: '李明', id_number: '350200198202021234', role: '船长', phone: '13800001002' },
    { declaration_id: declIds[6], name: '徐海', id_number: '350200199505052345', role: '水手', phone: '13800003005' },
    { declaration_id: declIds[7], name: '刘洋', id_number: '350600198707071234', role: '船长', phone: '13800001010' },
    { declaration_id: declIds[7], name: '杨帆', id_number: '350600199208082345', role: '大副', phone: '13800002006' },
    { declaration_id: declIds[7], name: '许波', id_number: '350600199609093456', role: '水手', phone: '13800003006' },
    { declaration_id: declIds[7], name: '蔡海', id_number: '350600199710104567', role: '水手', phone: '13800003007' },
    { declaration_id: declIds[8], name: '张伟', id_number: '350100198001011234', role: '船长', phone: '13800001001' },
    { declaration_id: declIds[8], name: '陈大海', id_number: '350100198505052345', role: '大副', phone: '13800002001' },
    { declaration_id: declIds[9], name: '李明', id_number: '350200198202021234', role: '船长', phone: '13800001002' },
    { declaration_id: declIds[9], name: '黄海波', id_number: '350200198706062345', role: '大副', phone: '13800002002' },
  ]

  for (const c of crews) {
    insertCrew.run(c)
  }

  const insertTrack = d.prepare(`
    INSERT INTO track_points (vessel_id, latitude, longitude, speed, heading, recorded_at)
    VALUES (@vessel_id, @latitude, @longitude, @speed, @heading, @recorded_at)
  `)

  const now = new Date()
  const trackPoints: Array<{ vessel_id: number; latitude: number; longitude: number; speed: number; heading: number; recorded_at: string }> = []

  const atSeaVessels = [
    { id: vesselIds[0], baseLat: 28.5, baseLng: 123.5 },
    { id: vesselIds[1], baseLat: 22.0, baseLng: 116.5 },
    { id: vesselIds[3], baseLat: 29.0, baseLng: 124.0 },
    { id: vesselIds[7], baseLat: 28.8, baseLng: 123.8 },
  ]

  for (const v of atSeaVessels) {
    for (let i = 0; i < 14; i++) {
      const t = new Date(now.getTime() - i * 3600000 * 2)
      const lat = v.baseLat + (Math.random() - 0.5) * 0.3
      const lng = v.baseLng + (Math.random() - 0.5) * 0.3
      trackPoints.push({
        vessel_id: v.id,
        latitude: Math.round(lat * 10000) / 10000,
        longitude: Math.round(lng * 10000) / 10000,
        speed: Math.round((Math.random() * 8 + 2) * 10) / 10,
        heading: Math.round(Math.random() * 360),
        recorded_at: t.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ''),
      })
    }
  }

  const returnedVessels = [
    { id: vesselIds[5], baseLat: 26.0, baseLng: 119.5 },
    { id: vesselIds[0], baseLat: 27.5, baseLng: 121.0 },
  ]

  for (const v of returnedVessels) {
    for (let i = 0; i < 8; i++) {
      const t = new Date(now.getTime() - (i + 14) * 3600000 * 2)
      const lat = v.baseLat + (Math.random() - 0.5) * 0.3
      const lng = v.baseLng + (Math.random() - 0.5) * 0.3
      trackPoints.push({
        vessel_id: v.id,
        latitude: Math.round(lat * 10000) / 10000,
        longitude: Math.round(lng * 10000) / 10000,
        speed: Math.round((Math.random() * 6 + 1) * 10) / 10,
        heading: Math.round(Math.random() * 360),
        recorded_at: t.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ''),
      })
    }
  }

  for (const tp of trackPoints) {
    insertTrack.run(tp)
  }

  const insertFence = d.prepare(`
    INSERT INTO fences (name, fence_type, coordinates, status)
    VALUES (@name, @fence_type, @coordinates, @status)
  `)

  const fences = [
    { name: '东海禁渔区A', fence_type: '禁渔区', coordinates: JSON.stringify([{ lat: 28.0, lng: 122.0 }, { lat: 28.0, lng: 124.0 }, { lat: 30.0, lng: 124.0 }, { lat: 30.0, lng: 122.0 }]), status: '启用' },
    { name: '南海禁渔区B', fence_type: '禁渔区', coordinates: JSON.stringify([{ lat: 21.0, lng: 115.0 }, { lat: 21.0, lng: 118.0 }, { lat: 23.0, lng: 118.0 }, { lat: 23.0, lng: 115.0 }]), status: '启用' },
    { name: '黄海限制作业区C', fence_type: '限制作业区', coordinates: JSON.stringify([{ lat: 34.0, lng: 120.0 }, { lat: 34.0, lng: 122.0 }, { lat: 36.0, lng: 122.0 }, { lat: 36.0, lng: 120.0 }]), status: '启用' },
    { name: '渤海限制作业区D', fence_type: '限制作业区', coordinates: JSON.stringify([{ lat: 38.0, lng: 119.0 }, { lat: 38.0, lng: 121.0 }, { lat: 40.0, lng: 121.0 }, { lat: 40.0, lng: 119.0 }]), status: '停用' },
  ]

  const fenceIds: number[] = []
  for (const f of fences) {
    const r = insertFence.run(f)
    fenceIds.push(Number(r.lastInsertRowid))
  }

  const insertAlert = d.prepare(`
    INSERT INTO alerts (vessel_id, fence_id, alert_type, severity, message, status, triggered_at, resolved_at)
    VALUES (@vessel_id, @fence_id, @alert_type, @severity, @message, @status, @triggered_at, @resolved_at)
  `)

  const alerts = [
    { vessel_id: vesselIds[0], fence_id: fenceIds[0], alert_type: '越界', severity: '严重', message: '闽东渔001进入东海禁渔区A', status: '未处理', triggered_at: '2026-05-27 08:30', resolved_at: null },
    { vessel_id: vesselIds[1], fence_id: fenceIds[1], alert_type: '禁渔区靠近', severity: '警告', message: '闽东渔002距南海禁渔区B不足2海里', status: '未处理', triggered_at: '2026-05-27 10:15', resolved_at: null },
    { vessel_id: vesselIds[3], fence_id: null, alert_type: '超时未返', severity: '严重', message: '闽东渔005预计返港时间已过6小时', status: '未处理', triggered_at: '2026-05-28 00:00', resolved_at: null },
    { vessel_id: vesselIds[4], fence_id: null, alert_type: '设备离线', severity: '警告', message: '闽东渔006北斗设备离线超过12小时', status: '已处理', triggered_at: '2026-05-26 14:00', resolved_at: '2026-05-26 18:00' },
    { vessel_id: vesselIds[6], fence_id: null, alert_type: '设备离线', severity: '警告', message: '闽东渔009北斗设备离线', status: '未处理', triggered_at: '2026-05-27 22:00', resolved_at: null },
    { vessel_id: vesselIds[0], fence_id: null, alert_type: '超时未返', severity: '警告', message: '闽东渔001出海已超过预期返港时间', status: '已处理', triggered_at: '2026-05-26 18:00', resolved_at: '2026-05-26 20:00' },
    { vessel_id: vesselIds[3], fence_id: fenceIds[0], alert_type: '禁渔区靠近', severity: '警告', message: '闽东渔005距东海禁渔区A不足5海里', status: '已处理', triggered_at: '2026-05-25 09:00', resolved_at: '2026-05-25 12:00' },
    { vessel_id: vesselIds[7], fence_id: null, alert_type: '越界', severity: '严重', message: '闽东渔010航迹偏离申报海域', status: '未处理', triggered_at: '2026-05-28 06:00', resolved_at: null },
  ]

  for (const a of alerts) {
    insertAlert.run(a)
  }

  const insertEvent = d.prepare(`
    INSERT INTO events (vessel_id, event_type, title, description, status, resolution, occurred_at, resolved_at, created_by)
    VALUES (@vessel_id, @event_type, @title, @description, @status, @resolution, @occurred_at, @resolved_at, @created_by)
  `)

  const events = [
    { vessel_id: vesselIds[0], event_type: '越界', title: '闽东渔001进入禁渔区', description: '该船于5月27日08:30进入东海禁渔区A，需立即处置', status: '待处置', resolution: '', occurred_at: '2026-05-27 08:30', resolved_at: null, created_by: '系统' },
    { vessel_id: vesselIds[3], event_type: '失联', title: '闽东渔005通信中断', description: '该船北斗设备离线，无法取得联系，预计返港时间已过', status: '待处置', resolution: '', occurred_at: '2026-05-27 22:00', resolved_at: null, created_by: '系统' },
    { vessel_id: vesselIds[1], event_type: '恶劣天气', title: '南海渔场台风预警', description: '南海渔场附近热带低压增强，可能形成台风，影响在航船只', status: '处置中', resolution: '', occurred_at: '2026-05-27 14:00', resolved_at: null, created_by: '气象台' },
    { vessel_id: vesselIds[4], event_type: '证书过期', title: '闽东渔006捕捞许可证过期', description: '该船渔业捕捞许可证已于2024年7月31日过期，需续办', status: '已处置', resolution: '已通知船主续办，目前禁止出航', occurred_at: '2026-05-20 09:00', resolved_at: '2026-05-21 10:00', created_by: '系统' },
    { vessel_id: vesselIds[3], event_type: '违规作业', title: '闽东渔005疑似违规作业', description: '该船航迹显示在禁渔区边缘长时间停留，疑似进行捕捞作业', status: '待处置', resolution: '', occurred_at: '2026-05-25 06:00', resolved_at: null, created_by: '监控员甲' },
    { vessel_id: vesselIds[7], event_type: '越界', title: '闽东渔010航迹偏离', description: '该船航迹偏离申报的东海渔场作业区域，需核实情况', status: '处置中', resolution: '', occurred_at: '2026-05-28 06:00', resolved_at: null, created_by: '系统' },
  ]

  const eventIds: number[] = []
  for (const e of events) {
    const r = insertEvent.run(e)
    eventIds.push(Number(r.lastInsertRowid))
  }

  const insertNotif = d.prepare(`
    INSERT INTO event_notifications (event_id, recipient, method, content)
    VALUES (@event_id, @recipient, @method, @content)
  `)

  const notifications = [
    { event_id: eventIds[0], recipient: '张伟', method: '短信', content: '您的渔船闽东渔001已进入禁渔区，请立即驶离' },
    { event_id: eventIds[0], recipient: '渔政值班室', method: '系统', content: '闽东渔001进入东海禁渔区A，请关注' },
    { event_id: eventIds[1], recipient: '赵刚', method: '短信', content: '您的渔船闽东渔005通信中断，请确认安全' },
    { event_id: eventIds[1], recipient: '渔政值班室', method: '系统', content: '闽东渔005失联，启动应急联络' },
    { event_id: eventIds[2], recipient: '李明', method: '短信', content: '南海渔场台风预警，请注意避风' },
    { event_id: eventIds[2], recipient: '刘洋', method: '短信', content: '南海渔场台风预警，请注意避风' },
    { event_id: eventIds[2], recipient: '所有南海在航船只', method: '广播', content: '南海渔场台风预警，请做好避风准备' },
    { event_id: eventIds[3], recipient: '张伟', method: '短信', content: '闽东渔006捕捞许可证已过期，请尽快续办' },
    { event_id: eventIds[4], recipient: '赵刚', method: '短信', content: '闽东渔005疑似在禁渔区边缘作业，请确认' },
    { event_id: eventIds[5], recipient: '刘洋', method: '短信', content: '闽东渔010航迹偏离，请确认作业位置' },
    { event_id: eventIds[5], recipient: '渔政值班室', method: '系统', content: '闽东渔010航迹偏离申报海域，请核实' },
  ]

  for (const n of notifications) {
    insertNotif.run(n)
  }

  const insertReceipt = d.prepare(`
    INSERT INTO event_receipts (event_id, respondent, content)
    VALUES (@event_id, @respondent, @content)
  `)

  const receipts = [
    { event_id: eventIds[2], respondent: '李明', content: '已收到台风预警，正在返航途中' },
    { event_id: eventIds[2], respondent: '刘洋', content: '已收到预警，准备就近避风' },
    { event_id: eventIds[3], respondent: '张伟', content: '已了解，将尽快办理续期手续' },
    { event_id: eventIds[5], respondent: '刘洋', content: '因追逐鱼群偏离，已调整航向返回' },
  ]

  for (const r of receipts) {
    insertReceipt.run(r)
  }
}
