import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedData } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'app.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export { seedData };

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb(): void {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      school TEXT NOT NULL,
      major TEXT NOT NULL,
      grade TEXT NOT NULL,
      avatar TEXT,
      rating REAL DEFAULT 5.0,
      verified INTEGER DEFAULT 0,
      phone TEXT,
      email TEXT,
      resume_skills TEXT DEFAULT '[]',
      resume_experience TEXT DEFAULT '',
      resume_introduction TEXT DEFAULT '',
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      license_no TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      address TEXT,
      avatar TEXT,
      verified INTEGER DEFAULT 0,
      description TEXT,
      industry TEXT,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT,
      salary_per_hour REAL NOT NULL,
      max_hours_per_day REAL,
      max_hours_per_week REAL,
      major_required TEXT DEFAULT '[]',
      work_days TEXT DEFAULT '[]',
      work_start_time TEXT,
      work_end_time TEXT,
      status TEXT DEFAULT 'published',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS filing_forms (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      max_hours_per_day REAL NOT NULL,
      max_hours_per_week REAL NOT NULL,
      min_wage REAL NOT NULL,
      insurance_provided INTEGER DEFAULT 0,
      insurance_type TEXT,
      safety_measures TEXT,
      emergency_contact TEXT,
      emergency_phone TEXT,
      filed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      applied_at TEXT DEFAULT (datetime('now')),
      interview_time TEXT,
      work_hours REAL DEFAULT 0,
      salary REAL DEFAULT 0,
      rating REAL,
      comment TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL UNIQUE,
      courses TEXT DEFAULT '[]',
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      last_message TEXT,
      last_message_at TEXT,
      unread_count_student INTEGER DEFAULT 0,
      unread_count_company INTEGER DEFAULT 0,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_type TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      created_at TEXT DEFAULT (datetime('now')),
      read INTEGER DEFAULT 0,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL UNIQUE,
      balance REAL DEFAULT 0,
      alipay_account TEXT,
      alipay_real_name TEXT,
      wechat_account TEXT,
      wechat_real_name TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS payroll_records (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      batch_id TEXT,
      paid_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (application_id) REFERENCES applications(id),
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS withdraw_records (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      amount REAL NOT NULL,
      channel TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      application_id TEXT NOT NULL,
      job_title TEXT,
      company_name TEXT,
      start_date TEXT,
      end_date TEXT,
      work_hours REAL,
      salary REAL,
      rating REAL,
      certificate_url TEXT,
      seal_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      result TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );

    CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      province TEXT,
      student_count INTEGER DEFAULT 0
    );
  `);
}
