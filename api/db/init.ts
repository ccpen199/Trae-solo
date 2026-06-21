import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function initDatabase(db: Database.Database): void {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      phone TEXT,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS experts (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE,
      name TEXT NOT NULL,
      title TEXT,
      category TEXT NOT NULL,
      years_of_experience INTEGER DEFAULT 0,
      bio TEXT,
      avatar TEXT,
      rating REAL DEFAULT 0,
      appraisal_count INTEGER DEFAULT 0,
      price_per_appraisal REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS artworks (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      images TEXT,
      dimensions TEXT,
      era TEXT,
      material TEXT,
      provenance TEXT,
      condition TEXT,
      estimated_value REAL,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS appraisal_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      artwork_id TEXT NOT NULL,
      expert_id TEXT,
      order_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      price REAL DEFAULT 0,
      ai_result TEXT,
      expert_opinion TEXT,
      valuation REAL,
      certificate_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (artwork_id) REFERENCES artworks(id),
      FOREIGN KEY (expert_id) REFERENCES experts(id)
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      artwork_id TEXT NOT NULL,
      expert_id TEXT,
      certificate_no TEXT UNIQUE NOT NULL,
      category TEXT,
      conclusion TEXT,
      valuation REAL,
      expert_opinion TEXT,
      ai_data TEXT,
      blockchain_tx TEXT,
      pdf_url TEXT,
      status TEXT DEFAULT 'active',
      issued_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT,
      FOREIGN KEY (order_id) REFERENCES appraisal_orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (artwork_id) REFERENCES artworks(id),
      FOREIGN KEY (expert_id) REFERENCES experts(id)
    );

    CREATE TABLE IF NOT EXISTS disputes (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      description TEXT,
      evidence TEXT,
      status TEXT DEFAULT 'pending',
      resolution TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT,
      FOREIGN KEY (order_id) REFERENCES appraisal_orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS knowledge_articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT,
      content TEXT NOT NULL,
      cover_image TEXT,
      author TEXT,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      tags TEXT,
      status TEXT DEFAULT 'published',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS community_questions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      images TEXT,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      answer_count INTEGER DEFAULT 0,
      is_answered INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS community_answers (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      is_best INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (question_id) REFERENCES community_questions(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `)

  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count
  if (userCount === 0) {
    seedMockData(db)
  }
}

function seedMockData(db: Database.Database): void {
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, email, password, avatar, phone, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const hashPwd = (pwd: string) => bcrypt.hashSync(pwd, 10)

  const users = [
    { id: nanoid(), username: 'admin', email: 'admin@example.com', password: hashPwd('admin123'), avatar: '', phone: '13800000001', role: 'admin' },
    { id: nanoid(), username: 'zhangsan', email: 'zhang@example.com', password: hashPwd('123456'), avatar: '', phone: '13800000002', role: 'user' },
    { id: nanoid(), username: 'lisi', email: 'li@example.com', password: hashPwd('123456'), avatar: '', phone: '13800000003', role: 'user' },
    { id: nanoid(), username: 'wangwu', email: 'wang@example.com', password: hashPwd('123456'), avatar: '', phone: '13800000004', role: 'expert' },
    { id: nanoid(), username: 'expert_chen', email: 'chen@example.com', password: hashPwd('123456'), avatar: '', phone: '13800000005', role: 'expert' },
    { id: nanoid(), username: 'expert_liu', email: 'liu@example.com', password: hashPwd('123456'), avatar: '', phone: '13800000006', role: 'expert' },
  ]
  const insertManyUsers = db.transaction((list: typeof users) => {
    for (const u of list) insertUser.run(u.id, u.username, u.email, u.password, u.avatar, u.phone, u.role)
  })
  insertManyUsers(users)

  const insertExpert = db.prepare(`
    INSERT INTO experts (id, user_id, name, title, category, years_of_experience, bio, avatar, rating, appraisal_count, price_per_appraisal, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const experts = [
    { id: nanoid(), user_id: users[3].id, name: '王专家', title: '高级鉴定师', category: '玉器', years_of_experience: 25, bio: '从事玉器鉴定工作25年，故宫博物院前研究员。', avatar: '', rating: 4.8, appraisal_count: 1256, price_per_appraisal: 500, status: 'approved' },
    { id: nanoid(), user_id: users[4].id, name: '陈教授', title: '教授级鉴定师', category: '书画', years_of_experience: 30, bio: '中央美术学院教授，书画鉴定权威专家。', avatar: '', rating: 4.9, appraisal_count: 2380, price_per_appraisal: 800, status: 'approved' },
    { id: nanoid(), user_id: users[5].id, name: '刘大师', title: '资深鉴定师', category: '陶瓷', years_of_experience: 20, bio: '景德镇陶瓷世家传承人，古陶瓷鉴定专家。', avatar: '', rating: 4.7, appraisal_count: 890, price_per_appraisal: 600, status: 'approved' },
  ]
  const insertManyExperts = db.transaction((list: typeof experts) => {
    for (const e of list) insertExpert.run(e.id, e.user_id, e.name, e.title, e.category, e.years_of_experience, e.bio, e.avatar, e.rating, e.appraisal_count, e.price_per_appraisal, e.status)
  })
  insertManyExperts(experts)

  const insertArtwork = db.prepare(`
    INSERT INTO artworks (id, owner_id, title, category, description, images, dimensions, era, material, provenance, condition, estimated_value, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const artworks = [
    { id: nanoid(), owner_id: users[1].id, title: '清代和田玉扳指', category: '玉器', description: '清代中期和田白玉籽料扳指，玉质温润，包浆自然。', images: JSON.stringify([]), dimensions: '外径3.2cm，内径2.1cm', era: '清代中期', material: '和田白玉', provenance: '家族传承', condition: '完好', estimated_value: 28000, status: 'published' },
    { id: nanoid(), owner_id: users[2].id, title: '明代青花瓷碗', category: '陶瓷', description: '明代万历年间青花瓷碗，釉色纯正，纹饰精美。', images: JSON.stringify([]), dimensions: '口径15cm，高8cm', era: '明代万历', material: '高岭土', provenance: '拍卖行购入', condition: '有轻微磨损', estimated_value: 150000, status: 'published' },
    { id: nanoid(), owner_id: users[1].id, title: '齐白石水墨虾图', category: '书画', description: '齐白石晚年作品，水墨写意虾图，笔墨灵动。', images: JSON.stringify([]), dimensions: '68cm x 45cm', era: '民国', material: '纸本水墨', provenance: '藏家转让', condition: '良好', estimated_value: 800000, status: 'published' },
    { id: nanoid(), owner_id: users[2].id, title: '宋代建盏', category: '陶瓷', description: '宋代建窑兔毫盏，黑釉兔毫纹清晰，器型规整。', images: JSON.stringify([]), dimensions: '口径12cm，高6cm', era: '宋代', material: '黑釉瓷', provenance: '出土', condition: '口沿有小修', estimated_value: 320000, status: 'published' },
  ]
  const insertManyArtworks = db.transaction((list: typeof artworks) => {
    for (const a of list) insertArtwork.run(a.id, a.owner_id, a.title, a.category, a.description, a.images, a.dimensions, a.era, a.material, a.provenance, a.condition, a.estimated_value, a.status)
  })
  insertManyArtworks(artworks)

  const insertOrder = db.prepare(`
    INSERT INTO appraisal_orders (id, user_id, artwork_id, expert_id, order_type, status, price, ai_result, expert_opinion, valuation, certificate_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const certId1 = nanoid()
  const certId2 = nanoid()
  const orders = [
    { id: nanoid(), user_id: users[1].id, artwork_id: artworks[0].id, expert_id: experts[0].id, order_type: 'expert', status: 'completed', price: 500, ai_result: JSON.stringify({ category: '玉器', confidence: 0.94, era: '清代中期' }), expert_opinion: '经鉴定，此扳指为清代中期和田白玉籽料，玉质上乘，雕工精细，具有较高收藏价值。', valuation: 28000, certificate_id: certId1 },
    { id: nanoid(), user_id: users[2].id, artwork_id: artworks[1].id, expert_id: experts[2].id, order_type: 'expert', status: 'completed', price: 600, ai_result: JSON.stringify({ category: '陶瓷', confidence: 0.89, era: '明代晚期' }), expert_opinion: '此碗为明代万历时期民窑精品，青花发色纯正，纹饰流畅，市场价值可观。', valuation: 150000, certificate_id: certId2 },
    { id: nanoid(), user_id: users[1].id, artwork_id: artworks[2].id, expert_id: experts[1].id, order_type: 'expert', status: 'in_progress', price: 800, ai_result: JSON.stringify({ category: '书画', confidence: 0.91 }), expert_opinion: null, valuation: null, certificate_id: null },
    { id: nanoid(), user_id: users[2].id, artwork_id: artworks[3].id, expert_id: null, order_type: 'ai', status: 'completed', price: 9.9, ai_result: JSON.stringify({ category: '陶瓷', confidence: 0.87, era: '宋代', suggestions: ['建议进一步送检实物'] }), expert_opinion: null, valuation: null, certificate_id: null },
  ]
  const insertManyOrders = db.transaction((list: typeof orders) => {
    for (const o of list) insertOrder.run(o.id, o.user_id, o.artwork_id, o.expert_id, o.order_type, o.status, o.price, o.ai_result, o.expert_opinion, o.valuation, o.certificate_id)
  })
  insertManyOrders(orders)

  const insertCert = db.prepare(`
    INSERT INTO certificates (id, order_id, user_id, artwork_id, expert_id, certificate_no, category, conclusion, valuation, expert_opinion, ai_data, blockchain_tx, pdf_url, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const certificates = [
    { id: certId1, order_id: orders[0].id, user_id: users[1].id, artwork_id: artworks[0].id, expert_id: experts[0].id, certificate_no: 'CERT' + Date.now() + '001', category: '玉器', conclusion: '清代中期和田白玉扳指，真品', valuation: 28000, expert_opinion: '经鉴定，此扳指为清代中期和田白玉籽料，玉质上乘，雕工精细。', ai_data: orders[0].ai_result, blockchain_tx: '0x' + nanoid(40), pdf_url: '/certificates/' + certId1 + '.pdf', status: 'active' },
    { id: certId2, order_id: orders[1].id, user_id: users[2].id, artwork_id: artworks[1].id, expert_id: experts[2].id, certificate_no: 'CERT' + Date.now() + '002', category: '陶瓷', conclusion: '明代万历青花瓷碗，真品', valuation: 150000, expert_opinion: '明代万历时期民窑精品，青花发色纯正。', ai_data: orders[1].ai_result, blockchain_tx: '0x' + nanoid(40), pdf_url: '/certificates/' + certId2 + '.pdf', status: 'active' },
  ]
  const insertManyCerts = db.transaction((list: typeof certificates) => {
    for (const c of list) insertCert.run(c.id, c.order_id, c.user_id, c.artwork_id, c.expert_id, c.certificate_no, c.category, c.conclusion, c.valuation, c.expert_opinion, c.ai_data, c.blockchain_tx, c.pdf_url, c.status)
  })
  insertManyCerts(certificates)

  const insertArticle = db.prepare(`
    INSERT INTO knowledge_articles (id, title, category, summary, content, cover_image, author, views, likes, tags, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const articles = [
    { id: nanoid(), title: '和田玉的鉴别方法与价值评估', category: '玉器', summary: '详细介绍和田玉的产地、种类、鉴别要点以及市场价值评估方法。', content: '和田玉是中国四大名玉之一，主要产自新疆和田地区...', cover_image: '', author: '王专家', views: 12580, likes: 356, tags: JSON.stringify(['和田玉', '玉器鉴定', '收藏']), status: 'published' },
    { id: nanoid(), title: '明清瓷器的断代与辨伪', category: '陶瓷', summary: '从器型、釉色、纹饰、款识等方面分析明清瓷器的断代要点。', content: '明清瓷器是中国陶瓷发展的巅峰时期...', cover_image: '', author: '刘大师', views: 28930, likes: 892, tags: JSON.stringify(['明清瓷器', '断代', '辨伪']), status: 'published' },
    { id: nanoid(), title: '中国书画鉴赏入门指南', category: '书画', summary: '从笔墨、构图、印章、纸绢等角度讲解书画鉴赏的基本方法。', content: '中国书画艺术源远流长，鉴赏需要多方面的知识积累...', cover_image: '', author: '陈教授', views: 35620, likes: 1024, tags: JSON.stringify(['书画', '鉴赏', '入门']), status: 'published' },
    { id: nanoid(), title: '文玩核桃的挑选与保养', category: '杂项', summary: '如何挑选一对好核桃，以及日常盘玩保养的注意事项。', content: '文玩核桃近年来受到越来越多藏家的喜爱...', cover_image: '', author: '收藏家小李', views: 8920, likes: 234, tags: JSON.stringify(['文玩核桃', '盘玩', '保养']), status: 'published' },
    { id: nanoid(), title: '古钱币收藏投资全攻略', category: '钱币', summary: '从先秦到清代，各朝代古钱币的收藏价值与投资建议。', content: '古钱币作为历史的见证，具有很高的收藏和研究价值...', cover_image: '', author: '钱币达人', views: 15680, likes: 445, tags: JSON.stringify(['古钱币', '收藏', '投资']), status: 'published' },
    { id: nanoid(), title: '紫砂茶壶的真伪鉴别', category: '杂项', summary: '宜兴紫砂壶的泥料、工艺、印章等鉴别要点详解。', content: '宜兴紫砂壶以其独特的泥料和工艺闻名于世...', cover_image: '', author: '紫砂爱好者', views: 11230, likes: 312, tags: JSON.stringify(['紫砂壶', '鉴别', '宜兴']), status: 'published' },
  ]
  const insertManyArticles = db.transaction((list: typeof articles) => {
    for (const a of list) insertArticle.run(a.id, a.title, a.category, a.summary, a.content, a.cover_image, a.author, a.views, a.likes, a.tags, a.status)
  })
  insertManyArticles(articles)

  const insertQuestion = db.prepare(`
    INSERT INTO community_questions (id, user_id, title, content, category, images, views, likes, answer_count, is_answered)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const questions = [
    { id: nanoid(), user_id: users[1].id, title: '请帮忙看看这个玉镯是什么材质？', content: '家里老人传下来的玉镯，不知道是什么材质，求大神帮忙看看！', category: '玉器', images: JSON.stringify([]), views: 560, likes: 12, answer_count: 3, is_answered: 1 },
    { id: nanoid(), user_id: users[2].id, title: '这个青花瓶是老的吗？', content: '朋友那里看到的青花瓶，开价8万，值不值？', category: '陶瓷', images: JSON.stringify([]), views: 1230, likes: 28, answer_count: 5, is_answered: 1 },
    { id: nanoid(), user_id: users[1].id, title: '这幅字是谁写的？有价值吗？', content: '偶然得到一幅字，印章看不明白，请高手帮忙鉴定一下。', category: '书画', images: JSON.stringify([]), views: 890, likes: 18, answer_count: 2, is_answered: 0 },
    { id: nanoid(), user_id: users[2].id, title: '这串星月菩提怎么样？', content: '刚入手的星月菩提，请大家看看品质如何，多少入手合适？', category: '杂项', images: JSON.stringify([]), views: 450, likes: 8, answer_count: 4, is_answered: 1 },
  ]
  const insertManyQuestions = db.transaction((list: typeof questions) => {
    for (const q of list) insertQuestion.run(q.id, q.user_id, q.title, q.content, q.category, q.images, q.views, q.likes, q.answer_count, q.is_answered)
  })
  insertManyQuestions(questions)

  const insertAnswer = db.prepare(`
    INSERT INTO community_answers (id, question_id, user_id, content, likes, is_best)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const answers = [
    { id: nanoid(), question_id: questions[0].id, user_id: users[3].id, content: '从图片看，这个玉镯应该是岫岩玉，不是和田玉。岫岩玉产量大，市场价值不高，大概几百到一千多。但既然是老人传下来的，纪念意义大于经济价值。', likes: 45, is_best: 1 },
    { id: nanoid(), question_id: questions[0].id, user_id: users[4].id, content: '同意楼上看法，是岫玉，颜色偏黄绿，透明度较高，典型的岫岩玉特征。', likes: 20, is_best: 0 },
    { id: nanoid(), question_id: questions[1].id, user_id: users[5].id, content: '这个青花瓶看底足和青花发色，应该是建国后的仿品，不是老的。8万太高了，不建议入手。', likes: 88, is_best: 1 },
    { id: nanoid(), question_id: questions[3].id, user_id: users[1].id, content: '星月菩提看密度和星点分布，你这串星点比较均匀，密度看起来也不错，500以内可以入。', likes: 15, is_best: 0 },
  ]
  const insertManyAnswers = db.transaction((list: typeof answers) => {
    for (const a of list) insertAnswer.run(a.id, a.question_id, a.user_id, a.content, a.likes, a.is_best)
  })
  insertManyAnswers(answers)
}
