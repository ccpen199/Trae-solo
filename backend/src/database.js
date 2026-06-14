require('dotenv').config({ path: '../.env' });
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const db = new Database(path.join(__dirname, '..', '..', dbPath));

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('jobseeker', 'company', 'admin')),
      name TEXT,
      phone TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobseekers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      resume TEXT,
      skills TEXT,
      languages TEXT,
      experience_years INTEGER,
      education TEXT,
      ftz_preferences TEXT,
      expected_salary_min INTEGER,
      expected_salary_max INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      industry TEXT,
      business_license TEXT,
      description TEXT,
      is_encouraged_industry INTEGER DEFAULT 0,
      contact_person TEXT,
      contact_phone TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      title_cn TEXT NOT NULL,
      title_en TEXT,
      description_cn TEXT NOT NULL,
      description_en TEXT,
      requirements_cn TEXT,
      requirements_en TEXT,
      category TEXT NOT NULL,
      salary_min INTEGER,
      salary_max INTEGER,
      location TEXT,
      employment_type TEXT,
      tags TEXT,
      rcep_skills TEXT,
      has_ftz_subsidy INTEGER DEFAULT 0,
      subsidy_policy_ref TEXT,
      policy_basis TEXT,
      is_approved INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      jobseeker_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      cover_letter TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (jobseeker_id) REFERENCES jobseekers(id)
    );

      CREATE TABLE IF NOT EXISTS policies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title_cn TEXT NOT NULL,
        title_en TEXT,
        description_cn TEXT,
        description_en TEXT,
        content_cn TEXT,
        content_en TEXT,
        policy_number TEXT,
        category TEXT,
        eligible_group_cn TEXT,
        benefit_description TEXT,
        issue_date TEXT,
        issuing_authority TEXT,
        official_url TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

    CREATE TABLE IF NOT EXISTS contract_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_cn TEXT NOT NULL,
      name_en TEXT,
      template_content_cn TEXT,
      template_content_en TEXT,
      category TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS job_recordings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      recording_status TEXT DEFAULT 'pending',
      bureau_response TEXT,
      recorded_at DATETIME,
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );

    CREATE TABLE IF NOT EXISTS industry_catalog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name_cn TEXT NOT NULL,
      name_en TEXT,
      is_encouraged INTEGER DEFAULT 0,
      description TEXT
    );
  `);

  const tableColumns = (tableName) => db.prepare(`PRAGMA table_info(${tableName})`).all().map(col => col.name);
  const ensureColumn = (tableName, columnName, definition) => {
    if (!tableColumns(tableName).includes(columnName)) {
      db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
    }
  };

  [
    ['description_cn', 'TEXT'],
    ['description_en', 'TEXT'],
    ['eligible_group_cn', 'TEXT'],
    ['benefit_description', 'TEXT'],
    ['issue_date', 'TEXT'],
    ['issuing_authority', 'TEXT'],
    ['official_url', 'TEXT']
  ].forEach(([columnName, definition]) => ensureColumn('policies', columnName, definition));

  const policyCount = db.prepare('SELECT COUNT(*) as count FROM policies').get().count;
  if (policyCount === 0) {
    const insertPolicy = db.prepare(`
      INSERT INTO policies (title_cn, title_en, description_cn, description_en, content_cn, content_en, 
        policy_number, category, eligible_group_cn, benefit_description, issue_date, issuing_authority, official_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertPolicy.run(
      '海南自贸港鼓励类产业企业所得税优惠政策',
      'Hainan FTZ Encouraged Industry Enterprise Income Tax Preferential Policy',
      '注册在海南自贸港的鼓励类产业企业可享受15%企业所得税优惠税率',
      'Encouraged industry enterprises registered in Hainan FTZ can enjoy 15% preferential enterprise income tax rate',
      '对注册在海南自由贸易港并实质性运营的鼓励类产业企业，减按15%的税率征收企业所得税。本条所称鼓励类产业企业，是指以海南自由贸易港鼓励类产业目录中规定的产业项目为主营业务，且其主营业务收入占企业收入总额60%以上的企业。',
      'For encouraged industry enterprises registered and substantially operating in Hainan Free Trade Port, the enterprise income tax is levied at a reduced rate of 15%. The encouraged industry enterprises referred to in this article refer to enterprises whose main business is the industrial projects specified in the Hainan Free Trade Port Encouraged Industry Catalog, and whose main business income accounts for more than 60% of the total enterprise income.',
      '财税〔2020〕31号',
      'tax',
      '海南自贸港注册并实质性运营的鼓励类产业企业',
      '企业所得税减按15%征收（全国一般为25%）',
      '2020-06-23',
      '财政部、税务总局',
      'http://www.chinatax.gov.cn/chinatax/n810341/n810755/c5174224/content.html'
    );
    insertPolicy.run(
      '海南自贸港高端紧缺人才个人所得税优惠政策',
      'Hainan FTZ High-end and Talented Individual Income Tax Preferential Policy',
      '在海南自贸港工作的高端人才和紧缺人才，个税实际税负超过15%部分免征',
      'For high-end and紧缺 talents working in Hainan FTZ, the portion of individual income tax burden exceeding 15% is exempted',
      '对在海南自由贸易港工作的高端人才和紧缺人才，其个人所得税实际税负超过15%的部分，予以免征。享受上述优惠政策的所得包括来源于海南自由贸易港的综合所得（包括工资薪金、劳务报酬、稿酬、特许权使用费四项所得）、经营所得以及经海南省认定的人才补贴性所得。',
      'For high-end and talented individuals working in Hainan Free Trade Port, the portion of their actual individual income tax burden exceeding 15% is exempted. The income eligible for the above preferential policies includes comprehensive income from Hainan Free Trade Port (including four items of income: salary and wages, labor remuneration, author remuneration, and royalties), business income, and talent subsidy income recognized by Hainan Province.',
      '财税〔2020〕32号',
      'talent',
      '海南自贸港高端人才、紧缺人才（需经海南省认定）',
      '个人所得税实际税负超15%部分免征（全国最高边际税率为45%）',
      '2020-06-23',
      '财政部、税务总局',
      'http://www.chinatax.gov.cn/chinatax/n810341/n810755/c5174225/content.html'
    );
    insertPolicy.run(
      '海南自贸港外籍人员工作许可便利政策',
      'Hainan FTZ Foreign Personnel Work Permit Facilitation Policy',
      '放宽外籍人员来琼工作许可条件，简化审批流程',
      'Relax conditions for foreign personnel to work in Hainan, simplify approval process',
      '放宽外籍人员来琼工作许可条件，允许外籍高层次人才、外籍专业技术人才等享受便利化工作许可。取消外籍人员来琼工作许可年龄上限，对创新创业团队外籍核心成员给予工作许可便利。',
      'Relax conditions for foreign personnel to work in Hainan, allowing foreign high-level talents, foreign professional and technical talents to enjoy facilitated work permits. Cancel the upper age limit for foreign personnel to work in Hainan, and provide work permit facilitation for foreign core members of innovation and entrepreneurship teams.',
      '琼府〔2020〕30号',
      'visa',
      '外籍高层次人才、外籍专业技术人才、创新创业团队外籍核心成员',
      '放宽工作许可条件、取消年龄上限、简化审批流程',
      '2020-04-03',
      '海南省人民政府',
      'http://www.hainan.gov.cn/hainan/szfwj/202004/t20200407_2867302.html'
    );
    insertPolicy.run(
      '海南自贸港人才落户补贴政策',
      'Hainan FTZ Talent Settlement Subsidy Policy',
      '引进人才可享受住房租赁补贴或购房补贴',
      'Introduced talents can enjoy housing rental subsidy or purchase subsidy',
      '对引进的高层次人才、硕士生、本科生等给予住房租赁补贴或购房补贴。补贴标准为：博士研究生或具有正高职称的人才每月补贴3000元，硕士研究生或具有副高职称的人才每月补贴2000元，本科毕业生每月补贴1500元，补贴累计不超过36个月。',
      'Provide housing rental subsidies or purchase subsidies for introduced high-level talents, master students, and undergraduate students. The subsidy standard is: 3,000 yuan per month for doctoral students or talents with senior professional titles, 2,000 yuan per month for master students or talents with associate senior professional titles, 1,500 yuan per month for undergraduate graduates, and the cumulative subsidy shall not exceed 36 months.',
      '琼办发〔2019〕41号',
      'talent',
      '海南省引进的高层次人才、硕士生、本科生等各类人才',
      '博士3000元/月、硕士2000元/月、本科1500元/月，补贴3年',
      '2019-03-28',
      '中共海南省委办公厅、海南省人民政府办公厅',
      'http://www.hainan.gov.cn/hainan/xxgkml/201904/t20190404_2635252.html'
    );
    insertPolicy.run(
      '海南自贸港鼓励类产业目录（2025年本）',
      'Hainan FTZ Encouraged Industry Catalog (2025 Edition)',
      '明确海南自贸港鼓励发展的产业范围，涉及8大领域100+细分行业',
      'Clarify the scope of industries encouraged to develop in Hainan FTZ, covering 8 major fields and 100+ sub-sectors',
      '《海南自由贸易港鼓励类产业目录》包括：跨境贸易、游艇经济、离岸数据中心、国际航运、旅游文化、医疗健康、金融服务、教育服务等8大领域。企业以目录中的产业项目为主营业务，且主营业务收入占企业收入总额60%以上的，可享受15%企业所得税优惠税率。',
      'The Hainan Free Trade Port Encouraged Industry Catalog includes 8 major fields: cross-border trade, yacht economy, offshore data center, international shipping, tourism and culture, healthcare, financial services, and education services. Enterprises whose main business is the industrial projects in the catalog and whose main business income accounts for more than 60% of the total enterprise income can enjoy the 15% enterprise income tax preferential rate.',
      '发改产业规〔2025〕2号',
      'industry',
      '所有符合目录范围的海南自贸港注册企业',
      '可减按15%征收企业所得税，享受其他鼓励类产业扶持政策',
      '2025-01-15',
      '国家发展改革委、财政部、税务总局',
      'http://www.ndrc.gov.cn/xwdt/tzgg/202501/t20250120_1367892.html'
    );
    insertPolicy.run(
      '海南自贸港跨境服务贸易负面清单',
      'Hainan FTZ Cross-border Services Trade Negative List',
      '全国首张跨境服务贸易负面清单，实现更高水平开放',
      "China's first cross-border services trade negative list, achieving a higher level of opening-up",
      '海南自贸港跨境服务贸易负面清单统一列明对境外服务提供者的特别管理措施，负面清单之外的领域按照内外一致原则管理。清单涵盖专业服务、交通运输、金融服务、文化服务等领域。',
      'The Hainan FTZ Cross-border Services Trade Negative List uniformly specifies special management measures for foreign service providers. Fields outside the negative list are managed in accordance with the principle of consistency between domestic and foreign parties. The list covers professional services, transportation, financial services, cultural services and other fields.',
      '商服贸发〔2024〕1号',
      'industry',
      '跨境服务贸易领域的境外服务提供者、海南自贸港服务贸易企业',
      '负面清单外领域实行内外一致管理，大幅放宽市场准入',
      '2024-02-28',
      '商务部',
      'http://www.mofcom.gov.cn/article/b/fwzl/202403/20240303346753.shtml'
    );
  }

  // Update existing policies with complete data
  const updatePolicyFields = db.prepare(`
    UPDATE policies SET 
      description_cn = ?, 
      description_en = ?, 
      eligible_group_cn = ?, 
      benefit_description = ?, 
      issue_date = ?, 
      issuing_authority = ?, 
      official_url = ?
    WHERE policy_number = ?
  `);
  const policyUpdates = [
    ['财税〔2020〕31号', '注册在海南自贸港的鼓励类产业企业可享受15%企业所得税优惠税率', 'Encouraged industry enterprises registered in Hainan FTZ can enjoy 15% preferential enterprise income tax rate', '海南自贸港注册并实质性运营的鼓励类产业企业', '企业所得税减按15%征收（全国一般为25%）', '2020-06-23', '财政部、税务总局', 'http://www.chinatax.gov.cn/chinatax/n810341/n810755/c5174224/content.html'],
    ['财税〔2020〕32号', '在海南自贸港工作的高端人才和紧缺人才，个税实际税负超过15%部分免征', 'For high-end and紧缺 talents working in Hainan FTZ, the portion of individual income tax burden exceeding 15% is exempted', '海南自贸港高端人才、紧缺人才（需经海南省认定）', '个人所得税实际税负超15%部分免征（全国最高边际税率为45%）', '2020-06-23', '财政部、税务总局', 'http://www.chinatax.gov.cn/chinatax/n810341/n810755/c5174225/content.html'],
    ['琼府〔2020〕30号', '放宽外籍人员来琼工作许可条件，简化审批流程', 'Relax conditions for foreign personnel to work in Hainan, simplify approval process', '外籍高层次人才、外籍专业技术人才、创新创业团队外籍核心成员', '放宽工作许可条件、取消年龄上限、简化审批流程', '2020-04-03', '海南省人民政府', 'http://www.hainan.gov.cn/hainan/szfwj/202004/t20200407_2867302.html'],
    ['琼办发〔2019〕41号', '引进人才可享受住房租赁补贴或购房补贴', 'Introduced talents can enjoy housing rental subsidy or purchase subsidy', '海南省引进的高层次人才、硕士生、本科生等各类人才', '博士3000元/月、硕士2000元/月、本科1500元/月，补贴3年', '2019-03-28', '中共海南省委办公厅、海南省人民政府办公厅', 'http://www.hainan.gov.cn/hainan/xxgkml/201904/t20190404_2635252.html']
  ];
  policyUpdates.forEach(u => updatePolicyFields.run(u[1], u[2], u[3], u[4], u[5], u[6], u[7], u[0]));

  const catalogCount = db.prepare('SELECT COUNT(*) as count FROM industry_catalog').get().count;
  if (catalogCount === 0) {
    const insertCatalog = db.prepare(`
      INSERT INTO industry_catalog (code, name_cn, name_en, is_encouraged, description)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertCatalog.run('C01', '跨境贸易', 'Cross-border Trade', 1, '海南自贸港鼓励发展跨境电商、国际贸易等跨境贸易业务');
    insertCatalog.run('C02', '游艇经济', 'Yacht Economy', 1, '鼓励发展游艇制造、游艇旅游、游艇会展等游艇相关产业');
    insertCatalog.run('C03', '离岸数据中心', 'Offshore Data Center', 1, '鼓励发展国际数据中心、云计算、大数据等数字经济产业');
    insertCatalog.run('C04', '国际航运', 'International Shipping', 1, '鼓励发展国际船舶登记、航运金融、海事服务等航运产业');
    insertCatalog.run('C05', '旅游文化', 'Tourism and Culture', 1, '鼓励发展国际旅游、文化体育、会展商务等旅游产业');
    insertCatalog.run('C06', '医疗健康', 'Healthcare', 1, '鼓励发展国际医疗、生物医药、康养旅游等健康产业');
    insertCatalog.run('C07', '金融服务', 'Financial Services', 1, '鼓励发展跨境金融、离岸金融、财富管理等金融产业');
    insertCatalog.run('C08', '教育服务', 'Education Services', 1, '鼓励发展国际教育、职业培训、中外合作办学等教育产业');
  }

  const templateCount = db.prepare('SELECT COUNT(*) as count FROM contract_templates').get().count;
  if (templateCount === 0) {
    const insertTemplate = db.prepare(`
      INSERT INTO contract_templates (name_cn, name_en, template_content_cn, template_content_en, category)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertTemplate.run(
      '涉外劳动合同（中英双语）',
      'Foreign-related Labor Contract (Bilingual)',
      '甲方（用人单位）：\n乙方（劳动者）：\n鉴于甲方为海南自贸港企业，乙方为[外籍/港澳台]人员，根据《中华人民共和国劳动合同法》、《海南自由贸易港法》等法律法规，甲乙双方本着平等自愿、协商一致的原则，签订本合同。\n\n第一条 合同期限\n第二条 工作内容和工作地点\n第三条 工作时间和休息休假\n第四条 劳动报酬\n第五条 社会保险和福利待遇\n第六条 劳动保护、劳动条件和职业危害防护\n第七条 合同的解除和终止\n第八条 法律适用和争议解决',
      'Party A (Employer):\nParty B (Employee):\nWhereas Party A is an enterprise in Hainan Free Trade Port, and Party B is a [foreign/Hong Kong, Macau and Taiwan] personnel, in accordance with the Labor Contract Law of the People\'s Republic of China, the Hainan Free Trade Port Law and other laws and regulations, Party A and Party B hereby sign this contract on the basis of equality, voluntariness and consensus.\n\nArticle 1 Contract Term\nArticle 2 Work Content and Work Location\nArticle 3 Working Hours, Rest and Vacation\nArticle 4 Labor Remuneration\nArticle 5 Social Insurance and Welfare Benefits\nArticle 6 Labor Protection, Working Conditions and Occupational Hazard Protection\nArticle 7 Dissolution and Termination of Contract\nArticle 8 Law Application and Dispute Resolution',
      'labor'
    );
    insertTemplate.run(
      '高端人才聘用合同',
      'High-end Talent Employment Contract',
      '甲方（用人单位）：\n乙方（受聘人）：\n根据《海南自贸港高端紧缺人才个人所得税优惠政策》（财税〔2020〕32号）等规定，甲乙双方经协商一致，签订本合同。\n\n第一条 聘用岗位和职责\n第二条 聘用期限\n第三条 工作报酬和个税优惠\n第四条 福利待遇\n第五条 保密义务\n第六条 违约责任',
      'Party A (Employer):\nParty B (Employee):\nIn accordance with the "Hainan FTZ High-end and Talented Individual Income Tax Preferential Policy" (Caishui [2020] No. 32) and other regulations, Party A and Party B hereby sign this contract through consensus.\n\nArticle 1 Position and Responsibilities\nArticle 2 Employment Term\nArticle 3 Work Remuneration and Individual Income Tax Preference\nArticle 4 Welfare Benefits\nArticle 5 Confidentiality Obligation\nArticle 6 Liability for Breach of Contract',
      'high-end'
    );
  }

  const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin').count;
  if (adminCount === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)').run(
      'admin@hainan-ftz.gov.cn',
      hashedPassword,
      'admin',
      '系统管理员'
    );
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount <= 1) {
    const bcrypt = require('bcryptjs');
    
    const companyUserId = db.prepare('INSERT INTO users (email, password, role, name, phone) VALUES (?, ?, ?, ?, ?)').run(
      'hr@hainan-yacht.com',
      bcrypt.hashSync('company123', 10),
      'company',
      '海南国际游艇集团',
      '0898-88888888'
    ).lastInsertRowid;
    
    db.prepare('INSERT INTO companies (user_id, company_name, industry, is_encouraged_industry, description, contact_person, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      companyUserId,
      '海南国际游艇集团有限公司',
      'C02',
      1,
      '海南国际游艇集团是海南自贸港重点扶持的游艇产业龙头企业，专注于游艇制造、游艇旅游、游艇会展等全产业链服务。',
      '张经理',
      '13800138000'
    );

    const companyUserId2 = db.prepare('INSERT INTO users (email, password, role, name, phone) VALUES (?, ?, ?, ?, ?)').run(
      'hr@data-center.cn',
      bcrypt.hashSync('company123', 10),
      'company',
      '海南离岸数据中心',
      '0898-66666666'
    ).lastInsertRowid;
    
    db.prepare('INSERT INTO companies (user_id, company_name, industry, is_encouraged_industry, description, contact_person, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      companyUserId2,
      '海南离岸数据中心有限公司',
      'C03',
      1,
      '海南离岸数据中心是海南自贸港首批离岸数据服务试点企业，提供国际数据存储、云计算、大数据分析等服务。',
      '李总监',
      '13900139000'
    );

    const jobseekerUserId = db.prepare('INSERT INTO users (email, password, role, name, phone) VALUES (?, ?, ?, ?, ?)').run(
      'wangming@example.com',
      bcrypt.hashSync('jobseeker123', 10),
      'jobseeker',
      '王明',
      '13600136000'
    ).lastInsertRowid;
    
    db.prepare('INSERT INTO jobseekers (user_id, skills, languages, experience_years, education, ftz_preferences, expected_salary_min, expected_salary_max) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      jobseekerUserId,
      '["游艇设计","船舶工程","CAD绘图"]',
      '["中文","英语","日语"]',
      5,
      '硕士',
      '{"tax_benefit": true, "visa_assistance": false, "housing_subsidy": true}',
      20000,
      35000
    );

    const jobseekerUserId2 = db.prepare('INSERT INTO users (email, password, role, name, phone) VALUES (?, ?, ?, ?, ?)').run(
      'lisihan@example.com',
      bcrypt.hashSync('jobseeker123', 10),
      'jobseeker',
      '李思涵',
      '13700137000'
    ).lastInsertRowid;
    
    db.prepare('INSERT INTO jobseekers (user_id, skills, languages, experience_years, education, ftz_preferences, expected_salary_min, expected_salary_max) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      jobseekerUserId2,
      '["RCEP原产地规则","跨境电商运营","国际贸易","越南语"]',
      '["中文","英语","越南语"]',
      3,
      '本科',
      '{"tax_benefit": true, "visa_assistance": false, "housing_subsidy": true}',
      15000,
      25000
    );

    const insertJob = db.prepare(`
      INSERT INTO jobs (company_id, title_cn, title_en, description_cn, description_en, 
        requirements_cn, requirements_en, category, salary_min, salary_max, location, 
        employment_type, tags, rcep_skills, has_ftz_subsidy, subsidy_policy_ref, policy_basis, is_approved)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertJob.run(
      1,
      '游艇设计师',
      'Yacht Designer',
      '负责公司新型游艇产品的外观设计和结构设计，参与产品研发全流程，与生产制造部门紧密配合。',
      'Responsible for the appearance design and structural design of the company\'s new yacht products, participate in the entire product R&D process, and closely cooperate with the manufacturing department.',
      '1. 船舶工程、工业设计等相关专业本科以上学历\n2. 5年以上游艇或船舶设计经验\n3. 熟练使用CAD、Rhino等设计软件\n4. 英语流利，能阅读英文技术文档',
      '1. Bachelor degree or above in naval architecture, industrial design or related fields\n2. 5+ years of experience in yacht or ship design\n3. Proficient in CAD, Rhino and other design software\n4. Fluent in English, able to read English technical documents',
      'C02',
      25000,
      45000,
      '三亚市海棠区',
      'full-time',
      '["游艇设计","高端制造","海南自贸港"]',
      '["英语","国际船舶设计规范"]',
      1,
      '财税〔2020〕32号',
      '海南自贸港高端紧缺人才个人所得税优惠政策，实际税负超过15%部分予以免征',
      1
    );

    insertJob.run(
      1,
      '游艇销售经理（东南亚市场）',
      'Yacht Sales Manager (Southeast Asia Market)',
      '负责东南亚市场游艇销售业务，拓展区域客户资源，建立销售渠道，完成销售目标。',
      'Responsible for yacht sales in Southeast Asian market, expand regional customer resources, establish sales channels, and achieve sales targets.',
      '1. 国际贸易、市场营销等相关专业\n2. 3年以上高端消费品销售经验，有游艇或奢侈品销售经验优先\n3. 精通英语、越南语或泰国语\n4. 熟悉RCEP原产地规则和跨境贸易流程',
      '1. International trade, marketing or related fields\n2. 3+ years of experience in high-end consumer goods sales, yacht or luxury goods sales experience preferred\n3. Proficient in English, Vietnamese or Thai\n4. Familiar with RCEP rules of origin and cross-border trade procedures',
      'C02',
      20000,
      40000,
      '海口市龙华区',
      'full-time',
      '["游艇销售","东南亚市场","RCEP"]',
      '["越南语","英语","RCEP原产地规则","跨境贸易"]',
      1,
      '琼办发〔2019〕41号,财税〔2020〕32号',
      '1. 海南自贸港人才落户补贴政策：符合条件可享受住房租赁补贴\n2. 高端紧缺人才个税优惠：实际税负超过15%部分予以免征',
      1
    );

    insertJob.run(
      2,
      '跨境数据合规专员',
      'Cross-border Data Compliance Specialist',
      '负责公司离岸数据业务的合规管理，制定数据跨境流动合规方案，对接监管部门。',
      'Responsible for compliance management of the company\'s offshore data business, develop compliance plans for cross-border data flow, and liaise with regulatory authorities.',
      '1. 法学、信息安全等相关专业本科以上学历\n2. 3年以上数据合规或网络安全经验\n3. 熟悉《数据安全法》、《个人信息保护法》等法律法规\n4. 英语流利，熟悉国际数据传输规则',
      '1. Bachelor degree or above in law, information security or related fields\n2. 3+ years of experience in data compliance or cybersecurity\n3. Familiar with the Data Security Law, Personal Information Protection Law and other laws and regulations\n4. Fluent in English, familiar with international data transmission rules',
      'C03',
      22000,
      38000,
      '海口市江东新区',
      'full-time',
      '["数据合规","离岸数据","网络安全"]',
      '["英语","国际数据传输","GDPR"]',
      1,
      '财税〔2020〕31号,财税〔2020〕32号',
      '1. 鼓励类产业企业所得税优惠：减按15%税率征收\n2. 高端紧缺人才个税优惠：实际税负超过15%部分予以免征',
      1
    );

    insertJob.run(
      2,
      '云平台架构师（国际业务）',
      'Cloud Platform Architect (International Business)',
      '负责离岸数据中心云平台的架构设计和技术选型，支撑国际客户业务需求。',
      'Responsible for the architectural design and technology selection of the offshore data center cloud platform, supporting international customer business needs.',
      '1. 计算机科学相关专业硕士以上学历\n2. 6年以上云计算或数据中心架构经验\n3. 精通AWS、阿里云等主流云平台架构\n4. 英语作为工作语言，良好的跨文化沟通能力',
      '1. Master degree or above in computer science or related fields\n2. 6+ years of experience in cloud computing or data center architecture\n3. Proficient in AWS, Alibaba Cloud and other mainstream cloud platform architectures\n4. English as working language, good cross-cultural communication skills',
      'C03',
      35000,
      60000,
      '海口市江东新区',
      'full-time',
      '["云架构","离岸数据","国际业务"]',
      '["英语","AWS架构","云计算"]',
      1,
      '财税〔2020〕32号,琼府〔2020〕30号',
      '1. 高端紧缺人才个税优惠：实际税负超过15%部分予以免征\n2. 外籍人员工作许可便利：符合条件可享受便利化工作许可',
      1
    );

    insertJob.run(
      2,
      '跨境电商运营（韩国市场）',
      'Cross-border E-commerce Operator (Korean Market)',
      '负责韩国市场跨境电商平台的运营管理，制定营销策略，提升产品销量和品牌知名度。',
      'Responsible for operation management of cross-border e-commerce platform in Korean market, develop marketing strategies, increase product sales and brand awareness.',
      '1. 韩语TOPIK6级，熟练的韩语读写能力\n2. 2年以上跨境电商运营经验，有韩国市场经验优先\n3. 熟悉Coupang、Gmarket等韩国电商平台规则\n4. 了解RCEP原产地规则，能独立处理跨境贸易相关事务',
      '1. TOPIK Level 6, proficient in Korean reading and writing\n2. 2+ years of cross-border e-commerce operation experience, Korean market experience preferred\n3. Familiar with Korean e-commerce platform rules such as Coupang and Gmarket\n4. Understand RCEP rules of origin, able to handle cross-border trade related matters independently',
      'C01',
      15000,
      28000,
      '海口市综合保税区',
      'full-time',
      '["跨境电商","韩国市场","运营推广"]',
      '["韩语","RCEP原产地规则","跨境贸易","国际贸易"]',
      1,
      '财税〔2020〕32号,琼办发〔2019〕41号',
      '1. 高端紧缺人才个税优惠：实际税负超过15%部分予以免征\n2. 人才落户补贴：符合条件可享受住房租赁补贴',
      1
    );

    insertJob.run(
      2,
      'RCEP商务专员（日韩市场）',
      'RCEP Business Specialist (Japan & Korea Market)',
      '负责RCEP成员国（日本、韩国）的商务对接，处理原产地证申报，开拓日韩客户资源。',
      'Responsible for business liaison with RCEP member countries (Japan, Korea), handle certificate of origin declaration, develop Japanese and Korean customer resources.',
      '1. 日语N1或韩语TOPIK5级以上，英语熟练\n2. 3年以上国际贸易或商务相关工作经验\n3. 精通RCEP原产地规则，熟悉原产地证申报流程\n4. 有日本或韩国留学、工作经验者优先',
      '1. Japanese N1 or Korean TOPIK Level 5 or above, fluent in English\n2. 3+ years of experience in international trade or business related work\n3. Proficient in RCEP rules of origin, familiar with certificate of origin declaration process\n4. Study or work experience in Japan or Korea preferred',
      'C01',
      18000,
      35000,
      '海口市江东新区',
      'full-time',
      '["RCEP","商务对接","日韩贸易"]',
      '["日语","韩语","英语","RCEP原产地规则","国际贸易","国际结算"]',
      1,
      '发改产业规〔2025〕2号,财税〔2020〕32号',
      '1. 鼓励类产业政策：属于跨境贸易鼓励类产业\n2. 高端紧缺人才个税优惠：实际税负超过15%部分予以免征',
      1
    );

    insertJob.run(
      2,
      '泰语翻译（涉外商务）',
      'Thai Translator (Foreign Business)',
      '负责中泰商务谈判翻译，处理泰国客户往来邮件和合同，协助拓展泰国市场业务。',
      'Responsible for Chinese-Thai business negotiation translation, handle Thai customer emails and contracts, assist in expanding Thai market business.',
      '1. 泰语专业本科以上学历，泰语听说读写流利\n2. 2年以上翻译或商务相关工作经验\n3. 熟悉中泰两国文化和商务礼仪\n4. 有RCEP相关知识或跨境贸易经验者优先',
      '1. Bachelor degree or above in Thai major, fluent in Thai listening, speaking, reading and writing\n2. 2+ years of experience in translation or business related work\n3. Familiar with Chinese and Thai culture and business etiquette\n4. RCEP related knowledge or cross-border trade experience preferred',
      'C01',
      12000,
      22000,
      '海口市秀英港',
      'full-time',
      '["泰语翻译","涉外商务","中泰贸易"]',
      '["泰语","英语","RCEP原产地规则","跨境贸易"]',
      1,
      '琼办发〔2019〕41号,商服贸发〔2024〕1号',
      '1. 人才落户补贴：符合条件可享受住房租赁补贴\n2. 跨境服务贸易便利：享受负面清单外服务业开放政策',
      1
    );

    insertJob.run(
      2,
      '印尼语客户服务专员',
      'Indonesian Customer Service Specialist',
      '负责印尼客户的日常沟通和服务支持，处理订单查询、售后问题，维护客户关系。',
      'Responsible for daily communication and service support for Indonesian customers, handle order inquiries and after-sales issues, maintain customer relationships.',
      '1. 印尼语专业或印尼籍留学生，印尼语母语水平\n2. 1年以上客户服务或销售相关经验\n3. 熟练使用办公软件，有跨境电商平台经验优先\n4. 了解印尼文化和消费习惯',
      '1. Indonesian major or Indonesian international student, native level Indonesian\n2. 1+ year of customer service or sales related experience\n3. Proficient in office software, cross-border e-commerce platform experience preferred\n4. Understand Indonesian culture and consumption habits',
      'C01',
      10000,
      18000,
      '海口市综合保税区',
      'full-time',
      '["客户服务","印尼市场","跨境电商"]',
      '["印尼语","英语","跨境电商","国际物流"]',
      1,
      '琼办发〔2019〕41号',
      '1. 人才落户补贴：符合条件可享受住房租赁补贴',
      1
    );

    const insertRecording = db.prepare('INSERT INTO job_recordings (job_id, recording_status, recorded_at) VALUES (?, ?, ?)');
    for (let i = 1; i <= 8; i++) {
      insertRecording.run(i, 'recorded', '2026-06-01 10:00:00');
    }
  }

  const policyDetails = [
    {
      title_cn: '海南自贸港鼓励类产业企业所得税优惠政策',
      title_en: 'Hainan FTP Encouraged Industry Enterprise Income Tax Policy',
      description_cn: '注册并实质性运营的鼓励类产业企业可减按15%征收企业所得税。',
      description_en: 'Encouraged industry enterprises with substantive operations may apply a 15% corporate income tax rate.',
      content_cn: '对注册在海南自由贸易港并实质性运营的鼓励类产业企业，减按15%的税率征收企业所得税。平台自动根据企业所属产业目录和岗位类别进行政策匹配。',
      content_en: 'Encouraged industry enterprises registered and substantially operating in Hainan FTP may apply a reduced 15% corporate income tax rate. The platform matches this policy by industry catalog and job category.',
      policy_number: '财税〔2020〕31号',
      category: 'tax',
      eligible_group_cn: '海南自贸港鼓励类产业企业及其招聘岗位',
      benefit_description: '企业所得税减按15%征收，岗位可标注鼓励类产业政策依据',
      issue_date: '2020-06-23',
      issuing_authority: '财政部、税务总局',
      official_url: 'https://www.hainan.gov.cn/'
    },
    {
      title_cn: '海南自贸港高端紧缺人才个人所得税优惠政策',
      title_en: 'Hainan FTP High-end Talent Individual Income Tax Policy',
      description_cn: '高端紧缺人才个人所得税实际税负超过15%的部分予以免征。',
      description_en: 'High-end and urgently needed talents may be exempt from individual income tax burden above 15%.',
      content_cn: '对在海南自由贸易港工作的高端人才和紧缺人才，其个人所得税实际税负超过15%的部分，予以免征。高薪、国际业务和RCEP技能岗位优先关联该政策。',
      content_en: 'For high-end and urgently needed talents working in Hainan FTP, the individual income tax burden exceeding 15% is exempt. High-salary, international business and RCEP skill jobs are prioritized.',
      policy_number: '财税〔2020〕32号',
      category: 'talent',
      eligible_group_cn: '高端人才、紧缺人才、RCEP小语种和离岸技术专才',
      benefit_description: '个人所得税实际税负超过15%部分免征',
      issue_date: '2020-06-23',
      issuing_authority: '财政部、税务总局',
      official_url: 'https://www.hainan.gov.cn/'
    },
    {
      title_cn: '海南自贸港人才落户补贴政策',
      title_en: 'Hainan FTP Talent Settlement and Housing Subsidy Policy',
      description_cn: '符合条件的人才可申请住房租赁补贴、购房补贴和落户服务。',
      description_en: 'Eligible talents may apply for housing rental subsidies, purchase subsidies and settlement services.',
      content_cn: '对引进的高层次人才、硕士生、本科生等给予住房租赁补贴或购房补贴。求职者可在自贸岗偏好中勾选住房补贴需求。',
      content_en: 'Introduced high-level talents, master graduates and undergraduates may receive rental or purchase subsidies. Jobseekers can select housing subsidy preference.',
      policy_number: '琼办发〔2019〕41号',
      category: 'talent',
      eligible_group_cn: '符合海南人才引进条件的求职者',
      benefit_description: '住房租赁补贴、购房补贴和人才落户服务',
      issue_date: '2019-10-20',
      issuing_authority: '海南省委办公厅、海南省政府办公厅',
      official_url: 'https://www.hainan.gov.cn/'
    },
    {
      title_cn: '海南自贸港外籍人员工作许可便利政策',
      title_en: 'Hainan FTP Work Permit Facilitation Policy for Foreign Employees',
      description_cn: '放宽外籍人员来琼工作许可条件，支持涉外岗位招聘。',
      description_en: 'Work permit conditions are relaxed to support foreign-related recruitment in Hainan FTP.',
      content_cn: '放宽外籍人员来琼工作许可条件，允许外籍高层次人才、外籍专业技术人才等享受便利化工作许可。涉外劳动合同模板可同步使用。',
      content_en: 'Foreign high-level talents and foreign professional technical talents may enjoy facilitated work permits. Foreign-related labor contract templates are supported.',
      policy_number: '琼府〔2020〕30号',
      category: 'visa',
      eligible_group_cn: '外籍高层次人才、外籍专业技术人才及聘用企业',
      benefit_description: '工作许可便利、签证协助和涉外劳动合同模板',
      issue_date: '2020-09-01',
      issuing_authority: '海南省人民政府',
      official_url: 'https://www.hainan.gov.cn/'
    }
  ];

  const insertPolicyFull = db.prepare(`
    INSERT INTO policies (
      title_cn, title_en, description_cn, description_en, content_cn, content_en,
      policy_number, category, eligible_group_cn, benefit_description,
      issue_date, issuing_authority, official_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updatePolicyFull = db.prepare(`
    UPDATE policies SET
      title_cn = ?, title_en = ?, description_cn = ?, description_en = ?,
      content_cn = ?, content_en = ?, category = ?, eligible_group_cn = ?,
      benefit_description = ?, issue_date = ?, issuing_authority = ?, official_url = ?,
      is_active = 1
    WHERE policy_number = ?
  `);

  for (const policy of policyDetails) {
    const existing = db.prepare('SELECT id FROM policies WHERE policy_number = ?').get(policy.policy_number);
    if (existing) {
      updatePolicyFull.run(
        policy.title_cn,
        policy.title_en,
        policy.description_cn,
        policy.description_en,
        policy.content_cn,
        policy.content_en,
        policy.category,
        policy.eligible_group_cn,
        policy.benefit_description,
        policy.issue_date,
        policy.issuing_authority,
        policy.official_url,
        policy.policy_number
      );
    } else {
      insertPolicyFull.run(
        policy.title_cn,
        policy.title_en,
        policy.description_cn,
        policy.description_en,
        policy.content_cn,
        policy.content_en,
        policy.policy_number,
        policy.category,
        policy.eligible_group_cn,
        policy.benefit_description,
        policy.issue_date,
        policy.issuing_authority,
        policy.official_url
      );
    }
  }

  const yachtCompany = db.prepare("SELECT id FROM companies WHERE industry = 'C02' ORDER BY id LIMIT 1").get();
  if (yachtCompany) {
    const koreanJob = db.prepare("SELECT id FROM jobs WHERE title_cn = 'RCEP韩语市场运营专员'").get();
    let koreanJobId = koreanJob?.id;
    if (!koreanJobId) {
      koreanJobId = db.prepare(`
        INSERT INTO jobs (company_id, title_cn, title_en, description_cn, description_en,
          requirements_cn, requirements_en, category, salary_min, salary_max, location,
          employment_type, tags, rcep_skills, has_ftz_subsidy, subsidy_policy_ref, policy_basis, is_approved)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        yachtCompany.id,
        'RCEP韩语市场运营专员',
        'RCEP Korean Market Operations Specialist',
        '负责韩国及RCEP市场客户运营、跨境贸易内容维护、原产地规则资料整理，并协同企业政策匹配引擎完成补贴资格核验。',
        'Operate Korean and RCEP market customer programs, maintain cross-border trade content, organize rules of origin materials, and work with the policy matching engine for subsidy eligibility checks.',
        '1. 韩语可作为工作语言\n2. 熟悉RCEP原产地规则、跨境贸易或国际物流\n3. 能维护中英双语职位和涉外合同材料\n4. 具备企业客户运营经验',
        '1. Korean as a working language\n2. Familiar with RCEP rules of origin, cross-border trade or international logistics\n3. Able to maintain bilingual job and foreign-related contract materials\n4. Enterprise customer operations experience',
        'C01',
        18000,
        32000,
        '海口市综合保税区',
        'full-time',
        '["韩语","RCEP","跨境贸易","原产地规则"]',
        '["韩语","英语","RCEP原产地规则","跨境贸易","国际物流"]',
        1,
        '财税〔2020〕31号,财税〔2020〕32号,琼办发〔2019〕41号',
        '1. 鼓励类产业企业所得税优惠：跨境贸易企业减按15%征收\n2. 高端紧缺人才个税优惠：韩语与RCEP技能人才可享受个税优惠\n3. 人才落户补贴：符合条件可享受住房租赁补贴',
        1
      ).lastInsertRowid;
    }

    const recording = db.prepare('SELECT id FROM job_recordings WHERE job_id = ?').get(koreanJobId);
    if (recording) {
      db.prepare(`
        UPDATE job_recordings
        SET recording_status = 'recorded', recorded_at = COALESCE(recorded_at, CURRENT_TIMESTAMP),
            bureau_response = '已同步至海南省就业局岗位备案系统，回传编号 HN-RCEP-KR-2026'
        WHERE job_id = ?
      `).run(koreanJobId);
    } else {
      db.prepare(`
        INSERT INTO job_recordings (job_id, recording_status, bureau_response, recorded_at)
        VALUES (?, 'recorded', '已同步至海南省就业局岗位备案系统，回传编号 HN-RCEP-KR-2026', CURRENT_TIMESTAMP)
      `).run(koreanJobId);
    }
  }

  db.prepare(`
    UPDATE job_recordings
    SET bureau_response = COALESCE(bureau_response, '已同步至海南省就业局岗位备案系统，可在后台备案列表复查')
    WHERE recording_status = 'recorded'
  `).run();

  console.log('Database initialized successfully');
}

module.exports = { db, initDatabase };
