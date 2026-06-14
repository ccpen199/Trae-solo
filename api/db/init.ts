import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = path.join(__dirname, 'recycle.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initTables(db)
    if (needsSeed(db)) {
      seedData(db)
    }
  }
  return db
}

function initTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL UNIQUE,
      nickname TEXT,
      avatar TEXT,
      total_recycled INTEGER DEFAULT 0,
      total_earnings REAL DEFAULT 0,
      charity_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      detail TEXT,
      latitude REAL,
      longitude REAL,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      category TEXT NOT NULL CHECK(category IN ('clothing', 'book', 'phone')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'dispatched', 'picked_up', 'inspecting', 'priced', 'confirmed', 'settled', 'donated', 'rejected')),
      estimate_price REAL,
      final_price REAL,
      address_id TEXT REFERENCES addresses(id),
      time_slot TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      brand TEXT,
      model TEXT,
      condition TEXT NOT NULL,
      weight REAL
    );

    CREATE TABLE IF NOT EXISTS inspections (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'ai_screening', 'manual_check', 'completed', 'rejected')),
      assignee TEXT,
      ai_result TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inspection_steps (
      id TEXT PRIMARY KEY,
      inspection_id TEXT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
      step_order INTEGER NOT NULL,
      name TEXT NOT NULL,
      passed INTEGER DEFAULT NULL,
      notes TEXT,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS inspection_images (
      id TEXT PRIMARY KEY,
      inspection_id TEXT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      type TEXT,
      ai_analysis TEXT
    );

    CREATE TABLE IF NOT EXISTS pricing_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('clothing', 'book', 'phone')),
      type TEXT NOT NULL CHECK(type IN ('weight', 'model', 'market')),
      price_modifier REAL NOT NULL,
      enabled INTEGER DEFAULT 1,
      priority INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pricing_conditions (
      id TEXT PRIMARY KEY,
      rule_id TEXT NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,
      field TEXT NOT NULL,
      operator TEXT NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      amount REAL NOT NULL,
      method TEXT NOT NULL CHECK(method IN ('wechat', 'bank')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
      account TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS logistics_orders (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      courier TEXT,
      provider TEXT NOT NULL CHECK(provider IN ('sf', 'jd')),
      status TEXT NOT NULL DEFAULT 'dispatched' CHECK(status IN ('dispatched', 'picking_up', 'picked_up', 'in_transit', 'delivered')),
      tracking_no TEXT,
      pickup_address TEXT,
      pickup_time_slot TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS charity_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      total_raised REAL DEFAULT 0,
      target_amount REAL NOT NULL,
      start_date TEXT,
      end_date TEXT
    );

    CREATE TABLE IF NOT EXISTS charity_donations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      order_id TEXT NOT NULL REFERENCES orders(id),
      project_id TEXT NOT NULL REFERENCES charity_projects(id),
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
      certificate TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS processors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      license TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'initial_review', 'final_review', 'approved', 'rejected')),
      contact TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS processor_audits (
      id TEXT PRIMARY KEY,
      processor_id TEXT NOT NULL REFERENCES processors(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      reviewer TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)
}

function needsSeed(db: Database.Database): boolean {
  const row = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  return row.count === 0
}

