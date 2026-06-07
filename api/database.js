import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'

const dbPath = path.resolve(process.cwd(), process.env.DATABASE_URL || './data/app.sqlite')
fs.mkdirSync(path.dirname(dbPath), { recursive: true })

export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

try { db.exec('ALTER TABLE campus_schedules ADD COLUMN attendees_count INTEGER DEFAULT 0') } catch {}
try { db.exec('ALTER TABLE campus_schedules ADD COLUMN resumes_received INTEGER DEFAULT 0') } catch {}
try { db.exec('ALTER TABLE internships ADD COLUMN mentor_feedback TEXT') } catch {}
try { db.exec('ALTER TABLE ambassador_tasks ADD COLUMN actual_points INTEGER DEFAULT 0') } catch {}

db.exec(`
  CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    current_title TEXT,
    current_company TEXT,
    industry TEXT,
    experience_years INTEGER DEFAULT 0,
    career_level TEXT,
    expected_salary_min INTEGER,
    expected_salary_max INTEGER,
    education TEXT,
    location TEXT,
    job_status TEXT DEFAULT 'open',
    skills_vector TEXT,
    summary TEXT,
    privacy_mode TEXT DEFAULT 'normal',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS candidate_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    role TEXT,
    tech_stack TEXT,
    start_date TEXT,
    end_date TEXT,
    description TEXT,
    quantified_outcome TEXT,
    revenue_impact INTEGER,
    efficiency_gain REAL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS candidate_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    category TEXT,
    proficiency INTEGER DEFAULT 3,
    years_used INTEGER DEFAULT 0,
    weight REAL DEFAULT 1.0
  );

  CREATE TABLE IF NOT EXISTS enterprises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    industry TEXT,
    scale TEXT,
    location TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    credit_score INTEGER DEFAULT 60,
    credit_level TEXT DEFAULT 'B',
    contract_fulfillment_rate REAL DEFAULT 0.0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS credit_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enterprise_id INTEGER NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    score_change INTEGER NOT NULL,
    reason TEXT,
    recorded_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enterprise_id INTEGER NOT NULL REFERENCES enterprises(id),
    title TEXT NOT NULL,
    department TEXT,
    industry TEXT,
    function_type TEXT,
    required_level TEXT,
    min_experience_years INTEGER DEFAULT 0,
    salary_min INTEGER,
    salary_max INTEGER,
    location TEXT,
    tech_stack TEXT,
    description TEXT,
    requirements TEXT,
    benefits TEXT,
    semantic_vector TEXT,
    status TEXT DEFAULT 'draft',
    published_at TEXT,
    deadline TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS funnel_stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    stage_name TEXT NOT NULL,
    candidate_count INTEGER DEFAULT 0,
    conversion_rate REAL DEFAULT 0.0,
    avg_days_in_stage REAL DEFAULT 0.0,
    drop_reason TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS match_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id),
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    overall_score REAL DEFAULT 0,
    tech_stack_score REAL DEFAULT 0,
    experience_score REAL DEFAULT 0,
    level_score REAL DEFAULT 0,
    salary_score REAL DEFAULT 0,
    match_details TEXT,
    direction TEXT DEFAULT 'both',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS headhunters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    specialty_industry TEXT,
    specialty_function TEXT,
    experience_years INTEGER DEFAULT 0,
    rating REAL DEFAULT 0.0,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS communications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    headhunter_id INTEGER NOT NULL REFERENCES headhunters(id),
    candidate_id INTEGER NOT NULL REFERENCES candidates(id),
    comm_type TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    sentiment TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS followups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    headhunter_id INTEGER NOT NULL REFERENCES headhunters(id),
    candidate_id INTEGER NOT NULL REFERENCES candidates(id),
    job_id INTEGER REFERENCES jobs(id),
    plan_text TEXT NOT NULL,
    scheduled_at TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS interviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id),
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    interviewer_name TEXT,
    interview_type TEXT,
    scheduled_at TEXT NOT NULL,
    status TEXT DEFAULT 'scheduled',
    location TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    interview_id INTEGER NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    technical_skill INTEGER DEFAULT 0,
    communication INTEGER DEFAULT 0,
    project_experience INTEGER DEFAULT 0,
    cultural_fit INTEGER DEFAULT 0,
    overall_score REAL DEFAULT 0,
    recommendation TEXT,
    detailed_feedback TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS campus_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    university_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_date TEXT NOT NULL,
    location TEXT,
    contact_person TEXT,
    description TEXT,
    attendees_count INTEGER DEFAULT 0,
    resumes_received INTEGER DEFAULT 0,
    status TEXT DEFAULT 'planned',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS internships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id),
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    university TEXT,
    major TEXT,
    start_date TEXT,
    end_date TEXT,
    mentor_name TEXT,
    conversion_status TEXT DEFAULT 'pending',
    conversion_probability REAL DEFAULT 0.5,
    performance_rating REAL DEFAULT 0.0,
    mentor_feedback TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ambassadors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    university TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    joined_at TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'active',
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    reward_points INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS ambassador_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ambassador_id INTEGER NOT NULL REFERENCES ambassadors(id),
    task_type TEXT NOT NULL,
    task_title TEXT NOT NULL,
    description TEXT,
    deadline TEXT,
    reward_points INTEGER DEFAULT 0,
    actual_points INTEGER DEFAULT 0,
    status TEXT DEFAULT 'assigned',
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ai_datasets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    record_count INTEGER DEFAULT 0,
    quality_score REAL DEFAULT 0.0,
    status TEXT DEFAULT 'active',
    data_scope TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS salary_benchmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    industry TEXT NOT NULL,
    function_type TEXT NOT NULL,
    career_level TEXT NOT NULL,
    location TEXT,
    p25 INTEGER,
    p50 INTEGER,
    p75 INTEGER,
    p90 INTEGER,
    effective_date TEXT,
    source TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS privacy_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_name TEXT NOT NULL,
    rule_type TEXT NOT NULL,
    pattern TEXT,
    replacement TEXT,
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );
`)

