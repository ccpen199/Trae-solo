const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbPath = path.join(__dirname, process.env.SQLITE_DB || '../data/app.sqlite');
const db = new sqlite3.Database(dbPath);

const ensureColumn = (table, column, definition) => {
  db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (err) => {
    if (err && !/duplicate column name/i.test(err.message)) {
      console.error(`Failed to add ${table}.${column}:`, err.message);
    }
  });
};

const runSql = (sql, params = []) => {
  db.run(sql, params, (err) => {
    if (err) {
      console.error('Database migration failed:', err.message);
    }
  });
};

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS lawyers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT NOT NULL,
      license_number TEXT UNIQUE,
      license_ocr_data TEXT,
      bar_association_verified INTEGER DEFAULT 0,
      credit_report TEXT,
      verification_status TEXT DEFAULT 'pending',
      practice_area TEXT,
      years_experience INTEGER,
      bio TEXT,
      avatar TEXT,
      rating REAL DEFAULT 5.0,
      consultation_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT NOT NULL,
      avatar TEXT,
      user_type TEXT DEFAULT 'individual',
      company_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS consultations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      lawyer_id INTEGER,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT,
      level INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      ai_response TEXT,
      lawyer_response TEXT,
      consultation_type TEXT DEFAULT 'text',
      scheduled_time DATETIME,
      rating INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      lawyer_id INTEGER,
      title TEXT NOT NULL,
      category TEXT,
      content TEXT NOT NULL,
      risk_points TEXT,
      status TEXT DEFAULT 'draft',
      version INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      lawyer_id INTEGER NOT NULL,
      case_number TEXT UNIQUE,
      title TEXT NOT NULL,
      case_type TEXT,
      court TEXT,
      status TEXT DEFAULT 'pending',
      filing_date DATETIME,
      fee_amount REAL,
      fee_paid INTEGER DEFAULT 0,
      hearing_date DATETIME,
      judgment_date DATETIME,
      execution_status TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS case_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      stage TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'in_progress',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS live_streams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lawyer_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      thumbnail TEXT,
      stream_url TEXT,
      status TEXT DEFAULT 'scheduled',
      scheduled_time DATETIME,
      viewer_count INTEGER DEFAULT 0,
      is_paid INTEGER DEFAULT 0,
      price REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS short_videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lawyer_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      video_url TEXT,
      thumbnail TEXT,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      is_paid INTEGER DEFAULT 0,
      price REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS revenue_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lawyer_id INTEGER NOT NULL,
      content_id INTEGER,
      content_type TEXT,
      amount REAL NOT NULL,
      platform_fee REAL NOT NULL,
      lawyer_income REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      license_number TEXT UNIQUE,
      contact_name TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      vip_level TEXT DEFAULT 'basic',
      vip_expire_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS legal_sops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS training_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      category TEXT,
      is_public INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS consultation_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      lawyer_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (employee_id) REFERENCES users(id),
      FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS document_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      document_name TEXT,
      document_content TEXT,
      analysis_result TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admin_users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS conversation_audits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consultation_id INTEGER NOT NULL,
      flagged_words TEXT,
      risk_level TEXT DEFAULT 'low',
      auditor_id INTEGER,
      audit_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consultation_id) REFERENCES consultations(id),
      FOREIGN KEY (auditor_id) REFERENCES admin_users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS nps_surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consultation_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      feedback TEXT,
      attribution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consultation_id) REFERENCES consultations(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS compliance_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lawyer_id INTEGER,
      report_period TEXT,
      report_content TEXT,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consultation_id INTEGER NOT NULL,
      sender_type TEXT NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consultation_id) REFERENCES consultations(id)
    )
  `);

  [
    ['users', 'username', 'TEXT'],
    ['users', 'real_name', 'TEXT'],
    ['users', 'role', "TEXT DEFAULT 'user'"],
    ['users', 'status', "TEXT DEFAULT 'active'"],
    ['users', 'name', 'TEXT'],
    ['users', 'user_type', "TEXT DEFAULT 'individual'"],

    ['lawyers', 'user_id', 'INTEGER'],
    ['lawyers', 'name', 'TEXT'],
    ['lawyers', 'phone', 'TEXT'],
    ['lawyers', 'email', 'TEXT'],
    ['lawyers', 'password', 'TEXT'],
    ['lawyers', 'practice_area', 'TEXT'],
    ['lawyers', 'years_experience', 'INTEGER'],
    ['lawyers', 'avatar', 'TEXT'],
    ['lawyers', 'consultation_count', 'INTEGER DEFAULT 0'],
    ['lawyers', 'specialization', 'TEXT'],
    ['lawyers', 'practice_years', 'INTEGER'],
    ['lawyers', 'case_count', 'INTEGER DEFAULT 0'],

    ['consultations', 'description', 'TEXT'],
    ['consultations', 'category', 'TEXT'],
    ['consultations', 'level', 'INTEGER DEFAULT 1'],
    ['consultations', 'lawyer_response', 'TEXT'],
    ['consultations', 'consultation_type', "TEXT DEFAULT 'text'"],
    ['consultations', 'scheduled_time', 'DATETIME'],

    ['contracts', 'category', 'TEXT'],
    ['contracts', 'version', 'INTEGER DEFAULT 1'],

    ['live_streams', 'thumbnail', 'TEXT'],
    ['live_streams', 'scheduled_time', 'DATETIME'],
    ['live_streams', 'is_paid', 'INTEGER DEFAULT 0'],

    ['conversation_audits', 'flagged_words', 'TEXT'],
    ['conversation_audits', 'risk_level', "TEXT DEFAULT 'low'"],
    ['conversation_audits', 'auditor_id', 'INTEGER'],
    ['conversation_audits', 'audit_status', "TEXT DEFAULT 'pending'"],
  ].forEach(([table, column, definition]) => ensureColumn(table, column, definition));

  const fallbackPassword = bcrypt.hashSync('demo123456', 10);

  runSql(`
    UPDATE users
    SET
      name = COALESCE(NULLIF(name, ''), NULLIF(real_name, ''), NULLIF(username, ''), NULLIF(email, ''), '用户' || id),
      username = COALESCE(NULLIF(username, ''), NULLIF(email, ''), 'user' || id),
      user_type = COALESCE(NULLIF(user_type, ''), 'individual'),
      role = COALESCE(NULLIF(role, ''), 'user'),
      status = COALESCE(NULLIF(status, ''), 'active')
  `);

  runSql(`
    UPDATE lawyers
    SET
      name = COALESCE(
        NULLIF(name, ''),
        (SELECT COALESCE(NULLIF(users.name, ''), NULLIF(users.real_name, ''), NULLIF(users.username, ''), NULLIF(users.email, ''))
         FROM users WHERE users.id = lawyers.user_id),
        '律师' || id
      ),
      email = COALESCE(
        NULLIF(email, ''),
        (SELECT NULLIF(users.email, '') FROM users WHERE users.id = lawyers.user_id),
        'lawyer' || id || '@example.local'
      ),
      phone = COALESCE(
        NULLIF(phone, ''),
        (SELECT NULLIF(users.phone, '') FROM users WHERE users.id = lawyers.user_id),
        '1380000' || printf('%04d', id)
      ),
      password = COALESCE(NULLIF(password, ''), ?),
      practice_area = COALESCE(NULLIF(practice_area, ''), NULLIF(specialization, ''), '民商事诉讼'),
      years_experience = COALESCE(years_experience, practice_years, 5),
      consultation_count = COALESCE(consultation_count, case_count, 0),
      verification_status = COALESCE(NULLIF(verification_status, ''), 'approved')
  `, [fallbackPassword]);

  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`
    INSERT OR IGNORE INTO admin_users (username, password, role)
    VALUES ('admin', ?, 'super_admin')
  `, [adminPassword]);

  const demoLawyers = [
    ['张明律师', '13800001001', 'zhangming@example.local', 'L-2024-001', '民商事诉讼', 12, '专注合同纠纷、债权债务和公司治理，擅长复杂民商事争议解决。', 4.9, 386],
    ['李清律师', '13800001002', 'liqing@example.local', 'L-2024-002', '劳动纠纷', 9, '长期服务企业与劳动者，熟悉劳动合同、社保、竞业限制及仲裁流程。', 4.8, 291],
    ['王若律师', '13800001003', 'wangruo@example.local', 'L-2024-003', '知识产权', 10, '覆盖商标、著作权、商业秘密保护和互联网平台维权。', 4.9, 254],
  ];

  db.get('SELECT COUNT(*) as count FROM lawyers', (err, row) => {
    if (err || (row && row.count > 0)) {
      if (err) console.error('Failed to inspect lawyers seed:', err.message);
      return;
    }

    const demoPassword = bcrypt.hashSync('lawyer123', 10);
    demoLawyers.forEach((lawyer) => {
      db.run(`
        INSERT OR IGNORE INTO lawyers (
          name, phone, email, password, license_number, practice_area,
          years_experience, bio, verification_status, rating, consultation_count
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)
      `, [lawyer[0], lawyer[1], lawyer[2], demoPassword, lawyer[3], lawyer[4], lawyer[5], lawyer[6], lawyer[7], lawyer[8]]);
    });
  });
});

module.exports = db;
