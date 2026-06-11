const db = require('../utils/database');

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gft_user_id TEXT UNIQUE,
      id_card TEXT UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      user_type TEXT DEFAULT 'personal',
      avatar TEXT,
      auth_token TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS enterprises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      enterprise_name TEXT NOT NULL,
      unified_credit_code TEXT UNIQUE,
      legal_person TEXT,
      contact_phone TEXT,
      industry TEXT,
      employee_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS labor_contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      enterprise_id INTEGER,
      contract_no TEXT UNIQUE,
      contract_type TEXT,
      start_date TEXT,
      end_date TEXT,
      position TEXT,
      salary REAL,
      work_place TEXT,
      content TEXT,
      user_sign_status INTEGER DEFAULT 0,
      enterprise_sign_status INTEGER DEFAULT 0,
      user_sign_at TEXT,
      enterprise_sign_at TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS unemployment_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      registration_no TEXT UNIQUE,
      id_card TEXT,
      name TEXT,
      phone TEXT,
      education TEXT,
      previous_work TEXT,
      unemployment_reason TEXT,
      expected_salary REAL,
      expected_position TEXT,
      status TEXT DEFAULT 'approved',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS title_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      application_no TEXT UNIQUE,
      name TEXT,
      id_card TEXT,
      current_title TEXT,
      apply_title TEXT,
      apply_category TEXT,
      education TEXT,
      work_years INTEGER,
      materials TEXT,
      review_status TEXT DEFAULT 'pending',
      review_opinion TEXT,
      reviewer_id INTEGER,
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS labor_dispute_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      application_no TEXT UNIQUE,
      applicant_name TEXT,
      applicant_phone TEXT,
      respondent_name TEXT,
      dispute_type TEXT,
      dispute_amount REAL,
      description TEXT,
      evidence TEXT,
      status TEXT DEFAULT 'pending',
      mediator_id INTEGER,
      mediation_result TEXT,
      mediated_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS employment_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER,
      batch_no TEXT,
      employee_name TEXT,
      id_card TEXT,
      phone TEXT,
      position TEXT,
      start_date TEXT,
      salary REAL,
      contract_type TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
    );

    CREATE TABLE IF NOT EXISTS training_subsidies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER,
      application_no TEXT UNIQUE,
      training_name TEXT,
      training_type TEXT,
      trainee_count INTEGER,
      training_start_date TEXT,
      training_end_date TEXT,
      training_institution TEXT,
      apply_amount REAL,
      approved_amount REAL,
      materials TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
    );

    CREATE TABLE IF NOT EXISTS wage_special_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER,
      account_no TEXT UNIQUE,
      bank_name TEXT,
      account_balance REAL DEFAULT 0,
      total_paid REAL DEFAULT 0,
      total_received REAL DEFAULT 0,
      status TEXT DEFAULT 'normal',
      supervisor TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
    );

    CREATE TABLE IF NOT EXISTS wage_payment_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER,
      enterprise_id INTEGER,
      employee_name TEXT,
      id_card TEXT,
      amount REAL,
      pay_month TEXT,
      pay_status TEXT DEFAULT 'paid',
      transaction_no TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (account_id) REFERENCES wage_special_accounts(id)
    );

    CREATE TABLE IF NOT EXISTS cross_system_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_source TEXT,
      data_type TEXT,
      id_card TEXT,
      data_content TEXT,
      sync_time TEXT DEFAULT (datetime('now', 'localtime')),
      sync_status TEXT DEFAULT 'success'
    );

    CREATE TABLE IF NOT EXISTS policy_calculations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      calc_type TEXT,
      input_params TEXT,
      result TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS public_opinions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT,
      author TEXT,
      title TEXT,
      content TEXT,
      url TEXT,
      sentiment TEXT,
      sentiment_score REAL,
      warning_level TEXT DEFAULT 'normal',
      keywords TEXT,
      published_at TEXT,
      crawled_at TEXT DEFAULT (datetime('now', 'localtime')),
      is_handled INTEGER DEFAULT 0,
      handler_id INTEGER,
      handled_note TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'admin',
      name TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_users_id_card ON users(id_card);
    CREATE INDEX IF NOT EXISTS idx_contracts_user ON labor_contracts(user_id);
    CREATE INDEX IF NOT EXISTS idx_unemp_user ON unemployment_registrations(user_id);
    CREATE INDEX IF NOT EXISTS idx_title_user ON title_applications(user_id);
    CREATE INDEX IF NOT EXISTS idx_dispute_user ON labor_dispute_applications(user_id);
    CREATE INDEX IF NOT EXISTS idx_emp_record_enterprise ON employment_records(enterprise_id);
    CREATE INDEX IF NOT EXISTS idx_wage_account_enterprise ON wage_special_accounts(enterprise_id);
    CREATE INDEX IF NOT EXISTS idx_opinion_level ON public_opinions(warning_level);
  `);

  const adminCount = db.prepare('SELECT COUNT(*) as cnt FROM admin_users').get().cnt;
  if (adminCount === 0) {
    const bcrypt = require('bcryptjs');
    db.prepare('INSERT INTO admin_users (username, password, role, name) VALUES (?, ?, ?, ?)').run(
      'admin',
      bcrypt.hashSync('admin123', 10),
      'super_admin',
      '系统管理员'
    );
  }
}

module.exports = initTables;
