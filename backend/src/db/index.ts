import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function initDb(): Database.Database {
  const configuredDbPath = process.env.DATABASE_URL?.trim() || path.join('data', 'recruitment.db');
  const dbPath = path.isAbsolute(configuredDbPath)
    ? configuredDbPath
    : path.resolve(process.cwd(), configuredDbPath);
  const dataDir = path.dirname(dbPath);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  migrateTables();
  createIndexes();

  return db;
}

export function getDb(): Database.Database {
  if (!db) {
    return initDb();
  }
  return db;
}

function createTables() {
  if (!db) return;
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_divisions (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      level TEXT NOT NULL,
      parent_id TEXT,
      full_path TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (parent_id) REFERENCES admin_divisions(id)
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      unified_social_credit_code TEXT UNIQUE NOT NULL,
      registration_number TEXT,
      labor_filing_number TEXT UNIQUE NOT NULL,
      credit_level TEXT NOT NULL DEFAULT 'A',
      industry TEXT,
      industry_zone TEXT NOT NULL DEFAULT 'other',
      admin_division_id TEXT NOT NULL,
      address TEXT,
      legal_representative TEXT,
      contact_person TEXT,
      contact_phone TEXT,
      description TEXT,
      employee_count INTEGER DEFAULT 0,
      verified INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (admin_division_id) REFERENCES admin_divisions(id)
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      title TEXT NOT NULL,
      industry_zone TEXT NOT NULL DEFAULT 'other',
      category TEXT,
      salary_min INTEGER,
      salary_max INTEGER,
      salary_negotiable INTEGER DEFAULT 0,
      location_id TEXT NOT NULL,
      address TEXT,
      description TEXT,
      requirements TEXT,
      benefits TEXT,
      quantity INTEGER DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'draft',
      publish_date TEXT,
      expiry_date TEXT,
      view_count INTEGER DEFAULT 0,
      application_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (location_id) REFERENCES admin_divisions(id)
    );

    CREATE TABLE IF NOT EXISTS graduates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      id_card TEXT UNIQUE NOT NULL,
      student_id TEXT,
      school TEXT,
      major TEXT,
      education_level TEXT,
      graduation_date TEXT,
      phone TEXT,
      email TEXT,
      resume_url TEXT,
      employment_status TEXT DEFAULT 'unemployed',
      employed_company_id TEXT,
      employed_job_id TEXT,
      verification_status TEXT DEFAULT 'pending',
      admin_division_id TEXT NOT NULL,
      skills TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (admin_division_id) REFERENCES admin_divisions(id),
      FOREIGN KEY (employed_company_id) REFERENCES companies(id),
      FOREIGN KEY (employed_job_id) REFERENCES jobs(id)
    );

    CREATE TABLE IF NOT EXISTS internships (
      id TEXT PRIMARY KEY,
      graduate_id TEXT NOT NULL,
      company_name TEXT NOT NULL,
      position TEXT,
      start_date TEXT,
      end_date TEXT,
      description TEXT,
      FOREIGN KEY (graduate_id) REFERENCES graduates(id)
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      graduate_id TEXT NOT NULL,
      name TEXT NOT NULL,
      issuer TEXT,
      issue_date TEXT,
      certificate_number TEXT,
      FOREIGN KEY (graduate_id) REFERENCES graduates(id)
    );

    CREATE TABLE IF NOT EXISTS job_fairs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      admin_division_id TEXT NOT NULL,
      organizer TEXT,
      location TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'upcoming',
      description TEXT,
      max_companies INTEGER DEFAULT 0,
      registered_companies INTEGER DEFAULT 0,
      max_visitors INTEGER DEFAULT 0,
      registered_visitors INTEGER DEFAULT 0,
      is_live INTEGER DEFAULT 0,
      live_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (admin_division_id) REFERENCES admin_divisions(id)
    );

    CREATE TABLE IF NOT EXISTS prosperity_indices (
      id TEXT PRIMARY KEY,
      admin_division_id TEXT NOT NULL,
      period_type TEXT NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      total_jobs INTEGER DEFAULT 0,
      total_applications INTEGER DEFAULT 0,
      active_companies INTEGER DEFAULT 0,
      supply_demand_ratio REAL DEFAULT 0,
      salary_median INTEGER DEFAULT 0,
      salary_average INTEGER DEFAULT 0,
      prosperity_score REAL DEFAULT 0,
      job_growth_rate REAL DEFAULT 0,
      application_growth_rate REAL DEFAULT 0,
      industry_zones TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (admin_division_id) REFERENCES admin_divisions(id)
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      graduate_id TEXT NOT NULL,
      resume_id TEXT,
      status TEXT NOT NULL DEFAULT 'applied',
      applied_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (graduate_id) REFERENCES graduates(id)
    );

    CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      admin_division_id TEXT NOT NULL,
      school_type TEXT NOT NULL,
      contact_person TEXT,
      contact_phone TEXT,
      address TEXT,
      majors TEXT,
      FOREIGN KEY (admin_division_id) REFERENCES admin_divisions(id)
    );

    CREATE TABLE IF NOT EXISTS rpo_batches (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      batch_name TEXT NOT NULL,
      total_jobs INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      fail_count INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'processing',
      target_schools TEXT,
      auto_push INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS job_school_push (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      school_id TEXT NOT NULL,
      rpo_batch_id TEXT,
      push_time TEXT NOT NULL,
      view_count INTEGER DEFAULT 0,
      application_count INTEGER DEFAULT 0,
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (school_id) REFERENCES schools(id),
      FOREIGN KEY (rpo_batch_id) REFERENCES rpo_batches(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      related_id TEXT,
      admin_division_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      policy_type TEXT NOT NULL,
      target_group TEXT,
      admin_division_id TEXT NOT NULL,
      publish_date TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

function migrateTables() {
  if (!db) return;

  try {
    const cols = db.prepare("PRAGMA table_info(prosperity_indices)").all() as { name: string }[];
    const colNames = cols.map(c => c.name);
    
    if (!colNames.includes('active_companies')) {
      db.exec('ALTER TABLE prosperity_indices ADD COLUMN active_companies INTEGER DEFAULT 0');
    }
    if (!colNames.includes('supply_demand_ratio')) {
      db.exec('ALTER TABLE prosperity_indices ADD COLUMN supply_demand_ratio REAL DEFAULT 0');
    }
  } catch (e) {
    console.error('Migration error:', e);
  }
}

function createIndexes() {
  if (!db) return;

  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_admin_level ON admin_divisions(level)',
    'CREATE INDEX IF NOT EXISTS idx_admin_parent ON admin_divisions(parent_id)',
    'CREATE INDEX IF NOT EXISTS idx_company_division ON companies(admin_division_id)',
    'CREATE INDEX IF NOT EXISTS idx_company_zone ON companies(industry_zone)',
    'CREATE INDEX IF NOT EXISTS idx_job_company ON jobs(company_id)',
    'CREATE INDEX IF NOT EXISTS idx_job_status ON jobs(status)',
    'CREATE INDEX IF NOT EXISTS idx_job_zone ON jobs(industry_zone)',
    'CREATE INDEX IF NOT EXISTS idx_job_location ON jobs(location_id)',
    'CREATE INDEX IF NOT EXISTS idx_graduate_division ON graduates(admin_division_id)',
    'CREATE INDEX IF NOT EXISTS idx_graduate_employment ON graduates(employment_status)',
    'CREATE INDEX IF NOT EXISTS idx_fair_division ON job_fairs(admin_division_id)',
    'CREATE INDEX IF NOT EXISTS idx_fair_status ON job_fairs(status)',
    'CREATE INDEX IF NOT EXISTS idx_prosperity_division ON prosperity_indices(admin_division_id)',
    'CREATE INDEX IF NOT EXISTS idx_prosperity_period ON prosperity_indices(period_type, period_start)',
    'CREATE INDEX IF NOT EXISTS idx_application_job ON applications(job_id)',
    'CREATE INDEX IF NOT EXISTS idx_application_graduate ON applications(graduate_id)',
  ];

  indexes.forEach(sql => db!.exec(sql));
}