const candidateCount = db.prepare('SELECT COUNT(*) AS count FROM candidates').get().count
if (candidateCount === 0) {
  const now = new Date().toISOString()

  const insertEnterprise = db.prepare(`
    INSERT INTO enterprises (name, industry, scale, location, contact_email, credit_score, credit_level, contract_fulfillment_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const enterprises = [
    ['星辰科技集团', '互联网', '5000+', '北京', 'hr@xingchen.tech', 92, 'A', 0.95],
    ['云帆数据科技', '人工智能', '1000-5000', '上海', 'talent@yunfan.ai', 85, 'A', 0.88],
    ['瑞峰金融', '金融科技', '500-1000', '深圳', 'hr@ruifeng.fin', 78, 'B+', 0.82],
    ['明远医疗健康', '医疗健康', '200-500', '杭州', 'jobs@mingyuan.health', 65, 'B', 0.70],
    ['智造工场', '智能制造', '1000-5000', '广州', 'hr@zhizao.factory', 72, 'B', 0.76],
  ]
  const enterpriseIds = enterprises.map((e) => insertEnterprise.run(...e).lastInsertRowid)

  const insertCandidate = db.prepare(`
    INSERT INTO candidates (name, email, phone, current_title, current_company, industry, experience_years, career_level, expected_salary_min, expected_salary_max, education, location, job_status, skills_vector, summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const candidates = [
    ['张伟明', 'zhangwm@email.com', '138****1001', '高级前端工程师', '星辰科技集团', '互联网', 8, 'P7', 450000, 600000, '硕士', '北京', 'open', 'React,TypeScript,Node.js,Webpack,微前端', '8年前端开发经验，主导过3个大型微前端架构项目，擅长性能优化和团队管理'],
    ['李思远', 'lisy@email.com', '139****2002', 'AI算法工程师', '云帆数据科技', '人工智能', 5, 'P6', 400000, 550000, '博士', '上海', 'open', 'PyTorch,TensorFlow,NLP,计算机视觉,LLM', 'CVPR发表2篇论文，参与大模型训练项目，熟悉NLP和多模态技术'],
    ['王雪晴', 'wangxq@email.com', '137****3003', '产品总监', '瑞峰金融', '金融科技', 10, 'P8', 600000, 800000, '硕士', '深圳', 'open', 'B端产品,支付系统,风控,用户增长', '10年产品经验，从0到1搭建支付风控产品线，管理20人产品团队'],
    ['陈志豪', 'chenzh@email.com', '136****4004', '后端架构师', '星辰科技集团', '互联网', 9, 'P7', 500000, 700000, '硕士', '北京', 'exploring', 'Java,Spring Cloud,K8s,分布式系统,微服务', '9年后端经验，负责千万级DAU系统架构设计，精通分布式和微服务'],
    ['刘梦琪', 'liumq@email.com', '135****5005', '数据分析师', '明远医疗健康', '医疗健康', 3, 'P5', 250000, 350000, '硕士', '杭州', 'open', 'Python,SQL,Tableau,机器学习,统计分析', '3年数据分析经验，构建用户画像体系和AB测试平台'],
    ['赵鹏飞', 'zhaopf@email.com', '134****6006', 'DevOps工程师', '智造工场', '智能制造', 6, 'P6', 350000, 500000, '本科', '广州', 'open', 'Docker,Kubernetes,CI/CD,AWS,Linux', '6年运维开发经验，搭建企业级CI/CD流水线和多云管理平台'],
    ['孙艺文', 'sunyw@email.com', '133****7007', 'UX设计主管', '云帆数据科技', '人工智能', 7, 'P6', 380000, 520000, '硕士', '上海', 'open', 'Figma,设计系统,用户研究,交互设计,B端设计', '7年设计经验，建立企业设计系统，主导多个B端产品设计'],
    ['周晨曦', 'zhoucx@email.com', '132****8008', '全栈工程师', '瑞峰金融', '金融科技', 4, 'P5', 300000, 420000, '本科', '深圳', 'exploring', 'React,Go,PostgreSQL,Redis,GraphQL', '4年全栈经验，独立完成多个金融科技产品从设计到上线'],
  ]
  const candidateIds = candidates.map((c) => insertCandidate.run(...c).lastInsertRowid)

  const insertSkill = db.prepare(`
    INSERT INTO candidate_skills (candidate_id, skill_name, category, proficiency, years_used, weight)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const skills = [
    [candidateIds[0], 'React', '前端', 5, 8, 1.2],
    [candidateIds[0], 'TypeScript', '前端', 5, 6, 1.1],
    [candidateIds[0], 'Node.js', '后端', 4, 5, 0.9],
    [candidateIds[0], 'Webpack', '工程化', 5, 7, 1.0],
    [candidateIds[1], 'PyTorch', 'AI/ML', 5, 5, 1.3],
    [candidateIds[1], 'TensorFlow', 'AI/ML', 4, 4, 1.1],
    [candidateIds[1], 'NLP', 'AI/ML', 5, 3, 1.2],
    [candidateIds[1], 'LLM', 'AI/ML', 4, 2, 1.3],
    [candidateIds[2], 'B端产品', '产品', 5, 10, 1.2],
    [candidateIds[2], '支付系统', '产品', 5, 7, 1.1],
    [candidateIds[2], '风控', '产品', 4, 5, 1.0],
    [candidateIds[3], 'Java', '后端', 5, 9, 1.2],
    [candidateIds[3], 'Spring Cloud', '后端', 5, 6, 1.1],
    [candidateIds[3], 'K8s', '运维', 4, 4, 1.0],
    [candidateIds[3], '分布式系统', '架构', 5, 7, 1.3],
    [candidateIds[4], 'Python', '数据', 4, 3, 1.0],
    [candidateIds[4], 'SQL', '数据', 4, 3, 1.0],
    [candidateIds[4], 'Tableau', '可视化', 3, 2, 0.8],
    [candidateIds[5], 'Docker', '运维', 5, 6, 1.1],
    [candidateIds[5], 'Kubernetes', '运维', 5, 5, 1.2],
    [candidateIds[5], 'CI/CD', '工程化', 5, 6, 1.0],
    [candidateIds[6], 'Figma', '设计', 5, 7, 1.1],
    [candidateIds[6], '设计系统', '设计', 5, 5, 1.2],
    [candidateIds[6], '用户研究', '设计', 4, 4, 1.0],
    [candidateIds[7], 'React', '前端', 4, 4, 1.0],
    [candidateIds[7], 'Go', '后端', 4, 3, 1.1],
    [candidateIds[7], 'PostgreSQL', '数据库', 3, 3, 0.9],
  ]
  skills.forEach((s) => insertSkill.run(...s))

  const insertProject = db.prepare(`
    INSERT INTO candidate_projects (candidate_id, project_name, role, tech_stack, start_date, end_date, description, quantified_outcome, revenue_impact, efficiency_gain)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const projects = [
    [candidateIds[0], '企业级微前端平台', '技术负责人', 'React,qiankun,TypeScript', '2022-03', '2024-01', '设计并实现支持20+子应用的微前端架构平台', '首屏加载时间降低60%，开发效率提升40%', 5000000, 40],
    [candidateIds[0], '性能监控体系', '核心开发', 'Node.js,Prometheus,Grafana', '2021-06', '2022-02', '构建全链路性能监控体系', '线上问题发现时间缩短80%', 0, 80],
    [candidateIds[1], '多模态大模型训练', '算法负责人', 'PyTorch,DeepSpeed,Ray', '2023-01', '2024-06', '主导千亿参数多模态大模型训练', '模型准确率提升15%，训练成本降低30%', 8000000, 30],
    [candidateIds[2], '智能风控决策引擎', '产品负责人', 'Flink,规则引擎,风控模型', '2020-05', '2022-12', '从0到1搭建实时风控决策系统', '欺诈识别率提升35%，误报率降低50%', 20000000, 50],
    [candidateIds[3], '千万级DAU交易系统', '架构师', 'Java,Spring Cloud,K8s', '2021-01', '2023-06', '核心交易系统架构升级', '系统吞吐量提升300%，可用性达99.99%', 50000000, 300],
    [candidateIds[4], '用户画像分析平台', '数据负责人', 'Python,Spark,Hive', '2023-03', '2024-06', '构建千万级用户画像体系', '营销转化率提升25%', 3000000, 25],
    [candidateIds[5], '多云管理平台', '技术负责人', 'Go,Docker,K8s,Terraform', '2022-06', '2024-01', '设计多云统一管理平台', '运维效率提升60%，成本降低20%', 2000000, 60],
    [candidateIds[6], '企业设计系统 Aurora', '设计负责人', 'Figma,React,Storybook', '2021-09', '2023-12', '从0到1建立企业级设计系统', '设计一致性提升90%，开发交付效率提升35%', 0, 35],
    [candidateIds[7], '金融科技SaaS平台', '全栈开发', 'React,Go,PostgreSQL', '2023-02', '2024-08', '独立完成金融SaaS产品全栈开发', '客户入驻率提升40%，系统零故障运行12个月', 5000000, 40],
  ]
  projects.forEach((p) => insertProject.run(...p))

  const insertJob = db.prepare(`
    INSERT INTO jobs (enterprise_id, title, department, industry, function_type, required_level, min_experience_years, salary_min, salary_max, location, tech_stack, description, requirements, benefits, status, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const jobs = [
    [enterpriseIds[0], '前端架构师', '技术部', '互联网', '技术', 'P7', 7, 500000, 700000, '北京', 'React,TypeScript,微前端,性能优化', '负责前端架构设计和团队技术方向', '7年前端经验，有大型项目架构经历，精通React生态', '六险一金,弹性工作,股票期权', 'published', now],
    [enterpriseIds[1], '高级AI算法工程师', 'AI研究院', '人工智能', '技术', 'P6', 3, 400000, 600000, '上海', 'PyTorch,NLP,LLM,计算机视觉', '负责大模型训练和AI应用落地', '3年以上AI算法经验，有顶会论文优先', 'GPU集群,学术自由,高配设备', 'published', now],
    [enterpriseIds[2], '产品总监', '产品部', '金融科技', '产品', 'P8', 8, 600000, 900000, '深圳', 'B端产品,支付风控,数据分析', '负责金融产品线整体规划', '8年以上产品经验，有金融行业背景', '高额年终奖,管理津贴', 'published', now],
    [enterpriseIds[0], '后端架构师', '基础架构部', '互联网', '技术', 'P7', 8, 500000, 750000, '北京', 'Java,Spring Cloud,K8s,分布式', '负责核心系统架构演进', '8年后端经验，精通分布式系统设计', '技术氛围好,开源鼓励', 'published', now],
    [enterpriseIds[3], '数据分析师', '数据部', '医疗健康', '数据', 'P5', 2, 250000, 380000, '杭州', 'Python,SQL,Tableau,机器学习', '负责业务数据分析和洞察', '2年以上数据分析经验', '工作生活平衡,培训机会', 'published', now],
    [enterpriseIds[4], 'DevOps工程师', '运维部', '智能制造', '技术', 'P6', 4, 350000, 500000, '广州', 'Docker,K8s,CI/CD,AWS', '负责基础设施和CI/CD建设', '4年以上DevOps经验', '制造业转型红利,稳定发展', 'published', now],
    [enterpriseIds[1], 'UX设计主管', '设计中心', '人工智能', '设计', 'P6', 5, 380000, 550000, '上海', 'Figma,设计系统,交互设计', '负责AI产品设计体系搭建', '5年以上设计经验，有设计系统经历', '设计文化浓厚,弹性时间', 'published', now],
    [enterpriseIds[2], '全栈工程师', '创新实验室', '金融科技', '技术', 'P5', 3, 300000, 450000, '深圳', 'React,Go,PostgreSQL,GraphQL', '负责创新项目全栈开发', '3年以上全栈经验', '创新项目奖,灵活办公', 'published', now],
  ]
  const jobIds = jobs.map((j) => insertJob.run(...j).lastInsertRowid)

  const insertHeadhunter = db.prepare(`
    INSERT INTO headhunters (name, email, phone, specialty_industry, specialty_function, experience_years, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const headhunters = [
    ['林晓东', 'linxd@headhunt.com', '150****9001', '互联网', '技术', 8, 4.8],
    ['郑雅文', 'zhengyw@headhunt.com', '151****9002', '金融科技', '产品/技术', 6, 4.5],
  ]
  const headhunterIds = headhunters.map((h) => insertHeadhunter.run(...h).lastInsertRowid)

  const insertCommunication = db.prepare(`
    INSERT INTO communications (headhunter_id, candidate_id, comm_type, content, summary, sentiment, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const comms = [
    [headhunterIds[0], candidateIds[0], 'phone', '与张伟明电话沟通，了解其求职意向和期望薪资。候选人对微前端架构方向有强烈兴趣，期望薪资范围45-60万，倾向北京地区。目前在职但愿意看新机会，希望能带团队。', '求职意向明确，期望45-60万，倾向北京微前端方向', 'positive', now],
    [headhunterIds[0], candidateIds[3], 'wechat', '微信沟通陈志豪的求职意向，候选人对架构师岗位感兴趣，但对异地工作有顾虑。目前在北京很稳定，但愿意考虑更有挑战的机会。', '对架构师岗位有兴趣，异地是顾虑因素', 'neutral', now],
    [headhunterIds[1], candidateIds[2], 'video', '视频面试王雪晴，深入了解其产品理念和团队管理经验。候选人表达了对金融科技领域的强烈热情，期望更高的管理权限。', '金融科技热情高，期望更高管理权限', 'positive', now],
  ]
  comms.forEach((c) => insertCommunication.run(...c))

  const insertFollowup = db.prepare(`
    INSERT INTO followups (headhunter_id, candidate_id, job_id, plan_text, scheduled_at, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const followups = [
    [headhunterIds[0], candidateIds[0], jobIds[0], '安排星辰科技前端架构师岗位面试', '2026-06-05T10:00:00Z', 'pending'],
    [headhunterIds[0], candidateIds[3], jobIds[3], '跟进陈志豪异地工作意向', '2026-06-03T14:00:00Z', 'pending'],
    [headhunterIds[1], candidateIds[2], jobIds[2], '安排瑞峰金融产品总监终面', '2026-06-07T15:00:00Z', 'pending'],
  ]
  followups.forEach((f) => insertFollowup.run(...f))

  const insertInterview = db.prepare(`
    INSERT INTO interviews (candidate_id, job_id, interviewer_name, interview_type, scheduled_at, status, location)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const interviews = [
    [candidateIds[1], jobIds[1], '张博士', '技术面试', '2026-06-04T10:00:00Z', 'scheduled', '云帆数据上海总部'],
    [candidateIds[4], jobIds[4], '李总监', 'HR面试', '2026-06-06T14:00:00Z', 'scheduled', '明远医疗线上面试'],
    [candidateIds[5], jobIds[5], '王工', '技术面试', '2026-06-05T11:00:00Z', 'completed', '智造工场广州总部'],
  ]
  const interviewIds = interviews.map((i) => insertInterview.run(...i).lastInsertRowid)

  const insertEvaluation = db.prepare(`
    INSERT INTO evaluations (interview_id, technical_skill, communication, project_experience, cultural_fit, overall_score, recommendation, detailed_feedback)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const evals = [
    [interviewIds[2], 4, 3, 3, 4, 3.5, 'recommend', '技术基础扎实，运维经验丰富，与团队文化匹配度较高'],
  ]
  evals.forEach((e) => insertEvaluation.run(...e))

  const insertFunnel = db.prepare(`
    INSERT INTO funnel_stages (job_id, stage_name, candidate_count, conversion_rate, avg_days_in_stage, drop_reason)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const funnels = [
    [jobIds[0], '职位发布', 156, 1.0, 0, null],
    [jobIds[0], '简历收取', 89, 0.57, 3.2, null],
    [jobIds[0], '简历筛选', 34, 0.38, 2.1, '技能不匹配42%,薪资不匹配35%'],
    [jobIds[0], '面试邀约', 18, 0.53, 1.5, '候选人拒面28%'],
    [jobIds[0], '面试进行', 8, 0.44, 5.3, '技术不达标40%,文化不匹配25%'],
    [jobIds[0], 'Offer发放', 3, 0.38, 2.0, '薪资谈判失败50%'],
    [jobIds[0], '入职确认', 2, 0.67, 1.0, null],
    [jobIds[1], '职位发布', 98, 1.0, 0, null],
    [jobIds[1], '简历收取', 52, 0.53, 4.0, null],
    [jobIds[1], '简历筛选', 21, 0.40, 2.5, '论文不足50%,方向不匹配30%'],
    [jobIds[1], '面试邀约', 12, 0.57, 1.8, '候选人拒面20%'],
    [jobIds[1], '面试进行', 5, 0.42, 6.0, '算法能力不足60%'],
    [jobIds[1], 'Offer发放', 2, 0.40, 3.0, '薪资谈判失败40%'],
    [jobIds[1], '入职确认', 1, 0.50, 1.5, null],
  ]
  funnels.forEach((f) => insertFunnel.run(...f))

  const insertCampusSchedule = db.prepare(`
    INSERT INTO campus_schedules (university_name, event_type, event_date, location, contact_person, description, attendees_count, resumes_received, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const schedules = [
    ['清华大学', '宣讲会', '2026-09-15', '清华大学主楼报告厅', '王老师', '2027届校招技术岗宣讲', 120, 45, 'planned'],
    ['北京大学', '笔试', '2026-09-20', '北京大学理工楼', '李老师', '技术岗在线笔试', 85, 32, 'planned'],
    ['浙江大学', '宣讲会', '2026-09-25', '浙大玉泉校区', '陈老师', '产品&设计岗宣讲', 95, 38, 'ongoing'],
    ['上海交通大学', '面试日', '2026-10-10', '交大闵行校区', '赵老师', 'AI算法岗专场面试', 60, 22, 'completed'],
  ]
  schedules.forEach((s) => insertCampusSchedule.run(...s))

  const insertInternship = db.prepare(`
    INSERT INTO internships (candidate_id, job_id, university, major, start_date, end_date, mentor_name, conversion_status, conversion_probability, performance_rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const internData = [
    [candidateIds[4], jobIds[4], '浙江大学', '统计学', '2025-07-01', '2026-06-30', '孙总监', 'under_review', 0.72, 4.2],
    [candidateIds[7], jobIds[7], '华中科技大学', '计算机科学', '2025-09-01', '2026-08-31', '周经理', 'pending', 0.55, 3.8],
  ]
  internData.forEach((i) => insertInternship.run(...i))

  const insertAmbassador = db.prepare(`
    INSERT INTO ambassadors (name, university, email, phone, status, total_tasks, completed_tasks, reward_points)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const ambassadors = [
    ['刘天宇', '清华大学', 'liuty@tsinghua.edu.cn', '186****5001', 'active', 5, 4, 200],
    ['陈佳怡', '北京大学', 'chenjy@pku.edu.cn', '186****5002', 'active', 3, 2, 80],
    ['王思远', '浙江大学', 'wangsy@zju.edu.cn', '186****5003', 'active', 2, 1, 40],
  ]
  const ambassadorIds = ambassadors.map((a) => insertAmbassador.run(...a).lastInsertRowid)

  const insertAmbassadorTask = db.prepare(`
    INSERT INTO ambassador_tasks (ambassador_id, task_type, task_title, description, deadline, reward_points, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const ambTasks = [
    [ambassadorIds[0], 'promotion', '校园宣传海报张贴', '在院系公告栏张贴校招宣传海报', '2026-09-01', 30, 'completed'],
    [ambassadorIds[0], 'referral', '推荐3名技术岗候选人', '推荐符合条件的同学参加技术岗校招', '2026-09-30', 60, 'in_progress'],
    [ambassadorIds[1], 'event_support', '宣讲会现场支持', '协助布置宣讲会场地和签到', '2026-09-20', 40, 'assigned'],
    [ambassadorIds[2], 'content', '撰写校招体验文章', '分享实习/校招经历文章', '2026-09-15', 50, 'assigned'],
  ]
  ambTasks.forEach((t) => insertAmbassadorTask.run(...t))

  const insertAIDataset = db.prepare(`
    INSERT INTO ai_datasets (name, description, category, record_count, quality_score, status, data_scope)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const datasets = [
    ['技术面试问答集', '软件工程师技术面试问答数据', '技术面试', 12500, 4.5, 'active', '互联网行业'],
    ['行为面试评估集', '基于STAR法则的行为面试问答', '行为面试', 8200, 4.2, 'active', '跨行业'],
    ['系统设计面试集', '系统设计面试场景和评估标准', '系统设计', 5600, 4.7, 'active', '技术岗'],
  ]
  datasets.forEach((d) => insertAIDataset.run(...d))

  const insertSalary = db.prepare(`
    INSERT INTO salary_benchmarks (industry, function_type, career_level, location, p25, p50, p75, p90, effective_date, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const salaries = [
    ['互联网', '技术', 'P5', '北京', 280000, 350000, 420000, 500000, '2026-01', '行业调研'],
    ['互联网', '技术', 'P6', '北京', 380000, 460000, 550000, 650000, '2026-01', '行业调研'],
    ['互联网', '技术', 'P7', '北京', 500000, 600000, 750000, 900000, '2026-01', '行业调研'],
    ['互联网', '技术', 'P8', '北京', 700000, 850000, 1050000, 1300000, '2026-01', '行业调研'],
    ['人工智能', '技术', 'P6', '上海', 400000, 500000, 620000, 750000, '2026-01', '行业调研'],
    ['人工智能', '技术', 'P7', '上海', 550000, 680000, 850000, 1000000, '2026-01', '行业调研'],
    ['金融科技', '产品', 'P6', '深圳', 350000, 430000, 520000, 620000, '2026-01', '行业调研'],
    ['金融科技', '产品', 'P7', '深圳', 480000, 580000, 700000, 850000, '2026-01', '行业调研'],
    ['金融科技', '产品', 'P8', '深圳', 650000, 800000, 980000, 1200000, '2026-01', '行业调研'],
    ['医疗健康', '数据', 'P5', '杭州', 220000, 280000, 340000, 400000, '2026-01', '行业调研'],
    ['智能制造', '技术', 'P6', '广州', 300000, 380000, 460000, 550000, '2026-01', '行业调研'],
  ]
  salaries.forEach((s) => insertSalary.run(...s))

  const insertPrivacy = db.prepare(`
    INSERT INTO privacy_rules (field_name, rule_type, pattern, replacement, enabled)
    VALUES (?, ?, ?, ?, ?)
  `)
  const privacyRules = [
    ['phone', 'mask', '(\\d{3})\\d{4}(\\d{4})', '$1****$2', 1],
    ['email', 'mask', '(\\w{2})\\w+(@\\w+)', '$1***$2', 1],
    ['current_company', 'hash', null, null, 0],
  ]
  privacyRules.forEach((p) => insertPrivacy.run(...p))

  console.log('Database seeded successfully')
}

export function getOverview() {
  const candidateCount = db.prepare('SELECT COUNT(*) AS count FROM candidates').get().count
  const jobCount = db.prepare('SELECT COUNT(*) AS count FROM jobs WHERE status = ?').get('published').count
  const matchCount = db.prepare('SELECT COUNT(*) AS count FROM match_results').get().count
  const interviewCount = db.prepare('SELECT COUNT(*) AS count FROM interviews').get().count
  const pendingFollowups = db.prepare("SELECT COUNT(*) AS count FROM followups WHERE status = 'pending'").get().count
  const enterpriseCount = db.prepare('SELECT COUNT(*) AS count FROM enterprises').get().count

  return {
    project: process.env.PROJECT_NAME || 'may-88839',
    generatedAt: new Date().toISOString(),
    summary: {
      candidates: candidateCount,
      activeJobs: jobCount,
      matchResults: matchCount,
      interviews: interviewCount,
      pendingFollowups,
      enterprises: enterpriseCount,
    },
  }
}
