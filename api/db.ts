import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.resolve(__dirname, '..', 'data')
const dbPath = path.join(dataDir, 'app.sqlite')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      phone TEXT,
      email TEXT,
      avatar TEXT,
      nickname TEXT,
      certification_type TEXT,
      certification_status TEXT DEFAULT 'none',
      certification_materials TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      cover_image TEXT,
      category TEXT NOT NULL DEFAULT 'house_viewing',
      status TEXT NOT NULL DEFAULT 'scheduled',
      viewer_count INTEGER DEFAULT 0,
      stream_url TEXT,
      scheduled_at DATETIME,
      started_at DATETIME,
      ended_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS danmaku (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      live_id INTEGER NOT NULL REFERENCES lives(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      username TEXT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS red_packets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      live_id INTEGER NOT NULL REFERENCES lives(id),
      sender_id INTEGER NOT NULL REFERENCES users(id),
      total_amount DECIMAL(10,2) NOT NULL,
      total_count INTEGER NOT NULL,
      remain_count INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS red_packet_grabs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      red_packet_id INTEGER NOT NULL REFERENCES red_packets(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      amount DECIMAL(10,2) NOT NULL,
      grabbed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(red_packet_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      publisher_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      property_type TEXT NOT NULL,
      listing_type TEXT NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      area DECIMAL(8,2),
      layout TEXT,
      floor_info TEXT,
      orientation TEXT,
      decoration_status TEXT,
      address TEXT,
      city TEXT,
      district TEXT,
      community TEXT,
      images TEXT,
      vr_data TEXT,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS renovation_companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      license_no TEXT,
      certification_status TEXT DEFAULT 'pending',
      qualification_level TEXT,
      cases_count INTEGER DEFAULT 0,
      rating DECIMAL(3,1) DEFAULT 0,
      contact_phone TEXT,
      description TEXT,
      logo_url TEXT,
      annual_review_date DATE,
      annual_review_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS renovation_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES renovation_companies(id),
      title TEXT NOT NULL,
      style TEXT,
      budget DECIMAL(10,2),
      area DECIMAL(8,2),
      images TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS renovation_quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES renovation_companies(id),
      order_id INTEGER,
      items_json TEXT NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS renovation_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      company_id INTEGER NOT NULL REFERENCES renovation_companies(id),
      designer_id INTEGER REFERENCES users(id),
      current_stage TEXT DEFAULT 'design',
      status TEXT DEFAULT 'pending',
      description TEXT,
      budget DECIMAL(10,2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      content_type TEXT NOT NULL DEFAULT 'article',
      body TEXT,
      media_urls TEXT,
      like_count INTEGER DEFAULT 0,
      collect_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      review_status TEXT DEFAULT 'pending',
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS content_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER NOT NULL REFERENCES contents(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(content_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS content_collects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER NOT NULL REFERENCES contents(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(content_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS material_brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      logo_url TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS material_samples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id INTEGER NOT NULL REFERENCES material_brands(id),
      name TEXT NOT NULL,
      image_url TEXT,
      specifications TEXT,
      price DECIMAL(10,2),
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS material_dealers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id INTEGER NOT NULL REFERENCES material_brands(id),
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      latitude DECIMAL(10,6),
      longitude DECIMAL(10,6),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cohost_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      live_id INTEGER NOT NULL REFERENCES lives(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS content_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER NOT NULL REFERENCES contents(id),
      reviewer_id INTEGER REFERENCES users(id),
      result TEXT,
      reason TEXT,
      reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS kol_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kol_id INTEGER NOT NULL REFERENCES users(id),
      live_id INTEGER REFERENCES lives(id),
      share_ratio DECIMAL(5,2) DEFAULT 50.00,
      settlement_status TEXT DEFAULT 'unsettled',
      scheduled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      preference_type TEXT NOT NULL,
      preference_value TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

const seedData = () => {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count
  if (userCount > 0) return

  const hashPassword = (password: string) => bcrypt.hashSync(password, 10)

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, role, phone, email, nickname, certification_type, certification_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertUser.run('admin', hashPassword('admin123'), 'admin', '13800000000', 'admin@example.com', '管理员', null, 'none')

  const hostId = insertUser.run('host', hashPassword('host123'), 'host', '13800000001', 'host@example.com', '张顾问', 'real_estate_broker', 'approved').lastInsertRowid
  const designerId = insertUser.run('designer', hashPassword('designer123'), 'designer', '13800000002', 'designer@example.com', '李设计师', 'interior_designer', 'approved').lastInsertRowid
  const agentId = insertUser.run('agent', hashPassword('agent123'), 'agent', '13800000003', 'agent@example.com', '王置业', 'real_estate_agent', 'approved').lastInsertRowid
  const expertId = insertUser.run('expert', hashPassword('expert123'), 'expert', '13800000004', 'expert@example.com', '陈专家', 'lawyer', 'approved').lastInsertRowid

  const userIds = []
  for (let i = 1; i <= 3; i++) {
    const id = insertUser.run(`user${i}`, hashPassword('user123'), 'user', `1380000010${i}`, `user${i}@example.com`, `用户${i}`, null, 'none').lastInsertRowid
    userIds.push(id)
  }
  const userId = insertUser.run('user', hashPassword('user123'), 'user', '13800000100', 'user@example.com', '购房者', null, 'none').lastInsertRowid
  userIds.push(userId)

  const insertLive = db.prepare(`
    INSERT INTO lives (host_id, title, cover_image, category, status, viewer_count, stream_url, scheduled_at, started_at, ended_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

  const live1Id = insertLive.run(hostId, '热门新盘现场看房', 'https://picsum.photos/seed/live1/1200/600', 'house_viewing', 'live', 1256, 'rtmp://example.com/live/1', null, twoHoursAgo.toISOString(), null).lastInsertRowid
  const live2Id = insertLive.run(designerId, '装修设计避坑指南', 'https://picsum.photos/seed/live2/1200/600', 'decoration', 'live', 892, 'rtmp://example.com/live/2', null, twoHoursAgo.toISOString(), null).lastInsertRowid
  const live3Id = insertLive.run(agentId, '周末二手房专场', 'https://picsum.photos/seed/live3/1200/600', 'house_viewing', 'scheduled', 0, null, tomorrow.toISOString(), null, null).lastInsertRowid
  const live4Id = insertLive.run(expertId, '往期装修案例回顾', 'https://picsum.photos/seed/live4/1200/600', 'decoration', 'ended', 3421, null, yesterday.toISOString(), yesterday.toISOString(), twoHoursAgo.toISOString()).lastInsertRowid

  const insertDanmaku = db.prepare(`
    INSERT INTO danmaku (live_id, user_id, username, content)
    VALUES (?, ?, ?, ?)
  `)

  const danmakuContents = ['这个楼盘位置不错', '价格是多少？', '有学区吗？', '装修风格很好看', '主播讲得很专业', '有没有优惠活动', '得房率多少', '绿化率怎么样']
  for (let i = 0; i < 8; i++) {
    const userIndex = i % userIds.length
    insertDanmaku.run(live1Id, userIds[userIndex], `用户${userIndex + 1}`, danmakuContents[i])
  }

  const insertProperty = db.prepare(`
    INSERT INTO properties (publisher_id, title, property_type, listing_type, price, area, layout, floor_info, orientation, decoration_status, address, city, district, community, images, description, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const properties = [
    [hostId, '朝阳区精装三居 南北通透', 'new_house', 'sale', 6800000.00, 120.50, '3室2厅2卫', '中楼层/28层', '南北', '精装', '北京市朝阳区建国路88号', '北京', '朝阳区', '阳光花园', JSON.stringify(['https://picsum.photos/seed/prop1a/800/600', 'https://picsum.photos/seed/prop1b/800/600']), '核心地段，配套完善，交通便利', 'active'],
    [agentId, '海淀区地铁口学区房', 'new_house', 'sale', 8500000.00, 95.00, '2室1厅1卫', '高楼层/32层', '东南', '毛坯', '北京市海淀区中关村大街1号', '北京', '海淀区', '学府家园', JSON.stringify(['https://picsum.photos/seed/prop2a/800/600']), '优质学区，地铁直达，升值潜力大', 'active'],
    [hostId, '浦东新区江景豪宅', 'second_hand', 'sale', 12000000.00, 180.00, '4室2厅3卫', '高楼层/45层', '南北', '豪装', '上海市浦东新区滨江大道100号', '上海', '浦东新区', '江景壹号', JSON.stringify(['https://picsum.photos/seed/prop3a/800/600', 'https://picsum.photos/seed/prop3b/800/600']), '一线江景，豪华装修，品牌物业', 'active'],
    [agentId, '西湖区优质二手房', 'second_hand', 'sale', 4500000.00, 89.00, '3室1厅1卫', '中楼层/18层', '南', '简装', '杭州市西湖区文三路200号', '杭州', '西湖区', '文苑小区', JSON.stringify(['https://picsum.photos/seed/prop4a/800/600']), '成熟社区，配套齐全，生活便利', 'active'],
    [hostId, '天河区精品公寓', 'apartment', 'rent', 5500.00, 45.00, '1室1厅1卫', '高楼层/25层', '南', '精装', '广州市天河区体育西路50号', '广州', '天河区', '都市公寓', JSON.stringify(['https://picsum.photos/seed/prop5a/800/600']), 'CBD核心，拎包入住，交通便捷', 'active'],
    [agentId, '南山区酒店式公寓', 'apartment', 'rent', 8000.00, 65.00, '2室1厅1卫', '中楼层/30层', '东南', '豪装', '深圳市南山区科技园路88号', '深圳', '南山区', '科技公寓', JSON.stringify(['https://picsum.photos/seed/prop6a/800/600']), '科技园核心，酒店式管理，配套完善', 'active'],
  ]

  properties.forEach(p => insertProperty.run(...p))

  const insertCompany = db.prepare(`
    INSERT INTO renovation_companies (name, license_no, certification_status, qualification_level, cases_count, rating, contact_phone, description, logo_url, annual_review_date, annual_review_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const company1Id = insertCompany.run('尚品装饰工程有限公司', 'LIC20240001', 'approved', '一级', 128, 4.8, '400-800-0001', '专业家装15年，用心打造温馨家园', 'https://picsum.photos/seed/company1/200/100', '2026-12-31', 'pending').lastInsertRowid
  const company2Id = insertCompany.run('雅居设计装饰', 'LIC20240002', 'approved', '二级', 86, 4.6, '400-800-0002', '专注高端设计，品质生活缔造者', 'https://picsum.photos/seed/company2/200/100', '2026-06-30', 'pending').lastInsertRowid
  const company3Id = insertCompany.run('宜居整装', 'LIC20240003', 'approved', '一级', 156, 4.9, '400-800-0003', '一站式整装服务，省心省钱省时间', 'https://picsum.photos/seed/company3/200/100', '2025-03-15', 'overdue').lastInsertRowid

  const insertCase = db.prepare(`
    INSERT INTO renovation_cases (company_id, title, style, budget, area, images, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  insertCase.run(company1Id, '现代简约三居室', '现代简约', 150000.00, 120.00, JSON.stringify(['https://picsum.photos/seed/case1/800/600']), '简洁大方，实用性强，适合年轻家庭')
  insertCase.run(company1Id, '北欧风格两居室', '北欧', 120000.00, 90.00, JSON.stringify(['https://picsum.photos/seed/case2/800/600']), '清新自然，温馨舒适')
  insertCase.run(company2Id, '新中式豪宅', '新中式', 500000.00, 200.00, JSON.stringify(['https://picsum.photos/seed/case3/800/600']), '东方美学与现代生活的完美融合')
  insertCase.run(company2Id, '美式乡村公寓', '美式乡村', 200000.00, 110.00, JSON.stringify(['https://picsum.photos/seed/case4/800/600']), '回归自然，享受生活')
  insertCase.run(company3Id, '轻奢风大平层', '轻奢', 350000.00, 160.00, JSON.stringify(['https://picsum.photos/seed/case5/800/600']), '低调奢华，品质生活')
  insertCase.run(company3Id, '日式极简小户型', '日式', 80000.00, 60.00, JSON.stringify(['https://picsum.photos/seed/case6/800/600']), '小空间大智慧，极致收纳')

  const insertQuoteItems = [
    [
      { name: '墙面乳胶漆', unit: 'm²', quantity: 200, price: 45, total: 9000 },
      { name: '地面瓷砖', unit: 'm²', quantity: 100, price: 180, total: 18000 },
      { name: '吊顶造型', unit: 'm²', quantity: 30, price: 280, total: 8400 },
      { name: '水电改造', unit: '项', quantity: 1, price: 15000, total: 15000 },
    ],
    [
      { name: '墙面乳胶漆', unit: 'm²', quantity: 200, price: 55, total: 11000 },
      { name: '地面瓷砖', unit: 'm²', quantity: 100, price: 200, total: 20000 },
      { name: '吊顶造型', unit: 'm²', quantity: 30, price: 320, total: 9600 },
      { name: '水电改造', unit: '项', quantity: 1, price: 18000, total: 18000 },
      { name: '防水工程', unit: 'm²', quantity: 50, price: 120, total: 6000 },
    ],
    [
      { name: '墙面乳胶漆', unit: 'm²', quantity: 200, price: 50, total: 10000 },
      { name: '地面地板', unit: 'm²', quantity: 100, price: 250, total: 25000 },
      { name: '吊顶造型', unit: 'm²', quantity: 30, price: 300, total: 9000 },
      { name: '水电改造', unit: '项', quantity: 1, price: 16000, total: 16000 },
    ],
  ]

  const insertQuote = db.prepare(`
    INSERT INTO renovation_quotes (company_id, order_id, items_json, total_price, status)
    VALUES (?, ?, ?, ?, ?)
  `)

  insertQuote.run(company1Id, null, JSON.stringify(insertQuoteItems[0]), 50400.00, 'pending')
  insertQuote.run(company2Id, null, JSON.stringify(insertQuoteItems[1]), 64600.00, 'pending')
  insertQuote.run(company3Id, null, JSON.stringify(insertQuoteItems[2]), 60000.00, 'pending')

  const insertContent = db.prepare(`
    INSERT INTO contents (author_id, title, content_type, body, media_urls, like_count, collect_count, view_count, review_status, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertContent.run(hostId, '2024年房产市场趋势分析', 'article', '随着政策调整，2024年房产市场呈现出新的特点...', JSON.stringify(['https://picsum.photos/seed/article1/800/400']), 156, 89, 2345, 'approved', JSON.stringify(['房产趋势', '市场分析']))
  insertContent.run(designerId, '装修前必须知道的10个坑', 'article', '很多人装修时都会踩坑，今天总结10个常见问题...', JSON.stringify(['https://picsum.photos/seed/article2/800/400']), 234, 156, 5678, 'approved', JSON.stringify(['装修', '避坑指南']))
  insertContent.run(agentId, '如何挑选适合自己的户型', 'video', '选户型是买房的重要环节，需要注意以下几点...', JSON.stringify(['https://picsum.photos/seed/video1/800/400']), 456, 234, 8901, 'approved', JSON.stringify(['户型', '买房技巧']))
  insertContent.run(expertId, '小户型收纳设计技巧', 'video', '小户型如何实现大收纳？这些设计技巧要知道...', JSON.stringify(['https://picsum.photos/seed/video2/800/400']), 321, 198, 4567, 'pending', JSON.stringify(['小户型', '收纳', '设计']))

  const insertBrand = db.prepare(`
    INSERT INTO material_brands (name, category, logo_url, description)
    VALUES (?, ?, ?, ?)
  `)

  const brand1Id = insertBrand.run('诺贝尔瓷砖', '瓷砖', 'https://picsum.photos/seed/brand1/200/100', '中国瓷砖领导品牌，品质保证').lastInsertRowid
  const brand2Id = insertBrand.run('索菲亚衣柜', '定制家具', 'https://picsum.photos/seed/brand2/200/100', '定制衣柜行业领军品牌').lastInsertRowid
  const brand3Id = insertBrand.run('立邦涂料', '涂料', 'https://picsum.photos/seed/brand3/200/100', '全球知名涂料品牌，环保健康').lastInsertRowid

  const insertSample = db.prepare(`
    INSERT INTO material_samples (brand_id, name, image_url, specifications, price, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  insertSample.run(brand1Id, '诺贝尔抛光砖800x800', 'https://picsum.photos/seed/sample1a/600/400', '800x800mm', 198.00, '瓷砖')
  insertSample.run(brand1Id, '诺贝尔仿古砖600x600', 'https://picsum.photos/seed/sample1b/600/400', '600x600mm', 128.00, '瓷砖')
  insertSample.run(brand2Id, '索菲亚定制衣柜', 'https://picsum.photos/seed/sample2a/600/400', '定制', 899.00, '定制家具')
  insertSample.run(brand2Id, '索菲亚榻榻米', 'https://picsum.photos/seed/sample2b/600/400', '定制', 1299.00, '定制家具')
  insertSample.run(brand3Id, '立邦净味120', 'https://picsum.photos/seed/sample3a/600/400', '5L', 398.00, '涂料')
  insertSample.run(brand3Id, '立邦儿童漆', 'https://picsum.photos/seed/sample3b/600/400', '5L', 698.00, '涂料')

  const insertDealer = db.prepare(`
    INSERT INTO material_dealers (brand_id, name, address, phone, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  insertDealer.run(brand1Id, '诺贝尔北京专卖店', '北京市朝阳区居然之家1层', '010-88880001', 39.9042, 116.4074)
  insertDealer.run(brand1Id, '诺贝尔上海专卖店', '上海市浦东新区红星美凯龙2层', '021-88880001', 31.2304, 121.4737)
  insertDealer.run(brand2Id, '索菲亚北京旗舰店', '北京市海淀区北四环中路2号', '010-88880002', 39.9842, 116.3074)
  insertDealer.run(brand2Id, '索菲亚广州专卖店', '广州市天河区珠江新城', '020-88880002', 23.1291, 113.2644)
  insertDealer.run(brand3Id, '立邦北京体验店', '北京市丰台区南三环西路', '010-88880003', 39.8542, 116.3574)
  insertDealer.run(brand3Id, '立邦深圳专卖店', '深圳市南山区科技园', '0755-88880003', 22.5431, 113.9458)
}

createTables()
seedData()

export default db
