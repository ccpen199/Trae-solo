import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, '..', 'backend', 'data', 'app.sqlite')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initializeTables(db)
  }
  return db
}

function initializeTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      operator TEXT NOT NULL,
      device_count INTEGER DEFAULT 0,
      electricity_price REAL NOT NULL DEFAULT 0.0,
      service_fee REAL NOT NULL DEFAULT 0.0,
      business_hours_start TEXT DEFAULT '00:00',
      business_hours_end TEXT DEFAULT '23:59',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      model TEXT NOT NULL,
      power REAL NOT NULL DEFAULT 0.0,
      online INTEGER DEFAULT 1,
      fault_code TEXT,
      last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );

    CREATE TABLE IF NOT EXISTS device_ports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      port_number INTEGER NOT NULL,
      status TEXT DEFAULT 'idle',
      connector_type TEXT DEFAULT 'AC',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      port_id INTEGER NOT NULL,
      site_id INTEGER NOT NULL,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      duration REAL DEFAULT 0.0,
      energy REAL DEFAULT 0.0,
      cost REAL DEFAULT 0.0,
      stop_reason TEXT,
      refund_status TEXT DEFAULT 'none',
      refund_amount REAL DEFAULT 0.0,
      status TEXT DEFAULT 'charging',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id),
      FOREIGN KEY (port_id) REFERENCES device_ports(id),
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER,
      site_id INTEGER,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      description TEXT,
      assignee TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      assigned_at DATETIME,
      resolved_at DATETIME,
      resolution TEXT,
      FOREIGN KEY (device_id) REFERENCES devices(id),
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );

    CREATE TABLE IF NOT EXISTS work_order_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER NOT NULL,
      photo_url TEXT NOT NULL,
      description TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id)
    );

    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      share_ratio REAL NOT NULL,
      contact TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );

    CREATE TABLE IF NOT EXISTS revenue_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      partner_id INTEGER NOT NULL,
      site_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      electricity_cost REAL NOT NULL DEFAULT 0.0,
      partner_share REAL NOT NULL DEFAULT 0.0,
      platform_share REAL NOT NULL DEFAULT 0.0,
      refund_deduction REAL DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (partner_id) REFERENCES partners(id),
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );
  `)
}

export function seedDatabase(): void {
  const db = getDb()

  const count = (db.prepare('SELECT COUNT(*) as cnt FROM sites').get() as { cnt: number }).cnt
  if (count > 0) return

  const insertSite = db.prepare(`
    INSERT INTO sites (name, address, operator, device_count, electricity_price, service_fee, business_hours_start, business_hours_end, status)
    VALUES (@name, @address, @operator, @device_count, @electricity_price, @service_fee, @business_hours_start, @business_hours_end, @status)
  `)

  const insertDevice = db.prepare(`
    INSERT INTO devices (site_id, name, model, power, online, fault_code, last_heartbeat, status)
    VALUES (@site_id, @name, @model, @power, @online, @fault_code, @last_heartbeat, @status)
  `)

  const insertPort = db.prepare(`
    INSERT INTO device_ports (device_id, port_number, status, connector_type)
    VALUES (@device_id, @port_number, @status, @connector_type)
  `)

  const insertOrder = db.prepare(`
    INSERT INTO orders (device_id, port_id, site_id, start_time, end_time, duration, energy, cost, stop_reason, refund_status, refund_amount, status)
    VALUES (@device_id, @port_id, @site_id, @start_time, @end_time, @duration, @energy, @cost, @stop_reason, @refund_status, @refund_amount, @status)
  `)

  const insertWorkOrder = db.prepare(`
    INSERT INTO work_orders (device_id, site_id, type, status, priority, description, assignee, assigned_at, resolved_at, resolution)
    VALUES (@device_id, @site_id, @type, @status, @priority, @description, @assignee, @assigned_at, @resolved_at, @resolution)
  `)

  const insertPhoto = db.prepare(`
    INSERT INTO work_order_photos (work_order_id, photo_url, description)
    VALUES (@work_order_id, @photo_url, @description)
  `)

  const insertPartner = db.prepare(`
    INSERT INTO partners (site_id, name, share_ratio, contact)
    VALUES (@site_id, @name, @share_ratio, @contact)
  `)

  const insertRevenue = db.prepare(`
    INSERT INTO revenue_records (order_id, partner_id, site_id, total_amount, electricity_cost, partner_share, platform_share, refund_deduction)
    VALUES (@order_id, @partner_id, @site_id, @total_amount, @electricity_cost, @partner_share, @platform_share, @refund_deduction)
  `)

  const transaction = db.transaction(() => {
    const sites = insertSite.run({
      name: '万达广场站',
      address: '北京市朝阳区万达广场B1层',
      operator: '万达物业',
      device_count: 3,
      electricity_price: 0.85,
      service_fee: 0.55,
      business_hours_start: '07:00',
      business_hours_end: '22:00',
      status: 'active',
    })
    const site1Id = sites.lastInsertRowid

    const site2 = insertSite.run({
      name: '科技园A区站',
      address: '深圳市南山区科技园A区地下停车场',
      operator: '科技园物业管理公司',
      device_count: 2,
      electricity_price: 0.72,
      service_fee: 0.48,
      business_hours_start: '06:00',
      business_hours_end: '23:00',
      status: 'active',
    })
    const site2Id = site2.lastInsertRowid

    const site3 = insertSite.run({
      name: '中心商务区站',
      address: '上海市浦东新区陆家嘴环路1000号',
      operator: '陆家嘴商业运营',
      device_count: 3,
      electricity_price: 0.95,
      service_fee: 0.65,
      business_hours_start: '00:00',
      business_hours_end: '23:59',
      status: 'active',
    })
    const site3Id = site3.lastInsertRowid

    const dev1 = insertDevice.run({
      site_id: site1Id,
      name: '万达-1号桩',
      model: 'DC-120kW',
      power: 120.0,
      online: 1,
      fault_code: null,
      last_heartbeat: '2026-05-27 10:30:00',
      status: 'active',
    })
    const dev1Id = dev1.lastInsertRowid

    const dev2 = insertDevice.run({
      site_id: site1Id,
      name: '万达-2号桩',
      model: 'AC-7kW',
      power: 7.0,
      online: 1,
      fault_code: null,
      last_heartbeat: '2026-05-27 10:28:00',
      status: 'active',
    })
    const dev2Id = dev2.lastInsertRowid

    const dev3 = insertDevice.run({
      site_id: site1Id,
      name: '万达-3号桩',
      model: 'DC-60kW',
      power: 60.0,
      online: 0,
      fault_code: 'E0042',
      last_heartbeat: '2026-05-26 18:15:00',
      status: 'fault',
    })
    const dev3Id = dev3.lastInsertRowid

    const dev4 = insertDevice.run({
      site_id: site2Id,
      name: '科技园-1号桩',
      model: 'DC-120kW',
      power: 120.0,
      online: 1,
      fault_code: null,
      last_heartbeat: '2026-05-27 10:32:00',
      status: 'active',
    })
    const dev4Id = dev4.lastInsertRowid

    const dev5 = insertDevice.run({
      site_id: site2Id,
      name: '科技园-2号桩',
      model: 'AC-7kW',
      power: 7.0,
      online: 0,
      fault_code: 'E0103',
      last_heartbeat: '2026-05-25 09:00:00',
      status: 'fault',
    })
    const dev5Id = dev5.lastInsertRowid

    const dev6 = insertDevice.run({
      site_id: site3Id,
      name: '商务区-1号桩',
      model: 'DC-180kW',
      power: 180.0,
      online: 1,
      fault_code: null,
      last_heartbeat: '2026-05-27 10:35:00',
      status: 'active',
    })
    const dev6Id = dev6.lastInsertRowid

    const dev7 = insertDevice.run({
      site_id: site3Id,
      name: '商务区-2号桩',
      model: 'DC-120kW',
      power: 120.0,
      online: 1,
      fault_code: null,
      last_heartbeat: '2026-05-27 10:33:00',
      status: 'active',
    })
    const dev7Id = dev7.lastInsertRowid

    const dev8 = insertDevice.run({
      site_id: site3Id,
      name: '商务区-3号桩',
      model: 'AC-7kW',
      power: 7.0,
      online: 1,
      fault_code: null,
      last_heartbeat: '2026-05-27 10:20:00',
      status: 'active',
    })
    const dev8Id = dev8.lastInsertRowid

    const deviceIds = [dev1Id, dev2Id, dev3Id, dev4Id, dev5Id, dev6Id, dev7Id, dev8Id] as number[]
    const portIds: number[] = []

    for (const deviceId of deviceIds) {
      for (let p = 1; p <= 4; p++) {
        const result = insertPort.run({
          device_id: deviceId,
          port_number: p,
          status: 'idle',
          connector_type: p <= 2 ? 'DC' : 'AC',
        })
        portIds.push(result.lastInsertRowid as number)
      }
    }

    const orders = [
      { device_id: dev1Id, port_id: portIds[0], site_id: site1Id, start_time: '2026-05-27 08:00:00', end_time: '2026-05-27 09:30:00', duration: 1.5, energy: 45.0, cost: 63.0, stop_reason: 'full', refund_status: 'none', refund_amount: 0, status: 'completed' },
      { device_id: dev1Id, port_id: portIds[1], site_id: site1Id, start_time: '2026-05-27 09:00:00', end_time: '2026-05-27 10:15:00', duration: 1.25, energy: 38.5, cost: 53.9, stop_reason: 'full', refund_status: 'none', refund_amount: 0, status: 'completed' },
      { device_id: dev2Id, port_id: portIds[4], site_id: site1Id, start_time: '2026-05-27 07:30:00', end_time: '2026-05-27 14:30:00', duration: 7.0, energy: 49.0, cost: 68.6, stop_reason: 'full', refund_status: 'none', refund_amount: 0, status: 'completed' },
      { device_id: dev4Id, port_id: portIds[12], site_id: site2Id, start_time: '2026-05-27 06:30:00', end_time: '2026-05-27 07:45:00', duration: 1.25, energy: 40.0, cost: 48.0, stop_reason: 'full', refund_status: 'none', refund_amount: 0, status: 'completed' },
      { device_id: dev4Id, port_id: portIds[13], site_id: site2Id, start_time: '2026-05-27 08:00:00', end_time: '2026-05-27 08:45:00', duration: 0.75, energy: 22.0, cost: 26.4, stop_reason: 'user_stop', refund_status: 'partial', refund_amount: 5.0, status: 'refunded' },
      { device_id: dev6Id, port_id: portIds[20], site_id: site3Id, start_time: '2026-05-27 09:00:00', end_time: '2026-05-27 10:00:00', duration: 1.0, energy: 60.0, cost: 96.0, stop_reason: 'full', refund_status: 'none', refund_amount: 0, status: 'completed' },
      { device_id: dev7Id, port_id: portIds[24], site_id: site3Id, start_time: '2026-05-27 07:00:00', end_time: '2026-05-27 08:20:00', duration: 1.33, energy: 42.0, cost: 67.2, stop_reason: 'full', refund_status: 'none', refund_amount: 0, status: 'completed' },
      { device_id: dev8Id, port_id: portIds[28], site_id: site3Id, start_time: '2026-05-27 08:30:00', end_time: null, duration: 2.5, energy: 17.5, cost: 0, stop_reason: null, refund_status: 'none', refund_amount: 0, status: 'charging' },
      { device_id: dev1Id, port_id: portIds[2], site_id: site1Id, start_time: '2026-05-26 14:00:00', end_time: '2026-05-26 15:10:00', duration: 1.17, energy: 35.0, cost: 49.0, stop_reason: 'full', refund_status: 'none', refund_amount: 0, status: 'completed' },
      { device_id: dev6Id, port_id: portIds[21], site_id: site3Id, start_time: '2026-05-26 10:00:00', end_time: '2026-05-26 10:20:00', duration: 0.33, energy: 10.0, cost: 16.0, stop_reason: 'fault', refund_status: 'full', refund_amount: 16.0, status: 'refunded' },
      { device_id: dev2Id, port_id: portIds[5], site_id: site1Id, start_time: '2026-05-27 10:00:00', end_time: null, duration: 0.5, energy: 3.5, cost: 0, stop_reason: null, refund_status: 'none', refund_amount: 0, status: 'charging' },
      { device_id: dev4Id, port_id: portIds[14], site_id: site2Id, start_time: '2026-05-26 16:00:00', end_time: '2026-05-26 17:30:00', duration: 1.5, energy: 45.0, cost: 54.0, stop_reason: 'full', refund_status: 'none', refund_amount: 0, status: 'completed' },
    ]

    const orderIds: number[] = []
    for (const o of orders) {
      const result = insertOrder.run(o)
      orderIds.push(result.lastInsertRowid as number)
    }

    const wo1 = insertWorkOrder.run({
      device_id: dev3Id,
      site_id: site1Id,
      type: 'device_offline',
      status: 'assigned',
      priority: 'high',
      description: '设备离线，故障码E0042，疑似通信模块故障',
      assignee: '张工',
      assigned_at: '2026-05-27 08:00:00',
      resolved_at: null,
      resolution: null,
    })
    const wo1Id = wo1.lastInsertRowid

    const wo2 = insertWorkOrder.run({
      device_id: dev5Id,
      site_id: site2Id,
      type: 'device_offline',
      status: 'pending',
      priority: 'high',
      description: '设备离线，故障码E0103，需现场排查',
      assignee: null,
      assigned_at: null,
      resolved_at: null,
      resolution: null,
    })
    const wo2Id = wo2.lastInsertRowid

    const wo3 = insertWorkOrder.run({
      device_id: dev6Id,
      site_id: site3Id,
      type: 'maintenance',
      status: 'resolved',
      priority: 'medium',
      description: '定期巡检维护',
      assignee: '李工',
      assigned_at: '2026-05-25 09:00:00',
      resolved_at: '2026-05-25 16:00:00',
      resolution: '已完成例行维护，更换老化线缆',
    })
    const wo3Id = wo3.lastInsertRowid

    const wo4 = insertWorkOrder.run({
      device_id: null,
      site_id: site1Id,
      type: 'inspection',
      status: 'resolved',
      priority: 'low',
      description: '站点安全巡检',
      assignee: '王工',
      assigned_at: '2026-05-20 08:00:00',
      resolved_at: '2026-05-20 12:00:00',
      resolution: '巡检完成，未发现安全隐患',
    })
    const wo4Id = wo4.lastInsertRowid

    const wo5 = insertWorkOrder.run({
      device_id: dev1Id,
      site_id: site1Id,
      type: 'repair',
      status: 'pending',
      priority: 'medium',
      description: '充电枪头磨损，需要更换',
      assignee: null,
      assigned_at: null,
      resolved_at: null,
      resolution: null,
    })
    const wo5Id = wo5.lastInsertRowid

    insertPhoto.run({ work_order_id: wo1Id, photo_url: '/uploads/wo1_fault1.jpg', description: '故障码截图' })
    insertPhoto.run({ work_order_id: wo1Id, photo_url: '/uploads/wo1_fault2.jpg', description: '设备外观' })
    insertPhoto.run({ work_order_id: wo3Id, photo_url: '/uploads/wo3_maint1.jpg', description: '维护前' })
    insertPhoto.run({ work_order_id: wo3Id, photo_url: '/uploads/wo3_maint2.jpg', description: '更换线缆' })
    insertPhoto.run({ work_order_id: wo3Id, photo_url: '/uploads/wo3_maint3.jpg', description: '维护后' })
    insertPhoto.run({ work_order_id: wo5Id, photo_url: '/uploads/wo5_gun.jpg', description: '充电枪磨损' })

    const p1 = insertPartner.run({ site_id: site1Id, name: '万达商业集团', share_ratio: 0.4, contact: '刘经理 13800001111' })
    const p1Id = p1.lastInsertRowid
    const p2 = insertPartner.run({ site_id: site1Id, name: '恒大能源', share_ratio: 0.2, contact: '陈总 13900002222' })
    const p2Id = p2.lastInsertRowid
    const p3 = insertPartner.run({ site_id: site1Id, name: '绿能科技', share_ratio: 0.1, contact: '赵工 13700003333' })
    const p3Id = p3.lastInsertRowid

    const p4 = insertPartner.run({ site_id: site2Id, name: '南山投控', share_ratio: 0.35, contact: '黄经理 13600004444' })
    const p4Id = p4.lastInsertRowid
    const p5 = insertPartner.run({ site_id: site2Id, name: '鹏城新能源', share_ratio: 0.25, contact: '吴总 13500005555' })
    const p5Id = p5.lastInsertRowid

    const p6 = insertPartner.run({ site_id: site3Id, name: '浦东地产', share_ratio: 0.45, contact: '孙经理 13400006666' })
    const p6Id = p6.lastInsertRowid
    const p7 = insertPartner.run({ site_id: site3Id, name: '沪电集团', share_ratio: 0.15, contact: '周总 13300007777' })
    const p7Id = p7.lastInsertRowid
    const p8 = insertPartner.run({ site_id: site3Id, name: '东方能源', share_ratio: 0.1, contact: '钱工 13200008888' })
    const p8Id = p8.lastInsertRowid

    const completedOrders = [
      { orderId: orderIds[0], siteId: site1Id, totalAmount: 63.0, partnerId: p1Id, partnerShareRatio: 0.4 },
      { orderId: orderIds[1], siteId: site1Id, totalAmount: 53.9, partnerId: p1Id, partnerShareRatio: 0.4 },
      { orderId: orderIds[2], siteId: site1Id, totalAmount: 68.6, partnerId: p1Id, partnerShareRatio: 0.4 },
      { orderId: orderIds[3], siteId: site2Id, totalAmount: 48.0, partnerId: p4Id, partnerShareRatio: 0.35 },
      { orderId: orderIds[4], siteId: site2Id, totalAmount: 26.4, partnerId: p4Id, partnerShareRatio: 0.35 },
      { orderId: orderIds[5], siteId: site3Id, totalAmount: 96.0, partnerId: p6Id, partnerShareRatio: 0.45 },
      { orderId: orderIds[6], siteId: site3Id, totalAmount: 67.2, partnerId: p6Id, partnerShareRatio: 0.45 },
      { orderId: orderIds[8], siteId: site1Id, totalAmount: 49.0, partnerId: p1Id, partnerShareRatio: 0.4 },
      { orderId: orderIds[9], siteId: site3Id, totalAmount: 16.0, partnerId: p6Id, partnerShareRatio: 0.45 },
      { orderId: orderIds[11], siteId: site2Id, totalAmount: 54.0, partnerId: p4Id, partnerShareRatio: 0.35 },
    ]

    const sitePrices: Record<number, number> = {
      [site1Id as number]: 0.85,
      [site2Id as number]: 0.72,
      [site3Id as number]: 0.95,
    }

    for (const co of completedOrders) {
      const electricityCost = co.totalAmount * 0.5
      const refundDeduction = co.orderId === orderIds[9] ? 16.0 : (co.orderId === orderIds[4] ? 5.0 : 0)
      const netAmount = co.totalAmount - refundDeduction
      const partnerShare = netAmount * co.partnerShareRatio
      const platformShare = netAmount - partnerShare

      insertRevenue.run({
        order_id: co.orderId,
        partner_id: co.partnerId,
        site_id: co.siteId,
        total_amount: co.totalAmount,
        electricity_cost: electricityCost,
        partner_share: Math.round(partnerShare * 100) / 100,
        platform_share: Math.round(platformShare * 100) / 100,
        refund_deduction: refundDeduction,
      })
    }
  })

  transaction()
}
