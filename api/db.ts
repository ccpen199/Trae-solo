import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import dayjs from 'dayjs'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = path.join(dbDir, 'app.sqlite')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      real_name TEXT,
      customer_type TEXT CHECK(customer_type IN ('individual','family','enterprise','park')) NOT NULL DEFAULT 'individual',
      role TEXT CHECK(role IN ('user','admin')) NOT NULL DEFAULT 'user',
      phone TEXT,
      email TEXT,
      company_name TEXT,
      address TEXT,
      points_balance INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `)

  const columns = db.prepare("PRAGMA table_info(users)").all() as any[]
  const hasRole = columns.some(c => c.name === 'role')
  if (!hasRole) {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT CHECK(role IN ('user','admin')) NOT NULL DEFAULT 'user'`)
  }

  db.exec(`    CREATE TABLE IF NOT EXISTS electricity_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      meter_no TEXT NOT NULL,
      billing_period TEXT NOT NULL,
      total_kwh REAL NOT NULL,
      peak_kwh REAL DEFAULT 0,
      valley_kwh REAL DEFAULT 0,
      flat_kwh REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      peak_amount REAL DEFAULT 0,
      valley_amount REAL DEFAULT 0,
      flat_amount REAL DEFAULT 0,
      status TEXT CHECK(status IN ('unpaid','paid','overdue')) NOT NULL DEFAULT 'unpaid',
      due_date TEXT NOT NULL,
      paid_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      bill_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      transaction_no TEXT,
      paid_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (bill_id) REFERENCES electricity_bills(id)
    );

    CREATE TABLE IF NOT EXISTS outage_notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      area TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      reason TEXT,
      type TEXT,
      status TEXT CHECK(status IN ('planned','emergency','restored')) NOT NULL DEFAULT 'planned',
      affected_users INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS energy_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      report_type TEXT NOT NULL,
      period TEXT NOT NULL,
      total_consumption_kwh REAL NOT NULL,
      peak_ratio REAL DEFAULT 0,
      valley_ratio REAL DEFAULT 0,
      efficiency_score REAL DEFAULT 0,
      recommendations TEXT,
      status TEXT DEFAULT 'completed',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS pv_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      roof_area REAL NOT NULL,
      monthly_consumption REAL NOT NULL,
      recommended_capacity REAL NOT NULL,
      estimated_generation REAL NOT NULL,
      investment_cost REAL NOT NULL,
      payback_years REAL NOT NULL,
      co2_reduction REAL NOT NULL,
      status TEXT DEFAULT 'recommended',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS carbon_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      period TEXT NOT NULL,
      electricity_carbon REAL DEFAULT 0,
      transport_carbon REAL DEFAULT 0,
      total_carbon REAL DEFAULT 0,
      reduction_tips TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS smart_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      device_name TEXT NOT NULL,
      device_type TEXT NOT NULL,
      status TEXT DEFAULT 'offline',
      power_consumption REAL DEFAULT 0,
      last_active TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS energy_tips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      season TEXT,
      customer_type TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS points_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT CHECK(type IN ('earn','redeem')) NOT NULL,
      amount INTEGER NOT NULL,
      source TEXT,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS mall_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      points_required INTEGER NOT NULL,
      category TEXT NOT NULL,
      stock INTEGER DEFAULT 0,
      image_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS redemption_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      points_cost INTEGER NOT NULL,
      status TEXT CHECK(status IN ('pending','processed','delivered','cancelled')) NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (item_id) REFERENCES mall_items(id)
    );

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      publish_date TEXT NOT NULL,
      effective_date TEXT,
      source TEXT,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS safety_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expert_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      expert_name TEXT NOT NULL,
      description TEXT,
      live_date TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 60,
      video_url TEXT,
      viewer_count INTEGER DEFAULT 0,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      auditor_id INTEGER,
      audit_type TEXT NOT NULL,
      target_id INTEGER,
      target_type TEXT,
      result TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (auditor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS subsidies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT CHECK(status IN ('pending','approved','disbursed','rejected')) NOT NULL DEFAULT 'pending',
      applied_at TEXT DEFAULT (datetime('now')),
      approved_at TEXT,
      disbursed_at TEXT,
      notes TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS green_rights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      source TEXT,
      status TEXT CHECK(status IN ('issued','used','expired')) NOT NULL DEFAULT 'issued',
      issued_at TEXT DEFAULT (datetime('now')),
      used_at TEXT,
      expired_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS device_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      device_id INTEGER,
      alert_type TEXT NOT NULL,
      severity TEXT CHECK(severity IN ('low','medium','high','critical')) NOT NULL DEFAULT 'medium',
      message TEXT NOT NULL,
      status TEXT CHECK(status IN ('open','acknowledged','resolved')) NOT NULL DEFAULT 'open',
      created_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (device_id) REFERENCES smart_devices(id)
    );

    CREATE TABLE IF NOT EXISTS weather_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      area TEXT NOT NULL,
      temperature REAL NOT NULL,
      humidity REAL NOT NULL,
      weather_condition TEXT NOT NULL,
      forecast_high REAL,
      forecast_low REAL,
      recorded_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meter_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      meter_no TEXT NOT NULL,
      reading_kwh REAL NOT NULL,
      reading_time TEXT DEFAULT (datetime('now')),
      voltage REAL,
      current REAL,
      power_factor REAL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS price_tariffs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_type TEXT CHECK(customer_type IN ('individual','family','enterprise','park')) NOT NULL DEFAULT 'individual',
      period_type TEXT CHECK(period_type IN ('peak','flat','valley')) NOT NULL,
      price_per_kwh REAL NOT NULL,
      effective_from TEXT NOT NULL,
      effective_to TEXT
    );

    CREATE TABLE IF NOT EXISTS green_rights_trace (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      right_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      operator_id INTEGER,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (right_id) REFERENCES green_rights(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS outage_acknowledgements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      outage_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      acknowledged_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (outage_id) REFERENCES outage_notices(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `)

  const outageColumns = db.prepare("PRAGMA table_info(outage_notices)").all() as any[]
  const hasNotifiedUsers = outageColumns.some(c => c.name === 'notified_users')
  const hasNotificationSent = outageColumns.some(c => c.name === 'notification_sent')
  if (!hasNotifiedUsers) {
    db.exec(`ALTER TABLE outage_notices ADD COLUMN notified_users INTEGER DEFAULT 0`)
  }
  if (!hasNotificationSent) {
    db.exec(`ALTER TABLE outage_notices ADD COLUMN notification_sent INTEGER DEFAULT 0`)
  }

  const subsidyColumns = db.prepare("PRAGMA table_info(subsidies)").all() as any[]
  const hasTimeline = subsidyColumns.some(c => c.name === 'timeline')
  if (!hasTimeline) {
    db.exec(`ALTER TABLE subsidies ADD COLUMN timeline TEXT`)
  }

  const redemptionColumns = db.prepare("PRAGMA table_info(redemption_orders)").all() as any[]
  const hasConfirmedAt = redemptionColumns.some(c => c.name === 'confirmed_at')
  if (!hasConfirmedAt) {
    db.exec(`ALTER TABLE redemption_orders ADD COLUMN confirmed_at TEXT`)
  }

  seedData()
}

