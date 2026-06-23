import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'dev.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS UnionDistrict (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS UnionGrassroots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    districtId INTEGER NOT NULL,
    name TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (districtId) REFERENCES UnionDistrict(id)
  );

  CREATE TABLE IF NOT EXISTS User (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE,
    name TEXT,
    idCard TEXT UNIQUE,
    role TEXT DEFAULT 'worker',
    grassrootsId INTEGER,
    realnameVerified INTEGER DEFAULT 0,
    password TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (grassrootsId) REFERENCES UnionGrassroots(id)
  );

  CREATE TABLE IF NOT EXISTS Activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT,
    location TEXT,
    description TEXT,
    startTime TEXT,
    endTime TEXT,
    quota INTEGER,
    registered INTEGER DEFAULT 0,
    status TEXT DEFAULT 'open',
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS Registration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    activityId INTEGER NOT NULL,
    code TEXT UNIQUE,
    verified INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES User(id),
    FOREIGN KEY (activityId) REFERENCES Activity(id)
  );

  CREATE TABLE IF NOT EXISTS Merchant (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    contactPhone TEXT
  );

  CREATE TABLE IF NOT EXISTS MallProduct (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    price REAL,
    originalPrice REAL,
    stock INTEGER,
    merchantId INTEGER,
    FOREIGN KEY (merchantId) REFERENCES Merchant(id)
  );

  CREATE TABLE IF NOT EXISTS MallOrder (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderNo TEXT UNIQUE,
    userId INTEGER NOT NULL,
    productId INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    totalAmount REAL,
    code TEXT UNIQUE,
    status TEXT DEFAULT 'PAID',
    expireAt TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES User(id),
    FOREIGN KEY (productId) REFERENCES MallProduct(id)
  );

  CREATE TABLE IF NOT EXISTS LegalQueue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    queueNo TEXT,
    position INTEGER,
    status TEXT DEFAULT 'waiting',
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES User(id)
  );

  CREATE TABLE IF NOT EXISTS LegalTemplate (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT,
    content TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS AidApplication (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    difficultyType TEXT,
    description TEXT,
    familyInfo TEXT,
    materials TEXT,
    aiSuggestion TEXT,
    aiScore REAL,
    status TEXT DEFAULT 'submitted',
    reviewComment TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES User(id)
  );

  CREATE TABLE IF NOT EXISTS PsyScale (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    description TEXT,
    questions TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS PsyReport (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    scaleId INTEGER NOT NULL,
    answers TEXT,
    scores TEXT,
    suggestion TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES User(id),
    FOREIGN KEY (scaleId) REFERENCES PsyScale(id)
  );

  CREATE TABLE IF NOT EXISTS PsyCounselor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    title TEXT,
    specialty TEXT
  );

  CREATE TABLE IF NOT EXISTS PsyAppointment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    counselorId INTEGER NOT NULL,
    appointmentTime TEXT,
    status TEXT DEFAULT 'pending',
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES User(id),
    FOREIGN KEY (counselorId) REFERENCES PsyCounselor(id)
  );

  CREATE TABLE IF NOT EXISTS UserTag (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    tagKey TEXT,
    tagValue TEXT,
    FOREIGN KEY (userId) REFERENCES User(id)
  );

  CREATE TABLE IF NOT EXISTS PushMessage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    tags TEXT,
    recipientCount INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS UserMessage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    pushId INTEGER,
    title TEXT,
    content TEXT,
    read INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES User(id),
    FOREIGN KEY (pushId) REFERENCES PushMessage(id)
  );
