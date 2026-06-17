import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'data.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function initDatabase(): void {
  const database = getDb()

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      street TEXT NOT NULL,
      address TEXT NOT NULL,
      lng REAL NOT NULL,
      lat REAL NOT NULL,
      phone TEXT DEFAULT '',
      description TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      business_license TEXT DEFAULT '',
      operation_license TEXT DEFAULT '',
      rating REAL DEFAULT 0,
      popularity INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      audited_at TEXT DEFAULT '',
      audited_by TEXT DEFAULT '',
      license_no TEXT DEFAULT '',
      license_expire TEXT DEFAULT '',
      reject_reason TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS business_hours (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      open_time TEXT NOT NULL,
      close_time TEXT NOT NULL,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS merchant_tags (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      original_price REAL NOT NULL,
      price REAL NOT NULL,
      description TEXT DEFAULT '',
      stock INTEGER NOT NULL DEFAULT 0,
      sold INTEGER NOT NULL DEFAULT 0,
      start_time TEXT DEFAULT '',
      end_time TEXT DEFAULT '',
      timeslot_start TEXT DEFAULT '',
      timeslot_end TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      package_id TEXT NOT NULL,
      merchant_id TEXT NOT NULL,
      order_no TEXT NOT NULL UNIQUE,
      verification_code TEXT NOT NULL,
      status TEXT DEFAULT 'paid',
      amount REAL NOT NULL,
      paid_at TEXT DEFAULT '',
      used_at TEXT DEFAULT '',
      expires_at TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (package_id) REFERENCES packages(id),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS verifications (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      merchant_id TEXT NOT NULL,
      verified_by TEXT DEFAULT '',
      verified_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      start_time TEXT DEFAULT '',
      end_time TEXT DEFAULT '',
      status TEXT DEFAULT 'draft',
      cover_image TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS campaign_merchants (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      merchant_id TEXT NOT NULL,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );
  `)

  seedData(database)
}

function seedData(db: Database.Database): void {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) return

  function genCoverImage(name: string, cat: string): string {
    const catColors: Record<string, [string, string]> = {
      food: ['#FF7D00', '#FFA940'],
      entertainment: ['#722ED1', '#B37FEB'],
      leisure: ['#00B42A', '#7BE495'],
      shopping: ['#165DFF', '#4080FF'],
    }
    const [c1, c2] = catColors[cat] || ['#165DFF', '#4080FF']
    const short = name.length > 6 ? name.slice(0, 6) + '..' : name
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="320" height="200" fill="url(#g)"/><rect x="40" y="150" width="240" height="50" fill="rgba(255,255,255,0.9)"/><text x="160" y="180" text-anchor="middle" font-size="16" font-weight="600" fill="#333" font-family="sans-serif">${short}</text><circle cx="160" cy="75" r="30" fill="rgba(255,255,255,0.2)"/><text x="160" y="85" text-anchor="middle" font-size="22" font-weight="bold" fill="white" font-family="serif">${name[0]}</text></svg>`
    return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
  }

  function genLicenseImage(type: string, no: string): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="#F7F8FA" stroke="#165DFF" stroke-width="2"/><rect x="0" y="0" width="300" height="36" fill="#165DFF"/><text x="150" y="24" text-anchor="middle" font-size="14" font-weight="bold" fill="white" font-family="sans-serif">${type}</text><text x="20" y="70" font-size="11" fill="#666" font-family="sans-serif">证照编号</text><text x="20" y="95" font-size="14" font-weight="600" fill="#333" font-family="monospace">${no}</text><text x="20" y="130" font-size="11" fill="#666" font-family="sans-serif">发证机关</text><text x="20" y="155" font-size="12" fill="#333" font-family="sans-serif">松江区市场监督管理局</text><text x="20" y="185" font-size="10" fill="#999" font-family="sans-serif">电子证照示例</text></svg>`
    return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
  }

  const insertUser = db.prepare(`
    INSERT INTO users (id, phone, name, avatar) VALUES (?, ?, ?, ?)
  `)

  const users = [
    { id: 'test-user-001', phone: '13800000001', name: '测试用户', avatar: '' },
    { id: uuidv4(), phone: '13800001111', name: '张伟', avatar: '' },
    { id: uuidv4(), phone: '13800002222', name: '李娜', avatar: '' },
    { id: uuidv4(), phone: '13800003333', name: '王芳', avatar: '' },
    { id: uuidv4(), phone: '13800004444', name: '刘洋', avatar: '' },
    { id: uuidv4(), phone: '13800005555', name: '陈明', avatar: '' },
    { id: uuidv4(), phone: '13800006666', name: '赵丽', avatar: '' },
    { id: uuidv4(), phone: '13800007777', name: '孙强', avatar: '' },
    { id: uuidv4(), phone: '13800008888', name: '周静', avatar: '' },
  ]

  for (const u of users) {
    insertUser.run(u.id, u.phone, u.name, u.avatar)
  }

  const insertMerchant = db.prepare(`
    INSERT INTO merchants (id, name, category, street, address, lng, lat, phone, description, cover_image, business_license, operation_license, rating, popularity, status, audited_at, audited_by, license_no, license_expire, reject_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const merchants = [
    { id: uuidv4(), name: '老松江酒楼', category: 'food', street: '岳阳街道', address: '岳阳街道中山二路128号', lng: 121.2280, lat: 31.0100, phone: '021-57801234', description: '松江老字号本帮菜馆', rating: 4.8, popularity: 950 },
    { id: uuidv4(), name: '大学城美食广场', category: 'food', street: '广富林街道', address: '广富林街道文汇路588号', lng: 121.2150, lat: 31.0350, phone: '021-57802345', description: '大学城周边人气美食聚集地', rating: 4.5, popularity: 820 },
    { id: uuidv4(), name: '方松日式料理', category: 'food', street: '方松街道', address: '方松街道新松江路666号', lng: 121.2100, lat: 31.0200, phone: '021-57803456', description: '正宗日料体验', rating: 4.6, popularity: 680 },
    { id: uuidv4(), name: '永丰火锅王', category: 'food', street: '永丰街道', address: '永丰街道荣乐东路399号', lng: 121.2350, lat: 31.0050, phone: '021-57804567', description: '重庆老火锅松江店', rating: 4.4, popularity: 750 },
    { id: uuidv4(), name: '九里亭奶茶工坊', category: 'food', street: '九里亭街道', address: '九里亭街道沪亭北路218号', lng: 121.2550, lat: 31.1500, phone: '021-57805678', description: '手工现制奶茶', rating: 4.3, popularity: 560 },
    { id: uuidv4(), name: '泗泾羊肉馆', category: 'food', street: '泗泾镇', address: '泗泾镇鼓浪路88号', lng: 121.2450, lat: 31.1100, phone: '021-57806789', description: '泗泾传统羊肉美食', rating: 4.7, popularity: 890 },
    { id: uuidv4(), name: '佘山度假酒店餐厅', category: 'food', street: '佘山镇', address: '佘山镇佘天公路188号', lng: 121.1950, lat: 31.1050, phone: '021-57807890', description: '佘山脚下精致西餐', rating: 4.9, popularity: 720 },
    { id: uuidv4(), name: '欢乐谷主题乐园', category: 'entertainment', street: '佘山镇', address: '佘山镇林湖路888号', lng: 121.1900, lat: 31.1150, phone: '021-37798888', description: '上海欢乐谷大型主题乐园', rating: 4.5, popularity: 2000 },
    { id: uuidv4(), name: '万达影城松江店', category: 'entertainment', street: '中山街道', address: '中山街道茸梅路518号万达广场4楼', lng: 121.2500, lat: 31.0300, phone: '021-57809999', description: 'IMAX影院松江旗舰店', rating: 4.4, popularity: 980 },
    { id: uuidv4(), name: '新桥KTV Party', category: 'entertainment', street: '新桥镇', address: '新桥镇新育路66号', lng: 121.2700, lat: 31.0800, phone: '021-57810000', description: '新桥镇最大KTV娱乐城', rating: 4.2, popularity: 450 },
    { id: uuidv4(), name: '车墩影视基地体验馆', category: 'entertainment', street: '车墩镇', address: '车墩镇北松公路4915号', lng: 121.2650, lat: 31.0150, phone: '021-57811111', description: '上海影视乐园沉浸体验', rating: 4.6, popularity: 1100 },
    { id: uuidv4(), name: '佘山森林公园', category: 'leisure', street: '佘山镇', address: '佘山镇外青松公路9142号', lng: 121.2000, lat: 31.1200, phone: '021-57651666', description: '天然森林氧吧休闲胜地', rating: 4.8, popularity: 1500 },
    { id: uuidv4(), name: '广富林文化遗址', category: 'leisure', street: '广富林街道', address: '广富林街道广富林路3260号', lng: 121.2200, lat: 31.0400, phone: '021-57812222', description: '上海之根海派之源', rating: 4.9, popularity: 1800 },
    { id: uuidv4(), name: '泰晤士小镇', category: 'leisure', street: '方松街道', address: '方松街道三新北路900弄', lng: 121.2050, lat: 31.0150, phone: '021-57813333', description: '英伦风情休闲小镇', rating: 4.7, popularity: 1350 },
    { id: uuidv4(), name: '永丰SPA会所', category: 'leisure', street: '永丰街道', address: '永丰街道荣乐中路188号', lng: 121.2300, lat: 31.0080, phone: '021-57814444', description: '高端SPA养生会所', rating: 4.5, popularity: 620 },
    { id: uuidv4(), name: '中山健身房', category: 'leisure', street: '中山街道', address: '中山街道茸平路288号', lng: 121.2480, lat: 31.0350, phone: '021-57815555', description: '24小时智能健身', rating: 4.3, popularity: 530 },
    { id: uuidv4(), name: '万达广场永辉超市', category: 'shopping', street: '中山街道', address: '中山街道茸梅路518号万达广场B1', lng: 121.2500, lat: 31.0320, phone: '021-57816666', description: '松江万达永辉精品超市', rating: 4.4, popularity: 880 },
    { id: uuidv4(), name: '开元地中海商业广场', category: 'shopping', street: '方松街道', address: '方松街道新松江路926号', lng: 121.2120, lat: 31.0250, phone: '021-57817777', description: '松江新城核心商圈', rating: 4.3, popularity: 760 },
    { id: uuidv4(), name: '泗泾古镇特产店', category: 'shopping', street: '泗泾镇', address: '泗泾镇开江路168号', lng: 121.2480, lat: 31.1150, phone: '021-57818888', description: '松江本地特产老字号', rating: 4.5, popularity: 470 },
    { id: uuidv4(), name: '岳阳数码城', category: 'shopping', street: '岳阳街道', address: '岳阳街道中山中路218号', lng: 121.2260, lat: 31.0080, phone: '021-57819999', description: '松江老城区数码购物中心', rating: 4.2, popularity: 390 },
    { id: uuidv4(), name: '九里亭优衣库', category: 'shopping', street: '九里亭街道', address: '九里亭街道沪亭北路299弄', lng: 121.2580, lat: 31.1480, phone: '021-57820000', description: '九里亭地铁口潮流服饰', rating: 4.4, popularity: 580 },
    { id: uuidv4(), name: '新桥家居生活馆', category: 'shopping', street: '新桥镇', address: '新桥镇申港路258号', lng: 121.2750, lat: 31.0750, phone: '021-57821111', description: '一站式家居购物体验', rating: 4.1, popularity: 320 },
    { id: uuidv4(), name: '车墩农贸市场', category: 'shopping', street: '车墩镇', address: '车墩镇车峰路66号', lng: 121.2600, lat: 31.0180, phone: '021-57822222', description: '新鲜农副产品直供', rating: 4.0, popularity: 410 },
  ]

  const now2 = new Date()
  const fmt2 = (d: Date) => d.toISOString().replace('T', ' ').slice(0, 19)
  const addDays2 = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }
  const auditedAt = fmt2(addDays2(now2, -30))
  const licenseExpire = fmt2(addDays2(now2, 365 * 2))

  const auditNames = ['张审核', '李审核', '王审核']
  let mIndex = 0
  for (const m of merchants) {
    const cover = genCoverImage(m.name, m.category)
    const licNo = `SJ${(9131011700000000 + mIndex * 137).toString().slice(0, 15)}`
    const bizLic = genLicenseImage('营业执照', licNo)
    const opLic = genLicenseImage('食品经营许可证', `JY${licNo}`)
    const auditedBy = auditNames[mIndex % auditNames.length]
    insertMerchant.run(m.id, m.name, m.category, m.street, m.address, m.lng, m.lat, m.phone, m.description, cover, bizLic, opLic, m.rating, m.popularity, 'approved', auditedAt, auditedBy, licNo, licenseExpire, '')
    mIndex++
  }

  const pendingMerchants = [
    { id: uuidv4(), name: '松江新城咖啡烘焙', category: 'food', street: '方松街道', address: '方松街道文城路218号', lng: 121.2150, lat: 31.0220, phone: '021-57830000', description: '精品手冲咖啡与手工烘焙', rating: 0, popularity: 0 },
    { id: uuidv4(), name: '九里亭桌游馆', category: 'entertainment', street: '九里亭街道', address: '九里亭街道沪亭北路168号', lng: 121.2560, lat: 31.1490, phone: '021-57831111', description: '沉浸式桌游体验空间', rating: 0, popularity: 0 },
    { id: uuidv4(), name: '岳阳美容美发', category: 'leisure', street: '岳阳街道', address: '岳阳街道中山中路188号', lng: 121.2265, lat: 31.0090, phone: '021-57832222', description: '专业美发造型沙龙', rating: 0, popularity: 0 },
  ]

  const pendingTags: Record<string, string[]> = {
    '松江新城咖啡烘焙': ['咖啡', '烘焙', '新店'],
    '九里亭桌游馆': ['桌游', '聚会', '新店'],
    '岳阳美容美发': ['美发', '美容', '新店'],
  }

  for (let i = 0; i < pendingMerchants.length; i++) {
    const m = pendingMerchants[i]
    const cover = genCoverImage(m.name, m.category)
    const licNo = `PEND${(10000 + i).toString()}`
    const bizLic = genLicenseImage('营业执照（待审核）', licNo)
    const opLic = genLicenseImage('经营许可证（待审核）', `OP${licNo}`)
    const status = i === 2 ? 'rejected' : 'pending'
    const rejectReason = i === 2 ? '门头照模糊，请重新上传清晰照片，并提供有效经营许可证' : ''
    insertMerchant.run(m.id, m.name, m.category, m.street, m.address, m.lng, m.lat, m.phone, m.description, cover, bizLic, opLic, 0, 0, status, '', '', licNo, licenseExpire, rejectReason)
  }

  const insertBusinessHours = db.prepare(`
    INSERT INTO business_hours (id, merchant_id, day_of_week, open_time, close_time) VALUES (?, ?, ?, ?, ?)
  `)

  for (const m of merchants) {
    for (let day = 0; day < 7; day++) {
      if (m.category === 'leisure' && day >= 1 && day <= 5) {
        insertBusinessHours.run(uuidv4(), m.id, day, '08:00', '18:00')
      } else if (m.category === 'entertainment' && (day === 5 || day === 6)) {
        insertBusinessHours.run(uuidv4(), m.id, day, '09:00', '22:00')
      } else if (m.category === 'entertainment') {
        insertBusinessHours.run(uuidv4(), m.id, day, '09:00', '20:00')
      } else if (m.name.includes('健身房')) {
        insertBusinessHours.run(uuidv4(), m.id, day, '06:00', '23:00')
      } else {
        insertBusinessHours.run(uuidv4(), m.id, day, '10:00', '22:00')
      }
    }
  }

  for (let i = 0; i < pendingMerchants.length; i++) {
    const m = pendingMerchants[i]
    for (let day = 0; day < 7; day++) {
      insertBusinessHours.run(uuidv4(), m.id, day, day >= 1 && day <= 5 ? '10:00' : '09:00', day >= 1 && day <= 5 ? '20:00' : '22:00')
    }
  }

  const insertTag = db.prepare(`
    INSERT INTO merchant_tags (id, merchant_id, tag) VALUES (?, ?, ?)
  `)

  const tagMap: Record<string, string[]> = {
    '老松江酒楼': ['本帮菜', '老字号', '宴请'],
    '大学城美食广场': ['小吃', '学生优惠', '聚餐'],
    '方松日式料理': ['日料', '刺身', '约会'],
    '永丰火锅王': ['火锅', '重庆味', '朋友聚会'],
    '九里亭奶茶工坊': ['奶茶', '手作', '下午茶'],
    '泗泾羊肉馆': ['羊肉', '传统美食', '冬季必吃'],
    '佘山度假酒店餐厅': ['西餐', '度假', '精致'],
    '欢乐谷主题乐园': ['游乐', '亲子', '刺激'],
    '万达影城松江店': ['电影', 'IMAX', '约会'],
    '新桥KTV Party': ['KTV', '聚会', '唱歌'],
    '车墩影视基地体验馆': ['影视', '打卡', '文化'],
    '佘山森林公园': ['森林', '踏青', '天然氧吧'],
    '广富林文化遗址': ['历史', '文化', '打卡'],
    '泰晤士小镇': ['英伦', '拍照', '休闲'],
    '永丰SPA会所': ['SPA', '养生', '放松'],
    '中山健身房': ['健身', '24小时', '私教'],
    '万达广场永辉超市': ['超市', '生鲜', '日常'],
    '开元地中海商业广场': ['购物', '餐饮', '休闲'],
    '泗泾古镇特产店': ['特产', '伴手礼', '古镇'],
    '岳阳数码城': ['数码', '电子', '维修'],
    '九里亭优衣库': ['服饰', '日系', '平价'],
    '新桥家居生活馆': ['家居', '装修', '一站式'],
    '车墩农贸市场': ['生鲜', '农产', '实惠'],
  }

  for (const m of merchants) {
    const tags = tagMap[m.name] || ['热门']
    for (const tag of tags) {
      insertTag.run(uuidv4(), m.id, tag)
    }
  }

  for (let i = 0; i < pendingMerchants.length; i++) {
    const m = pendingMerchants[i]
    for (const tag of (pendingTags[m.name] || ['新店'])) {
      insertTag.run(uuidv4(), m.id, tag)
    }
  }

  const insertPackage = db.prepare(`
    INSERT INTO packages (id, merchant_id, name, type, original_price, price, description, stock, sold, start_time, end_time, timeslot_start, timeslot_end, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const now = new Date()
  const fmt = (d: Date) => d.toISOString().replace('T', ' ').slice(0, 19)
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

  const packageData: Array<{ merchantName: string; name: string; type: string; original_price: number; price: number; description: string; stock: number; sold: number; start_time: string; end_time: string; timeslot_start: string; timeslot_end: string }> = [
    { merchantName: '老松江酒楼', name: '招牌红烧肉双人套餐', type: 'discount', original_price: 268, price: 168, description: '含招牌红烧肉、清蒸鲈鱼、时蔬2道、米饭2份', stock: 50, sold: 38, start_time: fmt(now), end_time: fmt(addDays(now, 15)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '老松江酒楼', name: '4人家庭聚餐套餐', type: 'groupbuy', original_price: 588, price: 399, description: '含6菜1汤4米饭，适合家庭聚餐', stock: 30, sold: 22, start_time: fmt(now), end_time: fmt(addDays(now, 20)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '大学城美食广场', name: '学生特惠双人餐', type: 'discount', original_price: 98, price: 58, description: '任选2主食+2饮品，凭学生证使用', stock: 200, sold: 156, start_time: fmt(now), end_time: fmt(addDays(now, 30)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '大学城美食广场', name: '5人欢聚套餐', type: 'groupbuy', original_price: 298, price: 199, description: '5人份主食+小吃拼盘+饮品', stock: 80, sold: 45, start_time: fmt(now), end_time: fmt(addDays(now, 25)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '方松日式料理', name: '午间刺身特惠', type: 'timeslot', original_price: 188, price: 128, description: '午间11:00-14:00刺身拼盘特惠', stock: 40, sold: 28, start_time: fmt(now), end_time: fmt(addDays(now, 20)), timeslot_start: '11:00', timeslot_end: '14:00' },
    { merchantName: '方松日式料理', name: '寿司双人团购', type: 'groupbuy', original_price: 258, price: 178, description: '手握寿司拼盘+味噌汤+抹茶冰淇淋', stock: 60, sold: 42, start_time: fmt(now), end_time: fmt(addDays(now, 18)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '永丰火锅王', name: '晚间火锅折扣', type: 'timeslot', original_price: 328, price: 258, description: '17:00-19:00早鸟火锅套餐', stock: 50, sold: 35, start_time: fmt(now), end_time: fmt(addDays(now, 12)), timeslot_start: '17:00', timeslot_end: '19:00' },
    { merchantName: '永丰火锅王', name: '4人火锅团购', type: 'groupbuy', original_price: 488, price: 358, description: '锅底+6荤4素+饮品4杯', stock: 40, sold: 30, start_time: fmt(now), end_time: fmt(addDays(now, 25)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '九里亭奶茶工坊', name: '买一送一券', type: 'discount', original_price: 28, price: 14, description: '任意饮品买一送一', stock: 500, sold: 380, start_time: fmt(now), end_time: fmt(addDays(now, 30)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '九里亭奶茶工坊', name: '下午茶时段特价', type: 'timeslot', original_price: 32, price: 19, description: '14:00-17:00特调饮品特价', stock: 300, sold: 210, start_time: fmt(now), end_time: fmt(addDays(now, 20)), timeslot_start: '14:00', timeslot_end: '17:00' },
    { merchantName: '泗泾羊肉馆', name: '冬季羊肉锅双人餐', type: 'discount', original_price: 218, price: 148, description: '羊肉锅+凉菜+主食', stock: 60, sold: 52, start_time: fmt(now), end_time: fmt(addDays(now, 10)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '泗泾羊肉馆', name: '6人全羊宴', type: 'groupbuy', original_price: 888, price: 666, description: '全羊宴套餐含8道羊肉菜品', stock: 20, sold: 14, start_time: fmt(now), end_time: fmt(addDays(now, 15)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '佘山度假酒店餐厅', name: '主厨推荐双人西餐', type: 'discount', original_price: 588, price: 428, description: '前菜+主菜+甜点+咖啡', stock: 25, sold: 18, start_time: fmt(now), end_time: fmt(addDays(now, 20)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '欢乐谷主题乐园', name: '周末成人票', type: 'groupbuy', original_price: 230, price: 180, description: '周末全日通票', stock: 500, sold: 420, start_time: fmt(now), end_time: fmt(addDays(now, 30)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '欢乐谷主题乐园', name: '亲子套票', type: 'groupbuy', original_price: 460, price: 340, description: '1大1小亲子票', stock: 300, sold: 256, start_time: fmt(now), end_time: fmt(addDays(now, 30)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '万达影城松江店', name: 'IMAX双人观影', type: 'groupbuy', original_price: 180, price: 118, description: 'IMAX厅双人票+爆米花套餐', stock: 100, sold: 72, start_time: fmt(now), end_time: fmt(addDays(now, 20)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '万达影城松江店', name: '早场特价票', type: 'timeslot', original_price: 80, price: 39, description: '周一至周五10:00前场次', stock: 200, sold: 145, start_time: fmt(now), end_time: fmt(addDays(now, 25)), timeslot_start: '09:00', timeslot_end: '10:00' },
    { merchantName: '新桥KTV Party', name: '欢唱3小时套餐', type: 'groupbuy', original_price: 198, price: 128, description: '中包3小时+小吃拼盘', stock: 80, sold: 55, start_time: fmt(now), end_time: fmt(addDays(now, 20)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '车墩影视基地体验馆', name: '影视穿越体验票', type: 'discount', original_price: 120, price: 79, description: '含换装体验+场景打卡', stock: 150, sold: 98, start_time: fmt(now), end_time: fmt(addDays(now, 25)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '佘山森林公园', name: '森林徒步套票', type: 'discount', original_price: 80, price: 49, description: '含门票+导览+矿泉水', stock: 200, sold: 160, start_time: fmt(now), end_time: fmt(addDays(now, 30)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '广富林文化遗址', name: '文化探索家庭票', type: 'groupbuy', original_price: 200, price: 138, description: '2大1小家庭票含讲解', stock: 150, sold: 112, start_time: fmt(now), end_time: fmt(addDays(now, 30)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '广富林文化遗址', name: '晨间特惠票', type: 'timeslot', original_price: 70, price: 45, description: '8:00-10:00入园享特价', stock: 100, sold: 68, start_time: fmt(now), end_time: fmt(addDays(now, 20)), timeslot_start: '08:00', timeslot_end: '10:00' },
    { merchantName: '泰晤士小镇', name: '英伦下午茶双人', type: 'discount', original_price: 168, price: 108, description: '英式下午茶套餐含拍照', stock: 80, sold: 62, start_time: fmt(now), end_time: fmt(addDays(now, 15)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '永丰SPA会所', name: '全身精油SPA体验', type: 'discount', original_price: 598, price: 388, description: '90分钟全身精油SPA', stock: 30, sold: 22, start_time: fmt(now), end_time: fmt(addDays(now, 10)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '永丰SPA会所', name: '双人闺蜜SPA', type: 'groupbuy', original_price: 1196, price: 699, description: '双人90分钟精油SPA', stock: 20, sold: 15, start_time: fmt(now), end_time: fmt(addDays(now, 15)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '中山健身房', name: '月卡限时优惠', type: 'discount', original_price: 399, price: 199, description: '30天不限次数健身月卡', stock: 50, sold: 38, start_time: fmt(now), end_time: fmt(addDays(now, 7)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '万达广场永辉超市', name: '满100减20优惠券', type: 'discount', original_price: 100, price: 80, description: '全场满100减20', stock: 1000, sold: 780, start_time: fmt(now), end_time: fmt(addDays(now, 30)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '开元地中海商业广场', name: '购物满减券', type: 'discount', original_price: 300, price: 240, description: '全场满300减60', stock: 500, sold: 320, start_time: fmt(now), end_time: fmt(addDays(now, 20)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '泗泾古镇特产店', name: '松江米糕礼盒', type: 'groupbuy', original_price: 88, price: 58, description: '松江传统米糕礼盒装', stock: 100, sold: 72, start_time: fmt(now), end_time: fmt(addDays(now, 20)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '岳阳数码城', name: '手机贴膜套餐', type: 'discount', original_price: 59, price: 29, description: '高清钢化膜+手机壳', stock: 200, sold: 150, start_time: fmt(now), end_time: fmt(addDays(now, 15)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '九里亭优衣库', name: '周末满减券', type: 'timeslot', original_price: 300, price: 240, description: '周末全场满300减60', stock: 400, sold: 280, start_time: fmt(now), end_time: fmt(addDays(now, 20)), timeslot_start: '10:00', timeslot_end: '22:00' },
    { merchantName: '新桥家居生活馆', name: '全屋定制优惠套餐', type: 'groupbuy', original_price: 29800, price: 22800, description: '全屋定制家具5折起', stock: 10, sold: 6, start_time: fmt(now), end_time: fmt(addDays(now, 30)), timeslot_start: '', timeslot_end: '' },
    { merchantName: '车墩农贸市场', name: '生鲜早市特惠', type: 'timeslot', original_price: 50, price: 35, description: '早6:00-9:00生鲜特价', stock: 500, sold: 390, start_time: fmt(now), end_time: fmt(addDays(now, 30)), timeslot_start: '06:00', timeslot_end: '09:00' },
  ]

  const merchantMap = new Map(merchants.map(m => [m.name, m.id]))

  for (const pkg of packageData) {
    const merchantId = merchantMap.get(pkg.merchantName)
    if (merchantId) {
      insertPackage.run(uuidv4(), merchantId, pkg.name, pkg.type, pkg.original_price, pkg.price, pkg.description, pkg.stock, pkg.sold, pkg.start_time, pkg.end_time, pkg.timeslot_start, pkg.timeslot_end, 'active')
    }
  }

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, user_id, package_id, merchant_id, order_no, verification_code, status, amount, paid_at, used_at, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const allPackages = db.prepare('SELECT id, merchant_id, price, end_time FROM packages WHERE status = ?').all('active') as Array<{ id: string; merchant_id: string; price: number; end_time: string }>

  const orderStatuses = ['paid', 'paid', 'paid', 'used', 'used', 'used', 'used', 'expired']
  let orderIndex = 0

  for (const pkg of allPackages) {
    const orderCount = 3 + Math.floor(Math.random() * 5)
    for (let i = 0; i < orderCount; i++) {
      const userId = users[Math.floor(Math.random() * users.length)].id
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)]
      const orderNo = `SJ${Date.now().toString().slice(-10)}${String(orderIndex).padStart(4, '0')}`
      const code = String(Math.floor(100000 + Math.random() * 900000))
      const paidAt = fmt(addDays(now, -Math.floor(Math.random() * 7)))
      const expiresAt = pkg.end_time
      const usedAt = status === 'used' ? fmt(addDays(now, -Math.floor(Math.random() * 3))) : ''
      const createdAt = fmt(addDays(now, -Math.floor(Math.random() * 10)))

      insertOrder.run(uuidv4(), userId, pkg.id, pkg.merchant_id, orderNo, code, status, pkg.price, paidAt, usedAt, expiresAt, createdAt)
      orderIndex++
    }
  }

  const usedOrders = db.prepare("SELECT id, merchant_id FROM orders WHERE status = 'used'").all() as Array<{ id: string; merchant_id: string }>
  const insertVerification = db.prepare(`
    INSERT INTO verifications (id, order_id, merchant_id, verified_by, verified_at) VALUES (?, ?, ?, ?, ?)
  `)

  for (const order of usedOrders) {
    insertVerification.run(uuidv4(), order.id, order.merchant_id, order.merchant_id, fmt(addDays(now, -Math.floor(Math.random() * 3))))
  }

  const insertCampaign = db.prepare(`
    INSERT INTO campaigns (id, name, description, start_time, end_time, status, cover_image) VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const campaigns = [
    { id: uuidv4(), name: '大学城周末狂欢周', description: '广富林街道周边商户联合促销，学生专享折扣', start_time: fmt(now), end_time: fmt(addDays(now, 14)), status: 'active', cover_image: '' },
    { id: uuidv4(), name: '佘山春日踏青季', description: '佘山周边休闲商户优惠大放送，踏青赏景享好价', start_time: fmt(addDays(now, -5)), end_time: fmt(addDays(now, 25)), status: 'active', cover_image: '' },
    { id: uuidv4(), name: '松江美食嘉年华', description: '松江区餐饮商户联合大促，满减优惠不停', start_time: fmt(addDays(now, -10)), end_time: fmt(addDays(now, 20)), status: 'active', cover_image: '' },
  ]

  for (const c of campaigns) {
    insertCampaign.run(c.id, c.name, c.description, c.start_time, c.end_time, c.status, c.cover_image)
  }

  const insertCampaignMerchant = db.prepare(`
    INSERT INTO campaign_merchants (id, campaign_id, merchant_id) VALUES (?, ?, ?)
  `)

  const campaignMerchantMap: Array<{ campaignName: string; merchantNames: string[] }> = [
    { campaignName: '大学城周末狂欢周', merchantNames: ['大学城美食广场', '方松日式料理', '广富林文化遗址', '泰晤士小镇', '开元地中海商业广场'] },
    { campaignName: '佘山春日踏青季', merchantNames: ['佘山森林公园', '佘山度假酒店餐厅', '欢乐谷主题乐园', '车墩影视基地体验馆'] },
    { campaignName: '松江美食嘉年华', merchantNames: ['老松江酒楼', '大学城美食广场', '永丰火锅王', '泗泾羊肉馆', '方松日式料理', '九里亭奶茶工坊'] },
  ]

  const campaignMap = new Map(campaigns.map(c => [c.name, c.id]))

  for (const cm of campaignMerchantMap) {
    const campaignId = campaignMap.get(cm.campaignName)
    if (campaignId) {
      for (const mName of cm.merchantNames) {
        const merchantId = merchantMap.get(mName)
        if (merchantId) {
          insertCampaignMerchant.run(uuidv4(), campaignId, merchantId)
        }
      }
    }
  }
}
