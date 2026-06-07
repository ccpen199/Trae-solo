const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('company', 'jobseeker', 'admin')),
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      name TEXT NOT NULL,
      industry TEXT,
      size TEXT,
      description TEXT,
      location TEXT,
      logo TEXT,
      social_insurance_rate REAL DEFAULT 0,
      turnover_rate REAL DEFAULT 0,
      credit_score INTEGER DEFAULT 80,
      verified BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS jobseekers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      education TEXT,
      experience TEXT,
      expected_salary_min INTEGER,
      expected_salary_max INTEGER,
      skills TEXT,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('job', 'resume', 'message')),
      title TEXT NOT NULL,
      description TEXT,
      file_path TEXT NOT NULL,
      thumbnail TEXT,
      duration INTEGER,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      reject_reason TEXT,
      review_note TEXT,
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      video_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      salary_min INTEGER NOT NULL,
      salary_max INTEGER NOT NULL,
      location TEXT,
      skills TEXT,
      experience_required TEXT,
      education_required TEXT,
      is_active BOOLEAN DEFAULT 1,
      video_resume_enabled BOOLEAN DEFAULT 1,
      views_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (video_id) REFERENCES videos(id)
    );

    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobseeker_id INTEGER NOT NULL,
      video_id INTEGER,
      title TEXT,
      skills TEXT,
      ai_tags TEXT,
      is_public BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (jobseeker_id) REFERENCES jobseekers(id),
      FOREIGN KEY (video_id) REFERENCES videos(id)
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      jobseeker_id INTEGER NOT NULL,
      resume_id INTEGER,
      match_score INTEGER,
      match_reason TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'viewed', 'interview', 'offer', 'rejected', 'hired')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (jobseeker_id) REFERENCES jobseekers(id),
      FOREIGN KEY (resume_id) REFERENCES resumes(id),
      UNIQUE(job_id, jobseeker_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('text', 'video')),
      content TEXT,
      video_id INTEGER,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id),
      FOREIGN KEY (video_id) REFERENCES videos(id)
    );

    CREATE TABLE IF NOT EXISTS admin_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS campus_recruitment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      university TEXT NOT NULL,
      event_type TEXT NOT NULL CHECK(event_type IN ('career_fair', 'info_session')),
      event_date DATE,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS view_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      job_id INTEGER,
      video_id INTEGER,
      action TEXT NOT NULL,
      duration INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (video_id) REFERENCES videos(id)
    );
  `);

  console.log('Database initialized successfully');
}

module.exports = { db, initDatabase };
