import db from '../utils/db'

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      description TEXT,
      skill_level INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_card TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      gender TEXT NOT NULL CHECK(gender IN ('男', '女')),
      age INTEGER NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      latitude REAL DEFAULT 0,
      longitude REAL DEFAULT 0,
      trade_ids TEXT DEFAULT '[]',
      performance_score REAL DEFAULT 0,
      health_status TEXT DEFAULT 'green' CHECK(health_status IN ('green', 'yellow', 'red')),
      health_code_source TEXT CHECK(health_code_source IN ('yueshengshi', 'alipay', 'national', 'other')),
      health_code_updated_at TEXT,
      nucleic_acid_status TEXT DEFAULT 'untested' CHECK(nucleic_acid_status IN ('negative', 'positive', 'untested')),
      vaccination_status TEXT DEFAULT 'unvaccinated' CHECK(vaccination_status IN ('unvaccinated', 'one_dose', 'two_doses', 'three_doses')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skill_certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      certificate_type TEXT NOT NULL,
      certificate_number TEXT NOT NULL,
      issuing_authority TEXT,
      issue_date TEXT,
      expiry_date TEXT,
      ocr_result TEXT,
      verified INTEGER DEFAULT 0,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS performance_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      project_id INTEGER,
      project_name TEXT,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      reviewer TEXT,
      review_date TEXT,
      work_quality INTEGER DEFAULT 0,
      attendance INTEGER DEFAULT 0,
      discipline INTEGER DEFAULT 0,
      safety INTEGER DEFAULT 0,
      teamwork INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS safety_trainings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      training_name TEXT NOT NULL,
      training_date TEXT,
      training_hours INTEGER DEFAULT 0,
      exam_score REAL DEFAULT 0,
      passed INTEGER DEFAULT 0,
      certificate_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      legal_person TEXT,
      business_license TEXT,
      qualification_level TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      address TEXT,
      credit_rating REAL DEFAULT 0,
      verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS job_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employer_id INTEGER NOT NULL,
      project_name TEXT NOT NULL,
      project_address TEXT,
      detailed_address TEXT,
      latitude REAL DEFAULT 0,
      longitude REAL DEFAULT 0,
      trade_id INTEGER NOT NULL,
      trade_name TEXT,
      quantity INTEGER DEFAULT 1,
      skill_level_required TEXT,
      start_date TEXT,
      end_date TEXT,
      work_duration TEXT,
      daily_wage_min REAL DEFAULT 0,
      daily_wage_max REAL DEFAULT 0,
      payment_method TEXT,
      provides_food INTEGER DEFAULT 0,
      provides_lodging INTEGER DEFAULT 0,
      certificate_required INTEGER DEFAULT 0,
      certificate_types TEXT,
      safety_training TEXT,
      other_qualifications TEXT,
      project_intro TEXT,
      construction_environment TEXT,
      notes TEXT,
      daily_wage REAL DEFAULT 0,
      work_hours TEXT,
      qualification_required TEXT,
      description TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'pending_review', 'ai_reviewed', 'manual_reviewed', 'verified', 'published', 'filled', 'closed')),
      ai_review_result TEXT,
      ai_review_score REAL DEFAULT 0,
      manual_review_comment TEXT,
      manual_reviewer TEXT,
      verified_by TEXT,
      verified_at TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employer_id) REFERENCES employers(id),
      FOREIGN KEY (trade_id) REFERENCES trades(id)
    );

    CREATE TABLE IF NOT EXISTS job_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      match_score REAL DEFAULT 0,
      skill_match_score REAL DEFAULT 0,
      location_match_score REAL DEFAULT 0,
      performance_match_score REAL DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'hired')),
      worker_notified INTEGER DEFAULT 0,
      employer_notified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES job_requirements(id) ON DELETE CASCADE,
      FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contract_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      template_type TEXT,
      content TEXT NOT NULL,
      version TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      employer_id INTEGER NOT NULL,
      contract_number TEXT,
      start_date TEXT,
      end_date TEXT,
      daily_wage REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'signed_by_worker', 'signed_by_employer', 'fully_signed', 'completed', 'terminated')),
      worker_signed_at TEXT,
      employer_signed_at TEXT,
      template_id INTEGER,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES job_requirements(id),
      FOREIGN KEY (worker_id) REFERENCES workers(id),
      FOREIGN KEY (employer_id) REFERENCES employers(id),
      FOREIGN KEY (template_id) REFERENCES contract_templates(id)
    );

    CREATE TABLE IF NOT EXISTS wage_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      employer_id INTEGER NOT NULL,
      amount REAL DEFAULT 0,
      payment_date TEXT,
      payment_method TEXT,
      work_days INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'overdue', 'disputed')),
      supervisory_recorded INTEGER DEFAULT 0,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES contracts(id),
      FOREIGN KEY (worker_id) REFERENCES workers(id),
      FOREIGN KEY (employer_id) REFERENCES employers(id)
    );

    CREATE TABLE IF NOT EXISTS review_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      review_level TEXT NOT NULL CHECK(review_level IN ('ai', 'manual', 'site')),
      reviewer TEXT,
      result TEXT DEFAULT 'pending' CHECK(result IN ('pass', 'fail', 'pending')),
      comment TEXT,
      review_date TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES job_requirements(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_workers_trade ON workers(trade_ids);
    CREATE INDEX IF NOT EXISTS idx_workers_location ON workers(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_workers_score ON workers(performance_score);
    CREATE INDEX IF NOT EXISTS idx_jobs_trade ON job_requirements(trade_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_location ON job_requirements(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON job_requirements(status);
    CREATE INDEX IF NOT EXISTS idx_matches_job ON job_matches(job_id);
    CREATE INDEX IF NOT EXISTS idx_matches_worker ON job_matches(worker_id);
    CREATE INDEX IF NOT EXISTS idx_matches_score ON job_matches(match_score);
    CREATE INDEX IF NOT EXISTS idx_certificates_worker ON skill_certificates(worker_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_worker ON performance_reviews(worker_id);
    CREATE INDEX IF NOT EXISTS idx_trainings_worker ON safety_trainings(worker_id);
    CREATE INDEX IF NOT EXISTS idx_contracts_job ON contracts(job_id);
    CREATE INDEX IF NOT EXISTS idx_payments_contract ON wage_payments(contract_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON wage_payments(status);
    CREATE INDEX IF NOT EXISTS idx_review_records_job ON review_records(job_id);
  `)
}
