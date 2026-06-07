const Database = require('better-sqlite3')
const path = require('path')
const bcrypt = require('bcryptjs')

function initDatabase() {
  const dbPath = path.join(__dirname, '../../data/app.sqlite')
  const db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'couple',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS couples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      partner_name TEXT,
      wedding_date DATE,
      budget_total REAL DEFAULT 0,
      style_tags TEXT,
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS budget_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      budget_amount REAL DEFAULT 0,
      actual_amount REAL DEFAULT 0,
      percentage REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      company_name TEXT,
      category TEXT,
      address TEXT,
      latitude REAL,
      longitude REAL,
      description TEXT,
      phone TEXT,
      rating REAL DEFAULT 5.0,
      review_count INTEGER DEFAULT 0,
      credit_score INTEGER DEFAULT 80,
      certification_status TEXT DEFAULT 'pending',
      certification_files TEXT,
      business_license TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS merchant_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      images TEXT,
      cover_image TEXT,
      style_tags TEXT,
      price REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER NOT NULL,
      date DATE NOT NULL,
      time_slots TEXT,
      is_booked INTEGER DEFAULT 0,
      order_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(merchant_id, date),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL,
      original_price REAL,
      images TEXT,
      cover_image TEXT,
      
      photoshoot_photos INTEGER,
      photoshoot_retouched INTEGER,
      photoshoot_delivery_days INTEGER,
      
      banquet_capacity INTEGER,
      banquet_3d_url TEXT,
      banquet_deposit REAL,
      banquet_deposit_rules TEXT,
      
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wedding_guides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      stage TEXT,
      stage_days INTEGER,
      check_points TEXT,
      risk_tips TEXT,
      related_merchant_ids TEXT,
      view_count INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      couple_id INTEGER NOT NULL,
      merchant_id INTEGER NOT NULL,
      service_id INTEGER,
      service_name TEXT,
      service_type TEXT,
      total_amount REAL NOT NULL,
      deposit_amount REAL,
      deposit_status TEXT DEFAULT 'pending',
      order_date DATE,
      status TEXT DEFAULT 'pending',
      
      contract_signed INTEGER DEFAULT 0,
      contract_signature_couple TEXT,
      contract_signature_merchant TEXT,
      contract_signed_at DATETIME,
      
      confirmed_at DATETIME,
      visited_at DATETIME,
      delivered_at DATETIME,
      reviewed_at DATETIME,
      cancelled_at DATETIME,
      
      cancel_reason TEXT,
      penalty_amount REAL DEFAULT 0,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS order_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      remark TEXT,
      operator TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER UNIQUE NOT NULL,
      couple_id INTEGER NOT NULL,
      merchant_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      content TEXT,
      images TEXT,
      is_negative INTEGER DEFAULT 0,
      merchant_reply TEXT,
      reply_sla_time INTEGER,
      replied_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      couple_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      event_date DATETIME,
      category TEXT,
      is_completed INTEGER DEFAULT 0,
      order_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      is_read INTEGER DEFAULT 0,
      related_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS funnel_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage TEXT NOT NULL,
      count INTEGER DEFAULT 0,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(stage, date)
    );

    CREATE TABLE IF NOT EXISTS trend_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      region TEXT NOT NULL,
      category TEXT NOT NULL,
      value REAL DEFAULT 0,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(region, category, date)
    );
  `)

  const adminCheck = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?')
  const { count } = adminCheck.get('admin')
  if (count === 0) {
    const hash = bcrypt.hashSync('123456', 10)
    const insertAdmin = db.prepare('INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)')
    insertAdmin.run('13800138000', hash, '管理员', 'admin')
  }

  const coupleCheck = db.prepare('SELECT COUNT(*) as count FROM users WHERE phone = ?')
  const coupleResult = coupleCheck.get('13800138001')
  if (coupleResult.count === 0) {
    const hash = bcrypt.hashSync('123456', 10)
    const insertCouple = db.prepare('INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)')
    const userId = insertCouple.run('13800138001', hash, '张三', 'couple').lastInsertRowid
    
    const insertCoupleProfile = db.prepare('INSERT INTO couples (user_id, partner_name, wedding_date, budget_total, style_tags, location) VALUES (?, ?, ?, ?, ?, ?)')
    insertCoupleProfile.run(userId, '李四', '2024-10-01', 150000, '["ins风","极简","森系"]', '北京市朝阳区')
  }

  const merchantCheck = db.prepare('SELECT COUNT(*) as count FROM users WHERE phone = ?')
  const merchantResult = merchantCheck.get('13800138002')
  if (merchantResult.count === 0) {
    const hash = bcrypt.hashSync('123456', 10)
    const insertMerchant = db.prepare('INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)')
    const userId = insertMerchant.run('13800138002', hash, '幸福时光婚纱摄影', 'merchant').lastInsertRowid
    
    const insertMerchantProfile = db.prepare('INSERT INTO merchants (user_id, company_name, category, address, latitude, longitude, description, phone, rating, review_count, credit_score, certification_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    insertMerchantProfile.run(userId, '幸福时光婚纱摄影', '婚纱摄影', '北京市朝阳区建国路88号', 39.9042, 116.4074, '专业婚纱摄影15年，服务上万对新人', '13800138002', 4.8, 256, 92, 'approved')
  }

  const guideCheck = db.prepare('SELECT COUNT(*) as count FROM wedding_guides')
  const guideCount = guideCheck.get().count
  if (guideCount === 0) {
    const guides = [
      { title: '婚礼前12个月筹备清单', content: '确定婚期、预订酒店、拍婚纱照', stage: '12个月前', stage_days: 365, check_points: '["确定婚期","预订酒店","拍婚纱照"]', risk_tips: '["热门日期需提前预订"]', sort_order: 1 },
      { title: '婚礼前6个月重点事项', content: '选择婚庆公司、确定礼服、选购婚戒', stage: '6个月前', stage_days: 180, check_points: '["选择婚庆公司","确定礼服","选购婚戒"]', risk_tips: '["礼服定制需要时间"]', sort_order: 2 },
      { title: '婚礼前3个月细节确认', content: '确定婚宴菜单、发送请柬、购买喜品', stage: '3个月前', stage_days: 90, check_points: '["确定婚宴菜单","发送请柬","购买喜品"]', risk_tips: '["请柬提前发送留足RSVP时间"]', sort_order: 3 },
      { title: '婚礼前1个月最终确认', content: '确认所有供应商、试妆、确定流程', stage: '1个月前', stage_days: 30, check_points: '["确认所有供应商","试妆","确定流程"]', risk_tips: '["确认来宾人数"]', sort_order: 4 },
      { title: '婚礼前1周准备', content: '确认行程、准备证件、美甲美容', stage: '1周前', stage_days: 7, check_points: '["确认行程","准备证件","美甲美容"]', risk_tips: '["提前休息好"]', sort_order: 5 }
    ]
    
    const insertGuide = db.prepare('INSERT INTO wedding_guides (title, content, stage, stage_days, check_points, risk_tips, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)')
    guides.forEach(g => insertGuide.run(g.title, g.content, g.stage, g.stage_days, g.check_points, g.risk_tips, g.sort_order))
  }

  const serviceCheck = db.prepare('SELECT COUNT(*) as count FROM services')
  const serviceCount = serviceCheck.get().count
  if (serviceCount === 0) {
    const merchant = db.prepare('SELECT id FROM merchants WHERE company_name = ?').get('幸福时光婚纱摄影')
    if (merchant) {
      const insertService = db.prepare(`
        INSERT INTO services (merchant_id, type, name, description, price, original_price, cover_image,
                              photoshoot_photos, photoshoot_retouched, photoshoot_delivery_days,
                              banquet_capacity, banquet_3d_url, banquet_deposit, banquet_deposit_rules, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      insertService.run(merchant.id, '婚纱摄影', '浪漫唯美婚纱摄影套餐', '包含室内+外景拍摄，专业化妆造型', 8888, 12888, 'https://picsum.photos/400/250?random=1', 120, 60, 30, null, null, null, null, 'active')
      insertService.run(merchant.id, '婚纱摄影', '轻奢旅拍婚纱照', '三亚/丽江/大理可选，含住宿', 15888, 21888, 'https://picsum.photos/400/250?random=2', 200, 100, 45, null, null, null, null, 'active')
      insertService.run(merchant.id, '婚纱摄影', '经典纪实婚纱摄影', '自然纪实风格，真实记录幸福瞬间', 5888, 8888, 'https://picsum.photos/400/250?random=3', 80, 40, 21, null, null, null, null, 'active')
    }
  }

  console.log('Database initialized successfully')
  return db
}

module.exports = initDatabase
