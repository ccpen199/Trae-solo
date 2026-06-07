const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('worker', 'company', 'team', 'admin')),
      name TEXT,
      id_card TEXT UNIQUE,
      real_name_verified INTEGER DEFAULT 0,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      skills TEXT,
      experience_years INTEGER,
      experience_tags TEXT,
      credit_score INTEGER DEFAULT 100,
      certificates TEXT,
      location TEXT,
      lat REAL,
      lng REAL,
      daily_salary_expected INTEGER,
      available_start_date DATE,
      available_end_date DATE,
      status TEXT DEFAULT 'idle' CHECK(status IN ('idle', 'working', 'offline')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      company_name TEXT,
      license_number TEXT UNIQUE,
      license_verified INTEGER DEFAULT 0,
      address TEXT,
      contact_person TEXT,
      contact_phone TEXT,
      safety_certificates TEXT,
      credit_score INTEGER DEFAULT 100,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      team_name TEXT,
      qualification_number TEXT UNIQUE,
      qualification_verified INTEGER DEFAULT 0,
      member_count INTEGER DEFAULT 0,
      member_skills TEXT,
      performance_records TEXT,
      credit_score INTEGER DEFAULT 100,
      location TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS job_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      job_type TEXT NOT NULL,
      skill_required TEXT NOT NULL,
      workers_needed INTEGER DEFAULT 1,
      location TEXT NOT NULL,
      lat REAL,
      lng REAL,
      daily_salary INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      description TEXT,
      safety_training_required INTEGER DEFAULT 0,
      special_cert_required TEXT,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'matched', 'in_progress', 'completed', 'cancelled')),
      deposit_amount DECIMAL(10,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS job_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      worker_id INTEGER,
      team_id INTEGER,
      match_score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'completed')),
      worker_deposit DECIMAL(10,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES job_posts(id),
      FOREIGN KEY (worker_id) REFERENCES workers(id),
      FOREIGN KEY (team_id) REFERENCES teams(id)
    );

    CREATE TABLE IF NOT EXISTS attendances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_match_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      check_in_time DATETIME,
      check_out_time DATETIME,
      hours_worked DECIMAL(4,2) DEFAULT 0,
      location_verified INTEGER DEFAULT 0,
      confirmed INTEGER DEFAULT 0,
      confirmed_by INTEGER,
      confirmed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_match_id) REFERENCES job_matches(id),
      FOREIGN KEY (worker_id) REFERENCES workers(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_match_id INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('deposit', 'salary', 'refund', 'penalty')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'held', 'released', 'cancelled')),
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      released_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_match_id) REFERENCES job_matches(id)
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_match_id INTEGER NOT NULL,
      template_id INTEGER,
      content TEXT NOT NULL,
      signed_by_worker INTEGER DEFAULT 0,
      signed_by_company INTEGER DEFAULT 0,
      signed_at DATETIME,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'signed', 'terminated')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_match_id) REFERENCES job_matches(id)
    );

    CREATE TABLE IF NOT EXISTS contract_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS safety_knowledge (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      is_daily_tip INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS safety_exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      questions TEXT NOT NULL,
      pass_score INTEGER DEFAULT 60,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exam_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      exam_id INTEGER NOT NULL,
      score INTEGER,
      passed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (exam_id) REFERENCES safety_exams(id)
    );

    CREATE TABLE IF NOT EXISTS labor_disputes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_match_id INTEGER NOT NULL,
      plaintiff_id INTEGER NOT NULL,
      defendant_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      evidence TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'investigating', 'resolved', 'closed')),
      resolution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_match_id) REFERENCES job_matches(id)
    );
  `);

  const skills = [
    '旋挖钻机手', '木工', '电工', '架子工', '钢筋工', '混凝土工', '砌筑工', '抹灰工',
    '防水工', '油漆工', '水暖工', '焊工', '起重工', '信号工', '测量工', '试验工',
    '挖掘机司机', '装载机司机', '塔吊司机', '施工升降机司机', '叉车司机', '压路机司机',
    '桩机操作工', '爆破工', '防腐工', '保温工', '幕墙工', '绿化工', '保洁工', '保安'
  ];

  const tipStmt = db.prepare(`INSERT OR IGNORE INTO safety_knowledge (title, content, category, is_daily_tip) VALUES (?, ?, ?, ?)`);
  const safetyTips = [
    ['高处作业安全', '高处作业必须系好安全带，戴好安全帽，穿防滑鞋。严禁抛物，工具应放入工具袋。', '高处作业', 1],
    ['用电安全须知', '施工现场用电必须由持证电工操作，严禁私拉乱接电线。所有设备必须接地。', '用电安全', 1],
    ['消防管理规定', '施工现场必须配备足够消防器材，严禁明火作业附近有易燃物品。', '消防安全', 1],
    ['安全帽正确佩戴', '安全帽必须系好下颌带，高空作业时安全帽不得摘下。', '个人防护', 1],
    ['脚手架安全', '脚手架搭设必须符合规范，作业层满铺脚手板，设置防护栏杆和挡脚板。', '脚手架', 0]
  ];
  safetyTips.forEach(tip => tipStmt.run(...tip));

  const templateStmt = db.prepare(`INSERT OR IGNORE INTO contract_templates (name, type, content, is_default) VALUES (?, ?, ?, ?)`);
  const templates = [
    ['标准劳务合同', 'standard', '甲方（用工方）：\n乙方（劳动者）：\n\n一、工作内容和工作地点\n二、工作期限\n三、劳动报酬\n四、工作时间和休息休假\n五、劳动保护和劳动条件\n六、社会保险\n七、劳动纪律\n八、合同的解除和终止\n九、违约责任\n十、争议解决', 1],
    ['短期用工协议', 'short_term', '甲方：\n乙方：\n\n经双方协商一致，达成以下短期用工协议：\n1. 用工期限\n2. 工作内容\n3. 报酬标准及支付方式\n4. 双方权利义务\n5. 安全责任', 0]
  ];
  templates.forEach(t => templateStmt.run(...t));

  console.log('Database initialized successfully');
}

module.exports = { db, initDatabase };
