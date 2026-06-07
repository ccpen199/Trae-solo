const db = require('../db');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const initSchema = () => {
  db.exec(`
    PRAGMA foreign_keys = OFF;

    DROP TABLE IF EXISTS onboarding_records;
    DROP TABLE IF EXISTS interviews;
    DROP TABLE IF EXISTS applications;
    DROP TABLE IF EXISTS audit_logs;
    DROP TABLE IF EXISTS job_match_scores;
    DROP TABLE IF EXISTS salary_references;
    DROP TABLE IF EXISTS jobs;
    DROP TABLE IF EXISTS jd_templates;
    DROP TABLE IF EXISTS enterprises;
    DROP TABLE IF EXISTS skill_certificates;
    DROP TABLE IF EXISTS resumes;
    DROP TABLE IF EXISTS job_seekers;
    DROP TABLE IF EXISTS manufacturing_job_categories;
    DROP TABLE IF EXISTS users;

    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('jobseeker', 'hr', 'admin')),
      email TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS job_seekers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      name TEXT NOT NULL,
      gender TEXT,
      age INTEGER,
      education TEXT,
      work_years INTEGER,
      phone TEXT,
      email TEXT,
      expected_salary_min INTEGER,
      expected_salary_max INTEGER,
      expected_city TEXT,
      self_introduction TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skill_certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_seeker_id INTEGER NOT NULL,
      certificate_name TEXT NOT NULL,
      issuing_authority TEXT,
      issue_date DATE,
      certificate_no TEXT,
      scan_file TEXT,
      ocr_data TEXT,
      verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_seeker_id) REFERENCES job_seekers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_seeker_id INTEGER UNIQUE NOT NULL,
      resume_title TEXT,
      project_videos TEXT,
      portfolio_url TEXT,
      skills TEXT,
      work_experience TEXT,
      education_experience TEXT,
      project_experience TEXT,
      three_d_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_seeker_id) REFERENCES job_seekers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS manufacturing_job_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_code TEXT UNIQUE NOT NULL,
      category_name TEXT NOT NULL,
      parent_code TEXT,
      level INTEGER,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS enterprises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      enterprise_name TEXT NOT NULL,
      unified_credit_code TEXT,
      business_license TEXT,
      iso_certification TEXT,
      industry TEXT,
      scale TEXT,
      address TEXT,
      contact_person TEXT,
      contact_phone TEXT,
      qualification_status TEXT DEFAULT 'pending' CHECK(qualification_status IN ('pending', 'approved', 'rejected')),
      qualification_reviewed_by INTEGER,
      qualification_reviewed_at DATETIME,
      qualification_remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jd_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_name TEXT NOT NULL,
      job_category_code TEXT NOT NULL,
      job_title TEXT NOT NULL,
      job_description TEXT,
      requirements TEXT,
      ability_model TEXT,
      salary_min INTEGER,
      salary_max INTEGER,
      is_builtin INTEGER DEFAULT 0,
      enterprise_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_category_code) REFERENCES manufacturing_job_categories(category_code)
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      job_category_code TEXT NOT NULL,
      job_title TEXT NOT NULL,
      job_description TEXT,
      requirements TEXT,
      ability_model TEXT,
      salary_min INTEGER NOT NULL,
      salary_max INTEGER NOT NULL,
      city TEXT,
      work_experience_required TEXT,
      education_required TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'closed')),
      salary_compliance_checked INTEGER DEFAULT 0,
      salary_compliance_remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
      FOREIGN KEY (job_category_code) REFERENCES manufacturing_job_categories(category_code)
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      job_seeker_id INTEGER NOT NULL,
      resume_id INTEGER,
      status TEXT DEFAULT 'applied' CHECK(status IN ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected')),
      ats_score INTEGER,
      ats_keyword_match TEXT,
      ats_semantic_analysis TEXT,
      keyword_match_score INTEGER,
      semantic_similarity_score INTEGER,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      hired_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (job_seeker_id) REFERENCES job_seekers(id) ON DELETE CASCADE,
      FOREIGN KEY (resume_id) REFERENCES resumes(id)
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      interview_time DATETIME NOT NULL,
      interview_method TEXT,
      interviewer TEXT,
      location TEXT,
      calendar_sync_status TEXT DEFAULT 'pending' CHECK(calendar_sync_status IN ('pending', 'synced', 'failed')),
      calendar_provider TEXT,
      calendar_event_id TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operator_id INTEGER,
      operator_role TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      detail TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS salary_references (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_category_code TEXT NOT NULL,
      city TEXT NOT NULL,
      work_years TEXT,
      salary_min INTEGER NOT NULL,
      salary_max INTEGER NOT NULL,
      data_source TEXT,
      effective_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS job_match_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      job_seeker_id INTEGER NOT NULL,
      technical_skill_score INTEGER,
      experience_match_score INTEGER,
      education_match_score INTEGER,
      certificate_match_score INTEGER,
      project_match_score INTEGER,
      overall_score INTEGER,
      dimension_scores TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (job_seeker_id) REFERENCES job_seekers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS onboarding_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      job_seeker_id INTEGER NOT NULL,
      enterprise_id INTEGER NOT NULL,
      onboard_date DATE,
      resignation_date DATE,
      is_still_employed INTEGER DEFAULT 1,
      employment_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id),
      FOREIGN KEY (job_seeker_id) REFERENCES job_seekers(id),
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
    );
  `);

  console.log('Database schema initialized successfully');
};

