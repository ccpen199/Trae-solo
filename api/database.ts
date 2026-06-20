import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'decor.db')

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    phone TEXT UNIQUE,
    avatar TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS designers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT,
    title TEXT,
    company TEXT,
    region TEXT,
    experience INTEGER DEFAULT 0,
    price_min REAL DEFAULT 0,
    price_max REAL DEFAULT 0,
    rating REAL DEFAULT 0,
    cases_count INTEGER DEFAULT 0,
    certification TEXT,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS designer_styles (
    id TEXT PRIMARY KEY,
    designer_id TEXT NOT NULL,
    style TEXT NOT NULL,
    FOREIGN KEY (designer_id) REFERENCES designers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    designer_id TEXT,
    style TEXT,
    house_type TEXT,
    area REAL,
    budget_min REAL,
    budget_max REAL,
    city TEXT,
    description TEXT,
    cover_image TEXT,
    floor_plan TEXT,
    images TEXT,
    status TEXT DEFAULT 'pending',
    watermark_verified INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (designer_id) REFERENCES designers(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS case_materials (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    unit_price REAL DEFAULT 0,
    quantity REAL DEFAULT 0,
    area TEXT,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS case_construction_nodes (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    phase TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    order_num INTEGER DEFAULT 0,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    brand TEXT,
    unit TEXT,
    price REAL DEFAULT 0,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS construction_nodes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phase INTEGER DEFAULT 0,
    duration_days INTEGER DEFAULT 0,
    description TEXT,
    order_num INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    case_id TEXT,
    designer_id TEXT,
    target_type TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    designer_id TEXT NOT NULL,
    contact_name TEXT,
    contact_phone TEXT,
    house_type TEXT,
    area REAL,
    budget TEXT,
    preferred_date TEXT,
    preferred_time TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (designer_id) REFERENCES designers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS browsing_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    case_id TEXT NOT NULL,
    duration INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS city_prices (
    id TEXT PRIMARY KEY,
    city TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL DEFAULT 0,
    unit TEXT DEFAULT '元/㎡'
  );
`)

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) return

  const insertUser = db.prepare('INSERT INTO users (id, nickname, phone, avatar) VALUES (?, ?, ?, ?)')
  insertUser.run('user-001', '张小明', '13800138001', '')
  insertUser.run(uuidv4(), '李思思', '13800138002', '')
  insertUser.run(uuidv4(), '王大伟', '13800138003', '')

  const insertDesigner = db.prepare(`INSERT INTO designers (id, name, avatar, title, company, region, experience, price_min, price_max, rating, cases_count, certification, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  const insertDesignerStyle = db.prepare('INSERT INTO designer_styles (id, designer_id, style) VALUES (?, ?, ?)')

  const designers = [
    { name: '林清远', title: '首席设计师', company: '居舍设计', region: '北京', experience: 12, price_min: 800, price_max: 1500, rating: 4.9, cases_count: 156, certification: 'gold', description: '擅长将东方美学融入现代空间，作品多次获得国内外设计大奖。设计理念：让每一个空间都讲述居住者的故事。', styles: ['新中式', '现代简约'] },
    { name: '陈雨桐', title: '设计总监', company: '栖云设计', region: '上海', experience: 10, price_min: 600, price_max: 1200, rating: 4.8, cases_count: 128, certification: 'gold', description: '北欧风格资深研究者，追求功能与美学的完美平衡。作品简约而不简单，注重居住体验。', styles: ['北欧', '现代简约'] },
    { name: '赵明轩', title: '高级设计师', company: '简筑设计', region: '深圳', experience: 8, price_min: 500, price_max: 1000, rating: 4.7, cases_count: 89, certification: 'silver', description: '轻奢风格专家，善于运用材质对比和光影营造高级感。每个项目都精益求精。', styles: ['轻奢', '现代简约'] },
    { name: '孙雅琴', title: '高级设计师', company: '和风设计', region: '成都', experience: 9, price_min: 400, price_max: 900, rating: 4.8, cases_count: 95, certification: 'silver', description: '日式侘寂风格践行者，追求自然质朴的生活美学。善于利用自然光线和原木材质营造宁静氛围。', styles: ['日式侘寂', '北欧'] },
    { name: '周子涵', title: '主案设计师', company: '造物设计', region: '广州', experience: 7, price_min: 450, price_max: 950, rating: 4.6, cases_count: 72, certification: 'silver', description: '工业风格倡导者，擅长将粗犷与精致完美融合。善于利用裸露材质和复古元素打造个性空间。', styles: ['工业风', '轻奢'] },
    { name: '吴思远', title: '设计师', company: '拾光设计', region: '北京', experience: 5, price_min: 300, price_max: 700, rating: 4.5, cases_count: 45, certification: 'bronze', description: '新生代设计师，擅长现代简约与北欧风格。设计风格清新自然，注重空间的开放性和互动性。', styles: ['现代简约', '北欧'] },
  ]

  const designerIds: string[] = []
  for (const d of designers) {
    const id = uuidv4()
    designerIds.push(id)
    insertDesigner.run(id, d.name, '', d.title, d.company, d.region, d.experience, d.price_min, d.price_max, d.rating, d.cases_count, d.certification, d.description)
    for (const s of d.styles) {
      insertDesignerStyle.run(uuidv4(), id, s)
    }
  }

  const insertCase = db.prepare(`INSERT INTO cases (id, title, designer_id, style, house_type, area, budget_min, budget_max, city, description, cover_image, floor_plan, images, status, watermark_verified, views, likes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)

  const casePrompts = [
    { style: '新中式', area: 168, title: '东方雅韵·新中式四居', p: 'chinese+traditional+interior+living+room+wooden+furniture+ink+painting+decoration' },
    { style: '北欧', area: 120, title: '极简白·北欧三居', p: 'scandinavian+minimalist+living+room+white+oak+wood+green+plants' },
    { style: '轻奢', area: 195, title: '都市轻奢·现代复式', p: 'luxury+modern+apartment+marble+gold+details+crystal+chandelier' },
    { style: '日式侘寂', area: 85, title: '侘寂之美·日式两居', p: 'japanese+wabi+sabi+interior+zen+wood+tatami+shoji+screen' },
    { style: '工业风', area: 110, title: '粗犷与精致·工业风LOFT', p: 'industrial+loft+interior+exposed+brick+wall+metal+staircase+vintage' },
    { style: '现代简约', area: 105, title: '简而不凡·现代简约三居', p: 'modern+minimalist+interior+clean+lines+black+white+wood+accent' },
    { style: '新中式', area: 320, title: '江南水乡·新中式别墅', p: 'chinese+villa+interior+zen+garden+view+double+height+ceiling+landscape' },
    { style: '北欧', area: 55, title: '温暖北欧·小户型改造', p: 'cozy+small+apartment+scandinavian+style+warm+lighting+compact+living' },
    { style: '现代简约', area: 78, title: '待审核·现代简约样板间', p: 'modern+showroom+apartment+interior+neutral+colors' },
  ]

  const caseData = [
    { title: '东方雅韵·新中式四居', designer_id: designerIds[0], style: '新中式', house_type: '四室两厅', area: 168, budget_min: 35, budget_max: 42, city: '北京', description: '以水墨意境为灵感，将传统东方元素与现代生活方式完美融合。客厅采用对称式布局，搭配实木家具和青瓷摆件，营造出雅致宁静的居住氛围。主卧以月洞门设计连接衣帽间，书房则运用竹编屏风划分空间。', status: 'approved', watermark_verified: 1, views: 3280, likes: 456 },
    { title: '极简白·北欧三居', designer_id: designerIds[1], style: '北欧', house_type: '三室两厅', area: 120, budget_min: 20, budget_max: 26, city: '上海', description: '以白色为主基调，搭配浅色原木和灰色布艺，营造清新自然的北欧氛围。客厅大面落地窗引入充足自然光，开放式厨房与餐厅相连，空间通透流畅。卧室采用低饱和度配色，搭配绿植点缀。', status: 'approved', watermark_verified: 1, views: 2890, likes: 389 },
    { title: '都市轻奢·现代复式', designer_id: designerIds[2], style: '轻奢', house_type: '复式', area: 195, budget_min: 45, budget_max: 55, city: '深圳', description: '以大理石和金属线条为主要材质，打造都市轻奢格调。挑高客厅配水晶吊灯，彰显气派。主卧套间含独立衣帽间和观景浴缸。二楼设家庭影院和酒吧区，满足品质生活需求。', status: 'approved', watermark_verified: 1, views: 4120, likes: 567 },
    { title: '侘寂之美·日式两居', designer_id: designerIds[3], style: '日式侘寂', house_type: '两室一厅', area: 85, budget_min: 15, budget_max: 20, city: '成都', description: '追求质朴自然的生活美学，大量使用原木、棉麻和石材。客厅以地台替代沙发，搭配障子门和枯山水造景。榻榻米多功能房兼具茶室和客房功能，整体空间安静内敛。', status: 'approved', watermark_verified: 1, views: 2150, likes: 298 },
    { title: '粗犷与精致·工业风LOFT', designer_id: designerIds[4], style: '工业风', house_type: 'LOFT', area: 110, budget_min: 18, budget_max: 24, city: '广州', description: '保留建筑原始结构，裸露红砖墙和水泥地面。铁艺楼梯连接上下层，搭配复古皮质沙发和黑钢书架。开放式厨房采用不锈钢台面，整体空间兼具粗犷与精致。', status: 'approved', watermark_verified: 0, views: 1890, likes: 245 },
    { title: '简而不凡·现代简约三居', designer_id: designerIds[5], style: '现代简约', house_type: '三室两厅', area: 105, budget_min: 16, budget_max: 21, city: '北京', description: '以少即是多为设计理念，去除多余装饰。全屋采用无主灯设计，嵌入式灯带营造氛围。定制柜体充分利用收纳空间，阳台改为休闲区。色彩以黑白灰为主，点缀木色增加温度。', status: 'approved', watermark_verified: 1, views: 2670, likes: 334 },
    { title: '江南水乡·新中式别墅', designer_id: designerIds[0], style: '新中式', house_type: '别墅', area: 320, budget_min: 80, budget_max: 100, city: '上海', description: '借鉴江南园林造景手法，将山水意境引入室内。中庭设枯山水造景，四季皆有不同景致。客厅悬挑二层通高，搭配巨幅山水画。茶室临水而建，透过落地窗可观锦鲤池。主卧配私人露台和书房。', status: 'approved', watermark_verified: 1, views: 5680, likes: 812 },
    { title: '温暖北欧·小户型改造', designer_id: designerIds[1], style: '北欧', house_type: '一室一厅', area: 55, budget_min: 8, budget_max: 12, city: '成都', description: '小户型北欧风改造典范。通过开放式布局和浅色系放大空间感。折叠餐桌兼作工作台，沙发床满足客房需求。卧室利用飘窗打造阅读角，全屋收纳系统化设计，小空间大智慧。', status: 'approved', watermark_verified: 1, views: 3450, likes: 478 },
    { title: '待审核·现代简约样板间', designer_id: designerIds[5], style: '现代简约', house_type: '两室一厅', area: 78, budget_min: 12, budget_max: 16, city: '深圳', description: '新建楼盘样板间设计，以现代简约风格为主，注重空间利用率和展示效果。', status: 'pending', watermark_verified: 0, views: 50, likes: 5 },
  ]

  const caseIds: string[] = []
  for (let i = 0; i < caseData.length; i++) {
    const c = caseData[i]
    const id = uuidv4()
    caseIds.push(id)
    const prompt = casePrompts[i]?.p || 'interior+design'
    const coverImage = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=landscape_4_3`
    const images = JSON.stringify([coverImage, coverImage, coverImage])
    const floorPlan = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=architectural+floor+plan+blueprint+${c.style}&image_size=landscape_4_3`
    insertCase.run(id, c.title, c.designer_id, c.style, c.house_type, c.area, c.budget_min, c.budget_max, c.city, c.description, coverImage, floorPlan, images, c.status, c.watermark_verified, c.views, c.likes)
  }

  const insertCaseMaterial = db.prepare('INSERT INTO case_materials (id, case_id, name, brand, model, unit_price, quantity, area) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')

  const defaultMaterials = [
    { name: '马可波罗瓷砖-云灰石', brand: '马可波罗', model: 'MP800A', unit_price: 168, quantity: 45, area: '客厅' },
    { name: '多乐士漆-金装全效', brand: '多乐士', model: 'A991', unit_price: 498, quantity: 6, area: '全屋' },
    { name: '圣象地板-北美橡木', brand: '圣象', model: 'NX-8012', unit_price: 289, quantity: 60, area: '卧室' },
    { name: '东鹏瓷砖-月岩灰', brand: '东鹏', model: 'DP-1200A', unit_price: 128, quantity: 28, area: '厨房' },
    { name: '立邦漆-竹炭净味', brand: '立邦', model: 'BC-501', unit_price: 368, quantity: 4, area: '儿童房' },
    { name: '大自然地板-胡桃木', brand: '大自然', model: 'DZ-H801', unit_price: 328, quantity: 35, area: '主卧' },
    { name: 'TOTO智能马桶', brand: 'TOTO', model: 'CES9911', unit_price: 4599, quantity: 1, area: '主卫' },
    { name: '科勒花洒套装', brand: '科勒', model: 'K-99431', unit_price: 2899, quantity: 2, area: '卫浴' },
    { name: '欧派橱柜-经典系列', brand: '欧派', model: 'OP-Classic-A', unit_price: 3200, quantity: 5, area: '厨房' },
    { name: '索菲亚衣柜-定制系列', brand: '索菲亚', model: 'SF-Custom', unit_price: 899, quantity: 12, area: '卧室' },
    { name: '雷士照明-客厅灯', brand: '雷士', model: 'LS-LED-X1', unit_price: 1299, quantity: 1, area: '客厅' },
    { name: '公牛开关面板', brand: '公牛', model: 'G28系列', unit_price: 32, quantity: 40, area: '全屋' },
  ]

  for (const caseId of caseIds) {
    for (let i = 0; i < 8; i++) {
      const m = defaultMaterials[i]
      insertCaseMaterial.run(uuidv4(), caseId, m.name, m.brand, m.model, m.unit_price, m.quantity, m.area)
    }
  }

  const insertCaseNode = db.prepare('INSERT INTO case_construction_nodes (id, case_id, phase, description, duration, order_num) VALUES (?, ?, ?, ?, ?, ?)')

  const defaultNodes = [
    { phase: '拆除工程', description: '拆除旧墙体、地面、吊顶等，清理建筑垃圾', duration: '3天', order_num: 1 },
    { phase: '水电改造', description: '水路管线铺设、电路布线、强弱电分离、防水处理', duration: '7天', order_num: 2 },
    { phase: '泥瓦工程', description: '墙地砖铺贴、找平、防水验收、门槛石安装', duration: '10天', order_num: 3 },
    { phase: '木工工程', description: '吊顶安装、隔墙搭建、柜体制作、门窗套安装', duration: '8天', order_num: 4 },
    { phase: '油漆工程', description: '墙面腻子批刮、打磨、底漆面漆施工、乳胶漆涂刷', duration: '12天', order_num: 5 },
    { phase: '安装工程', description: '橱柜安装、木门安装、地板铺设、卫浴安装、灯具开关安装', duration: '10天', order_num: 6 },
  ]

  for (const caseId of caseIds) {
    for (const n of defaultNodes) {
      insertCaseNode.run(uuidv4(), caseId, n.phase, n.description, n.duration, n.order_num)
    }
  }

  const insertMaterial = db.prepare('INSERT INTO materials (id, name, category, brand, unit, price, description) VALUES (?, ?, ?, ?, ?, ?, ?)')

  const materials = [
    { name: '马可波罗瓷砖-云灰石', category: '瓷砖', brand: '马可波罗', unit: '㎡', price: 168, description: '意大利设计灵感，仿石纹理，适用于客厅和厨卫空间' },
    { name: '多乐士漆-金装全效', category: '涂料', brand: '多乐士', unit: '桶(5L)', price: 498, description: '净味配方，防霉抗碱，遮盖力强，适合室内墙面' },
    { name: '圣象地板-北美橡木', category: '地板', brand: '圣象', unit: '㎡', price: 289, description: '实木复合地板，自然橡木纹理，耐磨防水，地暖适用' },
    { name: '东鹏瓷砖-月岩灰', category: '瓷砖', brand: '东鹏', unit: '㎡', price: 128, description: '600x1200大规格，灰色系，现代简约风格首选' },
    { name: '立邦漆-竹炭净味', category: '涂料', brand: '立邦', unit: '桶(5L)', price: 368, description: '竹炭净化技术，分解甲醛，即刷即住' },
    { name: '大自然地板-胡桃木', category: '地板', brand: '大自然', unit: '㎡', price: 328, description: '三层实木复合，胡桃木色，彰显品质与格调' },
    { name: 'TOTO智能马桶', category: '卫浴', brand: 'TOTO', unit: '个', price: 4599, description: '智洁技术，自动冲洗，暖风烘干，夜灯功能' },
    { name: '科勒花洒套装', category: '卫浴', brand: '科勒', unit: '套', price: 2899, description: '恒温花洒，三功能出水，304不锈钢' },
    { name: '欧派橱柜-经典系列', category: '橱柜', brand: '欧派', unit: '延米', price: 3200, description: '石英石台面，实木门板，环保E0级板材' },
    { name: '索菲亚衣柜-定制系列', category: '衣柜', brand: '索菲亚', unit: '㎡', price: 899, description: '全屋定制，多种风格可选，环保板材' },
    { name: '雷士照明-客厅灯', category: '灯具', brand: '雷士', unit: '个', price: 1299, description: 'LED吸顶灯，三色变光，遥控调光，简约设计' },
    { name: '公牛开关面板', category: '电工', brand: '公牛', unit: '个', price: 32, description: '86型面板，阻燃材料，安全可靠' },
  ]

  for (const m of materials) {
    insertMaterial.run(uuidv4(), m.name, m.category, m.brand, m.unit, m.price, m.description)
  }

  const insertNode = db.prepare('INSERT INTO construction_nodes (id, name, phase, duration_days, description, order_num) VALUES (?, ?, ?, ?, ?, ?)')

  const nodes = [
    { name: '拆除工程', phase: 1, duration_days: 3, description: '拆除旧墙体、地面、吊顶等，清理建筑垃圾', order_num: 1 },
    { name: '水电改造', phase: 2, duration_days: 7, description: '水路管线铺设、电路布线、强弱电分离、防水处理', order_num: 2 },
    { name: '泥瓦工程', phase: 3, duration_days: 10, description: '墙地砖铺贴、找平、防水验收、门槛石安装', order_num: 3 },
    { name: '木工工程', phase: 4, duration_days: 8, description: '吊顶安装、隔墙搭建、柜体制作、门窗套安装', order_num: 4 },
    { name: '油漆工程', phase: 5, duration_days: 12, description: '墙面腻子批刮、打磨、底漆面漆施工、乳胶漆涂刷', order_num: 5 },
    { name: '安装工程', phase: 6, duration_days: 10, description: '橱柜安装、木门安装、地板铺设、卫浴安装、灯具开关安装', order_num: 6 },
  ]

  for (const n of nodes) {
    insertNode.run(uuidv4(), n.name, n.phase, n.duration_days, n.description, n.order_num)
  }

  const insertCityPrice = db.prepare('INSERT INTO city_prices (id, city, category, price, unit) VALUES (?, ?, ?, ?, ?)')

  const cities = ['北京', '上海', '广州', '深圳', '成都']
  const categories = [
    { category: '基础装修', basePrices: { '北京': 850, '上海': 820, '广州': 680, '深圳': 750, '成都': 580 } },
    { category: '主材', basePrices: { '北京': 650, '上海': 630, '广州': 520, '深圳': 580, '成都': 450 } },
    { category: '家具', basePrices: { '北京': 500, '上海': 480, '广州': 400, '深圳': 460, '成都': 360 } },
    { category: '软装', basePrices: { '北京': 300, '上海': 280, '广州': 230, '深圳': 260, '成都': 200 } },
    { category: '设计费', basePrices: { '北京': 200, '上海': 180, '广州': 150, '深圳': 170, '成都': 120 } },
  ]

  for (const cat of categories) {
    for (const city of cities) {
      insertCityPrice.run(uuidv4(), city, cat.category, cat.basePrices[city as keyof typeof cat.basePrices], '元/㎡')
    }
  }
}

seedData()

export default db
