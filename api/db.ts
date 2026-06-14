import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, 'data', 'app.sqlite')

const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    role TEXT DEFAULT 'user',
    credit_score INTEGER DEFAULT 100,
    avatar TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    summary TEXT,
    cover_image TEXT,
    source TEXT DEFAULT 'manual',
    source_url TEXT,
    category TEXT DEFAULT 'general',
    tags TEXT,
    status TEXT DEFAULT 'draft',
    author_id INTEGER REFERENCES users(id),
    auditor_id INTEGER REFERENCES users(id),
    view_count INTEGER DEFAULT 0,
    published_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS news_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    news_id INTEGER REFERENCES news(id),
    auditor_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    comment TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    bureau TEXT NOT NULL,
    api_endpoint TEXT,
    description TEXT,
    icon TEXT,
    category TEXT,
    status TEXT DEFAULT 'active',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS service_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    service_id INTEGER REFERENCES services(id),
    form_data TEXT,
    status TEXT DEFAULT 'submitted',
    result TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    priority TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'submitted',
    assigned_department TEXT,
    assigned_handler TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS complaint_dispatches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER REFERENCES complaints(id),
    handler_id INTEGER REFERENCES users(id),
    department TEXT,
    instruction TEXT,
    status TEXT DEFAULT 'pending',
    dispatched_at TEXT DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS complaint_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER REFERENCES complaints(id),
    status TEXT,
    description TEXT,
    evidence_hash TEXT,
    operator_id INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS satisfaction_surveys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER REFERENCES complaints(id),
    user_id INTEGER REFERENCES users(id),
    rating INTEGER,
    comment TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS media_contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT,
    cover_url TEXT,
    duration INTEGER,
    subtitle_url TEXT,
    ai_subtitle_status TEXT DEFAULT 'none',
    status TEXT DEFAULT 'draft',
    view_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS pois (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    address TEXT,
    lng REAL,
    lat REAL,
    phone TEXT,
    business_verified INTEGER DEFAULT 0,
    license_number TEXT,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS poi_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poi_id INTEGER REFERENCES pois(id),
    user_id INTEGER REFERENCES users(id),
    rating INTEGER NOT NULL,
    content TEXT,
    images TEXT,
    is_fraud INTEGER DEFAULT 0,
    fraud_reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS content_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL,
    content_id INTEGER NOT NULL,
    reviewer_id INTEGER REFERENCES users(id),
    result TEXT,
    risk_type TEXT,
    details TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS public_opinion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL,
    heat_value REAL DEFAULT 0,
    region TEXT DEFAULT '广州',
    source TEXT,
    sentiment TEXT DEFAULT 'neutral',
    data_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS creator_credits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) UNIQUE,
    score INTEGER DEFAULT 100,
    level TEXT DEFAULT 'normal',
    violation_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS credit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    operator_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`)

function hashPassword(password: string): string {
  return crypto.SHA256(password).toString()
}

const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin') as { id: number } | undefined

if (!adminExists) {
  const insertUser = db.prepare(
    'INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)'
  )
  const insertNews = db.prepare(
    `INSERT INTO news (title, content, summary, source, category, tags, status, author_id, view_count, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const insertService = db.prepare(
    `INSERT INTO services (name, bureau, description, category, sort_order) VALUES (?, ?, ?, ?, ?)`
  )
  const insertComplaint = db.prepare(
    `INSERT INTO complaints (user_id, title, content, category, priority, status, assigned_department) VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  const insertPoi = db.prepare(
    `INSERT INTO pois (name, category, address, lng, lat, phone, business_verified, rating, review_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const insertOpinion = db.prepare(
    `INSERT INTO public_opinion (keyword, heat_value, region, source, sentiment, data_date) VALUES (?, ?, ?, ?, ?, ?)`
  )
  const insertCreatorCredit = db.prepare(
    'INSERT INTO creator_credits (user_id, score, level) VALUES (?, ?, ?)'
  )

  const seed = db.transaction(() => {
    insertUser.run('admin', hashPassword('admin123'), '系统管理员', 'admin')
    insertUser.run('editor1', hashPassword('editor123'), '编辑小王', 'editor')
    insertUser.run('user1', hashPassword('user123'), '市民张三', 'user')

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

    insertNews.run(
      '广州天河区新增三条地铁线路规划公示',
      '广州市规划和自然资源局今日正式公示天河区三条新地铁线路规划方案，涉及21号线东延线、23号线及27号线。三条线路总长度约68公里，预计设站32座，将有效串联天河智慧城、金融城等重点片区。',
      '天河区三条新地铁线路规划公示，总长约68公里',
      'manual', '交通', '地铁,天河,规划', 'published', 1, 1283, now
    )
    insertNews.run(
      '广州国际灯光节今晚开幕',
      '第十二届广州国际灯光节今晚在海心沙正式开幕，本届灯光节以"光耀花城·智造未来"为主题，设有花城广场、海心沙等六大展区，运用AI互动、全息投影等前沿技术，为市民呈现一场科技与艺术融合的视觉盛宴。',
      '第十二届广州国际灯光节开幕，六大展区融合科技与艺术',
      'manual', '文旅', '灯光节,花城,科技', 'published', 1, 3567, now
    )
    insertNews.run(
      '广州市教育局发布2026年义务教育招生政策',
      '广州市教育局今日发布2026年义务教育阶段学校招生工作指导意见，明确继续坚持免试就近入学原则，完善公民同招政策，进一步优化积分制入学办法。',
      '2026年广州义务教育招生政策发布，坚持免试就近入学',
      'manual', '教育', '招生,义务教育,政策', 'published', 1, 892, now
    )
    insertNews.run(
      '琶洲人工智能与数字经济试验区再迎重磅项目',
      '琶洲人工智能与数字经济试验区再迎三家头部科技企业入驻，总投资额超50亿元。项目涵盖大模型研发、智能驾驶、工业互联网等领域，将进一步强化琶洲作为粤港澳大湾区数字经济高地的地位。',
      '琶洲数字经济试验区迎来三家头部企业入驻，总投资超50亿',
      'manual', '科技', '琶洲,数字经济,人工智能', 'draft', 1, 0, null
    )
    insertNews.run(
      '广州白云机场T3航站楼建设进展顺利',
      '广州白云国际机场三期扩建工程T3航站楼项目已完成钢结构主体封顶，预计2027年投入使用。建成后白云机场年旅客吞吐能力将突破1.2亿人次，成为全球最大单体机场之一。',
      '白云机场T3航站楼主体封顶，预计2027年投入使用',
      'manual', '交通', '白云机场,T3,扩建', 'pending', 1, 0, null
    )

    const bureaus: [string, string, string, string, number][] = [
      ['卫生健康委员会', '卫健', '医疗机构执业许可、公共场所卫生许可等卫生健康服务', '民生保障', 1],
      ['教育局', '教育', '学前教育、义务教育、高中教育等教育服务', '民生保障', 2],
      ['社会保险基金管理中心', '社保', '养老保险、医疗保险、失业保险等社保服务', '民生保障', 3],
      ['住房和城乡建设局', '住建', '房屋登记、建筑施工许可、物业管理等住建服务', '住房建设', 4],
      ['民政局', '民政', '婚姻登记、社会救助、社会组织管理等民政服务', '民生保障', 5],
      ['公安局', '公安', '户籍管理、出入境服务、交通安全等公安服务', '安全法治', 6],
      ['司法局', '司法', '法律援助、公证服务、人民调解等司法服务', '安全法治', 7],
      ['交通运输局', '交通', '公共交通、道路运输、交通规划等交通服务', '出行交通', 8],
      ['商务局', '商务', '对外贸易、招商引资、电子商务等商务服务', '经济商贸', 9],
      ['文化广电旅游局', '文旅', '文化旅游、广播电视、文物保护等文旅服务', '文化休闲', 10],
      ['应急管理局', '应急', '安全生产、防灾减灾、应急救援等应急管理服务', '安全法治', 11],
      ['水务局', '水务', '供水排水、河涌治理、水资源管理等水务服务', '城市建设', 12],
      ['农业农村局', '农业农村', '农业生产、乡村振兴、农村改革等农业农村服务', '乡村振兴', 13],
      ['科学技术局', '科技', '科技创新、成果转化、科技项目申报等科技服务', '创新创业', 14],
      ['工业和信息化局', '工信', '工业发展、信息化建设、中小企业服务等工信服务', '经济商贸', 15],
      ['财政局', '财政', '财政预算、政府采购、财税政策等财政服务', '经济商贸', 16],
      ['人力资源和社会保障局', '人社', '就业创业、人才服务、劳动关系等人社服务', '民生保障', 17],
      ['生态环境局', '生态环境', '环境影响评价、污染治理、生态保护等环保服务', '城市建设', 18],
      ['市场监督管理局', '市场监管', '企业注册、食品药械、质量监督等市场监管服务', '经济商贸', 19],
      ['税务局', '税务', '税收征管、纳税服务、税收优惠等税务服务', '经济商贸', 20],
      ['统计局', '统计', '统计数据发布、经济普查、社情民意调查等统计服务', '政务公开', 21],
      ['体育局', '体育', '全民健身、体育赛事、体育设施等体育服务', '文化休闲', 22],
      ['退役军人事务局', '退役军人', '退役军人安置、优抚褒扬、就业创业等退役军人服务', '民生保障', 23],
    ]

    for (const [name, bureau, desc, cat, sort] of bureaus) {
      insertService.run(name, bureau, desc, cat, sort)
    }

    insertComplaint.run(3, '小区周边噪音扰民', '天河区棠下街道某工地夜间施工噪音严重，影响周边居民正常休息，多次向物业反映无果。', '环保', 'high', 'dispatched', '生态环境局')
    insertComplaint.run(3, '路面坑洼存在安全隐患', '越秀区东风路路段路面多处坑洼，雨天积水严重，多次导致车辆受损和行人摔倒。', '市政', 'urgent', 'processing', '住房和城乡建设局')
    insertComplaint.run(3, '社保转移办理流程繁琐', '从外地转入广州的社保关系转移手续繁琐，窗口排队时间长，建议优化线上办理流程。', '社保', 'normal', 'submitted', '社会保险基金管理中心')

    insertPoi.run('广州塔', '景点', '广州市海珠区阅江西路222号', 113.324520, 23.106440, '020-89338222', 1, 4.8, 12560)
    insertPoi.run('花城广场', '公园', '广州市天河区珠江新城', 113.324000, 23.118000, '020-85658111', 1, 4.6, 8320)
    insertPoi.run('陈家祠', '景点', '广州市荔湾区中山七路恩龙里34号', 113.252410, 23.129660, '020-81814559', 1, 4.7, 6890)
    insertPoi.run('天河城', '商场', '广州市天河区天河路208号', 113.330730, 23.136020, '020-85592818', 1, 4.5, 15230)
    insertPoi.run('白云山', '景点', '广州市白云区广园中路801号', 113.298840, 23.184860, '020-37222222', 1, 4.7, 9870)

    const opinions: [string, number, string, string, string][] = [
      ['广州地铁建设', 9856.3, '广州', '微博', 'positive'],
      ['广州房价', 8234.1, '广州', '新闻', 'negative'],
      ['广州营商环境', 7621.5, '广州', '政府网站', 'positive'],
      ['广州教育改革', 6543.8, '广州', '新闻', 'neutral'],
      ['广州垃圾分类', 5432.2, '广州', '微博', 'positive'],
      ['广州交通拥堵', 8901.4, '广州', '微博', 'negative'],
      ['广州医疗资源', 6789.0, '广州', '新闻', 'neutral'],
      ['广州人才引进', 7123.6, '广州', '政府网站', 'positive'],
      ['广州旧城改造', 5678.9, '广州', '新闻', 'neutral'],
      ['广州疫情防控', 3456.7, '广州', '微博', 'neutral'],
    ]

    const today = new Date().toISOString().slice(0, 10)
    for (const [keyword, heat, region, source, sentiment] of opinions) {
      insertOpinion.run(keyword, heat, region, source, sentiment, today)
    }

    insertCreatorCredit.run(1, 100, 'normal')
    insertCreatorCredit.run(2, 100, 'normal')
    insertCreatorCredit.run(3, 100, 'normal')
  })

  seed()
}

export default db
