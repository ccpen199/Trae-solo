require('dotenv').config({ path: '../../.env' });
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS fleets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS crew_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_no TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    gender TEXT,
    phone TEXT,
    position TEXT NOT NULL,
    fleet_id INTEGER,
    status TEXT DEFAULT 'active',
    health_status TEXT DEFAULT 'normal',
    schedule_scope TEXT,
    hire_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fleet_id) REFERENCES fleets(id)
  );

  CREATE TABLE IF NOT EXISTS qualifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crew_member_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    certificate_no TEXT,
    issue_date DATE,
    expiry_date DATE,
    status TEXT DEFAULT 'valid',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crew_member_id) REFERENCES crew_members(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS vacations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crew_member_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'approved',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crew_member_id) REFERENCES crew_members(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS trainings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crew_member_id INTEGER NOT NULL,
    course_name TEXT NOT NULL,
    training_date DATE,
    result TEXT,
    score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crew_member_id) REFERENCES crew_members(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_no TEXT NOT NULL UNIQUE,
    route_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    train_no TEXT NOT NULL UNIQUE,
    route_id INTEGER,
    departure_station TEXT NOT NULL,
    arrival_station TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    duration_minutes INTEGER,
    train_type TEXT,
    marshalling TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id)
  );

  CREATE TABLE IF NOT EXISTS position_requirements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    train_id INTEGER NOT NULL,
    position TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    qualification_required TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    train_id INTEGER NOT NULL,
    schedule_date DATE NOT NULL,
    status TEXT DEFAULT 'draft',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (train_id) REFERENCES trains(id)
  );

  CREATE TABLE IF NOT EXISTS schedule_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER NOT NULL,
    crew_member_id INTEGER NOT NULL,
    position TEXT NOT NULL,
    duty_start_time DATETIME,
    duty_end_time DATETIME,
    work_hours REAL,
    status TEXT DEFAULT 'assigned',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (crew_member_id) REFERENCES crew_members(id)
  );

  CREATE TABLE IF NOT EXISTS shift_changes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_assignment_id INTEGER,
    type TEXT NOT NULL,
    original_crew_id INTEGER,
    new_crew_id INTEGER,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    approved_by INTEGER,
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (schedule_assignment_id) REFERENCES schedule_assignments(id),
    FOREIGN KEY (original_crew_id) REFERENCES crew_members(id),
    FOREIGN KEY (new_crew_id) REFERENCES crew_members(id)
  );

  CREATE TABLE IF NOT EXISTS work_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crew_member_id INTEGER NOT NULL,
    schedule_id INTEGER,
    record_date DATE NOT NULL,
    work_type TEXT NOT NULL,
    hours REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crew_member_id) REFERENCES crew_members(id),
    FOREIGN KEY (schedule_id) REFERENCES schedules(id)
  );

  CREATE INDEX IF NOT EXISTS idx_crew_member_fleet ON crew_members(fleet_id);
  CREATE INDEX IF NOT EXISTS idx_qualifications_crew ON qualifications(crew_member_id);
  CREATE INDEX IF NOT EXISTS idx_vacations_crew ON vacations(crew_member_id);
  CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(schedule_date);
  CREATE INDEX IF NOT EXISTS idx_assignments_schedule ON schedule_assignments(schedule_id);
  CREATE INDEX IF NOT EXISTS idx_assignments_crew ON schedule_assignments(crew_member_id);
  CREATE INDEX IF NOT EXISTS idx_work_records_crew_date ON work_records(crew_member_id, record_date);
`);

console.log('数据库初始化完成');
db.close();
