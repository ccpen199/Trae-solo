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

  const { v4: uuidv4 } = require('uuid');
  const bcrypt = require('bcryptjs');
  let demoTenant = db.prepare('SELECT id FROM tenants WHERE name = ? LIMIT 1').get('示范企业') as any;
  if (!demoTenant) {
    const tenantId = uuidv4();
    db.prepare('INSERT INTO tenants (id, name, industry) VALUES (?, ?, ?)').run(tenantId, '示范企业', '科技');
    demoTenant = { id: tenantId };
  }

  const hashedPwd = bcrypt.hashSync('123456', 10);
  const demoUsers = [
    ['admin', 'admin@demo.com', '系统管理员', 'admin'],
    ['hr01', 'hr@demo.com', '张HR', 'hr'],
    ['trainer01', 'trainer@demo.com', '李培训师', 'trainer'],
    ['seeker01', 'seeker@demo.com', '王求职者', 'jobseeker'],
  ];
  const insertUser = db.prepare('INSERT INTO users (id, tenant_id, username, email, password, name, role) VALUES (?, ?, ?, ?, ?, ?, ?)');
  demoUsers.forEach(([username, email, name, role]) => {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as any;
    if (!existing) {
      insertUser.run(uuidv4(), demoTenant.id, username, email, hashedPwd, name, role);
    }
  });

  // 每次启动重置测试账号角色，确保演示数据一致
  const resetTestAccounts = [
    ['admin', 'admin'],
    ['hr01', 'hr'],
    ['trainer01', 'trainer'],
    ['seeker01', 'jobseeker'],
  ];
  const updateRoleStmt = db.prepare('UPDATE users SET role = ? WHERE username = ?');
  resetTestAccounts.forEach(([username, role]) => {
    updateRoleStmt.run(role, username);
  });

  // 业务种子数据：岗位、简历、课程、申请、通知、社区话题等
  const tenant = db.prepare('SELECT id FROM tenants LIMIT 1').get() as any;
  const hrUser = db.prepare('SELECT id FROM users WHERE username = ?').get('hr01') as any;
  const seekerUser = db.prepare('SELECT id FROM users WHERE username = ?').get('seeker01') as any;
  const trainerUser = db.prepare('SELECT id FROM users WHERE username = ?').get('trainer01') as any;
  const tid = tenant?.id;
  const hrId = hrUser?.id;
  const seekerId = seekerUser?.id;
  const trainerId = trainerUser?.id;

  if (!tid || !hrId || !seekerId || !trainerId) {
    throw new Error('Demo tenant or required demo users were not initialized');
  }

  const jobsData = [
    { title: '高级前端工程师', department: '技术部', location: '北京', industry: '科技', salary_min: 25, salary_max: 45, experience_level: '3-5年', education_level: '本科', skills: ['React', 'TypeScript', 'Node.js'], requirements: ['3年以上React开发经验', '熟悉TypeScript', '有大型项目架构经验'], description: '负责公司核心产品的前端架构设计和开发，参与技术选型和代码评审。' },
    { title: 'Python后端开发', department: '技术部', location: '上海', industry: '科技', salary_min: 20, salary_max: 40, experience_level: '1-3年', education_level: '本科', skills: ['Python', 'MySQL', 'Redis'], requirements: ['2年以上Python开发经验', '熟悉Django或Flask', '了解微服务架构'], description: '负责后端API开发、数据库设计和性能优化。' },
    { title: '产品经理', department: '产品部', location: '深圳', industry: '科技', salary_min: 22, salary_max: 38, experience_level: '3-5年', education_level: '本科', skills: ['产品设计', '数据分析', 'Agile'], requirements: ['3年以上产品经理经验', '有B端产品经验优先', '良好的数据分析能力'], description: '负责产品规划、需求分析和项目推进。' },
    { title: 'UI/UX设计师', department: '设计部', location: '杭州', industry: '科技', salary_min: 18, salary_max: 35, experience_level: '1-3年', education_level: '本科', skills: ['UI设计', 'Figma', '产品设计'], requirements: ['2年以上UI设计经验', '熟练使用Figma', '有移动端设计经验'], description: '负责产品界面设计和用户体验优化。' },
    { title: '数据分析师', department: '数据部', location: '北京', industry: '金融', salary_min: 20, salary_max: 35, experience_level: '1-3年', education_level: '硕士', skills: ['数据分析', 'Python', '机器学习'], requirements: ['统计学或数学背景', '熟练使用SQL和Python', '有数据建模经验'], description: '负责业务数据分析和建模，为决策提供数据支持。' },
    { title: 'DevOps工程师', department: '运维部', location: '上海', industry: '科技', salary_min: 25, salary_max: 45, experience_level: '3-5年', education_level: '本科', skills: ['Docker', 'Kubernetes', 'AWS'], requirements: ['3年以上运维经验', '熟悉CI/CD流程', '有云原生实践经验'], description: '负责基础设施自动化、CI/CD流水线和容器编排。' },
    { title: 'HR招聘专员', department: '人力资源部', location: '广州', industry: '科技', salary_min: 10, salary_max: 18, experience_level: '1-3年', education_level: '本科', skills: ['招聘管理', '人力资源'], requirements: ['1年以上招聘经验', '良好的沟通能力', '熟悉各类招聘渠道'], description: '负责人才招聘、简历筛选和面试安排。' },
    { title: '企业培训讲师', department: '培训部', location: '深圳', industry: '教育', salary_min: 15, salary_max: 30, experience_level: '3-5年', education_level: '本科', skills: ['企业培训', '项目管理'], requirements: ['3年以上培训经验', '有课程开发能力', '良好的表达能力'], description: '负责企业内训课程的设计与讲授。' },
  ];
  const insertJob = db.prepare(`INSERT INTO jobs (id, tenant_id, hr_id, title, department, description, requirements, skills, location, salary_min, salary_max, experience_level, education_level, industry, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  jobsData.forEach(j => {
    const existing = db.prepare('SELECT id FROM jobs WHERE title = ? LIMIT 1').get(j.title);
    if (!existing) {
      insertJob.run(uuidv4(), tid, hrId, j.title, j.department, j.description, JSON.stringify(j.requirements), JSON.stringify(j.skills), j.location, j.salary_min, j.salary_max, j.experience_level, j.education_level, j.industry, 'open');
    }
  });

  const resumesData = [
    { title: '前端开发工程师', summary: '5年前端开发经验，精通React和TypeScript，有大型项目架构经验。', experience: 5, education: '本科 - 计算机科学', skills: ['React', 'TypeScript', 'JavaScript', 'Vue.js', 'Node.js'], certifications: ['AWS认证开发者'], projects: ['电商中台前端重构', '数据可视化平台'], workHistory: ['某大厂前端负责人', '某创业公司前端开发'] },
    { title: 'Python全栈工程师', summary: '3年Python开发经验，熟悉Django和Flask，有微服务架构实践经验。', experience: 3, education: '硕士 - 软件工程', skills: ['Python', 'MySQL', 'Redis', 'Docker', 'MongoDB'], certifications: [], projects: ['微服务API网关', '智能推荐系统'], workHistory: ['某互联网公司后端开发'] },
    { title: '产品经理', summary: '4年B端产品经验，擅长数据驱动的产品决策和敏捷项目管理。', experience: 4, education: '本科 - 工商管理', skills: ['产品设计', '数据分析', 'Agile', 'Scrum', '项目管理'], certifications: ['PMP认证'], projects: ['企业SaaS平台', '内部工具平台'], workHistory: ['某SaaS公司高级产品经理'] },
    { title: '数据分析师', summary: '2年数据分析经验，熟悉SQL和Python，有机器学习项目经验。', experience: 2, education: '硕士 - 统计学', skills: ['数据分析', 'Python', '机器学习', 'SQL', 'R'], certifications: [], projects: ['用户行为分析平台', '预测模型'], workHistory: ['某金融公司数据分析师'] },
  ];
  const insertResume = db.prepare(`INSERT INTO resumes (id, user_id, tenant_id, title, summary, experience, education, skills, certifications, projects, work_history, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  resumesData.forEach(r => {
    const existing = db.prepare('SELECT id FROM resumes WHERE title = ? LIMIT 1').get(r.title);
    if (!existing) {
      insertResume.run(uuidv4(), seekerId, tid, r.title, r.summary, r.experience, r.education, JSON.stringify(r.skills), JSON.stringify(r.certifications), JSON.stringify(r.projects), JSON.stringify(r.workHistory), 1);
    }
  });

  const coursesData = [
    { title: 'React 18 全栈开发实战', category: '前端开发', description: '从零到一掌握React 18新特性、Hooks、Suspense等核心技术', duration: 48, status: 'published' },
    { title: 'Python数据分析与机器学习', category: '数据科学', description: '系统学习Pandas、NumPy、Scikit-learn等数据科学工具', duration: 36, status: 'published' },
    { title: 'Docker与Kubernetes实战', category: 'DevOps', description: '容器化部署与编排的最佳实践', duration: 24, status: 'published' },
    { title: '企业级项目管理', category: '管理', description: 'PMP认证备考与敏捷项目管理实践', duration: 32, status: 'published' },
    { title: '产品经理核心能力提升', category: '产品', description: '需求分析、产品设计和数据驱动的完整方法论', duration: 20, status: 'published' },
    { title: 'TypeScript高级编程', category: '前端开发', description: '深入理解TypeScript类型系统和高级模式', duration: 28, status: 'draft' },
  ];
  const insertCourse = db.prepare(`INSERT INTO courses (id, tenant_id, trainer_id, title, description, category, duration, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  coursesData.forEach(c => {
    const existing = db.prepare('SELECT id FROM courses WHERE title = ? LIMIT 1').get(c.title);
    if (!existing) {
      insertCourse.run(uuidv4(), tid, trainerId, c.title, c.description, c.category, c.duration, c.status);
    }
  });

  const applicationCount = db.prepare('SELECT COUNT(*) as cnt FROM job_applications').get() as { cnt: number };
  if (applicationCount.cnt === 0) {
    const jobIds = db.prepare('SELECT id FROM jobs ORDER BY created_at ASC LIMIT 4').all() as Array<{ id: string }>;
    const resumeIds = db.prepare('SELECT id FROM resumes ORDER BY created_at ASC LIMIT 4').all() as Array<{ id: string }>;
    const insertApp = db.prepare('INSERT INTO job_applications (id, job_id, resume_id, applicant_id, tenant_id, match_score, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const statuses = ['pending', 'interviewed', 'pending', 'offered'];
    jobIds.forEach((job, index) => {
      const resume = resumeIds[index % resumeIds.length];
      if (resume) {
        insertApp.run(uuidv4(), job.id, resume.id, seekerId, tid, [0.92, 0.85, 0.78, 0.88][index] || 0.8, statuses[index] || 'pending');
      }
    });
  }

  const notificationCount = db.prepare('SELECT COUNT(*) as cnt FROM notifications').get() as { cnt: number };
  if (notificationCount.cnt === 0) {
    const insertNotif = db.prepare('INSERT INTO notifications (id, user_id, tenant_id, type, title, content, is_read) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertNotif.run(uuidv4(), seekerId, tid, 'application', '简历投递成功', '您已成功投递「高级前端工程师」岗位', 0);
    insertNotif.run(uuidv4(), seekerId, tid, 'match', '新的匹配推荐', '发现3个与您技能匹配的新岗位', 0);
    insertNotif.run(uuidv4(), seekerId, tid, 'course', '课程更新', '「React 18 全栈开发实战」已更新第8章内容', 0);
    insertNotif.run(uuidv4(), hrId, tid, 'application', '收到新简历', '王求职者投递了「高级前端工程师」岗位，匹配度92%', 0);
    insertNotif.run(uuidv4(), hrId, tid, 'lead', '新线索提醒', '来自精准推送的3个新候选人线索', 0);
    insertNotif.run(uuidv4(), trainerId, tid, 'course', '课程审核通过', '「Python数据分析与机器学习」已通过审核', 1);
  }

  const topicCount = db.prepare('SELECT COUNT(*) as cnt FROM community_topics').get() as { cnt: number };
  if (topicCount.cnt === 0) {
    const insertTopic = db.prepare('INSERT INTO community_topics (id, tenant_id, user_id, title, content, tags, status, views, likes, comments, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertTopic.run(uuidv4(), tid, seekerId, '前端面试高频题汇总（2026版）', '整理了最近面试中遇到的高频题目，包括React原理、TypeScript类型体操、手写题等...', '["面试", "前端", "React"]', 'approved', 328, 56, 12, 1);
    insertTopic.run(uuidv4(), tid, hrId, 'HR视角：什么样的简历更容易被选中', '作为HR，每天要浏览上百份简历。什么样的简历能脱颖而出？分享几个关键点...', '["简历", "求职", "HR"]', 'approved', 256, 43, 8, 1);
    insertTopic.run(uuidv4(), tid, trainerId, '2026年最值得学的5个技术方向', '基于行业趋势和招聘数据，分析了当前最热门的技术方向和薪资前景...', '["技术趋势", "职业发展"]', 'approved', 512, 89, 23, 1);
    insertTopic.run(uuidv4(), tid, seekerId, '转行做程序员一年后的真实感受', '从传统行业转行到互联网一年了，分享一下心路历程和经验教训...', '["转行", "程序员", "经验分享"]', 'approved', 189, 34, 15, 1);
  }

  const leadCount = db.prepare('SELECT COUNT(*) as cnt FROM leads').get() as { cnt: number };
  if (leadCount.cnt === 0) {
    const insertLead = db.prepare('INSERT INTO leads (id, tenant_id, owner_id, name, company, position, phone, email, industry, region, source, status, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertLead.run(uuidv4(), tid, hrId, '陈志远', '未来科技', '技术总监', '13800138001', 'chen@future.com', '科技', '北京', '官网', 'contacted', '["高管", "技术"]');
    insertLead.run(uuidv4(), tid, hrId, '刘美丽', '创新教育', 'HR经理', '13800138002', 'liu@innovation.com', '教育', '上海', '推荐', 'new', '["HR", "培训需求"]');
    insertLead.run(uuidv4(), tid, hrId, '张大海', '金融数据', 'CTO', '13800138003', 'zhang@findata.com', '金融', '深圳', '展会', 'qualified', '["CTO", "大规模招聘"]');
  }
}
