/**
 * Database connection and initialization
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('tenant','buyer','owner','agent_self','agent_franchise','admin')),
      credit_score INTEGER DEFAULT 650,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('shared_rent','whole_rent','apartment','second_hand')),
      address TEXT NOT NULL,
      area REAL NOT NULL,
      price REAL NOT NULL,
      owner_id INTEGER REFERENCES users(id),
      agent_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','active','contracted','sold','rented','offline')),
      vr_url TEXT,
      floor_plan_json TEXT,
      floor INTEGER,
      total_floor INTEGER,
      decoration_level TEXT CHECK(decoration_level IN ('rough','simple','medium','luxury')),
      community TEXT,
      rooms INTEGER,
      halls INTEGER,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS valuations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER REFERENCES properties(id),
      base_price REAL NOT NULL,
      decoration_index REAL NOT NULL DEFAULT 1.0,
      floor_coefficient REAL NOT NULL DEFAULT 1.0,
      community_avg REAL NOT NULL,
      estimated_price REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER REFERENCES properties(id),
      owner_id INTEGER REFERENCES users(id),
      agent_id INTEGER REFERENCES users(id),
      template_type TEXT NOT NULL CHECK(template_type IN ('rent_commission','sale_commission','lease')),
      sign_hash TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','signed','archived')),
      signed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER REFERENCES properties(id),
      buyer_id INTEGER REFERENCES users(id),
      seller_id INTEGER REFERENCES users(id),
      agent_id INTEGER REFERENCES users(id),
      price REAL NOT NULL,
      commission_rate REAL NOT NULL DEFAULT 0.025,
      commission_amount REAL NOT NULL,
      fund_status TEXT DEFAULT 'pending' CHECK(fund_status IN ('pending','deposited','released','refunded')),
      status TEXT DEFAULT 'negotiating' CHECK(status IN ('negotiating','contracted','funded','transferring','completed','cancelled')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS transfer_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER REFERENCES transactions(id),
      node_name TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','completed')),
      completed_at TEXT,
      sort_order INTEGER NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS leases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER REFERENCES properties(id),
      tenant_id INTEGER REFERENCES users(id),
      agent_id INTEGER REFERENCES users(id),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      monthly_rent REAL NOT NULL,
      deposit REAL NOT NULL,
      deposit_status TEXT DEFAULT 'held' CHECK(deposit_status IN ('held','partial_refund','refunded','deducted')),
      payment_method TEXT DEFAULT 'auto' CHECK(payment_method IN ('auto','manual')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active','expired','terminated','renewed')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS rent_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lease_id INTEGER REFERENCES leases(id),
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      paid_date TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','overdue','waived'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('cleaning','repair','moving','renovation')),
      property_id INTEGER REFERENCES properties(id),
      reporter_id INTEGER REFERENCES users(id),
      assignee_id INTEGER REFERENCES users(id),
      supplier_id INTEGER REFERENCES suppliers(id),
      description TEXT NOT NULL,
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','assigned','in_progress','completed','cancelled')),
      sla_hours INTEGER NOT NULL DEFAULT 48,
      deadline TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS work_order_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_order_id INTEGER REFERENCES work_orders(id),
      action TEXT NOT NULL,
      remark TEXT,
      operator_id INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('material','housekeeping','moving','renovation')),
      contact TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','suspended','terminated')),
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_leases_status ON leases(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_leases_tenant ON leases(tenant_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_work_orders_type ON work_orders(type)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_rent_payments_lease ON rent_payments(lease_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_rent_payments_status ON rent_payments(status)`);
}
