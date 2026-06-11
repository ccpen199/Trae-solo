import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'app.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      company TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('buyer', 'factory', 'supplier', 'designer', 'admin')),
      verified INTEGER DEFAULT 0,
      avatar TEXT DEFAULT '',
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('factory', 'accessory_supplier', 'designer')),
      location TEXT NOT NULL,
      credit_score INTEGER DEFAULT 0,
      fulfillment_rate REAL DEFAULT 0,
      complaint_rate REAL DEFAULT 0,
      qc_pass_rate REAL DEFAULT 0,
      crafts TEXT DEFAULT '[]',
      capacity_current INTEGER DEFAULT 0,
      capacity_max INTEGER DEFAULT 0,
      certifications TEXT DEFAULT '[]',
      description TEXT DEFAULT '',
      is_online INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS procurement_requests (
      id TEXT PRIMARY KEY,
      publisher_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      craft_type TEXT DEFAULT '[]',
      quantity INTEGER NOT NULL,
      unit TEXT DEFAULT '件',
      delivery_date TEXT NOT NULL,
      budget_min REAL,
      budget_max REAL,
      location TEXT DEFAULT '',
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'matched', 'closed')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS processing_orders (
      id TEXT PRIMARY KEY,
      publisher_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      craft_type TEXT DEFAULT '[]',
      quantity INTEGER NOT NULL,
      deadline TEXT NOT NULL,
      factory_type TEXT DEFAULT '',
      location TEXT DEFAULT '',
      budget_min REAL,
      budget_max REAL,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'completed')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accessory_supplies (
      id TEXT PRIMARY KEY,
      supplier_id TEXT NOT NULL REFERENCES suppliers(id),
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      material TEXT DEFAULT '',
      specs TEXT DEFAULT '',
      price REAL NOT NULL,
      unit TEXT DEFAULT '个',
      min_order INTEGER DEFAULT 1,
      stock INTEGER DEFAULT 0,
      location TEXT DEFAULT '',
      images TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      buyer_id TEXT NOT NULL REFERENCES users(id),
      supplier_id TEXT NOT NULL REFERENCES suppliers(id),
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('procurement', 'processing')),
      amount REAL NOT NULL,
      deposit_amount REAL DEFAULT 0,
      deposit_status TEXT DEFAULT 'unpaid' CHECK(deposit_status IN ('unpaid', 'paid', 'refunded')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'deposit_paid', 'in_production', 'quality_check', 'shipped', 'completed', 'disputed')),
      logistics TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS news_articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('industry', 'policy', 'report')),
      summary TEXT DEFAULT '',
      content TEXT DEFAULT '',
      publish_date TEXT NOT NULL,
      source TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS region_data (
      region TEXT PRIMARY KEY,
      factory_count INTEGER DEFAULT 0,
      capacity_utilization REAL DEFAULT 0,
      order_volume INTEGER DEFAULT 0,
      supply_demand_ratio REAL DEFAULT 1,
      main_crafts TEXT DEFAULT '[]',
      top_suppliers TEXT DEFAULT '[]'
    );

    CREATE INDEX IF NOT EXISTS idx_suppliers_user ON suppliers(user_id);
    CREATE INDEX IF NOT EXISTS idx_procurement_publisher ON procurement_requests(publisher_id);
    CREATE INDEX IF NOT EXISTS idx_processing_publisher ON processing_orders(publisher_id);
    CREATE INDEX IF NOT EXISTS idx_accessory_supplier ON accessory_supplies(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_supplier ON orders(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_news_category ON news_articles(category);
  `)
}

function seedUsers(): void {
  const count = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c
  if (count > 0) return

  const stmt = db.prepare(
    `INSERT INTO users (id, name, phone, company, role, verified, avatar, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const users = [
    { id: uuidv4(), name: '张伟明', phone: '13800001001', company: '浙江羊毛衫贸易集团', role: 'buyer', verified: 1 },
    { id: uuidv4(), name: '李秀英', phone: '13800001002', company: '濮院鑫达针织厂', role: 'factory', verified: 1 },
    { id: uuidv4(), name: '王建国', phone: '13800001003', company: '东莞大朗毛衣加工厂', role: 'factory', verified: 1 },
    { id: uuidv4(), name: '陈美华', phone: '13800001004', company: '汕头辅料供应链有限公司', role: 'supplier', verified: 1 },
    { id: uuidv4(), name: '赵志强', phone: '13800001005', company: '苏州绣花设计工作室', role: 'designer', verified: 1 },
    { id: uuidv4(), name: '刘晓燕', phone: '13800001006', company: '杭州锦程服饰采购部', role: 'buyer', verified: 1 },
    { id: uuidv4(), name: '黄德福', phone: '13800001007', company: '宁波针织印染厂', role: 'factory', verified: 0 },
    { id: uuidv4(), name: '周丽萍', phone: '13800001008', company: '绍兴纺织辅料批发商行', role: 'supplier', verified: 1 },
  ]

  const insertMany = db.transaction((rows: typeof users) => {
    for (const u of rows) {
      stmt.run(u.id, u.name, u.phone, u.company, u.role, u.verified, '', '123456')
    }
  })
  insertMany(users)
}

function seedSuppliers(): void {
  const count = (db.prepare('SELECT COUNT(*) as c FROM suppliers').get() as { c: number }).c
  if (count > 0) return

  const users = db.prepare('SELECT id, role FROM users').all() as { id: string; role: string }[]
  const factoryUsers = users.filter(u => u.role === 'factory')
  const supplierUsers = users.filter(u => u.role === 'supplier')
  const designerUsers = users.filter(u => u.role === 'designer')

  const stmt = db.prepare(
    `INSERT INTO suppliers (id, user_id, name, type, location, credit_score, fulfillment_rate, complaint_rate, qc_pass_rate, crafts, capacity_current, capacity_max, certifications, description, is_online) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const suppliers = [
    {
      id: uuidv4(), user_id: factoryUsers[0]?.id ?? '', name: '濮院鑫达针织厂', type: 'factory',
      location: '嘉兴濮院', credit_score: 92, fulfillment_rate: 96.5, complaint_rate: 1.2, qc_pass_rate: 98.3,
      crafts: JSON.stringify(['横机编织', '电脑提花', '缝盘']),
      capacity_current: 7200, capacity_max: 10000,
      certifications: JSON.stringify(['ISO9001', 'OEKO-TEX']),
      description: '嘉兴濮院老牌针织工厂，专注羊毛衫生产20年，拥有先进电脑横机设备60台，日产能稳定。', is_online: 1
    },
    {
      id: uuidv4(), user_id: factoryUsers[1]?.id ?? '', name: '东莞大朗毛衣加工厂', type: 'factory',
      location: '东莞大朗', credit_score: 88, fulfillment_rate: 94.2, complaint_rate: 2.1, qc_pass_rate: 96.8,
      crafts: JSON.stringify(['圆机编织', '手摇编织', '绣花']),
      capacity_current: 8500, capacity_max: 12000,
      certifications: JSON.stringify(['ISO9001']),
      description: '东莞大朗大型毛衣加工企业，圆机编织工艺成熟，擅长复杂花型，长期服务国内外品牌客户。', is_online: 1
    },
    {
      id: uuidv4(), user_id: factoryUsers[2]?.id ?? '', name: '宁波针织印染厂', type: 'factory',
      location: '宁波', credit_score: 75, fulfillment_rate: 88.5, complaint_rate: 3.8, qc_pass_rate: 93.2,
      crafts: JSON.stringify(['染色', '印花', '圆机编织']),
      capacity_current: 5000, capacity_max: 8000,
      certifications: JSON.stringify([]),
      description: '宁波本地印染一体化工厂，提供从编织到染色的全流程服务，价格有竞争力。', is_online: 0
    },
    {
      id: uuidv4(), user_id: supplierUsers[0]?.id ?? '', name: '汕头辅料供应链有限公司', type: 'accessory_supplier',
      location: '汕头', credit_score: 85, fulfillment_rate: 92.0, complaint_rate: 2.5, qc_pass_rate: 95.0,
      crafts: JSON.stringify([]),
      capacity_current: 0, capacity_max: 0,
      certifications: JSON.stringify(['ISO14001']),
      description: '汕头大型辅料供应商，主营纽扣、拉链、织带等服装辅料，品类齐全，库存充足。', is_online: 1
    },
    {
      id: uuidv4(), user_id: supplierUsers[1]?.id ?? '', name: '绍兴纺织辅料批发商行', type: 'accessory_supplier',
      location: '绍兴', credit_score: 80, fulfillment_rate: 90.0, complaint_rate: 3.0, qc_pass_rate: 94.0,
      crafts: JSON.stringify([]),
      capacity_current: 0, capacity_max: 0,
      certifications: JSON.stringify([]),
      description: '绍兴轻纺城资深辅料批发商，纱线、衬布、花边品类丰富，支持小批量订购。', is_online: 1
    },
    {
      id: uuidv4(), user_id: designerUsers[0]?.id ?? '', name: '苏州绣花设计工作室', type: 'designer',
      location: '苏州', credit_score: 90, fulfillment_rate: 95.0, complaint_rate: 0.8, qc_pass_rate: 99.0,
      crafts: JSON.stringify(['绣花', '电脑提花']),
      capacity_current: 2000, capacity_max: 3000,
      certifications: JSON.stringify([]),
      description: '苏州高端绣花设计工作室，擅长苏绣与电脑提花融合设计，服务中高端品牌客户。', is_online: 1
    },
  ]

  const insertMany = db.transaction((rows: typeof suppliers) => {
    for (const s of rows) {
      stmt.run(s.id, s.user_id, s.name, s.type, s.location, s.credit_score, s.fulfillment_rate, s.complaint_rate, s.qc_pass_rate, s.crafts, s.capacity_current, s.capacity_max, s.certifications, s.description, s.is_online)
    }
  })
  insertMany(suppliers)
}

function seedProcurementRequests(): void {
  const count = (db.prepare('SELECT COUNT(*) as c FROM procurement_requests').get() as { c: number }).c
  if (count > 0) return

  const buyers = db.prepare("SELECT id FROM users WHERE role = 'buyer'").all() as { id: string }[]
  if (buyers.length === 0) return

  const stmt = db.prepare(
    `INSERT INTO procurement_requests (id, publisher_id, title, category, craft_type, quantity, unit, delivery_date, budget_min, budget_max, location, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const items = [
    { publisher_id: buyers[0].id, title: '紧急采购5000件羊毛混纺套头衫', category: '混纺毛衫', craft_type: JSON.stringify(['横机编织', '缝盘']), quantity: 5000, unit: '件', delivery_date: '2026-08-15', budget_min: 85, budget_max: 120, location: '嘉兴濮院', description: '含50%羊毛+50%腈纶，12针工艺，需要提供样品确认后量产。颜色：深灰、酒红、藏青三色各约1600件。', status: 'open' },
    { publisher_id: buyers[0].id, title: '采购羊绒圆领开衫3000件', category: '羊绒衫', craft_type: JSON.stringify(['横机编织', '电脑提花']), quantity: 3000, unit: '件', delivery_date: '2026-09-01', budget_min: 200, budget_max: 350, location: '杭州', description: '100%山羊绒，14针精细编织，需提供质检报告。适合中高端女装品牌。', status: 'open' },
    { publisher_id: buyers[1]?.id ?? buyers[0].id, title: '批量采购针织衫8000件', category: '针织衫', craft_type: JSON.stringify(['圆机编织', '印花']), quantity: 8000, unit: '件', delivery_date: '2026-07-20', budget_min: 45, budget_max: 65, location: '东莞大朗', description: '棉混纺面料，圆机坯布+印花工艺，夏季薄款，多色可选。需支持小批量试产。', status: 'matched' },
    { publisher_id: buyers[0].id, title: '采购提花羊毛衫2000件', category: '羊毛衫', craft_type: JSON.stringify(['电脑提花', '横机编织']), quantity: 2000, unit: '件', delivery_date: '2026-10-10', budget_min: 130, budget_max: 180, location: '嘉兴濮院', description: '北欧风提花图案，12针工艺，需要提花设计能力强和样品确认快速的工厂合作。', status: 'open' },
    { publisher_id: buyers[1]?.id ?? buyers[0].id, title: '采购童装针织开衫6000件', category: '开衫', craft_type: JSON.stringify(['横机编织']), quantity: 6000, unit: '件', delivery_date: '2026-08-30', budget_min: 35, budget_max: 55, location: '苏州', description: '儿童款开衫，3-8岁尺码段，A类安全标准，需提供检测报告。柔软亲肤面料优先。', status: 'open' },
    { publisher_id: buyers[0].id, title: '采购高端羊绒套头衫1500件', category: '羊绒衫', craft_type: JSON.stringify(['横机编织']), quantity: 1500, unit: '件', delivery_date: '2026-11-01', budget_min: 280, budget_max: 420, location: '桐乡', description: '16针超细羊绒，轻奢定位，含绒量95%以上。需要工厂有高端品牌代工经验。', status: 'open' },
    { publisher_id: buyers[1]?.id ?? buyers[0].id, title: '采购亚麻混纺针织衫4000件', category: '针织衫', craft_type: JSON.stringify(['圆机编织', '染色']), quantity: 4000, unit: '件', delivery_date: '2026-07-15', budget_min: 55, budget_max: 80, location: '宁波', description: '亚麻/棉混纺，春夏款，透气舒适，适合商务休闲场景。需提供色牢度检测报告。', status: 'closed' },
    { publisher_id: buyers[0].id, title: '采购功能性运动针织衫3000件', category: '针织衫', craft_type: JSON.stringify(['圆机编织', '印花']), quantity: 3000, unit: '件', delivery_date: '2026-09-15', budget_min: 60, budget_max: 90, location: '汕头', description: '速干排汗面料，运动系列，需要功能性面料加工经验。', status: 'open' },
    { publisher_id: buyers[1]?.id ?? buyers[0].id, title: '采购手工编织毛衣1000件', category: '羊毛衫', craft_type: JSON.stringify(['手摇编织', '绣花']), quantity: 1000, unit: '件', delivery_date: '2026-12-01', budget_min: 180, budget_max: 260, location: '苏州', description: '手工编织质感，融入刺绣工艺，文艺风格定位，小批量多款。', status: 'open' },
    { publisher_id: buyers[0].id, title: '采购大码羊毛衫2500件', category: '羊毛衫', craft_type: JSON.stringify(['横机编织', '缝盘']), quantity: 2500, unit: '件', delivery_date: '2026-08-20', budget_min: 90, budget_max: 130, location: '东莞大朗', description: 'XL-4XL大码羊毛衫，需要大码版型经验丰富的工厂，含羊毛60%以上。', status: 'matched' },
  ]

  const insertMany = db.transaction((rows: typeof items) => {
    for (const r of rows) {
      stmt.run(uuidv4(), r.publisher_id, r.title, r.category, r.craft_type, r.quantity, r.unit, r.delivery_date, r.budget_min, r.budget_max, r.location, r.description, r.status)
    }
  })
  insertMany(items)
}

function seedProcessingOrders(): void {
  const count = (db.prepare('SELECT COUNT(*) as c FROM processing_orders').get() as { c: number }).c
  if (count > 0) return

  const buyers = db.prepare("SELECT id FROM users WHERE role IN ('buyer', 'designer')").all() as { id: string }[]
  if (buyers.length === 0) return

  const stmt = db.prepare(
    `INSERT INTO processing_orders (id, publisher_id, title, craft_type, quantity, deadline, factory_type, location, budget_min, budget_max, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const items = [
    { publisher_id: buyers[0].id, title: '羊毛衫横机编织加工', craft_type: JSON.stringify(['横机编织', '缝盘']), quantity: 5000, deadline: '2026-08-01', factory_type: '横机厂', location: '嘉兴濮院', budget_min: 25, budget_max: 35, status: 'open' },
    { publisher_id: buyers[0].id, title: '提花针织衫电脑提花加工', craft_type: JSON.stringify(['电脑提花']), quantity: 3000, deadline: '2026-09-15', factory_type: '提花厂', location: '桐乡', budget_min: 30, budget_max: 45, status: 'open' },
    { publisher_id: buyers[1]?.id ?? buyers[0].id, title: '圆机坯布印花加工', craft_type: JSON.stringify(['圆机编织', '印花']), quantity: 8000, deadline: '2026-07-30', factory_type: '圆机厂', location: '东莞大朗', budget_min: 15, budget_max: 22, status: 'in_progress' },
    { publisher_id: buyers[0].id, title: '羊绒衫精细编织加工', craft_type: JSON.stringify(['横机编织']), quantity: 1500, deadline: '2026-10-20', factory_type: '横机厂', location: '杭州', budget_min: 40, budget_max: 60, status: 'open' },
    { publisher_id: buyers[1]?.id ?? buyers[0].id, title: '针织衫染色后整理加工', craft_type: JSON.stringify(['染色']), quantity: 6000, deadline: '2026-08-10', factory_type: '印染厂', location: '宁波', budget_min: 10, budget_max: 18, status: 'open' },
    { publisher_id: buyers[0].id, title: '毛衣绣花加工订单', craft_type: JSON.stringify(['绣花']), quantity: 2000, deadline: '2026-09-01', factory_type: '绣花厂', location: '苏州', budget_min: 12, budget_max: 20, status: 'completed' },
    { publisher_id: buyers[1]?.id ?? buyers[0].id, title: '手摇编织复古毛衣加工', craft_type: JSON.stringify(['手摇编织', '绣花']), quantity: 800, deadline: '2026-11-15', factory_type: '手编厂', location: '苏州', budget_min: 50, budget_max: 75, status: 'open' },
    { publisher_id: buyers[0].id, title: '混纺毛衫整单加工', craft_type: JSON.stringify(['横机编织', '缝盘', '染色']), quantity: 4000, deadline: '2026-08-25', factory_type: '全能厂', location: '嘉兴濮院', budget_min: 35, budget_max: 50, status: 'open' },
  ]

  const insertMany = db.transaction((rows: typeof items) => {
    for (const r of rows) {
      stmt.run(uuidv4(), r.publisher_id, r.title, r.craft_type, r.quantity, r.deadline, r.factory_type, r.location, r.budget_min, r.budget_max, r.status)
    }
  })
  insertMany(items)
}

function seedAccessorySupplies(): void {
  const count = (db.prepare('SELECT COUNT(*) as c FROM accessory_supplies').get() as { c: number }).c
  if (count > 0) return

  const suppliers = db.prepare("SELECT id, location FROM suppliers WHERE type = 'accessory_supplier'").all() as { id: string; location: string }[]
  if (suppliers.length === 0) return

  const stmt = db.prepare(
    `INSERT INTO accessory_supplies (id, supplier_id, name, category, material, specs, price, unit, min_order, stock, location, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const items = [
    { supplier_id: suppliers[0].id, name: '高端树脂纽扣', category: '纽扣', material: '树脂', specs: '20mm/四孔', price: 0.35, unit: '个', min_order: 5000, stock: 200000, location: suppliers[0].location, images: JSON.stringify([]) },
    { supplier_id: suppliers[0].id, name: 'YKK隐形拉链', category: '拉链', material: '尼龙', specs: '55cm/隐形', price: 3.20, unit: '条', min_order: 1000, stock: 50000, location: suppliers[0].location, images: JSON.stringify([]) },
    { supplier_id: suppliers[0].id, name: '金属装饰拉链', category: '拉链', material: '铜合金', specs: '60cm/开口', price: 5.80, unit: '条', min_order: 500, stock: 20000, location: suppliers[0].location, images: JSON.stringify([]) },
    { supplier_id: suppliers[0].id, name: '涤纶织带', category: '织带', material: '涤纶', specs: '20mm宽', price: 0.12, unit: '米', min_order: 5000, stock: 100000, location: suppliers[0].location, images: JSON.stringify([]) },
    { supplier_id: suppliers[0].id, name: '水洗标标签', category: '标签', material: '涤纶缎面', specs: '30x50mm', price: 0.05, unit: '个', min_order: 10000, stock: 500000, location: suppliers[0].location, images: JSON.stringify([]) },
    { supplier_id: suppliers[0].id, name: '真牛角纽扣', category: '纽扣', material: '天然牛角', specs: '22mm/两孔', price: 1.50, unit: '个', min_order: 2000, stock: 30000, location: suppliers[0].location, images: JSON.stringify([]) },
    { supplier_id: suppliers[1]?.id ?? suppliers[0].id, name: '70%羊毛纱线', category: '纱线', material: '羊毛/腈纶混纺', specs: '2/32Nm', price: 68.00, unit: 'kg', min_order: 50, stock: 8000, location: suppliers[1]?.location ?? suppliers[0].location, images: JSON.stringify([]) },
    { supplier_id: suppliers[1]?.id ?? suppliers[0].id, name: '纯棉衬布', category: '衬布', material: '纯棉', specs: '90cm宽', price: 8.50, unit: '米', min_order: 200, stock: 15000, location: suppliers[1]?.location ?? suppliers[0].location, images: JSON.stringify([]) },
    { supplier_id: suppliers[1]?.id ?? suppliers[0].id, name: '刺绣花边', category: '花边', material: '涤纶', specs: '15mm宽', price: 1.20, unit: '米', min_order: 1000, stock: 30000, location: suppliers[1]?.location ?? suppliers[0].location, images: JSON.stringify([]) },
    { supplier_id: suppliers[1]?.id ?? suppliers[0].id, name: '缝纫线（402）', category: '缝纫线', material: '涤纶', specs: '40S/2', price: 2.80, unit: '轴', min_order: 100, stock: 50000, location: suppliers[1]?.location ?? suppliers[0].location, images: JSON.stringify([]) },
    { supplier_id: suppliers[1]?.id ?? suppliers[0].id, name: '100%山羊绒纱线', category: '纱线', material: '山羊绒', specs: '2/26Nm', price: 380.00, unit: 'kg', min_order: 10, stock: 2000, location: suppliers[1]?.location ?? suppliers[0].location, images: JSON.stringify([]) },
    { supplier_id: suppliers[0].id, name: '贝壳纽扣', category: '纽扣', material: '天然贝壳', specs: '18mm/四孔', price: 0.85, unit: '个', min_order: 3000, stock: 80000, location: suppliers[0].location, images: JSON.stringify([]) },
  ]

  const insertMany = db.transaction((rows: typeof items) => {
    for (const a of rows) {
      stmt.run(uuidv4(), a.supplier_id, a.name, a.category, a.material, a.specs, a.price, a.unit, a.min_order, a.stock, a.location, a.images)
    }
  })
  insertMany(items)
}

function seedOrders(): void {
  const count = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number }).c
  if (count > 0) return

  const buyers = db.prepare("SELECT id FROM users WHERE role = 'buyer'").all() as { id: string }[]
  const supplierRows = db.prepare('SELECT id FROM suppliers').all() as { id: string }[]
  if (buyers.length === 0 || supplierRows.length === 0) return

  const stmt = db.prepare(
    `INSERT INTO orders (id, buyer_id, supplier_id, title, type, amount, deposit_amount, deposit_status, status, logistics) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const orders = [
    { buyer_id: buyers[0].id, supplier_id: supplierRows[0].id, title: '羊毛衫批量生产订单', type: 'procurement', amount: 520000, deposit_amount: 156000, deposit_status: 'paid', status: 'in_production', logistics: JSON.stringify([{ status: 'deposit_paid', location: '嘉兴濮院', timestamp: '2026-05-20 10:00', description: '定金已支付，订单确认' }, { status: 'in_production', location: '嘉兴濮院', timestamp: '2026-05-25 09:00', description: '已进入生产阶段，预计7月底完成' }]) },
    { buyer_id: buyers[0].id, supplier_id: supplierRows[1].id, title: '针织衫加工订单', type: 'processing', amount: 380000, deposit_amount: 114000, deposit_status: 'paid', status: 'quality_check', logistics: JSON.stringify([{ status: 'deposit_paid', location: '东莞大朗', timestamp: '2026-04-10 14:30', description: '定金已支付' }, { status: 'in_production', location: '东莞大朗', timestamp: '2026-04-15 08:00', description: '开始生产' }, { status: 'quality_check', location: '东莞大朗', timestamp: '2026-06-05 16:00', description: '生产完成，质检中' }]) },
    { buyer_id: buyers[1]?.id ?? buyers[0].id, supplier_id: supplierRows[0].id, title: '提花毛衣加工订单', type: 'procurement', amount: 285000, deposit_amount: 85500, deposit_status: 'paid', status: 'deposit_paid', logistics: JSON.stringify([{ status: 'deposit_paid', location: '嘉兴濮院', timestamp: '2026-06-01 11:00', description: '定金已支付，等待排产' }]) },
    { buyer_id: buyers[0].id, supplier_id: supplierRows[3].id, title: '辅料纽扣拉链采购订单', type: 'procurement', amount: 45000, deposit_amount: 13500, deposit_status: 'paid', status: 'shipped', logistics: JSON.stringify([{ status: 'deposit_paid', location: '汕头', timestamp: '2026-05-15 09:00', description: '定金已支付' }, { status: 'shipped', location: '汕头→嘉兴', timestamp: '2026-05-28 14:00', description: '已发货，预计6月3日到达' }]) },
    { buyer_id: buyers[1]?.id ?? buyers[0].id, supplier_id: supplierRows[2].id, title: '印染加工订单', type: 'processing', amount: 168000, deposit_amount: 0, deposit_status: 'unpaid', status: 'pending', logistics: JSON.stringify([]) },
    { buyer_id: buyers[0].id, supplier_id: supplierRows[5].id, title: '绣花加工订单', type: 'processing', amount: 96000, deposit_amount: 28800, deposit_status: 'refunded', status: 'disputed', logistics: JSON.stringify([{ status: 'deposit_paid', location: '苏州', timestamp: '2026-03-10 10:00', description: '定金已支付' }, { status: 'disputed', location: '苏州', timestamp: '2026-04-20 15:00', description: '交货质量问题，进入争议处理' }]) },
  ]

  const insertMany = db.transaction((rows: typeof orders) => {
    for (const o of rows) {
      stmt.run(uuidv4(), o.buyer_id, o.supplier_id, o.title, o.type, o.amount, o.deposit_amount, o.deposit_status, o.status, o.logistics)
    }
  })
  insertMany(orders)
}

function seedNewsArticles(): void {
  const count = (db.prepare('SELECT COUNT(*) as c FROM news_articles').get() as { c: number }).c
  if (count > 0) return

  const stmt = db.prepare(
    `INSERT INTO news_articles (id, title, category, summary, content, publish_date, source, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const articles = [
    { title: '2026年春夏季毛衫流行趋势预测', category: 'industry', summary: '今年春夏毛衫市场呈现多元化趋势，轻薄透气、功能性面料和可持续时尚成为三大关键词。', content: '据中国针织工业协会最新发布的趋势报告显示，2026年春夏季毛衫市场将呈现以下趋势：1）轻薄化——14针以上精细编织需求增长；2）功能性——速干排汗、抗菌防螨面料受追捧；3）可持续——再生羊毛、有机棉等环保材料应用扩大。', publish_date: '2026-06-01', source: '中国针织工业协会', tags: JSON.stringify(['趋势', '春夏', '毛衫']) },
    { title: '工信部发布纺织行业数字化转型指导意见', category: 'policy', summary: '工信部近日发布指导意见，推动纺织服装行业加快数字化转型，鼓励中小企业上云用数。', content: '工业和信息化部发布《关于推动纺织行业数字化转型的指导意见》，明确到2028年，规模以上纺织企业数字化研发设计工具普及率达到75%，关键工序数控化率达到60%。文件提出加大对中小纺织企业数字化改造的财政支持力度，鼓励产业集群众创空间建设。', publish_date: '2026-05-28', source: '工业和信息化部', tags: JSON.stringify(['政策', '数字化转型', '纺织']) },
    { title: '濮院毛衫市场一季度出口额同比增长12%', category: 'industry', summary: '嘉兴濮院毛衫市场2026年一季度出口额达到18.5亿元，同比增长12%，欧美市场回暖明显。', content: '据嘉兴海关数据，濮院毛衫市场2026年一季度实现出口额18.5亿元，同比增长12%。其中，对欧盟出口增长15%，对美国出口增长10%，RCEP成员国出口增长18%。毛衫品类中，羊绒衫和混纺毛衫增长最为显著，分别增长20%和16%。', publish_date: '2026-05-20', source: '嘉兴海关', tags: JSON.stringify(['濮院', '出口', '增长']) },
    { title: '大朗毛织产业加速智能化升级', category: 'industry', summary: '东莞大朗镇持续推进毛织产业智能化改造，已有超过200家工厂引入电脑横机。', content: '东莞市大朗镇作为全国毛织重镇，近年来加速推进产业智能化升级。截至目前，全镇已有超过200家毛织企业引入电脑横机设备，智能化设备占比达到65%。镇政府还设立了5000万元的智能化改造专项补贴基金，支持中小企业设备更新。', publish_date: '2026-05-15', source: '东莞日报', tags: JSON.stringify(['大朗', '智能化', '升级']) },
    { title: '国务院关于促进纺织服装产业高质量发展的通知', category: 'policy', summary: '国务院发文支持纺织服装产业高质量发展，强调品牌建设、绿色制造和供应链协同。', content: '国务院发布《关于促进纺织服装产业高质量发展的通知》，提出到2030年培育50个具有国际竞争力的纺织服装品牌，推动绿色制造体系建设，加快供应链数字化协同。通知明确支持产业集群数字化转型示范区建设，加大对原创设计知识产权保护力度。', publish_date: '2026-05-10', source: '国务院', tags: JSON.stringify(['政策', '高质量发展', '品牌']) },
    { title: '2026年羊绒原料价格走势分析', category: 'report', summary: '受气候和养殖成本影响，2026年羊绒原料价格预计上涨8%-12%，中高端毛衫成本承压。', content: '据中国畜产品流通协会数据，2026年羊绒原料价格持续走高。内蒙古白绒原绒收购价已达420元/公斤，较去年同期上涨10%。分析认为，受全球气候变暖影响山羊绒产量下降，加之养殖成本上升，预计全年羊绒价格涨幅在8%-12%之间。建议下游企业提前备货锁定成本。', publish_date: '2026-05-05', source: '中国畜产品流通协会', tags: JSON.stringify(['羊绒', '价格', '分析']) },
    { title: '绍兴轻纺城辅料市场新品发布季', category: 'industry', summary: '绍兴轻纺城2026年辅料新品发布季启动，千余家供应商参展，环保辅料成最大亮点。', content: '第28届绍兴轻纺城辅料新品发布季正式启动，吸引来自全国各地的1200余家辅料供应商参展。今年展会上，环保型辅料成为最大亮点——可降解纽扣、再生纱线、无甲醛衬布等绿色产品占比超过30%。展会将持续三天，预计到场采购商超过5万人次。', publish_date: '2026-04-28', source: '绍兴日报', tags: JSON.stringify(['辅料', '新品', '绍兴']) },
    { title: '全球针织品贸易格局变化与应对策略', category: 'report', summary: '受地缘政治和供应链重组影响，全球针织品贸易格局正在发生深刻变化，企业需灵活应对。', content: '中国纺织工业联合会发布《全球针织品贸易格局变化与应对策略》研究报告。报告指出，2025年全球针织品贸易总额达3800亿美元，其中中国占比32%。随着东南亚国家纺织产能提升和近岸外包趋势加速，中国针织品出口面临新的竞争压力。建议企业加强品牌建设、提升产品附加值、拓展新兴市场。', publish_date: '2026-04-20', source: '中国纺织工业联合会', tags: JSON.stringify(['贸易', '全球', '策略']) },
  ]

  const insertMany = db.transaction((rows: typeof articles) => {
    for (const a of rows) {
      stmt.run(uuidv4(), a.title, a.category, a.summary, a.content, a.publish_date, a.source, a.tags)
    }
  })
  insertMany(articles)
}

function seedRegionData(): void {
  const count = (db.prepare('SELECT COUNT(*) as c FROM region_data').get() as { c: number }).c
  if (count > 0) return

  const stmt = db.prepare(
    `INSERT INTO region_data (region, factory_count, capacity_utilization, order_volume, supply_demand_ratio, main_crafts, top_suppliers) VALUES (?, ?, ?, ?, ?, ?, ?)`
  )

  const regions = [
    { region: '嘉兴濮院', factory_count: 3200, capacity_utilization: 0.82, order_volume: 15600, supply_demand_ratio: 1.15, main_crafts: JSON.stringify(['横机编织', '电脑提花', '缝盘']), top_suppliers: JSON.stringify(['濮院鑫达针织厂', '濮院恒丰毛纺', '濮院锦程针织']) },
    { region: '东莞大朗', factory_count: 2800, capacity_utilization: 0.78, order_volume: 12800, supply_demand_ratio: 1.08, main_crafts: JSON.stringify(['圆机编织', '手摇编织', '绣花']), top_suppliers: JSON.stringify(['大朗毛衣加工厂', '大朗利丰针织', '大朗华兴毛织']) },
    { region: '汕头', factory_count: 1500, capacity_utilization: 0.65, order_volume: 6800, supply_demand_ratio: 1.25, main_crafts: JSON.stringify(['印花', '染色', '绣花']), top_suppliers: JSON.stringify(['汕头辅料供应链', '汕头伟达印染', '汕头创美纺织']) },
    { region: '苏州', factory_count: 980, capacity_utilization: 0.72, order_volume: 4500, supply_demand_ratio: 0.95, main_crafts: JSON.stringify(['绣花', '电脑提花']), top_suppliers: JSON.stringify(['苏州绣花设计工作室', '苏绣世家', '苏州锦绣针织']) },
    { region: '杭州', factory_count: 1200, capacity_utilization: 0.76, order_volume: 5800, supply_demand_ratio: 1.05, main_crafts: JSON.stringify(['横机编织', '圆机编织']), top_suppliers: JSON.stringify(['杭州锦程服饰', '杭州恒达针织', '杭州盛世毛纺']) },
    { region: '宁波', factory_count: 860, capacity_utilization: 0.68, order_volume: 3200, supply_demand_ratio: 0.88, main_crafts: JSON.stringify(['染色', '印花', '圆机编织']), top_suppliers: JSON.stringify(['宁波针织印染厂', '宁波瑞丰纺织', '宁波海天毛纺']) },
    { region: '绍兴', factory_count: 1600, capacity_utilization: 0.71, order_volume: 7500, supply_demand_ratio: 1.18, main_crafts: JSON.stringify(['染色', '印花']), top_suppliers: JSON.stringify(['绍兴纺织辅料批发商行', '绍兴轻纺城集团', '绍兴华联纺织']) },
    { region: '桐乡', factory_count: 1100, capacity_utilization: 0.80, order_volume: 6200, supply_demand_ratio: 1.10, main_crafts: JSON.stringify(['电脑提花', '横机编织', '缝盘']), top_suppliers: JSON.stringify(['桐乡盛世针织', '桐乡佳美毛纺', '桐乡天成织造']) },
  ]

  const insertMany = db.transaction((rows: typeof regions) => {
    for (const r of rows) {
      stmt.run(r.region, r.factory_count, r.capacity_utilization, r.order_volume, r.supply_demand_ratio, r.main_crafts, r.top_suppliers)
    }
  })
  insertMany(regions)
}

export function seedDatabase(): void {
  seedUsers()
  seedSuppliers()
  seedProcurementRequests()
  seedProcessingOrders()
  seedAccessorySupplies()
  seedOrders()
  seedNewsArticles()
  seedRegionData()
}

export { db }