const seedJobCategories = () => {
  const categories = [
    { code: 'MFG-001', name: '机械加工', parent: null, level: 1, desc: '机械加工类岗位' },
    { code: 'MFG-001-001', name: 'CNC编程', parent: 'MFG-001', level: 2, desc: '数控机床编程' },
    { code: 'MFG-001-002', name: '数控操作', parent: 'MFG-001', level: 2, desc: '数控机床操作' },
    { code: 'MFG-001-003', name: '车工', parent: 'MFG-001', level: 2, desc: '车床操作' },
    { code: 'MFG-001-004', name: '铣工', parent: 'MFG-001', level: 2, desc: '铣床操作' },
    { code: 'MFG-001-005', name: '磨工', parent: 'MFG-001', level: 2, desc: '磨床操作' },
    { code: 'MFG-002', name: '模具制造', parent: null, level: 1, desc: '模具设计与制造类岗位' },
    { code: 'MFG-002-001', name: '模具设计工程师', parent: 'MFG-002', level: 2, desc: '模具设计' },
    { code: 'MFG-002-002', name: '模具钳工', parent: 'MFG-002', level: 2, desc: '模具装配与维修' },
    { code: 'MFG-002-003', name: '线切割', parent: 'MFG-002', level: 2, desc: '线切割加工' },
    { code: 'MFG-002-004', name: '电火花', parent: 'MFG-002', level: 2, desc: '电火花加工' },
    { code: 'MFG-003', name: '自动化设备', parent: null, level: 1, desc: '自动化设备相关岗位' },
    { code: 'MFG-003-001', name: '自动化工程师', parent: 'MFG-003', level: 2, desc: '自动化设备设计开发' },
    { code: 'MFG-003-002', name: 'PLC工程师', parent: 'MFG-003', level: 2, desc: 'PLC程序设计' },
    { code: 'MFG-003-003', name: '机器人调试工程师', parent: 'MFG-003', level: 2, desc: '工业机器人调试' },
    { code: 'MFG-003-004', name: '设备维修技术员', parent: 'MFG-003', level: 2, desc: '设备维护与维修' },
    { code: 'MFG-004', name: '质量管理', parent: null, level: 1, desc: '质量管理类岗位' },
    { code: 'MFG-004-001', name: '品质工程师', parent: 'MFG-004', level: 2, desc: '质量管理工程师' },
    { code: 'MFG-004-002', name: 'QC质检员', parent: 'MFG-004', level: 2, desc: '质量检验员' },
    { code: 'MFG-004-003', name: 'QA工程师', parent: 'MFG-004', level: 2, desc: '质量保证工程师' },
    { code: 'MFG-005', name: '生产管理', parent: null, level: 1, desc: '生产管理类岗位' },
    { code: 'MFG-005-001', name: '生产主管', parent: 'MFG-005', level: 2, desc: '生产车间主管' },
    { code: 'MFG-005-002', name: '生产计划员', parent: 'MFG-005', level: 2, desc: '生产计划排程' },
    { code: 'MFG-005-003', name: 'IE工程师', parent: 'MFG-005', level: 2, desc: '工业工程师' },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO manufacturing_job_categories 
    (category_code, category_name, parent_code, level, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const cat of categories) {
      stmt.run(cat.code, cat.name, cat.parent, cat.level, cat.desc);
    }
  });
  tx();
  console.log('Manufacturing job categories seeded');
};

