const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'consultant',
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      industry TEXT,
      contact_person TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      requirements TEXT,
      salary_min INTEGER,
      salary_max INTEGER,
      priority TEXT DEFAULT 'normal',
      consultant_id INTEGER,
      service_rate REAL DEFAULT 0.2,
      is_confidential INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      version INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (consultant_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS position_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      position_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      requirements TEXT,
      salary_min INTEGER,
      salary_max INTEGER,
      priority TEXT,
      consultant_id INTEGER,
      service_rate REAL,
      is_confidential INTEGER,
      changed_by INTEGER,
      change_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (position_id) REFERENCES positions(id),
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      gender TEXT,
      age INTEGER,
      phone TEXT,
      email TEXT,
      source TEXT,
      resume TEXT,
      current_company TEXT,
      current_position TEXT,
      current_salary INTEGER,
      expected_salary_min INTEGER,
      expected_salary_max INTEGER,
      intention_level TEXT DEFAULT 'pending',
      has_nonce_competition INTEGER DEFAULT 0,
      nonce_competition_notes TEXT,
      notes TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS candidate_communications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      communication_type TEXT DEFAULT 'call',
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      position_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      consultant_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      recommendation_notes TEXT,
      client_feedback TEXT,
      client_feedback_at DATETIME,
      candidate_response TEXT,
      candidate_response_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id),
      FOREIGN KEY (position_id) REFERENCES positions(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (consultant_id) REFERENCES users(id),
      UNIQUE(candidate_id, position_id)
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recommendation_id INTEGER NOT NULL,
      interview_type TEXT DEFAULT 'first',
      interview_time DATETIME,
      interview_location TEXT,
      interviewer TEXT,
      status TEXT DEFAULT 'scheduled',
      candidate_feedback TEXT,
      client_feedback TEXT,
      result TEXT,
      result_notes TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recommendation_id) REFERENCES recommendations(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recommendation_id INTEGER NOT NULL,
      salary INTEGER NOT NULL,
      benefits TEXT,
      entry_time DATETIME,
      guarantee_period INTEGER DEFAULT 90,
      status TEXT DEFAULT 'pending',
      candidate_response TEXT DEFAULT 'pending',
      candidate_response_at DATETIME,
      candidate_response_notes TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recommendation_id) REFERENCES recommendations(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_id INTEGER NOT NULL,
      actual_entry_time DATETIME,
      status TEXT DEFAULT 'normal',
      failure_reason TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (offer_id) REFERENCES offers(id)
    );

    CREATE TABLE IF NOT EXISTS commissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recommendation_id INTEGER NOT NULL,
      entry_id INTEGER,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      stage TEXT DEFAULT 'first',
      paid_amount REAL DEFAULT 0,
      unpaid_amount REAL,
      first_payment_at DATETIME,
      second_payment_at DATETIME,
      guarantee_end_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recommendation_id) REFERENCES recommendations(id),
      FOREIGN KEY (entry_id) REFERENCES entries(id)
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recommendation_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      event_title TEXT NOT NULL,
      event_description TEXT,
      event_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recommendation_id) REFERENCES recommendations(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);

  const adminExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('admin');
  if (adminExists.count === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (username, password, role, name, email)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', hashedPassword, 'admin', '系统管理员', 'admin@example.com');

    db.prepare(`
      INSERT INTO users (username, password, role, name, email)
      VALUES (?, ?, ?, ?, ?)
    `).run('consultant1', hashedPassword, 'consultant', '张顾问', 'zhang@example.com');
  }

  const clientExists = db.prepare('SELECT COUNT(*) as count FROM clients').get();
  if (clientExists.count === 0) {
    db.prepare(`
      INSERT INTO clients (name, industry, contact_person, contact_phone, contact_email, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('阿里巴巴集团', '互联网', '李经理', '13800138001', 'li@alibaba.com', '杭州市余杭区文一西路');

    db.prepare(`
      INSERT INTO clients (name, industry, contact_person, contact_phone, contact_email, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('腾讯科技', '互联网', '王总监', '13800138002', 'wang@tencent.com', '深圳市南山区科技园');

    db.prepare(`
      INSERT INTO clients (name, industry, contact_person, contact_phone, contact_email, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('字节跳动', '互联网', '赵主管', '13800138003', 'zhao@bytedance.com', '北京市海淀区中关村');
  }

  const positionExists = db.prepare('SELECT COUNT(*) as count FROM positions').get();
  if (positionExists.count === 0) {
    db.prepare(`
      INSERT INTO positions (client_id, title, description, requirements, salary_min, salary_max, priority, consultant_id, service_rate, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(1, '高级前端工程师', '负责公司核心产品前端开发工作', '3年以上前端开发经验，精通React/Vue', 25000, 40000, 'urgent', 1, 0.25, 'active');

    db.prepare(`
      INSERT INTO positions (client_id, title, description, requirements, salary_min, salary_max, priority, consultant_id, service_rate, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(1, '后端开发工程师', '负责后端服务架构设计与开发', '2年以上Go/Java开发经验', 20000, 35000, 'high', 1, 0.25, 'active');

    db.prepare(`
      INSERT INTO positions (client_id, title, description, requirements, salary_min, salary_max, priority, consultant_id, service_rate, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(2, '产品经理', '负责产品规划与需求管理', '3年以上互联网产品经验', 30000, 50000, 'normal', 2, 0.2, 'active');
  }

  const candidateExists = db.prepare('SELECT COUNT(*) as count FROM candidates').get();
  if (candidateExists.count === 0) {
    db.prepare(`
      INSERT INTO candidates (name, gender, age, phone, email, source, current_company, current_position, current_salary, expected_salary_min, expected_salary_max, intention_level, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('陈小明', '男', 28, '13900139001', 'chen@email.com', '猎头推荐', '美团', '前端开发工程师', 25000, 30000, 40000, 'high', 1);

    db.prepare(`
      INSERT INTO candidates (name, gender, age, phone, email, source, current_company, current_position, current_salary, expected_salary_min, expected_salary_max, intention_level, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('李小红', '女', 26, '13900139002', 'li@email.com', '简历网站', '京东', '后端开发工程师', 20000, 25000, 35000, 'medium', 1);

    db.prepare(`
      INSERT INTO candidates (name, gender, age, phone, email, source, current_company, current_position, current_salary, expected_salary_min, expected_salary_max, intention_level, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('王大伟', '男', 30, '13900139003', 'wang@email.com', '内部推荐', '百度', '高级前端工程师', 32000, 35000, 50000, 'high', 1);
  }
};

initDatabase();

module.exports = db;
