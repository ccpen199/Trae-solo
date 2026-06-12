import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      industry TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      tenant_id TEXT REFERENCES tenants(id),
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('jobseeker','hr','trainer','admin')),
      status TEXT DEFAULT 'active',
      points INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT REFERENCES tenants(id),
      user_id TEXT REFERENCES users(id),
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      details TEXT,
      ip TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      tenant_id TEXT REFERENCES tenants(id),
      title TEXT,
      summary TEXT,
      experience INTEGER DEFAULT 0,
      education TEXT,
      skills TEXT,
      certifications TEXT,
      projects TEXT,
      work_history TEXT,
      is_public INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT REFERENCES tenants(id),
      hr_id TEXT REFERENCES users(id),
      title TEXT NOT NULL,
      department TEXT,
      description TEXT,
      requirements TEXT,
      skills TEXT,
      location TEXT,
      salary_min INTEGER,
      salary_max INTEGER,
      experience_level TEXT,
      education_level TEXT,
      industry TEXT,
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skill_tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      category TEXT,
      parent_id TEXT REFERENCES skill_tags(id),
      weight REAL DEFAULT 1.0
    );

    CREATE TABLE IF NOT EXISTS job_applications (
      id TEXT PRIMARY KEY,
      job_id TEXT REFERENCES jobs(id),
      resume_id TEXT REFERENCES resumes(id),
      applicant_id TEXT REFERENCES users(id),
      tenant_id TEXT REFERENCES tenants(id),
      match_score REAL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS match_recommendations (
      id TEXT PRIMARY KEY,
      tenant_id TEXT REFERENCES tenants(id),
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      score REAL NOT NULL,
      confidence REAL NOT NULL,
      intent TEXT,
      reasons TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS community_topics (
      id TEXT PRIMARY KEY,
      tenant_id TEXT REFERENCES tenants(id),
      user_id TEXT REFERENCES users(id),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT,
      status TEXT DEFAULT 'pending',
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      is_approved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS community_comments (
      id TEXT PRIMARY KEY,
      topic_id TEXT REFERENCES community_topics(id),
      user_id TEXT REFERENCES users(id),
      content TEXT NOT NULL,
      parent_id TEXT REFERENCES community_comments(id),
      is_approved INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT REFERENCES tenants(id),
      user1_id TEXT REFERENCES users(id),
      user2_id TEXT REFERENCES users(id),
      last_message TEXT,
      last_message_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT REFERENCES chat_sessions(id),
      sender_id TEXT REFERENCES users(id),
      receiver_id TEXT REFERENCES users(id),
      type TEXT DEFAULT 'text',
      content TEXT NOT NULL,
      file_url TEXT,
      is_read INTEGER DEFAULT 0,
      is_blocked INTEGER DEFAULT 0,
      block_reason TEXT,
      quality_score REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      tenant_id TEXT REFERENCES tenants(id),
      owner_id TEXT REFERENCES users(id),
      name TEXT NOT NULL,
      company TEXT,
      position TEXT,
      phone TEXT,
      email TEXT,
      industry TEXT,
      region TEXT,
      source TEXT,
      status TEXT DEFAULT 'new',
      tags TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS push_records (
      id TEXT PRIMARY KEY,
      tenant_id TEXT REFERENCES tenants(id),
      job_id TEXT REFERENCES jobs(id),
      target_user_id TEXT REFERENCES users(id),
      content TEXT,
      channel TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS business_cards (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      tenant_id TEXT REFERENCES tenants(id),
      name TEXT,
      title TEXT,
      company TEXT,
      phone TEXT,
      email TEXT,
      wechat TEXT,
      avatar TEXT,
      share_code TEXT UNIQUE,
      views INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS card_share_traces (
      id TEXT PRIMARY KEY,
      card_id TEXT REFERENCES business_cards(id),
      sharer_id TEXT REFERENCES users(id),
      viewer_id TEXT,
      ip TEXT,
      is_conversion INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      tenant_id TEXT REFERENCES tenants(id),
      trainer_id TEXT REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      cover TEXT,
      duration INTEGER,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS course_lessons (
      id TEXT PRIMARY KEY,
      course_id TEXT REFERENCES courses(id),
      title TEXT NOT NULL,
      content TEXT,
      video_url TEXT,
      sort_order INTEGER DEFAULT 0,
      duration INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS learning_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      course_id TEXT REFERENCES courses(id),
      lesson_id TEXT REFERENCES course_lessons(id),
      progress REAL DEFAULT 0,
      completed INTEGER DEFAULT 0,
      last_study_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, course_id, lesson_id)
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      course_id TEXT REFERENCES courses(id),
      certificate_no TEXT UNIQUE,
      issued_at TEXT DEFAULT CURRENT_TIMESTAMP,
      score REAL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      tenant_id TEXT REFERENCES tenants(id),
      type TEXT,
      title TEXT NOT NULL,
      content TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      resource TEXT NOT NULL,
      action TEXT NOT NULL,
      UNIQUE(role, resource, action)
    );

    CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_jobs_tenant ON jobs(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_logs(tenant_id);
  `);

  const skillCount = db.prepare('SELECT COUNT(*) as cnt FROM skill_tags').get() as { cnt: number };
  if (skillCount.cnt === 0) {
    const insertSkill = db.prepare('INSERT INTO skill_tags (id, name, category, weight) VALUES (?, ?, ?, ?)');
    const skills = [
      ['JavaScript', '前端开发', 1.5], ['TypeScript', '前端开发', 1.4], ['React', '前端开发', 1.5],
      ['Vue.js', '前端开发', 1.4], ['Node.js', '后端开发', 1.4], ['Python', '后端开发', 1.5],
      ['Java', '后端开发', 1.4], ['Go', '后端开发', 1.3], ['MySQL', '数据库', 1.2],
      ['PostgreSQL', '数据库', 1.2], ['MongoDB', '数据库', 1.1], ['Redis', '缓存', 1.2],
      ['Docker', 'DevOps', 1.2], ['Kubernetes', 'DevOps', 1.3], ['AWS', '云计算', 1.2],
      ['Git', '版本控制', 1.0], ['Agile', '项目管理', 1.0], ['Scrum', '项目管理', 1.0],
      ['数据分析', '数据', 1.3], ['机器学习', 'AI', 1.4], ['项目管理', '管理', 1.2],
      ['产品设计', '产品', 1.2], ['UI设计', '设计', 1.2], ['人力资源', 'HR', 1.0],
      ['企业培训', '培训', 1.0], ['招聘管理', 'HR', 1.1]
    ];
    const { v4: uuidv4 } = require('uuid');
    skills.forEach(([name, category, weight]) => {
      insertSkill.run(uuidv4(), name, category, weight);
    });
  }

  const permCount = db.prepare('SELECT COUNT(*) as cnt FROM permissions').get() as { cnt: number };
  if (permCount.cnt === 0) {
    const insertPerm = db.prepare('INSERT INTO permissions (id, role, resource, action) VALUES (?, ?, ?, ?)');
    const { v4: uuidv4 } = require('uuid');
    const perms = [
      ['admin', '*', '*'],
      ['hr', 'job', '*'], ['hr', 'resume', 'read'], ['hr', 'application', '*'],
      ['hr', 'lead', '*'], ['hr', 'chat', '*'], ['hr', 'push', '*'],
      ['trainer', 'course', '*'], ['trainer', 'certificate', '*'], ['trainer', 'progress', 'read'],
      ['jobseeker', 'resume', '*'], ['jobseeker', 'job', 'read'], ['jobseeker', 'application', 'create'],
      ['jobseeker', 'community', '*'], ['jobseeker', 'chat', '*'], ['jobseeker', 'course', 'read']
    ];
    perms.forEach(([role, resource, action]) => {
      insertPerm.run(uuidv4(), role, resource, action);
    });
  }

  const tenantCount = db.prepare('SELECT COUNT(*) as cnt FROM tenants').get() as { cnt: number };
  if (tenantCount.cnt === 0) {
    const { v4: uuidv4 } = require('uuid');
    const bcrypt = require('bcryptjs');
    const tenantId = uuidv4();
    db.prepare('INSERT INTO tenants (id, name, industry) VALUES (?, ?, ?)').run(tenantId, '示范企业', '科技');
    
    const insertUser = db.prepare('INSERT INTO users (id, tenant_id, username, email, password, name, role) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const hashedPwd = bcrypt.hashSync('123456', 10);
    insertUser.run(uuidv4(), tenantId, 'admin', 'admin@demo.com', hashedPwd, '系统管理员', 'admin');
    insertUser.run(uuidv4(), tenantId, 'hr01', 'hr@demo.com', hashedPwd, '张HR', 'hr');
    insertUser.run(uuidv4(), tenantId, 'trainer01', 'trainer@demo.com', hashedPwd, '李培训师', 'trainer');
    insertUser.run(uuidv4(), tenantId, 'seeker01', 'seeker@demo.com', hashedPwd, '王求职者', 'jobseeker');
  }
}