const seedJDTemplates = () => {
  const templates = [
    {
      name: 'CNC编程工程师（高级）',
      category: 'MFG-001-001',
      title: '高级CNC编程工程师',
      desc: '负责复杂零件的数控加工程序编制，优化加工工艺，提升生产效率',
      reqs: '1. 大专以上学历，机械相关专业\n2. 5年以上CNC编程经验\n3. 精通Mastercam、UG等编程软件\n4. 熟悉FANUC、SIEMENS系统',
      ability: JSON.stringify({
        technical: ['Mastercam', 'UG NX', 'AutoCAD', 'G代码', '宏程序'],
        experience: ['复杂零件编程', '工艺优化', '刀具选型', '质量控制'],
        soft: ['团队协作', '问题分析', '持续改进']
      }),
      salaryMin: 12000,
      salaryMax: 20000,
      builtin: 1
    },
    {
      name: '模具设计工程师',
      category: 'MFG-002-001',
      title: '模具设计工程师',
      desc: '负责注塑模、冲压模等模具的设计与开发，参与模具试制与改进',
      reqs: '1. 本科以上学历，模具设计相关专业\n2. 3年以上模具设计经验\n3. 精通UG、Pro/E等设计软件\n4. 熟悉模具加工工艺',
      ability: JSON.stringify({
        technical: ['UG NX', 'Pro/E', 'AutoCAD', 'Moldflow', 'DFM'],
        experience: ['注塑模设计', '冲压模设计', '模具结构优化', '材料选型'],
        soft: ['项目管理', '跨部门沟通', '成本控制']
      }),
      salaryMin: 10000,
      salaryMax: 18000,
      builtin: 1
    },
    {
      name: 'PLC自动化工程师',
      category: 'MFG-003-002',
      title: 'PLC自动化工程师',
      desc: '负责自动化生产线的PLC程序设计、调试与维护',
      reqs: '1. 大专以上学历，电气自动化相关专业\n2. 3年以上PLC编程经验\n3. 精通西门子S7系列或三菱PLC\n4. 熟悉触摸屏、变频器、伺服系统',
      ability: JSON.stringify({
        technical: ['西门子S7-1200/1500', '三菱Q系列', 'WinCC', '组态王', 'Modbus', 'Profinet'],
        experience: ['自动化线调试', '程序优化', '故障排查', '设备改造'],
        soft: ['逻辑思维', '文档编写', '现场管理']
      }),
      salaryMin: 11000,
      salaryMax: 18000,
      builtin: 1
    },
    {
      name: '品质工程师（制造业）',
      category: 'MFG-004-001',
      title: '品质工程师',
      desc: '建立和完善质量管理体系，处理质量异常，推动品质改进',
      reqs: '1. 大专以上学历，质量管理相关专业\n2. 3年以上制造业品质管理经验\n3. 熟悉ISO9001、IATF16949体系\n4. 掌握SPC、FMEA、MSA等质量工具',
      ability: JSON.stringify({
        technical: ['SPC', 'FMEA', 'MSA', '8D报告', 'QC七大手法', 'ISO9001'],
        experience: ['质量体系建设', '供应商管理', '异常处理', '客诉应对'],
        soft: ['数据分析', '沟通协调', '原则性强']
      }),
      salaryMin: 8000,
      salaryMax: 15000,
      builtin: 1
    },
    {
      name: '工业工程师（IE）',
      category: 'MFG-005-003',
      title: 'IE工业工程师',
      desc: '优化生产流程，提升生产效率，降低生产成本，改善作业环境',
      reqs: '1. 本科以上学历，工业工程相关专业\n2. 3年以上制造业IE经验\n3. 精通精益生产、六西格玛\n4. 熟练使用CAD、VISIO等工具',
      ability: JSON.stringify({
        technical: ['精益生产', '六西格玛', '时间研究', '动作分析', '线平衡', 'Layout设计'],
        experience: ['产能提升', '成本降低', '流程优化', '5S管理'],
        soft: ['数据驱动', '推动能力', '跨部门协作']
      }),
      salaryMin: 9000,
      salaryMax: 16000,
      builtin: 1
    },
    {
      name: '机器人调试工程师',
      category: 'MFG-003-003',
      title: '工业机器人调试工程师',
      desc: '负责工业机器人的安装、编程、调试与维护，支持自动化生产',
      reqs: '1. 大专以上学历，机电一体化相关专业\n2. 2年以上工业机器人调试经验\n3. 精通FANUC、KUKA或ABB机器人编程\n4. 熟悉机器人视觉系统优先',
      ability: JSON.stringify({
        technical: ['FANUC机器人', 'KUKA机器人', 'ABB机器人', '机器人视觉', 'RobotStudio', 'Offline编程'],
        experience: ['机器人集成', '焊接/搬运/喷涂应用', '节拍优化', '故障诊断'],
        soft: ['动手能力强', '自主学习', '现场适应']
      }),
      salaryMin: 10000,
      salaryMax: 17000,
      builtin: 1
    },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO jd_templates 
    (template_name, job_category_code, job_title, job_description, requirements, ability_model, salary_min, salary_max, is_builtin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const tpl of templates) {
      stmt.run(tpl.name, tpl.category, tpl.title, tpl.desc, tpl.reqs, tpl.ability, tpl.salaryMin, tpl.salaryMax, tpl.builtin);
    }
  });
  tx();
  console.log('JD templates seeded');
};

