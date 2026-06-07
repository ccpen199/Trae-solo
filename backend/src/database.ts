import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('jobseeker', 'hr', 'admin')),
      name TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobseekers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      gender TEXT,
      birth_date DATE,
      education TEXT,
      experience_years INTEGER DEFAULT 0,
      expected_salary_min INTEGER,
      expected_salary_max INTEGER,
      expected_city TEXT,
      resume TEXT,
      skills TEXT,
      certificates TEXT,
      portfolio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      license_no TEXT UNIQUE,
      industry TEXT,
      scale TEXT,
      address TEXT,
      address_lat REAL,
      address_lng REAL,
      province TEXT,
      city TEXT,
      district TEXT,
      street TEXT,
      verified INTEGER DEFAULT 0,
      social_security_verified INTEGER DEFAULT 0,
      description TEXT,
      logo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hr_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      position TEXT,
      permission_level TEXT DEFAULT 'normal' CHECK(permission_level IN ('normal', 'manager', 'admin')),
      verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      hr_id INTEGER NOT NULL REFERENCES hr_users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      industry TEXT NOT NULL,
      category TEXT,
      description TEXT,
      requirements TEXT,
      skills TEXT,
      salary_min INTEGER NOT NULL,
      salary_max INTEGER NOT NULL,
      salary_negotiable INTEGER DEFAULT 0,
      province TEXT,
      city TEXT,
      district TEXT,
      street TEXT,
      address TEXT,
      address_lat REAL,
      address_lng REAL,
      work_type TEXT DEFAULT 'fulltime',
      experience_required TEXT,
      education_required TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'closed', 'rejected')),
      authenticity_score INTEGER DEFAULT 0,
      verified INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      apply_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      jobseeker_id INTEGER NOT NULL REFERENCES jobseekers(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'viewed', 'interview', 'offer', 'rejected', 'hired')),
      resume_snapshot TEXT,
      hr_remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(job_id, jobseeker_id)
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      jobseeker_id INTEGER NOT NULL REFERENCES jobseekers(id) ON DELETE CASCADE,
      hr_id INTEGER NOT NULL REFERENCES hr_users(id) ON DELETE CASCADE,
      scheduled_at DATETIME,
      duration INTEGER DEFAULT 60,
      type TEXT DEFAULT 'onsite' CHECK(type IN ('onsite', 'video', 'phone')),
      video_url TEXT,
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'reschedule_requested')),
      ai_screening_report TEXT,
      proposed_time DATETIME,
      feedback TEXT,
      rating INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blacklist_companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER UNIQUE NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      reported_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('job', 'company', 'user')),
      target_id INTEGER NOT NULL,
      reporter_id INTEGER REFERENCES users(id),
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'resolved', 'rejected')),
      handler_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skill_weights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobseeker_id INTEGER NOT NULL REFERENCES jobseekers(id) ON DELETE CASCADE,
      skill TEXT NOT NULL,
      weight REAL DEFAULT 0,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(jobseeker_id, skill)
    );

    CREATE TABLE IF NOT EXISTS job_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      jobseeker_id INTEGER NOT NULL REFERENCES jobseekers(id) ON DELETE CASCADE,
      match_score REAL NOT NULL,
      skill_match REAL DEFAULT 0,
      salary_match REAL DEFAULT 0,
      location_match REAL DEFAULT 0,
      experience_match REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(job_id, jobseeker_id)
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_industry ON jobs(industry);
    CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city);
    CREATE INDEX IF NOT EXISTS idx_jobs_salary ON jobs(salary_min, salary_max);
    CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
    CREATE INDEX IF NOT EXISTS idx_applications_jobseeker ON applications(jobseeker_id);
    CREATE INDEX IF NOT EXISTS idx_interviews_jobseeker ON interviews(jobseeker_id);
    CREATE INDEX IF NOT EXISTS idx_interviews_hr ON interviews(hr_id);
    CREATE INDEX IF NOT EXISTS idx_job_matches_score ON job_matches(match_score DESC);
  `);

  const interviewColumns = db.prepare("PRAGMA table_info(interviews)").all() as { name: string }[];
  if (!interviewColumns.some(col => col.name === 'proposed_time')) {
    db.exec('ALTER TABLE interviews ADD COLUMN proposed_time DATETIME');
  }

  const reportColumns = db.prepare("PRAGMA table_info(reports)").all() as { name: string }[];
  if (!reportColumns.some(col => col.name === 'handling_notes')) {
    db.exec('ALTER TABLE reports ADD COLUMN handling_notes TEXT');
  }

  const interviewSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='interviews'").get() as { sql: string } | undefined;
  if (interviewSchema && !interviewSchema.sql.includes('reschedule_requested')) {
    db.exec(`
      CREATE TABLE interviews_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
        job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        jobseeker_id INTEGER NOT NULL REFERENCES jobseekers(id) ON DELETE CASCADE,
        hr_id INTEGER NOT NULL REFERENCES hr_users(id) ON DELETE CASCADE,
        scheduled_at DATETIME,
        duration INTEGER DEFAULT 60,
        type TEXT DEFAULT 'onsite' CHECK(type IN ('onsite', 'video', 'phone')),
        video_url TEXT,
        status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'reschedule_requested')),
        ai_screening_report TEXT,
        proposed_time DATETIME,
        feedback TEXT,
        rating INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO interviews_new SELECT * FROM interviews;
      DROP TABLE interviews;
      ALTER TABLE interviews_new RENAME TO interviews;
    `);
  }

  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount > 0) return;

  const hashedPassword = bcrypt.hashSync('test123', 10);

  db.transaction(() => {
    const insertUser = db.prepare(
      'INSERT INTO users (phone, password, role, name) VALUES (?, ?, ?, ?)'
    );
    const insertCompany = db.prepare(
      'INSERT INTO companies (name, license_no, industry, scale, address, province, city, district, street, verified, social_security_verified, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const insertJobseeker = db.prepare(
      'INSERT INTO jobseekers (user_id, gender, birth_date, education, experience_years, expected_salary_min, expected_salary_max, expected_city, skills) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const insertHrUser = db.prepare(
      'INSERT INTO hr_users (user_id, company_id, position, permission_level, verified) VALUES (?, ?, ?, ?, ?)'
    );
    const insertJob = db.prepare(
      `INSERT INTO jobs (company_id, hr_id, title, industry, category, description, requirements, skills, salary_min, salary_max, salary_negotiable, province, city, district, street, address, work_type, experience_required, education_required, status, authenticity_score, verified, view_count, apply_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertApplication = db.prepare(
      'INSERT INTO applications (job_id, jobseeker_id, status, hr_remark) VALUES (?, ?, ?, ?)'
    );
    const insertInterview = db.prepare(
      'INSERT INTO interviews (application_id, job_id, jobseeker_id, hr_id, scheduled_at, duration, type, status, feedback, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const insertSkillWeight = db.prepare(
      'INSERT INTO skill_weights (jobseeker_id, skill, weight, source) VALUES (?, ?, ?, ?)'
    );
    const insertReport = db.prepare(
      'INSERT INTO reports (type, target_id, reporter_id, reason, description, status, handler_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    insertUser.run('13800000000', hashedPassword, 'admin', '系统管理员');

    const companies = [
      { name: '智联科技', license_no: '91440300MA5F1A2B3C', industry: 'internet', scale: '500-1000人', address: '深圳市南山区科技园南区T2栋', province: '广东省', city: '深圳', district: '南山区', street: '科技园南路', description: '专注于人工智能和大数据解决方案的互联网科技公司，为各行业提供智能化升级服务。' },
      { name: '华创制造', license_no: '91440100MA5C2D3E4F', industry: 'manufacturing', scale: '1000-5000人', address: '广州市黄埔区开发区大道188号', province: '广东省', city: '广州', district: '黄埔区', street: '开发区大道', description: '国内领先的精密制造企业，专注于汽车零部件和工业自动化设备生产。' },
      { name: '顺心物流', license_no: '91310100MA5G3H4I5J', industry: 'logistics', scale: '5000-10000人', address: '上海市浦东新区物流园A区', province: '上海市', city: '上海', district: '浦东新区', street: '物流园大道', description: '全国性综合物流服务商，涵盖仓储、运输、配送全链条服务。' },
      { name: '鑫鹏建筑', license_no: '91110100MA5H4J5K6L', industry: 'construction', scale: '2000-5000人', address: '北京市朝阳区建外大街甲6号', province: '北京市', city: '北京', district: '朝阳区', street: '建外大街', description: '国家一级建筑资质企业，承接大型商业综合体和市政工程项目。' },
      { name: '瑞丰金融', license_no: '91310100MA5I5K6L7M', industry: 'finance', scale: '500-1000人', address: '上海市浦东新区陆家嘴环路1088号', province: '上海市', city: '上海', district: '浦东新区', street: '陆家嘴环路', description: '持牌金融服务机构，提供投资银行、资产管理、财富管理综合金融服务。' },
      { name: '明德教育', license_no: '91330100MA5J6L7M8N', industry: 'education', scale: '200-500人', address: '杭州市西湖区文三路398号', province: '浙江省', city: '杭州', district: '西湖区', street: '文三路', description: '知名在线教育平台，覆盖K12、职业培训、语言学习等多个教育领域。' },
      { name: '仁和医疗', license_no: '91510100MA5K7M8N9O', industry: 'medical', scale: '1000-2000人', address: '成都市武侯区人民南路四段36号', province: '四川省', city: '成都', district: '武侯区', street: '人民南路', description: '三级甲等综合医疗机构，集医疗、教学、科研为一体的大型医疗集团。' },
      { name: '万达零售', license_no: '91440100MA5L8N9O0P', industry: 'retail', scale: '10000人以上', address: '广州市天河区体育西路191号', province: '广东省', city: '广州', district: '天河区', street: '体育西路', description: '大型连锁零售集团，经营超市、百货、便利店等多业态零售业务。' },
      { name: '恒达服务', license_no: '91440300MA5M9O0P1Q', industry: 'service', scale: '200-500人', address: '深圳市福田区华强北路赛格广场', province: '广东省', city: '深圳', district: '福田区', street: '华强北路', description: '专业商务服务公司，提供企业咨询、人力资源外包、物业管理等服务。' },
    ];

    const companyIds: number[] = [];
    for (const c of companies) {
      const result = insertCompany.run(
        c.name, c.license_no, c.industry, c.scale, c.address,
        c.province, c.city, c.district, c.street, 1, 1, c.description
      );
      companyIds.push(result.lastInsertRowid as number);
    }

    const hrData = [
      { phone: '13900002001', name: '张丽华', position: '人力资源总监', companyIdx: 0 },
      { phone: '13900002002', name: '李建国', position: '人事经理', companyIdx: 1 },
      { phone: '13900002003', name: '王秀英', position: '招聘主管', companyIdx: 2 },
      { phone: '13900002004', name: '陈志强', position: '综合管理部经理', companyIdx: 3 },
      { phone: '13900002005', name: '刘美玲', position: '人才发展总监', companyIdx: 4 },
      { phone: '13900002006', name: '赵文博', position: '人事行政经理', companyIdx: 5 },
      { phone: '13900002007', name: '孙晓燕', position: '人力资源部长', companyIdx: 6 },
      { phone: '13900002008', name: '周明辉', position: '招聘总监', companyIdx: 7 },
      { phone: '13900002009', name: '吴静怡', position: '人事主管', companyIdx: 8 },
    ];

    const hrUserIds: number[] = [];
    const hrIds: number[] = [];
    for (const hr of hrData) {
      const userResult = insertUser.run(hr.phone, hashedPassword, 'hr', hr.name);
      const userId = userResult.lastInsertRowid as number;
      hrUserIds.push(userId);
      const hrResult = insertHrUser.run(userId, companyIds[hr.companyIdx], hr.position, 'manager', 1);
      hrIds.push(hrResult.lastInsertRowid as number);
    }

    const jobsData = [
      {
        companyIdx: 0, hrIdx: 0, title: 'Java开发工程师', industry: 'internet', category: '技术研发',
        description: '负责公司核心业务系统的后端开发与维护，参与系统架构设计和性能优化。', requirements: '3年以上Java开发经验，熟悉Spring生态，有大型系统开发经验优先。',
        skills: '["Java","Spring Boot","MySQL","Redis"]', salary_min: 15000, salary_max: 30000, salary_negotiable: 0,
        province: '广东省', city: '深圳', district: '南山区', street: '科技园南路',
        address: '深圳市南山区科技园南区T2栋12楼', work_type: 'fulltime', experience_required: '3-5年', education_required: '本科',
        authenticity_score: 92, view_count: 356, apply_count: 48
      },
      {
        companyIdx: 0, hrIdx: 0, title: '前端开发工程师', industry: 'internet', category: '技术研发',
        description: '负责公司产品Web端和移动端的开发工作，与设计和后端团队紧密配合。', requirements: '2年以上前端开发经验，熟练使用React或Vue框架。',
        skills: '["React","TypeScript","Vue","Webpack"]', salary_min: 12000, salary_max: 25000, salary_negotiable: 0,
        province: '广东省', city: '深圳', district: '南山区', street: '科技园南路',
        address: '深圳市南山区科技园南区T2栋12楼', work_type: 'fulltime', experience_required: '2-4年', education_required: '本科',
        authenticity_score: 90, view_count: 289, apply_count: 37
      },
      {
        companyIdx: 0, hrIdx: 0, title: 'UI设计师', industry: 'internet', category: '设计',
        description: '负责公司产品的视觉设计，包括Web端和移动端界面设计、图标设计等。', requirements: '3年以上UI设计经验，有成熟的商业项目作品。',
        skills: '["Figma","Sketch","Photoshop","Illustrator"]', salary_min: 10000, salary_max: 20000, salary_negotiable: 0,
        province: '广东省', city: '深圳', district: '南山区', street: '科技园南路',
        address: '深圳市南山区科技园南区T2栋12楼', work_type: 'fulltime', experience_required: '2-5年', education_required: '大专',
        authenticity_score: 88, view_count: 198, apply_count: 25
      },
      {
        companyIdx: 1, hrIdx: 1, title: '数控操作工', industry: 'manufacturing', category: '生产制造',
        description: '负责数控机床的操作、调试和日常维护，确保产品质量达到标准。', requirements: '持有数控操作证书，2年以上数控操作经验，能看懂图纸。',
        skills: '["数控编程","数控操作","看图纸","质量检测"]', salary_min: 8000, salary_max: 15000, salary_negotiable: 0,
        province: '广东省', city: '广州', district: '黄埔区', street: '开发区大道',
        address: '广州市黄埔区开发区大道188号B厂区', work_type: 'fulltime', experience_required: '2-5年', education_required: '中专',
        authenticity_score: 85, view_count: 167, apply_count: 32
      },
      {
        companyIdx: 1, hrIdx: 1, title: '电焊工', industry: 'manufacturing', category: '生产制造',
        description: '负责金属构件的焊接工作，按工艺要求完成各类焊接作业。', requirements: '持有焊工操作证，3年以上焊接经验，熟练氩弧焊和二保焊。',
        skills: '["电焊","氩弧焊","看图纸","安全操作"]', salary_min: 7000, salary_max: 13000, salary_negotiable: 0,
        province: '广东省', city: '广州', district: '黄埔区', street: '开发区大道',
        address: '广州市黄埔区开发区大道188号A厂区', work_type: 'fulltime', experience_required: '3-5年', education_required: '初中',
        authenticity_score: 82, view_count: 142, apply_count: 28
      },
      {
        companyIdx: 2, hrIdx: 2, title: '物流调度员', industry: 'logistics', category: '运营调度',
        description: '负责物流运输的调度协调工作，合理安排车辆和路线，确保时效。', requirements: '1年以上物流调度经验，熟悉珠三角路线，会用调度系统。',
        skills: '["物流调度","路线规划","ERP系统","数据分析"]', salary_min: 6000, salary_max: 12000, salary_negotiable: 0,
        province: '上海市', city: '上海', district: '浦东新区', street: '物流园大道',
        address: '上海市浦东新区物流园A区3号楼', work_type: 'fulltime', experience_required: '1-3年', education_required: '大专',
        authenticity_score: 87, view_count: 203, apply_count: 19
      },
      {
        companyIdx: 2, hrIdx: 2, title: '仓库管理员', industry: 'logistics', category: '仓储管理',
        description: '负责仓库日常管理，包括入库、出库、盘点及库存管理。', requirements: '有仓库管理经验，熟悉WMS系统，做事细致认真。',
        skills: '["仓库管理","WMS系统","库存盘点","叉车操作"]', salary_min: 5000, salary_max: 9000, salary_negotiable: 0,
        province: '上海市', city: '上海', district: '浦东新区', street: '物流园大道',
        address: '上海市浦东新区物流园A区5号仓', work_type: 'fulltime', experience_required: '1-3年', education_required: '高中',
        authenticity_score: 83, view_count: 178, apply_count: 22
      },
      {
        companyIdx: 2, hrIdx: 2, title: '叉车司机', industry: 'logistics', category: '仓储管理',
        description: '负责仓库内货物的搬运、装卸工作，保证货物安全及时流转。', requirements: '持有叉车操作证，2年以上叉车驾驶经验。',
        skills: '["叉车操作","货物搬运","安全规范","仓储流程"]', salary_min: 5500, salary_max: 10000, salary_negotiable: 0,
        province: '上海市', city: '上海', district: '浦东新区', street: '物流园大道',
        address: '上海市浦东新区物流园A区5号仓', work_type: 'fulltime', experience_required: '2-3年', education_required: '初中',
        authenticity_score: 80, view_count: 132, apply_count: 18
      },
      {
        companyIdx: 3, hrIdx: 3, title: '建筑施工员', industry: 'construction', category: '工程管理',
        description: '负责施工现场的管理协调，监督施工质量和进度，确保工程按期完成。', requirements: '5年以上建筑施工管理经验，持有施工员证书。',
        skills: '["施工管理","图纸审查","质量安全","进度管控"]', salary_min: 10000, salary_max: 20000, salary_negotiable: 0,
        province: '北京市', city: '北京', district: '朝阳区', street: '建外大街',
        address: '北京市朝阳区建外大街甲6号项目指挥部', work_type: 'fulltime', experience_required: '5-10年', education_required: '大专',
        authenticity_score: 86, view_count: 215, apply_count: 15
      },
      {
        companyIdx: 3, hrIdx: 3, title: '电工', industry: 'construction', category: '工程管理',
        description: '负责建筑施工现场的电气安装、调试和维护工作。', requirements: '持有电工证，3年以上建筑电工经验，熟悉强弱电施工。',
        skills: '["电工操作","强弱电","电气安装","安全规范"]', salary_min: 7000, salary_max: 14000, salary_negotiable: 0,
        province: '北京市', city: '北京', district: '朝阳区', street: '建外大街',
        address: '北京市朝阳区建外大街甲6号项目工地', work_type: 'fulltime', experience_required: '3-5年', education_required: '中专',
        authenticity_score: 81, view_count: 156, apply_count: 20
      },
      {
        companyIdx: 4, hrIdx: 4, title: '金融分析师', industry: 'finance', category: '金融分析',
        description: '负责行业研究和投资分析，撰写研究报告，为投资决策提供支持。', requirements: '硕士学历，金融相关专业，2年以上分析经验，持有CFA优先。',
        skills: '["财务分析","Python","Wind","Excel建模"]', salary_min: 20000, salary_max: 50000, salary_negotiable: 1,
        province: '上海市', city: '上海', district: '浦东新区', street: '陆家嘴环路',
        address: '上海市浦东新区陆家嘴环路1088号28楼', work_type: 'fulltime', experience_required: '2-5年', education_required: '硕士',
        authenticity_score: 95, view_count: 412, apply_count: 56
      },
      {
        companyIdx: 4, hrIdx: 4, title: '客户经理', industry: 'finance', category: '业务拓展',
        description: '负责高净值客户的开发与维护，提供专业的金融理财方案。', requirements: '3年以上金融行业客户服务经验，具备良好的沟通能力。',
        skills: '["客户关系","理财产品","风险控制","商务谈判"]', salary_min: 12000, salary_max: 35000, salary_negotiable: 0,
        province: '上海市', city: '上海', district: '浦东新区', street: '陆家嘴环路',
        address: '上海市浦东新区陆家嘴环路1088号18楼', work_type: 'fulltime', experience_required: '3-5年', education_required: '本科',
        authenticity_score: 93, view_count: 328, apply_count: 41
      },
      {
        companyIdx: 5, hrIdx: 5, title: '课程顾问', industry: 'education', category: '教育咨询',
        description: '负责学员课程咨询和销售转化，根据学员需求推荐合适的课程方案。', requirements: '1年以上教育行业销售经验，亲和力强，目标感明确。',
        skills: '["课程咨询","销售转化","客户维护","教育产品"]', salary_min: 8000, salary_max: 18000, salary_negotiable: 0,
        province: '浙江省', city: '杭州', district: '西湖区', street: '文三路',
        address: '杭州市西湖区文三路398号明德大厦5楼', work_type: 'fulltime', experience_required: '1-3年', education_required: '大专',
        authenticity_score: 84, view_count: 187, apply_count: 29
      },
      {
        companyIdx: 5, hrIdx: 5, title: '电商运营', industry: 'education', category: '运营推广',
        description: '负责公司在线教育平台的电商运营，包括活动策划、数据分析等。', requirements: '2年以上电商运营经验，熟悉主流电商平台运营规则。',
        skills: '["电商运营","数据分析","活动策划","SEO优化"]', salary_min: 8000, salary_max: 16000, salary_negotiable: 0,
        province: '浙江省', city: '杭州', district: '西湖区', street: '文三路',
        address: '杭州市西湖区文三路398号明德大厦8楼', work_type: 'fulltime', experience_required: '2-4年', education_required: '本科',
        authenticity_score: 86, view_count: 201, apply_count: 26
      },
      {
        companyIdx: 6, hrIdx: 6, title: '护理员', industry: 'medical', category: '医疗护理',
        description: '负责病区的日常护理工作，包括病人护理、生命体征监测等。', requirements: '护理专业毕业，持有护士执业证书，1年以上临床护理经验。',
        skills: '["临床护理","生命体征监测","医嘱执行","急救技能"]', salary_min: 6000, salary_max: 12000, salary_negotiable: 0,
        province: '四川省', city: '成都', district: '武侯区', street: '人民南路',
        address: '成都市武侯区人民南路四段36号仁和医院', work_type: 'fulltime', experience_required: '1-3年', education_required: '大专',
        authenticity_score: 89, view_count: 245, apply_count: 34
      },
      {
        companyIdx: 7, hrIdx: 7, title: '销售专员', industry: 'retail', category: '销售',
        description: '负责门店商品的销售和顾客服务，完成销售目标。', requirements: '有零售行业销售经验，沟通能力强，服务意识好。',
        skills: '["销售技巧","客户服务","商品陈列","收银系统"]', salary_min: 5000, salary_max: 12000, salary_negotiable: 0,
        province: '广东省', city: '广州', district: '天河区', street: '体育西路',
        address: '广州市天河区体育西路191号万达广场', work_type: 'fulltime', experience_required: '1-2年', education_required: '高中',
        authenticity_score: 78, view_count: 267, apply_count: 45
      },
      {
        companyIdx: 7, hrIdx: 7, title: '厨师', industry: 'retail', category: '餐饮',
        description: '负责门店餐饮区域的菜品制作，保证出品质量和食品安全。', requirements: '3年以上厨师经验，持有健康证和厨师证，会多种菜系优先。',
        skills: '["中式烹饪","西式料理","食品安全","厨房管理"]', salary_min: 7000, salary_max: 15000, salary_negotiable: 0,
        province: '广东省', city: '广州', district: '天河区', street: '体育西路',
        address: '广州市天河区体育西路191号万达广场B1层', work_type: 'fulltime', experience_required: '3-5年', education_required: '初中',
        authenticity_score: 76, view_count: 189, apply_count: 30
      },
      {
        companyIdx: 8, hrIdx: 8, title: '人事专员', industry: 'service', category: '人力资源',
        description: '负责员工招聘、入离职办理、考勤管理等人事基础工作。', requirements: '1年以上人事工作经验，熟悉劳动法规，做事细致。',
        skills: '["招聘管理","劳动法规","考勤管理","员工关系"]', salary_min: 6000, salary_max: 11000, salary_negotiable: 0,
        province: '广东省', city: '深圳', district: '福田区', street: '华强北路',
        address: '深圳市福田区华强北路赛格广场18楼', work_type: 'fulltime', experience_required: '1-3年', education_required: '本科',
        authenticity_score: 87, view_count: 223, apply_count: 31
      },
      {
        companyIdx: 8, hrIdx: 8, title: '会计', industry: 'service', category: '财务',
        description: '负责公司日常账务处理、税务申报及财务报表编制。', requirements: '持有会计从业资格证，2年以上会计工作经验，熟悉用友或金蝶软件。',
        skills: '["会计核算","税务申报","金蝶软件","财务报表"]', salary_min: 7000, salary_max: 13000, salary_negotiable: 0,
        province: '广东省', city: '深圳', district: '福田区', street: '华强北路',
        address: '深圳市福田区华强北路赛格广场20楼', work_type: 'fulltime', experience_required: '2-5年', education_required: '本科',
        authenticity_score: 91, view_count: 198, apply_count: 24
      },
      {
        companyIdx: 0, hrIdx: 0, title: '安防工程师', industry: 'internet', category: '技术研发',
        description: '负责公司信息安全体系建设，包括安全审计、漏洞修复、应急响应等。', requirements: '3年以上信息安全工作经验，熟悉常见安全攻防技术。',
        skills: '["网络安全","渗透测试","安全审计","应急响应"]', salary_min: 18000, salary_max: 35000, salary_negotiable: 1,
        province: '广东省', city: '深圳', district: '南山区', street: '科技园南路',
        address: '深圳市南山区科技园南区T2栋15楼', work_type: 'fulltime', experience_required: '3-5年', education_required: '本科',
        authenticity_score: 94, view_count: 176, apply_count: 22
      },
    ];

    const jobIds: number[] = [];
    for (const j of jobsData) {
      const result = insertJob.run(
        companyIds[j.companyIdx], hrIds[j.hrIdx], j.title, j.industry, j.category,
        j.description, j.requirements, j.skills, j.salary_min, j.salary_max, j.salary_negotiable,
        j.province, j.city, j.district, j.street, j.address, j.work_type,
        j.experience_required, j.education_required, 'active', j.authenticity_score, 1, j.view_count, j.apply_count
      );
      jobIds.push(result.lastInsertRowid as number);
    }

    const seekerData = [
      { phone: '13900001001', name: '王小明', gender: '男', birth_date: '1995-03-15', education: '本科', experience_years: 3, salary_min: 12000, salary_max: 25000, city: '深圳', skills: '["Java","Spring Boot","MySQL","Git"]' },
      { phone: '13900001002', name: '李小红', gender: '女', birth_date: '1997-07-22', education: '本科', experience_years: 2, salary_min: 10000, salary_max: 20000, city: '深圳', skills: '["React","TypeScript","CSS","Node.js"]' },
      { phone: '13900001003', name: '张大伟', gender: '男', birth_date: '1990-11-08', education: '大专', experience_years: 5, salary_min: 8000, salary_max: 15000, city: '广州', skills: '["数控编程","数控操作","看图纸","质量检测"]' },
      { phone: '13900001004', name: '刘美华', gender: '女', birth_date: '1993-05-18', education: '硕士', experience_years: 4, salary_min: 20000, salary_max: 40000, city: '上海', skills: '["财务分析","Python","Wind","Excel建模"]' },
      { phone: '13900001005', name: '陈志远', gender: '男', birth_date: '1988-09-30', education: '高中', experience_years: 8, salary_min: 6000, salary_max: 12000, city: '上海', skills: '["叉车操作","仓库管理","货物搬运","安全规范"]' },
      { phone: '13900001006', name: '赵雅琴', gender: '女', birth_date: '1996-01-12', education: '大专', experience_years: 3, salary_min: 7000, salary_max: 13000, city: '成都', skills: '["临床护理","生命体征监测","急救技能","医嘱执行"]' },
      { phone: '13900001007', name: '周鹏飞', gender: '男', birth_date: '1992-06-25', education: '本科', experience_years: 6, salary_min: 15000, salary_max: 30000, city: '北京', skills: '["施工管理","图纸审查","质量安全","进度管控"]' },
    ];

    const seekerUserIds: number[] = [];
    const seekerIds: number[] = [];
    for (const s of seekerData) {
      const userResult = insertUser.run(s.phone, hashedPassword, 'jobseeker', s.name);
      const userId = userResult.lastInsertRowid as number;
      seekerUserIds.push(userId);
      const seekerResult = insertJobseeker.run(
        userId, s.gender, s.birth_date, s.education, s.experience_years,
        s.salary_min, s.salary_max, s.city, s.skills
      );
      seekerIds.push(seekerResult.lastInsertRowid as number);
    }

    const applicationsData = [
      { jobIdx: 0, seekerIdx: 0, status: 'interview', remark: '技术能力扎实，安排面试' },
      { jobIdx: 1, seekerIdx: 1, status: 'viewed', remark: '简历已查看' },
      { jobIdx: 3, seekerIdx: 2, status: 'pending', remark: null },
      { jobIdx: 10, seekerIdx: 3, status: 'interview', remark: '分析能力强，预约面试' },
      { jobIdx: 6, seekerIdx: 4, status: 'pending', remark: null },
      { jobIdx: 14, seekerIdx: 5, status: 'offer', remark: '护理经验丰富，发放Offer' },
      { jobIdx: 8, seekerIdx: 6, status: 'viewed', remark: '施工经验匹配' },
      { jobIdx: 0, seekerIdx: 1, status: 'rejected', remark: '技术栈不匹配' },
      { jobIdx: 16, seekerIdx: 4, status: 'pending', remark: null },
      { jobIdx: 19, seekerIdx: 0, status: 'interview', remark: '有安全开发经验' },
    ];

    const applicationIds: number[] = [];
    for (const a of applicationsData) {
      const result = insertApplication.run(jobIds[a.jobIdx], seekerIds[a.seekerIdx], a.status, a.remark);
      applicationIds.push(result.lastInsertRowid as number);
    }

    const interviewsData = [
      { appIdx: 0, jobIdx: 0, seekerIdx: 0, hrIdx: 0, scheduled_at: '2026-06-10 10:00:00', duration: 90, type: 'onsite', status: 'confirmed', feedback: null, rating: null },
      { appIdx: 3, jobIdx: 10, seekerIdx: 3, hrIdx: 4, scheduled_at: '2026-06-12 14:00:00', duration: 60, type: 'video', status: 'scheduled', feedback: null, rating: null },
      { appIdx: 5, jobIdx: 14, seekerIdx: 5, hrIdx: 6, scheduled_at: '2026-06-05 09:30:00', duration: 45, type: 'onsite', status: 'completed', feedback: '专业素养好，沟通能力强', rating: 5 },
      { appIdx: 9, jobIdx: 19, seekerIdx: 0, hrIdx: 0, scheduled_at: '2026-06-15 15:00:00', duration: 60, type: 'video', status: 'scheduled', feedback: null, rating: null },
    ];

    for (const iv of interviewsData) {
      insertInterview.run(
        applicationIds[iv.appIdx], jobIds[iv.jobIdx], seekerIds[iv.seekerIdx], hrIds[iv.hrIdx],
        iv.scheduled_at, iv.duration, iv.type, iv.status, iv.feedback, iv.rating
      );
    }

    const skillWeightsData = [
      { seekerIdx: 0, skill: 'Java', weight: 0.95, source: 'resume' },
      { seekerIdx: 0, skill: 'Spring Boot', weight: 0.9, source: 'resume' },
      { seekerIdx: 0, skill: 'MySQL', weight: 0.85, source: 'resume' },
      { seekerIdx: 0, skill: '网络安全', weight: 0.7, source: 'assessment' },
      { seekerIdx: 1, skill: 'React', weight: 0.92, source: 'resume' },
      { seekerIdx: 1, skill: 'TypeScript', weight: 0.88, source: 'resume' },
      { seekerIdx: 1, skill: 'CSS', weight: 0.8, source: 'resume' },
      { seekerIdx: 2, skill: '数控编程', weight: 0.9, source: 'resume' },
      { seekerIdx: 2, skill: '数控操作', weight: 0.95, source: 'resume' },
      { seekerIdx: 3, skill: '财务分析', weight: 0.93, source: 'resume' },
      { seekerIdx: 3, skill: 'Python', weight: 0.85, source: 'assessment' },
      { seekerIdx: 3, skill: 'Wind', weight: 0.8, source: 'resume' },
      { seekerIdx: 4, skill: '叉车操作', weight: 0.95, source: 'resume' },
      { seekerIdx: 4, skill: '仓库管理', weight: 0.7, source: 'resume' },
      { seekerIdx: 5, skill: '临床护理', weight: 0.92, source: 'resume' },
      { seekerIdx: 5, skill: '急救技能', weight: 0.88, source: 'certificate' },
      { seekerIdx: 6, skill: '施工管理', weight: 0.9, source: 'resume' },
      { seekerIdx: 6, skill: '质量安全', weight: 0.85, source: 'resume' },
    ];

    for (const sw of skillWeightsData) {
      insertSkillWeight.run(seekerIds[sw.seekerIdx], sw.skill, sw.weight, sw.source);
    }

    insertReport.run(
      'job', jobIds[16], seekerUserIds[4],
      '薪资信息不实',
      '该职位标注薪资为5K-12K，但实际面试时告知底薪仅3500元，其余为提成，与描述严重不符。',
      'pending', null
    );

    const adminUserId = (db.prepare('SELECT id FROM users WHERE role = ?').get('admin') as { id: number }).id;
    insertReport.run(
      'company', companyIds[8], seekerUserIds[1],
      '虚假招聘信息',
      '该公司发布的多个职位信息与实际工作内容不符，疑似以招聘名义进行培训推销。',
      'resolved', adminUserId
    );
  })();
}

export default db;
