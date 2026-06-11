import { fileURLToPath } from 'url';
import db from './index.js';

const migrations = [
  `
  CREATE TABLE IF NOT EXISTS schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    city VARCHAR(100),
    district VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS geo_fences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL UNIQUE,
    center_lat REAL NOT NULL,
    center_lng REAL NOT NULL,
    radius REAL NOT NULL DEFAULT 500,
    polygon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('school_admin', 'city_admin')),
    school_id INTEGER,
    phone VARCHAR(20),
    avatar VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_no VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    grade VARCHAR(50) NOT NULL,
    class VARCHAR(50) NOT NULL,
    school_id INTEGER NOT NULL,
    id_card VARCHAR(18) NOT NULL UNIQUE,
    phone VARCHAR(20),
    face_data TEXT,
    is_poverty BOOLEAN NOT NULL DEFAULT 0,
    is_funding_eligible BOOLEAN NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'suspended')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS attendance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    school_id INTEGER NOT NULL,
    check_in_time DATETIME NOT NULL,
    check_in_type VARCHAR(20) NOT NULL DEFAULT 'face' CHECK (check_in_type IN ('face', 'manual')),
    location_lat REAL,
    location_lng REAL,
    location_accuracy REAL,
    is_in_fence BOOLEAN NOT NULL DEFAULT 0,
    face_match_score REAL,
    status VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'late', 'absent', 'exception')),
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (school_id) REFERENCES schools(id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS funding_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    school_id INTEGER NOT NULL,
    funding_type VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    batch_no VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'distributed', 'received')),
    apply_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    approve_time DATETIME,
    distribute_time DATETIME,
    receive_time DATETIME,
    voucher_code VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (school_id) REFERENCES schools(id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS alert_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('abnormal_leave', 'absent', 'funding_exception')),
    level VARCHAR(20) NOT NULL CHECK (level IN ('low', 'medium', 'high')),
    student_id INTEGER,
    student_name VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved')),
    handler_id INTEGER,
    handler_name VARCHAR(100),
    handle_time DATETIME,
    handle_remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (handler_id) REFERENCES users(id)
  );
  `,
  `
  CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    operation VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL,
    ip VARCHAR(50),
    user_agent VARCHAR(500),
    detail TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  `,
];

const indexes = [
  'CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id)',
  'CREATE INDEX IF NOT EXISTS idx_attendance_school ON attendance_records(school_id)',
  'CREATE INDEX IF NOT EXISTS idx_attendance_time ON attendance_records(check_in_time)',
  'CREATE INDEX IF NOT EXISTS idx_funding_student ON funding_records(student_id)',
  'CREATE INDEX IF NOT EXISTS idx_funding_school ON funding_records(school_id)',
  'CREATE INDEX IF NOT EXISTS idx_funding_batch ON funding_records(batch_no)',
  'CREATE INDEX IF NOT EXISTS idx_alert_school ON alert_records(school_id)',
  'CREATE INDEX IF NOT EXISTS idx_alert_status ON alert_records(status)',
  'CREATE INDEX IF NOT EXISTS idx_alert_created ON alert_records(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_log_user ON operation_logs(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_log_created ON operation_logs(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_student_school ON students(school_id)',
  'CREATE INDEX IF NOT EXISTS idx_student_class ON students(grade, class)',
];

export async function runMigrations(): Promise<void> {
  console.log('Running database migrations...');
  
  for (const migration of migrations) {
    db.exec(migration);
  }
  
  for (const index of indexes) {
    db.exec(index);
  }
  
  console.log('Migrations completed successfully.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations().then(() => process.exit(0)).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
