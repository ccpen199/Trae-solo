import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = process.env.DATABASE_PATH 
  ? path.resolve(__dirname, '..', process.env.DATABASE_PATH)
  : path.resolve(__dirname, '..', 'data', 'app.sqlite')

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS banquet_halls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      capacity INTEGER NOT NULL,
      min_consumption REAL DEFAULT 0,
      location TEXT,
      facilities TEXT,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hall_id INTEGER NOT NULL,
      booking_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      tables_count INTEGER NOT NULL,
      min_consumption REAL DEFAULT 0,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      event_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hall_id) REFERENCES banquet_halls(id),
      UNIQUE(hall_id, booking_date, start_time, end_time)
    );

    CREATE TABLE IF NOT EXISTS sales_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      version INTEGER DEFAULT 1,
      menu_items TEXT,
      drinks TEXT,
      decorations TEXT,
      equipment TEXT,
      service_fee REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      is_locked INTEGER DEFAULT 0,
      confirmed_at DATETIME,
      confirmed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      contract_number TEXT UNIQUE,
      total_amount REAL DEFAULT 0,
      deposit_amount REAL DEFAULT 0,
      deposit_received INTEGER DEFAULT 0,
      deposit_received_at DATETIME,
      refund_rules TEXT,
      status TEXT DEFAULT 'draft',
      signed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    );

    CREATE TABLE IF NOT EXISTS payment_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_type TEXT NOT NULL,
      payment_method TEXT,
      transaction_no TEXT,
      status TEXT DEFAULT 'completed',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      FOREIGN KEY (contract_id) REFERENCES contracts(id)
    );

    CREATE TABLE IF NOT EXISTS execution_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      department TEXT NOT NULL,
      content TEXT NOT NULL,
      assignee TEXT,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'normal',
      due_time DATETIME,
      completed_at DATETIME,
      completed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    );

    CREATE TABLE IF NOT EXISTS change_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      related_type TEXT NOT NULL,
      related_id INTEGER NOT NULL,
      change_type TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  const hallCount = db.prepare('SELECT COUNT(*) as count FROM banquet_halls').get() as { count: number }
  if (hallCount.count === 0) {
    const insertHall = db.prepare(`
      INSERT INTO banquet_halls (name, capacity, min_consumption, location, facilities, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const halls = [
      ['宴会厅A', 30, 3000, '一楼', '音响,投影,舞台', '可容纳30桌大型宴会厅'],
      ['宴会厅B', 20, 2000, '二楼', '音响,投影', '中型宴会厅'],
      ['宴会厅C', 10, 1000, '三楼', '音响', '小型宴会厅'],
      ['多功能厅', 15, 1500, '一楼', '音响,投影,舞台,LED屏', '多功能会议厅']
    ]
    halls.forEach(h => insertHall.run(...h))
  }
}

export default db
