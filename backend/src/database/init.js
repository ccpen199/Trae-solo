
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const Database = require('better-sqlite3');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initTables = `
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  real_name TEXT,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  avatar TEXT,
  credit_score INTEGER DEFAULT 100,
  exposure_weight REAL DEFAULT 1.0,
  total_recommendations INTEGER DEFAULT 0,
  success_hires INTEGER DEFAULT 0,
  total_commission REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 企业用户表
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  company_name TEXT NOT NULL,
  industry TEXT,
  scale TEXT,
  description TEXT,
  verified INTEGER DEFAULT 0,
  license_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 简历表
CREATE TABLE IF NOT EXISTS resumes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  candidate_name TEXT NOT NULL,
  candidate_phone TEXT NOT NULL,
  candidate_email TEXT,
  age INTEGER,
  gender TEXT,
  current_company TEXT,
  current_position TEXT,
  current_salary REAL,
  expected_salary_min REAL,
  expected_salary_max REAL,
  city TEXT,
  education TEXT,
  work_years INTEGER,
  skills TEXT,
  experience TEXT,
  education_detail TEXT,
  portrait_tags TEXT,
  poaching_risk REAL,
  owner_id INTEGER REFERENCES users(id),
  is_public INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 职位悬赏表
CREATE TABLE IF NOT EXISTS job_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER REFERENCES companies(id),
  title TEXT NOT NULL,
  department TEXT,
  job_description TEXT,
  requirements TEXT,
  salary_min REAL,
  salary_max REAL,
  reward_amount REAL NOT NULL,
  commission_tiers TEXT,
  installment_plan TEXT,
  allowed_channels TEXT,
  probation_months INTEGER DEFAULT 3,
  feedback_nodes TEXT,
  city TEXT,
  status TEXT DEFAULT 'active',
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 推荐记录表
CREATE TABLE IF NOT EXISTS recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resume_id INTEGER REFERENCES resumes(id),
  job_id INTEGER REFERENCES job_rewards(id),
  referrer_id INTEGER REFERENCES users(id),
  candidate_id INTEGER REFERENCES users(id),
  company_id INTEGER REFERENCES companies(id),
  status TEXT DEFAULT 'pending',
  commission_rate REAL DEFAULT 0.1,
  commission_amount REAL,
  contract_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 分佣计划表
CREATE TABLE IF NOT EXISTS commission_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recommendation_id INTEGER REFERENCES recommendations(id),
  installment_number INTEGER,
  total_installments INTEGER,
  amount REAL,
  trigger_condition TEXT,
  trigger_date DATE,
  status TEXT DEFAULT 'pending',
  paid_at DATETIME,
  txn_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 面试流程表
CREATE TABLE IF NOT EXISTS interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recommendation_id INTEGER REFERENCES recommendations(id),
  round INTEGER,
  interview_type TEXT,
  scheduled_at DATETIME,
  interviewer TEXT,
  webrtc_room TEXT,
  status TEXT DEFAULT 'scheduled',
  feedback TEXT,
  result TEXT,
  ai_summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 试用期反馈表
CREATE TABLE IF NOT EXISTS probation_feedbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recommendation_id INTEGER REFERENCES recommendations(id),
  feedback_node TEXT,
  feedback_date DATE,
  rating INTEGER,
  comments TEXT,
  passed INTEGER,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 资金流水表
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'CNY',
  from_user_id INTEGER REFERENCES users(id),
  to_user_id INTEGER REFERENCES users(id),
  recommendation_id INTEGER REFERENCES recommendations(id),
  commission_plan_id INTEGER REFERENCES commission_plans(id),
  status TEXT DEFAULT 'pending',
  payment_gateway_txn_id TEXT,
  contract_hash TEXT,
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 可信度模型表
CREATE TABLE IF NOT EXISTS credibility_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  score_type TEXT NOT NULL,
  score REAL,
  factors TEXT,
  period TEXT,
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- IM 消息表
CREATE TABLE IF NOT EXISTS im_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL,
  sender_id INTEGER REFERENCES users(id),
  receiver_id INTEGER REFERENCES users(id),
  message_type TEXT DEFAULT 'text',
  content TEXT,
  resume_id INTEGER REFERENCES resumes(id),
  interview_id INTEGER REFERENCES interviews(id),
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 视频面试房间表
CREATE TABLE IF NOT EXISTS video_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT UNIQUE NOT NULL,
  interview_id INTEGER REFERENCES interviews(id),
  host_id INTEGER REFERENCES users(id),
  participant_ids TEXT,
  status TEXT DEFAULT 'waiting',
  started_at DATETIME,
  ended_at DATETIME,
  recording_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 区块链存证表
CREATE TABLE IF NOT EXISTS blockchain_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_type TEXT NOT NULL,
  reference_id INTEGER NOT NULL,
  hash TEXT NOT NULL,
  block_number INTEGER,
  txn_hash TEXT,
  data_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 薪酬带宽表
CREATE TABLE IF NOT EXISTS salary_bands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city TEXT,
  industry TEXT,
  position_level TEXT,
  p10 REAL,
  p25 REAL,
  p50 REAL,
  p75 REAL,
  p90 REAL,
  sample_size INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 操作日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id INTEGER,
  ip TEXT,
  user_agent TEXT,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resumes_owner ON resumes(owner_id);
CREATE INDEX IF NOT EXISTS idx_resumes_company ON resumes(current_company);
CREATE INDEX IF NOT EXISTS idx_job_rewards_company ON job_rewards(company_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_referrer ON recommendations(referrer_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_im_conversation ON im_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_credibility_user ON credibility_scores(user_id);
`;