function seedData() {
  const passwordHash = bcrypt.hashSync('password123', 10)

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  const usersNeedSeed = userCount.count === 0

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, real_name, customer_type, role, phone, email, company_name, address, points_balance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const users = [
    { username: 'admin', real_name: '系统管理员', customer_type: 'enterprise', role: 'admin', phone: '13800000001', email: 'admin@csg.cn', company_name: '南方电网', address: '广州市天河区珠江新城', points: 99999 },
    { username: 'zhangsan', real_name: '张三', customer_type: 'individual', role: 'user', phone: '13800001001', email: 'zhangsan@example.com', company_name: null, address: '广州市天河区体育西路100号', points: 1200 },
    { username: 'lisi', real_name: '李四', customer_type: 'individual', role: 'user', phone: '13800001002', email: 'lisi@example.com', company_name: null, address: '深圳市南山区科技园路50号', points: 800 },
    { username: 'wangwu', real_name: '王五', customer_type: 'individual', role: 'user', phone: '13800001003', email: 'wangwu@example.com', company_name: null, address: '佛山市禅城区祖庙路30号', points: 500 },
    { username: 'zhaofamily', real_name: '赵家', customer_type: 'family', role: 'user', phone: '13800002001', email: 'zhao@example.com', company_name: null, address: '广州市越秀区北京路200号', points: 2100 },
    { username: 'sunfamily', real_name: '孙家', customer_type: 'family', role: 'user', phone: '13800002002', email: 'sun@example.com', company_name: null, address: '东莞市莞城区东城大道88号', points: 1500 },
    { username: 'zhoufamily', real_name: '周家', customer_type: 'family', role: 'user', phone: '13800002003', email: 'zhou@example.com', company_name: null, address: '珠海市香洲区人民路66号', points: 900 },
    { username: 'huawei_co', real_name: '华南电力科技', customer_type: 'enterprise', role: 'user', phone: '13800003001', email: 'admin@huanandianli.com', company_name: '华南电力科技有限公司', address: '广州市黄埔区开发大道300号', points: 5600 },
    { username: 'nansha_co', real_name: '南沙能源集团', customer_type: 'enterprise', role: 'user', phone: '13800003002', email: 'info@nansha-energy.com', company_name: '南沙能源集团有限公司', address: '广州市南沙区海滨路100号', points: 3200 },
    { username: 'foshan_co', real_name: '佛山智造电气', customer_type: 'enterprise', role: 'user', phone: '13800003003', email: 'contact@foshan-elec.com', company_name: '佛山智造电气有限公司', address: '佛山市顺德区大良街道工业区', points: 1800 },
    { username: 'guangzhou_park', real_name: '广州高新产业园', customer_type: 'park', role: 'user', phone: '13800004001', email: 'admin@gz-park.com', company_name: '广州高新技术产业园', address: '广州市萝岗区科学大道1号', points: 12000 },
    { username: 'shenzhen_park', real_name: '深圳创新科技园', customer_type: 'park', role: 'user', phone: '13800004002', email: 'ops@sz-innopark.com', company_name: '深圳创新科技园管理有限公司', address: '深圳市龙华区民治街道科技园', points: 8900 },
    { username: 'zhuhai_park', real_name: '珠海横琴新区', customer_type: 'park', role: 'user', phone: '13800004003', email: 'info@zhuhai-hengqin.com', company_name: '珠海横琴新区发展有限公司', address: '珠海市横琴新区环岛路', points: 6500 },
  ]

  const userIds: number[] = []
  if (usersNeedSeed) {
    for (const u of users) {
      const r = insertUser.run(
      u.username, passwordHash, u.real_name, u.customer_type, u.role,
      u.phone, u.email, u.company_name, u.address, u.points
    )
      userIds.push(r.lastInsertRowid as number)
    }
  } else {
    const existingUsers = db.prepare('SELECT id FROM users ORDER BY id').all() as { id: number }[]
    userIds.push(...existingUsers.map(u => u.id))
  }

  const insertBill = db.prepare(`
    INSERT INTO electricity_bills (user_id, meter_no, billing_period, total_kwh, peak_kwh, valley_kwh, flat_kwh, total_amount, peak_amount, valley_amount, flat_amount, status, due_date, paid_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const bills = [
    { uid: 0, meter: 'GD20250001', period: '2026-01', total: 350, peak: 120, valley: 80, flat: 150, amount: 245.00, peakAmt: 100.80, valleyAmt: 40.00, flatAmt: 104.20, status: 'paid', due: '2026-02-15', paidAt: '2026-02-10' },
    { uid: 0, meter: 'GD20250001', period: '2026-02', total: 280, peak: 95, valley: 65, flat: 120, amount: 196.00, peakAmt: 79.80, valleyAmt: 32.50, flatAmt: 83.70, status: 'paid', due: '2026-03-15', paidAt: '2026-03-12' },
    { uid: 0, meter: 'GD20250001', period: '2026-03', total: 310, peak: 110, valley: 70, flat: 130, amount: 217.00, peakAmt: 92.40, valleyAmt: 35.00, flatAmt: 89.60, status: 'unpaid', due: '2026-04-15', paidAt: null },
    { uid: 0, meter: 'GD20250001', period: '2026-04', total: 290, peak: 100, valley: 60, flat: 130, amount: 203.00, peakAmt: 84.00, valleyAmt: 30.00, flatAmt: 89.00, status: 'unpaid', due: '2026-05-15', paidAt: null },
    { uid: 1, meter: 'GD20250002', period: '2026-01', total: 420, peak: 150, valley: 100, flat: 170, amount: 294.00, peakAmt: 126.00, valleyAmt: 50.00, flatAmt: 118.00, status: 'paid', due: '2026-02-15', paidAt: '2026-02-08' },
    { uid: 1, meter: 'GD20250002', period: '2026-02', total: 380, peak: 130, valley: 90, flat: 160, amount: 266.00, peakAmt: 109.20, valleyAmt: 45.00, flatAmt: 111.80, status: 'overdue', due: '2026-03-15', paidAt: null },
    { uid: 2, meter: 'GD20250003', period: '2026-01', total: 200, peak: 70, valley: 50, flat: 80, amount: 140.00, peakAmt: 58.80, valleyAmt: 25.00, flatAmt: 56.20, status: 'paid', due: '2026-02-15', paidAt: '2026-02-14' },
    { uid: 3, meter: 'GD20250004', period: '2026-01', total: 580, peak: 200, valley: 150, flat: 230, amount: 406.00, peakAmt: 168.00, valleyAmt: 75.00, flatAmt: 163.00, status: 'paid', due: '2026-02-15', paidAt: '2026-02-05' },
    { uid: 3, meter: 'GD20250004', period: '2026-02', total: 620, peak: 220, valley: 160, flat: 240, amount: 434.00, peakAmt: 184.80, valleyAmt: 80.00, flatAmt: 169.20, status: 'unpaid', due: '2026-03-15', paidAt: null },
    { uid: 4, meter: 'GD20250005', period: '2026-01', total: 720, peak: 260, valley: 180, flat: 280, amount: 504.00, peakAmt: 218.40, valleyAmt: 90.00, flatAmt: 195.60, status: 'paid', due: '2026-02-15', paidAt: '2026-02-12' },
    { uid: 4, meter: 'GD20250005', period: '2026-02', total: 680, peak: 240, valley: 170, flat: 270, amount: 476.00, peakAmt: 201.60, valleyAmt: 85.00, flatAmt: 189.40, status: 'paid', due: '2026-03-15', paidAt: '2026-03-10' },
    { uid: 5, meter: 'GD20250006', period: '2026-01', total: 450, peak: 160, valley: 110, flat: 180, amount: 315.00, peakAmt: 134.40, valleyAmt: 55.00, flatAmt: 125.60, status: 'paid', due: '2026-02-15', paidAt: '2026-02-09' },
    { uid: 5, meter: 'GD20250006', period: '2026-02', total: 480, peak: 170, valley: 120, flat: 190, amount: 336.00, peakAmt: 142.80, valleyAmt: 60.00, flatAmt: 133.20, status: 'unpaid', due: '2026-03-15', paidAt: null },
    { uid: 6, meter: 'GD20250007', period: '2026-01', total: 520, peak: 180, valley: 130, flat: 210, amount: 364.00, peakAmt: 151.20, valleyAmt: 65.00, flatAmt: 147.80, status: 'paid', due: '2026-02-15', paidAt: '2026-02-11' },
    { uid: 6, meter: 'GD20250007', period: '2026-01', total: 15000, peak: 5500, valley: 4000, flat: 5500, amount: 10500.00, peakAmt: 4620.00, valleyAmt: 2000.00, flatAmt: 3880.00, status: 'paid', due: '2026-02-20', paidAt: '2026-02-18' },
    { uid: 7, meter: 'GD20250008', period: '2026-01', total: 15000, peak: 5500, valley: 4000, flat: 5500, amount: 10500.00, peakAmt: 4620.00, valleyAmt: 2000.00, flatAmt: 3880.00, status: 'paid', due: '2026-02-20', paidAt: '2026-02-18' },
    { uid: 7, meter: 'GD20250008', period: '2026-02', total: 16500, peak: 6000, valley: 4500, flat: 6000, amount: 11550.00, peakAmt: 5040.00, valleyAmt: 2250.00, flatAmt: 4260.00, status: 'unpaid', due: '2026-03-20', paidAt: null },
    { uid: 8, meter: 'GD20250009', period: '2026-01', total: 12000, peak: 4400, valley: 3200, flat: 4400, amount: 8400.00, peakAmt: 3696.00, valleyAmt: 1600.00, flatAmt: 3104.00, status: 'paid', due: '2026-02-20', paidAt: '2026-02-19' },
    { uid: 8, meter: 'GD20250009', period: '2026-02', total: 13500, peak: 4950, valley: 3600, flat: 4950, amount: 9450.00, peakAmt: 4158.00, valleyAmt: 1800.00, flatAmt: 3492.00, status: 'unpaid', due: '2026-03-20', paidAt: null },
    { uid: 9, meter: 'GD20250010', period: '2026-01', total: 85000, peak: 30000, valley: 25000, flat: 30000, amount: 59500.00, peakAmt: 25200.00, valleyAmt: 12500.00, flatAmt: 21800.00, status: 'paid', due: '2026-02-25', paidAt: '2026-02-20' },
    { uid: 9, meter: 'GD20250010', period: '2026-02', total: 92000, peak: 32000, valley: 28000, flat: 32000, amount: 64400.00, peakAmt: 26880.00, valleyAmt: 14000.00, flatAmt: 23520.00, status: 'overdue', due: '2026-03-25', paidAt: null },
    { uid: 10, meter: 'GD20250011', period: '2026-01', total: 75000, peak: 27000, valley: 22000, flat: 26000, amount: 52500.00, peakAmt: 22680.00, valleyAmt: 11000.00, flatAmt: 18820.00, status: 'paid', due: '2026-02-25', paidAt: '2026-02-22' },
    { uid: 10, meter: 'GD20250011', period: '2026-02', total: 82000, peak: 29500, valley: 24500, flat: 28000, amount: 57400.00, peakAmt: 24780.00, valleyAmt: 12250.00, flatAmt: 20370.00, status: 'paid', due: '2026-03-25', paidAt: '2026-03-20' },
    { uid: 11, meter: 'GD20250012', period: '2026-01', total: 68000, peak: 24500, valley: 20000, flat: 23500, amount: 47600.00, peakAmt: 20580.00, valleyAmt: 10000.00, flatAmt: 17020.00, status: 'paid', due: '2026-02-25', paidAt: '2026-02-21' },
    { uid: 11, meter: 'GD20250012', period: '2026-02', total: 74000, peak: 26600, valley: 22000, flat: 25400, amount: 51800.00, peakAmt: 22344.00, valleyAmt: 11000.00, flatAmt: 18456.00, status: 'unpaid', due: '2026-03-25', paidAt: null },
    { uid: 12, meter: 'GD20250013', period: '2026-01', total: 55000, peak: 20000, valley: 16000, flat: 19000, amount: 38500.00, peakAmt: 16800.00, valleyAmt: 8000.00, flatAmt: 13700.00, status: 'paid', due: '2026-02-25', paidAt: '2026-02-23' },
    { uid: 12, meter: 'GD20250013', period: '2026-02', total: 61000, peak: 22000, valley: 18000, flat: 21000, amount: 42700.00, peakAmt: 18480.00, valleyAmt: 9000.00, flatAmt: 15220.00, status: 'paid', due: '2026-03-25', paidAt: '2026-03-18' },
  ]

  const billCount = db.prepare('SELECT COUNT(*) as count FROM electricity_bills').get() as { count: number }
  if (billCount.count === 0) {
    for (const b of bills) {
      insertBill.run(
        userIds[b.uid], b.meter, b.period, b.total, b.peak, b.valley, b.flat,
        b.amount, b.peakAmt, b.valleyAmt, b.flatAmt, b.status, b.due, b.paidAt
      )
    }
  }

  const insertPayment = db.prepare(`
    INSERT INTO payments (user_id, bill_id, amount, payment_method, transaction_no, paid_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const paidBills = db.prepare('SELECT id, user_id, total_amount, paid_at FROM electricity_bills WHERE status = ?').all('paid') as any[]
  const methods = ['wechat', 'alipay', 'bank_card', 'unionpay']
  for (const pb of paidBills) {
    insertPayment.run(
      pb.user_id, pb.id, pb.total_amount,
      methods[Math.floor(Math.random() * methods.length)],
      'TXN' + dayjs().format('YYYYMMDD') + String(pb.id).padStart(6, '0'),
      pb.paid_at
    )
  }

  const insertOutage = db.prepare(`
    INSERT INTO outage_notices (title, area, start_time, end_time, reason, type, status, affected_users)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const outages = [
    { title: '天河区计划检修停电通知', area: '广州市天河区', start: '2026-06-10 08:00', end: '2026-06-10 18:00', reason: '线路检修维护', status: 'planned', affected: 3500, type: 'planned_maintenance' },
    { title: '南山区紧急停电通知', area: '深圳市南山区', start: '2026-06-05 14:00', end: '2026-06-05 20:00', reason: '设备故障抢修', status: 'emergency', affected: 1200, type: 'fault_repair' },
    { title: '禅城区停电恢复通知', area: '佛山市禅城区', start: '2026-05-28 09:00', end: '2026-05-28 16:00', reason: '变压器更换', status: 'restored', affected: 2800, type: 'equipment_upgrade' },
    { title: '黄埔区计划检修停电通知', area: '广州市黄埔区', start: '2026-06-15 07:00', end: '2026-06-15 17:00', reason: '配网改造升级', status: 'planned', affected: 4200, type: 'grid_upgrade' },
    { title: '龙华区紧急停电通知', area: '深圳市龙华区', start: '2026-06-06 10:00', end: '2026-06-06 22:00', reason: '雷击线路跳闸', status: 'emergency', affected: 5600, type: 'natural_disaster' },
    { title: '顺德区停电恢复通知', area: '佛山市顺德区', start: '2026-05-20 08:00', end: '2026-05-20 14:00', reason: '线路老化更换', status: 'restored', affected: 1900, type: 'equipment_upgrade' },
    { title: '萝岗区计划检修停电通知', area: '广州市萝岗区', start: '2026-06-20 06:00', end: '2026-06-20 12:00', reason: '变电站年度检修', status: 'planned', affected: 6800, type: 'planned_maintenance' },
  ]

  const outageCount = db.prepare('SELECT COUNT(*) as count FROM outage_notices').get() as { count: number }
  if (outageCount.count === 0) {
    for (const o of outages) {
      insertOutage.run(o.title, o.area, o.start, o.end, o.reason, o.type, o.status, o.affected)
    }
  }
  const insertReport = db.prepare(`
    INSERT INTO energy_reports (user_id, report_type, period, total_consumption_kwh, peak_ratio, valley_ratio, efficiency_score, recommendations, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const reports = [
    { uid: 0, type: 'monthly', period: '2026-01', total: 350, peakR: 0.34, valleyR: 0.23, score: 72, rec: '建议将部分高耗电设备转移至谷电时段运行，可节省约15%电费支出', status: 'completed' },
    { uid: 0, type: 'monthly', period: '2026-02', total: 280, peakR: 0.34, valleyR: 0.23, score: 78, rec: '用电效率有所提升，继续保持谷电时段用电习惯', status: 'completed' },
    { uid: 1, type: 'monthly', period: '2026-01', total: 420, peakR: 0.36, valleyR: 0.24, score: 68, rec: '峰电占比偏高，建议优化空调使用时间，错峰运行洗衣机等家电', status: 'completed' },
    { uid: 3, type: 'quarterly', period: '2026-Q1', total: 1200, peakR: 0.34, valleyR: 0.25, score: 75, rec: '家庭整体用电合理，建议安装智能插座进一步精细化管理', status: 'completed' },
    { uid: 7, type: 'monthly', period: '2026-01', total: 15000, peakR: 0.37, valleyR: 0.27, score: 65, rec: '企业峰电占比过高，建议实施需求侧管理，将非紧急生产转移至夜间谷电时段', status: 'completed' },
    { uid: 7, type: 'quarterly', period: '2025-Q4', total: 48000, peakR: 0.36, valleyR: 0.26, score: 70, rec: '建议评估储能系统投资可行性，通过削峰填谷降低用电成本', status: 'in_progress' },
    { uid: 8, type: 'monthly', period: '2026-01', total: 16500, peakR: 0.38, valleyR: 0.26, score: 68, rec: '南沙能源集团电力负荷稳定，建议优化生产排班，进一步降低峰电占比', status: 'completed' },
    { uid: 8, type: 'quarterly', period: '2026-Q1', total: 52000, peakR: 0.37, valleyR: 0.27, score: 72, rec: '建议参与需求响应项目，可获得额外补贴收益', status: 'pending' },
    { uid: 10, type: 'monthly', period: '2026-01', total: 85000, peakR: 0.35, valleyR: 0.29, score: 62, rec: '园区能源消耗较大，建议安装分布式光伏和储能系统，预计年节省电费20%以上', status: 'completed' },
    { uid: 10, type: 'annual', period: '2025', total: 980000, peakR: 0.35, valleyR: 0.28, score: 58, rec: '建议引入综合能源管理系统，结合光伏、储能和需求响应，实现智慧用能', status: 'pending' },
  ]

  const reportCount = db.prepare('SELECT COUNT(*) as count FROM energy_reports').get() as { count: number }
  if (reportCount.count === 0) {
    for (const r of reports) {
      insertReport.run(userIds[r.uid], r.type, r.period, r.total, r.peakR, r.valleyR, r.score, r.rec, r.status)
    }
  }

  const insertPv = db.prepare(`
    INSERT INTO pv_plans (user_id, roof_area, monthly_consumption, recommended_capacity, estimated_generation, investment_cost, payback_years, co2_reduction, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const pvPlans = [
    { uid: 0, roof: 40, monthly: 310, capacity: 5, generation: 550, cost: 25000, payback: 6.5, co2: 4.8, status: 'recommended' },
    { uid: 1, roof: 60, monthly: 400, capacity: 8, generation: 880, cost: 40000, payback: 7.0, co2: 7.7, status: 'in_progress' },
    { uid: 4, roof: 100, monthly: 580, capacity: 12, generation: 1320, cost: 60000, payback: 6.0, co2: 11.6, status: 'approved' },
    { uid: 7, roof: 500, monthly: 15000, capacity: 100, generation: 11000, cost: 500000, payback: 5.5, co2: 96.3, status: 'recommended' },
    { uid: 8, roof: 800, monthly: 16500, capacity: 150, generation: 16500, cost: 750000, payback: 5.2, co2: 144.5, status: 'in_progress' },
    { uid: 10, roof: 3000, monthly: 85000, capacity: 500, generation: 55000, cost: 2500000, payback: 5.0, co2: 481.5, status: 'completed' },
    { uid: 11, roof: 2000, monthly: 60000, capacity: 300, generation: 33000, cost: 1500000, payback: 5.2, co2: 288.9, status: 'in_progress' },
  ]

  const pvPlanCount = db.prepare('SELECT COUNT(*) as count FROM pv_plans').get() as { count: number }
  if (pvPlanCount.count === 0) {
    for (const p of pvPlans) {
      insertPv.run(userIds[p.uid], p.roof, p.monthly, p.capacity, p.generation, p.cost, p.payback, p.co2, p.status)
    }
  }

  const insertCarbon = db.prepare(`
    INSERT INTO carbon_records (user_id, period, electricity_carbon, transport_carbon, total_carbon, reduction_tips)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const carbons = [
    { uid: 0, period: '2026-01', elec: 0.28, transport: 0.12, total: 0.40, tips: '改用公共交通可减少交通碳排放30%；使用LED灯可减少用电碳排放10%' },
    { uid: 0, period: '2026-02', elec: 0.22, transport: 0.11, total: 0.33, tips: '用电效率提升明显，建议继续优化空调温度设定' },
    { uid: 1, period: '2026-01', elec: 0.34, transport: 0.15, total: 0.49, tips: '建议将空调温度提高2度，可减少约8%的电力碳排放' },
    { uid: 4, period: '2026-Q1', elec: 0.96, transport: 0.35, total: 1.31, tips: '家庭碳排较高，建议安装光伏系统并使用新能源出行' },
    { uid: 7, period: '2026-01', elec: 12.0, transport: 3.5, total: 15.5, tips: '建议引入光伏发电和储能系统，替换公司车队为新能源车' },
    { uid: 8, period: '2026-01', elec: 13.2, transport: 4.2, total: 17.4, tips: '南沙能源集团碳排放偏高，建议优化生产流程，引入碳资产管理系统' },
    { uid: 10, period: '2026-01', elec: 68.0, transport: 15.2, total: 83.2, tips: '建议园区统一建设分布式光伏，引入充电桩，推动绿色交通' },
    { uid: 11, period: '2026-01', elec: 48.0, transport: 10.5, total: 58.5, tips: '建议优化园区用能结构，推广屋顶光伏和地源热泵技术' },
  ]

  const carbonCount = db.prepare('SELECT COUNT(*) as count FROM carbon_records').get() as { count: number }
  if (carbonCount.count === 0) {
    for (const c of carbons) {
      insertCarbon.run(userIds[c.uid], c.period, c.elec, c.transport, c.total, c.tips)
    }
  }

  const insertDevice = db.prepare(`
    INSERT INTO smart_devices (user_id, device_name, device_type, status, power_consumption, last_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const devices = [
    { uid: 0, name: '客厅空调', type: 'air_conditioner', status: 'online', power: 1.5, last: '2026-06-05 14:30:00' },
    { uid: 0, name: '智能电热水器', type: 'water_heater', status: 'online', power: 2.0, last: '2026-06-05 12:00:00' },
    { uid: 0, name: '客厅照明', type: 'lighting', status: 'offline', power: 0.1, last: '2026-06-04 22:00:00' },
    { uid: 1, name: '中央空调', type: 'air_conditioner', status: 'online', power: 3.0, last: '2026-06-05 15:00:00' },
    { uid: 4, name: '家庭智能网关', type: 'gateway', status: 'online', power: 0.02, last: '2026-06-05 15:30:00' },
    { uid: 4, name: '智能洗衣机', type: 'washer', status: 'offline', power: 0.5, last: '2026-06-05 08:00:00' },
    { uid: 7, name: '生产车间空调系统', type: 'hvac', status: 'online', power: 15.0, last: '2026-06-05 15:30:00' },
    { uid: 7, name: '数据中心UPS', type: 'ups', status: 'online', power: 8.0, last: '2026-06-05 15:30:00' },
    { uid: 8, name: '南沙能源集团配电监控系统', type: 'hvac', status: 'online', power: 25.0, last: '2026-06-05 15:30:00' },
    { uid: 8, name: '企业能源管理终端', type: 'gateway', status: 'online', power: 0.5, last: '2026-06-05 15:30:00' },
    { uid: 10, name: '园区照明系统', type: 'lighting', status: 'online', power: 5.0, last: '2026-06-05 15:00:00' },
    { uid: 10, name: '园区充电桩组', type: 'charger', status: 'online', power: 50.0, last: '2026-06-05 14:00:00' },
  ]

  const deviceCount = db.prepare('SELECT COUNT(*) as count FROM smart_devices').get() as { count: number }
  if (deviceCount.count === 0) {
    for (const d of devices) {
      insertDevice.run(userIds[d.uid], d.name, d.type, d.status, d.power, d.last)
    }
  }

  const insertTip = db.prepare(`
    INSERT INTO energy_tips (title, content, category, season, customer_type)
    VALUES (?, ?, ?, ?, ?)
  `)

  const tips = [
    { title: '夏季空调节能技巧', content: '将空调温度设定在26度以上，每提高1度可节省约6%的电力消耗。配合风扇使用效果更佳。', category: 'hvac', season: 'summer', customer_type: 'individual' },
    { title: '冬季取暖节能指南', content: '合理使用电暖器，避免长时间开启。建议使用定时功能，配合保温窗帘减少热量散失。', category: 'heating', season: 'winter', customer_type: 'individual' },
    { title: '家庭照明节能方案', content: '全面更换LED灯具，利用自然光线，安装智能感应开关，可减少照明用电30%以上。', category: 'lighting', season: null, customer_type: 'family' },
    { title: '企业用电错峰策略', content: '将非紧急生产任务安排在夜间谷电时段，利用峰谷电价差降低用电成本。安装能源管理系统实时监控。', category: 'management', season: null, customer_type: 'enterprise' },
    { title: '光伏系统运维建议', content: '定期清洁光伏面板，检查逆变器运行状态，确保系统发电效率最大化。每季度进行一次专业检测。', category: 'pv', season: null, customer_type: 'enterprise' },
    { title: '园区综合能源优化', content: '实施冷热电三联供，建设分布式光伏和储能系统，引入需求响应机制，实现园区能源最优化配置。', category: 'management', season: null, customer_type: 'park' },
    { title: '春季用电安全提示', content: '春季多雨潮湿，注意电器防潮，定期检查线路老化情况，避免超负荷用电。', category: 'safety', season: 'spring', customer_type: 'individual' },
    { title: '秋季节能小窍门', content: '秋高气爽时节可多开窗通风代替空调，利用自然晾晒代替烘干机，节省大量电力。', category: 'general', season: 'autumn', customer_type: 'family' },
  ]

  const tipCount = db.prepare('SELECT COUNT(*) as count FROM energy_tips').get() as { count: number }
  if (tipCount.count === 0) {
    for (const t of tips) {
      insertTip.run(t.title, t.content, t.category, t.season, t.customer_type)
    }
  }

  const insertPointsTx = db.prepare(`
    INSERT INTO points_transactions (user_id, type, amount, source, description)
    VALUES (?, ?, ?, ?, ?)
  `)

  const pointsTx = [
    { uid: 0, type: 'earn', amount: 200, source: 'bill_pay', desc: '缴纳电费奖励积分' },
    { uid: 0, type: 'earn', amount: 500, source: 'energy_save', desc: '节能达标奖励' },
    { uid: 0, type: 'redeem', amount: -100, source: 'mall', desc: '兑换LED灯泡' },
    { uid: 3, type: 'earn', amount: 300, source: 'pv_generation', desc: '光伏发电奖励积分' },
    { uid: 3, type: 'earn', amount: 800, source: 'bill_pay', desc: '缴纳电费奖励积分' },
    { uid: 6, type: 'earn', amount: 1000, source: 'energy_audit', desc: '完成能源审计奖励' },
    { uid: 6, type: 'earn', amount: 2000, source: 'pv_generation', desc: '光伏发电奖励积分' },
    { uid: 9, type: 'earn', amount: 5000, source: 'carbon_reduction', desc: '碳减排量奖励积分' },
    { uid: 9, type: 'redeem', amount: -2000, source: 'mall', desc: '兑换智能电表' },
  ]

  const pointsTxCount = db.prepare('SELECT COUNT(*) as count FROM points_transactions').get() as { count: number }
  if (pointsTxCount.count === 0) {
    for (const p of pointsTx) {
      insertPointsTx.run(userIds[p.uid], p.type, p.amount, p.source, p.desc)
    }
  }

  const insertMallItem = db.prepare(`
    INSERT INTO mall_items (name, description, points_required, category, stock, image_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const mallItems = [
    { name: 'LED节能灯泡', desc: '高品质LED灯泡，8W相当于60W白炽灯亮度', points: 100, category: 'lighting', stock: 500, img: '/mall/led-bulb.jpg' },
    { name: '智能插座', desc: 'WiFi智能插座，支持远程控制和定时功能', points: 300, category: 'smart_home', stock: 200, img: '/mall/smart-plug.jpg' },
    { name: '节能空调滤网', desc: '高效过滤PM2.5，提升空调效率', points: 200, category: 'hvac', stock: 300, img: '/mall/ac-filter.jpg' },
    { name: '智能温控器', desc: '学习型温控器，自动调节室内温度，节省20%空调用电', points: 800, category: 'smart_home', stock: 100, img: '/mall/thermostat.jpg' },
    { name: '太阳能充电宝', desc: '5000mAh太阳能充电宝，户外应急必备', points: 500, category: 'solar', stock: 150, img: '/mall/solar-charger.jpg' },
    { name: '电费抵扣券50元', desc: '可直接抵扣电费50元', points: 5000, category: 'voucher', stock: 1000, img: '/mall/voucher-50.jpg' },
    { name: '智能电表', desc: '实时监测用电数据，精准掌握用电情况', points: 1500, category: 'smart_home', stock: 80, img: '/mall/smart-meter.jpg' },
    { name: '碳减排证书', desc: '官方认证的碳减排贡献证书', points: 3000, category: 'certificate', stock: 500, img: '/mall/carbon-cert.jpg' },
  ]

  const mallItemCount = db.prepare('SELECT COUNT(*) as count FROM mall_items').get() as { count: number }
  if (mallItemCount.count === 0) {
    for (const m of mallItems) {
      insertMallItem.run(m.name, m.desc, m.points, m.category, m.stock, m.img)
    }
  }

  const insertPolicy = db.prepare(`
    INSERT INTO policies (title, content, category, publish_date, effective_date, source, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const policies = [
    { title: '南方电网2026年分布式光伏并网服务指南', content: '为促进分布式光伏发展，南方电网制定本服务指南，明确并网申请流程、技术要求和补贴政策。居民用户安装屋顶光伏可享受0.42元/度上网电价，工商业用户可参与绿证交易。', category: 'pv', pub: '2026-01-15', eff: '2026-02-01', src: '南方电网', tags: '光伏,并网,补贴' },
    { title: '广东省电力需求响应实施方案', content: '为保障电力供需平衡，广东省实施电力需求响应机制。参与需求响应用户可获得5-20元/千瓦时的补偿费用。大工业用户优先参与，逐步推广至一般工商业用户。', category: 'demand_response', pub: '2026-03-01', eff: '2026-04-01', src: '广东省发改委', tags: '需求响应,补偿,电力平衡' },
    { title: '南方电网绿色电力交易规则', content: '本规则规范绿色电力交易行为，明确绿电交易品种、交易方式、价格机制和结算规则。鼓励企业和园区购买绿电，实现碳中和目标。', category: 'green_trading', pub: '2026-02-20', eff: '2026-03-01', src: '南方电网', tags: '绿电,交易,碳中和' },
    { title: '广州市节能减排财政补贴管理办法', content: '广州市对实施节能改造的企业给予财政补贴，补贴额度为项目投资额的20%-30%。重点支持工业节能、建筑节能和交通节能项目。', category: 'subsidy', pub: '2026-01-10', eff: '2026-01-20', src: '广州市发改委', tags: '补贴,节能,财政' },
    { title: '南方电网充电设施建设运营管理办法', content: '为推动新能源汽车发展，南方电网制定充电设施建设运营管理办法，明确充电桩建设标准、运营规范和电价政策。居民区充电桩执行居民合表电价。', category: 'ev_charging', pub: '2026-04-01', eff: '2026-05-01', src: '南方电网', tags: '充电桩,新能源汽车,电价' },
  ]

  const policyCount = db.prepare('SELECT COUNT(*) as count FROM policies').get() as { count: number }
  if (policyCount.count === 0) {
    for (const p of policies) {
      insertPolicy.run(p.title, p.content, p.category, p.pub, p.eff, p.src, p.tags)
    }
  }

  const insertSafety = db.prepare(`
    INSERT INTO safety_entries (title, content, category, tags)
    VALUES (?, ?, ?, ?)
  `)

  const safetyEntries = [
    { title: '家庭用电安全须知', content: '不私拉乱接电线，不超负荷用电，湿手不碰电器开关。定期检查家中线路，发现老化及时更换。雷雨天气关闭不必要的电器。', category: 'home_safety', tags: '家庭,用电安全,线路' },
    { title: '高压线附近安全距离', content: '10kV高压线安全距离为1.5米，35kV为3米，110kV为4米，220kV为5米。不得在高压线附近放风筝、钓鱼或吊装作业。', category: 'high_voltage', tags: '高压线,安全距离,施工' },
    { title: '触电急救方法', content: '发现触电者首先切断电源或用绝缘物分离带电体。对触电者进行心肺复苏，同时拨打120急救电话。切勿直接用手拉触电者。', category: 'emergency', tags: '触电,急救,心肺复苏' },
    { title: '电气火灾扑救指南', content: '电气火灾必须先断电后灭火。严禁用水扑救带电火灾，应使用干粉灭火器或二氧化碳灭火器。灭火时保持2米以上安全距离。', category: 'fire_safety', tags: '电气火灾,灭火器,断电' },
    { title: '雷雨天气用电注意事项', content: '雷雨天气应关闭窗户，拔掉不必要的电器插头。避免使用有线电话和有线网络。不要在树下避雨或靠近金属构筑物。', category: 'lightning', tags: '雷雨,防雷,电器保护' },
  ]

  const safetyCount = db.prepare('SELECT COUNT(*) as count FROM safety_entries').get() as { count: number }
  if (safetyCount.count === 0) {
    for (const s of safetyEntries) {
      insertSafety.run(s.title, s.content, s.category, s.tags)
    }
  }

  const insertSession = db.prepare(`
    INSERT INTO expert_sessions (title, expert_name, description, live_date, duration_minutes, video_url, viewer_count, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const sessions = [
    { title: '家庭光伏系统选型与安装指南', expert: '李明博士', desc: '详细讲解家庭光伏系统的组件选择、安装流程和注意事项，帮助家庭用户科学决策。', date: '2026-06-15 19:00', dur: 90, url: '/videos/pv-guide.mp4', viewers: 2300, tags: '光伏,家庭,安装' },
    { title: '企业能源管理数字化转型', expert: '张华教授', desc: '分享企业能源管理数字化最佳实践，从数据采集到智能分析的完整解决方案。', date: '2026-06-20 14:00', dur: 120, url: '/videos/enterprise-digital.mp4', viewers: 1500, tags: '企业,数字化,能源管理' },
    { title: '碳交易市场解读与绿证申请', expert: '王芳主任', desc: '深入解读碳交易市场机制，指导企业和个人如何申请和交易绿色电力证书。', date: '2026-06-25 15:00', dur: 60, url: '/videos/carbon-trading.mp4', viewers: 1800, tags: '碳交易,绿证,碳中和' },
    { title: '储能技术应用与投资回报分析', expert: '刘强总工', desc: '介绍储能技术最新进展，分析工商业储能项目的投资回报和商业模式。', date: '2026-07-01 10:00', dur: 90, url: '/videos/energy-storage.mp4', viewers: 980, tags: '储能,投资,商业模式' },
  ]

  const sessionCount = db.prepare('SELECT COUNT(*) as count FROM expert_sessions').get() as { count: number }
  if (sessionCount.count === 0) {
    for (const s of sessions) {
      insertSession.run(s.title, s.expert, s.desc, s.date, s.dur, s.url, s.viewers, s.tags)
    }
  }

  const insertSubsidy = db.prepare(`
    INSERT INTO subsidies (user_id, type, amount, status, applied_at, approved_at, disbursed_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const subsidies = [
    { uid: 0, type: 'pv_installation', amount: 5000, status: 'approved', applied: '2026-03-01', approved: '2026-03-15', disbursed: null, notes: '屋顶光伏安装补贴' },
    { uid: 3, type: 'energy_saving', amount: 2000, status: 'disbursed', applied: '2026-02-01', approved: '2026-02-20', disbursed: '2026-03-01', notes: '家电节能改造补贴' },
    { uid: 4, type: 'energy_saving', amount: 3000, status: 'approved', applied: '2026-03-10', approved: '2026-03-25', disbursed: null, notes: '家庭节能改造补贴' },
    { uid: 6, type: 'pv_installation', amount: 50000, status: 'approved', applied: '2026-01-15', approved: '2026-02-10', disbursed: null, notes: '工商业光伏安装补贴' },
    { uid: 7, type: 'energy_management', amount: 80000, status: 'disbursed', applied: '2026-02-20', approved: '2026-03-05', disbursed: '2026-03-15', notes: '企业能源管理系统补贴' },
    { uid: 8, type: 'pv_installation', amount: 120000, status: 'pending', applied: '2026-05-10', approved: null, disbursed: null, notes: '企业屋顶光伏安装补贴' },
    { uid: 9, type: 'green_transformation', amount: 200000, status: 'pending', applied: '2026-05-01', approved: null, disbursed: null, notes: '园区绿色改造综合补贴' },
    { uid: 10, type: 'pv_installation', amount: 150000, status: 'pending', applied: '2026-04-20', approved: null, disbursed: null, notes: '园区光伏建设补贴' },
    { uid: 11, type: 'demand_response', amount: 80000, status: 'approved', applied: '2026-03-15', approved: '2026-04-01', disbursed: null, notes: '园区需求响应补贴' },
    { uid: 12, type: 'energy_storage', amount: 100000, status: 'disbursed', applied: '2026-02-25', approved: '2026-03-10', disbursed: '2026-03-20', notes: '园区储能系统补贴' },
  ]

  const subsidyCount = db.prepare('SELECT COUNT(*) as count FROM subsidies').get() as { count: number }
  if (subsidyCount.count === 0) {
    for (const s of subsidies) {
      insertSubsidy.run(userIds[s.uid], s.type, s.amount, s.status, s.applied, s.approved, s.disbursed, s.notes)
    }
  }

  const insertGreenRight = db.prepare(`
    INSERT INTO green_rights (user_id, type, value, source, status, issued_at, used_at, expired_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const greenRights = [
    { uid: 0, type: 'green_certificate', value: 1000, source: '光伏发电', status: 'issued', issued: '2026-04-01', used: null, expired: '2027-04-01' },
    { uid: 3, type: 'carbon_credit', value: 500, source: '节能改造', status: 'issued', issued: '2026-03-15', used: null, expired: '2027-03-15' },
    { uid: 4, type: 'carbon_credit', value: 800, source: '家庭节能', status: 'issued', issued: '2026-03-20', used: null, expired: '2027-03-20' },
    { uid: 6, type: 'green_certificate', value: 10000, source: '绿电购买', status: 'used', issued: '2026-01-01', used: '2026-03-01', expired: null },
    { uid: 7, type: 'carbon_credit', value: 15000, source: '企业碳减排', status: 'issued', issued: '2026-02-15', used: null, expired: '2027-02-15' },
    { uid: 8, type: 'green_certificate', value: 12000, source: '企业光伏发电', status: 'issued', issued: '2026-03-10', used: null, expired: '2027-03-10' },
    { uid: 9, type: 'carbon_credit', value: 50000, source: '碳减排', status: 'issued', issued: '2026-02-01', used: null, expired: '2027-02-01' },
    { uid: 9, type: 'green_certificate', value: 25000, source: '光伏发电', status: 'issued', issued: '2026-03-01', used: null, expired: '2027-03-01' },
    { uid: 10, type: 'green_certificate', value: 20000, source: '绿电购买', status: 'expired', issued: '2025-01-01', used: null, expired: '2026-01-01' },
    { uid: 11, type: 'carbon_credit', value: 35000, source: '园区节能改造', status: 'issued', issued: '2026-03-05', used: null, expired: '2027-03-05' },
    { uid: 12, type: 'green_certificate', value: 18000, source: '园区绿电交易', status: 'used', issued: '2026-01-15', used: '2026-04-01', expired: null },
  ]

  const greenRightCount = db.prepare('SELECT COUNT(*) as count FROM green_rights').get() as { count: number }
  if (greenRightCount.count === 0) {
    for (const g of greenRights) {
      insertGreenRight.run(userIds[g.uid], g.type, g.value, g.source, g.status, g.issued, g.used, g.expired)
    }
  }

  const insertAudit = db.prepare(`
    INSERT INTO audit_records (auditor_id, audit_type, target_id, target_type, result, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const audits = [
    { auditor: 0, type: 'compliance', target: 6, ttype: 'user', result: 'pass', details: '企业用户合规检查通过' },
    { auditor: 0, type: 'energy_audit', target: 1, ttype: 'pv_plan', result: 'pass', details: '光伏方案审核通过' },
    { auditor: 6, type: 'subsidy_audit', target: 1, ttype: 'subsidy', result: 'approved', details: '光伏安装补贴申请审核通过' },
    { auditor: 6, type: 'compliance', target: 9, ttype: 'user', result: 'pass', details: '园区用户合规检查通过' },
  ]

  const auditCount = db.prepare('SELECT COUNT(*) as count FROM audit_records').get() as { count: number }
  if (auditCount.count === 0) {
    for (const a of audits) {
      insertAudit.run(userIds[a.auditor], a.type, a.target, a.ttype, a.result, a.details)
    }
  }

  const insertDeviceAlert = db.prepare(`
    INSERT INTO device_alerts (user_id, device_id, alert_type, severity, message, status, created_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const deviceAlerts = [
    { uid: 0, did: 1, atype: 'overload', severity: 'high', msg: '空调运行功率超过额定值80%，建议检查', status: 'open', created: '2026-06-05 10:30:00', resolved: null },
    { uid: 0, did: 2, atype: 'abnormal', severity: 'medium', msg: '热水器温度异常波动', status: 'acknowledged', created: '2026-06-04 15:00:00', resolved: null },
    { uid: 0, did: null, atype: 'maintenance', severity: 'low', msg: '客厅照明设备建议定期维护', status: 'open', created: '2026-06-03 09:00:00', resolved: null },
    { uid: 1, did: 4, atype: 'overload', severity: 'critical', msg: '中央空调负载过高，存在安全隐患', status: 'open', created: '2026-06-05 14:00:00', resolved: null },
    { uid: 4, did: 5, atype: 'offline', severity: 'medium', msg: '智能网关离线超过24小时', status: 'resolved', created: '2026-06-02 08:00:00', resolved: '2026-06-02 18:00:00' },
    { uid: 7, did: 7, atype: 'overload', severity: 'high', msg: '生产车间空调系统运行异常', status: 'open', created: '2026-06-05 11:00:00', resolved: null },
    { uid: 7, did: 8, atype: 'maintenance', severity: 'medium', msg: 'UPS电池组建议进行性能检测', status: 'open', created: '2026-06-04 10:00:00', resolved: null },
    { uid: 8, did: 7, atype: 'overload', severity: 'high', msg: '南沙能源集团配电房负载率超过85%', status: 'acknowledged', created: '2026-06-05 09:30:00', resolved: null },
    { uid: 8, did: 8, atype: 'abnormal', severity: 'critical', msg: '二号变压器温度异常，需要紧急检查', status: 'open', created: '2026-06-05 13:45:00', resolved: null },
    { uid: 10, did: 9, atype: 'abnormal', severity: 'high', msg: '园区照明系统部分区域故障', status: 'acknowledged', created: '2026-06-05 08:30:00', resolved: null },
    { uid: 10, did: 10, atype: 'overload', severity: 'critical', msg: '充电桩组3号桩电流异常', status: 'open', created: '2026-06-05 13:00:00', resolved: null },
    { uid: 11, did: null, atype: 'maintenance', severity: 'low', msg: '园区设备例行维护提醒', status: 'resolved', created: '2026-06-01 09:00:00', resolved: '2026-06-01 17:00:00' },
  ]

  const deviceAlertCount = db.prepare('SELECT COUNT(*) as count FROM device_alerts').get() as { count: number }
  if (deviceAlertCount.count === 0) {
    for (const da of deviceAlerts) {
      insertDeviceAlert.run(userIds[da.uid], da.did, da.atype, da.severity, da.msg, da.status, da.created, da.resolved)
    }
  }

  const insertWeather = db.prepare(`
    INSERT INTO weather_data (area, temperature, humidity, weather_condition, forecast_high, forecast_low, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const weatherData = [
    { area: '广州市', temp: 32.5, humidity: 75, condition: '多云转晴', high: 35, low: 26, recorded: '2026-06-05 14:00:00' },
    { area: '广州市天河区', temp: 33.2, humidity: 72, condition: '晴', high: 35, low: 26, recorded: '2026-06-05 14:30:00' },
    { area: '广州市黄埔区', temp: 31.8, humidity: 78, condition: '多云', high: 34, low: 25, recorded: '2026-06-05 14:00:00' },
    { area: '深圳市', temp: 30.5, humidity: 80, condition: '阵雨', high: 32, low: 25, recorded: '2026-06-05 14:00:00' },
    { area: '佛山市', temp: 32.0, humidity: 74, condition: '晴', high: 34, low: 26, recorded: '2026-06-05 14:00:00' },
  ]

  const weatherCount = db.prepare('SELECT COUNT(*) as count FROM weather_data').get() as { count: number }
  if (weatherCount.count === 0) {
    for (const w of weatherData) {
      insertWeather.run(w.area, w.temp, w.humidity, w.condition, w.high, w.low, w.recorded)
    }
  }

  const insertMeterReading = db.prepare(`
    INSERT INTO meter_readings (user_id, meter_no, reading_kwh, reading_time, voltage, current, power_factor)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const meterReadings = [
    { uid: 0, meter: 'GD20250001', kwh: 3580.5, time: '2026-06-05 14:00:00', v: 220.5, a: 5.2, pf: 0.92 },
    { uid: 1, meter: 'GD20250002', kwh: 4850.2, time: '2026-06-05 14:00:00', v: 219.8, a: 6.8, pf: 0.90 },
    { uid: 2, meter: 'GD20250003', kwh: 2950.8, time: '2026-06-05 14:00:00', v: 220.2, a: 4.5, pf: 0.91 },
    { uid: 3, meter: 'GD20250004', kwh: 6890.3, time: '2026-06-05 14:00:00', v: 221.0, a: 8.5, pf: 0.93 },
    { uid: 4, meter: 'GD20250005', kwh: 8560.2, time: '2026-06-05 14:00:00', v: 219.5, a: 9.2, pf: 0.89 },
    { uid: 5, meter: 'GD20250006', kwh: 5230.6, time: '2026-06-05 14:00:00', v: 220.8, a: 6.5, pf: 0.92 },
    { uid: 6, meter: 'GD20250007', kwh: 7890.4, time: '2026-06-05 14:00:00', v: 220.1, a: 7.8, pf: 0.90 },
    { uid: 7, meter: 'GD20250008', kwh: 156800.5, time: '2026-06-05 14:00:00', v: 380.5, a: 45.2, pf: 0.88 },
    { uid: 8, meter: 'GD20250009', kwh: 98500.2, time: '2026-06-05 14:00:00', v: 380.0, a: 32.5, pf: 0.86 },
    { uid: 9, meter: 'GD20250010', kwh: 76200.8, time: '2026-06-05 14:00:00', v: 381.2, a: 28.3, pf: 0.87 },
    { uid: 10, meter: 'GD20250011', kwh: 895000.8, time: '2026-06-05 14:00:00', v: 10500.0, a: 120.5, pf: 0.91 },
    { uid: 11, meter: 'GD20250012', kwh: 625000.3, time: '2026-06-05 14:00:00', v: 10500.0, a: 85.3, pf: 0.89 },
    { uid: 12, meter: 'GD20250013', kwh: 456000.5, time: '2026-06-05 14:00:00', v: 10500.0, a: 62.8, pf: 0.90 },
  ]

  const meterCount = db.prepare('SELECT COUNT(*) as count FROM meter_readings').get() as { count: number }
  if (meterCount.count === 0) {
    for (const mr of meterReadings) {
      insertMeterReading.run(userIds[mr.uid], mr.meter, mr.kwh, mr.time, mr.v, mr.a, mr.pf)
    }
  }

  const insertPriceTariff = db.prepare(`
    INSERT INTO price_tariffs (customer_type, period_type, price_per_kwh, effective_from, effective_to)
    VALUES (?, ?, ?, ?, ?)
  `)

  const priceTariffs = [
    { ctype: 'individual', ptype: 'peak', price: 0.84, from: '2026-01-01', to: null },
    { ctype: 'individual', ptype: 'flat', price: 0.63, from: '2026-01-01', to: null },
    { ctype: 'individual', ptype: 'valley', price: 0.30, from: '2026-01-01', to: null },
    { ctype: 'family', ptype: 'peak', price: 0.82, from: '2026-01-01', to: null },
    { ctype: 'family', ptype: 'flat', price: 0.61, from: '2026-01-01', to: null },
    { ctype: 'family', ptype: 'valley', price: 0.28, from: '2026-01-01', to: null },
    { ctype: 'enterprise', ptype: 'peak', price: 0.95, from: '2026-01-01', to: null },
    { ctype: 'enterprise', ptype: 'flat', price: 0.72, from: '2026-01-01', to: null },
    { ctype: 'enterprise', ptype: 'valley', price: 0.35, from: '2026-01-01', to: null },
    { ctype: 'park', ptype: 'peak', price: 0.92, from: '2026-01-01', to: null },
    { ctype: 'park', ptype: 'flat', price: 0.70, from: '2026-01-01', to: null },
    { ctype: 'park', ptype: 'valley', price: 0.33, from: '2026-01-01', to: null },
  ]

  const priceCount = db.prepare('SELECT COUNT(*) as count FROM price_tariffs').get() as { count: number }
  if (priceCount.count === 0) {
    for (const pt of priceTariffs) {
      insertPriceTariff.run(pt.ctype, pt.ptype, pt.price, pt.from, pt.to)
    }
  }

  const subsidiesWithTimeline = db.prepare('SELECT id, status, applied_at, approved_at, disbursed_at FROM subsidies').all() as any[]
  const updateSubsidyTimeline = db.prepare('UPDATE subsidies SET timeline = ? WHERE id = ?')

  for (const s of subsidiesWithTimeline) {
    const timeline: any = {
      submitted: s.applied_at,
      reviewed: s.applied_at ? dayjs(s.applied_at).add(1, 'day').format('YYYY-MM-DD HH:mm:ss') : null,
    }
    if (s.status === 'approved' || s.status === 'disbursed') {
      timeline.approved = s.approved_at
      timeline.notified = dayjs(s.approved_at).add(1, 'hour').format('YYYY-MM-DD HH:mm:ss')
    }
    if (s.status === 'disbursed') {
      timeline.disbursed = s.disbursed_at
      timeline.completed = dayjs(s.disbursed_at).add(2, 'day').format('YYYY-MM-DD HH:mm:ss')
    }
    if (s.status === 'rejected') {
      timeline.rejected = s.applied_at ? dayjs(s.applied_at).add(3, 'day').format('YYYY-MM-DD HH:mm:ss') : null
    }
    updateSubsidyTimeline.run(JSON.stringify(timeline), s.id)
  }

  const insertGreenRightsTrace = db.prepare(`
    INSERT INTO green_rights_trace (right_id, action, operator_id, details)
    VALUES (?, ?, ?, ?)
  `)

  const greenRightsTraceData = [
    { rid: 1, action: 'issued', operator: 0, details: '系统自动发放绿色权益' },
    { rid: 2, action: 'issued', operator: 0, details: '节能改造奖励发放' },
    { rid: 3, action: 'issued', operator: 0, details: '绿电购买权益发放' },
    { rid: 3, action: 'redeemed', operator: 6, details: '用户申请核销，用于抵扣电费' },
    { rid: 4, action: 'issued', operator: 0, details: '碳减排奖励发放' },
    { rid: 5, action: 'issued', operator: 0, details: '光伏发电奖励发放' },
    { rid: 6, action: 'issued', operator: 0, details: '绿电购买权益发放' },
    { rid: 6, action: 'expired', operator: null, details: '权益已过期失效' },
  ]

  const greenRightsTraceCount = db.prepare('SELECT COUNT(*) as count FROM green_rights_trace').get() as { count: number }
  if (greenRightsTraceCount.count === 0) {
    const greenRightsIds = db.prepare('SELECT id FROM green_rights ORDER BY id').all() as { id: number }[]
    for (const grt of greenRightsTraceData) {
      const rightId = greenRightsIds[grt.rid - 1]?.id
      if (rightId) {
        insertGreenRightsTrace.run(rightId, grt.action, grt.operator ? userIds[grt.operator] : null, grt.details)
      }
    }
  }

  const outageSentCount = db.prepare('SELECT COUNT(*) as count FROM outage_notices WHERE notification_sent = 1').get() as { count: number }
  if (outageSentCount.count === 0) {
    db.prepare('UPDATE outage_notices SET notification_sent = 1, notified_users = affected_users WHERE id IN (1, 2, 4)').run()
  }

  console.log('Database seeded successfully with', userIds.length, 'users and associated data')
}

export default db
