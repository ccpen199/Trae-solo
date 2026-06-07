import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'app.sqlite')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('shipper','driver','admin')),
      company TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS driver_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
      license_no TEXT NOT NULL,
      vehicle_type TEXT NOT NULL,
      capacity REAL NOT NULL,
      plate_no TEXT NOT NULL,
      credit_score REAL NOT NULL DEFAULT 80.0,
      violation_count INTEGER NOT NULL DEFAULT 0,
      complaint_rate REAL NOT NULL DEFAULT 0.0,
      on_time_rate REAL NOT NULL DEFAULT 100.0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','blacklisted'))
    );

    CREATE TABLE IF NOT EXISTS driver_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL REFERENCES driver_profiles(id),
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      idle_status TEXT NOT NULL DEFAULT 'idle' CHECK(idle_status IN ('idle','busy','offline')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS route_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_city TEXT NOT NULL,
      to_city TEXT NOT NULL,
      base_price REAL NOT NULL,
      current_price REAL NOT NULL,
      cargo_type_weight TEXT NOT NULL DEFAULT '{}',
      seasonal_factor REAL NOT NULL DEFAULT 1.0,
      weather_factor REAL NOT NULL DEFAULT 1.0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(from_city, to_city)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipper_id INTEGER NOT NULL REFERENCES users(id),
      from_city TEXT NOT NULL,
      to_city TEXT NOT NULL,
      cargo_type TEXT NOT NULL,
      weight REAL NOT NULL,
      volume REAL,
      price REAL NOT NULL,
      mode TEXT NOT NULL CHECK(mode IN ('ftl','ltl','partial')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','matched','in_transit','completed','cancelled')),
      assigned_driver_id INTEGER REFERENCES driver_profiles(id),
      deadline TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bargainings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      driver_id INTEGER NOT NULL REFERENCES driver_profiles(id),
      shipper_price REAL NOT NULL,
      driver_price REAL,
      agreed_price REAL,
      status TEXT NOT NULL DEFAULT 'negotiating' CHECK(status IN ('negotiating','agreed','failed')),
      offers TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS waybills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      waybill_no TEXT NOT NULL UNIQUE,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      driver_id INTEGER NOT NULL REFERENCES driver_profiles(id),
      status TEXT NOT NULL DEFAULT 'generated' CHECK(status IN ('generated','loaded','in_transit','arrived','signed')),
      current_lat REAL,
      current_lng REAL,
      loaded_at TEXT,
      arrived_at TEXT,
      signed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS temperature_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      waybill_id INTEGER NOT NULL REFERENCES waybills(id),
      temperature REAL NOT NULL,
      humidity REAL NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_alert INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS waybill_status_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      waybill_id INTEGER NOT NULL REFERENCES waybills(id),
      status TEXT NOT NULL,
      location_lat REAL,
      location_lng REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      waybill_id INTEGER NOT NULL REFERENCES waybills(id),
      total_amount REAL NOT NULL,
      driver_amount REAL NOT NULL,
      platform_fee REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed')),
      settle_date TEXT,
      transaction_no TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS shipper_credits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipper_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
      credit_limit REAL NOT NULL DEFAULT 50000.0,
      used_amount REAL NOT NULL DEFAULT 0.0,
      available_amount REAL NOT NULL DEFAULT 50000.0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS supply_demand_warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER REFERENCES route_prices(id),
      warning_level TEXT NOT NULL CHECK(warning_level IN ('low','medium','high','critical')),
      supply_demand_ratio REAL NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_driver_locations_status ON driver_locations(idle_status);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_shipper ON orders(shipper_id);
    CREATE INDEX IF NOT EXISTS idx_waybills_status ON waybills(status);
    CREATE INDEX IF NOT EXISTS idx_temperature_logs_waybill ON temperature_logs(waybill_id);
    CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
    CREATE INDEX IF NOT EXISTS idx_route_prices_cities ON route_prices(from_city, to_city);
  `)
}

export function seedDatabase() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) return

  const insertUser = db.prepare('INSERT INTO users (phone, password_hash, name, role, company) VALUES (?, ?, ?, ?, ?)')
  const insertDriverProfile = db.prepare('INSERT INTO driver_profiles (user_id, license_no, vehicle_type, capacity, plate_no, credit_score, violation_count, complaint_rate, on_time_rate, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const insertDriverLocation = db.prepare('INSERT INTO driver_locations (driver_id, latitude, longitude, idle_status) VALUES (?, ?, ?, ?)')
  const insertShipperCredit = db.prepare('INSERT INTO shipper_credits (shipper_id, credit_limit, used_amount, available_amount) VALUES (?, ?, ?, ?)')
  const insertRoutePrice = db.prepare('INSERT INTO route_prices (from_city, to_city, base_price, current_price, cargo_type_weight, seasonal_factor, weather_factor) VALUES (?, ?, ?, ?, ?, ?, ?)')
  const insertOrder = db.prepare('INSERT INTO orders (shipper_id, from_city, to_city, cargo_type, weight, volume, price, mode, status, assigned_driver_id, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const insertBargaining = db.prepare('INSERT INTO bargainings (order_id, driver_id, shipper_price, driver_price, agreed_price, status, offers) VALUES (?, ?, ?, ?, ?, ?, ?)')
  const insertWaybill = db.prepare('INSERT INTO waybills (waybill_no, order_id, driver_id, status, current_lat, current_lng, loaded_at, arrived_at, signed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const insertTempLog = db.prepare('INSERT INTO temperature_logs (waybill_id, temperature, humidity, is_alert) VALUES (?, ?, ?, ?)')
  const insertSettlement = db.prepare('INSERT INTO settlements (waybill_id, total_amount, driver_amount, platform_fee, status, settle_date, transaction_no) VALUES (?, ?, ?, ?, ?, ?, ?)')
  const insertWarning = db.prepare('INSERT INTO supply_demand_warnings (route_id, warning_level, supply_demand_ratio, description) VALUES (?, ?, ?, ?)')

  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10)

  const admins = [
    { phone: '13800000001', name: '管理员一', company: '货达通运营中心' },
    { phone: '13800000002', name: '管理员二', company: '货达通运营中心' },
    { phone: '13800000003', name: '管理员三', company: '货达通运营中心' },
  ]
  for (const a of admins) {
    insertUser.run(a.phone, hash('admin123'), a.name, 'admin', a.company)
  }

  const cities = [
    { name: '北京', lat: 39.90, lng: 116.40 },
    { name: '上海', lat: 31.23, lng: 121.47 },
    { name: '广州', lat: 23.13, lng: 113.26 },
    { name: '深圳', lat: 22.54, lng: 114.06 },
    { name: '成都', lat: 30.57, lng: 104.07 },
    { name: '武汉', lat: 30.59, lng: 114.31 },
    { name: '杭州', lat: 30.27, lng: 120.15 },
    { name: '南京', lat: 32.06, lng: 118.80 },
    { name: '重庆', lat: 29.56, lng: 106.55 },
    { name: '西安', lat: 34.26, lng: 108.94 },
    { name: '长沙', lat: 28.23, lng: 112.94 },
    { name: '郑州', lat: 34.75, lng: 113.65 },
  ]

  const vehicleTypes = ['重型平板', '中型厢式', '轻型冷藏', '大型集装箱', '危险品罐车']
  const statuses: ('idle' | 'busy' | 'offline')[] = ['idle', 'busy', 'offline']
  const driverStatuses: ('approved' | 'pending' | 'blacklisted')[] = ['approved', 'approved', 'approved', 'approved', 'pending', 'blacklisted']

  const drivers = []
  for (let i = 0; i < 20; i++) {
    const city = cities[i % cities.length]
    const phone = `1390000${String(i + 1).padStart(4, '0')}`
    const name = `司机${i + 1}`
    insertUser.run(phone, hash('driver123'), name, 'driver', null)
    const userId = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number }
    const vType = vehicleTypes[i % vehicleTypes.length]
    const cap = [30, 15, 8, 40, 25][i % 5]
    const credit = 70 + Math.random() * 30
    const violations = Math.floor(Math.random() * 3)
    const complaintR = Math.random() * 0.1
    const onTime = 85 + Math.random() * 15
    const dStatus = driverStatuses[i % driverStatuses.length]
    insertDriverProfile.run(userId.id, `LIC${String(i + 1).padStart(6, '0')}`, vType, cap, `京A${String(10000 + i)}`, credit, violations, complaintR, onTime, dStatus)
    const dpId = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number }
    const idleSt = statuses[i % 3]
    const latOff = (Math.random() - 0.5) * 2
    const lngOff = (Math.random() - 0.5) * 2
    insertDriverLocation.run(dpId.id, city.lat + latOff, city.lng + lngOff, idleSt)
    drivers.push({ userId: userId.id, driverProfileId: dpId.id, city, vType })
  }

  const shippers = [
    { phone: '13700000001', name: '张建材', company: '北京建材集团' },
    { phone: '13700000002', name: '李生鲜', company: '上海鲜达供应链' },
    { phone: '13700000003', name: '王冷链', company: '广州冰鲜物流' },
    { phone: '13700000004', name: '赵大件', company: '深圳重装运输' },
    { phone: '13700000005', name: '孙商贸', company: '杭州万通商贸' },
  ]
  for (const s of shippers) {
    insertUser.run(s.phone, hash('shipper123'), s.name, 'shipper', s.company)
    const shipperId = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number }
    const limit = 30000 + Math.random() * 70000
    const used = Math.random() * limit * 0.6
    insertShipperCredit.run(shipperId.id, limit, used, limit - used)
  }

  const routePairs: [string, string, number][] = [
    ['北京', '上海', 280], ['北京', '广州', 420], ['上海', '广州', 350],
    ['上海', '深圳', 360], ['北京', '成都', 380], ['广州', '成都', 340],
    ['武汉', '上海', 260], ['杭州', '南京', 120], ['重庆', '成都', 150],
    ['西安', '郑州', 180], ['长沙', '广州', 220], ['北京', '武汉', 300],
    ['深圳', '成都', 390], ['南京', '杭州', 110], ['武汉', '长沙', 160],
    ['北京', '西安', 290], ['上海', '武汉', 270], ['广州', '长沙', 200],
    ['成都', '重庆', 140], ['郑州', '武汉', 170], ['深圳', '武汉', 310],
    ['北京', '南京', 250], ['上海', '成都', 370], ['广州', '重庆', 330],
    ['西安', '成都', 230], ['杭州', '广州', 340], ['南京', '武汉', 240],
    ['重庆', '长沙', 280], ['郑州', '北京', 290], ['长沙', '成都', 350],
  ]
  for (const [from, to, base] of routePairs) {
    const current = base * (0.9 + Math.random() * 0.3)
    const cargoW = JSON.stringify({ '建材': 1.0, '生鲜': 1.2, '冷链': 1.5, '大件': 1.3 })
    const seasonal = 0.8 + Math.random() * 0.4
    const weather = 0.9 + Math.random() * 0.2
    insertRoutePrice.run(from, to, base, Math.round(current), cargoW, Math.round(seasonal * 100) / 100, Math.round(weather * 100) / 100)
  }

  const cargoTypes = ['建材', '生鲜', '冷链', '大件', '电子', '化工']
  const modes: ('ftl' | 'ltl' | 'partial')[] = ['ftl', 'ltl', 'partial']
  const orderStatuses: ('pending' | 'matched' | 'in_transit' | 'completed' | 'cancelled')[] = ['pending', 'matched', 'in_transit', 'completed', 'completed', 'cancelled']

  const orderIds: number[] = []
  for (let i = 0; i < 12; i++) {
    const shipperId = 4 + (i % 5)
    const pair = routePairs[i % routePairs.length]
    const cType = cargoTypes[i % cargoTypes.length]
    const weight = 5 + Math.random() * 35
    const volume = weight * 1.5
    const price = pair[2] * weight * (0.8 + Math.random() * 0.4)
    const mode = modes[i % 3]
    const oStatus = orderStatuses[i % orderStatuses.length]
    const assignedDriver = oStatus !== 'pending' ? drivers[i % drivers.length].driverProfileId : null
    const deadline = '2026-06-' + String(5 + i).padStart(2, '0')
    insertOrder.run(shipperId, pair[0] as string, pair[1] as string, cType, Math.round(weight * 10) / 10, Math.round(volume * 10) / 10, Math.round(price), mode, oStatus, assignedDriver, deadline)
    const oid = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number }
    orderIds.push(oid.id)
  }

  for (let i = 0; i < 6; i++) {
    const oid = orderIds[i + 1]
    const did = drivers[i % drivers.length].driverProfileId
    const sPrice = routePairs[i % routePairs.length][2] * (15 + Math.random() * 10)
    const dPrice = sPrice * (0.85 + Math.random() * 0.2)
    const agreed = i < 3 ? (sPrice + dPrice) / 2 : null
    const bStatus = i < 3 ? 'agreed' : 'negotiating'
    const offers = JSON.stringify([
      { role: 'shipper', price: Math.round(sPrice), time: '2026-06-01 09:00' },
      { role: 'driver', price: Math.round(dPrice), time: '2026-06-01 09:05' },
      ...(i < 3 ? [{ role: 'shipper', price: Math.round(agreed!), time: '2026-06-01 09:10' }] : [])
    ])
    insertBargaining.run(oid, did, Math.round(sPrice), Math.round(dPrice), agreed ? Math.round(agreed) : null, bStatus, offers)
  }

  const waybillIds: number[] = []
  for (let i = 0; i < 8; i++) {
    const oid = orderIds[i + 2]
    if (!oid) continue
    const did = drivers[i % drivers.length].driverProfileId
    const city = cities[i % cities.length]
    const wStatuses: ('generated' | 'loaded' | 'in_transit' | 'arrived' | 'signed')[] = ['generated', 'loaded', 'in_transit', 'in_transit', 'arrived', 'signed', 'signed', 'signed']
    const wStatus = wStatuses[i]
    const wNo = `WB2026060${String(i + 1).padStart(4, '0')}`
    const lat = city.lat + (Math.random() - 0.5) * 2
    const lng = city.lng + (Math.random() - 0.5) * 2
    const loadedAt = wStatus !== 'generated' ? '2026-06-01 08:00' : null
    const arrivedAt = ['arrived', 'signed'].includes(wStatus) ? '2026-06-02 14:00' : null
    const signedAt = wStatus === 'signed' ? '2026-06-02 15:30' : null
    insertWaybill.run(wNo, oid, did, wStatus, lat, lng, loadedAt, arrivedAt, signedAt)
    const wid = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number }
    waybillIds.push(wid.id)
  }

  for (let w = 0; w < waybillIds.length; w++) {
    const wid = waybillIds[w]
    if (w % 2 === 0) {
      for (let t = 0; t < 24; t++) {
        const temp = -18 + Math.random() * 4 + (t > 10 && t < 16 ? 5 : 0)
        const hum = 60 + Math.random() * 20
        const isAlert = temp > -14 ? 1 : 0
        insertTempLog.run(wid, Math.round(temp * 10) / 10, Math.round(hum * 10) / 10, isAlert)
      }
    }
  }

  for (let i = 0; i < 5; i++) {
    if (i >= waybillIds.length) break
    const wid = waybillIds[waybillIds.length - 1 - i]
    const total = 3000 + Math.random() * 15000
    const platformFee = total * 0.08
    const sStatuses: ('pending' | 'processing' | 'completed')[] = ['pending', 'processing', 'completed', 'completed', 'completed']
    const sStatus = sStatuses[i]
    const settleDate = sStatus === 'completed' ? '2026-06-03' : null
    const txNo = sStatus !== 'pending' ? `TX${Date.now()}${i}` : null
    insertSettlement.run(wid, Math.round(total), Math.round(total - platformFee), Math.round(platformFee), sStatus, settleDate, txNo)
  }

  for (let i = 0; i < 6; i++) {
    const routeId = i + 1
    const levels: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical', 'medium', 'high']
    const ratio = 0.3 + Math.random() * 2.5
    const descs = [
      '运力严重不足，建议调价吸引司机',
      '供需基本平衡，小幅波动',
      '运力过剩，运价承压',
      '突发需求激增，运力紧张',
      '季节性调整，需求上升',
      '恶劣天气影响，运力下降'
    ]
    insertWarning.run(routeId, levels[i], Math.round(ratio * 100) / 100, descs[i])
  }
}

export default db