const seedSalaryReferences = () => {
  const references = [
    { code: 'MFG-001-001', city: '上海', years: '3-5年', min: 10000, max: 18000, source: '2024制造业薪酬报告', date: '2024-01-01' },
    { code: 'MFG-001-001', city: '上海', years: '5-10年', min: 15000, max: 25000, source: '2024制造业薪酬报告', date: '2024-01-01' },
    { code: 'MFG-001-001', city: '苏州', years: '3-5年', min: 8000, max: 15000, source: '2024制造业薪酬报告', date: '2024-01-01' },
    { code: 'MFG-002-001', city: '上海', years: '3-5年', min: 9000, max: 16000, source: '2024制造业薪酬报告', date: '2024-01-01' },
    { code: 'MFG-002-001', city: '东莞', years: '3-5年', min: 8000, max: 14000, source: '2024制造业薪酬报告', date: '2024-01-01' },
    { code: 'MFG-003-002', city: '上海', years: '3-5年', min: 10000, max: 18000, source: '2024制造业薪酬报告', date: '2024-01-01' },
    { code: 'MFG-003-002', city: '深圳', years: '3-5年', min: 11000, max: 19000, source: '2024制造业薪酬报告', date: '2024-01-01' },
    { code: 'MFG-004-001', city: '上海', years: '3-5年', min: 8000, max: 14000, source: '2024制造业薪酬报告', date: '2024-01-01' },
    { code: 'MFG-005-003', city: '上海', years: '3-5年', min: 9000, max: 16000, source: '2024制造业薪酬报告', date: '2024-01-01' },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO salary_references
    (job_category_code, city, work_years, salary_min, salary_max, data_source, effective_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const ref of references) {
      stmt.run(ref.code, ref.city, ref.years, ref.min, ref.max, ref.source, ref.date);
    }
  });
  tx();
  console.log('Salary references seeded');
};

