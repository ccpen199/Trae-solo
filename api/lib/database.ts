import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.resolve(__dirname, '../../data')
const DB_PATH = path.join(DATA_DIR, 'app.sqlite')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  real_name TEXT,
  id_card TEXT,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  avatar TEXT,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS unemployment_registers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  real_name TEXT NOT NULL,
  id_card TEXT NOT NULL,
  phone TEXT NOT NULL,
  register_type TEXT NOT NULL,
  education TEXT,
  work_years INTEGER,
  last_employer TEXT,
  unemployment_reason TEXT,
  expected_position TEXT,
  expected_salary_min INTEGER,
  expected_salary_max INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS entrepreneur_loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  real_name TEXT NOT NULL,
  id_card TEXT NOT NULL,
  phone TEXT NOT NULL,
  enterprise_name TEXT,
  credit_code TEXT,
  loan_amount REAL NOT NULL,
  loan_term INTEGER NOT NULL,
  loan_purpose TEXT,
  business_address TEXT,
  business_license TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS insurance_certs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  cert_no TEXT UNIQUE NOT NULL,
  cert_type TEXT NOT NULL,
  holder_name TEXT NOT NULL,
  id_card TEXT NOT NULL,
  insurance_type TEXT,
  start_date DATE,
  end_date DATE,
  insured_months INTEGER DEFAULT 0,
  total_paid REAL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'valid',
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS skill_certs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  cert_no TEXT UNIQUE NOT NULL,
  skill_name TEXT NOT NULL,
  skill_level TEXT NOT NULL,
  holder_name TEXT NOT NULL,
  id_card TEXT NOT NULL,
  exam_score REAL,
  issue_date DATE,
  issuer TEXT,
  status TEXT NOT NULL DEFAULT 'valid',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS arbitration_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  case_no TEXT UNIQUE NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  respondent TEXT,
  case_type TEXT NOT NULL,
  case_summary TEXT NOT NULL,
  claim_amount REAL,
  status TEXT NOT NULL DEFAULT 'pending',
  accepted_at DATETIME,
  hearing_at DATETIME,
  closed_at DATETIME,
  result TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  target_audience TEXT,
  summary TEXT,
  content TEXT,
  conditions TEXT,
  benefits TEXT,
  documents_required TEXT,
  valid_from DATE,
  valid_to DATE,
  is_auto_match INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS policy_match_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  policy_id INTEGER NOT NULL,
  match_score REAL NOT NULL DEFAULT 0,
  match_details TEXT,
  is_eligible INTEGER NOT NULL DEFAULT 0,
  is_claimed INTEGER NOT NULL DEFAULT 0,
  matched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (policy_id) REFERENCES policies(id)
);

CREATE TABLE IF NOT EXISTS blockchain_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_type TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  data_digest TEXT NOT NULL,
  hash TEXT UNIQUE NOT NULL,
  previous_hash TEXT,
  block_height INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ref_type, ref_id)
);

CREATE TABLE IF NOT EXISTS knowledge_base (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  keywords TEXT,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS qa_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE NOT NULL,
  user_id INTEGER,
  topic TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS qa_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  intent TEXT,
  matched_kb_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES qa_sessions(session_id),
  FOREIGN KEY (matched_kb_id) REFERENCES knowledge_base(id)
);

