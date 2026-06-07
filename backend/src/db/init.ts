import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

let db: Database.Database;

export function getDB(): Database.Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function initDB(): void {
  const dbPath = process.env.DB_PATH || './data/app.sqlite';
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nickname TEXT,
      avatar_url TEXT,
      latitude REAL DEFAULT 0,
      longitude REAL DEFAULT 0,
      lbs_accuracy REAL DEFAULT 0,
      device_fingerprint TEXT,
      reading_profile TEXT DEFAULT '{}',
      total_reading_time INTEGER DEFAULT 0,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      cover_url TEXT,
      source_name TEXT,
      source_credibility REAL DEFAULT 0.5,
      time_decay_factor REAL DEFAULT 1.0,
      region_tags TEXT DEFAULT '[]',
      latitude REAL DEFAULT 0,
      longitude REAL DEFAULT 0,
      radius_km REAL DEFAULT 5,
      category TEXT DEFAULT 'general',
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published',
      author_id INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      cover_url TEXT,
      cover_frame_features TEXT DEFAULT '{}',
      video_url TEXT NOT NULL,
      duration INTEGER DEFAULT 0,
      play_completion_rate REAL DEFAULT 0,
      interaction_hotspots TEXT DEFAULT '[]',
      latitude REAL DEFAULT 0,
      longitude REAL DEFAULT 0,
      category TEXT DEFAULT 'general',
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published',
      author_id INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS creators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id),
      creator_name TEXT,
      creator_level INTEGER DEFAULT 1,
      originality_coefficient REAL DEFAULT 0.5,
      business_whitelist TEXT DEFAULT '[]',
      follower_count INTEGER DEFAULT 0,
      total_views INTEGER DEFAULT 0,
      total_likes INTEGER DEFAULT 0,
      bio TEXT,
      verified BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      task_type TEXT DEFAULT 'daily',
      lili_beans_reward INTEGER DEFAULT 0,
      max_completions INTEGER DEFAULT 1,
      current_completions INTEGER DEFAULT 0,
      start_time TEXT,
      end_time TEXT,
      status TEXT DEFAULT 'active',
      anti_cheat_rules TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      task_id INTEGER REFERENCES tasks(id),
      status TEXT DEFAULT 'pending',
      completed_at TEXT,
      lili_beans_earned INTEGER DEFAULT 0,
      device_fingerprint TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, task_id)
    );

    CREATE TABLE IF NOT EXISTS user_lili_beans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      balance INTEGER DEFAULT 0,
      total_earned INTEGER DEFAULT 0,
      total_spent INTEGER DEFAULT 0,
      phone_bill_exchange_rate REAL DEFAULT 100,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bean_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      amount INTEGER NOT NULL,
      transaction_type TEXT NOT NULL,
      reference_id INTEGER,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_behaviors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      dwell_time INTEGER DEFAULT 0,
      latitude REAL,
      longitude REAL,
      device_fingerprint TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS content_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_type TEXT NOT NULL,
      content_id INTEGER NOT NULL,
      reporter_id INTEGER REFERENCES users(id),
      reason TEXT,
      ai_screening_result TEXT DEFAULT '{}',
      human_review_status TEXT DEFAULT 'pending',
      human_reviewer_id INTEGER REFERENCES users(id),
      human_review_note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS region_heat (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      region_name TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      heat_score REAL DEFAULT 0,
      content_count INTEGER DEFAULT 0,
      active_users INTEGER DEFAULT 0,
      recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      creator_id INTEGER REFERENCES creators(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, creator_id)
    );

    CREATE TABLE IF NOT EXISTS user_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, target_type, target_id)
    );
  `);

  seedData();
}

function seedData(): void {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, nickname, latitude, longitude, lbs_accuracy, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const adminHash = bcrypt.hashSync('admin123', 10);
  insertUser.run('admin', adminHash, '管理员', 39.9042, 116.4074, 10, 'admin');

  const demoUsers = [
    { username: 'zhangsan', nickname: '张三', lat: 39.9142, lng: 116.4174, role: 'user' },
    { username: 'lisi', nickname: '李四', lat: 39.8942, lng: 116.3974, role: 'creator' },
    { username: 'wangwu', nickname: '王五', lat: 39.9242, lng: 116.3874, role: 'user' },
    { username: 'zhaoliu', nickname: '赵六', lat: 39.8842, lng: 116.4174, role: 'user' },
    { username: 'sunqi', nickname: '孙七', lat: 39.9092, lng: 116.4274, role: 'creator' },
  ];
  const userHash = bcrypt.hashSync('123456', 10);
  const userIds: number[] = [1];
  for (const u of demoUsers) {
    const result = insertUser.run(u.username, userHash, u.nickname, u.lat, u.lng, 15, u.role);
    userIds.push(Number(result.lastInsertRowid));
  }

  const insertCreator = db.prepare(`
    INSERT INTO creators (user_id, creator_name, creator_level, originality_coefficient, follower_count, total_views, total_likes, bio, verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const creatorData = [
    { userId: userIds[1], name: '张三说事儿', level: 5, orig: 0.8, followers: 1200, views: 50000, likes: 8000, bio: '资深时事评论员', verified: 1 },
    { userId: userIds[2], name: '李四美食', level: 4, orig: 0.7, followers: 800, views: 30000, likes: 5000, bio: '北京美食探店达人', verified: 1 },
    { userId: userIds[3], name: '王五科技', level: 3, orig: 0.9, followers: 600, views: 20000, likes: 3000, bio: '科技前沿观察', verified: 0 },
    { userId: userIds[4], name: '赵六生活', level: 2, orig: 0.6, followers: 300, views: 10000, likes: 1500, bio: '记录京城生活', verified: 0 },
    { userId: userIds[5], name: '孙七旅行', level: 6, orig: 0.85, followers: 2000, views: 80000, likes: 12000, bio: '环球旅行博主', verified: 1 },
  ];
  for (const c of creatorData) {
    insertCreator.run(c.userId, c.name, c.level, c.orig, c.followers, c.views, c.likes, c.bio, c.verified);
  }

  const categories = ['general', 'tech', 'food', 'travel', 'entertainment', 'sports', 'finance', 'health', 'education', 'society'];
  const regions = ['朝阳区', '海淀区', '西城区', '东城区', '丰台区', '石景山区', '通州区', '大兴区', '昌平区', '顺义区'];
  const regionCoords: Record<string, [number, number]> = {
    '朝阳区': [39.921, 116.443], '海淀区': [39.959, 116.298], '西城区': [39.912, 116.366],
    '东城区': [39.928, 116.416], '丰台区': [39.858, 116.286], '石景山区': [39.906, 116.222],
    '通州区': [39.902, 116.656], '大兴区': [39.726, 116.341], '昌平区': [40.221, 116.231],
    '顺义区': [40.129, 116.654],
  };

  const insertNews = db.prepare(`
    INSERT INTO news (title, content, summary, source_name, source_credibility, time_decay_factor, region_tags, latitude, longitude, radius_km, category, view_count, like_count, comment_count, status, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const newsItems = [
    { title: '朝阳区新增社区食堂，惠及上万居民', content: '朝阳区近日新增3家社区食堂，覆盖多个街道，为周边居民提供实惠便捷的餐饮服务。食堂主打家常菜，价格亲民，最受老年居民欢迎。', summary: '朝阳区新增社区食堂', source: '北京日报', cred: 0.9, decay: 1.0, region: '朝阳区', cat: 'society', views: 1520, likes: 230, comments: 45 },
    { title: '海淀中关村AI产业园正式揭牌', content: '海淀中关村人工智能产业园今日正式揭牌，园区将引入50余家AI企业，预计年产值超百亿元。多家头部企业已签署入驻协议。', summary: '中关村AI产业园揭牌', source: '科技日报', cred: 0.95, decay: 1.0, region: '海淀区', cat: 'tech', views: 3200, likes: 560, comments: 89 },
    { title: '西城区老字号推出春季限定菜单', content: '西城区多家老字号餐厅联合推出春季限定菜单，融合传统与创新，吸引众多食客前来品尝。', summary: '西城老字号春季限定', source: '美食北京', cred: 0.7, decay: 0.8, region: '西城区', cat: 'food', views: 890, likes: 120, comments: 30 },
    { title: '东城区文化遗产日活动即将开幕', content: '东城区文化遗产日活动将于本周六开幕，届时将有非遗展示、传统手工艺体验等丰富活动。', summary: '东城文化遗产日活动', source: '文旅北京', cred: 0.85, decay: 0.9, region: '东城区', cat: 'entertainment', views: 650, likes: 88, comments: 15 },
    { title: '丰台区新建三座口袋公园', content: '丰台区今年新建三座口袋公园，为居民提供更多休闲绿色空间。每座公园占地约2000平方米。', summary: '丰台新建口袋公园', source: '北京晚报', cred: 0.8, decay: 0.7, region: '丰台区', cat: 'society', views: 420, likes: 56, comments: 12 },
    { title: '北京地铁新线路规划公布', content: '北京市交通委公布新一轮地铁线路规划，涉及多条新线路和延伸线，预计2030年前陆续开通。', summary: '地铁新线路规划公布', source: '新京报', cred: 0.9, decay: 1.0, region: '朝阳区', cat: 'general', views: 5600, likes: 890, comments: 230 },
    { title: '石景山游乐园夏季夜场开放', content: '石景山游乐园夏季夜场正式开放，新增灯光秀和水上项目，成为暑期亲子游热门选择。', summary: '石景山游乐园夜场', source: '北京娱乐信报', cred: 0.7, decay: 0.6, region: '石景山区', cat: 'entertainment', views: 1200, likes: 210, comments: 55 },
    { title: '通州副中心商业综合体开业', content: '通州副中心最大商业综合体今日开业，集购物、餐饮、娱乐于一体，辐射周边20万居民。', summary: '通州商业综合体开业', source: '北京商报', cred: 0.8, decay: 1.0, region: '通州区', cat: 'finance', views: 2100, likes: 340, comments: 67 },
    { title: '大兴机场旅客吞吐量创新高', content: '大兴国际机场上半年旅客吞吐量突破2000万人次，同比增长15%，国际航线新增8条。', summary: '大兴机场吞吐量新高', source: '民航资源网', cred: 0.85, decay: 0.8, region: '大兴区', cat: 'travel', views: 1800, likes: 260, comments: 42 },
    { title: '昌平回龙观社区治理新模式', content: '昌平区回龙观社区推出"居民议事厅"治理新模式，居民可直接参与社区事务决策，效果显著。', summary: '回龙观社区治理创新', source: '社区报', cred: 0.65, decay: 0.5, region: '昌平区', cat: 'society', views: 380, likes: 45, comments: 20 },
    { title: '顺义国际鲜花港郁金香节开幕', content: '顺义国际鲜花港第十二届郁金香节盛大开幕，展出百余品种，吸引众多市民赏花打卡。', summary: '鲜花港郁金香节', source: '旅游周刊', cred: 0.75, decay: 0.9, region: '顺义区', cat: 'travel', views: 960, likes: 180, comments: 35 },
    { title: '北京发布高温黄色预警', content: '北京市气象台发布高温黄色预警，预计未来三天最高气温将达37℃，提醒市民注意防暑降温。', summary: '北京高温黄色预警', source: '中国天气网', cred: 0.95, decay: 1.0, region: '朝阳区', cat: 'general', views: 8900, likes: 120, comments: 340 },
    { title: '海淀高校科研成果转化提速', content: '海淀区多所高校加快科研成果转化步伐，今年已落地项目超百个，涵盖AI、生物医药等领域。', summary: '高校科研成果转化', source: '科学时报', cred: 0.9, decay: 0.7, region: '海淀区', cat: 'education', views: 560, likes: 78, comments: 25 },
    { title: '朝阳区24小时书店成为网红打卡地', content: '朝阳区一家24小时书店凭借独特设计和丰富藏书成为新晋网红打卡地，夜间客流占比超四成。', summary: '24小时书店走红', source: '北京青年报', cred: 0.75, decay: 0.6, region: '朝阳区', cat: 'entertainment', views: 1400, likes: 290, comments: 52 },
    { title: '丰台科技园企业获重大融资', content: '丰台科技园内一家生物科技企业完成B轮融资5亿元，将用于新药研发和市场拓展。', summary: '丰台企业获5亿融资', source: '创投日报', cred: 0.8, decay: 0.8, region: '丰台区', cat: 'finance', views: 780, likes: 95, comments: 18 },
    { title: '东城区胡同微更新计划启动', content: '东城区启动胡同微更新计划，将在保留传统风貌的基础上改善居民生活条件，首批涉及10条胡同。', summary: '胡同微更新计划', source: '北京规划', cred: 0.85, decay: 0.7, region: '东城区', cat: 'society', views: 430, likes: 67, comments: 22 },
    { title: '北京马拉松报名通道开启', content: '北京马拉松赛事报名通道正式开启，今年增设亲子跑项目，预计参赛人数将超3万人。', summary: '北马报名开启', source: '体育画报', cred: 0.9, decay: 1.0, region: '朝阳区', cat: 'sports', views: 3400, likes: 450, comments: 120 },
    { title: '西城区中医义诊活动进社区', content: '西城区多家医院联合开展中医义诊进社区活动，提供免费诊疗和健康咨询服务。', summary: '中医义诊进社区', source: '健康报', cred: 0.8, decay: 0.5, region: '西城区', cat: 'health', views: 320, likes: 48, comments: 10 },
    { title: '大兴生物医药基地新药获批', content: '大兴生物医药基地一款创新药获国家药监局批准上市，填补国内相关领域空白。', summary: '大兴新药获批上市', source: '医药经济报', cred: 0.85, decay: 0.9, region: '大兴区', cat: 'health', views: 670, likes: 89, comments: 28 },
    { title: '通州大运河文化节即将举办', content: '通州大运河文化节将于下月举办，包含龙舟赛、非遗展、美食节等系列活动。', summary: '大运河文化节将办', source: '文旅通州', cred: 0.75, decay: 0.8, region: '通州区', cat: 'entertainment', views: 550, likes: 72, comments: 16 },
  ];

  for (let i = 0; i < newsItems.length; i++) {
    const n = newsItems[i];
    const coords = regionCoords[n.region] || [39.9, 116.4];
    const regionTags = JSON.stringify([{ tag: n.region, weight: 0.8 }]);
    const authorId = (i % 5) + 2;
    insertNews.run(
      n.title, n.content, n.summary, n.source, n.cred, n.decay,
      regionTags, coords[0] + (Math.random() - 0.5) * 0.02,
      coords[1] + (Math.random() - 0.5) * 0.02, 5,
      n.cat, n.views, n.likes, n.comments, 'published', authorId
    );
  }

  const insertVideo = db.prepare(`
    INSERT INTO videos (title, description, cover_url, video_url, duration, play_completion_rate, interaction_hotspots, latitude, longitude, category, view_count, like_count, comment_count, share_count, status, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const videoItems = [
    { title: '北京胡同里的早餐江湖', desc: '探访东城区胡同里的传统早餐店', dur: 180, rate: 0.75, cat: 'food', views: 12000, likes: 2300, comments: 450, shares: 320 },
    { title: '颐和园日出到日落的12小时', desc: '记录颐和园一天的光影变化', dur: 720, rate: 0.6, cat: 'travel', views: 28000, likes: 5600, comments: 890, shares: 1200 },
    { title: '中关村创业者的一天', desc: '跟拍一位AI创业者的日常', dur: 360, rate: 0.7, cat: 'tech', views: 8500, likes: 1200, comments: 280, shares: 180 },
    { title: '故宫修缮师：我在故宫修文物', desc: '走近故宫文物修复团队', dur: 480, rate: 0.82, cat: 'entertainment', views: 45000, likes: 9800, comments: 1500, shares: 3400 },
    { title: '北京地铁早高峰实录', desc: '记录通勤族的一天', dur: 240, rate: 0.55, cat: 'society', views: 6700, likes: 890, comments: 340, shares: 120 },
    { title: '京郊露营攻略｜周末好去处', desc: '推荐北京周边5个露营地', dur: 300, rate: 0.68, cat: 'travel', views: 15000, likes: 3200, comments: 560, shares: 890 },
    { title: '三里屯夜生活Vlog', desc: '体验朝阳区三里屯的夜晚', dur: 210, rate: 0.58, cat: 'entertainment', views: 9200, likes: 1800, comments: 320, shares: 250 },
    { title: '北京大爷的晨练日常', desc: '天坛公园里的晨练百态', dur: 150, rate: 0.72, cat: 'sports', views: 11000, likes: 2100, comments: 180, shares: 340 },
    { title: '798艺术区逛展指南', desc: '798最新展览全攻略', dur: 270, rate: 0.65, cat: 'entertainment', views: 7800, likes: 1500, comments: 230, shares: 190 },
    { title: '北京中医药大学义诊现场', desc: '记录社区中医义诊活动', dur: 200, rate: 0.52, cat: 'health', views: 3200, likes: 450, comments: 90, shares: 60 },
  ];

  for (let i = 0; i < videoItems.length; i++) {
    const v = videoItems[i];
    const regionKeys = Object.keys(regionCoords);
    const rk = regionKeys[i % regionKeys.length];
    const coords = regionCoords[rk];
    const hotspots = JSON.stringify([
      { x: 0.1, y: 0.2, width: 0.15, height: 0.1, action: 'link' },
    ]);
    const authorId = (i % 5) + 2;
    insertVideo.run(
      v.title, v.desc, '', 'https://example.com/video/' + (i + 1) + '.mp4',
      v.dur, v.rate, hotspots,
      coords[0] + (Math.random() - 0.5) * 0.02,
      coords[1] + (Math.random() - 0.5) * 0.02,
      v.cat, v.views, v.likes, v.comments, v.shares, 'published', authorId
    );
  }

  const insertTask = db.prepare(`
    INSERT INTO tasks (title, description, task_type, lili_beans_reward, max_completions, current_completions, start_time, end_time, status, anti_cheat_rules)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  const tomorrow = new Date(Date.now() + 86400000).toISOString();
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString();

  const tasks = [
    { title: '每日签到', desc: '每天登录即可领取里里豆', type: 'daily', reward: 10, max: 1, cur: 0, end: tomorrow, rules: '{"max_per_day": 1, "require_device_binding": true}' },
    { title: '阅读3篇新闻', desc: '阅读3篇新闻文章获得奖励', type: 'daily', reward: 20, max: 1, cur: 0, end: tomorrow, rules: '{"min_dwell_time": 5000, "max_per_day": 1}' },
    { title: '观看2个视频', desc: '完整观看2个视频获得奖励', type: 'daily', reward: 25, max: 1, cur: 0, end: tomorrow, rules: '{"min_play_rate": 0.8, "max_per_day": 1}' },
    { title: '关注1位创作者', desc: '关注一位里里号创作者', type: 'daily', reward: 15, max: 1, cur: 0, end: tomorrow, rules: '{"max_per_day": 3}' },
    { title: '每周活跃达人', desc: '本周内累计活跃5天', type: 'weekly', reward: 100, max: 1, cur: 0, end: nextWeek, rules: '{"active_days_required": 5, "require_device_binding": true}' },
    { title: '内容分享王', desc: '本周分享5篇内容', type: 'weekly', reward: 80, max: 1, cur: 0, end: nextWeek, rules: '{"share_count_required": 5, "max_per_day": 2}' },
    { title: '月度探索者', desc: '本月探索3个不同区域的内容', type: 'monthly', reward: 200, max: 1, cur: 0, end: nextMonth, rules: '{"regions_required": 3, "require_device_binding": true}' },
    { title: '新用户专属福利', desc: '新注册用户首次完成任务可获额外奖励', type: 'special', reward: 50, max: 1, cur: 0, end: nextMonth, rules: '{"new_user_only": true, "max_per_day": 1}' },
  ];

  for (const t of tasks) {
    insertTask.run(t.title, t.desc, t.type, t.reward, t.max, t.cur, now, t.end, 'active', t.rules);
  }

  for (const uid of userIds) {
    db.prepare('INSERT INTO user_lili_beans (user_id, balance, total_earned, total_spent) VALUES (?, ?, ?, ?)')
      .run(uid, Math.floor(Math.random() * 500) + 100, Math.floor(Math.random() * 1000) + 200, 0);
  }

  const insertRegionHeat = db.prepare(`
    INSERT INTO region_heat (region_name, latitude, longitude, heat_score, content_count, active_users)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const [name, coords] of Object.entries(regionCoords)) {
    insertRegionHeat.run(
      name, coords[0], coords[1],
      Math.round(Math.random() * 100) / 10,
      Math.floor(Math.random() * 50) + 5,
      Math.floor(Math.random() * 200) + 20
    );
  }

  console.log('Database initialized and seeded successfully.');
}
