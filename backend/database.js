
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'jobseeker',
      wechat_id TEXT,
      avatar TEXT,
      current_company_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (current_company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      wechat_verified INTEGER DEFAULT 0,
      status TEXT DEFAULT 'accepted',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (friend_id) REFERENCES users(id),
      UNIQUE(user_id, friend_id)
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      license_number TEXT UNIQUE NOT NULL,
      license_image TEXT,
      address TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      description TEXT,
      verified INTEGER DEFAULT 0,
      owner_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS company_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      geofence_hash TEXT,
      uploaded_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS referral_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      position_level TEXT NOT NULL,
      reward_type TEXT NOT NULL,
      reward_amount REAL,
      reward_days INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      salary_min INTEGER NOT NULL,
      salary_max INTEGER NOT NULL,
      location TEXT NOT NULL,
      position_level TEXT NOT NULL,
      benefits TEXT,
      requirements TEXT,
      status TEXT DEFAULT 'active',
      posted_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (posted_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS job_benefits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      benefit_type TEXT NOT NULL,
      benefit_value TEXT,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      candidate_id INTEGER NOT NULL,
      referrer_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      wechat_verified INTEGER DEFAULT 0,
      reward_id INTEGER,
      rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (candidate_id) REFERENCES users(id),
      FOREIGN KEY (referrer_id) REFERENCES users(id),
      FOREIGN KEY (reward_id) REFERENCES referral_rewards(id)
    );

    CREATE TABLE IF NOT EXISTS referral_status_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referral_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      operator_id INTEGER NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (referral_id) REFERENCES referrals(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content_type TEXT NOT NULL,
      content_encrypted TEXT NOT NULL,
      content_hash TEXT,
      iv TEXT,
      attachments TEXT,
      read_status INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS onboarding_flows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referral_id INTEGER NOT NULL,
      candidate_id INTEGER NOT NULL,
      company_id INTEGER NOT NULL,
      step INTEGER DEFAULT 0,
      contract_signed INTEGER DEFAULT 0,
      training_completed INTEGER DEFAULT 0,
      training_score INTEGER,
      contract_url TEXT,
      completed INTEGER DEFAULT 0,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (referral_id) REFERENCES referrals(id),
      FOREIGN KEY (candidate_id) REFERENCES users(id),
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS ip_rate_limits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT NOT NULL,
      action TEXT NOT NULL,
      count INTEGER DEFAULT 0,
      blocked INTEGER DEFAULT 0,
      last_attempt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(ip_address, action)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
    CREATE INDEX IF NOT EXISTS idx_referrals_candidate ON referrals(candidate_id);
    CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
    CREATE INDEX IF NOT EXISTS idx_messages_users ON messages(sender_id, receiver_id);
    CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
  `);

  console.log('数据库初始化完成');
}

module.exports = { db, initDatabase };