CREATE TABLE IF NOT EXISTS service_outlets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  outlet_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT,
  phone TEXT,
  work_hours TEXT,
  latitude REAL,
  longitude REAL,
  services TEXT,
  sort_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  cert_type TEXT NOT NULL,
  cert_no TEXT NOT NULL,
  cert_name TEXT NOT NULL,
  holder_name TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  issuer TEXT,
  verify_code TEXT,
  qrcode TEXT,
  status TEXT NOT NULL DEFAULT 'valid',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  application_no TEXT UNIQUE NOT NULL,
  application_type TEXT NOT NULL,
  title TEXT NOT NULL,
  form_data TEXT,
  attachments TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at DATETIME,
  approved_at DATETIME,
  rejected_at DATETIME,
  reject_reason TEXT,
  processor_id INTEGER,
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`

export function initDatabase(): Database.Database {
  if (db) {
    return db
  }

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(SCHEMA_SQL)

  seedInitialData(db)

  return db
}

function seedInitialData(db: Database.Database): void {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count === 0) {
    const adminPassword = bcrypt.hashSync('admin123', 10)
    db.prepare(`
      INSERT INTO users (username, password_hash, real_name, role, status)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', adminPassword, '系统管理员', 'admin', 'active')

    db.prepare(`
      INSERT INTO users (username, password_hash, real_name, id_card, phone, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'user001',
      bcrypt.hashSync('user123', 10),
      '张三',
      '110101199001011234',
      '13800138001',
      'user',
      'active'
    )
  }

  const policyCount = db.prepare('SELECT COUNT(*) as count FROM policies').get() as { count: number }
  if (policyCount.count === 0) {
    const policies = [
      {
        policy_code: 'POL001',
        title: '灵活就业人员社会保险补贴',
        category: '社保补贴',
        target_audience: '就业困难人员、离校2年内未就业高校毕业生',
        summary: '对灵活就业后缴纳社会保险费的就业困难人员给予社会保险补贴',
        content: '补贴标准原则上不超过其实际缴费的2/3，补贴期限除对距法定退休年龄不足5年的就业困难人员可延长至退休外，其余人员最长不超过3年。',
        conditions: JSON.stringify([
          '经认定的就业困难人员',
          '实现灵活就业',
          '以个人身份缴纳社会保险费',
          '办理灵活就业登记'
        ]),
        benefits: JSON.stringify({
          type: '补贴',
          standard: '不超过实际缴费的2/3',
          duration: '最长不超过3年'
        }),
        documents_required: JSON.stringify([
          '身份证',
          '就业困难人员认定证明',
          '社会保险缴费凭证',
          '灵活就业证明'
        ]),
        is_auto_match: 1
      },
      {
        policy_code: 'POL002',
        title: '失业保险稳岗返还',
        category: '稳岗返还',
        target_audience: '参保企业',
        summary: '对不裁员或少裁员的参保企业返还失业保险费',
        content: '大型企业按企业及其职工上年度实际缴纳失业保险费的30%返还，中小微企业按60%返还。参保企业上年度未裁员或裁员率不高于5.5%，30人（含）以下的参保企业裁员率不高于参保职工总数20%的，可以申请失业保险稳岗返还。',
        conditions: JSON.stringify([
          '依法参加失业保险并足额缴纳失业保险费',
          '上年度未裁员或裁员率符合规定',
          '生产经营活动符合国家及所在区域产业结构调整和环保政策',
          '财务制度健全、管理运行规范'
        ]),
        benefits: JSON.stringify({
          type: '返还',
          ratio: '大型企业30%，中小微企业60%'
        }),
        documents_required: JSON.stringify([
          '营业执照',
          '社会保险缴费证明',
          '上年度工资发放凭证'
        ]),
        is_auto_match: 1
      },
      {
        policy_code: 'POL003',
        title: '一次性创业补贴',
        category: '创业扶持',
        target_audience: '首次创办企业或从事个体经营的创业者',
        summary: '对首次创办小微企业或从事个体经营的创业者给予一次性创业补贴',
        content: '符合条件的创业者可申请一次性创业补贴，补贴标准由各地根据实际情况确定，一般在5000-10000元之间。',
        conditions: JSON.stringify([
          '首次创办小微企业或从事个体经营',
          '正常经营6个月以上',
          '依法缴纳社会保险费'
        ]),
        benefits: JSON.stringify({
          type: '一次性补贴',
          standard: '5000-10000元'
        }),
        documents_required: JSON.stringify([
          '身份证',
          '营业执照',
          '社会保险缴费证明',
          '经营场所证明'
        ]),
        is_auto_match: 1
      },
      {
        policy_code: 'POL004',
        title: '创业担保贷款',
        category: '创业扶持',
        target_audience: '城镇登记失业人员、就业困难人员、高校毕业生等创业者',
        summary: '为符合条件的创业者提供创业担保贷款及贴息支持',
        content: '个人创业担保贷款最高额度为20万元，对符合条件的借款人合伙创业或组织起来共同创业的，贷款额度可适当提高。小微企业创业担保贷款最高额度为300万元。',
        conditions: JSON.stringify([
          '属于重点扶持群体',
          '有具体经营项目',
          '无不良信用记录'
        ]),
        benefits: JSON.stringify({
          type: '贷款贴息',
          personal_limit: '20万元',
          enterprise_limit: '300万元'
        }),
        documents_required: JSON.stringify([
          '身份证',
          '营业执照',
          '创业计划书',
          '反担保材料'
        ]),
        is_auto_match: 0
      },
      {
        policy_code: 'POL005',
        title: '职业技能提升补贴',
        category: '技能培训',
        target_audience: '参加职业技能培训并取得证书的参保职工',
        summary: '对参加职业技能培训并取得职业资格证书或技能等级证书的企业参保职工给予技能提升补贴',
        content: '职工取得初级（五级）职业资格证书或技能等级证书的，补贴标准一般不超过1000元；取得中级（四级）的，一般不超过1500元；取得高级（三级）的，一般不超过2000元。',
        conditions: JSON.stringify([
          '依法参加失业保险，累计缴纳失业保险费12个月以上',
          '取得初级（五级）、中级（四级）、高级（三级）职业资格证书或技能等级证书'
        ]),
        benefits: JSON.stringify({
          type: '补贴',
          standard: '初级1000元，中级1500元，高级2000元'
        }),
        documents_required: JSON.stringify([
          '身份证',
          '职业资格证书或技能等级证书',
          '社会保险缴费证明'
        ]),
        is_auto_match: 1
      },
      {
        policy_code: 'POL006',
        title: '高校毕业生就业见习补贴',
        category: '就业扶持',
        target_audience: '离校2年内未就业高校毕业生、16-24岁失业青年',
        summary: '对吸纳就业见习人员的单位给予就业见习补贴',
        content: '见习补贴用于见习单位支付见习人员见习期间基本生活费、为见习人员办理人身意外伤害保险，以及对见习人员的指导管理费用。见习期一般为3-12个月。',
        conditions: JSON.stringify([
          '离校2年内未就业高校毕业生或16-24岁失业青年',
          '在经认定的见习单位参加就业见习'
        ]),
        benefits: JSON.stringify({
          type: '补贴',
          duration: '3-12个月'
        }),
        documents_required: JSON.stringify([
          '身份证',
          '毕业证（高校毕业生提供）',
          '就业见习协议'
        ]),
        is_auto_match: 1
      }
    ]

    const insertPolicy = db.prepare(`
      INSERT INTO policies (
        policy_code, title, category, target_audience, summary, content,
        conditions, benefits, documents_required, is_auto_match, status, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    type PolicySeedItem = {
      policy_code: string
      title: string
      category: string
      target_audience: string
      summary: string
      content: string
      conditions: string
      benefits: string
      documents_required: string
      is_auto_match: number
    }
    const tx = db.transaction((policyList: PolicySeedItem[]) => {
      for (let i = 0; i < policyList.length; i++) {
        const p = policyList[i]
        insertPolicy.run(
          p.policy_code,
          p.title,
          p.category,
          p.target_audience,
          p.summary,
          p.content,
          p.conditions,
          p.benefits,
          p.documents_required,
          p.is_auto_match,
          'active',
          i + 1
        )
      }
    })

    tx(policies)
  }

  const kbCount = db.prepare('SELECT COUNT(*) as count FROM knowledge_base').get() as { count: number }
  if (kbCount.count === 0) {
    const knowledge = [
      {
        question: '如何办理失业登记？',
        answer: '办理失业登记需携带本人身份证、户口簿（或居住证）、近期免冠照片2张，到户籍所在地或常住地的街道（乡镇）社区事务受理服务中心办理。也可以通过省级人社政务服务平台在线申请。',
        category: '失业保险',
        keywords: '失业登记,失业保险,失业'
      },
      {
        question: '失业保险金领取条件是什么？',
        answer: '领取失业保险金需同时满足以下条件：1. 失业前用人单位和本人已经缴纳失业保险费满一年的；2. 非因本人意愿中断就业的；3. 已办理失业登记，并有求职要求的。',
        category: '失业保险',
        keywords: '失业保险金,领取条件'
      },
      {
        question: '养老保险如何转移接续？',
        answer: '养老保险转移接续流程：1. 在转出地社保经办机构开具《基本养老保险参保缴费凭证》；2. 向转入地社保经办机构提出转移申请并提交凭证；3. 转入地审核后向转出地发出联系函；4. 转出地办理转出手续；5. 转入地接收并办理接续。全程可通过国家社会保险公共服务平台线上办理。',
        category: '养老保险',
        keywords: '养老保险,转移接续,社保转移'
      },
      {
        question: '如何申请创业担保贷款？',
        answer: '申请创业担保贷款流程：1. 向当地人力资源和社会保障部门提出资格认定申请；2. 经审核符合条件的，获得创业担保贷款资格；3. 向经办银行提交贷款申请及相关材料；4. 银行审批通过后发放贷款；5. 按规定享受财政贴息。个人最高可贷20万元，小微企业最高可贷300万元。',
        category: '创业扶持',
        keywords: '创业担保贷款,创业贷款,贴息'
      },
      {
        question: '社保卡丢失了怎么办？',
        answer: '社保卡丢失后，应立即办理挂失和补卡：1. 电话挂失：拨打12333服务热线；2. 线上挂失：通过人社APP或官方网站；3. 现场挂失：携带身份证到社保卡服务网点。挂失后可申请补卡，补卡一般需15个工作日左右。',
        category: '社保卡',
        keywords: '社保卡,挂失,补卡'
      },
      {
        question: '如何查询社保缴费记录？',
        answer: '查询社保缴费记录有以下方式：1. 线上查询：登录省级人社政务服务平台、官方APP或小程序；2. 电话查询：拨打12333服务热线；3. 自助查询：前往社保经办机构自助服务终端；4. 窗口查询：携带身份证到社保经办机构窗口。',
        category: '社会保险',
        keywords: '社保缴费,缴费记录,查询'
      },
      {
        question: '稳岗返还政策的申请条件是什么？',
        answer: '失业保险稳岗返还申请条件：1. 依法参加失业保险并足额缴纳失业保险费；2. 上年度未裁员或裁员率不高于5.5%，30人（含）以下的参保企业裁员率不高于参保职工总数20%；3. 生产经营活动符合国家及所在区域产业结构调整和环保政策；4. 财务制度健全、管理运行规范。',
        category: '稳岗返还',
        keywords: '稳岗返还,裁员率,失业保险'
      },
      {
        question: '技能提升补贴如何申请？',
        answer: '技能提升补贴申请流程：1. 职工应在职业资格证书或技能等级证书核发之日起12个月内申请；2. 登录省级人社政务服务平台或到参保地失业保险经办机构窗口申请；3. 提交身份证、职业资格证书或技能等级证书等材料；4. 经审核符合条件的，补贴资金直接发放至申请人银行账户。',
        category: '技能培训',
        keywords: '技能提升补贴,职业资格,技能等级'
      },
      {
        question: '劳动争议仲裁的时效是多久？',
        answer: '劳动争议申请仲裁的时效期间为一年。仲裁时效期间从当事人知道或者应当知道其权利被侵害之日起计算。劳动关系存续期间因拖欠劳动报酬发生争议的，劳动者申请仲裁不受一年仲裁时效期间的限制；但是，劳动关系终止的，应当自劳动关系终止之日起一年内提出。',
        category: '劳动仲裁',
        keywords: '劳动仲裁,仲裁时效,劳动争议'
      },
      {
        question: '法定退休年龄是多少？',
        answer: '我国现行法定退休年龄为：男年满60周岁，女工人年满50周岁，女干部年满55周岁。从事井下、高空、高温、特别繁重体力劳动或其他有害身体健康工作的，退休年龄为男年满55周岁、女年满45周岁。因病或非因工致残，由医院证明并经劳动鉴定委员会确认完全丧失劳动能力的，退休年龄为男年满50周岁、女年满45周岁。',
        category: '养老保险',
        keywords: '退休年龄,退休,法定退休'
      }
    ]

    const insertKb = db.prepare(`
      INSERT INTO knowledge_base (question, answer, category, keywords, sort_order, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const tx = db.transaction((items: typeof knowledge) => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        insertKb.run(item.question, item.answer, item.category, item.keywords, i + 1, 'active')
      }
    })

    tx(knowledge)
  }

  const outletCount = db.prepare('SELECT COUNT(*) as count FROM service_outlets').get() as { count: number }
  if (outletCount.count === 0) {
    const outlets = [
      {
        outlet_code: 'OUT001',
        name: '省政务服务中心人社分中心',
        address: '省城市中区文化路1号',
        district: '市中区',
        phone: '0123-12345678',
        work_hours: '周一至周五 9:00-17:00',
        latitude: 39.9042,
        longitude: 116.4074,
        services: '社保经办,就业服务,人才服务,劳动仲裁'
      },
      {
        outlet_code: 'OUT002',
        name: '市东区人力资源和社会保障服务中心',
        address: '省城市东区政务大道88号',
        district: '市东区',
        phone: '0123-23456789',
        work_hours: '周一至周五 9:00-17:00',
        latitude: 39.9142,
        longitude: 116.4274,
        services: '社保经办,就业服务,技能培训'
      },
      {
        outlet_code: 'OUT003',
        name: '市西区街道综合服务中心',
        address: '省城市西区民生路100号',
        district: '市西区',
        phone: '0123-34567890',
        work_hours: '周一至周五 9:00-17:30',
        latitude: 39.8942,
        longitude: 116.3874,
        services: '失业登记,社保查询,补贴申请'
      },
      {
        outlet_code: 'OUT004',
        name: '高新区政务服务中心人社窗口',
        address: '省城高新区科技园区创业大厦',
        district: '高新区',
        phone: '0123-45678901',
        work_hours: '周一至周五 8:30-17:30',
        latitude: 39.9242,
        longitude: 116.4574,
        services: '人才服务,创业扶持,社保经办'
      },
      {
        outlet_code: 'OUT005',
        name: '南区职业技能鉴定中心',
        address: '省城市南区教育路66号',
        district: '市南区',
        phone: '0123-56789012',
        work_hours: '周一至周五 9:00-17:00',
        latitude: 39.8742,
        longitude: 116.4174,
        services: '技能鉴定,证书办理,培训报名'
      }
    ]

    const insertOutlet = db.prepare(`
      INSERT INTO service_outlets (
        outlet_code, name, address, district, phone, work_hours,
        latitude, longitude, services, sort_order, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const tx = db.transaction((items: typeof outlets) => {
      for (let i = 0; i < items.length; i++) {
        const o = items[i]
        insertOutlet.run(
          o.outlet_code, o.name, o.address, o.district, o.phone, o.work_hours,
          o.latitude, o.longitude, o.services, i + 1, 'active'
        )
      }
    })

    tx(outlets)
  }

  const bcCount = db.prepare('SELECT COUNT(*) as count FROM blockchain_records').get() as { count: number }
  if (bcCount.count === 0) {
    db.prepare(`
      INSERT INTO blockchain_records (ref_type, ref_id, data_digest, hash, previous_hash, block_height)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('GENESIS', '0', 'genesis_block', '0000000000000000000000000000000000000000000000000000000000000000', null, 0)
  }
}

export default getDatabase
