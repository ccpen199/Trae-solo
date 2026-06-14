const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('jobseeker', 'employer', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobseekers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      name TEXT NOT NULL,
      gender TEXT,
      age INTEGER,
      phone TEXT,
      avatar TEXT,
      skills TEXT,
      expected_salary_min INTEGER,
      expected_salary_max INTEGER,
      available_date DATE,
      location TEXT,
      latitude REAL,
      longitude REAL,
      work_experience TEXT,
      education TEXT,
      resume_url TEXT,
      attendance_rate REAL DEFAULT 100,
      credit_score INTEGER DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      contact_person TEXT,
      contact_phone TEXT,
      company_license TEXT,
      company_address TEXT,
      company_description TEXT,
      is_verified INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      response_rate REAL DEFAULT 100,
      avg_response_time INTEGER DEFAULT 30,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employer_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      salary_min INTEGER NOT NULL,
      salary_max INTEGER NOT NULL,
      location TEXT,
      latitude REAL,
      longitude REAL,
      work_type TEXT,
      requirements TEXT,
      benefits TEXT,
      has_food INTEGER DEFAULT 0,
      has_lodging INTEGER DEFAULT 0,
      has_insurance INTEGER DEFAULT 0,
      has_fund INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      view_count INTEGER DEFAULT 0,
      apply_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS job_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      skill TEXT NOT NULL,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jobseeker_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobseeker_id INTEGER NOT NULL,
      skill TEXT NOT NULL,
      FOREIGN KEY (jobseeker_id) REFERENCES jobseekers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      jobseeker_id INTEGER NOT NULL,
      employer_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      match_score REAL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (jobseeker_id) REFERENCES jobseekers(id) ON DELETE CASCADE,
      FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE,
      UNIQUE(job_id, jobseeker_id)
    );

    CREATE TABLE IF NOT EXISTS onboarding_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      step_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      scheduled_at DATETIME,
      completed_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      application_id INTEGER,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      attachment_url TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      reported_type TEXT NOT NULL,
      reported_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      handled_by INTEGER,
      handled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS job_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      is_fake INTEGER DEFAULT 0,
      duplicate_score REAL DEFAULT 0,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS credit_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobseeker_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      score_change INTEGER NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (jobseeker_id) REFERENCES jobseekers(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
    CREATE INDEX IF NOT EXISTS idx_jobs_salary ON jobs(salary_min, salary_max);
    CREATE INDEX IF NOT EXISTS idx_jobseekers_location ON jobseekers(location);
    CREATE INDEX IF NOT EXISTS idx_applications_jobseeker ON applications(jobseeker_id);
    CREATE INDEX IF NOT EXISTS idx_applications_employer ON applications(employer_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id);
  `);

  try { db.exec('ALTER TABLE jobs ADD COLUMN available_date DATE'); } catch(e) {}
  try { db.exec('ALTER TABLE jobs ADD COLUMN is_urgent INTEGER DEFAULT 0'); } catch(e) {}
  try { db.exec('ALTER TABLE employers ADD COLUMN hr_response_time TEXT DEFAULT \'24小时\''); } catch(e) {}
  try { db.exec('ALTER TABLE jobseekers ADD COLUMN commute_radius INTEGER DEFAULT 50'); } catch(e) {}

  const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin');
  if (adminCount.count === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123456', 10);
    const stmt = db.prepare('INSERT INTO users (phone, password, role) VALUES (?, ?, ?)');
    stmt.run('admin', hashedPassword, 'admin');
  }
}

initDatabase();

module.exports = db;
