import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, 'data', 'honghe.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  initTables(db)
  seedData(db)

  return db
}

function initTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL UNIQUE,
      nickname TEXT NOT NULL,
      avatar TEXT,
      region TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT,
      source TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'pending',
      author_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS circles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      cover_image TEXT,
      owner_id INTEGER REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS circle_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      circle_id INTEGER REFERENCES circles(id),
      user_id INTEGER REFERENCES users(id),
      role TEXT NOT NULL DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(circle_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      circle_id INTEGER REFERENCES circles(id),
      author_id INTEGER REFERENCES users(id),
      content TEXT NOT NULL,
      media_urls TEXT,
      type TEXT NOT NULL DEFAULT 'text',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizer_id INTEGER REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      event_time DATETIME,
      max_participants INTEGER,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS event_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER REFERENCES events(id),
      user_id INTEGER REFERENCES users(id),
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      license_url TEXT,
      category TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER REFERENCES merchants(id),
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      images TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      product_id INTEGER REFERENCES products(id),
      status TEXT NOT NULL DEFAULT 'created',
      amount REAL NOT NULL,
      appointment_time TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id),
      status TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS match_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) UNIQUE,
      real_name TEXT NOT NULL,
      education TEXT,
      profession TEXT,
      preferences TEXT,
      verified INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS match_intents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER REFERENCES users(id),
      to_user_id INTEGER REFERENCES users(id),
      mutual INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(from_user_id, to_user_id)
    );
  `)
}

function seedData(db: Database.Database): void {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) return

  const insertUser = db.prepare(
    'INSERT INTO users (phone, nickname, avatar, region, role) VALUES (?, ?, ?, ?, ?)'
  )

  const users = [
    { phone: '13800138001', nickname: '红河阿鹏', avatar: '', region: '蒙自市', role: 'user' },
    { phone: '13800138002', nickname: '梯田姑娘', avatar: '', region: '元阳县', role: 'user' },
    { phone: '13800138003', nickname: '紫陶匠人', avatar: '', region: '建水县', role: 'merchant' },
    { phone: '13800138004', nickname: '弥勒小赵', avatar: '', region: '弥勒市', role: 'user' },
    { phone: '13800138005', nickname: '泸西吃货', avatar: '', region: '泸西县', role: 'user' },
    { phone: '13800138006', nickname: '开远小杨', avatar: '', region: '开远市', role: 'admin' },
    { phone: '13800138007', nickname: '个旧老李', avatar: '', region: '个旧市', role: 'merchant' },
  ]

  const userIds: number[] = []
  for (const u of users) {
    const result = insertUser.run(u.phone, u.nickname, u.avatar, u.region, u.role)
    userIds.push(result.lastInsertRowid as number)
  }

  const insertNews = db.prepare(
    'INSERT INTO news (title, content, tags, source, status, author_id) VALUES (?, ?, ?, ?, ?, ?)'
  )

  const newsList = [
    {
      title: '元阳梯田入选世界文化遗产十周年庆典即将开幕',
      content: '元阳哈尼梯田自2013年入选世界文化遗产以来，已成为红河州最具代表性的文化名片。十周年庆典活动将于本月开幕，届时将举办梯田光影展、哈尼长街宴、民族歌舞表演等系列活动，欢迎广大市民和游客参与。',
      tags: '元阳,梯田,文化遗产',
      source: 'government',
      status: 'approved',
      authorId: userIds[5],
    },
    {
      title: '建水紫陶非遗传承人作品展在建水古城举办',
      content: '建水紫陶作为中国四大名陶之一，拥有悠久的历史和精湛的工艺。本次展览汇聚了20位非遗传承人的代表作品，涵盖茶器、花器、文房用品等多个品类，展期一个月，免费向公众开放。',
      tags: '建水,紫陶,非遗',
      source: 'government',
      status: 'approved',
      authorId: userIds[5],
    },
    {
      title: '蒙自过桥米线美食节下周开幕',
      content: '一年一度的蒙自过桥米线美食节将于下周五在南湖公园盛大开幕。本届美食节汇聚了全州30余家知名米线品牌，除传统过桥米线外，还将推出创新口味米线，让食客大饱口福。',
      tags: '蒙自,过桥米线,美食节',
      source: 'government',
      status: 'approved',
      authorId: userIds[5],
    },
    {
      title: '弥勒温泉旅游度假区冬季优惠活动启动',
      content: '弥勒温泉旅游度假区推出冬季特惠套餐，包含温泉体验、湖泉酒店住宿及东风韵景区门票，原价688元套餐现仅需388元，活动持续至本月底，欢迎前来体验红河州的温暖冬日。',
      tags: '弥勒,温泉,旅游',
      source: 'merchant',
      status: 'approved',
      authorId: userIds[2],
    },
    {
      title: '红河州2025年高考报名工作即将开始',
      content: '红河州教育体育局发布通知，2025年高考报名工作将于11月1日正式启动，全州各县市均设立报名点。请符合条件的考生提前准备相关证件材料，按时完成报名手续。',
      tags: '高考,教育,红河州',
      source: 'government',
      status: 'approved',
      authorId: userIds[5],
    },
    {
      title: '泸西阿庐古洞景区推出夜游体验项目',
      content: '泸西阿庐古洞是国家4A级旅游景区，拥有壮观的地下溶洞群。新推出的夜游项目通过灯光与投影技术，将溶洞奇观与彝族文化故事完美融合，为游客带来沉浸式的地下世界探索体验。',
      tags: '泸西,阿庐古洞,旅游',
      source: 'merchant',
      status: 'approved',
      authorId: userIds[6],
    },
    {
      title: '红河州乡村振兴成果展在蒙自举办',
      content: '红河州乡村振兴成果展在蒙自市文化中心开展，展览集中展示了近年来红河州在产业发展、生态保护、文化传承等方面取得的显著成就，全州13县市均设有展区，展期两周。',
      tags: '乡村振兴,蒙自,红河州',
      source: 'government',
      status: 'approved',
      authorId: userIds[5],
    },
    {
      title: '个旧锡工艺品亮相国际文创博览会',
      content: '个旧素有"锡都"之称，锡工艺品制作技艺源远流长。在近日举办的国际文创博览会上，个旧锡工艺品以其精湛工艺和独特设计受到广泛关注，多件作品获金奖，进一步提升了红河文创的知名度。',
      tags: '个旧,锡工艺,文创',
      source: 'user',
      status: 'approved',
      authorId: userIds[0],
    },
  ]

  for (const n of newsList) {
    insertNews.run(n.title, n.content, n.tags, n.source, n.status, n.authorId)
  }

  const insertCircle = db.prepare(
    'INSERT INTO circles (name, description, category, cover_image, owner_id, status) VALUES (?, ?, ?, ?, ?, ?)'
  )

  const circles = [
    {
      name: '元阳梯田摄影圈',
      description: '分享元阳梯田四季美景，交流摄影技巧，组织梯田采风活动',
      category: '摄影',
      cover_image: '',
      ownerId: userIds[1],
      status: 'approved',
    },
    {
      name: '建水紫陶爱好者',
      description: '紫陶鉴赏、制作交流，建水古城文化探索',
      category: '手工',
      cover_image: '',
      ownerId: userIds[2],
      status: 'approved',
    },
    {
      name: '红河美食探店',
      description: '发现红河州各地美食，过桥米线、泸西小吃、弥勒卤鸡米线一网打尽',
      category: '美食',
      cover_image: '',
      ownerId: userIds[4],
      status: 'approved',
    },
    {
      name: '弥勒户外运动',
      description: '徒步、骑行、露营，探索弥勒及周边自然风光',
      category: '运动',
      cover_image: '',
      ownerId: userIds[3],
      status: 'approved',
    },
  ]

  const circleIds: number[] = []
  for (const c of circles) {
    const result = insertCircle.run(c.name, c.description, c.category, c.cover_image, c.ownerId, c.status)
    circleIds.push(result.lastInsertRowid as number)
  }

  const insertCircleMember = db.prepare(
    'INSERT INTO circle_members (circle_id, user_id, role) VALUES (?, ?, ?)'
  )

  const memberMappings = [
    { circleId: circleIds[0], userId: userIds[0], role: 'member' },
    { circleId: circleIds[0], userId: userIds[1], role: 'owner' },
    { circleId: circleIds[0], userId: userIds[3], role: 'member' },
    { circleId: circleIds[1], userId: userIds[2], role: 'owner' },
    { circleId: circleIds[1], userId: userIds[0], role: 'member' },
    { circleId: circleIds[2], userId: userIds[4], role: 'owner' },
    { circleId: circleIds[2], userId: userIds[0], role: 'member' },
    { circleId: circleIds[2], userId: userIds[3], role: 'member' },
    { circleId: circleIds[3], userId: userIds[3], role: 'owner' },
    { circleId: circleIds[3], userId: userIds[1], role: 'member' },
  ]

  for (const m of memberMappings) {
    insertCircleMember.run(m.circleId, m.userId, m.role)
  }

  const insertPost = db.prepare(
    'INSERT INTO posts (circle_id, author_id, content, media_urls, type) VALUES (?, ?, ?, ?, ?)'
  )

  const posts = [
    {
      circleId: circleIds[0],
      authorId: userIds[1],
      content: '今天清晨在多依树拍的梯田日出，云海翻涌，太壮观了！分享给大家~',
      mediaUrls: '',
      type: 'image',
    },
    {
      circleId: circleIds[0],
      authorId: userIds[0],
      content: '推荐一个拍摄老虎嘴梯田的绝佳机位，日落时分光影效果绝美，有兴趣的朋友周末可以一起去。',
      mediaUrls: '',
      type: 'text',
    },
    {
      circleId: circleIds[1],
      authorId: userIds[2],
      content: '新出窑的一批紫陶茶壶，采用传统无釉磨光工艺，手感温润如玉。欢迎到建水古城工作室品茶赏陶。',
      mediaUrls: '',
      type: 'image',
    },
    {
      circleId: circleIds[2],
      authorId: userIds[4],
      content: '泸西老城区新开了一家正宗的泸西烧豆腐店，配上当地特制蘸水，味道绝了！强烈推荐！',
      mediaUrls: '',
      type: 'text',
    },
    {
      circleId: circleIds[2],
      authorId: userIds[0],
      content: '蒙自南湖边这家过桥米线，汤底用老母鸡熬制8小时，配料足足18种，真的是过桥米线的天花板！',
      mediaUrls: '',
      type: 'text',
    },
    {
      circleId: circleIds[3],
      authorId: userIds[3],
      content: '周末组织一次弥勒锦屏山徒步，全程约12公里，沿途可以俯瞰弥勒全景，有想一起的朋友吗？',
      mediaUrls: '',
      type: 'text',
    },
  ]

  for (const p of posts) {
    insertPost.run(p.circleId, p.authorId, p.content, p.mediaUrls, p.type)
  }

  const insertEvent = db.prepare(
    'INSERT INTO events (organizer_id, title, description, location, event_time, max_participants, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )

  const events = [
    {
      organizerId: userIds[1],
      title: '元阳梯田日出摄影采风',
      description: '组织摄影爱好者前往元阳多依树拍摄日出，专业摄影师现场指导构图与曝光技巧，适合各水平摄影爱好者参加。',
      location: '元阳县多依树观景台',
      eventTime: '2025-12-20 06:00:00',
      maxParticipants: 30,
      status: 'active',
    },
    {
      organizerId: userIds[2],
      title: '建水紫陶制作体验工坊',
      description: '由建水紫陶非遗传承人亲自指导，体验从泥料到成型的完整紫陶制作过程，作品可带走留念。',
      location: '建水县紫陶街传承工坊',
      eventTime: '2025-12-25 14:00:00',
      maxParticipants: 15,
      status: 'active',
    },
    {
      organizerId: userIds[3],
      title: '弥勒温泉跨年派对',
      description: '在弥勒湖泉温泉度假区内举办跨年派对，含温泉体验、篝火晚会、民族歌舞表演，一起迎接新年！',
      location: '弥勒市湖泉温泉度假区',
      eventTime: '2025-12-31 19:00:00',
      maxParticipants: 50,
      status: 'active',
    },
  ]

  const eventIds: number[] = []
  for (const e of events) {
    const result = insertEvent.run(
      e.organizerId,
      e.title,
      e.description,
      e.location,
      e.eventTime,
      e.maxParticipants,
      e.status
    )
    eventIds.push(result.lastInsertRowid as number)
  }

  const insertEventReg = db.prepare(
    'INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)'
  )

  insertEventReg.run(eventIds[0], userIds[0])
  insertEventReg.run(eventIds[0], userIds[3])
  insertEventReg.run(eventIds[1], userIds[0])
  insertEventReg.run(eventIds[2], userIds[4])

  const insertMerchant = db.prepare(
    'INSERT INTO merchants (user_id, name, license_url, category, status) VALUES (?, ?, ?, ?, ?)'
  )

  const merchants = [
    {
      userId: userIds[2],
      name: '建水紫陶坊',
      licenseUrl: '',
      category: '文创',
      status: 'approved',
    },
    {
      userId: userIds[6],
      name: '个旧锡器精品店',
      licenseUrl: '',
      category: '文创',
      status: 'approved',
    },
    {
      userId: userIds[0],
      name: '蒙自过桥米线总店',
      licenseUrl: '',
      category: '餐饮',
      status: 'approved',
    },
  ]

  const merchantIds: number[] = []
  for (const m of merchants) {
    const result = insertMerchant.run(m.userId, m.name, m.licenseUrl, m.category, m.status)
    merchantIds.push(result.lastInsertRowid as number)
  }

  const insertProduct = db.prepare(
    'INSERT INTO products (merchant_id, name, description, category, price, images) VALUES (?, ?, ?, ?, ?, ?)'
  )

  const products = [
    {
      merchantId: merchantIds[0],
      name: '建水紫陶茶壶·云纹',
      description: '传统无釉磨光工艺，手工拉坯成型，云纹雕刻装饰，容量200ml',
      category: '紫陶',
      price: 368,
      images: '',
    },
    {
      merchantId: merchantIds[0],
      name: '建水紫陶花瓶·梯田',
      description: '以元阳梯田为灵感创作，浮雕工艺呈现梯田层叠之美，高度35cm',
      category: '紫陶',
      price: 588,
      images: '',
    },
    {
      merchantId: merchantIds[0],
      name: '建水紫陶茶杯套装',
      description: '含6只品茗杯，残贴装饰技法，每只杯身图案各不相同',
      category: '紫陶',
      price: 258,
      images: '',
    },
    {
      merchantId: merchantIds[1],
      name: '个旧锡制茶仓·松鹤延年',
      description: '纯手工锡制茶叶罐，松鹤延年浮雕图案，容量250g',
      category: '锡器',
      price: 458,
      images: '',
    },
    {
      merchantId: merchantIds[1],
      name: '个旧锡制酒具套装',
      description: '含酒壶1把、酒杯6只，传统錾刻工艺，适合收藏与馈赠',
      category: '锡器',
      price: 688,
      images: '',
    },
    {
      merchantId: merchantIds[2],
      name: '蒙自过桥米线·经典套餐',
      description: '老母鸡高汤底，18种配菜，米线无限续，含建水汽锅鸡一份',
      category: '美食',
      price: 68,
      images: '',
    },
    {
      merchantId: merchantIds[2],
      name: '蒙自过桥米线·家庭装',
      description: '4人份家庭装过桥米线，含高汤包、配菜包、米线，回家即可享用正宗蒙自味道',
      category: '美食',
      price: 128,
      images: '',
    },
    {
      merchantId: merchantIds[1],
      name: '个旧锡制香炉·莲花',
      description: '精工锡制香炉，莲花造型，镂空雕花工艺，适合茶室与书房',
      category: '锡器',
      price: 328,
      images: '',
    },
  ]

  const productIds: number[] = []
  for (const p of products) {
    const result = insertProduct.run(
      p.merchantId,
      p.name,
      p.description,
      p.category,
      p.price,
      p.images
    )
    productIds.push(result.lastInsertRowid as number)
  }

  const insertOrder = db.prepare(
    'INSERT INTO orders (user_id, product_id, status, amount, appointment_time) VALUES (?, ?, ?, ?, ?)'
  )

  const orders = [
    {
      userId: userIds[0],
      productId: productIds[0],
      status: 'paid',
      amount: 368,
      appointmentTime: null,
    },
    {
      userId: userIds[3],
      productId: productIds[5],
      status: 'completed',
      amount: 68,
      appointmentTime: '2025-12-22 12:00',
    },
    {
      userId: userIds[4],
      productId: productIds[3],
      status: 'created',
      amount: 458,
      appointmentTime: null,
    },
    {
      userId: userIds[1],
      productId: productIds[5],
      status: 'confirmed',
      amount: 68,
      appointmentTime: '2025-12-28 18:30',
    },
  ]

  const insertTimeline = db.prepare(
    'INSERT INTO order_timeline (order_id, status, description) VALUES (?, ?, ?)'
  )

  for (const o of orders) {
    const result = insertOrder.run(o.userId, o.productId, o.status, o.amount, o.appointmentTime)
    const orderId = result.lastInsertRowid as number

    insertTimeline.run(orderId, 'created', '订单已创建')
    if (o.status === 'paid' || o.status === 'confirmed' || o.status === 'completed') {
      insertTimeline.run(orderId, 'paid', '订单已支付')
    }
    if (o.status === 'confirmed' || o.status === 'completed') {
      insertTimeline.run(orderId, 'confirmed', '商家已确认')
    }
    if (o.status === 'completed') {
      insertTimeline.run(orderId, 'completed', '订单已完成')
    }
  }

  const insertMatchProfile = db.prepare(
    'INSERT INTO match_profiles (user_id, real_name, education, profession, preferences, verified) VALUES (?, ?, ?, ?, ?, ?)'
  )

  const profiles = [
    {
      userId: userIds[0],
      realName: '李明',
      education: '本科',
      profession: '教师',
      preferences: '希望对方善良孝顺，有稳定工作，喜欢红河本地文化',
      verified: 1,
    },
    {
      userId: userIds[1],
      realName: '李花',
      education: '大专',
      profession: '导游',
      preferences: '寻找有责任心、热爱旅行的伴侣，最好在元阳或周边工作',
      verified: 1,
    },
    {
      userId: userIds[3],
      realName: '赵伟',
      education: '本科',
      profession: '公务员',
      preferences: '希望对方性格开朗，有稳定收入，弥勒本地优先',
      verified: 1,
    },
    {
      userId: userIds[4],
      realName: '王芳',
      education: '高中',
      profession: '餐饮经营者',
      preferences: '寻找踏实可靠的另一半，共同经营生活，红河州内均可',
      verified: 0,
    },
    {
      userId: userIds[5],
      realName: '杨洋',
      education: '硕士',
      profession: '事业单位',
      preferences: '希望对方学历本科以上，性格温和，有共同兴趣爱好',
      verified: 1,
    },
  ]

  for (const p of profiles) {
    insertMatchProfile.run(p.userId, p.realName, p.education, p.profession, p.preferences, p.verified)
  }

  const insertIntent = db.prepare(
    'INSERT INTO match_intents (from_user_id, to_user_id, mutual) VALUES (?, ?, ?)'
  )

  insertIntent.run(userIds[0], userIds[1], 0)
  insertIntent.run(userIds[1], userIds[0], 1)
  insertIntent.run(userIds[3], userIds[4], 0)
}
