import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = process.env.DATABASE_PATH || path.resolve(__dirname, '..', 'data', 'app.sqlite')

const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'government'
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'enterprise',
      enterprise_id INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS enterprises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      unified_code TEXT NOT NULL UNIQUE,
      registration_number TEXT,
      type TEXT NOT NULL DEFAULT 'limited',
      industry TEXT,
      registered_capital REAL DEFAULT 0,
      legal_person TEXT,
      address TEXT,
      contact_phone TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      established_date TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS service_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      department_id INTEGER,
      description TEXT,
      processing_days INTEGER DEFAULT 15,
      required_materials TEXT,
      conditions TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS service_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      service_item_id INTEGER NOT NULL,
      applicant_name TEXT,
      applicant_phone TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      submitted_materials TEXT,
      result TEXT,
      remark TEXT,
      submitted_at TEXT DEFAULT (datetime('now', 'localtime')),
      processed_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      department_id INTEGER,
      description TEXT,
      conditions TEXT,
      amount TEXT,
      valid_from TEXT,
      valid_to TEXT,
      target_industry TEXT,
      target_enterprise_type TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS policy_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      policy_id INTEGER NOT NULL,
      match_score REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'recommended',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS appeals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      department_id INTEGER,
      priority TEXT NOT NULL DEFAULT 'normal',
      deadline TEXT,
      response TEXT,
      responder TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS credit_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      score REAL DEFAULT 100,
      level TEXT DEFAULT 'A',
      details TEXT,
      source TEXT,
      record_date TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS credit_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      report_type TEXT NOT NULL DEFAULT 'standard',
      overall_score REAL,
      overall_level TEXT,
      content TEXT,
      generated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS bidding_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      budget REAL DEFAULT 0,
      department_id INTEGER,
      deadline TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      description TEXT,
      region TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS bidding_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      bidding_project_id INTEGER NOT NULL,
      bid_amount REAL,
      status TEXT NOT NULL DEFAULT 'submitted',
      submitted_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS supply_chain (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      direction TEXT NOT NULL,
      product TEXT NOT NULL,
      quantity TEXT,
      price REAL,
      unit TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      file_path TEXT,
      department TEXT,
      share_scope TEXT,
      verified INTEGER DEFAULT 0,
      upload_date TEXT DEFAULT (datetime('now', 'localtime')),
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS material_reuse_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      service_application_id INTEGER,
      used_by_department TEXT,
      used_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS finance_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      institution_name TEXT NOT NULL,
      product_name TEXT NOT NULL,
      amount_min REAL,
      amount_max REAL,
      rate_min REAL,
      rate_max REAL,
      term_min INTEGER,
      term_max INTEGER,
      requirements TEXT,
      credit_model TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS finance_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      finance_product_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      term INTEGER,
      purpose TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      credit_score REAL,
      approved_amount REAL,
      approved_rate REAL,
      applied_at TEXT DEFAULT (datetime('now', 'localtime')),
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `)

  migrateSchema()

  seedData()
}

function migrateSchema() {
  const schemas: { [key: string]: { [key: string]: string } } = {
    departments: {
      type: "TEXT NOT NULL DEFAULT 'government'"
    },
    enterprises: {
      updated_at: "TEXT DEFAULT (datetime('now', 'localtime'))",
      unified_code: "TEXT",
      registration_number: "TEXT",
      type: "TEXT",
      industry: "TEXT",
      registered_capital: "REAL",
      legal_person: "TEXT",
      address: "TEXT",
      contact_phone: "TEXT",
      status: "TEXT",
      established_date: "TEXT"
    },
    appeals: {
      updated_at: "TEXT DEFAULT (datetime('now', 'localtime'))",
      enterprise_id: "INTEGER NOT NULL",
      type: "TEXT NOT NULL",
      title: "TEXT NOT NULL",
      content: "TEXT NOT NULL",
      status: "TEXT NOT NULL DEFAULT 'pending'",
      department_id: "INTEGER",
      priority: "TEXT NOT NULL DEFAULT 'normal'",
      deadline: "TEXT",
      response: "TEXT",
      responder: "TEXT"
    },
    service_applications: {
      applicant_name: "TEXT",
      applicant_phone: "TEXT"
    },
    bidding_projects: {
      department_id: "INTEGER",
      title: "TEXT NOT NULL",
      type: "TEXT NOT NULL",
      budget: "REAL DEFAULT 0",
      deadline: "TEXT",
      status: "TEXT NOT NULL DEFAULT 'open'",
      description: "TEXT",
      region: "TEXT"
    },
    policies: {
      department_id: "INTEGER",
      title: "TEXT NOT NULL",
      category: "TEXT NOT NULL",
      description: "TEXT",
      conditions: "TEXT",
      amount: "TEXT",
      valid_from: "TEXT",
      valid_to: "TEXT",
      target_industry: "TEXT",
      target_enterprise_type: "TEXT",
      status: "TEXT NOT NULL DEFAULT 'active'",
      created_at: "TEXT DEFAULT (datetime('now', 'localtime'))"
    },
    credit_records: {
      enterprise_id: "INTEGER NOT NULL",
      category: "TEXT NOT NULL",
      score: "REAL DEFAULT 100",
      level: "TEXT DEFAULT 'A'",
      details: "TEXT",
      source: "TEXT",
      record_date: "TEXT",
      created_at: "TEXT DEFAULT (datetime('now', 'localtime'))"
    },
    service_items: {
      name: "TEXT NOT NULL",
      category: "TEXT NOT NULL",
      department_id: "INTEGER",
      description: "TEXT",
      processing_days: "INTEGER",
      required_materials: "TEXT",
      conditions: "TEXT",
      status: "TEXT NOT NULL DEFAULT 'active'"
    },
    supply_chain: {
      enterprise_id: "INTEGER NOT NULL",
      direction: "TEXT NOT NULL",
      product: "TEXT NOT NULL",
      quantity: "TEXT",
      price: "REAL",
      unit: "TEXT",
      description: "TEXT",
      status: "TEXT NOT NULL DEFAULT 'active'"
    },
    materials: {
      enterprise_id: "INTEGER NOT NULL",
      name: "TEXT NOT NULL",
      category: "TEXT NOT NULL",
      file_path: "TEXT",
      department: "TEXT",
      share_scope: "TEXT",
      verified: "INTEGER DEFAULT 0",
      upload_date: "TEXT"
    },
    finance_products: {
      institution_name: "TEXT NOT NULL",
      product_name: "TEXT NOT NULL",
      amount_min: "REAL",
      amount_max: "REAL",
      rate_min: "REAL",
      rate_max: "REAL",
      term_min: "INTEGER",
      term_max: "INTEGER",
      requirements: "TEXT",
      credit_model: "TEXT",
      description: "TEXT",
      status: "TEXT NOT NULL DEFAULT 'active'"
    },
    users: {
      username: "TEXT NOT NULL UNIQUE",
      password: "TEXT",
      name: "TEXT",
      role: "TEXT NOT NULL DEFAULT 'enterprise'",
      enterprise_id: "INTEGER"
    }
  }

  for (const tableName in schemas) {
    const columns = schemas[tableName]
    const existing = db.pragma(`table_info(${tableName})`) as any[]
    const existingNames = existing.map(c => c.name)

    for (const colName in columns) {
      if (!existingNames.includes(colName)) {
        try {
          db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${colName} ${columns[colName]}`)
          console.log(`Added column ${colName} to ${tableName}`)
        } catch (e) {
          console.log(`Schema migration for ${tableName}.${colName}: ok`)
        }
      }
    }
  }
}