const seedUsers = () => {
  const password = bcrypt.hashSync('123456', 10);

  const users = [
    { username: 'admin', password, role: 'admin', email: 'admin@example.com' },
    { username: 'hr1', password, role: 'hr', email: 'hr1@example.com' },
    { username: 'seeker1', password, role: 'jobseeker', email: 'seeker1@example.com' },
  ];

  const userStmt = db.prepare(`
    INSERT OR IGNORE INTO users (username, password, role, email)
    VALUES (?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const user of users) {
      userStmt.run(user.username, user.password, user.role, user.email);
    }
  });
  tx();

  const seeker = db.prepare('SELECT id FROM users WHERE username = ?').get('seeker1');
  if (seeker) {
    db.prepare(`
      INSERT OR IGNORE INTO job_seekers (user_id, name, phone, email, education, work_years, expected_salary_min, expected_salary_max)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(seeker.id, '张三', '13800138001', 'seeker1@example.com', '大专', 5, 12000, 18000);
  }

  const hr = db.prepare('SELECT id FROM users WHERE username = ?').get('hr1');
  if (hr) {
    db.prepare(`
      INSERT OR IGNORE INTO enterprises (user_id, enterprise_name, unified_credit_code, industry, scale, contact_person, contact_phone, qualification_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(hr.id, '上海精密机械制造有限公司', '91310000XXXXXXXXXX', '精密机械加工', '50-100人', '李经理', '13900139001', 'approved');
  }

  console.log('Test users seeded');
  console.log('  - admin / 123456 (管理员)');
  console.log('  - hr1 / 123456 (企业HR)');
  console.log('  - seeker1 / 123456 (求职者)');
};

const seedJobs = () => {
  const enterprise = db.prepare('SELECT id FROM enterprises WHERE enterprise_name = ?').get('上海精密机械制造有限公司');
  if (!enterprise) return;

  const jobs = [
    {
      category: 'MFG-001-001',
      title: '高级CNC编程工程师',
      desc: '负责复杂精密零件的数控加工程序编制，优化加工工艺方案',
      reqs: '1. 大专以上学历，机械制造相关专业\n2. 5年以上CNC编程经验\n3. 精通UG、Mastercam编程软件\n4. 熟悉FANUC系统',
      ability: JSON.stringify({
        technical: ['UG NX', 'Mastercam', 'G代码', '工艺规划', '刀具选型'],
        experience: ['复杂零件编程', '四轴五轴编程', '程序优化', '质量改进'],
        soft: ['团队协作', '问题解决', '责任心强']
      }),
      salaryMin: 15000,
      salaryMax: 22000,
      city: '上海',
      experience: '5-10年',
      education: '大专'
    },
    {
      category: 'MFG-002-001',
      title: '模具设计工程师',
      desc: '负责注塑模具设计，参与模具评审、试制及优化',
      reqs: '1. 本科以上学历，模具设计专业\n2. 3年以上注塑模设计经验\n3. 精通UG、AutoCAD\n4. 了解模具加工工艺',
      ability: JSON.stringify({
        technical: ['UG NX', 'AutoCAD', 'Moldflow', 'DFM分析'],
        experience: ['注塑模设计', '模具结构优化', '成本控制'],
        soft: ['沟通能力', '项目跟进', '细心严谨']
      }),
      salaryMin: 12000,
      salaryMax: 18000,
      city: '上海',
      experience: '3-5年',
      education: '本科'
    },
    {
      category: 'MFG-003-002',
      title: 'PLC工程师',
      desc: '负责自动化生产线PLC程序设计与调试',
      reqs: '1. 大专以上学历，电气自动化专业\n2. 3年以上PLC编程经验\n3. 精通西门子S7-1200/1500\n4. 熟悉Profinet通信',
      ability: JSON.stringify({
        technical: ['西门子S7系列', 'TIA Portal', 'WinCC', 'Profinet'],
        experience: ['自动化线调试', '程序优化', '故障排查'],
        soft: ['逻辑清晰', '动手能力强', '文档规范']
      }),
      salaryMin: 12000,
      salaryMax: 18000,
      city: '上海',
      experience: '3-5年',
      education: '大专'
    },
  ];

  const stmt = db.prepare(`
    INSERT INTO jobs (enterprise_id, job_category_code, job_title, job_description, requirements, ability_model, salary_min, salary_max, city, work_experience_required, education_required, salary_compliance_checked)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const tx = db.transaction(() => {
    for (const job of jobs) {
      stmt.run(enterprise.id, job.category, job.title, job.desc, job.reqs, job.ability, job.salaryMin, job.salaryMax, job.city, job.experience, job.education);
    }
  });
  tx();
  console.log('Sample jobs seeded');
};

const seedMoreEnterprises = () => {
  const enterprises = [
    {
      name: '苏州自动化科技有限公司',
      credit_code: '91320500XXXXXXXX01',
      industry: '自动化设备',
      scale: '100-500人',
      contact: '王总',
      phone: '13800138010',
      status: 'pending',
      license_path: '/uploads/license_suzhou.jpg',
      iso_path: '/uploads/iso_suzhou.pdf',
    },
    {
      name: '东莞精密模具有限公司',
      credit_code: '91441900XXXXXXXX02',
      industry: '模具制造',
      scale: '50-100人',
      contact: '张经理',
      phone: '13800138020',
      status: 'pending',
      license_path: '/uploads/license_dongguan.jpg',
      iso_path: '/uploads/iso_dongguan.pdf',
    },
    {
      name: '深圳智能装备有限公司',
      credit_code: '91440300XXXXXXXX03',
      industry: '智能装备',
      scale: '500-1000人',
      contact: '刘总',
      phone: '13800138030',
      status: 'rejected',
      license_path: '/uploads/license_shenzhen.jpg',
      iso_path: null,
    },
    {
      name: '无锡新能源科技有限公司',
      credit_code: '91320200XXXXXXXX04',
      industry: '新能源设备',
      scale: '200-500人',
      contact: '陈经理',
      phone: '13800138040',
      status: 'pending',
      license_path: '/uploads/license_wuxi.jpg',
      iso_path: '/uploads/iso_wuxi.pdf',
    },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO enterprises 
    (user_id, enterprise_name, unified_credit_code, industry, scale, contact_person, contact_phone, 
     qualification_status, business_license, iso_certification, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATETIME('now', '-1 days'))
  `);

  const tx = db.transaction(() => {
    for (let i = 0; i < enterprises.length; i++) {
      const ent = enterprises[i];
      const userId = 100 + i;
      db.prepare('INSERT OR IGNORE INTO users (id, username, password, role, email) VALUES (?, ?, ?, ?, ?)').run(
        userId, `hr${i + 2}`, bcrypt.hashSync('123456', 10), 'hr', `hr${i + 2}@example.com`
      );
      stmt.run(userId, ent.name, ent.credit_code, ent.industry, ent.scale, ent.contact, ent.phone, ent.status, ent.license_path, ent.iso_path);
    }
  });
  tx();
  console.log('More enterprises seeded (pending/rejected)');
};

const seedMoreJobs = () => {
  const suzhouEnt = db.prepare('SELECT id FROM enterprises WHERE enterprise_name = ?').get('苏州自动化科技有限公司');
  if (!suzhouEnt) return;

  const jobs = [
    {
      category: 'MFG-003-002',
      title: '高级PLC工程师',
      desc: '负责自动化生产线PLC程序设计与调试',
      reqs: '1. 大专以上学历\n2. 5年以上PLC编程经验',
      ability: JSON.stringify({
        technical: ['西门子S7', '三菱Q系列', 'WinCC'],
        experience: ['自动化线调试', '程序优化'],
        soft: ['逻辑思维', '文档编写']
      }),
      salaryMin: 8000,
      salaryMax: 30000,
      city: '苏州',
      experience: '3-5年',
      education: '大专',
      complianceChecked: 0,
    },
    {
      category: 'MFG-001-001',
      title: 'CNC编程员',
      desc: '负责零件数控加工程序编制',
      reqs: '1. 中专以上学历\n2. 2年以上CNC编程经验',
      ability: JSON.stringify({
        technical: ['Mastercam', 'UG', 'G代码'],
        experience: ['零件编程', '程序验证'],
        soft: ['细心', '责任心强']
      }),
      salaryMin: 5000,
      salaryMax: 8000,
      city: '苏州',
      experience: '1-3年',
      education: '中专',
      complianceChecked: 0,
    },
  ];

  const stmt = db.prepare(`
    INSERT INTO jobs (enterprise_id, job_category_code, job_title, job_description, requirements, ability_model, salary_min, salary_max, city, work_experience_required, education_required, salary_compliance_checked, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', DATETIME('now', '-12 hours'))
  `);

  const tx = db.transaction(() => {
    for (const job of jobs) {
      stmt.run(suzhouEnt.id, job.category, job.title, job.desc, job.reqs, job.ability, job.salaryMin, job.salaryMax, job.city, job.experience, job.education, job.complianceChecked);
    }
  });
  tx();
  console.log('More jobs seeded (with compliance issues)');
};

const seedAuditLogs = () => {
  const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  const hr1 = db.prepare('SELECT id FROM users WHERE username = ?').get('hr1');
  if (!admin || !hr1) return;

  const now = Date.now();
  const logs = [
    { operator: admin.id, action: 'review_enterprise_qualification', target_type: 'enterprise', target_id: 1, detail: '企业资质审核通过：上海精密机械制造有限公司', offset: 2 },
    { operator: admin.id, action: 'review_enterprise_qualification', target_type: 'enterprise', target_id: 4, detail: '企业资质审核拒绝：深圳智能装备有限公司，原因：缺少ISO认证文件', offset: 3 },
    { operator: admin.id, action: 'check_salary_compliance', target_type: 'job', target_id: 1, detail: '薪酬合规性检查：高级CNC编程工程师薪资范围符合行业标准', offset: 5 },
    { operator: admin.id, action: 'check_salary_compliance', target_type: 'job', target_id: 4, detail: '薪酬合规性检查：高级PLC工程师薪资上限超出行业标准50%，标记异常', offset: 6 },
    { operator: hr1.id, action: 'create_job', target_type: 'job', target_id: 1, detail: '发布职位：高级CNC编程工程师', offset: 24 },
    { operator: hr1.id, action: 'create_job', target_type: 'job', target_id: 2, detail: '发布职位：模具设计工程师', offset: 24 },
    { operator: hr1.id, action: 'update_job', target_type: 'job', target_id: 1, detail: '更新职位信息：调整薪资范围', offset: 12 },
    { operator: hr1.id, action: 'screen_application', target_type: 'application', target_id: 1, detail: 'ATS初筛通过：张三 - CNC编程工程师', offset: 8 },
    { operator: hr1.id, action: 'schedule_interview', target_type: 'interview', target_id: 1, detail: '安排面试：张三 - 2024-06-10 10:00', offset: 6 },
    { operator: hr1.id, action: 'send_offer', target_type: 'application', target_id: 1, detail: '发送录用通知：张三', offset: 3 },
  ];

  const stmt = db.prepare(`
    INSERT INTO audit_logs 
    (operator_id, action, target_type, target_id, detail, ip_address, user_agent, created_at)
    VALUES (?, ?, ?, ?, ?, '127.0.0.1', 'Mozilla/5.0', DATETIME('now', ?))
  `);

  const tx = db.transaction(() => {
    for (const log of logs) {
      stmt.run(log.operator, log.action, log.target_type, log.target_id, log.detail, `-${log.offset} hours`);
    }
  });
  tx();
  console.log('Audit logs seeded (diverse operations)');
};

const seedApplicationsAndOnboarding = () => {
  const jobs = db.prepare('SELECT j.id, j.enterprise_id FROM jobs j').all();
  const seeker = db.prepare('SELECT id FROM job_seekers WHERE name = ?').get('张三');
  if (jobs.length === 0 || !seeker) return;

  const applications = [
    { job_id: jobs[0].id, enterprise_id: jobs[0].enterprise_id, seeker_id: seeker.id, status: 'hired', ats_score: 85, created_at: '-30 days' },
    { job_id: jobs[1].id, enterprise_id: jobs[1].enterprise_id, seeker_id: seeker.id, status: 'interview', ats_score: 72, created_at: '-15 days' },
    { job_id: jobs[2]?.id || jobs[0].id, enterprise_id: (jobs[2]?.enterprise_id || jobs[0].enterprise_id), seeker_id: seeker.id, status: 'screening', ats_score: 68, created_at: '-7 days' },
  ];

  const appStmt = db.prepare(`
    INSERT INTO applications 
    (job_id, job_seeker_id, status, ats_score, keyword_match_score, semantic_similarity_score, applied_at, hired_at)
    VALUES (?, ?, ?, ?, ?, ?, DATETIME('now', ?), 
    CASE WHEN ? = 'hired' THEN DATETIME('now', '-10 days') ELSE NULL END)
  `);

  const onboardingStmt = db.prepare(`
    INSERT INTO onboarding_records 
    (application_id, job_seeker_id, enterprise_id, onboard_date, is_still_employed, created_at)
    VALUES (?, ?, ?, DATETIME('now', '-10 days'), 1, DATETIME('now', '-10 days'))
  `);

  const matchStmt = db.prepare(`
    INSERT INTO job_match_scores
    (job_seeker_id, job_id, technical_skill_score, experience_match_score, education_match_score, certificate_match_score, project_match_score, overall_score)
    VALUES (?, ?, 85, 78, 70, 82, 75, 78)
  `);

  const tx = db.transaction(() => {
    for (const app of applications) {
      const keywordScore = Math.round(app.ats_score * 0.6);
      const semanticScore = Math.round(app.ats_score * 0.4);
      
      const info = appStmt.run(
        app.job_id, app.seeker_id, app.status, app.ats_score,
        keywordScore, semanticScore, app.created_at, app.status
      );
      
      if (app.status === 'hired') {
        onboardingStmt.run(info.lastInsertRowid, app.seeker_id, app.enterprise_id);
      }
      
      matchStmt.run(app.seeker_id, app.job_id);
    }
  });
  tx();
  console.log('Applications and onboarding records seeded');
};

const initAll = () => {
  try {
    initSchema();
    console.log('✓ Schema initialized');
    seedJobCategories();
    console.log('✓ Job categories seeded');
    seedJDTemplates();
    console.log('✓ JD templates seeded');
    seedSalaryReferences();
    console.log('✓ Salary references seeded');
    seedUsers();
    console.log('✓ Users seeded');
    seedMoreEnterprises();
    console.log('✓ More enterprises seeded');
    seedJobs();
    console.log('✓ Jobs seeded');
    seedMoreJobs();
    console.log('✓ More jobs seeded');
    seedApplicationsAndOnboarding();
    console.log('✓ Applications and onboarding seeded');
    seedAuditLogs();
    console.log('✓ Audit logs seeded');
    console.log('\n✅ Database initialization complete!');
  } catch (e) {
    console.error('❌ Error during initialization:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
};

initAll();
