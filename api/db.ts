import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, '..', 'data', 'app.sqlite')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function initDb(): void {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL DEFAULT '123456',
      role TEXT NOT NULL CHECK(role IN ('agent','tenant','buyer','owner','admin')),
      avatar TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      store_id INTEGER,
      certified INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      deal_count INTEGER DEFAULT 0,
      avatar TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS agent_contact_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER NOT NULL,
      customer_id INTEGER,
      contact_type TEXT NOT NULL CHECK(contact_type IN ('phone','im','viewing')),
      content TEXT DEFAULT '',
      status TEXT NOT NULL CHECK(status IN ('pending','contacted','following','closed')),
      next_follow_up TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (customer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS communities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      district TEXT NOT NULL,
      address TEXT DEFAULT '',
      school_district TEXT DEFAULT '',
      property_company TEXT DEFAULT '',
      year_built INTEGER DEFAULT 0,
      avg_price REAL DEFAULT 0,
      avg_rent REAL DEFAULT 0,
      total_buildings INTEGER DEFAULT 0,
      total_units INTEGER DEFAULT 0,
      green_rate REAL DEFAULT 0,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS community_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER NOT NULL,
      stat_date TEXT NOT NULL,
      viewings_30d INTEGER DEFAULT 0,
      deal_count_30d INTEGER DEFAULT 0,
      avg_transaction_cycle_days REAL DEFAULT 0,
      rent_change_pct REAL DEFAULT 0,
      price_change_pct REAL DEFAULT 0,
      new_listings_30d INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (community_id) REFERENCES communities(id)
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('sale','rent')),
      price REAL NOT NULL,
      area REAL NOT NULL,
      rooms INTEGER DEFAULT 0,
      halls INTEGER DEFAULT 0,
      bathrooms INTEGER DEFAULT 0,
      floor INTEGER DEFAULT 1,
      total_floors INTEGER DEFAULT 1,
      orientation TEXT DEFAULT '',
      decoration TEXT DEFAULT '',
      vr_url TEXT DEFAULT '',
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active','pending','sold','rented','offline')),
      owner_id INTEGER,
      agent_id INTEGER,
      is_featured INTEGER DEFAULT 0,
      has_vr INTEGER DEFAULT 0,
      has_inspection INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (community_id) REFERENCES communities(id),
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS property_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      type TEXT DEFAULT 'photo' CHECK(type IN ('photo','vr','inspection','floor_plan')),
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS price_trends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      trend_date TEXT NOT NULL,
      price REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS viewings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      viewer_id INTEGER,
      viewer_name TEXT DEFAULT '',
      viewer_phone TEXT DEFAULT '',
      viewed_at TEXT DEFAULT (datetime('now','localtime')),
      type TEXT DEFAULT 'offline' CHECK(type IN ('online','offline')),
      notes TEXT DEFAULT '',
      rating INTEGER DEFAULT 0,
      status TEXT DEFAULT 'completed' CHECK(status IN ('scheduled','completed','cancelled')),
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS ai_property_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT DEFAULT '我的房卡',
      filters_json TEXT NOT NULL DEFAULT '{}',
      active INTEGER DEFAULT 1,
      push_count INTEGER DEFAULT 0,
      last_pushed_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS renovation_simulations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER,
      floor_plan_url TEXT DEFAULT '',
      style TEXT DEFAULT 'modern',
      result_url TEXT DEFAULT '',
      status TEXT DEFAULT 'processing' CHECK(status IN ('processing','completed','failed')),
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS mortgage_calculations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      total_price REAL NOT NULL,
      down_payment_pct REAL NOT NULL DEFAULT 30,
      loan_years INTEGER NOT NULL DEFAULT 30,
      commercial_rate REAL DEFAULT 3.95,
      commercial_amount REAL DEFAULT 0,
      fund_rate REAL DEFAULT 2.85,
      fund_amount REAL DEFAULT 0,
      monthly_payment REAL DEFAULT 0,
      total_interest REAL DEFAULT 0,
      result_json TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS owner_delegations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      agent_id INTEGER,
      property_id INTEGER,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      expected_price REAL DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','assigned','active','completed','cancelled')),
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS delegation_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      delegation_id INTEGER NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      agent_id INTEGER,
      remark TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (delegation_id) REFERENCES owner_delegations(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS xiangyu_apartments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      contract_no TEXT NOT NULL UNIQUE,
      tenant_id INTEGER,
      lock_id TEXT DEFAULT '',
      lock_status TEXT DEFAULT 'locked' CHECK(lock_status IN ('locked','unlocked','offline')),
      lock_battery INTEGER DEFAULT 100,
      rent_price REAL DEFAULT 0,
      deposit REAL DEFAULT 0,
      lease_start TEXT DEFAULT '',
      lease_end TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active','expired','terminated')),
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (tenant_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cleaning_appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      apartment_id INTEGER NOT NULL,
      appointment_date TEXT NOT NULL,
      time_slot TEXT DEFAULT '09:00-12:00',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','completed','cancelled')),
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (apartment_id) REFERENCES xiangyu_apartments(id)
    );

    CREATE TABLE IF NOT EXISTS repair_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      apartment_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'other' CHECK(category IN ('plumbing','electrical','door_window','appliance','furniture','other')),
      urgency TEXT DEFAULT 'normal' CHECK(urgency IN ('low','normal','high','emergency')),
      assigned_to INTEGER,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','assigned','in_progress','completed','closed')),
      images_json TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (apartment_id) REFERENCES xiangyu_apartments(id),
      FOREIGN KEY (assigned_to) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS agent_collaborations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_agent_id INTEGER NOT NULL,
      to_agent_id INTEGER NOT NULL,
      customer_id INTEGER,
      customer_name TEXT DEFAULT '',
      permission_level TEXT DEFAULT 'view' CHECK(permission_level IN ('view','edit','full')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active','revoked','expired')),
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (from_agent_id) REFERENCES agents(id),
      FOREIGN KEY (to_agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS property_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      inspector_id INTEGER,
      inspection_photos_json TEXT DEFAULT '[]',
      ai_match_score REAL DEFAULT 0,
      address_verified INTEGER DEFAULT 0,
      verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending','passed','failed','needs_review')),
      verified_at TEXT,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (inspector_id) REFERENCES agents(id)
    );
  `)

  seedData(db)
}

function seedData(db: Database.Database): void {
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number }
  if (userCount.cnt > 0) return

  const now = new Date()
  const formatDate = (d: Date) => d.toISOString().slice(0, 10)

  const insertUser = db.prepare(
    `INSERT INTO users (name, phone, role, password) VALUES (?, ?, ?, ?)`
  )

  const admin = insertUser.run('系统管理员', '13800000001', 'admin', 'admin123')
  const owner1 = insertUser.run('张业主', '13800000002', 'owner', '123456')
  const owner2 = insertUser.run('李业主', '13800000003', 'owner', '123456')
  const owner3 = insertUser.run('王业主', '13800000004', 'owner', '123456')
  const buyer1 = insertUser.run('赵买家', '13800000005', 'buyer', '123456')
  const buyer2 = insertUser.run('钱买家', '13800000006', 'buyer', '123456')
  const tenant1 = insertUser.run('孙租客', '13800000007', 'tenant', '123456')
  const tenant2 = insertUser.run('周租客', '13800000008', 'tenant', '123456')
  const agentUser1 = insertUser.run('陈经纪', '13800000009', 'agent', '123456')
  const agentUser2 = insertUser.run('吴经纪', '13800000010', 'agent', '123456')
  const agentUser3 = insertUser.run('郑经纪', '13800000011', 'agent', '123456')

  const insertStore = db.prepare(
    `INSERT INTO stores (name, address, phone) VALUES (?, ?, ?)`
  )
  const store1 = insertStore.run('我爱我家·西湖门店', '西湖区文三路128号', '0571-88001001')
  const store2 = insertStore.run('我爱我家·滨江门店', '滨江区江南大道256号', '0571-88001002')
  const store3 = insertStore.run('我爱我家·拱墅门店', '拱墅区莫干山路512号', '0571-88001003')

  const insertAgent = db.prepare(
    `INSERT INTO agents (user_id, name, store_id, certified, rating, deal_count) VALUES (?, ?, ?, ?, ?, ?)`
  )
  insertAgent.run(agentUser1.lastInsertRowid as number, '陈经纪', store1.lastInsertRowid as number, 1, 4.8, 32)
  insertAgent.run(agentUser2.lastInsertRowid as number, '吴经纪', store2.lastInsertRowid as number, 1, 4.6, 28)
  insertAgent.run(agentUser3.lastInsertRowid as number, '郑经纪', store3.lastInsertRowid as number, 1, 4.9, 45)

  const insertCommunity = db.prepare(
    `INSERT INTO communities (name, district, address, school_district, property_company, year_built, avg_price, avg_rent, total_buildings, total_units, green_rate, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  type CommunitySeed = [string, string, string, string, string, number, number, number, number, number, number, string]

  const communities: CommunitySeed[] = [
    ['翠苑一区', '西湖区', '翠苑街道文一西路1号', '翠苑一小/翠苑中学', '绿城物业', 1998, 45800, 4200, 18, 2160, 35, '西湖区成熟小区，配套完善，交通便利'],
    ['星洲花园', '西湖区', '古墩路星洲街88号', '星洲小学/翠苑中学', '南都物业', 2005, 52800, 5100, 12, 1450, 40, '高品质住宅小区，学区优越，环境优美'],
    ['滨江金茂府', '滨江区', '江南大道与通和路交叉口', '江南实验学校', '金茂物业', 2018, 68500, 7800, 8, 960, 45, '滨江核心地段高端改善盘，品质标杆'],
    ['万家星城', '拱墅区', '莫干山路与石祥路交叉口', '卖鱼桥小学', '万科物业', 2012, 39200, 3800, 22, 2800, 38, '大型品质社区，商业配套成熟'],
    ['东方润园', '上城区', '钱江新城富春路128号', '采荷二小/建兰中学', '龙湖物业', 2016, 72000, 8500, 6, 720, 42, '钱江新城核心豪宅，江景资源稀缺'],
    ['西溪蝶园', '西湖区', '文二西路与紫荆花路交叉口', '学军小学/学军中学', '万科物业', 2010, 55000, 5500, 15, 1800, 40, '西溪湿地旁品质社区，学区一流'],
    ['宋都晨光国际', '钱塘区', '下沙经济开发区', '下沙中心小学', '宋都物业', 2015, 28000, 2600, 20, 2400, 32, '下沙刚需大盘，性价比突出'],
    ['融创河滨之城', '余杭区', '良渚文化村', '良渚实验', '融创物业', 2020, 35000, 3200, 10, 1200, 38, '良渚文化村低密社区，自然环境优美'],
  ]

  const communityIds: number[] = []
  for (const c of communities) {
    const r = insertCommunity.run(...c)
    communityIds.push(r.lastInsertRowid as number)
  }

  const insertCommunityStats = db.prepare(
    `INSERT INTO community_stats (community_id, stat_date, viewings_30d, deal_count_30d, avg_transaction_cycle_days, rent_change_pct, price_change_pct, new_listings_30d) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )

  for (let i = 0; i < communityIds.length; i++) {
    const base30 = 20 + Math.floor(Math.random() * 60)
    const deals = 1 + Math.floor(Math.random() * 8)
    const cycle = 30 + Math.floor(Math.random() * 90)
    const rentPct = -2 + Math.random() * 6
    const pricePct = -3 + Math.random() * 5
    const newL = 2 + Math.floor(Math.random() * 10)

    for (let d = 0; d < 7; d++) {
      const date = new Date(now)
      date.setDate(date.getDate() - d * 5)
      insertCommunityStats.run(
        communityIds[i],
        formatDate(date),
        base30 + Math.floor(Math.random() * 20 - 10),
        deals + Math.floor(Math.random() * 3 - 1),
        cycle + Math.floor(Math.random() * 20 - 10),
        Math.round(rentPct * 100 + (Math.random() * 2 - 1)) / 100,
        Math.round(pricePct * 100 + (Math.random() * 2 - 1)) / 100,
        newL + Math.floor(Math.random() * 4 - 2),
      )
    }
  }

  const insertProperty = db.prepare(
    `INSERT INTO properties (community_id, title, type, price, area, rooms, halls, bathrooms, floor, total_floors, orientation, decoration, status, owner_id, agent_id, is_featured, has_vr, has_inspection) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const ownerIds = [owner1.lastInsertRowid, owner2.lastInsertRowid, owner3.lastInsertRowid] as number[]
  const agentIds = [1, 2, 3] as number[]

  const propertyTemplates = [
    { title: '精装三房 南北通透', type: 'sale', rooms: 3, halls: 2, bathrooms: 1, decoration: '精装' },
    { title: '温馨两房 采光好', type: 'sale', rooms: 2, halls: 1, bathrooms: 1, decoration: '简装' },
    { title: '豪华四房 江景房', type: 'sale', rooms: 4, halls: 2, bathrooms: 2, decoration: '豪装' },
    { title: '紧凑一房 地铁口', type: 'rent', rooms: 1, halls: 1, bathrooms: 1, decoration: '精装' },
    { title: '两房整租 家电全', type: 'rent', rooms: 2, halls: 1, bathrooms: 1, decoration: '精装' },
    { title: '三房整租 拎包入住', type: 'rent', rooms: 3, halls: 2, bathrooms: 1, decoration: '豪装' },
    { title: '次新三房 品质社区', type: 'sale', rooms: 3, halls: 2, bathrooms: 2, decoration: '精装' },
    { title: '学区两房 急售', type: 'sale', rooms: 2, halls: 1, bathrooms: 1, decoration: '中装' },
    { title: '改善四房 大平层', type: 'sale', rooms: 4, halls: 2, bathrooms: 2, decoration: '豪装' },
    { title: '单间出租 独立卫浴', type: 'rent', rooms: 1, halls: 0, bathrooms: 1, decoration: '简装' },
  ]

  const propertyIds: number[] = []
  for (let ci = 0; ci < communityIds.length; ci++) {
    const numProps = 2 + Math.floor(Math.random() * 4)
    for (let pi = 0; pi < numProps; pi++) {
      const tmpl = propertyTemplates[pi % propertyTemplates.length]
      const comm = communities[ci]
      const area = tmpl.rooms === 1 ? 30 + Math.random() * 30 : tmpl.rooms === 2 ? 60 + Math.random() * 30 : tmpl.rooms === 3 ? 90 + Math.random() * 40 : 130 + Math.random() * 60
      const floor = 1 + Math.floor(Math.random() * 25)
      const totalFloors = Math.max(floor, 6 + Math.floor(Math.random() * 26))
      const orientations = ['南', '南北', '东南', '西南', '东', '西']
      const orient = orientations[Math.floor(Math.random() * orientations.length)]
      const ownerIdx = Math.floor(Math.random() * ownerIds.length)
      const agentIdx = Math.floor(Math.random() * agentIds.length)
      const hasVr = Math.random() > 0.5 ? 1 : 0
      const hasInsp = Math.random() > 0.3 ? 1 : 0

      let price: number
      if (tmpl.type === 'sale') {
        price = Math.round(comm[6] * area / 10000)
      } else {
        price = Math.round(comm[7] * area / 100)
      }

      const r = insertProperty.run(
        communityIds[ci],
        `[${comm[0]}] ${tmpl.title}`,
        tmpl.type,
        price,
        Math.round(area * 100) / 100,
        tmpl.rooms,
        tmpl.halls,
        tmpl.bathrooms,
        floor,
        totalFloors,
        orient,
        tmpl.decoration,
        'active',
        ownerIds[ownerIdx],
        agentIds[agentIdx],
        Math.random() > 0.7 ? 1 : 0,
        hasVr,
        hasInsp,
      )
      propertyIds.push(r.lastInsertRowid as number)
    }
  }

  const insertPriceTrend = db.prepare(
    `INSERT INTO price_trends (property_id, trend_date, price) VALUES (?, ?, ?)`
  )
  for (const pid of propertyIds) {
    const prop = db.prepare('SELECT price, type FROM properties WHERE id = ?').get(pid) as { price: number; type: string }
    for (let d = 0; d < 12; d++) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - d)
      const fluctuation = 1 + (Math.random() * 0.06 - 0.03)
      insertPriceTrend.run(pid, formatDate(date), Math.round(prop.price * fluctuation * 100) / 100)
    }
  }

  const insertViewing = db.prepare(
    `INSERT INTO viewings (property_id, agent_id, viewer_name, viewer_phone, viewed_at, type, notes, rating, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const viewerNames = ['刘先生', '陈女士', '王先生', '赵女士', '李先生', '张女士', '周先生', '吴女士']
  for (const pid of propertyIds.slice(0, 15)) {
    const numViewings = 1 + Math.floor(Math.random() * 5)
    for (let v = 0; v < numViewings; v++) {
      const vDate = new Date(now)
      vDate.setDate(vDate.getDate() - Math.floor(Math.random() * 30))
      const vName = viewerNames[Math.floor(Math.random() * viewerNames.length)]
      const aId = agentIds[Math.floor(Math.random() * agentIds.length)]
      insertViewing.run(
        pid,
        aId,
        vName,
        `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        vDate.toISOString().slice(0, 19).replace('T', ' '),
        Math.random() > 0.6 ? 'online' : 'offline',
        '客户对户型比较满意',
        3 + Math.floor(Math.random() * 3),
        'completed',
      )
    }
  }

  const insertApartment = db.prepare(
    `INSERT INTO xiangyu_apartments (property_id, contract_no, tenant_id, lock_id, lock_status, lock_battery, rent_price, deposit, lease_start, lease_end, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const rentProperties = propertyIds.filter(pid => {
    const p = db.prepare('SELECT type FROM properties WHERE id = ?').get(pid) as { type: string }
    return p.type === 'rent'
  })

  for (let i = 0; i < Math.min(rentProperties.length, 8); i++) {
    const pid = rentProperties[i]
    const prop = db.prepare('SELECT price FROM properties WHERE id = ?').get(pid) as { price: number }
    const leaseStart = new Date(now)
    leaseStart.setMonth(leaseStart.getMonth() - Math.floor(Math.random() * 6))
    const leaseEnd = new Date(leaseStart)
    leaseEnd.setFullYear(leaseEnd.getFullYear() + 1)
    const battery = 15 + Math.floor(Math.random() * 85)

    insertApartment.run(
      pid,
      `XY${String(2024001 + i)}`,
      tenant1.lastInsertRowid as number + (i % 2),
      `LOCK-${String(1000 + i)}`,
      battery < 20 ? 'offline' : (Math.random() > 0.8 ? 'unlocked' : 'locked'),
      battery,
      prop.price,
      prop.price * 2,
      formatDate(leaseStart),
      formatDate(leaseEnd),
      'active',
    )
  }

  const insertDelegation = db.prepare(
    `INSERT INTO owner_delegations (owner_id, agent_id, property_id, title, description, expected_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  const insertStatusHistory = db.prepare(
    `INSERT INTO delegation_status_history (delegation_id, from_status, to_status, agent_id, remark, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  )
  for (let i = 0; i < 5; i++) {
    const pid = propertyIds[Math.floor(Math.random() * propertyIds.length)]
    const prop = db.prepare('SELECT price FROM properties WHERE id = ?').get(pid) as { price: number }
    const status = i === 0 ? 'completed' : i < 3 ? 'active' : 'pending'
    const dr = insertDelegation.run(
      ownerIds[i % ownerIds.length],
      status !== 'pending' ? agentIds[i % agentIds.length] : null,
      pid,
      '诚意出售，价格可议',
      '房子保养良好，随时可看房，诚意出售',
      Math.round(prop.price * 1.05),
      status,
    )
    const delegationId = dr.lastInsertRowid as number
    const baseDate = new Date(now)
    baseDate.setDate(baseDate.getDate() - Math.floor(Math.random() * 30))
    insertStatusHistory.run(delegationId, null, 'pending', null, '业主发布委托', baseDate.toISOString().slice(0, 19).replace('T', ' '))
    if (status !== 'pending') {
      const assignedDate = new Date(baseDate)
      assignedDate.setDate(assignedDate.getDate() + 1)
      insertStatusHistory.run(delegationId, 'pending', 'assigned', agentIds[i % agentIds.length], '系统分配经纪人', assignedDate.toISOString().slice(0, 19).replace('T', ' '))
      let activeDate = new Date(assignedDate)
      if (status === 'active' || status === 'completed') {
        activeDate = new Date(assignedDate)
        activeDate.setDate(activeDate.getDate() + 1)
        insertStatusHistory.run(delegationId, 'assigned', 'active', agentIds[i % agentIds.length], '经纪人确认接单，开始服务', activeDate.toISOString().slice(0, 19).replace('T', ' '))
      }
      if (status === 'completed') {
        const completedDate = new Date(activeDate)
        completedDate.setDate(completedDate.getDate() + 7)
        insertStatusHistory.run(delegationId, 'active', 'completed', agentIds[i % agentIds.length], '房屋成功售出，委托完成', completedDate.toISOString().slice(0, 19).replace('T', ' '))
      }
    }
  }

  const insertVerification = db.prepare(
    `INSERT INTO property_verifications (property_id, inspector_id, ai_match_score, address_verified, verification_status, verified_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  for (const pid of propertyIds.slice(0, 10)) {
    const score = 70 + Math.random() * 30
    insertVerification.run(
      pid,
      agentIds[Math.floor(Math.random() * agentIds.length)],
      Math.round(score * 100) / 100,
      score > 80 ? 1 : 0,
      score > 85 ? 'passed' : score > 70 ? 'needs_review' : 'failed',
      new Date(now.getTime() - Math.random() * 7 * 86400000).toISOString().slice(0, 19).replace('T', ' '),
      score > 85 ? '实勘照片与房源信息匹配度高' : '部分信息需要进一步核实',
    )
  }

  console.log('Database seeded successfully')
}