function seedData(db: Database.Database): void {
  const insert = db.transaction(() => {
    const userIds: string[] = []
    const nicknames = ['张伟', '李娜', '王芳', '刘洋', '陈静', '杨磊', '赵敏', '黄强', '周丽', '吴涛', '徐婷', '孙超']
    const phones = ['13800138001', '13800138002', '13800138003', '13800138004', '13800138005', '13800138006', '13800138007', '13800138008', '13800138009', '13800138010', '13800138011', '13800138012']
    const avatars = [
      'https://img.zcool.cn/community/01786557e4a6fa0000018c1bf080ca.png',
      'https://img.zcool.cn/community/0148e557e4a6fa0000018c1bf080ca.png',
    ]

    for (let i = 0; i < 12; i++) {
      const id = uuidv4()
      userIds.push(id)
      db.prepare(`INSERT INTO users (id, phone, nickname, avatar, total_recycled, total_earnings, charity_count) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        id, phones[i], nicknames[i], avatars[i % 2],
        Math.floor(Math.random() * 30) + 1,
        Math.round((Math.random() * 5000 + 100) * 100) / 100,
        Math.floor(Math.random() * 5)
      )
    }

    const addressIds: string[] = []
    const addressData = [
      { userIdx: 0, name: '张伟', phone: '13800138001', address: '上海市浦东新区陆家嘴环路1088号', detail: '12栋3单元501室', lat: 31.2397, lng: 121.4998, isDefault: 1 },
      { userIdx: 0, name: '张伟', phone: '13800138001', address: '上海市徐汇区漕溪北路398号', detail: '6号楼1203室', lat: 31.1889, lng: 121.4375, isDefault: 0 },
      { userIdx: 1, name: '李娜', phone: '13800138002', address: '北京市朝阳区建国路93号', detail: '万达广场A座2301', lat: 39.9087, lng: 116.4605, isDefault: 1 },
      { userIdx: 2, name: '王芳', phone: '13800138003', address: '上海市黄浦区南京东路300号', detail: '恒基大厦8层', lat: 31.2354, lng: 121.4737, isDefault: 1 },
      { userIdx: 3, name: '刘洋', phone: '13800138004', address: '北京市海淀区中关村大街27号', detail: '天使大厦B1层', lat: 39.9825, lng: 116.3144, isDefault: 1 },
      { userIdx: 4, name: '陈静', phone: '13800138005', address: '上海市静安区延安西路129号', detail: '华侨大厦15层', lat: 31.2222, lng: 121.4406, isDefault: 1 },
      { userIdx: 5, name: '杨磊', phone: '13800138006', address: '北京市西城区金融大街甲15号', detail: '鑫茂大厦9层', lat: 39.9131, lng: 116.3569, isDefault: 1 },
      { userIdx: 6, name: '赵敏', phone: '13800138007', address: '上海市长宁区天山路600弄', detail: '3号楼1802室', lat: 31.2188, lng: 121.3941, isDefault: 1 },
      { userIdx: 7, name: '黄强', phone: '13800138008', address: '上海市杨浦区国定路400号', detail: '创智天地2期', lat: 31.2994, lng: 121.5081, isDefault: 1 },
      { userIdx: 8, name: '周丽', phone: '13800138009', address: '北京市丰台区南三环西路16号', detail: '搜宝商务中心3号楼', lat: 39.8650, lng: 116.3292, isDefault: 1 },
      { userIdx: 9, name: '吴涛', phone: '13800138010', address: '上海市普陀区中山北路3663号', detail: '华东师大校内', lat: 31.2304, lng: 121.4237, isDefault: 1 },
      { userIdx: 10, name: '徐婷', phone: '13800138011', address: '上海市闵行区虹井路288号', detail: '乐虹坊3层', lat: 31.2015, lng: 121.3947, isDefault: 1 },
    ]

    for (const addr of addressData) {
      const id = uuidv4()
      addressIds.push(id)
      db.prepare(`INSERT INTO addresses (id, user_id, name, phone, address, detail, latitude, longitude, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id, userIds[addr.userIdx], addr.name, addr.phone, addr.address, addr.detail, addr.lat, addr.lng, addr.isDefault
      )
    }

    const orderIds: string[] = []
    const categories: ('clothing' | 'book' | 'phone')[] = ['clothing', 'book', 'phone']
    const statuses: ('pending' | 'dispatched' | 'picked_up' | 'inspecting' | 'priced' | 'confirmed' | 'settled' | 'donated' | 'rejected')[] = ['pending', 'dispatched', 'picked_up', 'inspecting', 'priced', 'confirmed', 'settled', 'donated', 'rejected']
    const timeSlots = ['2025-06-10 09:00-12:00', '2025-06-10 13:00-16:00', '2025-06-11 09:00-12:00', '2025-06-11 14:00-17:00', '2025-06-12 10:00-13:00']
    const conditions = ['全新', '九成新', '八成新', '七成新', '六成新']

    for (let i = 0; i < 30; i++) {
      const id = uuidv4()
      orderIds.push(id)
      const cat = categories[i % 3]
      const statusIdx = Math.min(Math.floor(i / 3.5), statuses.length - 1)
      const status = statuses[statusIdx]
      const estimatePrice = cat === 'phone' ? Math.round((Math.random() * 3000 + 500) * 100) / 100 :
                            cat === 'book' ? Math.round((Math.random() * 200 + 20) * 100) / 100 :
                            Math.round((Math.random() * 300 + 30) * 100) / 100
      const finalPrice = ['settled', 'confirmed', 'donated'].includes(status) ? Math.round(estimatePrice * (0.7 + Math.random() * 0.3) * 100) / 100 : null

      db.prepare(`INSERT INTO orders (id, user_id, category, status, estimate_price, final_price, address_id, time_slot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id, userIds[i % 12], cat, status, estimatePrice, finalPrice, addressIds[i % addressIds.length], timeSlots[i % timeSlots.length]
      )

      const brands = {
        clothing: ['优衣库', 'ZARA', 'H&M', 'Nike', 'Adidas', '波司登', '李宁', '安踏'],
        book: ['人民文学出版社', '中信出版社', '机械工业出版社', '清华大学出版社', '电子工业出版社'],
        phone: ['Apple', 'Huawei', 'Xiaomi', 'OPPO', 'vivo', 'Samsung']
      }
      const models = {
        clothing: ['T恤', '羽绒服', '牛仔裤', '运动外套', '衬衫', '卫衣'],
        book: ['Python编程', '经济学原理', '人类简史', '三体', '深度学习'],
        phone: ['iPhone 13', 'Mate 60', 'Redmi Note 12', 'Reno 10', 'X100', 'Galaxy S23']
      }

      for (let j = 0; j < Math.floor(Math.random() * 3) + 1; j++) {
        db.prepare(`INSERT INTO order_items (id, order_id, brand, model, condition, weight) VALUES (?, ?, ?, ?, ?, ?)`).run(
          uuidv4(), id,
          brands[cat][Math.floor(Math.random() * brands[cat].length)],
          models[cat][Math.floor(Math.random() * models[cat].length)],
          conditions[Math.floor(Math.random() * conditions.length)],
          Math.round((Math.random() * 2 + 0.1) * 100) / 100
        )
      }
    }

    const inspectionIds: string[] = []
    const inspectionStatuses: ('pending' | 'ai_screening' | 'manual_check' | 'completed' | 'rejected')[] = ['pending', 'ai_screening', 'manual_check', 'completed', 'rejected']
    const assignees = ['质检员王明', '质检员李华', '质检员张秀', '质检员赵芳']
    const stepNames = {
      clothing: ['外观检查', '面料鉴定', '品牌核实', '磨损评估', '清洗建议'],
      book: ['封面检查', '内页完整性', '印刷质量', '出版信息核实', '品相评级'],
      phone: ['外观检查', '屏幕检测', '功能测试', '电池健康度', '配件核对']
    }

    for (let i = 0; i < 15; i++) {
      const id = uuidv4()
      inspectionIds.push(id)
      const order = db.prepare('SELECT category FROM orders WHERE id = ?').get(orderIds[i]) as { category: string }
      const cat = order.category as 'clothing' | 'book' | 'phone'
      const inspStatus = inspectionStatuses[Math.min(i % 5, 4)]
      const aiResult = ['ai_screening', 'manual_check', 'completed'].includes(inspStatus)
        ? JSON.stringify({ score: Math.floor(Math.random() * 30 + 70), label: conditions[Math.floor(Math.random() * conditions.length)], confidence: Math.round((Math.random() * 0.25 + 0.75) * 100) / 100 })
        : null

      db.prepare(`INSERT INTO inspections (id, order_id, category, status, assignee, ai_result) VALUES (?, ?, ?, ?, ?, ?)`).run(
        id, orderIds[i], cat, inspStatus,
        ['manual_check', 'completed', 'rejected'].includes(inspStatus) ? assignees[Math.floor(Math.random() * assignees.length)] : null,
        aiResult
      )

      const steps = stepNames[cat]
      for (let s = 0; s < steps.length; s++) {
        const passed = inspStatus === 'completed' ? 1 :
                       inspStatus === 'rejected' && s === steps.length - 1 ? 0 :
                       ['manual_check', 'completed'].includes(inspStatus) && s < steps.length - 1 ? 1 :
                       null
        db.prepare(`INSERT INTO inspection_steps (id, inspection_id, step_order, name, passed, notes, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
          uuidv4(), id, s + 1, steps[s], passed,
          passed === 1 ? '合格' : passed === 0 ? '不合格' : null,
          passed !== null ? `2025-06-${10 + s} ${9 + s}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00` : null
        )
      }

      const imageTypes = ['front', 'back', 'detail', 'label', 'screen']
      for (let img = 0; img < 3; img++) {
        db.prepare(`INSERT INTO inspection_images (id, inspection_id, url, type, ai_analysis) VALUES (?, ?, ?, ?, ?)`).run(
          uuidv4(), id,
          `https://cdn.example.com/inspection/${id.slice(0, 8)}_${img}.jpg`,
          imageTypes[img],
          aiResult ? `AI识别: ${conditions[Math.floor(Math.random() * conditions.length)]}, 置信度${Math.round((Math.random() * 0.25 + 0.75) * 100)}%` : null
        )
      }
    }

    const ruleIds: string[] = []
    const pricingRulesData = [
      { name: '衣物按重量计价', category: 'clothing', type: 'weight', price_modifier: 3.5, priority: 10 },
      { name: '品牌服装溢价', category: 'clothing', type: 'market', price_modifier: 1.8, priority: 20 },
      { name: '旧衣折扣', category: 'clothing', type: 'weight', price_modifier: 1.5, priority: 5 },
      { name: '书籍按重量计价', category: 'book', type: 'weight', price_modifier: 2.0, priority: 10 },
      { name: '教材类溢价', category: 'book', type: 'model', price_modifier: 1.5, priority: 15 },
      { name: '畅销书溢价', category: 'book', type: 'market', price_modifier: 2.2, priority: 20 },
      { name: '手机按型号计价', category: 'phone', type: 'model', price_modifier: 1.0, priority: 10 },
      { name: '苹果手机溢价', category: 'phone', type: 'market', price_modifier: 2.5, priority: 30 },
      { name: '华为手机溢价', category: 'phone', type: 'market', price_modifier: 2.0, priority: 25 },
      { name: '旧手机折扣', category: 'phone', type: 'model', price_modifier: 0.6, priority: 5 },
    ]

    for (const rule of pricingRulesData) {
      const id = uuidv4()
      ruleIds.push(id)
      db.prepare(`INSERT INTO pricing_rules (id, name, category, type, price_modifier, enabled, priority) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        id, rule.name, rule.category, rule.type, rule.price_modifier, 1, rule.priority
      )
    }

    const pricingConditionsData = [
      { ruleIdx: 0, field: 'weight', operator: '>=', value: '5' },
      { ruleIdx: 0, field: 'weight', operator: '<=', value: '50' },
      { ruleIdx: 1, field: 'brand', operator: 'IN', value: 'Nike,Adidas,优衣库' },
      { ruleIdx: 2, field: 'condition', operator: 'IN', value: '六成新,七成新' },
      { ruleIdx: 3, field: 'weight', operator: '>=', value: '1' },
      { ruleIdx: 4, field: 'model', operator: 'LIKE', value: '%教材%' },
      { ruleIdx: 5, field: 'model', operator: 'IN', value: '人类简史,三体,经济学原理' },
      { ruleIdx: 6, field: 'model', operator: '!=', value: '' },
      { ruleIdx: 7, field: 'brand', operator: '=', value: 'Apple' },
      { ruleIdx: 8, field: 'brand', operator: '=', value: 'Huawei' },
      { ruleIdx: 9, field: 'condition', operator: 'IN', value: '六成新,七成新' },
    ]

    for (const cond of pricingConditionsData) {
      db.prepare(`INSERT INTO pricing_conditions (id, rule_id, field, operator, value) VALUES (?, ?, ?, ?, ?)`).run(
        uuidv4(), ruleIds[cond.ruleIdx], cond.field, cond.operator, cond.value
      )
    }

    const settlementIds: string[] = []
    const settlementMethods: ('wechat' | 'bank')[] = ['wechat', 'bank']
    const settlementStatuses: ('pending' | 'processing' | 'completed' | 'failed')[] = ['pending', 'processing', 'completed', 'failed']
    const wechatAccounts = ['wx_payer_001', 'wx_payer_002', 'wx_payer_003']
    const bankAccounts = ['6222021234567890123', '6228481234567890456', '6217001234567890789']

    for (let i = 0; i < 20; i++) {
      const id = uuidv4()
      settlementIds.push(id)
      const orderIdx = i % orderIds.length
      const order = db.prepare('SELECT final_price, estimate_price, status FROM orders WHERE id = ?').get(orderIds[orderIdx]) as { final_price: number | null, estimate_price: number | null, status: string }
      const amount = order.final_price || order.estimate_price || 100
      const method = settlementMethods[i % 2]
      const sStatus = i < 12 ? 'completed' : i < 16 ? 'pending' : i < 18 ? 'processing' : 'failed'

      db.prepare(`INSERT INTO settlements (id, order_id, amount, method, status, account, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        id, orderIds[orderIdx], Math.round(amount * 100) / 100, method, sStatus,
        method === 'wechat' ? wechatAccounts[i % 3] : bankAccounts[i % 3],
        sStatus === 'completed' ? `2025-06-${12 + (i % 10)} ${10 + (i % 8)}:${(i * 7 % 60).toString().padStart(2, '0')}:00` : null
      )
    }

    const logisticsIds: string[] = []
    const logisticsProviders: ('sf' | 'jd')[] = ['sf', 'jd']
    const logisticsStatuses: ('dispatched' | 'picking_up' | 'picked_up' | 'in_transit' | 'delivered')[] = ['dispatched', 'picking_up', 'picked_up', 'in_transit', 'delivered']
    const couriers = ['快递员小张', '快递员小王', '快递员小李', '快递员小赵']
    const trackingNos = ['SF1234567890', 'SF1234567891', 'JD9876543210', 'JD9876543211', 'SF1234567892', 'JD9876543212']
    const pickupAddresses = [
      '上海市浦东新区陆家嘴环路1088号',
      '北京市朝阳区建国路93号',
      '上海市黄浦区南京东路300号',
      '北京市海淀区中关村大街27号',
      '上海市静安区延安西路129号',
    ]

    for (let i = 0; i < 15; i++) {
      const id = uuidv4()
      logisticsIds.push(id)
      const lStatus = logisticsStatuses[Math.min(i % 5, 4)]
      const provider = logisticsProviders[i % 2]

      db.prepare(`INSERT INTO logistics_orders (id, order_id, courier, provider, status, tracking_no, pickup_address, pickup_time_slot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
        id, orderIds[i], lStatus === 'dispatched' ? null : couriers[i % couriers.length], provider, lStatus,
        lStatus !== 'dispatched' ? trackingNos[i % trackingNos.length] : null,
        pickupAddresses[i % pickupAddresses.length],
        timeSlots[i % timeSlots.length]
      )
    }

    const projectIds: string[] = []
    const charityProjectsData = [
      { name: '书香计划', description: '为偏远山区儿童捐赠图书，让知识照亮未来', target: 50000, start: '2025-01-01', end: '2025-12-31', raised: 32500 },
      { name: '暖冬行动', description: '回收旧衣物捐赠给贫困地区，温暖每一个冬天', target: 80000, start: '2025-03-01', end: '2025-11-30', raised: 67200 },
      { name: '绿色校园', description: '校园旧物回收再利用，共建绿色环保校园', target: 30000, start: '2025-02-01', end: '2025-10-31', raised: 18900 },
      { name: '数字桥梁', description: '回收旧手机翻新后捐赠给老年人，帮助他们融入数字生活', target: 100000, start: '2025-01-15', end: '2025-12-15', raised: 45600 },
      { name: '循环之美', description: '推动循环经济理念，减少资源浪费，保护地球家园', target: 200000, start: '2025-04-01', end: '2026-03-31', raised: 89000 },
    ]

    for (const proj of charityProjectsData) {
      const id = uuidv4()
      projectIds.push(id)
      db.prepare(`INSERT INTO charity_projects (id, name, description, total_raised, target_amount, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        id, proj.name, proj.description, proj.raised, proj.target, proj.start, proj.end
      )
    }

    const donationIds: string[] = []
    for (let i = 0; i < 10; i++) {
      const id = uuidv4()
      donationIds.push(id)
      const amount = Math.round((Math.random() * 500 + 10) * 100) / 100
      const dStatus: 'pending' | 'completed' = i < 7 ? 'completed' : 'pending'

      db.prepare(`INSERT INTO charity_donations (id, user_id, order_id, project_id, amount, status, certificate) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        id, userIds[i % 12], orderIds[i], projectIds[i % projectIds.length], amount, dStatus,
        dStatus === 'completed' ? `CERT-${id.slice(0, 8).toUpperCase()}` : null
      )
    }

    const processorIds: string[] = []
    const processorsData = [
      { name: '绿环再生资源有限公司', license: 'SH-RECYCLE-2024-001', status: 'approved' as const, contact: '王经理 021-58881234' },
      { name: '再生宝环保科技', license: 'BJ-RECYCLE-2024-002', status: 'approved' as const, contact: '刘总 010-67891234' },
      { name: '循环未来环保', license: 'SH-RECYCLE-2024-003', status: 'initial_review' as const, contact: '张经理 021-61234567' },
      { name: '碳中和技术服务', license: 'BJ-RECYCLE-2024-004', status: 'pending' as const, contact: '李总 010-87654321' },
      { name: '旧物新生科技', license: 'GZ-RECYCLE-2024-005', status: 'rejected' as const, contact: '陈经理 020-33445566' },
    ]

    for (const proc of processorsData) {
      const id = uuidv4()
      processorIds.push(id)
      db.prepare(`INSERT INTO processors (id, name, license, status, contact) VALUES (?, ?, ?, ?, ?)`).run(
        id, proc.name, proc.license, proc.status, proc.contact
      )

      if (proc.status === 'approved') {
        db.prepare(`INSERT INTO processor_audits (id, processor_id, status, reviewer, notes) VALUES (?, ?, ?, ?, ?)`).run(
          uuidv4(), id, 'initial_review', '审核员张三', '资质材料齐全，初审通过'
        )
        db.prepare(`INSERT INTO processor_audits (id, processor_id, status, reviewer, notes) VALUES (?, ?, ?, ?, ?)`).run(
          uuidv4(), id, 'final_review', '审核员李四', '终审通过，批准入驻'
        )
        db.prepare(`INSERT INTO processor_audits (id, processor_id, status, reviewer, notes) VALUES (?, ?, ?, ?, ?)`).run(
          uuidv4(), id, 'approved', '审核员李四', '已批准'
        )
      } else if (proc.status === 'initial_review') {
        db.prepare(`INSERT INTO processor_audits (id, processor_id, status, reviewer, notes) VALUES (?, ?, ?, ?, ?)`).run(
          uuidv4(), id, 'initial_review', '审核员张三', '初审中，需补充环保资质'
        )
      } else if (proc.status === 'rejected') {
        db.prepare(`INSERT INTO processor_audits (id, processor_id, status, reviewer, notes) VALUES (?, ?, ?, ?, ?)`).run(
          uuidv4(), id, 'initial_review', '审核员张三', '初审不通过'
        )
        db.prepare(`INSERT INTO processor_audits (id, processor_id, status, reviewer, notes) VALUES (?, ?, ?, ?, ?)`).run(
          uuidv4(), id, 'rejected', '审核员李四', '证照不全，拒绝入驻申请'
        )
      }
    }
  })

  insert()
}
