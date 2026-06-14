import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbDir = path.join(__dirname, '..', 'server', 'src', 'data')
const dbPath = path.join(dbDir, 'app.sqlite')

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function migrateDatabase() {
  function hasColumn(table: string, col: string): boolean {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]
    return cols.some(c => c.name === col)
  }

  if (hasColumn('users', 'real_name') && !hasColumn('users', 'name')) {
    try { db.exec("ALTER TABLE users RENAME COLUMN real_name TO name") } catch {}
  }
  if (!hasColumn('users', 'name')) {
    try { db.exec("ALTER TABLE users ADD COLUMN name TEXT") } catch {}
  }
  if (!hasColumn('users', 'phone')) {
    try { db.exec("ALTER TABLE users ADD COLUMN phone TEXT") } catch {}
  }
  if (!hasColumn('users', 'role')) {
    try { db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'driver'") } catch {}
  }
  if (!hasColumn('users', 'avatar')) {
    try { db.exec("ALTER TABLE users ADD COLUMN avatar TEXT") } catch {}
  }

  if (!hasColumn('driver_profiles', 'id_card_no')) {
    try { db.exec("ALTER TABLE driver_profiles ADD COLUMN id_card_no TEXT") } catch {}
  }
  if (!hasColumn('driver_profiles', 'id_card_front')) {
    try { db.exec("ALTER TABLE driver_profiles ADD COLUMN id_card_front TEXT") } catch {}
  }
  if (!hasColumn('driver_profiles', 'id_card_back')) {
    try { db.exec("ALTER TABLE driver_profiles ADD COLUMN id_card_back TEXT") } catch {}
  }
  if (!hasColumn('driver_profiles', 'transport_license_no')) {
    try { db.exec("ALTER TABLE driver_profiles ADD COLUMN transport_license_no TEXT") } catch {}
  }
  if (!hasColumn('driver_profiles', 'transport_license_image')) {
    try { db.exec("ALTER TABLE driver_profiles ADD COLUMN transport_license_image TEXT") } catch {}
  }
  if (!hasColumn('driver_profiles', 'qualification_no')) {
    try { db.exec("ALTER TABLE driver_profiles ADD COLUMN qualification_no TEXT") } catch {}
  }
  if (!hasColumn('driver_profiles', 'qualification_image')) {
    try { db.exec("ALTER TABLE driver_profiles ADD COLUMN qualification_image TEXT") } catch {}
  }
  if (!hasColumn('driver_profiles', 'certification_status')) {
    try { db.exec("ALTER TABLE driver_profiles ADD COLUMN certification_status TEXT NOT NULL DEFAULT 'none'") } catch {}
  }
  if (!hasColumn('driver_profiles', 'certification_reason')) {
    try { db.exec("ALTER TABLE driver_profiles ADD COLUMN certification_reason TEXT") } catch {}
  }
  if (!hasColumn('driver_profiles', 'bank_card_no')) {
    try { db.exec("ALTER TABLE driver_profiles ADD COLUMN bank_card_no TEXT") } catch {}
  }
  if (!hasColumn('driver_profiles', 'bank_name')) {
    try { db.exec("ALTER TABLE driver_profiles ADD COLUMN bank_name TEXT") } catch {}
  }

  if (!hasColumn('shipper_profiles', 'company_name')) {
    try { db.exec("ALTER TABLE shipper_profiles ADD COLUMN company_name TEXT") } catch {}
  }
  if (!hasColumn('shipper_profiles', 'credit_code')) {
    try { db.exec("ALTER TABLE shipper_profiles ADD COLUMN credit_code TEXT") } catch {}
  }

  if (!hasColumn('freights', 'description')) {
    try { db.exec("ALTER TABLE freights ADD COLUMN description TEXT") } catch {}
  }

  if (!hasColumn('invoices', 'order_id')) {
    try { db.exec("ALTER TABLE invoices ADD COLUMN order_id TEXT") } catch {}
  }
  if (!hasColumn('invoices', 'invoice_entity_id')) {
    try { db.exec("ALTER TABLE invoices ADD COLUMN invoice_entity_id TEXT") } catch {}
  }
  if (!hasColumn('invoices', 'invoice_no')) {
    try { db.exec("ALTER TABLE invoices ADD COLUMN invoice_no TEXT") } catch {}
  }
  if (!hasColumn('invoices', 'invoice_code')) {
    try { db.exec("ALTER TABLE invoices ADD COLUMN invoice_code TEXT") } catch {}
  }
  if (!hasColumn('invoices', 'amount')) {
    try { db.exec("ALTER TABLE invoices ADD COLUMN amount REAL") } catch {}
  }
  if (!hasColumn('invoices', 'tax_rate')) {
    try { db.exec("ALTER TABLE invoices ADD COLUMN tax_rate REAL") } catch {}
  }
  if (!hasColumn('invoices', 'tax_amount')) {
    try { db.exec("ALTER TABLE invoices ADD COLUMN tax_amount REAL") } catch {}
  }
  if (!hasColumn('invoices', 'status')) {
    try { db.exec("ALTER TABLE invoices ADD COLUMN status TEXT DEFAULT 'pending'") } catch {}
  }
  if (!hasColumn('invoices', 'issued_at')) {
    try { db.exec("ALTER TABLE invoices ADD COLUMN issued_at TEXT") } catch {}
  }

  if (!hasColumn('settlements', 'order_id')) {
    try { db.exec("ALTER TABLE settlements ADD COLUMN order_id TEXT") } catch {}
  }
  if (!hasColumn('settlements', 'payer_id')) {
    try { db.exec("ALTER TABLE settlements ADD COLUMN payer_id TEXT") } catch {}
  }
  if (!hasColumn('settlements', 'payee_id')) {
    try { db.exec("ALTER TABLE settlements ADD COLUMN payee_id TEXT") } catch {}
  }
  if (!hasColumn('settlements', 'total_amount')) {
    try { db.exec("ALTER TABLE settlements ADD COLUMN total_amount REAL") } catch {}
  }
  if (!hasColumn('settlements', 'freight_amount')) {
    try { db.exec("ALTER TABLE settlements ADD COLUMN freight_amount REAL") } catch {}
  }
  if (!hasColumn('settlements', 'fuel_amount')) {
    try { db.exec("ALTER TABLE settlements ADD COLUMN fuel_amount REAL") } catch {}
  }
  if (!hasColumn('settlements', 'insurance_amount')) {
    try { db.exec("ALTER TABLE settlements ADD COLUMN insurance_amount REAL") } catch {}
  }
  if (!hasColumn('settlements', 'platform_fee')) {
    try { db.exec("ALTER TABLE settlements ADD COLUMN platform_fee REAL") } catch {}
  }
  if (!hasColumn('settlements', 'status')) {
    try { db.exec("ALTER TABLE settlements ADD COLUMN status TEXT DEFAULT 'pending'") } catch {}
  }
  if (!hasColumn('settlements', 'created_at')) {
    try { db.exec("ALTER TABLE settlements ADD COLUMN created_at TEXT") } catch {}
  }

  if (!hasColumn('withdrawals', 'driver_id')) {
    try { db.exec("ALTER TABLE withdrawals ADD COLUMN driver_id TEXT") } catch {}
  }
  if (!hasColumn('withdrawals', 'amount')) {
    try { db.exec("ALTER TABLE withdrawals ADD COLUMN amount REAL") } catch {}
  }
  if (!hasColumn('withdrawals', 'bank_card_no')) {
    try { db.exec("ALTER TABLE withdrawals ADD COLUMN bank_card_no TEXT") } catch {}
  }
  if (!hasColumn('withdrawals', 'status')) {
    try { db.exec("ALTER TABLE withdrawals ADD COLUMN status TEXT DEFAULT 'pending'") } catch {}
  }
  if (!hasColumn('withdrawals', 'created_at')) {
    try { db.exec("ALTER TABLE withdrawals ADD COLUMN created_at TEXT") } catch {}
  }

  if (!hasColumn('safety_checks', 'order_id')) {
    try { db.exec("ALTER TABLE safety_checks ADD COLUMN order_id TEXT") } catch {}
  }
  if (!hasColumn('safety_checks', 'driver_id')) {
    try { db.exec("ALTER TABLE safety_checks ADD COLUMN driver_id TEXT") } catch {}
  }
  if (!hasColumn('safety_checks', 'check_items')) {
    try { db.exec("ALTER TABLE safety_checks ADD COLUMN check_items TEXT") } catch {}
  }
  if (!hasColumn('safety_checks', 'photos')) {
    try { db.exec("ALTER TABLE safety_checks ADD COLUMN photos TEXT") } catch {}
  }
  if (!hasColumn('safety_checks', 'status')) {
    try { db.exec("ALTER TABLE safety_checks ADD COLUMN status TEXT") } catch {}
  }
  if (!hasColumn('safety_checks', 'checked_at')) {
    try { db.exec("ALTER TABLE safety_checks ADD COLUMN checked_at TEXT") } catch {}
  }

  if (!hasColumn('driving_logs', 'driver_id')) {
    try { db.exec("ALTER TABLE driving_logs ADD COLUMN driver_id TEXT") } catch {}
  }
  if (!hasColumn('driving_logs', 'order_id')) {
    try { db.exec("ALTER TABLE driving_logs ADD COLUMN order_id TEXT") } catch {}
  }
  if (!hasColumn('driving_logs', 'start_time')) {
    try { db.exec("ALTER TABLE driving_logs ADD COLUMN start_time TEXT") } catch {}
  }
  if (!hasColumn('driving_logs', 'end_time')) {
    try { db.exec("ALTER TABLE driving_logs ADD COLUMN end_time TEXT") } catch {}
  }
  if (!hasColumn('driving_logs', 'mileage')) {
    try { db.exec("ALTER TABLE driving_logs ADD COLUMN mileage REAL") } catch {}
  }
  if (!hasColumn('driving_logs', 'weather')) {
    try { db.exec("ALTER TABLE driving_logs ADD COLUMN weather TEXT") } catch {}
  }
  if (!hasColumn('driving_logs', 'road_condition')) {
    try { db.exec("ALTER TABLE driving_logs ADD COLUMN road_condition TEXT") } catch {}
  }
  if (!hasColumn('driving_logs', 'remarks')) {
    try { db.exec("ALTER TABLE driving_logs ADD COLUMN remarks TEXT") } catch {}
  }

  if (!hasColumn('waybills', 'order_id')) {
    try { db.exec("ALTER TABLE waybills ADD COLUMN order_id TEXT") } catch {}
  }
  if (!hasColumn('waybills', 'waybill_no')) {
    try { db.exec("ALTER TABLE waybills ADD COLUMN waybill_no TEXT") } catch {}
  }
  if (!hasColumn('waybills', 'electronic_data')) {
    try { db.exec("ALTER TABLE waybills ADD COLUMN electronic_data TEXT") } catch {}
  }
  if (!hasColumn('waybills', 'archived_at')) {
    try { db.exec("ALTER TABLE waybills ADD COLUMN archived_at TEXT") } catch {}
  }

  if (!hasColumn('orders', 'freight_id')) {
    try { db.exec("ALTER TABLE orders ADD COLUMN freight_id TEXT") } catch {}
  }
  if (!hasColumn('orders', 'driver_id')) {
    try { db.exec("ALTER TABLE orders ADD COLUMN driver_id TEXT") } catch {}
  }
  if (!hasColumn('orders', 'shipper_id')) {
    try { db.exec("ALTER TABLE orders ADD COLUMN shipper_id TEXT") } catch {}
  }
  if (!hasColumn('orders', 'status')) {
    try { db.exec("ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending'") } catch {}
  }
  if (!hasColumn('orders', 'waybill_no')) {
    try { db.exec("ALTER TABLE orders ADD COLUMN waybill_no TEXT") } catch {}
  }
  if (!hasColumn('orders', 'pickup_time')) {
    try { db.exec("ALTER TABLE orders ADD COLUMN pickup_time TEXT") } catch {}
  }
  if (!hasColumn('orders', 'delivery_time')) {
    try { db.exec("ALTER TABLE orders ADD COLUMN delivery_time TEXT") } catch {}
  }
  if (!hasColumn('orders', 'total_fee')) {
    try { db.exec("ALTER TABLE orders ADD COLUMN total_fee REAL DEFAULT 0") } catch {}
  }
  if (!hasColumn('orders', 'created_at')) {
    try { db.exec("ALTER TABLE orders ADD COLUMN created_at TEXT") } catch {}
  }

  const cols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[]
  const hasReal = cols.some(c => c.name === 'real_name')
  const hasPhone = cols.some(c => c.name === 'phone')
  if (hasReal || hasPhone) {
    try {
      const allCols = cols.map(c => c.name).join(',')
      const rows = db.prepare(`SELECT ${allCols} FROM users`).all() as any[]
      for (const r of rows) {
        const setName = r.name || r.real_name || r.username || '用户'
        const setPhone = r.phone || r.username || ''
        const setRole = r.role || (r.role === 'cargo_owner' ? 'shipper' : 'driver')
        db.prepare("UPDATE users SET name = ?, phone = ?, role = ? WHERE id = ?").run(setName, setPhone, setRole, r.id)
      }
    } catch {}
  }
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('driver', 'shipper', 'admin')),
      avatar TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS driver_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
      id_card_no TEXT,
      id_card_front TEXT,
      id_card_back TEXT,
      transport_license_no TEXT,
      transport_license_image TEXT,
      qualification_no TEXT,
      qualification_image TEXT,
      certification_status TEXT NOT NULL DEFAULT 'none' CHECK(certification_status IN ('none', 'pending', 'passed', 'failed')),
      certification_reason TEXT,
      bank_card_no TEXT,
      bank_name TEXT
    );

    CREATE TABLE IF NOT EXISTS shipper_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
      company_name TEXT,
      credit_code TEXT
    );

    CREATE TABLE IF NOT EXISTS invoice_entities (
      id TEXT PRIMARY KEY,
      shipper_id TEXT NOT NULL REFERENCES users(id),
      company_name TEXT NOT NULL,
      tax_no TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      bank_name TEXT,
      bank_account TEXT
    );

    CREATE TABLE IF NOT EXISTS freights (
      id TEXT PRIMARY KEY,
      shipper_id TEXT NOT NULL REFERENCES users(id),
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      goods_type TEXT NOT NULL,
      weight REAL NOT NULL,
      freight_fee REAL NOT NULL,
      need_vat INTEGER NOT NULL DEFAULT 0,
      invoice_entity_id TEXT REFERENCES invoice_entities(id),
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'accepted', 'cancelled')),
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      freight_id TEXT NOT NULL REFERENCES freights(id),
      driver_id TEXT NOT NULL REFERENCES users(id),
      shipper_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'pickup', 'transit', 'delivered', 'completed')),
      waybill_no TEXT,
      pickup_time TEXT,
      delivery_time TEXT,
      total_fee REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gps_tracks (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      speed REAL,
      recorded_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      invoice_entity_id TEXT NOT NULL REFERENCES invoice_entities(id),
      invoice_no TEXT,
      invoice_code TEXT,
      amount REAL NOT NULL,
      tax_rate REAL NOT NULL,
      tax_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'issued', 'voided')),
      issued_at TEXT
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      payer_id TEXT NOT NULL REFERENCES users(id),
      payee_id TEXT NOT NULL REFERENCES users(id),
      total_amount REAL NOT NULL,
      freight_amount REAL NOT NULL,
      fuel_amount REAL NOT NULL,
      insurance_amount REAL NOT NULL,
      platform_fee REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS withdrawals (
      id TEXT PRIMARY KEY,
      driver_id TEXT NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      bank_card_no TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS safety_checks (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      driver_id TEXT NOT NULL REFERENCES users(id),
      check_items TEXT NOT NULL,
      photos TEXT,
      status TEXT NOT NULL CHECK(status IN ('pass', 'fail')),
      checked_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS driving_logs (
      id TEXT PRIMARY KEY,
      driver_id TEXT NOT NULL REFERENCES users(id),
      order_id TEXT REFERENCES orders(id),
      start_time TEXT NOT NULL,
      end_time TEXT,
      mileage REAL,
      weather TEXT,
      road_condition TEXT,
      remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS waybills (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      waybill_no TEXT NOT NULL,
      electronic_data TEXT NOT NULL,
      archived_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_freights_status ON freights(status);
    CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(driver_id);
    CREATE INDEX IF NOT EXISTS idx_orders_shipper ON orders(shipper_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_gps_order ON gps_tracks(order_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id);
    CREATE INDEX IF NOT EXISTS idx_settlements_order ON settlements(order_id);
    CREATE INDEX IF NOT EXISTS idx_safety_checks_order ON safety_checks(order_id);
    CREATE INDEX IF NOT EXISTS idx_driving_logs_driver ON driving_logs(driver_id);
  `)
}

migrateDatabase()
initDatabase()

export default db