`)

const districtCount = (db.prepare('SELECT COUNT(*) as count FROM UnionDistrict').get() as { count: number }).count
if (districtCount === 0) {
  const insertDistrict = db.prepare('INSERT INTO UnionDistrict (name) VALUES (?)')
  const districts = ['上城区', '拱墅区', '西湖区', '滨江区', '萧山区', '余杭区', '临平区', '钱塘区', '富阳区', '临安区']
  const districtIds: number[] = []
  for (const name of districts) {
    const r = insertDistrict.run(name)
    districtIds.push(r.lastInsertRowid as number)
  }

  const insertGrassroots = db.prepare('INSERT INTO UnionGrassroots (districtId, name) VALUES (?, ?)')
  const grassrootsData = [
    [districtIds[0], '上城区湖滨街道工会'], [districtIds[0], '上城区南星街道工会'],
    [districtIds[1], '拱墅区米市巷街道工会'], [districtIds[1], '拱墅区湖墅街道工会'],
    [districtIds[2], '西湖区北山街道工会'], [districtIds[2], '西湖区灵隐街道工会'],
    [districtIds[3], '滨江区西兴街道工会'], [districtIds[3], '滨江区长河街道工会'],
  ]
  for (const [dId, name] of grassrootsData) {
    insertGrassroots.run(dId, name)
  }

  db.prepare("INSERT INTO User (phone, name, role, realnameVerified) VALUES (?, ?, ?, ?)").run('13800000000', '系统管理员', 'admin', 1)

  const insertMerchant = db.prepare('INSERT INTO Merchant (name, address, contactPhone) VALUES (?, ?, ?)')
  const merchantIds: number[] = []
  const merchants = [
    ['知味观·湖滨店', '杭州市上城区湖滨路1号', '0571-87012345'],
    ['楼外楼·孤山路', '杭州市西湖区孤山路30号', '0571-87969023'],
    ['奎元馆·解放路', '杭州市上城区解放路125号', '0571-87065621'],
  ]
  for (const m of merchants) {
    const r = insertMerchant.run(m[0], m[1], m[2])
    merchantIds.push(r.lastInsertRowid as number)
  }

  const insertActivity = db.prepare('INSERT INTO Activity (title, type, location, description, startTime, endTime, quota) VALUES (?, ?, ?, ?, ?, ?, ?)')
  const activities = [
    ['迎春职工书法大赛', 'culture', '杭州市工人文化宫', '弘扬传统文化，展示职工书法风采', '2026-03-01 09:00', '2026-03-01 17:00', 50],
    ['钱塘江畔健步走', 'sport', '钱塘江滨江步道', '倡导健康生活方式，增进职工身心健康', '2026-03-15 08:00', '2026-03-15 12:00', 200],
    ['职工摄影展', 'culture', '杭州职工活动中心', '用镜头记录美好生活，展现职工精神风貌', '2026-04-01 10:00', '2026-04-30 18:00', 100],
  ]
  for (const a of activities) {
    insertActivity.run(a[0], a[1], a[2], a[3], a[4], a[5], a[6])
  }

  const insertProduct = db.prepare('INSERT INTO MallProduct (name, category, description, price, originalPrice, stock, merchantId) VALUES (?, ?, ?, ?, ?, ?, ?)')
  const products = [
    ['知味观小笼礼盒', 'FOOD', '杭州老字号知味观经典小笼包礼盒装', 68, 128, 200, merchantIds[0]],
    ['楼外楼西湖醋鱼券', 'FOOD', '百年老店楼外楼招牌西湖醋鱼体验券', 88, 168, 150, merchantIds[1]],
    ['奎元馆片儿川套餐', 'FOOD', '奎元馆经典片儿川面食套餐', 28, 56, 300, merchantIds[2]],
    ['西湖游船半价票', 'SERVICE', '西湖景区游船半价优惠票', 30, 60, 500, merchantIds[0]],
    ['生活超市满减券', 'LIFE', '合作超市满100减30优惠券', 30, 100, 1000, merchantIds[0]],
  ]
  for (const p of products) {
    insertProduct.run(p[0], p[1], p[2], p[3], p[4], p[5], p[6])
  }

  const insertTemplate = db.prepare('INSERT INTO LegalTemplate (title, category, content) VALUES (?, ?, ?)')
  const templates = [
    ['劳动合同模板', '劳动合同', '甲方（用人单位）：\n乙方（劳动者）：\n\n根据《中华人民共和国劳动合同法》及相关法律法规，甲乙双方在平等自愿、协商一致的基础上，签订本劳动合同。'],
    ['工伤认定申请书', '工伤认定', '申请人：\n被申请人：\n\n请求事项：\n请求依法认定申请人于XXXX年XX月XX日所受伤害为工伤。'],
    ['劳动仲裁申请书', '劳动仲裁', '申请人：\n被申请人：\n\n仲裁请求：\n1. 请求裁令被申请人支付拖欠工资\n2. 请求裁令被申请人支付经济补偿金'],
    ['工资支付催告函', '工资维权', '致：XXXX公司\n\n鉴于贵公司至今未按劳动合同约定支付本人XXXX年XX月至XX月工资，现正式催告如下：'],
  ]
  for (const t of templates) {
    insertTemplate.run(t[0], t[1], t[2])
  }

  const insertScale = db.prepare('INSERT INTO PsyScale (name, code, description, questions) VALUES (?, ?, ?, ?)')
  const scl90Questions = JSON.stringify([
    { id: 1, text: '头痛', options: [{ label: '没有', score: 1 }, { label: '很轻', score: 2 }, { label: '中等', score: 3 }, { label: '偏重', score: 4 }, { label: '严重', score: 5 }] },
    { id: 2, text: '神经过敏，心中不踏实', options: [{ label: '没有', score: 1 }, { label: '很轻', score: 2 }, { label: '中等', score: 3 }, { label: '偏重', score: 4 }, { label: '严重', score: 5 }] },
    { id: 3, text: '头脑中有不必要的想法或字句盘旋', options: [{ label: '没有', score: 1 }, { label: '很轻', score: 2 }, { label: '中等', score: 3 }, { label: '偏重', score: 4 }, { label: '严重', score: 5 }] },
    { id: 4, text: '头昏或昏倒', options: [{ label: '没有', score: 1 }, { label: '很轻', score: 2 }, { label: '中等', score: 3 }, { label: '偏重', score: 4 }, { label: '严重', score: 5 }] },
    { id: 5, text: '对异性的兴趣减退', options: [{ label: '没有', score: 1 }, { label: '很轻', score: 2 }, { label: '中等', score: 3 }, { label: '偏重', score: 4 }, { label: '严重', score: 5 }] },
    { id: 6, text: '对旁人责备求全', options: [{ label: '没有', score: 1 }, { label: '很轻', score: 2 }, { label: '中等', score: 3 }, { label: '偏重', score: 4 }, { label: '严重', score: 5 }] },
    { id: 7, text: '感到别人能控制你的思想', options: [{ label: '没有', score: 1 }, { label: '很轻', score: 2 }, { label: '中等', score: 3 }, { label: '偏重', score: 4 }, { label: '严重', score: 5 }] },
    { id: 8, text: '责怪别人制造麻烦', options: [{ label: '没有', score: 1 }, { label: '很轻', score: 2 }, { label: '中等', score: 3 }, { label: '偏重', score: 4 }, { label: '严重', score: 5 }] },
    { id: 9, text: '忘性大', options: [{ label: '没有', score: 1 }, { label: '很轻', score: 2 }, { label: '中等', score: 3 }, { label: '偏重', score: 4 }, { label: '严重', score: 5 }] },
    { id: 10, text: '担心自己的衣饰整齐及仪态的端正', options: [{ label: '没有', score: 1 }, { label: '很轻', score: 2 }, { label: '中等', score: 3 }, { label: '偏重', score: 4 }, { label: '严重', score: 5 }] },
  ])
  insertScale.run('SCL-90症状自评量表', 'SCL-90', '包含90个项目的自评量表，用于评估心理健康状况', scl90Questions)

  const phq9Questions = JSON.stringify([
    { id: 1, text: '做事时提不起劲或没有兴趣', options: [{ label: '完全不会', score: 0 }, { label: '好几天', score: 1 }, { label: '超过一半的天数', score: 2 }, { label: '几乎每天', score: 3 }] },
    { id: 2, text: '感到心情低落、沮丧或绝望', options: [{ label: '完全不会', score: 0 }, { label: '好几天', score: 1 }, { label: '超过一半的天数', score: 2 }, { label: '几乎每天', score: 3 }] },
    { id: 3, text: '入睡困难、睡不安稳或睡眠过多', options: [{ label: '完全不会', score: 0 }, { label: '好几天', score: 1 }, { label: '超过一半的天数', score: 2 }, { label: '几乎每天', score: 3 }] },
    { id: 4, text: '感觉疲倦或没有活力', options: [{ label: '完全不会', score: 0 }, { label: '好几天', score: 1 }, { label: '超过一半的天数', score: 2 }, { label: '几乎每天', score: 3 }] },
    { id: 5, text: '食欲不振或吃得太多', options: [{ label: '完全不会', score: 0 }, { label: '好几天', score: 1 }, { label: '超过一半的天数', score: 2 }, { label: '几乎每天', score: 3 }] },
    { id: 6, text: '觉得自己很糟，或觉得自己很失败，或让自己和家人失望', options: [{ label: '完全不会', score: 0 }, { label: '好几天', score: 1 }, { label: '超过一半的天数', score: 2 }, { label: '几乎每天', score: 3 }] },
    { id: 7, text: '对事物专注有困难，例如阅读报纸或看电视', options: [{ label: '完全不会', score: 0 }, { label: '好几天', score: 1 }, { label: '超过一半的天数', score: 2 }, { label: '几乎每天', score: 3 }] },
    { id: 8, text: '动作或说话速度缓慢，或正好相反，烦躁不安地动来动去', options: [{ label: '完全不会', score: 0 }, { label: '好几天', score: 1 }, { label: '超过一半的天数', score: 2 }, { label: '几乎每天', score: 3 }] },
    { id: 9, text: '有不如死掉或用某种方式伤害自己的念头', options: [{ label: '完全不会', score: 0 }, { label: '好几天', score: 1 }, { label: '超过一半的天数', score: 2 }, { label: '几乎每天', score: 3 }] },
  ])
  insertScale.run('PHQ-9抑郁筛查量表', 'PHQ-9', '9条目患者健康问卷，用于抑郁症状筛查', phq9Questions)

  const insertCounselor = db.prepare('INSERT INTO PsyCounselor (name, title, specialty) VALUES (?, ?, ?)')
  const counselors = [
    ['王心怡', '国家二级心理咨询师', '情绪管理、职场压力'],
    ['陈安宁', '高级心理咨询师', '家庭关系、个人成长'],
    ['李向阳', '注册心理师', '焦虑抑郁、创伤修复'],
  ]
  for (const c of counselors) {
    insertCounselor.run(c[0], c[1], c[2])
  }
}

export default db
