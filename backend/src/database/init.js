const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const fs = require('fs');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const init = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'owner',
      avatar TEXT,
      status INTEGER DEFAULT 1,
      company_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      license_no TEXT,
      housing_approval_no TEXT,
      qualification_level TEXT,
      legal_person TEXT,
      contact_phone TEXT,
      address TEXT,
      region TEXT,
      status INTEGER DEFAULT 0,
      audit_status TEXT DEFAULT 'pending',
      audit_remark TEXT,
      audit_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      owner_id INTEGER,
      company_id INTEGER,
      designer_id INTEGER,
      layout_type TEXT,
      style TEXT,
      budget_range TEXT,
      area REAL,
      city TEXT,
      community TEXT,
      main_image TEXT,
      total_cost REAL,
      status TEXT DEFAULT 'published',
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS case_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      image_type TEXT,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS style_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      floor_plan_url TEXT NOT NULL,
      style TEXT NOT NULL,
      result_image_url TEXT,
      status TEXT DEFAULT 'processing',
      params TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER,
      project_id INTEGER,
      owner_id INTEGER,
      company_id INTEGER,
      title TEXT NOT NULL,
      total_amount REAL DEFAULT 0,
      hard_decoration_amount REAL DEFAULT 0,
      soft_decoration_amount REAL DEFAULT 0,
      material_amount REAL DEFAULT 0,
      labor_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      valid_days INTEGER DEFAULT 30,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quotation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      item_name TEXT NOT NULL,
      specification TEXT,
      unit TEXT,
      quantity REAL,
      unit_price REAL,
      total_price REAL,
      remark TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER,
      quotation_id INTEGER,
      owner_id INTEGER,
      company_id INTEGER,
      designer_id INTEGER,
      manager_id INTEGER,
      title TEXT NOT NULL,
      address TEXT,
      area REAL,
      layout_type TEXT,
      style TEXT,
      budget REAL,
      start_date DATE,
      end_date DATE,
      actual_start_date DATE,
      actual_end_date DATE,
      status TEXT DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS designer_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      designer_id INTEGER NOT NULL,
      project_id INTEGER,
      task_name TEXT NOT NULL,
      task_type TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      status TEXT DEFAULT 'scheduled',
      priority INTEGER DEFAULT 2,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS construction_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      task_name TEXT NOT NULL,
      task_code TEXT,
      parent_id INTEGER,
      start_date DATE,
      end_date DATE,
      actual_start_date DATE,
      actual_end_date DATE,
      duration INTEGER,
      progress INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      assignee_id INTEGER,
      remark TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS material_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      material_name TEXT NOT NULL,
      specification TEXT,
      brand TEXT,
      quantity REAL,
      unit TEXT,
      unit_price REAL,
      total_price REAL,
      planned_arrival_date DATE,
      actual_arrival_date DATE,
      status TEXT DEFAULT 'pending',
      supplier TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS construction_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      manager_id INTEGER,
      log_date DATE NOT NULL,
      weather TEXT,
      temperature TEXT,
      content TEXT NOT NULL,
      voice_note_url TEXT,
      voice_duration INTEGER,
      worker_count INTEGER,
      work_content TEXT,
      problem TEXT,
      solution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS log_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id INTEGER NOT NULL,
      photo_url TEXT NOT NULL,
      watermark TEXT,
      gps_lat REAL,
      gps_lng REAL,
      taken_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS acceptance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      stage TEXT NOT NULL,
      task_id INTEGER,
      checker_id INTEGER,
      check_date DATETIME,
      gps_lat REAL,
      gps_lng REAL,
      gps_fence_radius REAL,
      is_in_fence INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      overall_result TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS acceptance_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      acceptance_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      check_content TEXT,
      standard TEXT,
      is_passed INTEGER,
      remark TEXT,
      photo_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fund_supervision (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      stage TEXT NOT NULL,
      stage_name TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_ratio REAL,
      status TEXT DEFAULT 'frozen',
      paid_at DATETIME,
      released_at DATETIME,
      release_condition TEXT,
      payer_id INTEGER,
      payee_id INTEGER,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS disputes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      complainant_id INTEGER,
      respondent_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      evidence TEXT,
      status TEXT DEFAULT 'submitted',
      arbitrator_id INTEGER,
      arbitration_result TEXT,
      arbitration_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS process_knowledge (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      video_url TEXT,
      standard TEXT,
      acceptance_criteria TEXT,
      safety_notes TEXT,
      duration_standard INTEGER,
      view_count INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS material_price_monitor (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_name TEXT NOT NULL,
      specification TEXT,
      brand TEXT,
      unit TEXT,
      region TEXT,
      price REAL NOT NULL,
      price_date DATE NOT NULL,
      trend TEXT,
      change_rate REAL,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      complainant_id INTEGER,
      company_id INTEGER,
      type TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      handler_id INTEGER,
      handle_result TEXT,
      handle_time DATETIME,
      trace_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      module TEXT,
      target_id INTEGER,
      ip TEXT,
      user_agent TEXT,
      request_data TEXT,
      response_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT,
      title TEXT NOT NULL,
      content TEXT,
      related_id INTEGER,
      related_type TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const hashedPassword = bcrypt.hashSync('123456', 10);

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, password, name, phone, role, status)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  insertUser.run('admin', hashedPassword, '系统管理员', '13800000000', 'admin');
  insertUser.run('owner1', hashedPassword, '业主张先生', '13900000001', 'owner');
  insertUser.run('owner2', hashedPassword, '业主李女士', '13900000002', 'owner');
  insertUser.run('designer1', hashedPassword, '设计师王工', '13700000001', 'designer');
  insertUser.run('designer2', hashedPassword, '设计师刘工', '13700000002', 'designer');
  insertUser.run('manager1', hashedPassword, '管家陈经理', '13600000001', 'manager');
  insertUser.run('manager2', hashedPassword, '管家赵经理', '13600000002', 'manager');
  insertUser.run('company1', hashedPassword, '装修公司账号', '13500000001', 'company_admin');

  const insertCompany = db.prepare(`
    INSERT OR IGNORE INTO companies (name, license_no, housing_approval_no, qualification_level, legal_person, contact_phone, address, region, status, audit_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCompany.run(
    '尚品装饰工程有限公司',
    '91110000MA001ABC12',
    '住建备字第2023-0089号',
    '一级资质',
    '张总',
    '400-800-8888',
    '北京市朝阳区建国路88号',
    '北京市',
    1,
    'approved'
  );

  db.prepare('UPDATE users SET company_id = 1 WHERE username IN (?, ?, ?, ?)').run(
    'company1', 'designer1', 'designer2', 'manager1'
  );

  const insertCase = db.prepare(`
    INSERT OR IGNORE INTO cases (title, description, owner_id, company_id, designer_id, layout_type, style, budget_range, area, city, community, total_cost, view_count, like_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCase.run(
    '现代简约三居室精品案例',
    '年轻夫妇首选，时尚简约风格，空间利用最大化，整体色调以灰白为主，搭配原木色家具，营造温馨舒适的居家氛围。',
    2, 1, 4, '三室两厅', '现代简约', '10-15万', 115.5, '北京市', '万科城市花园', 138000, 1256, 89
  );
  insertCase.run(
    '新中式四居室大宅设计',
    '传统文化与现代生活完美融合，实木家具搭配传统元素，展现东方美学韵味。适合三代同堂家庭居住。',
    3, 1, 5, '四室两厅', '新中式', '30-50万', 180.0, '北京市', '龙湖滟澜山', 425000, 2341, 156
  );
  insertCase.run(
    '北欧风两居室温馨小窝',
    '清新自然北欧风格，白色主调搭配绿植，小户型也能拥有大空间感。适合年轻白领一族。',
    2, 1, 4, '两室一厅', '北欧风格', '8-12万', 78.0, '北京市', '保利中央公园', 98000, 3567, 234
  );
  insertCase.run(
    '轻奢美式三居室',
    '典雅美式风格，金属线条搭配皮质家具，彰显品质生活。全屋智能家居系统配套。',
    3, 1, 5, '三室两厅', '轻奢美式', '20-30万', 135.0, '北京市', '中海紫御公馆', 268000, 1892, 145
  );
  insertCase.run(
    '日式极简两居室',
    '禅意日式风格，原木质感，榻榻米设计，注重收纳功能，打造宁静致远的生活空间。',
    2, 1, 4, '两室两厅', '日式极简', '15-20万', 95.0, '北京市', '华润橡树湾', 178000, 987, 78
  );

  const styles = ['现代简约', '新中式', '北欧风格', '轻奢美式', '日式极简', '欧式古典', '工业风格', '地中海'];
  const layouts = ['一室一厅', '两室一厅', '两室两厅', '三室一厅', '三室两厅', '四室两厅', '复式', '别墅'];
  const budgets = ['5-10万', '10-15万', '15-20万', '20-30万', '30-50万', '50万以上'];

  for (let i = 6; i <= 30; i++) {
    const style = styles[Math.floor(Math.random() * styles.length)];
    const layout = layouts[Math.floor(Math.random() * layouts.length)];
    const budget = budgets[Math.floor(Math.random() * budgets.length)];
    const area = 50 + Math.floor(Math.random() * 200);
    const cost = Math.floor(Math.random() * 500000) + 50000;
    insertCase.run(
      `${style}${layout}案例${i}`,
      `精选${style}风格${layout}装修案例，由资深设计师精心打造，品质保证。`,
      Math.random() > 0.5 ? 2 : 3,
      1,
      Math.random() > 0.5 ? 4 : 5,
      layout,
      style,
      budget,
      area,
      '北京市',
      `示例小区${i}`,
      cost,
      Math.floor(Math.random() * 5000),
      Math.floor(Math.random() * 300)
    );
  }

  const insertProcess = db.prepare(`
    INSERT OR IGNORE INTO process_knowledge (category, title, content, standard, acceptance_criteria, safety_notes, duration_standard)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const processes = [
    ['拆改工程', '墙体拆除', '按设计图纸进行非承重墙体拆除，清理现场', '墙体拆除平整，无残留', '拆除范围符合设计，墙体无裂纹', '佩戴安全帽，注意楼板保护', 3],
    ['水电工程', '水电交底', '设计师、工长、业主现场确认水电点位', '点位标记清晰，符合使用习惯', '所有点位确认签字', '断电断水作业', 1],
    ['水电工程', '水路改造', 'PPR水管铺设，冷热水管区分', '打压测试10kg/30分钟不降压', '水路走向合理，接口无渗漏', '避免破坏原有管线', 5],
    ['水电工程', '电路改造', '穿管布线，强电弱电分离', '摇表测试绝缘电阻大于0.5MΩ', '线径符合负载要求，走向合理', '断电作业，规范接线', 7],
    ['泥瓦工程', '地面找平', '水泥砂浆找平，保证平整度', '2米靠尺误差不超过3mm', '无空鼓、无裂缝', '注意成品保护', 3],
    ['泥瓦工程', '墙面抹灰', '基层处理，挂网抹灰', '垂直度误差不超过3mm', '无空鼓、无裂缝、无掉灰', '注意安全防护', 5],
    ['泥瓦工程', '瓷砖铺贴', '墙地砖铺贴，留缝处理', '空鼓率不超过5%，阴阳角90度', '平整度达标，缝隙均匀', '防止瓷砖脱落', 10],
    ['木工工程', '吊顶制作', '龙骨安装，石膏板封面', '龙骨间距不超过400mm', '无下坠、无开裂', '高空作业注意安全', 7],
    ['木工工程', '定制柜体', '衣柜、橱柜等定制家具安装', '尺寸精准，门缝均匀', '开合顺畅，五金件齐全', '注意边角保护', 15],
    ['油漆工程', '墙面批灰', '刮腻子，砂纸打磨', '平整度误差不超过2mm', '无透底、无流挂', '佩戴防毒面具', 7],
    ['油漆工程', '乳胶漆涂刷', '底漆一遍，面漆两遍', '颜色均匀，无刷痕', '无漏刷、无色差', '保证通风', 5],
    ['安装工程', '地板铺设', '实木地板或复合地板安装', '缝隙均匀，行走无异响', '平整度达标，无起翘', '注意防潮处理', 3],
    ['安装工程', '洁具安装', '马桶、洗手盆、淋浴等安装', '无渗漏，安装牢固', '使用功能正常', '注意防水保护', 2],
    ['安装工程', '灯具安装', '主灯、筒灯、开关等安装', '接线正确，开关顺畅', '灯具无损坏，照明正常', '断电作业', 2],
    ['竣工验收', '整体验收', '各分项工程综合验收', '所有项目达标', '业主签字确认', '整理验收资料', 1]
  ];

  processes.forEach(p => insertProcess.run(...p));

  const insertMaterial = db.prepare(`
    INSERT OR IGNORE INTO material_price_monitor (material_name, specification, brand, unit, region, price, price_date, trend, change_rate, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const materials = [
    ['PPR水管', 'Dn25', '伟星', '米', '北京市', 18.5, '2026-06-01', 'stable', 0.5, '建材市场'],
    ['PPR水管', 'Dn20', '伟星', '米', '北京市', 15.0, '2026-06-01', 'stable', 0.2, '建材市场'],
    ['电线', 'BV2.5mm²', '远东', '米', '北京市', 3.8, '2026-06-01', 'up', 2.1, '建材市场'],
    ['电线', 'BV4mm²', '远东', '米', '北京市', 6.2, '2026-06-01', 'up', 1.8, '建材市场'],
    ['瓷砖', '800x800mm', '东鹏', '片', '北京市', 128.0, '2026-06-01', 'down', -1.2, '建材市场'],
    ['瓷砖', '600x600mm', '诺贝尔', '片', '北京市', 89.0, '2026-06-01', 'stable', 0, '建材市场'],
    ['乳胶漆', '5L', '多乐士', '桶', '北京市', 680.0, '2026-06-01', 'up', 3.5, '建材市场'],
    ['乳胶漆', '18L', '立邦', '桶', '北京市', 899.0, '2026-06-01', 'stable', 0.8, '建材市场'],
    ['实木地板', '910x125mm', '大自然', '平米', '北京市', 358.0, '2026-06-01', 'up', 2.8, '建材市场'],
    ['复合地板', '1218x198mm', '圣象', '平米', '北京市', 168.0, '2026-06-01', 'down', -0.5, '建材市场'],
    ['木工板', '1220x2440x18mm', '兔宝宝', '张', '北京市', 268.0, '2026-06-01', 'stable', 1.2, '建材市场'],
    ['石膏板', '1200x2400x9.5mm', '龙牌', '张', '北京市', 45.0, '2026-06-01', 'stable', 0, '建材市场'],
    ['铝合金门窗', '断桥铝', '实德', '平米', '北京市', 580.0, '2026-06-01', 'up', 4.2, '建材市场'],
    ['防盗门', '2050x950mm', '盼盼', '樘', '北京市', 3280.0, '2026-06-01', 'stable', 1.5, '建材市场'],
    ['马桶', '虹吸式', 'TOTO', '个', '北京市', 2899.0, '2026-06-01', 'down', -2.1, '建材市场']
  ];

  materials.forEach(m => insertMaterial.run(...m));

  const insertProject = db.prepare(`
    INSERT OR IGNORE INTO projects (title, owner_id, company_id, designer_id, manager_id, address, area, layout_type, style, budget, start_date, end_date, status, progress)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertProject.run(
    '万科城市花园张先生家装修工程',
    2, 1, 4, 6,
    '北京市朝阳区万科城市花园3号楼2单元1502',
    115.5, '三室两厅', '现代简约', 138000,
    '2026-06-01', '2026-09-15',
    'in_progress', 35
  );
  insertProject.run(
    '龙湖滟澜山李女士家大宅装修',
    3, 1, 5, 7,
    '北京市顺义区龙湖滟澜山A区5栋101',
    180.0, '四室两厅', '新中式', 425000,
    '2026-05-15', '2026-10-30',
    'in_progress', 52
  );

  const stages = [
    { name: '设计阶段', ratio: 10, amount: 13800 },
    { name: '拆改阶段', ratio: 10, amount: 13800 },
    { name: '水电阶段', ratio: 20, amount: 27600 },
    { name: '泥瓦阶段', ratio: 20, amount: 27600 },
    { name: '木工阶段', ratio: 15, amount: 20700 },
    { name: '油漆阶段', ratio: 15, amount: 20700 },
    { name: '安装阶段', ratio: 8, amount: 11040 },
    { name: '竣工验收', ratio: 2, amount: 2760 }
  ];

  const insertFund = db.prepare(`
    INSERT OR IGNORE INTO fund_supervision (project_id, stage, stage_name, amount, payment_ratio, status, release_condition)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stages.forEach((s, i) => {
    let status = 'frozen';
    if (i < 2) status = 'released';
    else if (i === 2) status = 'pending_release';
    insertFund.run(1, `stage_${i + 1}`, s.name, s.amount, s.ratio, status, `${s.name}验收合格后释放`);
  });

  const insertQuotation = db.prepare(`
    INSERT OR IGNORE INTO quotations (case_id, project_id, owner_id, company_id, title, total_amount, hard_decoration_amount, soft_decoration_amount, material_amount, labor_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertQuotation.run(1, 1, 2, 1, '万科城市花园张先生家装修报价', 138000, 78000, 35000, 65000, 38000, 'confirmed');

  const insertQuotationItem = db.prepare(`
    INSERT OR IGNORE INTO quotation_items (quotation_id, category, item_name, specification, unit, quantity, unit_price, total_price, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const quoteItems = [
    [1, '硬装-拆改', '墙体拆除', '非承重墙体', '平米', 28, 80, 2240, 1],
    [1, '硬装-拆改', '垃圾清运', '外运', '车', 5, 300, 1500, 2],
    [1, '硬装-水电', '水路改造', 'PPR Dn25', '米', 65, 85, 5525, 3],
    [1, '硬装-水电', '电路改造', 'BV2.5mm²', '米', 180, 65, 11700, 4],
    [1, '硬装-水电', '弱电改造', '超五类线', '米', 80, 55, 4400, 5],
    [1, '硬装-泥瓦', '地面找平', '水泥砂浆', '平米', 105, 55, 5775, 6],
    [1, '硬装-泥瓦', '地砖铺贴', '800x800', '平米', 95, 120, 11400, 7],
    [1, '硬装-泥瓦', '墙砖铺贴', '300x600', '平米', 65, 110, 7150, 8],
    [1, '硬装-泥瓦', '防水处理', '聚氨酯', '平米', 45, 95, 4275, 9],
    [1, '硬装-木工', '吊顶制作', '石膏板', '平米', 55, 180, 9900, 10],
    [1, '硬装-木工', '定制衣柜', 'E0级板材', '平米', 18, 680, 12240, 11],
    [1, '硬装-油漆', '墙面批灰', '耐水腻子', '平米', 320, 45, 14400, 12],
    [1, '硬装-油漆', '乳胶漆', '多乐士五合一', '平米', 320, 38, 12160, 13],
    [1, '硬装-安装', '地板铺贴', '复合地板', '平米', 75, 25, 1875, 14],
    [1, '硬装-安装', '洁具安装', '马桶、洗手盆', '套', 2, 300, 600, 15],
    [1, '硬装-安装', '灯具安装', '全屋灯具', '项', 1, 800, 800, 16],
    [1, '软装-家具', '沙发', '三人位+贵妃', '套', 1, 8500, 8500, 17],
    [1, '软装-家具', '餐桌椅', '1桌6椅', '套', 1, 4500, 4500, 18],
    [1, '软装-家具', '床', '1.8米双人床', '张', 2, 3500, 7000, 19],
    [1, '软装-家具', '电视柜', '定制', '米', 2.4, 1200, 2880, 20],
    [1, '软装-家电', '窗帘', '全屋定制', '套', 1, 4200, 4200, 21],
    [1, '软装-家电', '灯具', '主灯+辅灯', '套', 1, 3800, 3800, 22],
    [1, '软装-家电', '开关插座', '西门子', '套', 1, 1200, 1200, 23],
    [1, '软装-配饰', '装饰画', '客厅+卧室', '组', 3, 400, 1200, 24],
    [1, '其他', '设计费', '主案设计师', '项', 1, 8000, 8000, 25],
    [1, '其他', '管理费', '8%', '项', 1, 9600, 9600, 26],
    [1, '其他', '保洁费', '开荒保洁', '项', 1, 1200, 1200, 27]
  ];

  quoteItems.forEach(item => insertQuotationItem.run(...item));

  const insertTask = db.prepare(`
    INSERT OR IGNORE INTO construction_tasks (project_id, task_name, task_code, parent_id, start_date, end_date, duration, progress, status, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tasks = [
    [1, '项目启动', 'T001', null, '2026-06-01', '2026-06-02', 2, 100, 'completed', 1],
    [1, '设计交底', 'T002', null, '2026-06-03', '2026-06-03', 1, 100, 'completed', 2],
    [1, '拆改工程', 'T003', null, '2026-06-04', '2026-06-10', 7, 100, 'completed', 3],
    [1, '水电工程', 'T004', null, '2026-06-11', '2026-06-25', 15, 100, 'completed', 4],
    [1, '泥瓦工程', 'T005', null, '2026-06-26', '2026-07-15', 20, 65, 'in_progress', 5],
    [1, '木工工程', 'T006', null, '2026-07-10', '2026-07-30', 21, 10, 'in_progress', 6],
    [1, '油漆工程', 'T007', null, '2026-07-25', '2026-08-15', 22, 0, 'pending', 7],
    [1, '安装工程', 'T008', null, '2026-08-10', '2026-08-25', 16, 0, 'pending', 8],
    [1, '竣工验收', 'T009', null, '2026-08-26', '2026-09-15', 21, 0, 'pending', 9]
  ];

  tasks.forEach(t => insertTask.run(...t));

  const insertMaterialPlan = db.prepare(`
    INSERT OR IGNORE INTO material_plans (project_id, material_name, specification, brand, quantity, unit, unit_price, total_price, planned_arrival_date, status, supplier, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const materialsPlan = [
    [1, 'PPR水管', 'Dn25', '伟星', 80, '米', 18.5, 1480, '2026-06-10', 'delivered', '北京建材供应商A', '已验收'],
    [1, '电线', 'BV2.5mm²', '远东', 200, '米', 3.8, 760, '2026-06-10', 'delivered', '北京建材供应商A', '已验收'],
    [1, '电线', 'BV4mm²', '远东', 50, '米', 6.2, 310, '2026-06-10', 'delivered', '北京建材供应商A', '已验收'],
    [1, '瓷砖', '800x800mm', '东鹏', 150, '片', 128, 19200, '2026-06-25', 'delivered', '瓷砖专营店B', '已验收'],
    [1, '瓷砖', '300x600mm', '诺贝尔', 80, '片', 89, 7120, '2026-06-25', 'delivered', '瓷砖专营店B', '已验收'],
    [1, '乳胶漆', '5L', '多乐士', 6, '桶', 680, 4080, '2026-07-20', 'pending', '涂料经销商C', '待发货'],
    [1, '复合地板', '1218x198mm', '圣象', 120, '平米', 168, 20160, '2026-08-05', 'pending', '地板专营店D', '待确认']
  ];

  materialsPlan.forEach(m => insertMaterialPlan.run(...m));

  const insertLog = db.prepare(`
    INSERT OR IGNORE INTO construction_logs (project_id, manager_id, log_date, weather, temperature, content, worker_count, work_content, problem, solution)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const logs = [
    [1, 6, '2026-06-15', '晴', '22-32℃', '今日进行客厅地砖铺贴，工人6人，进度正常。', 6, '客厅地砖铺贴完成60%', '无', '无'],
    [1, 6, '2026-06-16', '多云', '21-30℃', '继续地砖铺贴，卫生间防水试验48小时。', 5, '客厅地砖完成，卫生间闭水试验中', '无', '无'],
    [1, 6, '2026-06-17', '小雨', '19-26℃', '因天气原因，木工材料进场推迟一天。', 4, '厨房墙砖铺贴', '材料进场延期', '已与供应商协调，明天上午送达'],
    [1, 6, '2026-06-18', '晴', '20-28℃', '木工材料进场，验收合格。厨房墙砖继续铺贴。', 7, '材料验收，墙砖铺贴', '无', '无'],
    [1, 7, '2026-06-19', '晴', '22-31℃', '卫生间闭水试验合格，通知业主验收。', 6, '闭水试验验收，墙砖继续', '无', '无'],
    [1, 6, '2026-06-20', '晴', '23-32℃', '业主到场验收防水，签字确认。开始吊顶龙骨施工。', 8, '防水验收通过，吊顶龙骨安装', '无', '无']
  ];

  logs.forEach(l => insertLog.run(...l));

  const insertAcceptance = db.prepare(`
    INSERT OR IGNORE INTO acceptance_records (project_id, stage, task_id, checker_id, check_date, gps_lat, gps_lng, gps_fence_radius, is_in_fence, status, overall_result, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAcceptance.run(1, 'waterproof', 4, 2, '2026-06-20 10:30:00', 39.9042, 116.4074, 200, 1, 'completed', 'passed', '防水试验48小时无渗漏，合格');

  const insertAcceptanceItem = db.prepare(`
    INSERT OR IGNORE INTO acceptance_items (acceptance_id, item_name, check_content, standard, is_passed, remark)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const acceptanceItems = [
    [1, '卫生间地面防水', '闭水试验48小时', '水位无明显下降，楼下无渗漏', 1, '合格'],
    [1, '卫生间墙面防水', '淋浴区1.8米高', '涂刷均匀，无漏刷', 1, '合格'],
    [1, '厨房地面防水', '闭水试验24小时', '无渗漏', 1, '合格'],
    [1, '阳台防水', '闭水试验24小时', '无渗漏', 1, '合格'],
    [1, '管口处理', '地漏、管根防水处理', '附加层处理到位', 1, '合格']
  ];

  acceptanceItems.forEach(a => insertAcceptanceItem.run(...a));

  const insertSchedule = db.prepare(`
    INSERT OR IGNORE INTO designer_schedules (designer_id, project_id, task_name, task_type, start_time, end_time, status, priority, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const schedules = [
    [4, 1, '现场交底', 'site_visit', '2026-06-03 09:00:00', '2026-06-03 11:00:00', 'completed', 1, '与工长、业主现场确认水电点位'],
    [4, 1, '材料选型', 'material_select', '2026-06-08 14:00:00', '2026-06-08 17:00:00', 'completed', 2, '陪同业主选瓷砖、地板等主材'],
    [5, 2, '方案汇报', 'presentation', '2026-06-10 10:00:00', '2026-06-10 12:00:00', 'completed', 1, '向业主汇报最终设计方案'],
    [4, 1, '泥瓦阶段巡检', 'site_visit', '2026-06-22 09:00:00', '2026-06-22 11:00:00', 'scheduled', 2, '检查瓷砖铺贴质量'],
    [4, null, '方案设计', 'design', '2026-06-23 09:00:00', '2026-06-25 18:00:00', 'in_progress', 1, '新客户三居室方案设计'],
    [5, 2, '木作节点对接', 'site_visit', '2026-06-24 14:00:00', '2026-06-24 16:00:00', 'scheduled', 2, '与木作厂家对接定制细节']
  ];

  schedules.forEach(s => insertSchedule.run(...s));

  console.log('Database initialized successfully!');
  console.log('Default accounts created:');
  console.log('  admin / 123456 - 系统管理员');
  console.log('  owner1 / 123456 - 业主');
  console.log('  designer1 / 123456 - 设计师');
  console.log('  manager1 / 123456 - 装修管家');
  console.log('  company1 / 123456 - 装修公司管理员');
};

init();
db.close();
