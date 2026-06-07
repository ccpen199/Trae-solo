import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.resolve(__dirname, '..', 'data', 'app.sqlite')

export const db = new Database(dbPath)

export function initDB() {
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      real_name TEXT,
      avatar TEXT,
      role TEXT DEFAULT 'user',
      region_code TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      summary TEXT,
      category_id INTEGER,
      cover_image TEXT,
      author TEXT,
      source TEXT DEFAULT '百姓关注',
      view_count INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      is_top INTEGER DEFAULT 0,
      published_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS live_streams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      stream_url TEXT,
      cover_image TEXT,
      description TEXT,
      status TEXT DEFAULT 'live',
      viewer_count INTEGER DEFAULT 0,
      started_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT,
      cover_image TEXT,
      duration INTEGER DEFAULT 0,
      category_id INTEGER,
      description TEXT,
      view_count INTEGER DEFAULT 0,
      author TEXT,
      is_published INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      status TEXT DEFAULT 'active',
      max_select INTEGER DEFAULT 1,
      start_time TEXT,
      end_time TEXT,
      participant_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS topic_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      vote_count INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY(topic_id) REFERENCES topics(id)
    );

    CREATE TABLE IF NOT EXISTS topic_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER NOT NULL,
      option_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(topic_id) REFERENCES topics(id),
      FOREIGN KEY(option_id) REFERENCES topic_options(id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      UNIQUE(topic_id, option_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      status TEXT DEFAULT 'active',
      time_limit INTEGER DEFAULT 30,
      start_time TEXT,
      end_time TEXT,
      participant_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer INTEGER NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY(quiz_id) REFERENCES quizzes(id)
    );

    CREATE TABLE IF NOT EXISTS quiz_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      score INTEGER DEFAULT 0,
      total INTEGER,
      answers TEXT,
      time_spent INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(quiz_id) REFERENCES quizzes(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      logo TEXT,
      cover_image TEXT,
      contact_phone TEXT,
      address TEXT,
      license_no TEXT,
      owner_name TEXT,
      status TEXT DEFAULT 'pending',
      user_id INTEGER,
      region_code TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      cover_image TEXT,
      images TEXT,
      category_id INTEGER,
      merchant_id INTEGER,
      stock INTEGER DEFAULT 0,
      sales INTEGER DEFAULT 0,
      traceability_info TEXT,
      traceability_code TEXT,
      status TEXT DEFAULT 'active',
      is_featured INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(category_id) REFERENCES categories(id),
      FOREIGN KEY(merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      merchant_id INTEGER,
      quantity INTEGER DEFAULT 1,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      traceability_code TEXT,
      consignee TEXT,
      phone TEXT,
      address TEXT,
      paid_at TEXT,
      shipped_at TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS group_buys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      target_count INTEGER DEFAULT 10,
      current_count INTEGER DEFAULT 0,
      discount_price REAL NOT NULL,
      original_price REAL,
      start_time TEXT,
      end_time TEXT,
      status TEXT DEFAULT 'active',
      cover_image TEXT,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS group_buy_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_buy_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(group_buy_id) REFERENCES group_buys(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sentiment_keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL,
      count INTEGER DEFAULT 0,
      category TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      detail TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS regions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      parent_code TEXT,
      level INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0
    );
  `)

  const insertAdmin = db.prepare(`
    INSERT OR IGNORE INTO users (username, phone, password_hash, real_name, role, region_code)
    VALUES ('admin', '13800000000', '$2b$10$ih/KP7EAK3fyxN5kxF6bRO99fz.T49sLHxELWir2b7F0tQZHi15fu', '系统管理员', 'admin', '520100')
  `)
  insertAdmin.run()

  const insertSeedUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, phone, password_hash, real_name, role, region_code)
    VALUES (?, ?, '$2b$10$ih/KP7EAK3fyxN5kxF6bRO99fz.T49sLHxELWir2b7F0tQZHi15fu', ?, ?, ?)
  `)
  const seedUsers = db.transaction(() => {
    insertSeedUser.run('zhangsan', '13800001001', '张三', 'user', '520100')
    insertSeedUser.run('lisi', '13800001002', '李四', 'user', '520200')
    insertSeedUser.run('wangwu', '13800001003', '王五', 'user', '520300')
    insertSeedUser.run('zhaoliu', '13800001004', '赵六', 'user', '520400')
    insertSeedUser.run('sunqi', '13800001005', '孙七', 'user', '520500')
    insertSeedUser.run('zhouba', '13800001006', '周八', 'user', '520600')
    insertSeedUser.run('wugui', '13800001007', '吴九', 'merchant', '522300')
    insertSeedUser.run('zhengshi', '13800001008', '郑十', 'user', '522600')
    insertSeedUser.run('chen11', '13800001009', '陈一一', 'user', '522700')
    insertSeedUser.run('liu12', '13800001010', '刘十二', 'user', '520100')
  })
  seedUsers()

  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (name, type, sort_order) VALUES (?, ?, ?)
  `)
  const seedCategories = db.transaction(() => {
    insertCategory.run('时政要闻', 'news', 1)
    insertCategory.run('民生资讯', 'news', 2)
    insertCategory.run('社会热点', 'news', 3)
    insertCategory.run('科教文体', 'news', 4)
    insertCategory.run('短视频', 'video', 1)
    insertCategory.run('直播回看', 'video', 2)
    insertCategory.run('本地特产', 'product', 1)
    insertCategory.run('生活服务', 'product', 2)
  })
  seedCategories()

  const insertNews = db.prepare(`
    INSERT OR IGNORE INTO news (title, content, summary, category_id, author, source, view_count, is_published, is_top, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `)
  const seedNews = db.transaction(() => {
    insertNews.run(
      '贵州省2026年政府工作报告要点解读',
      '2026年贵州省政府工作报告提出了多项重要举措，包括推动经济高质量发展、深化改革开放、保障和改善民生等方面。报告指出，贵州将继续发挥大数据产业优势，加快数字经济建设，推进乡村振兴战略实施，确保全面建成小康社会成果得到巩固。',
      '2026年贵州省政府工作报告提出多项重要举措，推动经济高质量发展。',
      1, '百姓关注记者', '百姓关注', 4523, 1, 1
    )
    insertNews.run(
      '贵阳市新增三条公交线路覆盖观山湖区',
      '为缓解观山湖区居民出行难题，贵阳市交通局宣布自本月起新增三条公交线路，分别连接观山湖区与云岩区、南明区及花溪区。新线路将覆盖多个大型社区、商业中心和地铁站，预计日均服务乘客超过2万人次。',
      '贵阳市新增三条公交线路，缓解观山湖区出行难题。',
      2, '百姓关注记者', '百姓关注', 2187, 1, 0
    )
    insertNews.run(
      '贵州大数据产业迎来新发展机遇',
      '随着国家数字经济发展战略的深入推进，贵州大数据产业迎来新的发展机遇。贵安新区数据中心集群已吸引多家世界500强企业入驻，2026年一季度大数据相关产值同比增长23%。专家认为，贵州应抓住机遇，加快打造国家级大数据综合试验区升级版。',
      '贵州大数据产业迎来新发展机遇，一季度产值同比增长23%。',
      3, '百姓关注记者', '百姓关注', 3456, 1, 0
    )
    insertNews.run(
      '遵义市推进农村义务教育均衡发展成效显著',
      '近年来，遵义市大力实施农村义务教育薄弱学校改造计划，累计投入资金超过15亿元，改造农村学校320所，新建教师周转房1800套。全市农村义务教育学校办学条件明显改善，城乡教育差距进一步缩小，义务教育均衡发展通过国家验收。',
      '遵义市投入超15亿元改造农村学校，义务教育均衡发展成效显著。',
      4, '百姓关注记者', '百姓关注', 1523, 1, 0
    )
    insertNews.run(
      '贵州启动2026年春风行动助力就业创业',
      '贵州省人社厅启动2026年春风行动，全省将举办线上线下招聘会超过500场，提供就业岗位30万个以上。重点面向返乡农民工、高校毕业生和退役军人等群体，提供职业技能培训、创业担保贷款等一站式服务，助力群众就地就近就业创业。',
      '贵州启动2026年春风行动，提供30万个以上就业岗位。',
      2, '百姓关注记者', '百姓关注', 2890, 1, 0
    )
    insertNews.run(
      '六盘水市夏季避暑旅游持续升温',
      '随着暑期临近，六盘水市凭借19℃的夏季平均气温，再次成为全国热门避暑目的地。2026年1-5月，六盘水市接待游客同比增长35%，旅游收入增长42%。当地推出多条精品旅游线路，涵盖乌蒙大草原、妥乐古银杏、牂牁江等知名景区。',
      '六盘水市夏季避暑旅游持续升温，游客同比增长35%。',
      3, '百姓关注记者', '百姓关注', 4120, 1, 0
    )
    insertNews.run(
      '贵州省加快推进养老服务体系建设',
      '贵州省民政厅发布数据显示，全省已建成各类养老机构1280家，社区日间照料中心2100个，养老床位总数达22万张。2026年将新增养老床位1.5万张，推进居家社区养老服务全覆盖，探索"互联网+养老"新模式，让老年人享有更优质的养老服务。',
      '贵州加快养老服务体系建设，探索互联网+养老新模式。',
      2, '百姓关注记者', '百姓关注', 1876, 1, 0
    )
    insertNews.run(
      '黔东南州民族文化旅游节即将开幕',
      '第十届黔东南州民族文化旅游节将于下月在凯里市盛大开幕。本届旅游节以"锦绣黔东南·多彩民族风"为主题，将举办苗族侗族歌舞展演、非遗手工技艺体验、民族美食节等20余项活动，预计吸引游客超过50万人次。',
      '第十届黔东南民族文化旅游节即将开幕，预计吸引游客超50万人次。',
      4, '百姓关注记者', '百姓关注', 2567, 1, 0
    )
  })
  seedNews()

  const insertStream = db.prepare(`
    INSERT OR IGNORE INTO live_streams (title, stream_url, description, status, viewer_count, started_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `)
  const seedStreams = db.transaction(() => {
    insertStream.run('百姓关注新闻直播间', 'rtmp://live.gztv.cn/bxgz/news', '百姓关注新闻直播间，实时播报贵州最新资讯', 'live', 12580)
    insertStream.run('贵州广播电视台综合频道', 'rtmp://live.gztv.cn/gztv/general', '贵州广播电视台综合频道在线直播', 'live', 8340)
    insertStream.run('2026贵州春晚精彩回放', 'rtmp://live.gztv.cn/spring/2026', '2026年贵州省春节联欢晚会精彩回放', 'replay', 45670)
  })
  seedStreams()

  const insertVideo = db.prepare(`
    INSERT OR IGNORE INTO videos (title, url, duration, category_id, description, view_count, author, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `)
  const seedVideos = db.transaction(() => {
    insertVideo.run('贵阳甲秀楼夜景航拍', '/videos/jiaxiulou.mp4', 120, 5, '航拍贵阳标志性建筑甲秀楼璀璨夜景', 8976, '百姓关注')
    insertVideo.run('贵州苗族姊妹节精彩瞬间', '/videos/miao-sister.mp4', 180, 5, '记录台江县苗族姊妹节盛况', 6234, '百姓关注')
    insertVideo.run('黄果树瀑布全景纪录', '/videos/huangguoshu.mp4', 150, 6, '世界著名大瀑布黄果树瀑布全景拍摄', 12340, '百姓关注')
    insertVideo.run('遵义会议会馆红色故事', '/videos/zunyi-meeting.mp4', 300, 6, '走进遵义会议会馆，重温红色历史', 5678, '百姓关注')
    insertVideo.run('梵净山云海奇观', '/videos/fanjingshan.mp4', 90, 5, '世界自然遗产梵净山壮美云海', 9876, '百姓关注')
    insertVideo.run('贵州高速公路建设纪实', '/videos/expressway.mp4', 240, 6, '贵州实现县县通高速背后的建设故事', 3456, '百姓关注')
  })
  seedVideos()

  const insertTopic = db.prepare(`
    INSERT OR IGNORE INTO topics (title, description, status, max_select, participant_count)
    VALUES (?, ?, 'active', ?, ?)
  `)
  const insertTopicOption = db.prepare(`
    INSERT OR IGNORE INTO topic_options (topic_id, content, sort_order) VALUES (?, ?, ?)
  `)
  const seedTopics = db.transaction(() => {
    insertTopic.run('2026年你最关注的民生话题是什么？', '选出你最关心的民生话题，我们将汇总反馈给相关部门', 1, 3256)
    const tid1 = db.prepare('SELECT id FROM topics WHERE title = ?').get('2026年你最关注的民生话题是什么？') as { id: number } | undefined
    if (tid1) {
      insertTopicOption.run(tid1.id, '教育改革', 1)
      insertTopicOption.run(tid1.id, '医疗保障', 2)
      insertTopicOption.run(tid1.id, '住房问题', 3)
      insertTopicOption.run(tid1.id, '就业创业', 4)
      insertTopicOption.run(tid1.id, '养老服务', 5)
    }

    insertTopic.run('贵阳最需要改善的交通问题', '参与投票，为贵阳交通改善建言献策', 1, 2134)
    const tid2 = db.prepare('SELECT id FROM topics WHERE title = ?').get('贵阳最需要改善的交通问题') as { id: number } | undefined
    if (tid2) {
      insertTopicOption.run(tid2.id, '地铁线路延伸', 1)
      insertTopicOption.run(tid2.id, '公交班次增加', 2)
      insertTopicOption.run(tid2.id, '道路拥堵治理', 3)
      insertTopicOption.run(tid2.id, '停车位不足', 4)
      insertTopicOption.run(tid2.id, '交通安全', 5)
    }

    insertTopic.run('你支持贵州发展哪些特色产业？', '贵州特色产业发展方向投票', 2, 4567)
    const tid3 = db.prepare('SELECT id FROM topics WHERE title = ?').get('你支持贵州发展哪些特色产业？') as { id: number } | undefined
    if (tid3) {
      insertTopicOption.run(tid3.id, '大数据产业', 1)
      insertTopicOption.run(tid3.id, '旅游业', 2)
      insertTopicOption.run(tid3.id, '特色农业', 3)
      insertTopicOption.run(tid3.id, '文化创意', 4)
      insertTopicOption.run(tid3.id, '新能源', 5)
    }
  })
  seedTopics()

  const insertQuiz = db.prepare(`
    INSERT OR IGNORE INTO quizzes (title, description, time_limit, participant_count) VALUES (?, ?, ?, ?)
  `)
  const insertQuizQuestion = db.prepare(`
    INSERT OR IGNORE INTO quiz_questions (quiz_id, question_text, options, correct_answer, sort_order) VALUES (?, ?, ?, ?, ?)
  `)
  const seedQuizzes = db.transaction(() => {
    insertQuiz.run('贵州知识知多少', '测试你对贵州的了解程度', 30, 1890)
    const qid1 = db.prepare('SELECT id FROM quizzes WHERE title = ?').get('贵州知识知多少') as { id: number } | undefined
    if (qid1) {
      insertQuizQuestion.run(qid1.id, '贵州省的省会是哪座城市？', '["贵阳市","遵义市","六盘水市","安顺市"]', 0, 1)
      insertQuizQuestion.run(qid1.id, '黄果树瀑布位于贵州哪个市？', '["贵阳市","安顺市","遵义市","毕节市"]', 1, 2)
      insertQuizQuestion.run(qid1.id, '贵州是全国唯一没有平原支撑的省份，其地形以什么为主？', '["高原山地","丘陵盆地","平原湖泊","沙漠戈壁"]', 0, 3)
      insertQuizQuestion.run(qid1.id, '以下哪个不是贵州的少数民族自治州？', '["黔西南州","黔东南州","黔南州","甘孜州"]', 3, 4)
      insertQuizQuestion.run(qid1.id, '贵州茅台酒产自哪个县？', '["仁怀市","习水县","赤水市","桐梓县"]', 0, 5)
    }

    insertQuiz.run('百姓关注栏目常识问答', '了解贵州广播电视台百姓关注栏目', 30, 1256)
    const qid2 = db.prepare('SELECT id FROM quizzes WHERE title = ?').get('百姓关注栏目常识问答') as { id: number } | undefined
    if (qid2) {
      insertQuizQuestion.run(qid2.id, '百姓关注是哪个电视台的栏目？', '["贵州广播电视台","中央电视台","湖南卫视","浙江卫视"]', 0, 1)
      insertQuizQuestion.run(qid2.id, '百姓关注栏目主要关注哪类内容？', '["民生新闻","体育赛事","娱乐综艺","财经行情"]', 0, 2)
      insertQuizQuestion.run(qid2.id, '百姓关注的热线电话是多少？', '["13983999999","0851-85371111","12345","110"]', 1, 3)
      insertQuizQuestion.run(qid2.id, '百姓关注栏目开通于哪一年？', '["2005年","2008年","2010年","2012年"]', 2, 4)
      insertQuizQuestion.run(qid2.id, '百姓关注的新媒体平台叫什么？', '["百姓关注APP","动静贵州","天眼新闻","贵州头条"]', 0, 5)
    }
  })
  seedQuizzes()

  const insertMerchant = db.prepare(`
    INSERT OR IGNORE INTO merchants (name, description, contact_phone, address, license_no, owner_name, status, region_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const seedMerchants = db.transaction(() => {
    insertMerchant.run('贵州茅台镇老酒坊', '传承百年酿造工艺，精选本地红缨子高粱，酿造地道酱香美酒', '0851-22334455', '贵州省仁怀市茅台镇', '91520000MA6ABC01', '王建国', 'approved', '520100')
    insertMerchant.run('遵义辣椒制品厂', '老干妈授权经销商，正宗贵州辣椒制品', '0851-33445566', '贵州省遵义市汇川区', '91520000MA6DEF02', '李明华', 'approved', '520300')
    insertMerchant.run('黔南都匀毛尖茶庄', '原产地直供都匀毛尖，明前春茶精选', '0854-55667788', '贵州省都匀市毛尖镇', '91522700MA6GHI03', '陈秀芳', 'approved', '522600')
    insertMerchant.run('毕节威宁特产商行', '威宁荞酥、苦荞茶等特色农产品', '0857-77889900', '贵州省毕节市威宁县', '91520500MA6JKL04', '赵文强', 'pending', '520200')
  })
  seedMerchants()

  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products (name, description, price, original_price, category_id, merchant_id, stock, sales, traceability_info, traceability_code, status, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
  `)
  const seedProducts = db.transaction(() => {
    insertProduct.run(
      '茅台镇酱香型白酒 500ml',
      '茅台镇传统工艺酿造酱香型白酒，选用本地红缨子高粱，经过九次蒸煮、八次发酵、七次取酒，窖藏五年而成。酱香突出，醇厚绵柔，回味悠长。',
      599.00, 899.00, 7, 1, 500, 2340, '原料产地：贵州省仁怀市茅台镇；酿造工艺：传统大曲酱香；窖藏时间：5年', 'GZ-MT-20260001', 1
    )
    insertProduct.run(
      '老干妈风味豆豉 280g',
      '贵阳老干妈风味豆豉，选用优质黄豆经传统发酵工艺制成，配以干辣椒、花椒等调味，麻辣鲜香，是贵州特色调味品。',
      12.80, 15.00, 8, 2, 5000, 12800, '生产厂商：贵阳南明老干妈风味食品有限责任公司；产地：贵州省贵阳市', 'GZ-LGM-20260002', 0
    )
    insertProduct.run(
      '都匀毛尖明前特级 250g',
      '都匀毛尖中国十大名茶之一，明前采摘一芽一叶初展，经杀青、揉捻、搓骨、做形、提毫等工序精制。汤色黄绿明亮，香气清高，滋味鲜浓回甘。',
      368.00, 468.00, 7, 3, 300, 890, '产地：贵州省都匀市毛尖镇团山茶场；采摘时间：2026年清明前；等级：特级', 'GZ-DYM-20260003', 1
    )
    insertProduct.run(
      '威宁荞酥 500g',
      '威宁荞酥选用威宁高海拔苦荞为原料，经传统工艺精制而成。酥脆可口，苦荞富含芦丁和膳食纤维，是贵州威宁传统特色糕点。',
      38.00, 45.00, 7, 4, 2000, 5670, '产地：贵州省毕节市威宁彝族回族苗族自治县；原料：高海拔苦荞', 'GZ-WNQ-20260004', 0
    )
    insertProduct.run(
      '贵阳丝娃娃套餐 2人份',
      '丝娃娃是贵阳最具特色的小吃，薄如蝉翼的面皮包裹各种素菜丝，蘸上特制酸汤。本套餐含面皮20张、配菜10种及秘制蘸水，在家也能品尝正宗贵阳味道。',
      58.00, 68.00, 8, 2, 800, 3450, '生产厂商：贵阳黔味食品；产地：贵州省贵阳市', 'GZ-SWB-20260005', 1
    )
    insertProduct.run(
      '贵州酸汤鱼调料包 350g',
      '凯里红酸汤，苗族传统发酵工艺，选用本地小番茄和辣椒自然发酵90天以上。酸香浓郁，是制作正宗贵州酸汤鱼的核心调料，也可用于酸汤牛肉、酸汤排骨等。',
      28.00, 35.00, 8, 3, 3000, 8900, '产地：贵州省黔东南苗族侗族自治州凯里市；工艺：传统自然发酵90天', 'GZ-ST-20260006', 0
    )
  })
  seedProducts()

  const insertGroupBuy = db.prepare(`
    INSERT OR IGNORE INTO group_buys (product_id, title, target_count, current_count, discount_price, original_price, start_time, end_time, status, description)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now', '+7 days'), 'active', ?)
  `)
  const seedGroupBuys = db.transaction(() => {
    insertGroupBuy.run(1, '茅台镇酱香白酒限时团购', 50, 23, 499.00, 899.00, '5人成团，茅台镇酱香白酒限时特惠，原价899元，团购价仅499元')
    insertGroupBuy.run(3, '都匀毛尖明前特级团购', 30, 12, 298.00, 468.00, '明前特级都匀毛尖限时团购，产地直供，新鲜直达')
  })
  seedGroupBuys()

  const insertSentiment = db.prepare(`
    INSERT OR IGNORE INTO sentiment_keywords (keyword, count, category, date) VALUES (?, ?, ?, date('now'))
  `)
  const seedSentiment = db.transaction(() => {
    insertSentiment.run('乡村振兴', 3420, '民生')
    insertSentiment.run('教育公平', 2890, '教育')
    insertSentiment.run('医疗改革', 2567, '医疗')
    insertSentiment.run('大数据发展', 4123, '科技')
    insertSentiment.run('就业创业', 2345, '民生')
    insertSentiment.run('交通出行', 1987, '民生')
    insertSentiment.run('文化旅游', 3456, '文化')
    insertSentiment.run('生态环保', 1678, '环保')
    insertSentiment.run('住房保障', 1234, '民生')
    insertSentiment.run('养老服务', 1567, '民生')
  })
  seedSentiment()

  const insertRegion = db.prepare(`
    INSERT OR IGNORE INTO regions (name, code, parent_code, level, sort_order) VALUES (?, ?, ?, ?, ?)
  `)
  const seedRegions = db.transaction(() => {
    insertRegion.run('贵州省', '520000', null, 1, 0)
    insertRegion.run('贵阳市', '520100', '520000', 2, 1)
    insertRegion.run('六盘水市', '520200', '520000', 2, 2)
    insertRegion.run('遵义市', '520300', '520000', 2, 3)
    insertRegion.run('安顺市', '520400', '520000', 2, 4)
    insertRegion.run('毕节市', '520500', '520000', 2, 5)
    insertRegion.run('铜仁市', '520600', '520000', 2, 6)
    insertRegion.run('黔西南布依族苗族自治州', '522300', '520000', 2, 7)
    insertRegion.run('黔东南苗族侗族自治州', '522600', '520000', 2, 8)
    insertRegion.run('黔南布依族苗族自治州', '522700', '520000', 2, 9)
  })
  seedRegions()

  db.exec(`
    INSERT OR IGNORE INTO activity_logs (user_id, action, detail, created_at) VALUES
    (1, 'login', '登录系统', datetime('now', '-6 days')),
    (2, 'login', '登录系统', datetime('now', '-6 days')),
    (3, 'login', '登录系统', datetime('now', '-5 days')),
    (4, 'register', '注册新账号', datetime('now', '-5 days')),
    (5, 'view_news', '查看新闻：贵州省2026年政府工作报告要点解读', datetime('now', '-5 days')),
    (2, 'vote', '参与话题投票：2026年你最关注的民生话题是什么？', datetime('now', '-4 days')),
    (6, 'login', '登录系统', datetime('now', '-4 days')),
    (7, 'view_product', '浏览商品：茅台镇酱香型白酒', datetime('now', '-4 days')),
    (8, 'play_quiz', '参与答题：贵州知识知多少', datetime('now', '-4 days')),
    (1, 'create_order', '下单购买：都匀毛尖明前特级', datetime('now', '-3 days')),
    (3, 'view_news', '查看新闻：六盘水市夏季避暑旅游持续升温', datetime('now', '-3 days')),
    (9, 'register', '注册新账号', datetime('now', '-3 days')),
    (10, 'login', '登录系统', datetime('now', '-3 days')),
    (4, 'vote', '参与话题投票：贵阳最需要改善的交通问题', datetime('now', '-3 days')),
    (5, 'join_group_buy', '参与团购：茅台镇酱香白酒限时团购', datetime('now', '-2 days')),
    (11, 'login', '登录系统', datetime('now', '-2 days')),
    (6, 'view_product', '浏览商品：老干妈风味豆豉', datetime('now', '-2 days')),
    (2, 'play_quiz', '参与答题：百姓关注栏目常识问答', datetime('now', '-2 days')),
    (7, 'create_order', '下单购买：威宁荞酥', datetime('now', '-2 days')),
    (8, 'view_news', '查看新闻：黔东南州民族文化旅游节即将开幕', datetime('now', '-2 days')),
    (1, 'login', '登录系统', datetime('now', '-1 days')),
    (3, 'join_group_buy', '参与团购：都匀毛尖明前特级团购', datetime('now', '-1 days')),
    (9, 'vote', '参与话题投票：你支持贵州发展哪些特色产业？', datetime('now', '-1 days')),
    (10, 'view_product', '浏览商品：贵阳丝娃娃套餐', datetime('now', '-1 days')),
    (4, 'login', '登录系统', datetime('now', '-1 days')),
    (5, 'view_news', '查看新闻：贵州启动2026年春风行动助力就业创业', datetime('now', '-1 days')),
    (11, 'create_order', '下单购买：贵州酸汤鱼调料包', datetime('now', '-1 days')),
    (6, 'play_quiz', '参与答题：贵州知识知多少', datetime('now')),
    (2, 'view_product', '浏览商品：都匀毛尖明前特级', datetime('now')),
    (7, 'login', '登录系统', datetime('now'))
  `)

  console.log('Database initialized successfully')
}
