const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dbDir = path.join(__dirname, '../../data')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = path.join(dbDir, 'app.sqlite')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      nickname TEXT,
      avatar TEXT,
      password_hash TEXT NOT NULL,
      credit_score INTEGER DEFAULT 650,
      tags TEXT DEFAULT '[]',
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      logo TEXT,
      category_id INTEGER,
      business_domain TEXT NOT NULL,
      address TEXT,
      latitude REAL,
      longitude REAL,
      phone TEXT,
      status TEXT DEFAULT 'pending',
      qualification TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER DEFAULT 0,
      business_domain TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      image TEXT,
      price DECIMAL(10,2) NOT NULL,
      original_price DECIMAL(10,2),
      stock INTEGER DEFAULT 0,
      category_id INTEGER,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      merchant_id INTEGER NOT NULL,
      business_domain TEXT NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      discount_amount DECIMAL(10,2) DEFAULT 0,
      pay_amount DECIMAL(10,2) NOT NULL,
      status TEXT DEFAULT 'pending',
      address TEXT,
      phone TEXT,
      remark TEXT,
      coupon_id INTEGER,
      rider_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      quantity INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS order_status_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      operator TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      value DECIMAL(10,2) NOT NULL,
      min_amount DECIMAL(10,2) DEFAULT 0,
      business_domain TEXT,
      category_id INTEGER,
      merchant_id INTEGER,
      total_count INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      start_time DATETIME,
      end_time DATETIME,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      coupon_id INTEGER NOT NULL,
      status TEXT DEFAULT 'unused',
      obtained_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      used_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (coupon_id) REFERENCES coupons(id)
    );

    CREATE TABLE IF NOT EXISTS rider_tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      rider_id INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS risk_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rule_type TEXT NOT NULL,
      condition TEXT NOT NULL,
      action TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER NOT NULL,
      auditor_id INTEGER,
      status TEXT NOT NULL,
      remark TEXT,
      ocr_result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );
  `)

  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count
  if (categoryCount === 0) {
    const insertCategory = db.prepare(
      'INSERT INTO categories (name, parent_id, business_domain, sort_order) VALUES (?, ?, ?, ?)'
    )
    
    const categories = [
      { name: '美食外卖', parent: 0, domain: 'takeout', order: 1 },
      { name: '火锅', parent: 1, domain: 'takeout', order: 1 },
      { name: '烧烤', parent: 1, domain: 'takeout', order: 2 },
      { name: '快餐', parent: 1, domain: 'takeout', order: 3 },
      { name: '到店消费', parent: 0, domain: 'instore', order: 2 },
      { name: 'KTV', parent: 5, domain: 'instore', order: 1 },
      { name: '按摩足疗', parent: 5, domain: 'instore', order: 2 },
      { name: '出行服务', parent: 0, domain: 'travel', order: 3 },
      { name: '打车', parent: 8, domain: 'travel', order: 1 },
      { name: '共享单车', parent: 8, domain: 'travel', order: 2 },
      { name: '旅游酒店', parent: 0, domain: 'tourism', order: 4 },
      { name: '酒店', parent: 11, domain: 'tourism', order: 1 },
      { name: '景点门票', parent: 11, domain: 'tourism', order: 2 },
    ]

    categories.forEach(c => insertCategory.run(c.name, c.parent, c.domain, c.order))
  }

  const bcrypt = require('bcryptjs')
  const demoPasswordHash = bcrypt.hashSync('123456', 10)
  const ensureDemoUser = (phone, nickname, role) => {
    const existing = db.prepare('SELECT id, nickname, role FROM users WHERE phone = ?').get(phone)
    if (!existing) {
      db.prepare('INSERT INTO users (phone, nickname, password_hash, role) VALUES (?, ?, ?, ?)').run(
        phone, nickname, demoPasswordHash, role
      )
      return
    }

    if (existing.nickname !== nickname || existing.role !== role) {
      db.prepare('UPDATE users SET nickname = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ?').run(
        nickname, role, phone
      )
    }
  }

  ensureDemoUser('13800138000', '管理员', 'admin')
  ensureDemoUser('13800138001', '测试用户', 'user')
  ensureDemoUser('13800138002', '商户体验号', 'merchant')
  ensureDemoUser('13800138003', '骑手体验号', 'rider')

  const merchantCount = db.prepare('SELECT COUNT(*) as count FROM merchants').get().count
  if (merchantCount === 0) {
    const sampleMerchants = [
      {
      name: '川味火锅城',
      description: '正宗四川火锅，麻辣鲜香，传承百年老汤底',
      business_domain: 'takeout',
      category_id: 2,
      address: '北京市朝阳区建国路88号',
      latitude: 39.9042,
      longitude: 116.4074,
      phone: '010-88888888',
      status: 'approved'
    },
    {
      name: '烧烤之王',
      description: '深夜食堂，各式烧烤，夜宵首选',
      business_domain: 'takeout',
      category_id: 3,
      address: '北京市海淀区中关村大街1号',
      latitude: 39.9847,
      longitude: 116.3046,
      phone: '010-66666666',
      status: 'approved'
    },
    {
      name: '快乐柠檬奶茶店',
      description: '新鲜水果，新鲜茶饮，健康生活',
      business_domain: 'takeout',
      category_id: 4,
      address: '北京市西城区西单北大街',
      latitude: 39.9139,
      longitude: 116.3712,
      phone: '010-77777777',
      status: 'approved'
    },
    {
      name: '星光KTV',
      description: '豪华包间，专业音响，欢唱时光',
      business_domain: 'instore',
      category_id: 6,
      address: '北京市东城区王府井大街',
      latitude: 39.9147,
      longitude: 116.4108,
      phone: '010-55555555',
      status: 'approved'
    },
    {
      name: '御足轩养生馆',
      description: '专业足疗，舒适享受',
      business_domain: 'instore',
      category_id: 7,
      address: '北京市丰台区南三环西路',
      latitude: 39.8586,
      longitude: 116.3648,
      phone: '010-44444444',
      status: 'approved'
    },
    {
      name: '快捷出行网约车',
      description: '随叫随到，安全出行',
      business_domain: 'travel',
      category_id: 9,
      address: '北京市全市服务',
      latitude: 39.9042,
      longitude: 116.4074,
      phone: '400-123-4567',
      status: 'approved'
    },
    {
      name: '共享单车运营中心',
      description: '绿色出行，低碳生活',
      business_domain: 'travel',
      category_id: 10,
      address: '北京市全市服务',
      latitude: 39.9042,
      longitude: 116.4074,
      phone: '400-765-4321',
      status: 'approved'
    },
    {
      name: '皇家大酒店',
      description: '五星级酒店，奢华享受，贴心服务',
      business_domain: 'tourism',
      category_id: 12,
      address: '北京市朝阳区国贸中心',
      latitude: 39.9087,
      longitude: 116.4406,
      phone: '010-99999999',
      status: 'approved'
    },
    {
      name: '故宫门票预订中心',
      description: '景点门票一站式预订',
      business_domain: 'tourism',
      category_id: 13,
      address: '北京市东城区景山前街4号',
      latitude: 39.9163,
      longitude: 116.3972,
      phone: '010-11111111',
      status: 'approved'
    },
    {
      name: '等待审核的餐厅',
      description: '新商户申请入驻中...',
      business_domain: 'takeout',
      category_id: 4,
      address: '北京市通州区新华大街',
      latitude: 39.9042,
      longitude: 116.6543,
      phone: '010-22222222',
      status: 'pending'
    }
    ]

    const insertMerchant = db.prepare(
      'INSERT INTO merchants (user_id, name, description, business_domain, category_id, address, latitude, longitude, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )

    sampleMerchants.forEach(m => {
      insertMerchant.run(1, m.name, m.description, m.business_domain, m.category_id, m.address, m.latitude, m.longitude, m.phone, m.status)
    })

    const sampleProducts = [
      { merchant_id: 1, name: '麻辣鸳鸯锅', description: '经典鸳鸯锅底', price: 68.00, original_price: 88.00, stock: 100 },
      { merchant_id: 1, name: '精品肥牛', description: '精选肥牛卷', price: 48.00, original_price: 58.00, stock: 200 },
      { merchant_id: 1, name: '鲜毛肚', description: '新鲜毛肚', price: 38.00, original_price: 48.00, stock: 150 },
      { merchant_id: 1, name: '手工虾滑', description: '手工打制', price: 32.00, original_price: 42.00, stock: 100 },
      { merchant_id: 2, name: '羊肉串', description: '新鲜羊肉串', price: 5.00, original_price: 6.00, stock: 500 },
      { merchant_id: 2, name: '烤茄子', description: '蒜蓉烤茄子', price: 12.00, original_price: 15.00, stock: 100 },
      { merchant_id: 2, name: '烤生蚝', description: '新鲜生蚝', price: 8.00, original_price: 10.00, stock: 200 },
      { merchant_id: 2, name: '烤韭菜', description: '鲜香烤韭菜', price: 6.00, original_price: 8.00, stock: 200 },
      { merchant_id: 3, name: '珍珠奶茶', description: '经典珍珠奶茶', price: 18.00, original_price: 22.00, stock: 300 },
      { merchant_id: 3, name: '柠檬茶', description: '新鲜柠檬茶', price: 15.00, original_price: 18.00, stock: 300 },
      { merchant_id: 3, name: '水果茶', description: '多种水果茶', price: 22.00, original_price: 26.00, stock: 200 },
      { merchant_id: 3, name: '抹茶拿铁', description: '日式抹茶拿铁', price: 25.00, original_price: 30.00, stock: 150 },
      { merchant_id: 4, name: '小包3小时欢唱', description: '下午场小包3小时', price: 98.00, original_price: 158.00, stock: 50 },
      { merchant_id: 4, name: '中包3小时欢唱', description: '下午场中包3小时', price: 138.00, original_price: 198.00, stock: 30 },
      { merchant_id: 4, name: '夜猫场套餐', description: '夜猫场6小时', price: 168.00, original_price: 258.00, stock: 50 },
      { merchant_id: 4, name: '豪华大包3小时', description: '豪华大包3小时', price: 268.00, original_price: 368.00, stock: 20 },
      { merchant_id: 5, name: '足底按摩60分钟', description: '专业足底按摩', price: 128.00, original_price: 168.00, stock: 100 },
      { merchant_id: 5, name: '全身推拿90分钟', description: '全身放松推拿', price: 198.00, original_price: 268.00, stock: 50 },
      { merchant_id: 5, name: '拔罐刮痧套餐', description: '拔罐+刮痧', price: 88.00, original_price: 128.00, stock: 100 },
      { merchant_id: 5, name: '精油开背', description: '精油开背按摩', price: 158.00, original_price: 198.00, stock: 80 },
      { merchant_id: 6, name: '舒适型专车', description: '舒适型车辆服务', price: 15.00, original_price: 18.00, stock: 999 },
      { merchant_id: 6, name: '商务型专车', description: '商务型车辆服务', price: 25.00, original_price: 30.00, stock: 999 },
      { merchant_id: 6, name: '豪华型专车', description: '豪华型车辆服务', price: 45.00, original_price: 55.00, stock: 999 },
      { merchant_id: 7, name: '共享单车月卡', description: '30天骑行卡', price: 15.00, original_price: 20.00, stock: 9999 },
      { merchant_id: 7, name: '共享单车次卡10次', description: '10次骑行卡', price: 10.00, original_price: 15.00, stock: 9999 },
      { merchant_id: 7, name: '共享单车季卡', description: '90天骑行卡', price: 35.00, original_price: 50.00, stock: 9999 },
      { merchant_id: 8, name: '豪华大床房', description: '豪华大床一晚', price: 588.00, original_price: 688.00, stock: 50 },
      { merchant_id: 8, name: '标准双床房', description: '标准双床一晚', price: 488.00, original_price: 588.00, stock: 50 },
      { merchant_id: 8, name: '总统套房', description: '总统套房一晚', price: 1288.00, original_price: 1588.00, stock: 10 },
      { merchant_id: 8, name: '钟点房3小时', description: '钟点房3小时', price: 198.00, original_price: 258.00, stock: 30 },
      { merchant_id: 9, name: '故宫门票成人票', description: '故宫大门票', price: 60.00, original_price: 70.00, stock: 1000 },
      { merchant_id: 9, name: '故宫门票学生票', description: '学生优惠票', price: 30.00, original_price: 35.00, stock: 500 },
      { merchant_id: 9, name: '故宫+珍宝馆套票', description: '大门票+珍宝馆', price: 80.00, original_price: 90.00, stock: 500 },
      { merchant_id: 9, name: '人工讲解服务', description: '专业导游讲解', price: 100.00, original_price: 120.00, stock: 100 }
    ]

    const insertProduct = db.prepare(
      'INSERT INTO products (merchant_id, name, description, price, original_price, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )

    sampleProducts.forEach(p => {
      insertProduct.run(p.merchant_id, p.name, p.description, p.price, p.original_price, p.stock, 'active')
    })

    const sampleCoupons = [
      { name: '新用户专享券', type: 'fixed', value: 10.00, min_amount: 50.00, business_domain: 'takeout', total_count: 1000, used_count: 0 },
      { name: '外卖满减券', type: 'fixed', value: 5.00, min_amount: 30.00, business_domain: 'takeout', total_count: 5000, used_count: 0 },
      { name: '到店消费8折券', type: 'percent', value: 80.00, min_amount: 100.00, business_domain: 'instore', total_count: 2000, used_count: 0 },
      { name: '酒店立减50元', type: 'fixed', value: 50.00, min_amount: 300.00, business_domain: 'tourism', total_count: 500, used_count: 0 },
      { name: '出行优惠券', type: 'fixed', value: 3.00, min_amount: 10.00, business_domain: 'travel', total_count: 3000, used_count: 0 },
      { name: '全场通用券', type: 'fixed', value: 8.00, min_amount: 0.00, business_domain: null, total_count: 10000, used_count: 0 }
    ]

    const insertCoupon = db.prepare(
      'INSERT INTO coupons (name, type, value, min_amount, business_domain, total_count, used_count, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )

    sampleCoupons.forEach(c => {
      insertCoupon.run(c.name, c.type, c.value, c.min_amount, c.business_domain, c.total_count, c.used_count, 'active')
    })
  }
}

initTables()

module.exports = db