db.exec(initTables);
console.log('数据库表初始化完成');

const hashPassword = (pwd) => bcrypt.hashSync(pwd, 10);

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (username, password, real_name, phone, role, credit_score)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const users = [
  ['admin', hashPassword('admin123'), '系统管理员', '13800000000', 'admin', 100],
  ['headhunter1', hashPassword('123456'), '张伯乐', '13800000001', 'user', 100],
  ['headhunter2', hashPassword('123456'), '李猎头', '13800000002', 'user', 95],
  ['hr_company1', hashPassword('123456'), '王HR', '13800000003', 'company', 100],
  ['hr_company2', hashPassword('123456'), '赵招聘', '13800000004', 'company', 100],
];

for (const user of users) {
  const info = insertUser.run(...user);
  if (info.changes > 0) {
    console.log(`创建用户: ${user[0]} (${user[2]})`);
  }
}

const insertCompany = db.prepare(`
  INSERT OR IGNORE INTO companies (user_id, company_name, industry, scale, description, verified)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const companies = [
  [4, '科技创新有限公司', '互联网/科技', '500-1000人', '专注于人工智能和大数据领域的创新企业', 1],
  [5, '金融发展集团', '金融', '1000-5000人', '综合性金融服务集团', 1],
];

for (const comp of companies) {
  const info = insertCompany.run(...comp);
  if (info.changes > 0) {
    console.log(`创建企业: ${comp[1]}`);
  }
}

const insertResume = db.prepare(`
  INSERT OR IGNORE INTO resumes (
    candidate_name, candidate_phone, candidate_email, age, gender,
    current_company, current_position, current_salary,
    expected_salary_min, expected_salary_max, city,
    education, work_years, skills, experience,
    portrait_tags, poaching_risk, owner_id, is_public
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const resumes = [
  ['陈工程师', '13900000001', 'chen@example.com', 28, '男', '某互联网公司', '高级前端工程师', 350000, 400000, 500000, '北京', '本科', 5, 'React,Vue,TypeScript,Node.js', '5年前端开发经验，主导过3个大型项目', JSON.stringify(['技术实力派', '稳定性高', '大厂背景']), 0.75, 2, 1],
  ['刘产品', '13900000002', 'liu@example.com', 30, '女', '某电商平台', '产品经理', 400000, 450000, 600000, '上海', '硕士', 6, '产品设计,用户研究,数据分析', '6年互联网产品经验，擅长电商和社交产品', JSON.stringify(['产品思维强', '数据驱动', '沟通能力好']), 0.85, 2, 1],
  ['王后端', '13900000003', 'wang@example.com', 26, '男', '某创业公司', '后端开发工程师', 300000, 350000, 450000, '深圳', '本科', 3, 'Java,SpringBoot,MySQL,Redis', '3年Java后端经验，熟悉微服务架构', JSON.stringify(['学习能力强', '技术栈全面', '年轻有潜力']), 0.6, 3, 1],
  ['赵算法', '13900000004', 'zhao@example.com', 32, '男', '某AI公司', '算法工程师', 500000, 600000, 800000, '北京', '博士', 4, 'Python,TensorFlow,机器学习,深度学习', '4年算法经验，发表多篇顶会论文', JSON.stringify(['高学历', '技术大牛', '稀缺人才']), 0.9, 3, 1],
];

for (const resume of resumes) {
  const info = insertResume.run(...resume);
  if (info.changes > 0) {
    console.log(`创建简历: ${resume[0]} - ${resume[6]}`);
  }
}

const insertJob = db.prepare(`
  INSERT OR IGNORE INTO job_rewards (
    company_id, title, department, job_description, requirements,
    salary_min, salary_max, reward_amount, commission_tiers,
    installment_plan, allowed_channels, probation_months, feedback_nodes,
    city, status, created_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const jobs = [
  [
    1, '高级前端工程师', '技术部', '负责公司核心产品的前端开发工作',
    '5年以上前端经验，精通React/Vue', 400000, 600000, 80000,
    JSON.stringify([{ threshold: 1, rate: 0.08 }, { threshold: 3, rate: 0.1 }, { threshold: 5, rate: 0.12 }]),
    JSON.stringify([{ month: 1, ratio: 0.3 }, { month: 3, ratio: 0.4 }, { month: 6, ratio: 0.3 }]),
    JSON.stringify(['internal', 'verified']), 6,
    JSON.stringify(['15天', '1个月', '3个月', '6个月']), '北京', 'active', 4
  ],
  [
    1, '高级产品经理', '产品部', '负责产品规划和设计，推动产品迭代',
    '5年以上产品经验，有电商或SaaS经验', 450000, 700000, 100000,
    JSON.stringify([{ threshold: 1, rate: 0.09 }, { threshold: 3, rate: 0.11 }, { threshold: 5, rate: 0.13 }]),
    JSON.stringify([{ month: 1, ratio: 0.3 }, { month: 3, ratio: 0.35 }, { month: 6, ratio: 0.35 }]),
    JSON.stringify(['internal', 'verified', 'public']), 6,
    JSON.stringify(['1个月', '3个月', '6个月']), '上海', 'active', 4
  ],
  [
    2, 'Java后端工程师', '科技部', '负责金融系统的后端开发和维护',
    '3年以上Java经验，有金融行业经验优先', 350000, 500000, 70000,
    JSON.stringify([{ threshold: 1, rate: 0.08 }, { threshold: 3, rate: 0.1 }, { threshold: 5, rate: 0.12 }]),
    JSON.stringify([{ month: 1, ratio: 0.4 }, { month: 3, ratio: 0.3 }, { month: 6, ratio: 0.3 }]),
    JSON.stringify(['internal']), 3,
    JSON.stringify(['1个月', '3个月']), '深圳', 'active', 5
  ],
];

for (const job of jobs) {
  const info = insertJob.run(...job);
  if (info.changes > 0) {
    console.log(`创建职位悬赏: ${job[1]} - 赏金${job[7]}元`);
  }
}

const insertSalaryBand = db.prepare(`
  INSERT OR IGNORE INTO salary_bands (city, industry, position_level, p10, p25, p50, p75, p90, sample_size)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const salaryBands = [
  ['北京', '互联网', '高级工程师', 250000, 300000, 380000, 480000, 600000, 5000],
  ['北京', '互联网', '中级工程师', 180000, 220000, 280000, 350000, 420000, 8000],
  ['上海', '互联网', '高级工程师', 260000, 310000, 390000, 490000, 620000, 4500],
  ['深圳', '互联网', '高级工程师', 240000, 290000, 370000, 470000, 580000, 4000],
  ['北京', '金融', '高级工程师', 280000, 330000, 420000, 520000, 680000, 3000],
  ['上海', '金融', '高级工程师', 290000, 340000, 430000, 540000, 700000, 2800],
];

for (const sb of salaryBands) {
  insertSalaryBand.run(...sb);
}
console.log('薪酬带宽数据初始化完成');

db.close();
console.log('数据库初始化完成!');
console.log(`数据库文件: ${dbPath}`);
