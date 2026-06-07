const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '..', '..', 'data', 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'worker',
    phone TEXT,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS worker_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    identity_type TEXT,
    real_name TEXT,
    id_number TEXT,
    university TEXT,
    major TEXT,
    grade TEXT,
    skills TEXT,
    availability_calendar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS employer_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    company_name TEXT,
    business_license TEXT,
    verified INTEGER DEFAULT 0,
    publish_limit INTEGER DEFAULT 10,
    publish_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employer_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    work_time TEXT,
    work_location TEXT,
    hourly_wage REAL,
    category TEXT,
    status TEXT DEFAULT 'open',
    audit_status TEXT DEFAULT 'pending',
    audit_note TEXT,
    report_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    worker_id INTEGER NOT NULL,
    employer_id INTEGER NOT NULL,
    status TEXT DEFAULT 'applied',
    work_start TEXT,
    work_end TEXT,
    check_in_lat REAL,
    check_in_lng REAL,
    check_in_time DATETIME,
    check_in_geofence INTEGER DEFAULT 0,
    employer_confirm_time DATETIME,
    dispute_status TEXT DEFAULT 'none',
    dispute_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (worker_id) REFERENCES users(id),
    FOREIGN KEY (employer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    worker_id INTEGER NOT NULL,
    employer_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    fee REAL,
    tax REAL,
    actual_amount REAL,
    status TEXT DEFAULT 'pending',
    channel TEXT DEFAULT 'T0',
    transaction_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (worker_id) REFERENCES users(id),
    FOREIGN KEY (employer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS message_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    worker_id INTEGER NOT NULL,
    employer_id INTEGER NOT NULL,
    last_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (worker_id) REFERENCES users(id),
    FOREIGN KEY (employer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES message_sessions(id),
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
  );

  CREATE TABLE IF NOT EXISTS guarantees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    type TEXT,
    status TEXT DEFAULT 'active',
    agent_id INTEGER,
    compensation_amount REAL,
    reason TEXT,
    result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS arbitrate_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    plaintiff_id INTEGER NOT NULL,
    defendant_id INTEGER NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (plaintiff_id) REFERENCES users(id),
    FOREIGN KEY (defendant_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operator_id INTEGER NOT NULL,
    target_type TEXT,
    target_id INTEGER,
    action TEXT,
    detail TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (operator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS campus_ambassadors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    university TEXT,
    status TEXT DEFAULT 'applied',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS credit_certifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    university TEXT,
    credit_type TEXT,
    credit_value TEXT,
    verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS peak_predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER,
    season TEXT,
    predicted_demand INTEGER,
    actual_demand INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!adminExists) {
  const adminHash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (username, password_hash, role, phone) VALUES (?, ?, 'admin', '13800000000')
  `).run('admin', adminHash);

  const emp1Hash = bcrypt.hashSync('employer123', 10);
  const emp2Hash = bcrypt.hashSync('employer456', 10);
  const w1Hash = bcrypt.hashSync('worker123', 10);
  const w2Hash = bcrypt.hashSync('worker456', 10);
  const w3Hash = bcrypt.hashSync('worker789', 10);

  const emp1 = db.prepare(`
    INSERT INTO users (username, password_hash, role, phone) VALUES (?, ?, 'employer', '13800000001')
  `).run('employer1', emp1Hash);

  const emp2 = db.prepare(`
    INSERT INTO users (username, password_hash, role, phone) VALUES (?, ?, 'employer', '13800000002')
  `).run('employer2', emp2Hash);

  const w1 = db.prepare(`
    INSERT INTO users (username, password_hash, role, phone) VALUES (?, ?, 'worker', '13900000001')
  `).run('worker1', w1Hash);

  const w2 = db.prepare(`
    INSERT INTO users (username, password_hash, role, phone) VALUES (?, ?, 'worker', '13900000002')
  `).run('worker2', w2Hash);

  const w3 = db.prepare(`
    INSERT INTO users (username, password_hash, role, phone) VALUES (?, ?, 'worker', '13900000003')
  `).run('worker3', w3Hash);

  db.prepare(`
    INSERT INTO employer_profiles (user_id, company_name, business_license, verified, publish_limit, publish_count)
    VALUES (?, 'StarTech Co., Ltd.', 'BL20240001', 1, 20, 3)
  `).run(emp1.lastInsertRowid);

  db.prepare(`
    INSERT INTO employer_profiles (user_id, company_name, business_license, verified, publish_limit, publish_count)
    VALUES (?, 'CloudWave Inc.', 'BL20240002', 1, 15, 2)
  `).run(emp2.lastInsertRowid);

  db.prepare(`
    INSERT INTO worker_profiles (user_id, identity_type, real_name, university, major, grade, skills, availability_calendar)
    VALUES (?, 'student', 'Zhang San', 'Peking University', 'Computer Science', 'Junior', '["Programming","Data Analysis"]', '{"weekdays":true,"weekends":true}')
  `).run(w1.lastInsertRowid);

  db.prepare(`
    INSERT INTO worker_profiles (user_id, identity_type, real_name, university, major, grade, skills, availability_calendar)
    VALUES (?, 'student', 'Li Si', 'Tsinghua University', 'Design', 'Sophomore', '["UI Design","Graphic Design"]', '{"weekdays":false,"weekends":true}')
  `).run(w2.lastInsertRowid);

  db.prepare(`
    INSERT INTO worker_profiles (user_id, identity_type, real_name, university, major, grade, skills, availability_calendar)
    VALUES (?, 'professional', 'Wang Wu', NULL, NULL, NULL, '["Writing","Translation"]', '{"weekdays":true,"weekends":false}')
  `).run(w3.lastInsertRowid);

  const job1 = db.prepare(`
    INSERT INTO jobs (employer_id, title, description, work_time, work_location, hourly_wage, category, status, audit_status)
    VALUES (?, 'Frontend Development Intern', 'Develop and maintain company website frontend using React', 'Mon-Fri 9:00-18:00', 'Zhongguancun, Beijing', 35, 'Technology', 'open', 'approved')
  `).run(emp1.lastInsertRowid);

  const job2 = db.prepare(`
    INSERT INTO jobs (employer_id, title, description, work_time, work_location, hourly_wage, category, status, audit_status)
    VALUES (?, 'UI Design Assistant', 'Assist in mobile app UI design projects', 'Sat-Sun 10:00-16:00', 'Haidian, Beijing', 40, 'Design', 'open', 'approved')
  `).run(emp1.lastInsertRowid);

  const job3 = db.prepare(`
    INSERT INTO jobs (employer_id, title, description, work_time, work_location, hourly_wage, category, status, audit_status)
    VALUES (?, 'Data Entry Clerk', 'Enter and verify data in company database', 'Mon-Wed-Fri 14:00-18:00', 'Chaoyang, Beijing', 25, 'Clerical', 'open', 'approved')
  `).run(emp2.lastInsertRowid);

  const job4 = db.prepare(`
    INSERT INTO jobs (employer_id, title, description, work_time, work_location, hourly_wage, category, status, audit_status)
    VALUES (?, 'English Translator', 'Translate technical documents from Chinese to English', 'Remote flexible hours', 'Remote', 50, 'Translation', 'open', 'approved')
  `).run(emp2.lastInsertRowid);

  const job5 = db.prepare(`
    INSERT INTO jobs (employer_id, title, description, work_time, work_location, hourly_wage, category, status, audit_status)
    VALUES (?, 'Coffee Shop Barista', 'Prepare and serve beverages to customers', 'Weekday mornings 7:00-11:00', 'Xidan, Beijing', 22, 'Food & Beverage', 'open', 'approved')
  `).run(emp1.lastInsertRowid);

  const order1 = db.prepare(`
    INSERT INTO orders (job_id, worker_id, employer_id, status, work_start, work_end, check_in_lat, check_in_lng, check_in_time, check_in_geofence, employer_confirm_time)
    VALUES (?, ?, ?, 'completed', '2024-06-01 09:00', '2024-06-01 18:00', 39.9842, 116.3074, '2024-06-01 08:55', 1, '2024-06-01 18:00')
  `).run(job1.lastInsertRowid, w1.lastInsertRowid, emp1.lastInsertRowid);

  const order2 = db.prepare(`
    INSERT INTO orders (job_id, worker_id, employer_id, status)
    VALUES (?, ?, ?, 'applied')
  `).run(job2.lastInsertRowid, w2.lastInsertRowid, emp1.lastInsertRowid);

  const order3 = db.prepare(`
    INSERT INTO orders (job_id, worker_id, employer_id, status, employer_confirm_time)
    VALUES (?, ?, ?, 'completed', '2024-05-30 18:00')
  `).run(job3.lastInsertRowid, w3.lastInsertRowid, emp2.lastInsertRowid);

  const order4 = db.prepare(`
    INSERT INTO orders (job_id, worker_id, employer_id, status, check_in_lat, check_in_lng, check_in_time, check_in_geofence)
    VALUES (?, ?, ?, 'working', 39.9800, 116.3100, '2024-06-02 08:50', 1)
  `).run(job4.lastInsertRowid, w1.lastInsertRowid, emp2.lastInsertRowid);

  db.prepare(`
      INSERT INTO settlements (order_id, worker_id, employer_id, amount, fee, tax, actual_amount, status, channel, transaction_id, completed_at)
      VALUES (?, ?, ?, 280, 14, 8.4, 257.6, 'completed', 'T0', 'TXN20240530001', '2024-05-30 18:05')
    `).run(order3.lastInsertRowid, w3.lastInsertRowid, emp2.lastInsertRowid);

    db.prepare(`
      INSERT INTO settlements (order_id, worker_id, employer_id, amount, fee, tax, actual_amount, status, channel, transaction_id, completed_at)
      VALUES (?, ?, ?, 315, 15.75, 9.45, 289.8, 'completed', 'T0', 'TXN20240601001', '2024-06-01 18:05')
    `).run(order1.lastInsertRowid, w1.lastInsertRowid, emp1.lastInsertRowid);

  const sess1 = db.prepare(`
    INSERT INTO message_sessions (job_id, worker_id, employer_id, last_message, updated_at)
    VALUES (?, ?, ?, 'When does the internship start?', '2024-06-01 09:00')
  `).run(job1.lastInsertRowid, w1.lastInsertRowid, emp1.lastInsertRowid);

  db.prepare(`
    INSERT INTO messages (session_id, sender_id, receiver_id, content, is_read, created_at)
    VALUES (?, ?, ?, 'Hi, I am interested in the frontend intern position.', 1, '2024-06-01 08:50')
  `).run(sess1.lastInsertRowid, w1.lastInsertRowid, emp1.lastInsertRowid);

  db.prepare(`
    INSERT INTO messages (session_id, sender_id, receiver_id, content, is_read, created_at)
    VALUES (?, ?, ?, 'When does the internship start?', 0, '2024-06-01 09:00')
  `).run(sess1.lastInsertRowid, w1.lastInsertRowid, emp1.lastInsertRowid);
}

function seedOperationalData() {
  const pickUser = (role, fallbackId = 1) => {
    const row = db.prepare('SELECT id FROM users WHERE role = ? ORDER BY id LIMIT 1').get(role);
    return row?.id || fallbackId;
  };
  const pickJob = () => {
    const row = db.prepare('SELECT id FROM jobs ORDER BY id LIMIT 1').get();
    return row?.id || 1;
  };

  const workerId = pickUser('worker');
  const jobId = pickJob();

  const predictionCount = db.prepare('SELECT COUNT(*) as count FROM peak_predictions').get().count;
  if (predictionCount === 0) {
    const insertPrediction = db.prepare(`
      INSERT INTO peak_predictions (year, season, predicted_demand, actual_demand)
      VALUES (?, ?, ?, ?)
    `);
    insertPrediction.run(2026, '暑期', 2380, 2215);
    insertPrediction.run(2026, '寒假', 1280, null);
    insertPrediction.run(2025, '秋招', 1680, 1612);
  }

  const ambassadorCount = db.prepare('SELECT COUNT(*) as count FROM campus_ambassadors').get().count;
  if (ambassadorCount === 0) {
    const insertAmbassador = db.prepare(`
      INSERT INTO campus_ambassadors (user_id, university, status)
      VALUES (?, ?, ?)
    `);
    insertAmbassador.run(workerId, '北京大学', 'pending');
    insertAmbassador.run(workerId, '清华大学', 'approved');
  }

  const certCount = db.prepare('SELECT COUNT(*) as count FROM credit_certifications').get().count;
  if (certCount === 0) {
    const insertCert = db.prepare(`
      INSERT INTO credit_certifications (user_id, university, credit_type, credit_value, verified)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertCert.run(workerId, '北京大学', '社会实践', '2学分', 0);
    insertCert.run(workerId, '清华大学', '志愿服务', '1学分', 1);
  }

  const reportCount = db.prepare('SELECT COUNT(*) as count FROM reports').get().count;
  if (reportCount === 0) {
    const insertReport = db.prepare(`
      INSERT INTO reports (reporter_id, job_id, reason, status)
      VALUES (?, ?, ?, ?)
    `);
    insertReport.run(workerId, jobId, '虚假岗位', 'pending');
    insertReport.run(workerId, jobId, '薪资描述不一致', 'processing');
    insertReport.run(workerId, jobId, '联系不上雇主', 'resolved');
  }

  const auditLogCount = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;
  if (auditLogCount === 0) {
    const adminId = pickUser('admin');
    const employerId = pickUser('employer');
    const allJobs = db.prepare('SELECT id FROM jobs ORDER BY id').all();
    const insertAuditLog = db.prepare(`
      INSERT INTO audit_logs (operator_id, target_type, target_id, action, detail, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    if (allJobs.length >= 1) {
      insertAuditLog.run(adminId, 'job', allJobs[0].id, 'inspection', 'Initial job inspection passed', '2024-05-28 10:00:00');
      insertAuditLog.run(adminId, 'job', allJobs[0].id, 'audit', 'Audit result: approved, job meets all requirements', '2024-05-28 11:00:00');
      insertAuditLog.run(adminId, 'job', allJobs[0].id, 'inspection', 'Follow-up inspection: work conditions verified', '2024-06-01 09:30:00');
    }
    if (allJobs.length >= 2) {
      insertAuditLog.run(adminId, 'job', allJobs[1].id, 'inspection', 'Design job inspection: portfolio materials reviewed', '2024-05-29 14:00:00');
      insertAuditLog.run(adminId, 'job', allJobs[1].id, 'audit', 'Audit result: approved, design qualifications confirmed', '2024-05-29 15:00:00');
    }
    if (allJobs.length >= 3) {
      insertAuditLog.run(adminId, 'job', allJobs[2].id, 'inspection', 'Clerical job inspection: business license verified', '2024-05-30 09:00:00');
      insertAuditLog.run(adminId, 'job', allJobs[2].id, 'audit', 'Audit result: approved', '2024-05-30 10:00:00');
    }
    if (allJobs.length >= 4) {
      insertAuditLog.run(adminId, 'job', allJobs[3].id, 'inspection', 'Translation job inspection: language proficiency verified', '2024-05-30 11:00:00');
      insertAuditLog.run(adminId, 'job', allJobs[3].id, 'audit', 'Audit result: approved', '2024-05-30 12:00:00');
    }
    insertAuditLog.run(adminId, 'employer', employerId, 'verify', 'Employer identity verified, business license confirmed', '2024-05-27 09:00:00');
    insertAuditLog.run(adminId, 'employer', employerId, 'inspect', 'Employer profile inspection: company info validated', '2024-05-27 10:00:00');
  }
}

seedOperationalData();

module.exports = db;
