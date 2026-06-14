const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function addColumnIfMissing(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all().map((item) => item.name);
  if (!columns.includes(column)) {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    } catch (err) {
      if (!/duplicate column name/i.test(err.message || '')) {
        throw err;
      }
    }
  }
}

function migrateSchema() {
  addColumnIfMissing('applications', 'resume_url', 'TEXT');
  addColumnIfMissing('applications', 'cover_letter', 'TEXT');
  addColumnIfMissing('interviews', 'location', 'TEXT');
  addColumnIfMissing('interviews', 'status', "TEXT DEFAULT 'pending'");
}

function tableCount(table) {
  return db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
}

function resetIncompleteSeedData() {
  db.exec('BEGIN');
  try {
    [
      'ar_navigations',
      'voice_searches',
      'users',
      'reviews',
      'interviews',
      'applications',
      'public_opinions',
      'jobs',
      'job_seekers',
      'companies'
    ].forEach((table) => db.prepare(`DELETE FROM ${table}`).run());
    db.exec(`
      DELETE FROM sqlite_sequence
      WHERE name IN (
        'ar_navigations','voice_searches','users','reviews','interviews',
        'applications','public_opinions','jobs','job_seekers','companies'
      )
    `);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      industry TEXT NOT NULL,
      license_no TEXT,
      contact_person TEXT,
      contact_phone TEXT,
      address TEXT,
      turnover_rate REAL DEFAULT 0,
      social_insurance_rate REAL DEFAULT 0,
      credit_score REAL DEFAULT 5.0,
      review_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS job_seekers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      id_card TEXT,
      skills TEXT,
      experience TEXT,
      rating REAL DEFAULT 5.0,
      review_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      industry TEXT NOT NULL,
      salary_min INTEGER NOT NULL,
      salary_max INTEGER NOT NULL,
      work_address TEXT NOT NULL,
      work_lng REAL,
      work_lat REAL,
      arrival_time TEXT NOT NULL,
      requirements TEXT,
      benefits TEXT,
      status TEXT DEFAULT 'active',
      is_suspicious INTEGER DEFAULT 0,
      suspicious_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      seeker_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (seeker_id) REFERENCES job_seekers(id)
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      interview_time DATETIME,
      recording_url TEXT,
      call_summary TEXT,
      key_promises TEXT,
      confirmed_by_company INTEGER DEFAULT 0,
      confirmed_by_seeker INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      seeker_id INTEGER NOT NULL,
      job_id INTEGER,
      rating INTEGER NOT NULL,
      comment TEXT,
      is_employee INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (seeker_id) REFERENCES job_seekers(id)
    );

    CREATE TABLE IF NOT EXISTS public_opinions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      source TEXT NOT NULL,
      keyword TEXT NOT NULL,
      content TEXT,
      sentiment TEXT,
      url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      company_id INTEGER,
      seeker_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS voice_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seeker_id INTEGER,
      voice_text TEXT NOT NULL,
      result_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ar_navigations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seeker_id INTEGER NOT NULL,
      job_id INTEGER NOT NULL,
      start_point TEXT,
      end_point TEXT,
      duration INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_industry ON jobs(industry);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
    CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
    CREATE INDEX IF NOT EXISTS idx_applications_seeker ON applications(seeker_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_company ON reviews(company_id);
  `);

  migrateSchema();

  const countCompanies = db.prepare('SELECT COUNT(*) as count FROM companies').get();
  if (countCompanies.count === 0) {
    seedData();
  } else if (tableCount('applications') === 0 || tableCount('interviews') === 0 || tableCount('users') === 0) {
    resetIncompleteSeedData();
    seedData();
  }
}

function seedData() {
  const insertCompany = db.prepare(`
    INSERT INTO companies (name, industry, license_no, contact_person, contact_phone, address, turnover_rate, social_insurance_rate, credit_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const companies = [
    ['喜茶(北京朝阳大悦城店)', '餐饮', '91110105MA01ABCD12', '张经理', '13800138001', '北京市朝阳区朝阳北路101号朝阳大悦城B1层01号', 0.15, 0.92, 4.7],
    ['星巴克(上海南京东路店)', '餐饮', '91310101MA1G2EF345', '李店长', '13800138002', '上海市黄浦区南京东路300号恒基名人购物中心L1层101室', 0.12, 0.95, 4.8],
    ['顺丰速运(深圳南山网点)', '物流', '91440300MA5D6GH789', '王主管', '13800138003', '广东省深圳市南山区科技园南区科苑路1号顺丰大厦1层', 0.18, 0.88, 4.5],
    ['全家便利店(广州天河店)', '零售', '91440101MA9U8IJ012', '陈店长', '13800138004', '广东省广州市天河区天河路385号太古汇B1层B101号', 0.20, 0.85, 4.3],
    ['海底捞火锅(杭州西湖店)', '餐饮', '91330106MA278KL345', '赵经理', '13800138005', '浙江省杭州市西湖区延安路98号西湖银泰城L5层501号', 0.10, 0.98, 4.9]
  ];

  const companyIds = [];
  for (const c of companies) {
    const result = insertCompany.run(...c);
    companyIds.push(result.lastInsertRowid);
  }

  const insertJob = db.prepare(`
    INSERT INTO jobs (company_id, title, industry, salary_min, salary_max, work_address, work_lng, work_lat, arrival_time, requirements, benefits)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const jobs = [
    [companyIds[0], '奶茶店店员', '餐饮', 4500, 6500, '北京市朝阳区朝阳北路101号朝阳大悦城B1层01号', 116.5111, 39.9321, '当日', '18-35岁，初中以上学历，身体健康', '五险一金，包吃，月度奖金，年假'],
    [companyIds[0], '茶饮师', '餐饮', 5000, 7000, '北京市朝阳区朝阳北路101号朝阳大悦城B1层01号', 116.5111, 39.9321, '3日内', '有奶茶店工作经验优先', '五险一金，员工折扣，年终奖'],
    [companyIds[1], '咖啡师', '餐饮', 5500, 7500, '上海市黄浦区南京东路300号恒基名人购物中心L1层101室', 121.4802, 31.2357, '一周内', '有咖啡制作经验，持健康证', '五险一金，带薪培训，季度奖金'],
    [companyIds[2], '快递分拣员', '物流', 6000, 9000, '广东省深圳市南山区科技园南区科苑路1号顺丰大厦1层', 113.9481, 22.5412, '当日', '18-45岁，能吃苦耐劳，无不良记录', '五险一金，提供住宿，高温补贴'],
    [companyIds[2], '收派员', '物流', 7000, 12000, '广东省深圳市南山区科技园南区科苑路1号顺丰大厦1层', 113.9481, 22.5412, '3日内', '熟悉深圳路况，有电动车优先', '五险一金，提成制，节日福利'],
    [companyIds[3], '便利店店员', '零售', 4500, 6000, '广东省广州市天河区天河路385号太古汇B1层B101号', 113.3259, 23.1369, '当日', '18-40岁，能接受夜班', '五险一金，三班倒，法定加班费'],
    [companyIds[4], '火锅店服务员', '餐饮', 5000, 8000, '浙江省杭州市西湖区延安路98号西湖银泰城L5层501号', 120.1551, 30.2529, '3日内', '18-35岁，身体健康，服务意识强', '五险一金，包吃住，月度分红'],
    [companyIds[4], '传菜员', '餐饮', 4800, 7000, '浙江省杭州市西湖区延安路98号西湖银泰城L5层501号', 120.1551, 30.2529, '当日', '能吃苦耐劳，有团队精神', '五险一金，包吃住，工龄工资']
  ];

  for (const j of jobs) {
    insertJob.run(...j);
  }

  const insertSeeker = db.prepare(`
    INSERT INTO job_seekers (name, phone, id_card, skills, experience, rating, review_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const seekers = [
    ['李明', '13900139001', '110101199801011234', '奶茶制作,收银', '2年奶茶店经验', 4.8, 5],
    ['王芳', '13900139002', '310101199905155678', '咖啡制作,客户服务', '1年星巴克兼职', 4.6, 3],
    ['张伟', '13900139003', '440301199508209012', '快递分拣,驾驶电动车', '3年物流行业经验', 4.9, 8],
    ['刘洋', '13900139004', '440101199703103456', '收银,理货,库存管理', '2年便利店经验', 4.5, 4],
    ['陈静', '13900139005', '330102200012257890', '餐饮服务,接待', '1年火锅店经验', 4.7, 6]
  ];

  for (const s of seekers) {
    insertSeeker.run(...s);
  }

  const insertOpinion = db.prepare(`
    INSERT INTO public_opinions (company_id, source, keyword, content, sentiment, url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const opinions = [
    [companyIds[0], '大众点评', '服务态度差', '店员态度不好，等了20分钟才拿到奶茶', 'negative', 'https://dpurl.com/1'],
    [companyIds[3], '脉脉', '加班严重', '经常强制加班，没有加班费', 'negative', 'https://maimai.com/2'],
    [companyIds[4], '大众点评', '服务热情', '服务员很热情，生日还送了礼物', 'positive', 'https://dpurl.com/3']
  ];

  for (const o of opinions) {
    insertOpinion.run(...o);
  }

  const insertApplication = db.prepare(`
    INSERT INTO applications (job_id, seeker_id, status, resume_url, cover_letter, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const applications = [
    [1, 1, 'pending', '/resumes/1.pdf', '我有3年奶茶店工作经验，非常适合这个岗位', '2024-01-15 10:30:00'],
    [2, 2, 'interview', '/resumes/2.pdf', '做过2年茶饮师，熟悉各类饮品制作', '2024-01-16 14:20:00'],
    [3, 1, 'accepted', '/resumes/1.pdf', '有咖啡师证书，希望能加入星巴克', '2024-01-17 09:15:00'],
    [4, 3, 'pending', '/resumes/3.pdf', '做过3年餐饮管理，经验丰富', '2024-01-18 16:45:00'],
    [5, 2, 'interview', '/resumes/2.pdf', '对零售行业很感兴趣，学习能力强', '2024-01-19 11:00:00'],
    [6, 4, 'rejected', '/resumes/4.pdf', '有快递行业经验，能吃苦耐劳', '2024-01-20 13:30:00'],
    [7, 1, 'pending', '/resumes/1.pdf', '做过分拣员，熟悉仓储流程', '2024-01-21 08:45:00'],
    [8, 5, 'interview', '/resumes/5.pdf', '能接受高薪挑战，工作积极主动', '2024-01-22 15:20:00'],
    [1, 3, 'accepted', '/resumes/3.pdf', '服务意识强，有1年餐饮经验', '2024-01-23 10:10:00'],
    [2, 4, 'pending', '/resumes/4.pdf', '年轻有活力，能适应快节奏工作', '2024-01-24 14:55:00']
  ];

  let applicationIds = [];
  for (const a of applications) {
    const result = insertApplication.run(...a);
    applicationIds.push(result.lastInsertRowid);
  }

  const insertInterview = db.prepare(`
    INSERT INTO interviews (application_id, interview_time, location, call_summary, recording_url, key_promises, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const interviews = [
    [
      applicationIds[1], 
      '2024-01-25 14:00:00', 
      '北京市朝阳区朝阳北路101号朝阳大悦城B1层01号', 
      '您好，我们看过您的简历了，您有2年茶饮师经验非常符合我们的要求。我们的薪资是5000-7000元，试用期3个月，转正后缴纳五险一金，包吃住，每月有200元全勤奖。请问您方便什么时候来面试？', 
      '/recordings/1.mp3', 
      '[{"keyword":"薪资","value":"5000-7000元"},{"keyword":"五险一金","value":"转正后缴纳"},{"keyword":"包吃住","value":"提供"},{"keyword":"试用期","value":"3个月"},{"keyword":"全勤奖","value":"每月200元"}]', 
      'confirmed', 
      '2024-01-23 10:00:00'
    ],
    [
      applicationIds[4], 
      '2024-01-26 10:30:00', 
      '广东省广州市天河区天河路385号太古汇负一层', 
      '您好，您的简历我们已经收到了。我们超市收银员的薪资是4200-5500元，月休4天，缴纳社保，有年终奖。我们需要您尽快到岗，请问3日内可以来面试吗？', 
      '/recordings/2.mp3', 
      '[{"keyword":"薪资","value":"4200-5500元"},{"keyword":"社保","value":"缴纳"},{"keyword":"月休","value":"4天"},{"keyword":"年终奖","value":"有"},{"keyword":"到岗时间","value":"3日内"}]', 
      'confirmed', 
      '2024-01-24 09:30:00'
    ],
    [
      applicationIds[7], 
      '2024-01-27 15:00:00', 
      '深圳市宝安区航空路123号顺丰航空枢纽3号仓', 
      '您好，我们是顺丰速运，看到您投递了快递员岗位。我们的薪资是6000-9000元，多劳多得，有五险，提供住宿补贴，每月有话费补贴。请问您明天下午方便来面试吗？', 
      '/recordings/3.mp3', 
      '[{"keyword":"薪资","value":"6000-9000元"},{"keyword":"五险","value":"有"},{"keyword":"住宿补贴","value":"提供"},{"keyword":"话费补贴","value":"每月"}]', 
      'pending', 
      '2024-01-25 11:15:00'
    ],
    [
      applicationIds[2], 
      '2024-01-28 09:30:00', 
      '上海市黄浦区南京东路300号恒基名人购物中心L1层101室', 
      '您好，星巴克上海南京东路店。您有咖啡师证书非常符合我们的要求。我们的薪资是5500-7500元，做六休一，缴纳五险一金，有员工折扣，带薪年假5天。请问您下周一可以来面试吗？', 
      '/recordings/4.mp3', 
      '[{"keyword":"薪资","value":"5500-7500元"},{"keyword":"五险一金","value":"缴纳"},{"keyword":"员工折扣","value":"有"},{"keyword":"带薪年假","value":"5天"}]', 
      'confirmed', 
      '2024-01-26 14:20:00'
    ],
    [
      applicationIds[8], 
      '2024-01-29 13:00:00', 
      '浙江省杭州市西湖区延安路98号西湖银泰城L5层501号', 
      '您好，海底捞火锅。您有3年餐饮管理经验非常适合我们的门店主管岗位。我们的薪资是7000-10000元，包吃住，缴纳五险一金，有绩效奖金，每月团建，带薪年假10天。请问您本周三方便来面试吗？', 
      '/recordings/5.mp3', 
      '[{"keyword":"薪资","value":"7000-10000元"},{"keyword":"包吃住","value":"提供"},{"keyword":"五险一金","value":"缴纳"},{"keyword":"绩效奖金","value":"有"},{"keyword":"带薪年假","value":"10天"}]', 
      'pending', 
      '2024-01-27 16:45:00'
    ]
  ];

  for (const iv of interviews) {
    insertInterview.run(...iv);
  }

  const insertReview = db.prepare(`
    INSERT INTO reviews (company_id, seeker_id, job_id, rating, comment, is_employee, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const reviews = [
    [1, 1, 1, 5, '在喜茶工作了2年，店长人很好，同事相处融洽，五险一金按时缴纳，节假日有三倍工资，就是高峰期比较忙，整体很满意！', 1, '2024-01-10 14:30:00'],
    [1, 2, 2, 4, '茶饮师的工作节奏很快，但福利待遇不错，员工折扣买奶茶很划算，年终奖也挺丰厚的，就是需要站一整天有点累。', 1, '2024-01-12 09:15:00'],
    [2, 1, 3, 5, '星巴克的工作环境很好，咖啡师培训很专业，能学到很多咖啡知识，五险一金齐全，还有带薪年假，很推荐！', 1, '2024-01-08 16:45:00'],
    [3, 3, 4, 3, '顺丰的分拣员工作比较辛苦，但是工资确实不低，多劳多得，住宿条件一般，社保公积金都有，就是工作时间比较长。', 1, '2024-01-05 11:20:00'],
    [4, 4, 6, 4, '全家便利店的工作比较稳定，三班倒能适应的话还不错，法定节假日有加班费，夜班补贴也可以，适合想稳定的人。', 1, '2024-01-09 13:30:00'],
    [1, 3, 1, 5, '面试体验很好，HR很专业，把薪资福利都讲得很清楚，工作环境也不错，已经入职一周了，目前很满意！', 0, '2024-01-18 10:00:00'],
    [3, 5, 5, 4, '收派员的工作虽然辛苦但是收入还可以，提成制的多劳多得，站点的同事都很照顾新人，社保公积金都按时交。', 1, '2024-01-15 15:45:00']
  ];

  for (const r of reviews) {
    insertReview.run(...r);
  }

  const updateCompanyRating = db.prepare(`
    UPDATE companies 
    SET credit_score = (
      SELECT AVG(rating) FROM reviews WHERE company_id = companies.id
    ),
    review_count = (
      SELECT COUNT(*) FROM reviews WHERE company_id = companies.id
    )
    WHERE id IN (1, 2, 3, 4)
  `);
  updateCompanyRating.run();

  const updateSeekerRating = db.prepare(`
    UPDATE job_seekers 
    SET rating = (
      SELECT AVG(rating) FROM reviews WHERE seeker_id = job_seekers.id
    ),
    review_count = (
      SELECT COUNT(*) FROM reviews WHERE seeker_id = job_seekers.id
    )
    WHERE id IN (1, 2, 3, 4, 5)
  `);
  updateSeekerRating.run();

  const bcrypt = require('bcryptjs');
  const insertUser = db.prepare(`
    INSERT INTO users (username, password, role, company_id, seeker_id)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run('admin', bcrypt.hashSync('admin123', 10), 'admin', null, null);
  insertUser.run('company1', bcrypt.hashSync('123456', 10), 'company', companyIds[0], null);
  insertUser.run('company2', bcrypt.hashSync('123456', 10), 'company', companyIds[1], null);
  insertUser.run('seeker1', bcrypt.hashSync('123456', 10), 'seeker', null, 1);
  insertUser.run('seeker2', bcrypt.hashSync('123456', 10), 'seeker', null, 2);
}

module.exports = { db, initDatabase };
