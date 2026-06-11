const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  unified_social_code TEXT UNIQUE,
  legal_person TEXT,
  registered_capital TEXT,
  establishment_date TEXT,
  business_scope TEXT,
  address TEXT,
  city TEXT,
  district TEXT,
  longitude REAL,
  latitude REAL,
  industry TEXT,
  company_size TEXT,
  logo TEXT,
  description TEXT,
  business_license TEXT,
  verification_status TEXT DEFAULT 'pending',
  credit_score INTEGER DEFAULT 75,
  compliance_score INTEGER DEFAULT 80,
  risk_level TEXT DEFAULT 'low',
  verified_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_credit_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  score_change INTEGER DEFAULT 0,
  description TEXT,
  evidence TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hr_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'hr',
  department TEXT,
  position TEXT,
  status TEXT DEFAULT 'active',
  last_login_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS competency_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jd_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER,
  name TEXT NOT NULL,
  category TEXT,
  content TEXT NOT NULL,
  is_system INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  hr_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  department TEXT,
  job_type TEXT NOT NULL,
  work_city TEXT NOT NULL,
  work_district TEXT,
  work_address TEXT,
  longitude REAL,
  latitude REAL,
  salary_min INTEGER NOT NULL,
  salary_max INTEGER NOT NULL,
  salary_negotiable INTEGER DEFAULT 0,
  salary_period TEXT DEFAULT 'month',
  education TEXT,
  experience TEXT,
  age_min INTEGER,
  age_max INTEGER,
  jd_content TEXT NOT NULL,
  jd_template_id INTEGER,
  competency_tags TEXT,
  benefits TEXT,
  channel TEXT DEFAULT 'direct',
  status TEXT DEFAULT 'draft',
  fraud_score INTEGER DEFAULT 0,
  fraud_status TEXT DEFAULT 'normal',
  fraud_reason TEXT,
  publish_time TEXT,
  expire_time TEXT,
  view_count INTEGER DEFAULT 0,
  apply_count INTEGER DEFAULT 0,
  hot_score INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (hr_id) REFERENCES hr_users(id) ON DELETE CASCADE,
  FOREIGN KEY (jd_template_id) REFERENCES jd_templates(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS job_view_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  viewer_ip TEXT,
  viewer_device TEXT,
  channel TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  gender TEXT,
  birthday TEXT,
  city TEXT,
  avatar TEXT,
  expected_salary_min INTEGER,
  expected_salary_max INTEGER,
  expected_city TEXT,
  expected_position TEXT,
  work_years INTEGER,
  highest_education TEXT,
  current_company TEXT,
  current_position TEXT,
  skill_tags TEXT,
  resume_score INTEGER DEFAULT 60,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resumes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_id INTEGER NOT NULL,
  file_name TEXT,
  file_path TEXT,
  file_type TEXT,
  parsed_content TEXT,
  skill_graph TEXT,
  work_experience TEXT,
  education TEXT,
  projects TEXT,
  certifications TEXT,
  languages TEXT,
  parsed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  candidate_id INTEGER NOT NULL,
  resume_id INTEGER,
  channel TEXT DEFAULT 'direct',
  match_score INTEGER DEFAULT 0,
  skill_match_score INTEGER DEFAULT 0,
  experience_match_score INTEGER DEFAULT 0,
  salary_match_score INTEGER DEFAULT 0,
  intention_score INTEGER DEFAULT 60,
  status TEXT DEFAULT 'pending',
  hr_remark TEXT,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL,
  UNIQUE(job_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  job_id INTEGER NOT NULL,
  candidate_id INTEGER NOT NULL,
  hr_id INTEGER NOT NULL,
  interview_type TEXT NOT NULL,
  interview_round INTEGER DEFAULT 1,
  schedule_time TEXT NOT NULL,
  duration INTEGER DEFAULT 30,
  room_id TEXT UNIQUE,
  room_password TEXT,
  status TEXT DEFAULT 'scheduled',
  interviewer_name TEXT,
  interviewer_phone TEXT,
  interview_content TEXT,
  evaluation_score INTEGER,
  evaluation_content TEXT,
  result TEXT,
  start_time TEXT,
  end_time TEXT,
  record_file TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (hr_id) REFERENCES hr_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  job_id INTEGER NOT NULL,
  candidate_id INTEGER NOT NULL,
  hr_id INTEGER NOT NULL,
  salary_min INTEGER NOT NULL,
  salary_max INTEGER NOT NULL,
  probation_salary INTEGER,
  probation_period INTEGER DEFAULT 3,
  entry_date TEXT NOT NULL,
  work_place TEXT,
  benefits TEXT,
  other_terms TEXT,
  status TEXT DEFAULT 'pending',
  sign_token TEXT UNIQUE,
  signed_at TEXT,
  candidate_signature TEXT,
  company_signature TEXT,
  expire_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (hr_id) REFERENCES hr_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS onboarding_processes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id INTEGER NOT NULL,
  candidate_id INTEGER NOT NULL,
  task_name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  required INTEGER DEFAULT 1,
  completed_at TEXT,
  remark TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'free',
  cost_per_post REAL DEFAULT 0,
  cost_per_click REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analytics_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  record_date TEXT NOT NULL,
  job_id INTEGER,
  channel_id INTEGER,
  metric_type TEXT NOT NULL,
  metric_value REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS fraud_detections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL,
  risk_score INTEGER DEFAULT 0,
  risk_level TEXT DEFAULT 'low',
  risk_factors TEXT,
  checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hot_area_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city TEXT NOT NULL,
  district TEXT,
  longitude REAL,
  latitude REAL,
  job_count INTEGER DEFAULT 0,
  hot_score INTEGER DEFAULT 0,
  record_date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  user_type TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  ip TEXT,
  user_agent TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, user_type)
);

CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(work_city);
CREATE INDEX IF NOT EXISTS idx_jobs_hot ON jobs(hot_score DESC);
CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON job_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_match ON job_applications(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_interviews_hr ON interviews(hr_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_time ON interviews(schedule_time);
CREATE INDEX IF NOT EXISTS idx_hot_area_date ON hot_area_records(record_date);
CREATE INDEX IF NOT EXISTS idx_hot_area_city ON hot_area_records(city, record_date);
`);

const initCompetencyTags = db.prepare(`
  INSERT OR IGNORE INTO competency_tags (name, category, description) VALUES 
  (?, ?, ?)
`);

const tags = [
  ['Java', 'technical', 'Java开发技能'],
  ['Python', 'technical', 'Python开发技能'],
  ['JavaScript', 'technical', 'JavaScript开发技能'],
  ['React', 'technical', 'React框架'],
  ['Vue', 'technical', 'Vue框架'],
  ['Node.js', 'technical', 'Node.js开发'],
  ['SpringBoot', 'technical', 'SpringBoot框架'],
  ['MySQL', 'technical', 'MySQL数据库'],
  ['Redis', 'technical', 'Redis缓存'],
  ['Docker', 'technical', 'Docker容器化'],
  ['Kubernetes', 'technical', 'K8s容器编排'],
  ['AWS', 'technical', 'AWS云服务'],
  ['算法', 'technical', '算法设计与分析'],
  ['数据结构', 'technical', '数据结构'],
  ['系统设计', 'technical', '系统架构设计'],
  ['沟通能力', 'soft', '良好的沟通表达能力'],
  ['团队协作', 'soft', '团队协作精神'],
  ['领导力', 'soft', '领导能力'],
  ['项目管理', 'soft', '项目管理能力'],
  ['学习能力', 'soft', '快速学习能力'],
  ['问题解决', 'soft', '问题分析与解决'],
  ['英语', 'language', '英语能力'],
  ['日语', 'language', '日语能力'],
  ['PMP', 'certification', '项目管理专业认证'],
  ['CPA', 'certification', '注册会计师'],
  ['律师资格', 'certification', '法律职业资格']
];

tags.forEach(([name, category, desc]) => {
  initCompetencyTags.run(name, category, desc);
});

const initJdTemplates = db.prepare(`
  INSERT OR IGNORE INTO jd_templates (name, category, content, is_system) VALUES 
  (?, ?, ?, 1)
`);

const templates = [
  ['高级Java开发工程师', '技术研发', `职位描述：
1. 负责公司核心业务系统的设计与开发
2. 参与技术方案评审，把控代码质量
3. 优化系统性能，提升用户体验
4. 指导初级工程师，分享技术经验

任职要求：
1. 本科及以上学历，计算机相关专业
2. 5年以上Java开发经验，扎实的基础
3. 精通SpringBoot、MyBatis等框架
4. 熟悉MySQL、Redis、MQ等中间件
5. 有高并发系统设计经验者优先
6. 良好的沟通能力和团队协作精神`],
  ['前端开发工程师', '技术研发', `职位描述：
1. 负责Web端产品的前端开发工作
2. 与产品、设计、后端紧密协作
3. 优化用户体验和页面性能
4. 参与前端工程化建设

任职要求：
1. 本科及以上学历，3年以上前端开发经验
2. 精通HTML/CSS/JavaScript，熟悉ES6+
3. 精通React/Vue框架，有实际项目经验
4. 熟悉前端工程化工具链
5. 良好的沟通能力和团队协作`],
  ['产品经理', '产品', `职位描述：
1. 负责产品规划和需求分析
2. 撰写PRD，协调设计和研发
3. 跟踪产品上线效果，持续优化
4. 竞品分析和市场调研

任职要求：
1. 本科及以上学历，3年以上产品经验
2. 优秀的逻辑思维和沟通能力
3. 熟练使用Axure、墨刀等原型工具
4. 有ToB产品经验者优先
5. 数据驱动，注重用户体验`],
  ['人力资源经理', '职能', `职位描述：
1. 负责公司人力资源管理工作
2. 制定并执行招聘、培训、绩效等制度
3. 推动企业文化建设
4. 处理员工关系和劳动纠纷

任职要求：
1. 本科及以上学历，5年以上HR经验
2. 熟悉劳动法规和人力资源各模块
3. 优秀的沟通协调能力
4. 有互联网行业经验优先`],
  ['销售经理', '销售', `职位描述：
1. 负责区域客户开发和维护
2. 完成销售指标，拓展市场份额
3. 建立良好的客户关系
4. 收集市场信息和竞品动态

任职要求：
1. 大专及以上学历，3年以上销售经验
2. 优秀的沟通和谈判能力
3. 能承受工作压力，结果导向
4. 有行业资源者优先`]
];

templates.forEach(([name, category, content]) => {
  initJdTemplates.run(name, category, content);
});

const initChannels = db.prepare(`
  INSERT OR IGNORE INTO channels (name, code, type, cost_per_post, cost_per_click, is_active) VALUES 
  (?, ?, ?, ?, ?, 1)
`);

const channels = [
  ['智联招聘', 'zhilian', 'paid', 100, 5],
  ['前程无忧', '51job', 'paid', 100, 5],
  ['BOSS直聘', 'boss', 'paid', 150, 8],
  ['猎聘', 'liepin', 'paid', 200, 10],
  ['拉勾网', 'lagou', 'paid', 80, 4],
  ['LinkedIn', 'linkedin', 'paid', 300, 15],
  ['公司官网', 'official', 'free', 0, 0],
  ['内部推荐', 'referral', 'free', 0, 0],
  ['微信朋友圈', 'wechat', 'social', 0, 0],
  ['脉脉', 'maimai', 'social', 50, 2]
];

channels.forEach(([name, code, type, cpp, cpc]) => {
  initChannels.run(name, code, type, cpp, cpc);
});

const initDemoData = db.prepare(`
  INSERT OR IGNORE INTO companies (id, name, unified_social_code, legal_person, registered_capital, establishment_date, business_scope, address, city, district, longitude, latitude, industry, company_size, logo, description, verification_status, credit_score, compliance_score, risk_level) 
  VALUES (1, '智联科技有限公司', '91110000MA01234567', '张三', '5000万人民币', '2015-01-01', '技术开发、技术服务、技术咨询、成果转让', '杭州市余杭区文一西路969号', '杭州', '余杭区', 120.02, 30.28, '互联网/IT', '100-499人', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tech%20company%20logo&image_size=square', '智联科技是一家专注于人力资源科技的创新企业，致力于通过AI技术提升招聘效率。', 'verified', 92, 88, 'low')
`);
initDemoData.run();

const bcrypt = require('bcryptjs');
const initHR = db.prepare(`
  INSERT OR IGNORE INTO hr_users (id, company_id, email, phone, password_hash, name, avatar, role, department, position, status) 
  VALUES (1, 1, 'hr@zhilian.com', '13800138001', ?, '李经理', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20female%20portrait&image_size=square', 'admin', '人力资源部', '招聘经理', 'active')
`);
initHR.run(bcrypt.hashSync('123456', 10));

const initHR2 = db.prepare(`
  INSERT OR IGNORE INTO hr_users (id, company_id, email, phone, password_hash, name, avatar, role, department, position, status) 
  VALUES (2, 1, 'hr2@zhilian.com', '13800138002', ?, '王主管', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20male%20portrait&image_size=square', 'hr', '人力资源部', '招聘主管', 'active')
`);
initHR2.run(bcrypt.hashSync('123456', 10));

const initCandidate = db.prepare(`
  INSERT OR IGNORE INTO candidates (id, name, phone, email, gender, birthday, city, expected_salary_min, expected_salary_max, expected_city, expected_position, work_years, highest_education, current_company, current_position, skill_tags, resume_score) 
  VALUES (1, '陈小明', '13900139001', 'chenxm@email.com', '男', '1995-06-15', '杭州', 25000, 35000, '杭州', '高级Java开发工程师', 6, '本科', '阿里巴巴', 'Java开发工程师', 'Java,SpringBoot,MySQL,Redis,Docker,微服务', 88)
`);
initCandidate.run();

const initCandidate2 = db.prepare(`
  INSERT OR IGNORE INTO candidates (id, name, phone, email, gender, birthday, city, expected_salary_min, expected_salary_max, expected_city, expected_position, work_years, highest_education, current_company, current_position, skill_tags, resume_score) 
  VALUES (2, '刘小红', '13900139002', 'liuxh@email.com', '女', '1996-03-20', '杭州', 20000, 30000, '杭州', '前端开发工程师', 5, '本科', '字节跳动', '高级前端工程师', 'React,Vue,JavaScript,TypeScript,Webpack,Node.js', 85)
`);
initCandidate2.run();

const initCandidate3 = db.prepare(`
  INSERT OR IGNORE INTO candidates (id, name, phone, email, gender, birthday, city, expected_salary_min, expected_salary_max, expected_city, expected_position, work_years, highest_education, current_company, current_position, skill_tags, resume_score) 
  VALUES (3, '张伟', '13900139003', 'zhangwei@email.com', '男', '1993-11-08', '上海', 35000, 50000, '杭州', '技术经理', 8, '硕士', '腾讯', '技术主管', 'Java,架构设计,微服务,团队管理,项目管理,Kubernetes', 92)
`);
initCandidate3.run();

const initJobs = db.prepare(`
  INSERT OR IGNORE INTO jobs (id, company_id, hr_id, title, department, job_type, work_city, work_district, work_address, longitude, latitude, salary_min, salary_max, salary_negotiable, salary_period, education, experience, jd_content, competency_tags, benefits, channel, status, fraud_score, fraud_status, publish_time, view_count, apply_count, hot_score) 
  VALUES (1, 1, 1, '高级Java开发工程师', '技术研发部', '全职', '杭州', '余杭区', '文一西路969号阿里巴巴西溪园区', 120.02, 30.28, 30000, 50000, 0, 'month', '本科', '5-10年', ?, 'Java,SpringBoot,MySQL,Redis,Docker,系统设计,团队协作,问题解决', '五险一金,年终奖,股票期权,带薪年假,弹性工作,免费三餐,健身房', 'boss', 'published', 5, 'normal', '2026-06-01', 1256, 89, 950)
`);
initJobs.run(`职位描述：
1. 负责公司核心业务系统的架构设计与开发
2. 主导技术方案选型，解决复杂技术问题
3. 优化系统性能，支撑千万级用户访问
4. 带领5-8人技术团队，培养团队成员
5. 参与产品需求评审，提供技术可行性分析

任职要求：
1. 本科及以上学历，计算机相关专业
2. 5年以上Java开发经验，2年以上团队管理经验
3. 精通SpringBoot、SpringCloud等微服务架构
4. 精通MySQL数据库设计和性能优化
5. 熟悉Redis、Kafka、Elasticsearch等中间件
6. 有高并发、分布式系统设计经验
7. 良好的沟通能力和团队协作精神`);

const initJob2 = db.prepare(`
  INSERT OR IGNORE INTO jobs (id, company_id, hr_id, title, department, job_type, work_city, work_district, work_address, longitude, latitude, salary_min, salary_max, salary_negotiable, salary_period, education, experience, jd_content, competency_tags, benefits, channel, status, fraud_score, fraud_status, publish_time, view_count, apply_count, hot_score) 
  VALUES (2, 1, 1, '前端开发工程师', '技术研发部', '全职', '杭州', '西湖区', '文三路478号华星时代广场', 120.12, 30.27, 20000, 35000, 0, 'month', '本科', '3-5年', ?, 'React,Vue,JavaScript,TypeScript,Webpack,Node.js,沟通能力,团队协作', '五险一金,年终奖,带薪年假,弹性工作,零食下午茶,每月团建', 'zhilian', 'published', 3, 'normal', '2026-06-03', 892, 56, 820)
`);
initJob2.run(`职位描述：
1. 负责公司B端管理系统和C端产品的前端开发
2. 与产品、设计、后端紧密协作，快速迭代
3. 优化页面性能和用户体验
4. 参与前端技术选型和工程化建设
5. 编写技术文档，沉淀最佳实践

任职要求：
1. 本科及以上学历，3年以上前端开发经验
2. 精通HTML/CSS/JavaScript，熟悉ES6+新特性
3. 精通React或Vue框架，有实际项目经验
4. 熟悉TypeScript、Webpack、Vite等工具
5. 了解Node.js和常用后端框架
6. 有前端性能优化经验者优先
7. 良好的沟通能力和团队协作`);

const initJob3 = db.prepare(`
  INSERT OR IGNORE INTO jobs (id, company_id, hr_id, title, department, job_type, work_city, work_district, work_address, longitude, latitude, salary_min, salary_max, salary_negotiable, salary_period, education, experience, jd_content, competency_tags, benefits, channel, status, fraud_score, fraud_status, publish_time, view_count, apply_count, hot_score) 
  VALUES (3, 1, 2, '产品经理', '产品部', '全职', '杭州', '余杭区', '文一西路969号', 120.02, 30.28, 25000, 40000, 1, 'month', '本科', '3-5年', ?, '产品设计,需求分析,项目管理,沟通能力,数据驱动,学习能力,问题解决', '五险一金,年终奖,股票期权,带薪年假,弹性工作,免费体检', '51job', 'published', 2, 'normal', '2026-06-05', 678, 34, 710)
`);
initJob3.run(`职位描述：
1. 负责HR SaaS产品的规划和设计
2. 调研用户需求，输出PRD和原型图
3. 协调设计、研发、测试团队，推动产品落地
4. 跟踪产品上线效果，通过数据分析持续优化
5. 竞品分析和市场调研，保持产品竞争力

任职要求：
1. 本科及以上学历，3年以上B端产品经验
2. 有HR SaaS或企业服务产品经验者优先
3. 优秀的逻辑思维和沟通协调能力
4. 熟练使用Axure、Figma等原型工具
5. 数据驱动，善于从数据中发现问题
6. 有技术背景者优先`);

const initApplication = db.prepare(`
  INSERT OR IGNORE INTO job_applications (id, job_id, candidate_id, channel, match_score, skill_match_score, experience_match_score, salary_match_score, intention_score, status, hr_remark, applied_at) 
  VALUES (1, 1, 3, 'boss', 95, 98, 92, 90, 88, 'interview', '非常匹配，8年经验，技术经理背景，安排面试', '2026-06-06')
`);
initApplication.run();

const initApplication2 = db.prepare(`
  INSERT OR IGNORE INTO job_applications (id, job_id, candidate_id, channel, match_score, skill_match_score, experience_match_score, salary_match_score, intention_score, status, hr_remark, applied_at) 
  VALUES (2, 1, 1, 'zhilian', 82, 85, 80, 78, 75, 'interview', '6年经验，技术栈匹配，安排初面', '2026-06-06')
`);
initApplication2.run();

const initApplication3 = db.prepare(`
  INSERT OR IGNORE INTO job_applications (id, job_id, candidate_id, channel, match_score, skill_match_score, experience_match_score, salary_match_score, intention_score, status, applied_at) 
  VALUES (3, 2, 2, 'official', 88, 92, 85, 85, 80, 'pending', '2026-06-07')
`);
initApplication3.run();

const applicationForInterview1 = db.prepare(`
  SELECT id FROM job_applications WHERE job_id = ? AND candidate_id = ? ORDER BY id LIMIT 1
`).get(1, 3);
const applicationForInterview2 = db.prepare(`
  SELECT id FROM job_applications WHERE job_id = ? AND candidate_id = ? ORDER BY id LIMIT 1
`).get(1, 1);

const initInterview = db.prepare(`
  INSERT OR IGNORE INTO interviews (id, application_id, job_id, candidate_id, hr_id, interview_type, interview_round, schedule_time, duration, room_id, room_password, status, interviewer_name, interviewer_phone) 
  VALUES (1, ?, 1, 3, 1, 'video', 1, '2026-06-10 14:00:00', 60, 'ROOM001', '123456', 'scheduled', '技术总监-王总', '13800138888')
`);
if (applicationForInterview1) {
  initInterview.run(applicationForInterview1.id);
}

const initInterview2 = db.prepare(`
  INSERT OR IGNORE INTO interviews (id, application_id, job_id, candidate_id, hr_id, interview_type, interview_round, schedule_time, duration, room_id, room_password, status, interviewer_name, interviewer_phone) 
  VALUES (2, ?, 1, 1, 1, 'video', 1, '2026-06-10 10:00:00', 45, 'ROOM002', '654321', 'scheduled', '技术主管-李工', '13800138999')
`);
if (applicationForInterview2) {
  initInterview2.run(applicationForInterview2.id);
}

const initHotAreas = db.prepare(`
  INSERT OR IGNORE INTO hot_area_records (city, district, longitude, latitude, job_count, hot_score, record_date) VALUES 
  (?, ?, ?, ?, ?, ?, ?)
`);

const hotAreas = [
  ['杭州', '余杭区', 120.02, 30.28, 156, 950, '2026-06-08'],
  ['杭州', '滨江区', 120.21, 30.20, 132, 890, '2026-06-08'],
  ['杭州', '西湖区', 120.12, 30.27, 118, 820, '2026-06-08'],
  ['杭州', '上城区', 120.17, 30.25, 89, 720, '2026-06-08'],
  ['杭州', '拱墅区', 120.14, 30.31, 76, 650, '2026-06-08'],
  ['杭州', '萧山区', 120.27, 30.18, 67, 580, '2026-06-08'],
  ['北京', '朝阳区', 116.45, 39.92, 234, 980, '2026-06-08'],
  ['北京', '海淀区', 116.31, 39.96, 278, 990, '2026-06-08'],
  ['上海', '浦东新区', 121.54, 31.22, 312, 995, '2026-06-08'],
  ['上海', '徐汇区', 121.43, 31.19, 189, 880, '2026-06-08'],
  ['深圳', '南山区', 113.93, 22.53, 267, 970, '2026-06-08'],
  ['深圳', '福田区', 114.05, 22.52, 198, 910, '2026-06-08'],
  ['广州', '天河区', 113.39, 23.12, 178, 860, '2026-06-08'],
  ['成都', '高新区', 104.06, 30.57, 145, 790, '2026-06-08']
];

hotAreas.forEach(([city, district, lng, lat, count, score, date]) => {
  initHotAreas.run(city, district, lng, lat, count, score, date);
});

console.log('Database initialized successfully');
console.log('Demo data loaded: 1 company, 2 HR users, 3 candidates, 3 jobs, 3 applications, 2 interviews');

module.exports = db;
