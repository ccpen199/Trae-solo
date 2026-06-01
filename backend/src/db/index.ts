import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const dbPath = process.env.DB_PATH || './data/app.sqlite'
const fullDbPath = path.resolve(__dirname, '../../', dbPath)

import fs from 'fs'
const dbDir = path.dirname(fullDbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(fullDbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export default db

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      gender TEXT,
      birth_date DATE,
      phone TEXT,
      id_card TEXT,
      address TEXT,
      email TEXT,
      medical_history TEXT,
      allergies TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patient_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS chairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS treatments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      duration INTEGER NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      chair_id INTEGER NOT NULL,
      treatment_id INTEGER,
      appointment_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      status TEXT DEFAULT 'scheduled',
      notes TEXT,
      cancel_reason TEXT,
      reschedule_reason TEXT,
      missed_count INTEGER DEFAULT 0,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id) REFERENCES users(id),
      FOREIGN KEY (chair_id) REFERENCES chairs(id),
      FOREIGN KEY (treatment_id) REFERENCES treatments(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS treatment_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      appointment_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'draft',
      patient_confirmed BOOLEAN DEFAULT 0,
      confirmed_at DATETIME,
      doctor_opinion TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id) REFERENCES users(id),
      FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    );

    CREATE TABLE IF NOT EXISTS treatment_plan_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      treatment_id INTEGER NOT NULL,
      tooth_position TEXT,
      phase INTEGER,
      price REAL NOT NULL,
      quantity INTEGER DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES treatment_plans(id),
      FOREIGN KEY (treatment_id) REFERENCES treatments(id)
    );

    CREATE TABLE IF NOT EXISTS supplies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      unit TEXT NOT NULL,
      quantity REAL DEFAULT 0,
      min_quantity REAL DEFAULT 0,
      price REAL NOT NULL,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS treatment_supplies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      treatment_id INTEGER NOT NULL,
      supply_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      FOREIGN KEY (treatment_id) REFERENCES treatments(id),
      FOREIGN KEY (supply_id) REFERENCES supplies(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      plan_id INTEGER,
      appointment_id INTEGER,
      total_amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      payment_method TEXT,
      paid_at DATETIME,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (plan_id) REFERENCES treatment_plans(id),
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      treatment_id INTEGER,
      supply_id INTEGER,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER DEFAULT 1,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      FOREIGN KEY (treatment_id) REFERENCES treatments(id),
      FOREIGN KEY (supply_id) REFERENCES supplies(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      transaction_no TEXT,
      notes TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      payment_id INTEGER,
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      approved_by INTEGER,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      FOREIGN KEY (payment_id) REFERENCES payments(id),
      FOREIGN KEY (approved_by) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS follow_up_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      appointment_id INTEGER,
      reminder_date DATE NOT NULL,
      reminder_type TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      sent_at DATETIME,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS visit_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      appointment_id INTEGER,
      doctor_id INTEGER NOT NULL,
      diagnosis TEXT,
      treatment TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (doctor_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_date ON follow_up_reminders(reminder_date);
  `)

  const chairCount = db.prepare('SELECT COUNT(*) as count FROM chairs').get() as { count: number }
  if (chairCount.count === 0) {
    const insertChair = db.prepare('INSERT INTO chairs (name, status) VALUES (?, ?)')
    insertChair.run('1号椅位', 'active')
    insertChair.run('2号椅位', 'active')
    insertChair.run('3号椅位', 'active')
  }

  const treatmentCount = db.prepare('SELECT COUNT(*) as count FROM treatments').get() as { count: number }
  if (treatmentCount.count === 0) {
    const insertTreatment = db.prepare('INSERT INTO treatments (name, code, duration, price, category) VALUES (?, ?, ?, ?, ?)')
    insertTreatment.run('口腔检查', 'EXAM001', 30, 50, '检查')
    insertTreatment.run('洗牙', 'CLEAN001', 45, 200, '基础治疗')
    insertTreatment.run('补牙', 'FILL001', 60, 300, '基础治疗')
    insertTreatment.run('根管治疗', 'ROOT001', 90, 800, '牙髓治疗')
    insertTreatment.run('拔牙', 'EXTRACT001', 45, 200, '外科')
    insertTreatment.run('烤瓷牙冠', 'CROWN001', 120, 1500, '修复')
    insertTreatment.run('牙齿矫正', 'ORTHO001', 60, 5000, '正畸')
  }

  const supplyCount = db.prepare('SELECT COUNT(*) as count FROM supplies').get() as { count: number }
  if (supplyCount.count === 0) {
    const insertSupply = db.prepare('INSERT INTO supplies (name, code, unit, quantity, min_quantity, price, category) VALUES (?, ?, ?, ?, ?, ?, ?)')
    insertSupply.run('一次性口罩', 'MASK001', '个', 500, 100, 1.5, '耗材')
    insertSupply.run('一次性手套', 'GLOVE001', '副', 300, 50, 2, '耗材')
    insertSupply.run('补牙树脂', 'RESIN001', '支', 50, 10, 80, '材料')
    insertSupply.run('麻醉剂', 'ANES001', '支', 100, 20, 15, '药品')
  }
}
