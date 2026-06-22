import db from './db';

export function initDatabase(): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL CHECK(role IN ('worker', 'enterprise', 'admin')),
      phone TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      real_name TEXT,
      id_card_number TEXT,
      avatar_url TEXT,
      face_verified INTEGER DEFAULT 0,
      face_data TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disabled', 'pending')),
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      gender TEXT CHECK(gender IN ('male', 'female')),
      age INTEGER,
      work_years INTEGER DEFAULT 0,
      hometown TEXT,
      current_location TEXT,
      primary_skill TEXT,
      secondary_skills TEXT,
      daily_wage_expected REAL DEFAULT 0,
      craftsman_level INTEGER DEFAULT 1 CHECK(craftsman_level BETWEEN 1 AND 5),
      craftsman_score REAL DEFAULT 0,
      quality_score REAL DEFAULT 0,
      peer_score REAL DEFAULT 0,
      attendance_score REAL DEFAULT 0,
      total_projects INTEGER DEFAULT 0,
      total_work_days INTEGER DEFAULT 0,
      bio TEXT,
      emergency_contact TEXT,
      emergency_phone TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      cert_type TEXT NOT NULL,
      cert_number TEXT,
      cert_name TEXT NOT NULL,
      issue_date TEXT,
      expire_date TEXT,
      cert_image_url TEXT,
      verified INTEGER DEFAULT 0,
      verified_by INTEGER,
      verified_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS enterprises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      company_name TEXT NOT NULL,
      unified_social_code TEXT,
      business_license_url TEXT,
      legal_person TEXT,
      legal_person_id_card TEXT,
      company_address TEXT,
      company_phone TEXT,
      company_email TEXT,
      industry_type TEXT,
      registered_capital REAL,
      verified INTEGER DEFAULT 0,
      verified_by INTEGER,
      verified_at TEXT,
      credit_score REAL DEFAULT 100,
      total_projects INTEGER DEFAULT 0,
      total_workers_hired INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS job_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      skill_required TEXT NOT NULL,
      workers_needed INTEGER NOT NULL DEFAULT 1,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      daily_wage REAL NOT NULL,
      work_location TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      geofence_radius INTEGER DEFAULT 500,
      accommodation_provided INTEGER DEFAULT 0,
      accommodation_detail TEXT,
      meals_provided INTEGER DEFAULT 0,
      meals_detail TEXT,
      insurance_provided INTEGER DEFAULT 0,
      insurance_detail TEXT,
      work_hours TEXT,
      description TEXT,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'completed', 'cancelled')),
      wage_deposit_amount REAL DEFAULT 0,
      deposit_paid INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS job_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_post_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      application_status TEXT DEFAULT 'pending' CHECK(application_status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'completed')),
      applied_at TEXT DEFAULT (datetime('now', 'localtime')),
      reviewed_at TEXT,
      reviewed_by INTEGER,
      hire_date TEXT,
      completion_date TEXT,
      worker_signoff INTEGER DEFAULT 0,
      worker_signoff_at TEXT,
      enterprise_confirm INTEGER DEFAULT 0,
      enterprise_confirm_at TEXT,
      notes TEXT,
      FOREIGN KEY (job_post_id) REFERENCES job_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
      UNIQUE(job_post_id, worker_id)
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_application_id INTEGER NOT NULL UNIQUE,
      contract_no TEXT NOT NULL UNIQUE,
      contract_content TEXT,
      signed_by_worker INTEGER DEFAULT 0,
      signed_by_enterprise INTEGER DEFAULT 0,
      worker_signed_at TEXT,
      enterprise_signed_at TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'signed', 'executing', 'completed', 'breached', 'terminated')),
      total_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      breach_reason TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (job_application_id) REFERENCES job_applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_application_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      job_post_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      check_in_time TEXT,
      check_out_time TEXT,
      check_in_lat REAL,
      check_in_lng REAL,
      check_out_lat REAL,
      check_out_lng REAL,
      check_in_valid INTEGER DEFAULT 0,
      check_out_valid INTEGER DEFAULT 0,
      offline_mode INTEGER DEFAULT 0,
      work_hours REAL DEFAULT 0,
      status TEXT DEFAULT 'normal' CHECK(status IN ('normal', 'late', 'early_leave', 'absent', 'leave')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (job_application_id) REFERENCES job_applications(id) ON DELETE CASCADE,
      UNIQUE(job_application_id, date)
    );

    CREATE TABLE IF NOT EXISTS quality_inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_application_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      inspector_id INTEGER,
      inspection_date TEXT NOT NULL,
      quality_score REAL NOT NULL CHECK(quality_score BETWEEN 0 AND 100),
      inspection_items TEXT,
      issues_found TEXT,
      rectification_required INTEGER DEFAULT 0,
      rectification_completed INTEGER DEFAULT 0,
      photos TEXT,
      remarks TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (job_application_id) REFERENCES job_applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS peer_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_post_id INTEGER NOT NULL,
      reviewer_worker_id INTEGER NOT NULL,
      target_worker_id INTEGER NOT NULL,
      review_score REAL NOT NULL CHECK(review_score BETWEEN 0 AND 5),
      teamwork_score REAL DEFAULT 0,
      skill_score REAL DEFAULT 0,
      attitude_score REAL DEFAULT 0,
      review_content TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (job_post_id) REFERENCES job_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_worker_id) REFERENCES workers(id) ON DELETE CASCADE,
      FOREIGN KEY (target_worker_id) REFERENCES workers(id) ON DELETE CASCADE,
      UNIQUE(job_post_id, reviewer_worker_id, target_worker_id)
    );

    CREATE TABLE IF NOT EXISTS craftsman_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      rating_date TEXT NOT NULL,
      overall_score REAL NOT NULL,
      quality_score REAL NOT NULL,
      peer_score REAL NOT NULL,
      attendance_score REAL NOT NULL,
      level_before INTEGER,
      level_after INTEGER,
      factor TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wage_guarantees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_post_id INTEGER NOT NULL,
      enterprise_id INTEGER NOT NULL,
      guarantee_no TEXT NOT NULL UNIQUE,
      deposit_amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      payment_method TEXT,
      payment_order_no TEXT,
      payment_time TEXT,
      release_status TEXT DEFAULT 'locked' CHECK(release_status IN ('locked', 'partial_released', 'fully_released', 'refunded')),
      total_released REAL DEFAULT 0,
      escrow_account TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (job_post_id) REFERENCES job_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wage_releases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wage_guarantee_id INTEGER NOT NULL,
      job_application_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      release_no TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      release_reason TEXT DEFAULT 'work_completion',
      scheduled_release_date TEXT NOT NULL,
      actual_release_date TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'released', 'failed', 'held')),
      bank_name TEXT,
      bank_account TEXT,
      account_holder TEXT,
      payslip_url TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (wage_guarantee_id) REFERENCES wage_guarantees(id) ON DELETE CASCADE,
      FOREIGN KEY (job_application_id) REFERENCES job_applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wage_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wage_release_id INTEGER NOT NULL,
      payment_no TEXT NOT NULL UNIQUE,
      payment_method TEXT DEFAULT 'bank_transfer',
      amount REAL NOT NULL,
      bank_name TEXT,
      bank_account TEXT,
      account_holder TEXT,
      bank_order_no TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'success', 'failed', 'returned')),
      payslip_generated INTEGER DEFAULT 0,
      payslip_url TEXT,
      payslip_sent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      processed_at TEXT,
      FOREIGN KEY (wage_release_id) REFERENCES wage_releases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS individual_licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      application_no TEXT NOT NULL UNIQUE,
      license_type TEXT DEFAULT 'individual_business',
      business_name TEXT,
      business_scope TEXT,
      business_address TEXT,
      id_card_front_url TEXT,
      id_card_back_url TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'submitted', 'reviewing', 'approved', 'rejected')),
      market_supervision_no TEXT,
      license_no TEXT,
      license_url TEXT,
      reject_reason TEXT,
      applied_at TEXT DEFAULT (datetime('now', 'localtime')),
      approved_at TEXT,
      FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_type TEXT NOT NULL CHECK(applicant_type IN ('worker', 'enterprise')),
      applicant_id INTEGER NOT NULL,
      invoice_no TEXT NOT NULL UNIQUE,
      invoice_type TEXT DEFAULT 'service',
      amount REAL NOT NULL,
      tax_rate REAL DEFAULT 0.03,
      tax_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      buyer_name TEXT NOT NULL,
      buyer_tax_id TEXT,
      seller_name TEXT,
      seller_tax_id TEXT,
      service_content TEXT NOT NULL,
      ukey_serial TEXT,
      invoice_url TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'issuing', 'issued', 'failed', 'red_flushed')),
      fail_reason TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      issued_at TEXT
    );

    CREATE TABLE IF NOT EXISTS risk_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_type TEXT NOT NULL CHECK(alert_type IN ('contract_breach', 'wage_delay', 'attendance_abnormal', 'quality_issue', 'credit_risk')),
      severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
      related_type TEXT,
      related_id INTEGER,
      enterprise_id INTEGER,
      worker_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      data_context TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'acknowledged', 'resolved', 'ignored')),
      handled_by INTEGER,
      handled_at TEXT,
      handling_notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      module TEXT,
      target_type TEXT,
      target_id INTEGER,
      detail TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_workers_user_id ON workers(user_id);
    CREATE INDEX IF NOT EXISTS idx_certificates_worker_id ON certificates(worker_id);
    CREATE INDEX IF NOT EXISTS idx_enterprises_user_id ON enterprises(user_id);
    CREATE INDEX IF NOT EXISTS idx_job_posts_enterprise_id ON job_posts(enterprise_id);
    CREATE INDEX IF NOT EXISTS idx_job_posts_status ON job_posts(status);
    CREATE INDEX IF NOT EXISTS idx_job_posts_skill ON job_posts(skill_required);
    CREATE INDEX IF NOT EXISTS idx_job_applications_job_post_id ON job_applications(job_post_id);
    CREATE INDEX IF NOT EXISTS idx_job_applications_worker_id ON job_applications(worker_id);
    CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(application_status);
    CREATE INDEX IF NOT EXISTS idx_attendance_records_application ON attendance_records(job_application_id, date);
    CREATE INDEX IF NOT EXISTS idx_attendance_records_worker ON attendance_records(worker_id, date);
    CREATE INDEX IF NOT EXISTS idx_quality_inspections_worker ON quality_inspections(worker_id);
    CREATE INDEX IF NOT EXISTS idx_peer_reviews_target ON peer_reviews(target_worker_id);
    CREATE INDEX IF NOT EXISTS idx_craftsman_ratings_worker ON craftsman_ratings(worker_id, rating_date);
    CREATE INDEX IF NOT EXISTS idx_wage_guarantees_job_post ON wage_guarantees(job_post_id);
    CREATE INDEX IF NOT EXISTS idx_wage_releases_status ON wage_releases(status, scheduled_release_date);
    CREATE INDEX IF NOT EXISTS idx_risk_alerts_status ON risk_alerts(status, severity);
    CREATE INDEX IF NOT EXISTS idx_risk_alerts_type ON risk_alerts(alert_type);
    CREATE INDEX IF NOT EXISTS idx_risk_alerts_enterprise ON risk_alerts(enterprise_id);
    CREATE INDEX IF NOT EXISTS idx_risk_alerts_worker ON risk_alerts(worker_id);
  `);

  const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin') as { count: number };
  if (adminCount.count === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (role, phone, password_hash, real_name, status)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', '13800000000', hash, '系统管理员', 'active');
  }

  console.log('✅ Database initialized successfully');
}
