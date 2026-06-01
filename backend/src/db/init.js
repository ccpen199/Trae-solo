import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let db = null;

export function getDb() {
  return db;
}

export function initDb(dbPath) {
  const fullPath = resolve(__dirname, '..', '..', dbPath || 'data/app.sqlite');
  mkdirSync(dirname(fullPath), { recursive: true });

  db = new Database(fullPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      phone TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('worker','employer','admin','platform','ops','university')),
      nickname TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active','banned','suspended')),
      identity_tags TEXT DEFAULT '[]',
      skill_certs TEXT DEFAULT '[]',
      credit_score INTEGER DEFAULT 100,
      employer_type TEXT DEFAULT '',
      employer_name TEXT DEFAULT '',
      business_license TEXT DEFAULT '',
      university_name TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employer_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT '',
      pay_type TEXT NOT NULL CHECK(pay_type IN ('daily','weekly','project','online')),
      pay_amount REAL DEFAULT 0,
      pay_unit TEXT DEFAULT '',
      location TEXT DEFAULT '',
      lat REAL DEFAULT 0,
      lng REAL DEFAULT 0,
      work_start TEXT DEFAULT '',
      work_end TEXT DEFAULT '',
      safety_level INTEGER DEFAULT 1 CHECK(safety_level BETWEEN 1 AND 3),
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','pending_review','approved','rejected','closed')),
      review_ocr_status TEXT DEFAULT 'pending' CHECK(review_ocr_status IN ('pending','passed','failed')),
      review_ocr_result TEXT DEFAULT '',
      review_site_status TEXT DEFAULT 'pending' CHECK(review_site_status IN ('pending','passed','failed')),
      review_site_photos TEXT DEFAULT '[]',
      required_skills TEXT DEFAULT '[]',
      required_count INTEGER DEFAULT 1,
      applied_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS job_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id),
      worker_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT DEFAULT 'applied' CHECK(status IN ('applied','accepted','rejected','completed')),
      cover_letter TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(job_id, worker_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER REFERENCES jobs(id),
      employer_id INTEGER NOT NULL REFERENCES users(id),
      worker_id INTEGER NOT NULL REFERENCES users(id),
      last_message TEXT DEFAULT '',
      last_message_at TEXT DEFAULT (datetime('now','localtime')),
      created_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(job_id, employer_id, worker_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id),
      sender_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text','system','interview_invite')),
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS interview_appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id),
      job_id INTEGER NOT NULL REFERENCES jobs(id),
      proposed_time TEXT NOT NULL,
      confirmed_time TEXT DEFAULT '',
      status TEXT DEFAULT 'proposed' CHECK(status IN ('proposed','confirmed','cancelled')),
      location TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id),
      employer_id INTEGER NOT NULL REFERENCES users(id),
      worker_id INTEGER NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      platform_fee REAL DEFAULT 0,
      actual_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'frozen' CHECK(status IN ('frozen','confirmed','released','failed')),
      worker_bank_info TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      released_at TEXT DEFAULT ''
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS risk_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL REFERENCES users(id),
      target_employer_id INTEGER REFERENCES users(id),
      job_id INTEGER REFERENCES jobs(id),
      report_type TEXT NOT NULL,
      description TEXT DEFAULT '',
      location TEXT DEFAULT '',
      lat REAL DEFAULT 0,
      lng REAL DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','verified','dismissed')),
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employer_id INTEGER NOT NULL REFERENCES users(id),
      reason TEXT DEFAULT '',
      reported_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS university_partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      university_name TEXT NOT NULL,
      contact_name TEXT DEFAULT '',
      contact_phone TEXT DEFAULT '',
      employment_office_code TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive')),
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS internship_certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL REFERENCES users(id),
      job_id INTEGER NOT NULL REFERENCES jobs(id),
      university_partner_id INTEGER NOT NULL REFERENCES university_partners(id),
      cert_number TEXT NOT NULL UNIQUE,
      issued_at TEXT DEFAULT (datetime('now','localtime')),
      status TEXT DEFAULT 'active'
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS job_push_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      university_partner_id INTEGER NOT NULL REFERENCES university_partners(id),
      category TEXT DEFAULT '',
      keywords TEXT DEFAULT '[]',
      target_roles TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      target_type TEXT DEFAULT '',
      target_id INTEGER DEFAULT 0,
      detail TEXT DEFAULT '{}',
      ip_address TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS opinion_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER REFERENCES jobs(id),
      alert_type TEXT NOT NULL,
      content_snippet TEXT DEFAULT '',
      risk_score REAL DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','reviewed','dismissed')),
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS job_review_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id),
      reviewer_id INTEGER REFERENCES users(id),
      review_type TEXT NOT NULL CHECK(review_type IN ('ocr','site','status')),
      old_status TEXT,
      new_status TEXT NOT NULL,
      result TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_jobs_employer ON jobs(employer_id)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_applications_worker ON job_applications(worker_id)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_conversations_employer ON chat_conversations(employer_id)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_conversations_worker ON chat_conversations(worker_id)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON chat_messages(conversation_id)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_settlements_job ON settlements(job_id)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_settlements_worker ON settlements(worker_id)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_risk_reports_target ON risk_reports(target_employer_id)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_risk_reports_status ON risk_reports(status)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_blacklist_employer ON blacklist(employer_id)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_opinion_alerts_status ON opinion_alerts(status)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_job_review_logs_job ON job_review_logs(job_id)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_job_review_logs_reviewer ON job_review_logs(reviewer_id)
  `);

  seedDemoData(db);

  return db;
}

function seedDemoData(db) {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  if (count > 0) return;

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const insertUser = db.prepare(
    'INSERT INTO users (username, phone, password_hash, role, nickname, identity_tags, skill_certs, employer_type, employer_name, business_license, university_name) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  );

  const demoAccounts = [
    { username: 'admin', phone: '13800000000', password: 'admin123', role: 'admin', nickname: '超级管理员', identity_tags: '[]', skill_certs: '[]', employer_type: '', employer_name: '', business_license: '', university_name: '' },
    { username: 'platform', phone: '13800000001', password: 'platform123', role: 'platform', nickname: '平台运营', identity_tags: '[]', skill_certs: '[]', employer_type: '', employer_name: '', business_license: '', university_name: '' },
    { username: 'ops', phone: '13800000002', password: 'ops123', role: 'ops', nickname: '运营管理', identity_tags: '[]', skill_certs: '[]', employer_type: '', employer_name: '', business_license: '', university_name: '' },
    { username: 'worker', phone: '13800000003', password: 'worker123', role: 'worker', nickname: '张同学', identity_tags: '["学生"]', skill_certs: '["服务员","收银员"]', employer_type: '', employer_name: '', business_license: '', university_name: '' },
    { username: 'employer', phone: '13800000004', password: 'employer123', role: 'employer', nickname: '星巴克朝阳门店', identity_tags: '[]', skill_certs: '[]', employer_type: '连锁门店', employer_name: '星巴克朝阳门店', business_license: '91110000MA01ABCDEF', university_name: '' },
    { username: 'university', phone: '13800000005', password: 'university123', role: 'university', nickname: '北京大学就业办', identity_tags: '[]', skill_certs: '[]', employer_type: '', employer_name: '', business_license: '', university_name: '北京大学' },
  ];

  for (const a of demoAccounts) {
    insertUser.run(a.username, a.phone, hash(a.password), a.role, a.nickname, a.identity_tags, a.skill_certs, a.employer_type, a.employer_name, a.business_license, a.university_name);
  }

  db.prepare("INSERT INTO university_partners (university_name, contact_name, contact_phone, employment_office_code) VALUES (?,?,?,?)")
    .run('北京大学', '李老师', '010-62751234', 'PKU-EMP-001');
  db.prepare("INSERT INTO university_partners (university_name, contact_name, contact_phone, employment_office_code) VALUES (?,?,?,?)")
    .run('清华大学', '王老师', '010-62771111', 'THU-EMP-002');

  db.prepare(
    'INSERT INTO users (username, phone, password_hash, role, nickname, identity_tags, skill_certs, credit_score) VALUES (?,?,?,?,?,?,?,?)'
  ).run('sworker1', '13900000011', hash('test123'), 'worker', '李同学', '["学生"]', '["服务员","促销员"]', 95);
  db.prepare(
    'INSERT INTO users (username, phone, password_hash, role, nickname, identity_tags, skill_certs, credit_score) VALUES (?,?,?,?,?,?,?,?)'
  ).run('sworker2', '13900000012', hash('test123'), 'worker', '王宝妈', '["宝妈"]', '["收银员","理货员"]', 88);
  db.prepare(
    'INSERT INTO users (username, phone, password_hash, role, nickname, identity_tags, skill_certs, credit_score) VALUES (?,?,?,?,?,?,?,?)'
  ).run('sworker3', '13900000013', hash('test123'), 'worker', '赵自由', '["自由职业者"]', '["活动执行","配送员"]', 92);

  db.prepare(
    'INSERT INTO jobs (employer_id, title, description, category, pay_type, pay_amount, pay_unit, location, lat, lng, safety_level, status, review_ocr_status, review_ocr_result, review_site_status, review_site_photos, required_skills, required_count, work_start, work_end) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
  ).run(5, '周末咖啡店服务员', '周末兼职，负责点单、收银和简单饮品制作，提供培训', '餐饮服务', 'daily', 150, '元/天', '北京市朝阳区建国路88号', 39.9087, 116.3975, 2, 'approved', 'passed', '营业执照编号：91110000MA01ABCDEF，核验通过', 'passed', '["照片1.jpg","照片2.jpg"]', '["服务员","收银"]', 3, '2026-06-06 09:00', '2026-06-06 18:00');

  db.prepare(
    'INSERT INTO jobs (employer_id, title, description, category, pay_type, pay_amount, pay_unit, location, lat, lng, safety_level, status, review_ocr_status, review_ocr_result, review_site_status, review_site_photos, required_skills, required_count, work_start, work_end) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
  ).run(5, '线上客服兼职', '居家办公，处理客户咨询和售后问题', '客服', 'online', 120, '元/天', '线上', 0, 0, 1, 'approved', 'passed', '营业执照编号：91110000MA01ABCDEF，核验通过', 'pending', '[]', '["客服","沟通"]', 5, '2026-06-01 09:00', '2026-06-30 18:00');

  db.prepare(
    'INSERT INTO jobs (employer_id, title, description, category, pay_type, pay_amount, pay_unit, location, lat, lng, safety_level, status, review_ocr_status, review_ocr_result, review_site_status, review_site_photos, required_skills, required_count, work_start, work_end) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
  ).run(5, '活动执行助理', '协助活动搭建和现场执行，需体力好', '活动执行', 'project', 500, '元/项目', '北京市海淀区中关村', 39.9842, 116.3074, 2, 'approved', 'passed', '营业执照已认证，经营范围含会展服务', 'passed', '["场地1.jpg","场地2.jpg","场地3.jpg"]', '["活动执行","体力劳动"]', 2, '2026-06-10 08:00', '2026-06-12 20:00');

  db.prepare(
    'INSERT INTO jobs (employer_id, title, description, category, pay_type, pay_amount, pay_unit, location, lat, lng, safety_level, status, review_ocr_status, review_ocr_result, review_site_status, review_site_photos, required_skills, required_count, work_start, work_end) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
  ).run(5, '高薪打字员（需预付押金）', '日结300元，手机打字即可，预付押金200元', '其他', 'daily', 300, '元/天', '线上', 0, 0, 3, 'pending_review', 'pending', '[]', 'pending', '[]', '[]', 10, '2026-06-15 00:00', '2026-07-15 23:59');

  db.prepare('INSERT INTO job_applications (job_id, worker_id, status, cover_letter) VALUES (?,?,?,?)')
    .run(1, 7, 'applied', '我是一名大学生，课余时间充足，有一年咖啡店兼职经验');
  db.prepare('INSERT INTO job_applications (job_id, worker_id, status, cover_letter) VALUES (?,?,?,?)')
    .run(1, 8, 'accepted', '我是全职宝妈，孩子上学后有大量空闲时间');
  db.prepare('INSERT INTO job_applications (job_id, worker_id, status, cover_letter) VALUES (?,?,?,?)')
    .run(1, 9, 'applied', '自由职业者，有丰富的活动执行经验');
  db.prepare('INSERT INTO job_applications (job_id, worker_id, status, cover_letter) VALUES (?,?,?,?)')
    .run(3, 7, 'applied', '有活动执行经验，能适应加班');

  db.prepare('INSERT INTO job_review_logs (job_id, reviewer_id, review_type, old_status, new_status, result) VALUES (?,?,?,?,?,?)')
    .run(1, 1, 'ocr', 'pending', 'passed', '营业执照编号：91110000MA01ABCDEF，核验通过');
  db.prepare('INSERT INTO job_review_logs (job_id, reviewer_id, review_type, old_status, new_status, result) VALUES (?,?,?,?,?,?)')
    .run(1, 1, 'site', 'pending', 'passed', '已上传3张实地核验照片，地址与营业执照一致');
  db.prepare('INSERT INTO job_review_logs (job_id, reviewer_id, review_type, old_status, new_status, result) VALUES (?,?,?,?,?,?)')
    .run(3, 1, 'ocr', 'pending', 'passed', '营业执照已认证，经营范围含会展服务');
  db.prepare('INSERT INTO job_review_logs (job_id, reviewer_id, review_type, old_status, new_status, result) VALUES (?,?,?,?,?,?)')
    .run(3, 1, 'site', 'pending', 'passed', '已上传3张活动场地照片，核验通过');

  db.prepare('INSERT INTO risk_reports (reporter_id, target_employer_id, job_id, report_type, description, location, lat, lng, status) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(7, 5, 4, '虚假高薪', '该岗位要求预付押金，疑似诈骗。300元/天明显高于市场价', '线上', 0, 0, 'verified');
  db.prepare('INSERT INTO risk_reports (reporter_id, target_employer_id, report_type, description, location, lat, lng, status) VALUES (?,?,?,?,?,?,?,?)')
    .run(8, 5, '诱导性招聘', '要求先交培训费才能安排工作，符合诈骗特征', '线上', 0, 0, 'pending');
  db.prepare('INSERT INTO risk_reports (reporter_id, target_employer_id, report_type, description, location, lat, lng, status) VALUES (?,?,?,?,?,?,?,?)')
    .run(9, 5, '克扣工资', '上个月工资结算时少发了50元，雇主态度恶劣', '北京市朝阳区建国路88号', 39.9087, 116.3975, 'pending');

  db.prepare('INSERT INTO blacklist (employer_id, reason, reported_count) VALUES (?,?,?)')
    .run(5, '多次被举报存在虚假招聘行为，岗位要求预付押金，经核实确认存在欺诈嫌疑', 3);

  db.prepare('INSERT INTO opinion_alerts (job_id, alert_type, content_snippet, risk_score, status) VALUES (?,?,?,?,?)')
    .run(4, '虚假高薪', '日入300元手机打字，无需审核轻松赚钱，预付押金200元', 85, 'pending');
  db.prepare('INSERT INTO opinion_alerts (job_id, alert_type, content_snippet, risk_score, status) VALUES (?,?,?,?,?)')
    .run(4, '诱导性招聘', '先交培训费再安排工作，保证金200元', 92, 'pending');
  db.prepare('INSERT INTO opinion_alerts (job_id, alert_type, content_snippet, risk_score, status) VALUES (?,?,?,?,?)')
    .run(null, '诱导性招聘', '无要求高回报，轻松兼职月入过万', 78, 'pending');

  console.log('Demo data seeded: 9 users, 2 university partners, 4 jobs, 4 applications, 4 review logs, 3 risk reports, 1 blacklist, 3 opinion alerts');
}
