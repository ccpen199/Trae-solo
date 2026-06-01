import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.SQLITE_DB || 'data/app.sqlite3';
const fullDbPath = path.resolve(__dirname, '../../', dbPath);

const db = new Database(fullDbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('job_seeker', 'employer', 'admin')),
      name TEXT,
      avatar_url TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'verified')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS job_seekers (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      gender TEXT CHECK(gender IN ('male', 'female', 'other')),
      birth_date DATE,
      location_lat REAL,
      location_lng REAL,
      location_address TEXT,
      credit_score INTEGER DEFAULT 100,
      onboarding_effectiveness_hours INTEGER DEFAULT 24,
      video_resume_url TEXT,
      bio TEXT,
      total_completed_jobs INTEGER DEFAULT 0,
      average_rating REAL DEFAULT 5.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS job_seeker_skills (
      id TEXT PRIMARY KEY,
      job_seeker_id TEXT NOT NULL REFERENCES job_seekers(id) ON DELETE CASCADE,
      skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      proficiency_level INTEGER DEFAULT 3 CHECK(proficiency_level BETWEEN 1 AND 5),
      verified BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(job_seeker_id, skill_id)
    );

    CREATE TABLE IF NOT EXISTS skill_certificates (
      id TEXT PRIMARY KEY,
      job_seeker_id TEXT NOT NULL REFERENCES job_seekers(id) ON DELETE CASCADE,
      skill_id TEXT REFERENCES skills(id),
      certificate_name TEXT NOT NULL,
      issuing_authority TEXT,
      issue_date DATE,
      expiry_date DATE,
      certificate_number TEXT,
      ocr_data TEXT,
      verified BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employers (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_name TEXT,
      company_type TEXT CHECK(company_type IN ('enterprise', 'individual', 'project_team')),
      business_license TEXT,
      verified BOOLEAN DEFAULT 0,
      location_lat REAL,
      location_lng REAL,
      location_address TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      total_posted_jobs INTEGER DEFAULT 0,
      average_rating REAL DEFAULT 5.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      employer_id TEXT NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      job_type TEXT NOT NULL CHECK(job_type IN ('daily', 'weekly', 'project', 'remote')),
      salary_type TEXT NOT NULL CHECK(salary_type IN ('hourly', 'daily', 'weekly', 'fixed')),
      salary_amount REAL NOT NULL,
      location_lat REAL,
      location_lng REAL,
      location_address TEXT,
      required_skills TEXT,
      required_experience TEXT,
      start_date DATE,
      end_date DATE,
      working_hours TEXT,
      max_applicants INTEGER DEFAULT 10,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'filled', 'closed', 'completed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS job_applications (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      job_seeker_id TEXT NOT NULL REFERENCES job_seekers(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewing', 'interview', 'accepted', 'rejected', 'hired')),
      cover_letter TEXT,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(job_id, job_seeker_id)
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      application_id TEXT UNIQUE NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
      scheduled_at DATETIME NOT NULL,
      interview_type TEXT CHECK(interview_type IN ('video', 'audio', 'in_person')),
      interviewer_notes TEXT,
      interviewer_rating INTEGER CHECK(interviewer_rating BETWEEN 1 AND 5),
      interviewee_notes TEXT,
      interviewee_rating INTEGER CHECK(interviewee_rating BETWEEN 1 AND 5),
      recording_url TEXT,
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employment_contracts (
      id TEXT PRIMARY KEY,
      application_id TEXT UNIQUE NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
      contract_url TEXT NOT NULL,
      signed_by_job_seeker BOOLEAN DEFAULT 0,
      signed_by_employer BOOLEAN DEFAULT 0,
      signed_at DATETIME,
      social_insurance_status TEXT DEFAULT 'pending' CHECK(social_insurance_status IN ('pending', 'processing', 'completed', 'exempt')),
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'signed', 'active', 'terminated')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL REFERENCES employment_contracts(id) ON DELETE CASCADE,
      check_in_time DATETIME,
      check_out_time DATETIME,
      work_hours REAL,
      location_lat REAL,
      location_lng REAL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'disputed')),
      confirmed_by_employer BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL REFERENCES employment_contracts(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      tax_amount REAL DEFAULT 0,
      net_amount REAL NOT NULL,
      invoice_url TEXT,
      status TEXT DEFAULT 'held' CHECK(status IN ('held', 'processing', 'completed', 'failed')),
      employer_confirmed_at DATETIME,
      platform_processed_at DATETIME,
      transferred_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS disputes (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL REFERENCES employment_contracts(id) ON DELETE CASCADE,
      raised_by TEXT NOT NULL CHECK(raised_by IN ('job_seeker', 'employer')),
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      evidence_chat_url TEXT,
      evidence_attendance_url TEXT,
      evidence_work_hours_url TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'investigating', 'resolved', 'dismissed')),
      resolution TEXT,
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL REFERENCES employment_contracts(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tax_records (
      id TEXT PRIMARY KEY,
      settlement_id TEXT NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
      tax_type TEXT NOT NULL,
      taxable_amount REAL NOT NULL,
      tax_amount REAL NOT NULL,
      declaration_status TEXT DEFAULT 'pending' CHECK(declaration_status IN ('pending', 'declared', 'paid')),
      declared_at DATETIME,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const skillCount = db.prepare('SELECT COUNT(*) as count FROM skills').get() as { count: number };
  if (skillCount.count === 0) {
    const skills = [
      { id: 's1', name: '搬运装卸', category: '体力劳动' },
      { id: 's2', name: '快递配送', category: '物流' },
      { id: 's3', name: '餐饮服务', category: '服务业' },
      { id: 's4', name: '家政保洁', category: '服务业' },
      { id: 's5', name: '仓储管理', category: '物流' },
      { id: 's6', name: '促销推广', category: '销售' },
      { id: 's7', name: '客服接待', category: '服务业' },
      { id: 's8', name: '分拣打包', category: '物流' },
      { id: 's9', name: '临时保安', category: '安保' },
      { id: 's10', name: '会展协助', category: '服务业' },
      { id: 's11', name: '文案撰写', category: '创意' },
      { id: 's12', name: '平面设计', category: '创意' },
      { id: 's13', name: '视频剪辑', category: '创意' },
      { id: 's14', name: '编程开发', category: '技术' },
      { id: 's15', name: '数据录入', category: '办公' },
      { id: 's16', name: '翻译服务', category: '语言' },
      { id: 's17', name: '家教辅导', category: '教育' },
      { id: 's18', name: '摄影摄像', category: '创意' },
      { id: 's19', name: '汽车代驾', category: '交通' },
      { id: 's20', name: '宠物护理', category: '生活服务' },
    ];

    const insertSkill = db.prepare('INSERT INTO skills (id, name, category) VALUES (?, ?, ?)');
    skills.forEach(skill => {
      insertSkill.run(skill.id, skill.name, skill.category);
    });
  }

  console.log('Database initialized successfully');
}

export default db;