function seedData() {
  const deptCount = (db.prepare('SELECT COUNT(*) as cnt FROM departments').get() as any).cnt
  const entCount = (db.prepare('SELECT COUNT(*) as cnt FROM enterprises').get() as any).cnt
  const svcCount = (db.prepare('SELECT COUNT(*) as cnt FROM service_items').get() as any).cnt
  const polCount = (db.prepare('SELECT COUNT(*) as cnt FROM policies').get() as any).cnt
  const creditCount = (db.prepare('SELECT COUNT(*) as cnt FROM credit_records').get() as any).cnt
  const appealCount = (db.prepare('SELECT COUNT(*) as cnt FROM appeals').get() as any).cnt
  const biddingCount = (db.prepare('SELECT COUNT(*) as cnt FROM bidding_projects').get() as any).cnt
  const supplyCount = (db.prepare('SELECT COUNT(*) as cnt FROM supply_chain').get() as any).cnt
  const materialCount = (db.prepare('SELECT COUNT(*) as cnt FROM materials').get() as any).cnt
  const financeCount = (db.prepare('SELECT COUNT(*) as cnt FROM finance_products').get() as any).cnt
  const financeAppCount = (db.prepare('SELECT COUNT(*) as cnt FROM finance_applications').get() as any).cnt
  const userCount = (db.prepare('SELECT COUNT(*) as cnt FROM users').get() as any).cnt

  if (deptCount > 0 && entCount > 0 && svcCount > 0 && polCount > 0 && 
      creditCount > 0 && appealCount > 0 && biddingCount > 0 && 
      supplyCount > 0 && materialCount > 0 && financeCount > 0 &&
      financeAppCount > 0 && userCount > 0) {
    console.log('Database already seeded, skipping')
    return
  }

  if (deptCount === 0) {
    const insertDept = db.prepare('INSERT INTO departments (name, code, type) VALUES (?, ?, ?)')
    const departments = [
      ['广东省市场监督管理局', 'AMR', 'government'],
      ['广东省税务局', 'TAX', 'government'],
      ['广东省人力资源和社会保障厅', 'HRSS', 'government'],
      ['广东省生态环境厅', 'EE', 'government'],
      ['广东省商务厅', 'COMMERCE', 'government'],
      ['广东省科技厅', 'TECH', 'government'],
      ['广东省工业和信息化厅', 'MIIT', 'government'],
      ['广东省财政厅', 'FINANCE', 'government'],
      ['广东省发展和改革委员会', 'DRC', 'government'],
      ['广东省司法厅', 'JUSTICE', 'government'],
      ['广东省住房和城乡建设厅', 'HURD', 'government'],
      ['广东省交通运输厅', 'TRANSPORT', 'government'],
      ['广东省自然资源厅', 'NATURAL', 'government'],
      ['广东省应急管理厅', 'EMERGENCY', 'government'],
      ['广东省教育厅', 'EDUCATION', 'government'],
      ['广东省民政厅', 'CIVIL', 'government'],
      ['广东省公安厅', 'POLICE', 'government'],
      ['广东省水利厅', 'WATER', 'government'],
      ['广东省农业农村厅', 'AGRICULTURE', 'government'],
      ['广东省文化和旅游厅', 'CULTURE', 'government'],
    ]
    const insertMany = db.transaction((rows: any[]) => {
      for (const row of rows) insertDept.run(...row)
    })
    insertMany(departments)
    console.log('Seeded departments')
  }

  if (entCount === 0) {
    const insertEnterprise = db.prepare(`INSERT INTO enterprises (name, unified_code, registration_number, type, industry, registered_capital, legal_person, address, contact_phone, status, established_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    const enterprises = [
      ['深圳市华为技术有限公司', '9144030071526726XG', '440301105000123', 'limited', '信息技术', 5000000, '任正非', '深圳市龙岗区坂田华为基地', '0755-28780808', 'active', '1987-09-15'],
      ['广州汽车集团股份有限公司', '91440101190537964J', '440101000000456', 'limited', '汽车制造', 10000000, '曾庆洪', '广州市越秀区东风中路448号', '020-83150000', 'active', '1997-06-06'],
      ['美的集团股份有限公司', '91440606707730312R', '440601000007890', 'limited', '家电制造', 7000000, '方洪波', '佛山市顺德区北滘镇美的大道6号', '0757-26338777', 'active', '2000-04-07'],
      ['珠海格力电器股份有限公司', '91440400192538865E', '440401000002345', 'limited', '家电制造', 6000000, '董明珠', '珠海市前山金鸡西路6号', '0756-8614888', 'active', '1989-12-13'],
      ['比亚迪股份有限公司', '91440300708882858F', '440301000005678', 'limited', '新能源汽车', 2900000, '王传福', '深圳市坪山区比亚迪路3009号', '0755-89888888', 'active', '1995-02-10'],
      ['广东粤海控股集团有限公司', '91440000190342880K', '440000000009012', 'state', '综合投资', 8000000, '侯外林', '广州市天河区天河路208号', '020-83889888', 'active', '2000-03-28'],
      ['广州网易计算机系统有限公司', '91440101618614372C', '440106000003456', 'limited', '互联网', 1300000, '丁磊', '广州市天河区科韵路16号', '020-85105300', 'active', '1997-06-24'],
      ['万科企业股份有限公司', '91440300192182284L', '440301000008901', 'limited', '房地产', 11000000, '郁亮', '深圳市盐田区大梅沙环梅路33号', '0755-25606666', 'active', '1984-05-30'],
      ['珠海金山软件有限公司', '91440400617496319P', '440401000006789', 'limited', '软件', 500000, '邹涛', '珠海市高新区唐家湾镇前岛环路', '0756-3333088', 'active', '1999-04-12'],
      ['佛山市海天调味食品股份有限公司', '91440604707851230Q', '440601000004321', 'limited', '食品制造', 3100000, '庞康', '佛山市禅城区文沙路16号', '0757-82808111', 'active', '1955-01-01'],
      ['东莞步步高教育科技有限公司', '91441900MA4W2P3C5K', '441900000007654', 'limited', '教育科技', 800000, '沈炜', '东莞市长安镇步步高大道', '0769-85458888', 'active', '2004-07-12'],
      ['中山市木林森电子有限公司', '91442000747050289U', '442000000009876', 'limited', '电子制造', 1200000, '孙清焕', '中山市小榄镇木林森大道1号', '0760-22288888', 'active', '2003-06-18'],
      ['惠州TCL移动通信有限公司', '91441300747076039W', '441300000005432', 'limited', '通信设备', 2000000, '李东生', '惠州市仲恺高新区TCL科技大厦', '0752-2655555', 'active', '1998-03-25'],
      ['汕头市超声仪器研究所股份有限公司', '91440500193027283D', '440500000003210', 'limited', '医疗器械', 300000, '李德来', '汕头市金平区潮汕路金园工业城', '0754-88251234', 'active', '1986-05-20'],
      ['肇庆市风华高新科技股份有限公司', '91441200195246890Y', '441200000006543', 'limited', '电子元件', 900000, '王金全', '肇庆市端州区风华路18号', '0758-2868888', 'active', '1996-08-15'],
      ['湛江港（集团）股份有限公司', '91440800747053512N', '440800000008765', 'state', '港口物流', 3500000, '张庆中', '湛江市霞山区人民东二路', '0759-2290888', 'active', '2002-11-08'],
      ['江门市大长江集团有限公司', '91440700707831456B', '440700000002109', 'limited', '摩托车制造', 1500000, '王大威', '江门市建达北路5号', '0750-3228888', 'active', '1992-04-16'],
      ['清远市先导稀有材料有限公司', '91441802759226830X', '441800000004321', 'limited', '稀有材料', 600000, '朱世会', '清远市高新区先导材料园', '0763-3488888', 'active', '2003-09-28'],
      ['阳江市十八子集团有限公司', '91441700707843987H', '441700000001234', 'limited', '刀剪制造', 200000, '李积回', '阳江市江城区那西工业区', '0662-3228888', 'active', '1988-12-01'],
      ['茂名石化实华股份有限公司', '91440900195024567M', '440900000005678', 'state', '石油化工', 4200000, '陆彬', '茂名市红旗北路150号', '0668-2238888', 'active', '1996-12-31'],
    ]
    const insertEnterprises = db.transaction((rows: any[]) => {
      for (const row of rows) insertEnterprise.run(...row)
    })
    insertEnterprises(enterprises)
    console.log('Seeded enterprises')
  }

  if (svcCount === 0) {
    const insertService = db.prepare(`INSERT INTO service_items (name, category, department_id, description, processing_days, required_materials, conditions, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    const services = [
      ['企业设立登记', '开办', 1, '新设立企业工商登记注册', 5, '公司章程,股东身份证明,住所证明,法定代表人任职文件', '符合法定设立条件', 'active'],
      ['企业变更登记', '变更', 1, '企业名称、住所、法定代表人等变更登记', 5, '变更登记申请书,修改后的公司章程,相关决议文件', '已登记企业', 'active'],
      ['企业注销登记', '注销', 1, '企业注销登记', 10, '注销登记申请书,清算报告,税务清缴证明,营业执照正副本', '已完成清算', 'active'],
      ['食品经营许可证', '许可', 1, '食品经营许可证核发', 15, '食品经营许可申请书,营业执照,食品安全管理制度,从业人员健康证明', '符合食品安全要求', 'active'],
      ['建筑施工许可证', '许可', 11, '建筑工程施工许可证核发', 10, '建筑工程施工许可申请表,建设工程规划许可证,用地批准文件,施工图审查合格书', '已取得规划许可', 'active'],
      ['建设项目环境影响评价', '许可', 4, '建设项目环境影响评价审批', 20, '环境影响评价文件,项目建议书批复,公众参与说明', '符合环保要求', 'active'],
      ['企业投资项目备案', '备案', 9, '企业投资项目备案', 3, '项目备案申请表,营业执照,项目可行性研究报告', '符合产业政策', 'active'],
      ['高新技术企业认定', '许可', 6, '高新技术企业认定', 60, '高新技术企业认定申请书,知识产权证明,研发费用报表,高新技术产品收入证明', '拥有核心自主知识产权', 'active'],
      ['税务登记', '开办', 2, '税务登记信息确认', 1, '营业执照,法定代表人身份证明,财务负责人身份证明', '新设立企业', 'active'],
      ['社会保险登记', '开办', 3, '企业社会保险登记', 3, '营业执照,组织机构代码证,法定代表人身份证明', '新设立企业', 'active'],
      ['对外贸易经营者备案', '备案', 5, '对外贸易经营者备案登记', 5, '备案登记表,营业执照,组织机构代码证', '从事进出口业务', 'active'],
      ['安全生产许可证', '许可', 14, '安全生产许可证核发', 20, '安全生产许可申请书,安全生产责任制,安全管理人员资格证,事故应急预案', '符合安全生产条件', 'active'],
    ]
    const insertServices = db.transaction((rows: any[]) => {
      for (const row of rows) insertService.run(...row)
    })
    insertServices(services)
    console.log('Seeded services')
  }

  if (polCount === 0) {
    const insertPolicy = db.prepare(`INSERT INTO policies (title, category, department_id, description, conditions, amount, valid_from, valid_to, target_industry, target_enterprise_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    const policies = [
      ['广东省制造业企业研发费用加计扣除政策', '税收优惠', 2, '制造业企业研发费用可按100%比例加计扣除', '从事制造业且开展研发活动的企业', '研发费用100%加计扣除', '2024-01-01', '2026-12-31', '制造业', 'limited', 'active'],
      ['广东省高新技术企业培育专项资金', '财政补贴', 8, '对新认定的高新技术企业给予财政奖励', '首次通过高新技术企业认定', '20-50万元奖励', '2024-01-01', '2025-12-31', '高新技术', 'limited', 'active'],
      ['广东省"珠江人才计划"', '人才计划', 3, '引进创新创业团队和领军人才', '拥有核心技术的创新创业团队', '团队最高3000万元资助', '2024-06-01', '2025-12-31', '全行业', 'limited', 'active'],
      ['广东省中小企业数字化转型补贴', '财政补贴', 7, '支持中小企业数字化转型', '规模以上中小企业', '最高50万元补贴', '2024-03-01', '2025-12-31', '制造业', 'limited', 'active'],
      ['广东省出口退税加速政策', '税收优惠', 2, '出口退税办理时限压缩至3个工作日', '出口企业', '退税加速', '2024-01-01', '2026-12-31', '外贸', 'limited', 'active'],
      ['广东省"专精特新"中小企业奖励', '财政补贴', 7, '对国家级专精特新"小巨人"企业给予奖励', '获评专精特新"小巨人"的企业', '最高100万元奖励', '2024-01-01', '2025-12-31', '制造业', 'limited', 'active'],
      ['广东省创新创业孵化载体运营补贴', '财政补贴', 6, '支持科技企业孵化器和众创空间建设运营', '省级以上孵化载体', '最高200万元运营补贴', '2024-01-01', '2025-12-31', '科技服务', 'limited', 'active'],
      ['广东省绿色制造体系示范奖励', '财政补贴', 4, '鼓励企业创建绿色工厂和绿色供应链', '获评国家级绿色工厂的企业', '最高50万元奖励', '2024-06-01', '2025-12-31', '制造业', 'limited', 'active'],
      ['广东省跨境电子商务综合试验区扶持', '财政补贴', 5, '支持跨境电商平台和海外仓建设', '跨境电商企业', '最高100万元扶持', '2024-01-01', '2025-12-31', '电子商务', 'limited', 'active'],
      ['广东省工业互联网发展扶持', '财政补贴', 7, '支持工业互联网平台建设和应用推广', '工业互联网平台企业', '最高500万元扶持', '2024-01-01', '2026-12-31', '信息技术', 'limited', 'active'],
      ['广东省高端人才个税优惠政策', '人才计划', 2, '粤港澳大湾区高端人才个人所得税补贴', '在大湾区工作的境外高端人才', '个税超出15%部分予以补贴', '2024-01-01', '2026-12-31', '全行业', 'limited', 'active'],
      ['广东省新型研发机构资助', '财政补贴', 6, '支持新型研发机构建设和运行', '省级新型研发机构', '最高500万元资助', '2024-01-01', '2025-12-31', '科技', 'limited', 'active'],
    ]
    const insertPolicies = db.transaction((rows: any[]) => {
      for (const row of rows) insertPolicy.run(...row)
    })
    insertPolicies(policies)
    console.log('Seeded policies')
  }

  if (creditCount === 0) {
    const insertCredit = db.prepare(`INSERT INTO credit_records (enterprise_id, category, score, level, details, source, record_date) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    const creditRecords = [
      [1, '税务', 95, 'A', '纳税信用A级纳税人', '广东省税务局', '2024-12-01'],
      [1, '司法', 90, 'A', '无重大违法记录', '广东省司法厅', '2024-11-15'],
      [1, '环保', 92, 'A', '环保信用等级良好', '广东省生态环境厅', '2024-10-20'],
      [2, '税务', 93, 'A', '纳税信用A级纳税人', '广东省税务局', '2024-12-01'],
      [2, '司法', 88, 'A', '无重大违法记录', '广东省司法厅', '2024-11-15'],
      [2, '环保', 85, 'B', '一般环保合规', '广东省生态环境厅', '2024-10-20'],
      [3, '税务', 96, 'A', '纳税信用A级纳税人', '广东省税务局', '2024-12-01'],
      [3, '司法', 94, 'A', '无重大违法记录', '广东省司法厅', '2024-11-15'],
      [3, '环保', 91, 'A', '环保信用等级良好', '广东省生态环境厅', '2024-10-20'],
      [4, '税务', 94, 'A', '纳税信用A级纳税人', '广东省税务局', '2024-12-01'],
      [4, '司法', 92, 'A', '无重大违法记录', '广东省司法厅', '2024-11-15'],
      [4, '环保', 88, 'B', '一般环保合规', '广东省生态环境厅', '2024-10-20'],
      [5, '税务', 91, 'A', '纳税信用A级纳税人', '广东省税务局', '2024-12-01'],
      [5, '司法', 87, 'B', '存在轻微违规已整改', '广东省司法厅', '2024-11-15'],
      [5, '环保', 90, 'A', '环保信用等级良好', '广东省生态环境厅', '2024-10-20'],
      [6, '税务', 89, 'B', '纳税信用B级', '广东省税务局', '2024-12-01'],
      [6, '司法', 95, 'A', '无重大违法记录', '广东省司法厅', '2024-11-15'],
      [6, '环保', 86, 'B', '一般环保合规', '广东省生态环境厅', '2024-10-20'],
      [7, '税务', 92, 'A', '纳税信用A级纳税人', '广东省税务局', '2024-12-01'],
      [7, '司法', 93, 'A', '无重大违法记录', '广东省司法厅', '2024-11-15'],
    ]
    const insertCredits = db.transaction((rows: any[]) => {
      for (const row of rows) insertCredit.run(...row)
    })
    insertCredits(creditRecords)
    console.log('Seeded credit records')
  }

  if (appealCount === 0) {
    const insertAppeal = db.prepare(`INSERT INTO appeals (enterprise_id, type, title, content, status, department_id, priority, deadline, response, responder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    const appeals = [
      [1, '用工', '高端技术人才引进困难', '我司在人工智能、芯片设计等领域急需高端人才，但现有引才渠道有限，希望政府能提供更多人才对接平台和政策支持。', 'resolved', 3, 'high', '2025-01-15', '已协调省人社厅对接"珠江人才计划"，为企业开通人才引进绿色通道，并可享受个税优惠政策。', '广东省人力资源和社会保障厅'],
      [2, '融资', '新能源项目融资需求', '我司正在推进新能源电池项目，需融资5亿元，希望政府协调金融机构提供优惠贷款。', 'processing', 8, 'high', '2025-02-28', null, null],
      [5, '用工', '技术工人招聘困难', '新能源汽车产线扩产需要大量技术工人，本地招工难度大。', 'processing', 3, 'normal', '2025-02-15', null, null],
      [3, '合规咨询', '出口合规政策咨询', '我司产品出口欧盟，需要了解最新的REACH法规和CE认证要求。', 'resolved', 5, 'normal', '2025-01-20', '已整理欧盟最新合规要求手册，并安排专家一对一辅导。', '广东省商务厅'],
      [4, '融资', '技术研发资金周转', '我司新能效技术研发需要短期资金周转3000万元。', 'resolved', 8, 'normal', '2025-01-10', '已对接建设银行，获得3000万元科技信用贷款，年利率3.85%。', '广东省财政厅'],
      [7, '出口', '跨境电商退税问题', '我司通过跨境电商平台出口产品，退税流程复杂且周期长。', 'processing', 2, 'high', '2025-02-28', null, null],
      [8, '合规咨询', '房地产调控政策咨询', '我司需了解最新房地产调控政策对开发项目的影响。', 'resolved', 9, 'normal', '2025-01-25', '已安排住建厅专人为企业提供政策解读服务。', '广东省住房和城乡建设厅'],
      [9, '融资', '软件研发项目融资', '我司新游戏研发项目需要融资2000万元。', 'pending', 8, 'normal', '2025-03-15', null, null],
      [10, '出口', '调味品出口检验检疫', '我司调味品出口东南亚，检验检疫流程时间较长影响交货。', 'processing', 5, 'normal', '2025-02-20', null, null],
      [6, '用工', '国企改革人才需求', '我司正在推进混合所有制改革，需要专业法律和财务人才。', 'pending', 10, 'high', '2025-03-01', null, null],
    ]
    const insertAppeals = db.transaction((rows: any[]) => {
      for (const row of rows) insertAppeal.run(...row)
    })
    insertAppeals(appeals)
    console.log('Seeded appeals')
  }

  if (biddingCount === 0) {
    const insertBidding = db.prepare(`INSERT INTO bidding_projects (title, type, budget, department_id, deadline, status, description, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    const biddings = [
      ['广东省政务云平台升级项目', '政府采购', 5000, 9, '2025-03-15', 'open', '对省政务云平台进行扩容升级，提升计算存储能力。', '广州'],
      ['深圳市智慧交通信号系统采购', '政府采购', 3000, 12, '2025-02-28', 'open', '采购智能交通信号控制系统及配套设备。', '深圳'],
      ['珠三角城际铁路施工项目', '工程招标', 500000, 12, '2025-04-01', 'open', '新建城际铁路50公里，含桥梁隧道工程。', '珠三角'],
      ['广东省教育厅信息化设备采购', '政府采购', 800, 15, '2025-02-20', 'open', '采购教学用计算机、智慧黑板等信息化设备。', '全省'],
      ['广州市环保监测站设备采购', '政府采购', 1200, 4, '2025-03-10', 'open', '采购空气质量监测站设备52套。', '广州'],
      ['粤港澳大湾区水利设施改造工程', '工程招标', 200000, 18, '2025-05-01', 'open', '对大湾区重点水利设施进行加固改造。', '大湾区'],
      ['广东省公安厅网络安全设备采购', '政府采购', 2000, 17, '2025-03-20', 'open', '采购网络安全防护设备及安全运营平台。', '全省'],
      ['汕头市市政道路改造工程', '工程招标', 35000, 11, '2025-04-15', 'open', '市政主干道改造升级，全长15公里。', '汕头'],
    ]
    const insertBiddings = db.transaction((rows: any[]) => {
      for (const row of rows) insertBidding.run(...row)
    })
    insertBiddings(biddings)
    console.log('Seeded bidding projects')
  }

  if (supplyCount === 0) {
    const insertSupply = db.prepare(`INSERT INTO supply_chain (enterprise_id, direction, product, quantity, price, unit, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    const supplyChains = [
      [1, 'supply', '5G基站芯片', '100万片', 150, '元/片', '自研5G基站芯片，支持大规模出货', 'active'],
      [5, 'supply', '磷酸铁锂电池组', '50万组', 85000, '元/组', '车规级磷酸铁锂电池组，能量密度180Wh/kg', 'active'],
      [3, 'supply', '变频压缩机', '200万台', 380, '元/台', '高效变频压缩机，能效比超国标一级', 'active'],
      [4, 'supply', '商用中央空调', '5万套', 28000, '元/套', '商用中央空调机组，制冷量5-50匹', 'active'],
      [10, 'supply', '酱油', '500万箱', 180, '元/箱', '海天酱油各系列产品', 'active'],
      [2, 'demand', '车规级芯片', '200万颗', 50, '元/颗', '需求车规级MCU芯片，用于智能驾驶系统', 'active'],
      [8, 'demand', '建筑材料', '10万吨', null, null, '需求钢筋水泥等建筑材料', 'active'],
      [7, 'demand', '服务器', '500台', null, null, '需求高密度GPU服务器，用于AI训练集群', 'active'],
      [11, 'demand', '电子元器件', '1000万个', null, null, '需求电阻电容电感等被动元器件', 'active'],
      [13, 'demand', '显示面板', '50万片', null, null, '需求AMOLED显示面板，用于手机产品', 'active'],
    ]
    const insertSupplyChains = db.transaction((rows: any[]) => {
      for (const row of rows) insertSupply.run(...row)
    })
    insertSupplyChains(supplyChains)
    console.log('Seeded supply chain')
  }

  if (materialCount === 0) {
    const insertMaterial = db.prepare(`INSERT INTO materials (enterprise_id, name, category, file_path, department, share_scope, verified, upload_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    const materials = [
      [1, '营业执照副本', '证照类', '/uploads/1/license.pdf', '市场监督管理局', '全部门共享', 1, '2024-06-15'],
      [1, '公司章程', '文书类', '/uploads/1/articles.pdf', '市场监督管理局', '全部门共享', 1, '2024-06-15'],
      [1, '法定代表人身份证明', '证照类', '/uploads/1/legal_id.pdf', '市场监督管理局', '全部门共享', 1, '2024-06-15'],
      [2, '营业执照副本', '证照类', '/uploads/2/license.pdf', '市场监督管理局', '全部门共享', 1, '2024-07-20'],
      [2, '环保评估报告', '评估类', '/uploads/2/eva_report.pdf', '生态环境厅', '环保税务共享', 1, '2024-08-10'],
      [3, '营业执照副本', '证照类', '/uploads/3/license.pdf', '市场监督管理局', '全部门共享', 1, '2024-05-10'],
      [3, '质量管理体系认证', '证照类', '/uploads/3/iso_cert.pdf', '市场监督管理局', '全部门共享', 1, '2024-09-01'],
      [4, '营业执照副本', '证照类', '/uploads/4/license.pdf', '市场监督管理局', '全部门共享', 1, '2024-04-22'],
      [5, '营业执照副本', '证照类', '/uploads/5/license.pdf', '市场监督管理局', '全部门共享', 1, '2024-03-18'],
      [5, '安全生产许可证', '许可类', '/uploads/5/safety.pdf', '应急管理厅', '应急环保共享', 1, '2024-07-05'],
    ]
    const insertMaterials = db.transaction((rows: any[]) => {
      for (const row of rows) insertMaterial.run(...row)
    })
    insertMaterials(materials)
    console.log('Seeded materials')
  }

  if (financeCount === 0) {
    const insertFinance = db.prepare(`INSERT INTO finance_products (institution_name, product_name, amount_min, amount_max, rate_min, rate_max, term_min, term_max, requirements, credit_model, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    const financeProducts = [
      ['中国工商银行广东省分行', '科创贷', 100, 3000, 3.5, 4.5, 12, 60, '高新技术企业,营收增长超10%', '信用评分+专利评估', '面向高新技术企业的信用贷款产品', 'active'],
      ['中国建设银行广东省分行', '小微快贷', 10, 500, 3.85, 5.0, 6, 36, '成立2年以上,纳税信用B级以上', '纳税数据评估', '基于纳税数据的快速信用贷款', 'active'],
      ['中国银行广东省分行', '外贸贷', 50, 2000, 3.65, 4.8, 6, 24, '年出口额超100万美元', '出口退税数据评估', '支持外贸企业的融资产品', 'active'],
      ['中国农业银行广东省分行', '惠农贷', 5, 300, 3.5, 4.2, 6, 36, '涉农企业,有固定经营场所', '涉农补贴数据评估', '服务农业产业企业的专项贷款', 'active'],
      ['招商银行广州分行', '供应链金融', 50, 5000, 3.8, 5.5, 3, 12, '核心企业上下游供应商', '核心企业信用背书', '基于供应链关系的融资产品', 'active'],
      ['广发银行广州分行', '专精特新贷', 100, 2000, 3.55, 4.5, 12, 60, '省级以上专精特新企业', '专利价值+营收评估', '专精特新企业专属融资产品', 'active'],
      ['广东粤科金融集团', '科创投资', 500, 5000, null, null, 36, 120, '硬科技企业,有核心专利', '技术壁垒+市场评估', '科技创新项目股权投资', 'active'],
      ['广东省融资再担保公司', '增信担保', 100, 3000, null, null, 12, 36, '符合产业政策的中小企业', '综合信用评估', '为中小企业贷款提供增信担保服务', 'active'],
    ]
    const insertFinances = db.transaction((rows: any[]) => {
      for (const row of rows) insertFinance.run(...row)
    })
    insertFinances(financeProducts)
    console.log('Seeded finance products')
  }

  if (financeAppCount === 0) {
    const insertFinanceApp = db.prepare(`INSERT INTO finance_applications (enterprise_id, finance_product_id, amount, term, purpose, status, credit_score, approved_amount, approved_rate, applied_at, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    const financeApps = [
      [1, 1, 2000, 36, '5G芯片研发投入', 'approved', 95, 2000, 3.85, '2024-11-15', '2024-11-20'],
      [2, 3, 5000, 24, '新能源电池项目扩建', 'reviewing', 93, null, null, '2025-01-10', null],
      [3, 6, 1500, 36, '智能制造产线升级', 'approved', 96, 1500, 3.75, '2024-12-05', '2024-12-12'],
      [5, 1, 1000, 24, '新能源汽车电控系统研发', 'approved', 91, 1000, 4.0, '2024-10-20', '2024-10-28'],
      [7, 2, 300, 12, '游戏服务器扩容', 'pending', 92, null, null, '2025-01-15', null],
      [4, 5, 800, 6, '空调零部件供应商融资', 'approved', 94, 800, 4.2, '2024-11-01', '2024-11-08'],
      [10, 4, 200, 24, '调味品生产线扩建', 'reviewing', 89, null, null, '2025-01-20', null],
      [9, 6, 500, 36, 'AI教育产品研发', 'pending', 87, null, null, '2025-01-25', null],
    ]
    const insertFinanceApps = db.transaction((rows: any[]) => {
      for (const row of rows) insertFinanceApp.run(...row)
    })
    insertFinanceApps(financeApps)
    console.log('Seeded finance applications')
  }

  if (userCount === 0) {
    const insertUser = db.prepare(`INSERT INTO users (username, password, name, role, enterprise_id) VALUES (?, ?, ?, ?, ?)`)
    const users = [
      ['admin', 'admin123', '系统管理员', 'admin', null],
      ['enterprise1', '123456', '华为企业管理员', 'enterprise', 1],
      ['enterprise2', '123456', '广汽集团管理员', 'enterprise', 2],
      ['enterprise3', '123456', '美的集团管理员', 'enterprise', 3],
    ]
    const insertUsers = db.transaction((rows: any[]) => {
      for (const row of rows) insertUser.run(...row)
    })
    insertUsers(users)
    console.log('Seeded users')
  }

  console.log('Database seeded successfully')
}

export default db
