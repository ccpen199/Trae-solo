const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const dbPath = path.join(__dirname, '../../../data/app.sqlite');
const db = new Database(dbPath, { verbose: console.log });

console.log('开始初始化数据库...');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    industry TEXT,
    contact_person TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    address TEXT,
    settlement_method TEXT,
    status TEXT DEFAULT 'active',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    recruitment_target INTEGER,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active',
    settlement_method TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    department TEXT,
    job_description TEXT,
    requirements TEXT,
    headcount INTEGER DEFAULT 1,
    salary_range TEXT,
    location TEXT,
    batch TEXT,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'normal',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS consultant_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    position_id INTEGER,
    consultant_id INTEGER NOT NULL,
    role TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (position_id) REFERENCES positions(id),
    FOREIGN KEY (consultant_id) REFERENCES users(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    gender TEXT,
    age INTEGER,
    education TEXT,
    work_experience TEXT,
    current_company TEXT,
    current_position TEXT,
    expected_salary TEXT,
    resume_url TEXT,
    tags TEXT,
    source TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS candidate_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL,
    position_id INTEGER NOT NULL,
    current_stage TEXT DEFAULT 'screening',
    stage_status TEXT DEFAULT 'pending',
    is_repeat INTEGER DEFAULT 0,
    pool_count INTEGER DEFAULT 1,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id),
    FOREIGN KEY (position_id) REFERENCES positions(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS stage_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    stage TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    started_at DATETIME,
    completed_at DATETIME,
    result TEXT,
    reason TEXT,
    notes TEXT,
    internal_notes TEXT,
    interview_time DATETIME,
    interview_location TEXT,
    interviewer TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES candidate_applications(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS elimination_reasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    stage TEXT NOT NULL,
    reason_category TEXT NOT NULL,
    reason_detail TEXT,
    description TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES candidate_applications(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sla_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    position_id INTEGER,
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    target_hours INTEGER NOT NULL,
    warning_hours INTEGER,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (position_id) REFERENCES positions(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sla_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    stage_record_id INTEGER,
    metric_type TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    actual_hours INTEGER,
    target_hours INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    delay_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES candidate_applications(id),
    FOREIGN KEY (stage_record_id) REFERENCES stage_records(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS weekly_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    content TEXT,
    new_positions INTEGER DEFAULT 0,
    new_candidates INTEGER DEFAULT 0,
    interviews INTEGER DEFAULT 0,
    offers INTEGER DEFAULT 0,
    onboards INTEGER DEFAULT 0,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);

const password = bcrypt.hashSync('admin123', 10);
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?, ?)
`);
insertUser.run('admin', password, '系统管理员', 'admin', 'admin@example.com');

const consultantPassword = bcrypt.hashSync('consultant123', 10);
insertUser.run('consultant', consultantPassword, '招聘顾问', 'consultant', 'consultant@example.com');

const hrPassword = bcrypt.hashSync('hr123456', 10);
insertUser.run('client_hr', hrPassword, '客户HR', 'client_hr', 'hr@client.com');

console.log('数据库初始化完成！');
console.log('默认账号: admin / admin123 (管理员)');
console.log('默认账号: consultant / consultant123 (顾问)');
console.log('默认账号: client_hr / hr123456 (客户HR)');

db.close();
