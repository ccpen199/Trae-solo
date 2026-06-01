const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      business_license TEXT,
      legal_person_id TEXT,
      corporate_account TEXT,
      auth_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'hr',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      salary_min INTEGER,
      salary_max INTEGER,
      location TEXT,
      department TEXT,
      status TEXT DEFAULT 'draft',
      compliance_score INTEGER,
      diagnosis_result TEXT,
      published_at DATETIME,
      published_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (published_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      resume_text TEXT,
      tech_stack TEXT,
      project_experience TEXT,
      resignation_reason TEXT,
      job_activity TEXT,
      vector_embedding TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS candidate_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER,
      tag_category TEXT NOT NULL,
      tag_value TEXT NOT NULL,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS candidate_behavior (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER,
      job_id INTEGER,
      action TEXT NOT NULL,
      action_count INTEGER DEFAULT 1,
      last_action_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );

    CREATE TABLE IF NOT EXISTS invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER,
      job_id INTEGER,
      channel TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      message TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );

    CREATE TABLE IF NOT EXISTS recruitment_channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      name TEXT NOT NULL,
      cost_per_candidate DECIMAL(10,2),
      total_spent DECIMAL(10,2) DEFAULT 0,
      total_candidates INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      candidate_id INTEGER,
      job_id INTEGER,
      channel_id INTEGER,
      status TEXT DEFAULT 'scheduled',
      passed BOOLEAN DEFAULT 0,
      hired BOOLEAN DEFAULT 0,
      retention_30d BOOLEAN,
      interviewer_id INTEGER,
      scheduled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (candidate_id) REFERENCES candidates(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (channel_id) REFERENCES recruitment_channels(id),
      FOREIGN KEY (interviewer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS hris_integrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      provider TEXT NOT NULL,
      api_key TEXT,
      api_url TEXT,
      sync_status TEXT DEFAULT 'disconnected',
      last_sync_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE INDEX IF NOT EXISTS idx_candidates_company ON candidates(company_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
    CREATE INDEX IF NOT EXISTS idx_candidate_tags_candidate ON candidate_tags(candidate_id);
    CREATE INDEX IF NOT EXISTS idx_candidate_behavior_candidate ON candidate_behavior(candidate_id);
    CREATE INDEX IF NOT EXISTS idx_interviews_company ON interviews(company_id);
  `);

  const stmt = db.prepare('SELECT COUNT(*) as count FROM jobs');
  const result = stmt.get();
  if (result.count === 0) {
    seedData();
  }
}

function seedData() {
  const companyId = 1;

  db.prepare('INSERT OR IGNORE INTO companies (id, name, auth_status) VALUES (?, ?, ?)').run(companyId, '演示科技有限公司', 'approved');
  db.prepare('INSERT OR IGNORE INTO users (id, company_id, email, password, role) VALUES (?, ?, ?, ?, ?)').run(1, companyId, 'admin@demo.com', 'admin123', 'admin');
  db.prepare('INSERT OR IGNORE INTO users (id, company_id, email, password, role) VALUES (?, ?, ?, ?, ?)').run(2, companyId, 'hr@demo.com', 'hr123', 'hr');

  const channels = [
    { name: 'BOSS直聘', cost: 150, spent: 45000, candidates: 300 },
    { name: '猎聘', cost: 350, spent: 52500, candidates: 150 },
    { name: '拉勾', cost: 200, spent: 24000, candidates: 120 },
    { name: '内推渠道', cost: 500, spent: 30000, candidates: 60 },
    { name: '智联招聘', cost: 100, spent: 15000, candidates: 150 }
  ];

  const insertChannel = db.prepare('INSERT INTO recruitment_channels (company_id, name, cost_per_candidate, total_spent, total_candidates) VALUES (?, ?, ?, ?, ?)');
  channels.forEach(ch => {
    insertChannel.run(companyId, ch.name, ch.cost, ch.spent, ch.candidates);
  });

  const jobs = [
    { title: '高级前端开发工程师', desc: '岗位职责：\n1. 负责公司核心产品的前端架构设计和开发\n2. 参与技术方案评审，推动前端工程化建设\n3. 优化前端性能，提升用户体验\n4. 指导初级工程师，推动团队技术成长\n\n任职要求：\n1. 5年以上前端开发经验\n2. 精通React/Vue框架，熟悉TypeScript\n3. 熟悉前端工程化工具链（Webpack/Vite）\n4. 有大型项目架构经验优先\n\n技能要求：React、TypeScript、Node.js\n\n公司福利：五险一金、年终奖、带薪年假、股票期权、弹性工作', min: 25000, max: 40000, loc: '北京', dept: '技术部', status: 'published', score: 85 },
    { title: '资深Java后端开发工程师', desc: '岗位职责：\n1. 负责后端微服务架构设计与开发\n2. 参与系统性能优化和技术难点攻关\n3. 编写技术文档，参与代码评审\n\n任职要求：\n1. 5年以上Java开发经验\n2. 精通Spring Boot/Spring Cloud\n3. 熟悉MySQL、Redis、Kafka\n4. 有分布式系统开发经验\n\n技能要求：Java、Spring Boot、MySQL\n\n公司福利：五险一金、年终奖、带薪年假', min: 28000, max: 45000, loc: '上海', dept: '技术部', status: 'published', score: 82 },
    { title: '产品经理', desc: '岗位职责：\n1. 负责产品规划、需求分析和原型设计\n2. 协调研发、设计团队推进产品迭代\n3. 数据驱动的产品决策和效果评估\n\n任职要求：\n1. 3年以上产品经理经验\n2. 熟悉敏捷开发流程\n3. 有B端产品经验优先\n4. 良好的数据分析能力\n\n公司福利：五险一金、年终奖、弹性工作', min: 20000, max: 35000, loc: '杭州', dept: '产品部', status: 'published', score: 78 },
    { title: '数据分析师', desc: '岗位职责：\n1. 负责业务数据分析和报表制作\n2. 搭建数据指标体系，输出分析报告\n3. 支持业务决策的数据洞察\n\n任职要求：\n1. 2年以上数据分析经验\n2. 精通SQL和Python/R\n3. 熟悉Tableau/PowerBI\n4. 有互联网行业经验优先\n\n公司福利：五险一金、年终奖', min: 15000, max: 25000, loc: '深圳', dept: '数据部', status: 'reviewed', score: 72 },
    { title: 'UI设计师', desc: '岗位职责：\n1. 负责产品UI设计和交互优化\n2. 建立和维护设计规范\n3. 与产品、研发紧密协作\n\n任职要求：\n1. 3年以上UI设计经验\n2. 精通Figma/Sketch\n3. 有设计系统搭建经验\n4. 优秀的审美和设计品味', min: 18000, max: 30000, loc: '北京', dept: '设计部', status: 'draft', score: 55 },
    { title: 'DevOps工程师', desc: '岗位职责：\n1. 负责CI/CD流水线建设和维护\n2. 容器化部署和Kubernetes运维\n3. 监控告警体系建设\n\n任职要求：\n1. 3年以上DevOps经验\n2. 精通Docker/K8s\n3. 熟悉Jenkins/GitLab CI\n4. 有云平台运维经验\n\n公司福利：五险一金、年终奖、股票期权', min: 22000, max: 38000, loc: '上海', dept: '运维部', status: 'published', score: 80 }
  ];

  const insertJob = db.prepare('INSERT INTO jobs (company_id, title, description, salary_min, salary_max, location, department, status, compliance_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  jobs.forEach(j => {
    insertJob.run(companyId, j.title, j.desc, j.min, j.max, j.loc, j.dept, j.status, j.score);
  });

  const candidates = [
    { name: '张明', email: 'zhangming@email.com', phone: '13800001001', resume: '5年前端开发经验，曾参与多个大型互联网项目。精通React、Vue、TypeScript，有微前端架构经验。', tech: 'React, TypeScript, Webpack, Node.js, CSS', project: '电商平台重构、企业管理系统、数据可视化平台', reason: 'career_development', activity: 'active' },
    { name: '李雪', email: 'lixue@email.com', phone: '13800001002', resume: '4年Java后端开发经验，熟悉微服务架构。有高并发系统设计经验，参与过双十一保障。', tech: 'Java, Spring Boot, MySQL, Redis, Kafka', project: '支付系统、订单服务、用户中心', reason: 'salary', activity: 'active' },
    { name: '王磊', email: 'wanglei@email.com', phone: '13800001003', resume: '6年全栈开发经验，前后端均有深度实践。擅长架构设计和技术选型。', tech: 'React, Node.js, Python, PostgreSQL, Docker', project: 'SaaS平台、智能客服系统、运维监控平台', reason: 'team', activity: 'active' },
    { name: '陈晓琳', email: 'chenxiaolin@email.com', phone: '13800001004', resume: '3年产品经理经验，主导过B端SaaS产品0-1建设。数据驱动决策，擅长需求拆解。', tech: 'Axure, Figma, SQL, Python, Tableau', project: 'HR SaaS平台、CRM系统、数据中台', reason: 'career_development', activity: 'active' },
    { name: '赵宇', email: 'zhaoyu@email.com', phone: '13800001005', resume: '4年数据分析经验，精通SQL和Python数据科学工具链。有AB测试和用户增长分析经验。', tech: 'Python, SQL, R, Tableau, Spark', project: '用户增长分析、推荐算法优化、商业智能报表', reason: 'location', activity: 'passive' },
    { name: '孙婷', email: 'sunting@email.com', phone: '13800001006', resume: '5年UI/UX设计经验，有设计系统搭建经验。擅长B端产品设计和用户体验优化。', tech: 'Figma, Sketch, Principle, CSS, HTML', project: '设计系统、B端SaaS、移动端App', reason: 'career_development', activity: 'active' },
    { name: '刘浩然', email: 'liuhaoran@email.com', phone: '13800001007', resume: '3年DevOps经验，精通容器化和CI/CD。有大规模K8s集群运维经验。', tech: 'Docker, Kubernetes, Jenkins, AWS, Terraform', project: '容器化改造、CI/CD流水线、监控告警体系', reason: 'salary', activity: 'active' },
    { name: '周思雨', email: 'zhousiyu@email.com', phone: '13800001008', resume: '2年前端开发经验，React技术栈为主。有小程序开发经验，对性能优化有深入研究。', tech: 'React, Vue, 小程序, TypeScript, Sass', project: '小程序商城、H5营销页、组件库', reason: 'career_development', activity: 'active' },
    { name: '吴佳琪', email: 'wujiaqi@email.com', phone: '13800001009', resume: '7年后端架构经验，专注分布式系统设计。有技术团队管理经验。', tech: 'Java, Go, MySQL, Redis, Elasticsearch', project: '分布式消息队列、搜索引擎、技术中台', reason: 'team', activity: 'passive' },
    { name: '郑伟', email: 'zhengwei@email.com', phone: '13800001010', resume: '3年测试开发经验，擅长自动化测试框架搭建和持续集成。', tech: 'Selenium, Cypress, Python, Jenkins, JMeter', project: '自动化测试框架、性能测试平台、质量看板', reason: 'layoff', activity: 'active' }
  ];

  const candidateTags = [
    [{ category: 'tech', value: 'React' }, { category: 'tech', value: 'TypeScript' }, { category: 'project', value: '电商平台' }, { category: 'activity', value: '活跃' }],
    [{ category: 'tech', value: 'Java' }, { category: 'tech', value: 'Spring Boot' }, { category: 'project', value: '支付系统' }, { category: 'reason', value: '薪资' }],
    [{ category: 'tech', value: '全栈' }, { category: 'tech', value: 'Node.js' }, { category: 'project', value: 'SaaS平台' }, { category: 'activity', value: '活跃' }],
    [{ category: 'tech', value: '产品设计' }, { category: 'tech', value: 'SQL' }, { category: 'project', value: 'HR SaaS' }, { category: 'reason', value: '职业发展' }],
    [{ category: 'tech', value: 'Python' }, { category: 'tech', value: 'SQL' }, { category: 'project', value: '数据分析' }, { category: 'activity', value: '待激活' }],
    [{ category: 'tech', value: 'Figma' }, { category: 'project', value: '设计系统' }, { category: 'reason', value: '职业发展' }, { category: 'activity', value: '活跃' }],
    [{ category: 'tech', value: 'Docker' }, { category: 'tech', value: 'K8s' }, { category: 'project', value: 'DevOps' }, { category: 'reason', value: '薪资' }],
    [{ category: 'tech', value: 'React' }, { category: 'project', value: '小程序' }, { category: 'activity', value: '活跃' }, { category: 'reason', value: '职业发展' }],
    [{ category: 'tech', value: 'Java' }, { category: 'tech', value: 'Go' }, { category: 'project', value: '技术中台' }, { category: 'activity', value: '待激活' }],
    [{ category: 'tech', value: '自动化测试' }, { category: 'project', value: '测试框架' }, { category: 'reason', value: '裁员' }, { category: 'activity', value: '活跃' }]
  ];

  const insertCandidate = db.prepare('INSERT INTO candidates (company_id, name, email, phone, resume_text, tech_stack, project_experience, resignation_reason, job_activity, vector_embedding) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertTag = db.prepare('INSERT INTO candidate_tags (candidate_id, tag_category, tag_value) VALUES (?, ?, ?)');

  const { generateSimpleEmbedding } = require('./services/talentPool');

  candidates.forEach((c, idx) => {
    const embeddingText = [c.resume, c.tech, c.project].filter(Boolean).join(' ');
    const embedding = JSON.stringify(generateSimpleEmbedding(embeddingText));
    const result = insertCandidate.run(companyId, c.name, c.email, c.phone, c.resume, c.tech, c.project, c.reason, c.activity, embedding);
    const candidateId = result.lastInsertRowid;
    candidateTags[idx].forEach(tag => {
      insertTag.run(candidateId, tag.category, tag.value);
    });
  });

  const behaviors = [
    { candidate: 1, job: 1, action: 'view_job', count: 8 },
    { candidate: 1, job: 2, action: 'view_job', count: 3 },
    { candidate: 2, job: 2, action: 'view_job', count: 6 },
    { candidate: 2, job: 1, action: 'view_job', count: 2 },
    { candidate: 3, job: 1, action: 'view_job', count: 5 },
    { candidate: 3, job: 6, action: 'view_job', count: 4 },
    { candidate: 4, job: 3, action: 'view_job', count: 7 },
    { candidate: 5, job: 4, action: 'view_job', count: 9 },
    { candidate: 6, job: 5, action: 'view_job', count: 2 },
    { candidate: 7, job: 6, action: 'view_job', count: 10 },
    { candidate: 8, job: 1, action: 'view_job', count: 4 },
    { candidate: 9, job: 2, action: 'view_job', count: 1 },
    { candidate: 10, job: 1, action: 'view_job', count: 3 }
  ];

  const insertBehavior = db.prepare('INSERT INTO candidate_behavior (candidate_id, job_id, action, action_count) VALUES (?, ?, ?, ?)');
  behaviors.forEach(b => {
    insertBehavior.run(b.candidate, b.job, b.action, b.count);
  });

  const invitationsData = [
    { candidate: 1, job: 1, channel: 'phone', status: 'sent' },
    { candidate: 2, job: 2, channel: 'sms', status: 'sent' },
    { candidate: 3, job: 1, channel: 'email', status: 'sent' },
    { candidate: 4, job: 3, channel: 'in_app', status: 'sent' },
    { candidate: 5, job: 4, channel: 'phone', status: 'sent' },
    { candidate: 7, job: 6, channel: 'phone', status: 'sent' },
    { candidate: 8, job: 1, channel: 'email', status: 'sent' }
  ];

  const insertInvitation = db.prepare('INSERT INTO invitations (candidate_id, job_id, channel, status, message) VALUES (?, ?, ?, ?, ?)');
  invitationsData.forEach(inv => {
    insertInvitation.run(inv.candidate, inv.job, inv.channel, inv.status, '您好，我们对您的简历非常感兴趣，诚邀您参加面试。');
  });

  const interviewsData = [
    { candidate: 1, job: 1, channel: 1, status: 'completed', passed: 1, hired: 1, retention: 1, interviewer: 1 },
    { candidate: 2, job: 2, channel: 2, status: 'completed', passed: 1, hired: 1, retention: 1, interviewer: 2 },
    { candidate: 3, job: 1, channel: 1, status: 'completed', passed: 1, hired: 0, retention: null, interviewer: 1 },
    { candidate: 4, job: 3, channel: 4, status: 'completed', passed: 1, hired: 1, retention: 0, interviewer: 2 },
    { candidate: 5, job: 4, channel: 3, status: 'completed', passed: 0, hired: 0, retention: null, interviewer: 1 },
    { candidate: 7, job: 6, channel: 1, status: 'completed', passed: 1, hired: 1, retention: 1, interviewer: 2 },
    { candidate: 8, job: 1, channel: 5, status: 'scheduled', passed: 0, hired: 0, retention: null, interviewer: 1 },
    { candidate: 10, job: 1, channel: 1, status: 'completed', passed: 0, hired: 0, retention: null, interviewer: 2 }
  ];

  const insertInterview = db.prepare('INSERT INTO interviews (company_id, candidate_id, job_id, channel_id, status, passed, hired, retention_30d, interviewer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  interviewsData.forEach(i => {
    insertInterview.run(companyId, i.candidate, i.job, i.channel, i.status, i.passed, i.hired, i.retention, i.interviewer);
  });

  console.log('Database seeded with demo data successfully.');
}

module.exports = { db, initDatabase };
