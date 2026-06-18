import db from './database.js';

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      avatar VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviewers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      real_name VARCHAR(50) NOT NULL,
      qualifications TEXT,
      professional_fields TEXT,
      quality_score DECIMAL(3, 2) DEFAULT 100.00,
      audit_status VARCHAR(20) DEFAULT 'pending',
      total_reports INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      category VARCHAR(50) NOT NULL,
      business_license VARCHAR(100),
      contact_name VARCHAR(50),
      contact_phone VARCHAR(20),
      audit_status VARCHAR(20) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS brand_admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      brand_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (brand_id) REFERENCES brands(id)
    );

    CREATE TABLE IF NOT EXISTS evaluation_categories (
      code VARCHAR(50) PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS evaluation_indicators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      category VARCHAR(50) NOT NULL,
      default_weight DECIMAL(5, 4) NOT NULL,
      description TEXT,
      FOREIGN KEY (category) REFERENCES evaluation_categories(code)
    );

    CREATE TABLE IF NOT EXISTS evaluation_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      category VARCHAR(50) NOT NULL,
      city VARCHAR(50) NOT NULL,
      brand_id INTEGER,
      description TEXT,
      cover_image VARCHAR(255),
      FOREIGN KEY (category) REFERENCES evaluation_categories(code),
      FOREIGN KEY (brand_id) REFERENCES brands(id)
    );

    CREATE TABLE IF NOT EXISTS evaluation_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      category VARCHAR(50) NOT NULL,
      city VARCHAR(50) NOT NULL,
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      status VARCHAR(20) DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS review_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      target_id INTEGER NOT NULL,
      title VARCHAR(100) NOT NULL,
      description TEXT,
      deadline DATETIME NOT NULL,
      status VARCHAR(20) DEFAULT 'open',
      required_qualifications TEXT,
      reward DECIMAL(10, 2) DEFAULT 0,
      reviewer_id INTEGER,
      FOREIGN KEY (plan_id) REFERENCES evaluation_plans(id),
      FOREIGN KEY (target_id) REFERENCES evaluation_targets(id),
      FOREIGN KEY (reviewer_id) REFERENCES reviewers(id)
    );

    CREATE TABLE IF NOT EXISTS evaluation_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      title VARCHAR(200) NOT NULL,
      summary TEXT,
      overall_score DECIMAL(5, 2),
      dimension_scores TEXT,
      status VARCHAR(30) DEFAULT 'draft',
      pdf_url VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      published_at DATETIME,
      FOREIGN KEY (target_id) REFERENCES evaluation_targets(id),
      FOREIGN KEY (reviewer_id) REFERENCES reviewers(id)
    );

    CREATE TABLE IF NOT EXISTS indicator_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      indicator_id INTEGER NOT NULL,
      score DECIMAL(5, 2) NOT NULL,
      weight DECIMAL(5, 4) NOT NULL,
      FOREIGN KEY (report_id) REFERENCES evaluation_reports(id),
      FOREIGN KEY (indicator_id) REFERENCES evaluation_indicators(id)
    );

    CREATE TABLE IF NOT EXISTS data_sources (
      id VARCHAR(50) PRIMARY KEY,
      indicator_score_id INTEGER NOT NULL,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20) NOT NULL,
      collected_at DATETIME NOT NULL,
      raw_value DECIMAL(10, 2) NOT NULL,
      normalized_value DECIMAL(5, 2) NOT NULL,
      verified BOOLEAN DEFAULT 0,
      FOREIGN KEY (indicator_score_id) REFERENCES indicator_scores(id)
    );

    CREATE TABLE IF NOT EXISTS appeals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id INTEGER NOT NULL,
      report_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      evidence TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME,
      processor_note TEXT,
      FOREIGN KEY (brand_id) REFERENCES brands(id),
      FOREIGN KEY (report_id) REFERENCES evaluation_reports(id)
    );

    CREATE TABLE IF NOT EXISTS rankings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category VARCHAR(50) NOT NULL,
      city VARCHAR(50) NOT NULL,
      period VARCHAR(20) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ranking_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ranking_id INTEGER NOT NULL,
      rank INTEGER NOT NULL,
      target_id INTEGER NOT NULL,
      overall_score DECIMAL(5, 2) NOT NULL,
      previous_rank INTEGER,
      change_trend VARCHAR(10) DEFAULT 'stable',
      report_id INTEGER NOT NULL,
      FOREIGN KEY (ranking_id) REFERENCES rankings(id),
      FOREIGN KEY (target_id) REFERENCES evaluation_targets(id),
      FOREIGN KEY (report_id) REFERENCES evaluation_reports(id)
    );

    CREATE TABLE IF NOT EXISTS weight_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category VARCHAR(50) UNIQUE NOT NULL,
      dimension_weights TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category) REFERENCES evaluation_categories(code)
    );

    CREATE TABLE IF NOT EXISTS review_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      admin_id INTEGER NOT NULL,
      action VARCHAR(20) NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES evaluation_reports(id),
      FOREIGN KEY (admin_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_targets_category_city ON evaluation_targets(category, city);
    CREATE INDEX IF NOT EXISTS idx_reports_target_status ON evaluation_reports(target_id, status);
    CREATE INDEX IF NOT EXISTS idx_rankings_category_city_period ON rankings(category, city, period);
    CREATE INDEX IF NOT EXISTS idx_tasks_status_deadline ON review_tasks(status, deadline);
    CREATE INDEX IF NOT EXISTS idx_appeals_status ON appeals(status);
  `);
};

const seedData = () => {
  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM evaluation_categories');
  const { count } = checkStmt.get() as { count: number };
  if (count > 0) return;

  const insertCategory = db.prepare(
    'INSERT INTO evaluation_categories (code, name, description) VALUES (?, ?, ?)'
  );
  insertCategory.run('consumer', '消费品', '食品、饮料、日用品等消费产品');
  insertCategory.run('education', '教育机构', '培训机构、学校、在线教育平台');
  insertCategory.run('medical', '医美服务', '医疗美容机构、整形医院');
  insertCategory.run('travel', '旅游景点', '景区、酒店、旅行社');

  const insertIndicator = db.prepare(
    'INSERT INTO evaluation_indicators (name, code, category, default_weight, description) VALUES (?, ?, ?, ?, ?)'
  );
  const indicators = [
    ['产品质量', 'consumer_quality', 'consumer', 0.30, '产品品质、材质、做工'],
    ['性价比', 'consumer_value', 'consumer', 0.25, '价格与价值的匹配度'],
    ['品牌口碑', 'consumer_reputation', 'consumer', 0.20, '消费者评价与品牌形象'],
    ['售后服务', 'consumer_service', 'consumer', 0.15, '退换货、客服响应'],
    ['合规性', 'consumer_compliance', 'consumer', 0.10, '质量认证、标准符合性'],
    ['师资力量', 'edu_teachers', 'education', 0.30, '教师资质、教学经验'],
    ['教学质量', 'edu_quality', 'education', 0.25, '课程设计、教学效果'],
    ['学员满意度', 'edu_satisfaction', 'education', 0.20, '学员评价、续费率'],
    ['办学资质', 'edu_license', 'education', 0.15, '办学许可证、合规性'],
    ['性价比', 'edu_value', 'education', 0.10, '学费与价值匹配'],
    ['资质合规性', 'med_license', 'medical', 0.35, '医疗许可证、医师资质'],
    ['医疗安全', 'med_safety', 'medical', 0.30, '事故率、并发症记录'],
    ['服务质量', 'med_service', 'medical', 0.15, '术前咨询、术后护理'],
    ['效果满意度', 'med_result', 'medical', 0.15, '术后效果评价'],
    ['价格透明度', 'med_price', 'medical', 0.05, '定价公开、无隐形消费'],
    ['景区品质', 'travel_quality', 'travel', 0.30, '景观质量、设施完善度'],
    ['服务水平', 'travel_service', 'travel', 0.25, '导游服务、客服响应'],
    ['游客体验', 'travel_experience', 'travel', 0.20, '游玩体验、排队情况'],
    ['性价比', 'travel_value', 'travel', 0.15, '门票价格合理性'],
    ['交通便利性', 'travel_transport', 'travel', 0.10, '交通可达性、停车设施'],
  ];
  for (const ind of indicators) {
    insertIndicator.run(ind[0], ind[1], ind[2], ind[3] as number, ind[4]);
  }

  const insertWeight = db.prepare(
    'INSERT INTO weight_configs (category, dimension_weights) VALUES (?, ?)'
  );
  insertWeight.run(
    'consumer',
    JSON.stringify({
      dimensions: [
        { name: '产品品质', weight: 0.30, indicators: [{ code: 'consumer_quality', weight: 1.0 }] },
        { name: '性价比', weight: 0.25, indicators: [{ code: 'consumer_value', weight: 1.0 }] },
        {
          name: '口碑服务',
          weight: 0.35,
          indicators: [
            { code: 'consumer_reputation', weight: 0.57 },
            { code: 'consumer_service', weight: 0.43 },
          ],
        },
        { name: '合规性', weight: 0.10, indicators: [{ code: 'consumer_compliance', weight: 1.0 }] },
      ],
    })
  );
  insertWeight.run(
    'education',
    JSON.stringify({
      dimensions: [
        {
          name: '教学实力',
          weight: 0.55,
          indicators: [
            { code: 'edu_teachers', weight: 0.55 },
            { code: 'edu_quality', weight: 0.45 },
          ],
        },
        { name: '学员口碑', weight: 0.20, indicators: [{ code: 'edu_satisfaction', weight: 1.0 }] },
        { name: '合规资质', weight: 0.15, indicators: [{ code: 'edu_license', weight: 1.0 }] },
        { name: '性价比', weight: 0.10, indicators: [{ code: 'edu_value', weight: 1.0 }] },
      ],
    })
  );
  insertWeight.run(
    'medical',
    JSON.stringify({
      dimensions: [
        {
          name: '资质安全',
          weight: 0.65,
          indicators: [
            { code: 'med_license', weight: 0.54 },
            { code: 'med_safety', weight: 0.46 },
          ],
        },
        {
          name: '服务效果',
          weight: 0.30,
          indicators: [
            { code: 'med_service', weight: 0.50 },
            { code: 'med_result', weight: 0.50 },
          ],
        },
        { name: '价格透明', weight: 0.05, indicators: [{ code: 'med_price', weight: 1.0 }] },
      ],
    })
  );
  insertWeight.run(
    'travel',
    JSON.stringify({
      dimensions: [
        { name: '景区品质', weight: 0.30, indicators: [{ code: 'travel_quality', weight: 1.0 }] },
        {
          name: '服务体验',
          weight: 0.45,
          indicators: [
            { code: 'travel_service', weight: 0.56 },
            { code: 'travel_experience', weight: 0.44 },
          ],
        },
        { name: '性价比', weight: 0.15, indicators: [{ code: 'travel_value', weight: 1.0 }] },
        { name: '交通便利', weight: 0.10, indicators: [{ code: 'travel_transport', weight: 1.0 }] },
      ],
    })
  );

  const insertUser = db.prepare(
    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );
  insertUser.run('admin', 'admin@example.com', 'admin123', 'admin');
  insertUser.run('reviewer1', 'reviewer1@example.com', 'rev123', 'reviewer');
  insertUser.run('reviewer2', 'reviewer2@example.com', 'rev456', 'reviewer');
  insertUser.run('brand1', 'brand1@example.com', 'brand123', 'brand');
  insertUser.run('user1', 'user1@example.com', 'user123', 'user');

  const insertReviewer = db.prepare(
    'INSERT INTO reviewers (user_id, real_name, qualifications, professional_fields, quality_score, audit_status, total_reports) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  insertReviewer.run(
    2,
    '张三',
    JSON.stringify(['食品检测工程师', '营养学硕士']),
    JSON.stringify(['consumer', 'education']),
    95.5,
    'approved',
    28
  );
  insertReviewer.run(
    3,
    '李四',
    JSON.stringify(['旅游规划师', '景区评定员']),
    JSON.stringify(['travel', 'consumer']),
    92.0,
    'approved',
    35
  );

  const insertBrand = db.prepare(
    'INSERT INTO brands (name, category, business_license, contact_name, contact_phone, audit_status) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertBrand.run('美好食品有限公司', 'consumer', '91110000MA001ABC12', '王经理', '13800138001', 'approved');
  insertBrand.run('精英教育集团', 'education', '91110000MA002DEF34', '李主任', '13800138002', 'approved');
  insertBrand.run('华美医疗美容', 'medical', '91110000MA003MED56', '陈院长', '13800138003', 'approved');
  insertBrand.run('山水旅游集团', 'travel', '91110000MA004TRV78', '赵总', '13800138004', 'approved');

  const insertTarget = db.prepare(
    'INSERT INTO evaluation_targets (name, category, city, brand_id, description) VALUES (?, ?, ?, ?, ?)'
  );
  const targets = [
    ['美好有机牛奶 1L装', 'consumer', '北京', 1, '采用有机牧场奶源，富含优质蛋白质和钙质'],
    ['精英少儿英语培训课程', 'education', '北京', 2, '专为3-12岁儿童设计的沉浸式英语课程'],
    ['华美双眼皮整形术', 'medical', '上海', 3, '微创双眼皮整形手术，术后恢复快'],
    ['山水度假温泉酒店', 'travel', '杭州', 4, '五星级温泉度假酒店，紧邻自然风景区'],
    ['美好坚果大礼包', 'consumer', '北京', 1, '精选六种进口坚果，健康零食首选'],
    ['精英高考冲刺辅导班', 'education', '上海', 2, '名师团队执教，历年高升学率'],
    ['华美玻尿酸注射', 'medical', '北京', 3, '进口玻尿酸，安全放心微整形'],
    ['山水古镇景区门票', 'travel', '苏州', 4, '千年古镇，江南水乡风光'],
    ['美好全麦面包系列', 'consumer', '上海', 1, '无添加健康全麦面包，适合早餐'],
    ['华美隆鼻整形', 'medical', '广州', 3, '个性化隆鼻方案，自然美观'],
  ];
  for (const t of targets) {
    insertTarget.run(t[0], t[1], t[2], t[3] as number, t[4]);
  }

  const insertPlan = db.prepare(
    'INSERT INTO evaluation_plans (name, category, city, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertPlan.run('2026年Q2北京消费品评测', 'consumer', '北京', '2026-04-01 00:00:00', '2026-06-30 23:59:59', 'active');
  insertPlan.run('2026年Q2上海医美服务评测', 'medical', '上海', '2026-04-01 00:00:00', '2026-06-30 23:59:59', 'active');

  const insertTask = db.prepare(
    'INSERT INTO review_tasks (plan_id, target_id, title, description, deadline, required_qualifications, reward) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  insertTask.run(1, 1, '美好有机牛奶评测', '对美好有机牛奶进行全面品质评测', '2026-06-30 23:59:59', JSON.stringify(['食品检测工程师']), 500);
  insertTask.run(1, 5, '美好坚果大礼包评测', '对坚果礼包品质和口碑进行评测', '2026-06-30 23:59:59', JSON.stringify(['食品检测工程师']), 400);
  insertTask.run(2, 3, '华美双眼皮整形术评测', '对华美双眼皮整形的资质和效果评测', '2026-06-30 23:59:59', JSON.stringify(['医疗资质审核员']), 800);

  const categoryWeightDimensions: Record<string, any> = {
    consumer: [
      { name: '产品品质', weight: 0.30, indicators: [{ code: 'consumer_quality', weight: 1.0 }] },
      { name: '性价比', weight: 0.25, indicators: [{ code: 'consumer_value', weight: 1.0 }] },
      { name: '口碑服务', weight: 0.35, indicators: [{ code: 'consumer_reputation', weight: 0.57 }, { code: 'consumer_service', weight: 0.43 }] },
      { name: '合规性', weight: 0.10, indicators: [{ code: 'consumer_compliance', weight: 1.0 }] },
    ],
    education: [
      { name: '教学实力', weight: 0.55, indicators: [{ code: 'edu_teachers', weight: 0.55 }, { code: 'edu_quality', weight: 0.45 }] },
      { name: '学员口碑', weight: 0.20, indicators: [{ code: 'edu_satisfaction', weight: 1.0 }] },
      { name: '合规资质', weight: 0.15, indicators: [{ code: 'edu_license', weight: 1.0 }] },
      { name: '性价比', weight: 0.10, indicators: [{ code: 'edu_value', weight: 1.0 }] },
    ],
    medical: [
      { name: '资质安全', weight: 0.65, indicators: [{ code: 'med_license', weight: 0.54 }, { code: 'med_safety', weight: 0.46 }] },
      { name: '服务效果', weight: 0.30, indicators: [{ code: 'med_service', weight: 0.50 }, { code: 'med_result', weight: 0.50 }] },
      { name: '价格透明', weight: 0.05, indicators: [{ code: 'med_price', weight: 1.0 }] },
    ],
    travel: [
      { name: '景区品质', weight: 0.30, indicators: [{ code: 'travel_quality', weight: 1.0 }] },
      { name: '服务体验', weight: 0.45, indicators: [{ code: 'travel_service', weight: 0.56 }, { code: 'travel_experience', weight: 0.44 }] },
      { name: '性价比', weight: 0.15, indicators: [{ code: 'travel_value', weight: 1.0 }] },
      { name: '交通便利', weight: 0.10, indicators: [{ code: 'travel_transport', weight: 1.0 }] },
    ],
  };

  const categoryIndicatorMap: Record<string, { id: number; code: string; weight: number }[]> = {
    consumer: [
      { id: 1, code: 'consumer_quality', weight: 0.30 },
      { id: 2, code: 'consumer_value', weight: 0.25 },
      { id: 3, code: 'consumer_reputation', weight: 0.20 },
      { id: 4, code: 'consumer_service', weight: 0.15 },
      { id: 5, code: 'consumer_compliance', weight: 0.10 },
    ],
    education: [
      { id: 6, code: 'edu_teachers', weight: 0.30 },
      { id: 7, code: 'edu_quality', weight: 0.25 },
      { id: 8, code: 'edu_satisfaction', weight: 0.20 },
      { id: 9, code: 'edu_license', weight: 0.15 },
      { id: 10, code: 'edu_value', weight: 0.10 },
    ],
    medical: [
      { id: 11, code: 'med_license', weight: 0.35 },
      { id: 12, code: 'med_safety', weight: 0.30 },
      { id: 13, code: 'med_service', weight: 0.15 },
      { id: 14, code: 'med_result', weight: 0.15 },
      { id: 15, code: 'med_price', weight: 0.05 },
    ],
    travel: [
      { id: 16, code: 'travel_quality', weight: 0.30 },
      { id: 17, code: 'travel_service', weight: 0.25 },
      { id: 18, code: 'travel_experience', weight: 0.20 },
      { id: 19, code: 'travel_value', weight: 0.15 },
      { id: 20, code: 'travel_transport', weight: 0.10 },
    ],
  };

  const sourceNamesByType: Record<string, { name: string; type: string }[]> = {
    consumer: [
      { name: '天猫旗舰店销量评分', type: 'ecommerce' },
      { name: '京东好评率', type: 'ecommerce' },
      { name: '黑猫投诉解决率', type: 'complaint' },
      { name: '大众点评口碑分', type: 'review' },
      { name: '国家市场监管局抽检', type: 'sampling' },
    ],
    education: [
      { name: '学员续报率', type: 'ecommerce' },
      { name: '教育局办学许可核查', type: 'government' },
      { name: '黑猫投诉处理率', type: 'complaint' },
      { name: '大众点评培训评价', type: 'review' },
      { name: '第三方满意度调查', type: 'sampling' },
    ],
    medical: [
      { name: '卫健委医疗机构许可证', type: 'government' },
      { name: '医师执业注册信息', type: 'government' },
      { name: '医疗纠纷投诉记录', type: 'complaint' },
      { name: '新氧医美口碑评分', type: 'review' },
      { name: '第三方术后抽样调查', type: 'sampling' },
    ],
    travel: [
      { name: '携程预订量评分', type: 'ecommerce' },
      { name: '文旅局景区评级', type: 'government' },
      { name: '12301旅游投诉处理', type: 'complaint' },
      { name: '马蜂窝游客评价', type: 'review' },
      { name: '景区客流抽样统计', type: 'sampling' },
    ],
  };

  const categorySummaries: Record<string, (score: number) => string> = {
    consumer: (s: number) =>
      s >= 85 ? '该消费品在品质、性价比和服务方面均表现优秀，消费者口碑良好，推荐购买。' :
      s >= 70 ? '该消费品整体表现中规中矩，部分指标有待提升，建议关注售后服务。' :
      '该消费品存在较多问题，建议谨慎购买。',
    education: (s: number) =>
      s >= 85 ? '该教育机构师资力量雄厚，教学质量优秀，学员满意度高，值得信赖。' :
      s >= 70 ? '该教育机构整体表现尚可，建议重点考察师资和课程内容。' :
      '该教育机构存在明显不足，建议多方比较后再做决定。',
    medical: (s: number) =>
      s >= 85 ? '该医美机构资质齐全合规，医疗安全有保障，服务效果良好，强烈推荐。' :
      s >= 70 ? '该医美机构基本合规，建议关注医师资质和术后护理服务。' :
      '该医美机构存在合规风险，不建议选择。',
    travel: (s: number) =>
      s >= 85 ? '该旅游目的地品质优秀，服务完善，游客体验良好，强烈推荐。' :
      s >= 70 ? '该旅游目的地整体尚可，建议避开高峰期以获得更好体验。' :
      '该旅游目的地体验较差，建议谨慎选择。',
  };

  function rand(min: number, max: number): number {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
  }

  function calculateScore(indicatorScores: { code: string; score: number }[], category: string): { overall: number; dimScores: any[] } {
    const dims = categoryWeightDimensions[category];
    const scoreMap = new Map(indicatorScores.map(s => [s.code, s.score]));
    const dimScores: any[] = [];
    let overall = 0;
    for (const dim of dims) {
      let ds = 0;
      for (const ind of dim.indicators) {
        ds += (scoreMap.get(ind.code) || 0) * ind.weight;
      }
      dimScores.push({ dimension: dim.name, score: Math.round(ds * 100) / 100, weight: dim.weight });
      overall += ds * dim.weight;
    }
    return { overall: Math.round(overall * 100) / 100, dimScores };
  }

  const insertReport = db.prepare(
    'INSERT INTO evaluation_reports (target_id, reviewer_id, title, summary, overall_score, dimension_scores, status, published_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertIndicatorScore = db.prepare(
    'INSERT INTO indicator_scores (report_id, indicator_id, score, weight) VALUES (?, ?, ?, ?)'
  );
  const insertDataSource = db.prepare(
    'INSERT INTO data_sources (id, indicator_score_id, name, type, collected_at, raw_value, normalized_value, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const targetRows = db.prepare('SELECT id, name, category, city FROM evaluation_targets ORDER BY id').all() as any[];

  const reportsByCategory: Record<string, { id: number; targetId: number; targetName: string; overallScore: number; dimScores: any[] }[]> = {
    consumer: [], education: [], medical: [], travel: [],
  };

  for (const target of targetRows) {
    const numReports = target.id <= 5 ? 2 : 1;
    for (let r = 0; r < numReports; r++) {
      const reviewerId = (target.id % 2) + 1;
      const indicators = categoryIndicatorMap[target.category];

      const indScores: { code: string; score: number; indicatorId: number; weight: number }[] = indicators.map(ind => ({
        code: ind.code,
        score: rand(68, 96),
        indicatorId: ind.id,
        weight: ind.weight,
      }));

      const { overall, dimScores } = calculateScore(indScores, target.category);

      const now = new Date(Date.now() - r * 86400000 * 5).toISOString();
      const result = insertReport.run(
        target.id,
        reviewerId,
        `${target.name} 综合评测报告${r > 0 ? '（补充）' : ''}`,
        categorySummaries[target.category](overall),
        overall,
        JSON.stringify(dimScores),
        'published',
        now,
        now
      );
      const reportId = result.lastInsertRowid as number;

      reportsByCategory[target.category].push({
        id: reportId,
        targetId: target.id,
        targetName: target.name,
        overallScore: overall,
        dimScores,
      });

      for (const is of indScores) {
        const isResult = insertIndicatorScore.run(reportId, is.indicatorId, is.score, is.weight);
        const isId = isResult.lastInsertRowid as number;

        const sources = sourceNamesByType[target.category];
        const baseScore = is.score;
        sources.forEach((src, idx) => {
          const raw = rand(Math.max(60, baseScore - 8), Math.min(100, baseScore + 5));
          const verified = Math.abs(raw - baseScore) <= 8;
          insertDataSource.run(
            `ds_${reportId}_${isId}_${idx}`,
            isId,
            src.name,
            src.type,
            now,
            raw,
            raw,
            verified ? 1 : 0
          );
        });
      }
    }
  }

  const insertRanking = db.prepare(
    'INSERT INTO rankings (category, city, period, created_at) VALUES (?, ?, ?, ?)'
  );
  const insertRankingItem = db.prepare(
    'INSERT INTO ranking_items (ranking_id, rank, target_id, overall_score, previous_rank, change_trend, report_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const cities = ['北京', '上海', '杭州', '苏州', '广州'];
  const periods = ['2026Q1', '2026Q2'];

  for (const cat of ['consumer', 'education', 'medical', 'travel']) {
    for (const city of cities) {
      const cityReports = reportsByCategory[cat];
      if (cityReports.length === 0) continue;

      for (const period of periods) {
        const selected = cityReports
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(5, cityReports.length))
          .sort((a, b) => b.overallScore - a.overallScore);

        if (selected.length === 0) continue;

        const rResult = insertRanking.run(cat, city, period, new Date().toISOString());
        const rankingId = rResult.lastInsertRowid as number;

        selected.forEach((rep, idx) => {
          const prevRank = idx + Math.floor(Math.random() * 3) - 1;
          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (idx + 1 < prevRank) trend = 'up';
          else if (idx + 1 > prevRank) trend = 'down';
          insertRankingItem.run(
            rankingId,
            idx + 1,
            rep.targetId,
            rep.overallScore,
            Math.max(1, prevRank),
            trend,
            rep.id
          );
        });
      }
    }
  }

  const insertAppeal = db.prepare(
    'INSERT INTO appeals (brand_id, report_id, reason, evidence, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertAppeal.run(
    3,
    3,
    '报告中关于医师资质的描述有误，我方所有医师均持有合法执业证书。',
    JSON.stringify(['https://example.com/license1.jpg', 'https://example.com/license2.jpg']),
    'pending',
    new Date().toISOString()
  );
  insertAppeal.run(
    1,
    1,
    '售后服务评分偏低，我方近期已升级客服体系，请求重新评估。',
    JSON.stringify(['https://example.com/service-report.pdf']),
    'processing',
    new Date(Date.now() - 86400000).toISOString()
  );
};

export const initDatabase = () => {
  createTables();
  seedData();
  console.log('Database initialized successfully');
};
