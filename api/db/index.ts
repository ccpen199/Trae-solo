import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/app.sqlite');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    license_no TEXT UNIQUE NOT NULL,
    specialty TEXT NOT NULL,
    title TEXT NOT NULL,
    practice_scope TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    available_institutions TEXT,
    visit_price REAL DEFAULT 0,
    compliance_status TEXT DEFAULT 'pending',
    practice_cert_expiry TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS institutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    contact TEXT,
    min_qualification TEXT DEFAULT '主治医师',
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    institution_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    room_count INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id)
  )`,
  `CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER NOT NULL,
    institution_id INTEGER NOT NULL,
    department_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    slot_count INTEGER DEFAULT 20,
    status TEXT DEFAULT 'draft',
    conflicts TEXT,
    is_hospital_shift INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (institution_id) REFERENCES institutions(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
  )`,
  `CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER NOT NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    slot_time TEXT NOT NULL,
    status TEXT DEFAULT 'scheduled',
    rescheduled_from INTEGER,
    notification_log TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id)
  )`,
  `CREATE TABLE IF NOT EXISTS settlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period TEXT NOT NULL,
    doctor_id INTEGER NOT NULL,
    institution_id INTEGER NOT NULL,
    visit_count INTEGER DEFAULT 0,
    total_income REAL DEFAULT 0,
    default_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (institution_id) REFERENCES institutions(id)
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    operator TEXT DEFAULT 'system',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_schedules_doctor_date ON schedules(doctor_id, date)`,
  `CREATE INDEX IF NOT EXISTS idx_schedules_institution_date ON schedules(institution_id, date)`,
  `CREATE INDEX IF NOT EXISTS idx_appointments_schedule ON appointments(schedule_id)`,
];

export function initDatabase(): void {
  const transaction = db.transaction(() => {
    for (const ddl of DDL_STATEMENTS) {
      db.exec(ddl);
    }
  });
  transaction();
}

export function createAuditLog(
  entityType: string,
  entityId: number,
  action: string,
  oldValue?: unknown,
  newValue?: unknown,
  operator: string = 'system'
): void {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (entity_type, entity_id, action, old_value, new_value, operator)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    entityType,
    entityId,
    action,
    oldValue !== undefined ? JSON.stringify(oldValue) : null,
    newValue !== undefined ? JSON.stringify(newValue) : null,
    operator
  );
}

export { db };
export default db;
