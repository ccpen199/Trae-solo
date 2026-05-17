require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT,
    avatar TEXT,
    signature TEXT,
    level INTEGER DEFAULT 0,
    exp INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    vip_type INTEGER DEFAULT 0,
    vip_expire_at INTEGER,
    is_verified INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    gender INTEGER,
    birthday TEXT,
    region TEXT,
    following_count INTEGER DEFAULT 0,
    follower_count INTEGER DEFAULT 0,
    video_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS level_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level INTEGER UNIQUE NOT NULL,
    can_comment INTEGER DEFAULT 0,
    can_danmaku INTEGER DEFAULT 0,
    can_upload INTEGER DEFAULT 0,
    can_report INTEGER DEFAULT 0,
    can_send_private_msg INTEGER DEFAULT 0,
    exp_required INTEGER DEFAULT 0,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bvid TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    cover TEXT,
    duration INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    coin_count INTEGER DEFAULT 0,
    collect_count INTEGER DEFAULT 0,
    danmaku_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    category_id INTEGER,
    tags TEXT,
    is_vip INTEGER DEFAULT 0,
    is_paid INTEGER DEFAULT 0,
    price REAL DEFAULT 0,
    copyright_region TEXT DEFAULT 'CN',
    status INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS video_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    UNIQUE(video_id, user_id, type),
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    parent_id INTEGER DEFAULT 0,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS danmakus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    time REAL NOT NULL,
    color TEXT DEFAULT '#FFFFFF',
    type INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS live_rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    cover TEXT,
    category_id INTEGER,
    is_living INTEGER DEFAULT 0,
    viewer_count INTEGER DEFAULT 0,
    follower_count INTEGER DEFAULT 0,
    start_time INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    cover TEXT,
    price REAL NOT NULL,
    original_price REAL,
    stock INTEGER DEFAULT 0,
    category_id INTEGER,
    type TEXT DEFAULT 'physical',
    vip_discount REAL DEFAULT 1,
    status INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    total_price REAL NOT NULL,
    status INTEGER DEFAULT 0,
    pay_time INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    is_read INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    related_id INTEGER,
    is_read INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    UNIQUE(follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS game_centers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    download_url TEXT,
    category TEXT,
    is_hot INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS advertisements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    cover TEXT NOT NULL,
    link TEXT,
    position TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    start_time INTEGER,
    end_time INTEGER,
    status INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS register_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_answer INTEGER NOT NULL,
    category TEXT DEFAULT 'community'
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER DEFAULT 0,
    type TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 0
  );
`);

const insertLevelPermissions = db.prepare(`
  INSERT OR IGNORE INTO level_permissions 
  (level, can_comment, can_danmaku, can_upload, can_report, can_send_private_msg, exp_required, description)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const levelData = [
  [0, 0, 0, 0, 0, 0, 0, '注册未转正'],
  [1, 1, 1, 0, 0, 0, 0, 'Lv1 正式会员'],
  [2, 1, 1, 0, 1, 0, 200, 'Lv2'],
  [3, 1, 1, 1, 1, 1, 1500, 'Lv3'],
  [4, 1, 1, 1, 1, 1, 4500, 'Lv4'],
  [5, 1, 1, 1, 1, 1, 10800, 'Lv5'],
  [6, 1, 1, 1, 1, 1, 28800, 'Lv6']
];

levelData.forEach(level => insertLevelPermissions.run(...level));

const insertQuestions = db.prepare(`
  INSERT OR IGNORE INTO register_questions (question, options, correct_answer, category)
  VALUES (?, ?, ?, ?)
`);

const questions = [
  ['在视频中发送辱骂性弹幕会受到什么处罚？', JSON.stringify(['没有处罚', '禁言或封号', '扣除硬币', '扣除经验']), 1, 'community'],
  ['以下哪种行为属于违规投稿？', JSON.stringify(['原创视频', '转载注明来源', '搬运他人作品不注明', 'Vlog']), 2, 'community'],
  ['看到违规评论应该怎么做？', JSON.stringify(['骂回去', '举报', '无视', '转发']), 1, 'community'],
  ['关于投币以下说法正确的是？', JSON.stringify(['投币没有限制', '投币可以获得经验', '投币会减少UP主硬币', '每天只能投1个币']), 1, 'community'],
  ['弹幕礼仪不包括以下哪项？', JSON.stringify(['不刷屏', '不剧透', '可以发广告', '文明用语']), 2, 'community']
];

questions.forEach(q => insertQuestions.run(...q));

const insertCategories = db.prepare(`
  INSERT OR IGNORE INTO categories (name, parent_id, type, icon, sort_order)
  VALUES (?, ?, ?, ?, ?)
`);

const categories = [
  ['动画', 0, 'video', '🎬', 1],
  ['游戏', 0, 'video', '🎮', 2],
  ['音乐', 0, 'video', '🎵', 3],
  ['娱乐', 0, 'video', '🎉', 4],
  ['知识', 0, 'video', '📚', 5],
  ['科技', 0, 'video', '💻', 6],
  ['生活', 0, 'video', '🏠', 7],
  ['美食', 0, 'video', '🍜', 8],
  ['动物圈', 0, 'video', '🐱', 9],
  ['鬼畜', 0, 'video', '👻', 10],
  ['颜值', 0, 'live', '💃', 1],
  ['游戏直播', 0, 'live', '🎮', 2],
  ['娱乐直播', 0, 'live', '🎤', 3],
  ['虚拟主播', 0, 'live', '🤖', 4]
];

categories.forEach(c => insertCategories.run(...c));

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (phone, password, nickname, avatar, level, exp, coins, vip_type, vip_expire_at, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const demoUsers = [
  ['13800138001', '$2a$10$LQq5Rz8X9fqjNq3fKz7Wye7z5x6v7b8n9m0q1w2e3r4t5y6u7i8o9', 'B站官方', 'https://api.dicebear.com/7.x/avataaars/svg?seed=official', 6, 50000, 1000, 2, Math.floor(Date.now() / 1000) + 31536000, 1],
  ['13800138002', '$2a$10$LQq5Rz8X9fqjNq3fKz7Wye7z5x6v7b8n9m0q1w2e3r4t5y6u7i8o9', '美食UP主', 'https://api.dicebear.com/7.x/avataaars/svg?seed=food', 5, 25000, 500, 0, 0, 1],
  ['13800138003', '$2a$10$LQq5Rz8X9fqjNq3fKz7Wye7z5x6v7b8n9m0q1w2e3r4t5y6u7i8o9', '游戏达人', 'https://api.dicebear.com/7.x/avataaars/svg?seed=gaming', 4, 15000, 300, 2, Math.floor(Date.now() / 1000) + 15768000, 1],
  ['13800138004', '$2a$10$LQq5Rz8X9fqjNq3fKz7Wye7z5x6v7b8n9m0q1w2e3r4t5y6u7i8o9', '动画解说', 'https://api.dicebear.com/7.x/avataaars/svg?seed=anime', 5, 30000, 600, 0, 0, 1],
  ['13800138005', '$2a$10$LQq5Rz8X9fqjNq3fKz7Wye7z5x6v7b8n9m0q1w2e3r4t5y6u7i8o9', '音乐制作人', 'https://api.dicebear.com/7.x/avataaars/svg?seed=music', 3, 8000, 200, 0, 0, 1],
  ['13800138006', '$2a$10$LQq5Rz8X9fqjNq3fKz7Wye7z5x6v7b8n9m0q1w2e3r4t5y6u7i8o9', '科技测评', 'https://api.dicebear.com/7.x/avataaars/svg?seed=tech', 5, 28000, 450, 1, Math.floor(Date.now() / 1000) + 2592000, 1],
];

demoUsers.forEach(u => insertUser.run(...u));

const insertVideo = db.prepare(`
  INSERT OR IGNORE INTO videos (bvid, user_id, title, description, cover, duration, view_count, like_count, coin_count, collect_count, category_id, tags, is_vip, is_paid, price, copyright_region, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const demoVideos = [
  ['BV1234567890', 2, '【美食】教你做正宗红烧肉，入口即化！', '今天给大家带来一道经典家常菜——红烧肉，肥而不腻，入口即化，快来学习吧！', 'https://picsum.photos/seed/food1/400/225', 680, 125000, 8500, 3200, 5600, 8, JSON.stringify(['美食', '家常菜', '红烧肉']), 0, 0, 0, 'CN', 1],
  ['BV1234567891', 3, '【游戏】原神4.0新版本全攻略，枫丹地区探索指南', '详细介绍原神4.0版本的新内容、新角色、新地图，帮助大家快速上手！', 'https://picsum.photos/seed/gaming1/400/225', 1850, 890000, 45000, 18000, 32000, 2, JSON.stringify(['原神', '游戏攻略', '枫丹']), 0, 0, 0, 'CN', 1],
  ['BV1234567892', 4, '【番剧】2024年最强新番推荐！这几部绝对不能错过', '盘点2024年最值得期待的新番动画，涵盖各种题材，总有一部适合你！', 'https://picsum.photos/seed/anime1/400/225', 920, 560000, 28000, 12000, 18000, 1, JSON.stringify(['新番推荐', '动画', '2024']), 0, 0, 0, 'CN', 1],
  ['BV1234567893', 5, '【音乐】原创钢琴曲《星空下的约定》，治愈你的心灵', '一首原创钢琴作品，希望能给你带来片刻的宁静与温暖。', 'https://picsum.photos/seed/music1/400/225', 320, 320000, 15000, 8000, 12000, 3, JSON.stringify(['原创音乐', '钢琴', '治愈']), 0, 0, 0, 'CN', 1],
  ['BV1234567894', 6, '【科技】iPhone 16 Pro深度评测：值得升级吗？', '全方位评测最新款iPhone，从性能、拍照、续航等多个维度进行详细分析。', 'https://picsum.photos/seed/tech1/400/225', 1240, 1200000, 68000, 25000, 45000, 6, JSON.stringify(['iPhone', '科技测评', '数码']), 0, 0, 0, 'CN', 1],
  ['BV1234567895', 2, '【美食】深夜食堂：一碗拉面的治愈时光', '带你体验正宗日式拉面，从汤底到配料的完美搭配。', 'https://picsum.photos/seed/food2/400/225', 540, 89000, 6200, 2100, 4500, 8, JSON.stringify(['拉面', '日式料理', '深夜食堂']), 0, 0, 0, 'CN', 1],
  ['BV1234567896', 3, '【游戏】《黑神话：悟空》实机演示解析，国产游戏之光！', '深度分析《黑神话：悟空》最新实机演示，看看都有哪些亮点！', 'https://picsum.photos/seed/gaming2/400/225', 1680, 2500000, 156000, 68000, 98000, 2, JSON.stringify(['黑神话悟空', '国产游戏', '动作游戏']), 1, 0, 0, 'CN', 1],
  ['BV1234567897', 4, '【番剧】《鬼灭之刃》无限城篇预告分析，最终决战来临！', '详细解读《鬼灭之刃》无限城篇的最新预告，预测剧情走向。', 'https://picsum.photos/seed/anime2/400/225', 780, 980000, 52000, 28000, 42000, 1, JSON.stringify(['鬼灭之刃', '无限城篇', '动画解析']), 1, 0, 0, 'CN', 1],
  ['BV1234567898', 5, '【音乐】电音神曲制作全过程，从0到1教你做EDM', '手把手教你制作电子音乐，适合零基础的朋友们学习。', 'https://picsum.photos/seed/music2/400/225', 2100, 450000, 22000, 12000, 18000, 3, JSON.stringify(['电音', 'EDM', '音乐制作']), 0, 0, 0, 'CN', 1],
  ['BV1234567899', 6, '【科技】AI时代已经到来！ChatGPT能做什么？', '带你了解人工智能的最新发展，看看AI如何改变我们的生活。', 'https://picsum.photos/seed/tech2/400/225', 890, 780000, 42000, 18000, 35000, 6, JSON.stringify(['AI', 'ChatGPT', '人工智能']), 0, 0, 0, 'CN', 1],
  ['BV1234567800', 2, '【美食】减脂餐这样吃，好吃不胖！', '分享健康美味的减脂餐食谱，让你在享受美食的同时保持好身材。', 'https://picsum.photos/seed/food3/400/225', 420, 230000, 18000, 8500, 15000, 8, JSON.stringify(['减脂餐', '健康饮食', '健身']), 0, 0, 0, 'CN', 1],
  ['BV1234567801', 3, '【游戏】《塞尔达传说：王国之泪》究极手教程', '教你如何用究极手做出各种神奇的道具，让你的游戏体验更上一层楼！', 'https://picsum.photos/seed/gaming3/400/225', 1560, 680000, 38000, 16000, 28000, 2, JSON.stringify(['塞尔达', '王国之泪', '究极手']), 0, 0, 0, 'CN', 1],
];

demoVideos.forEach(v => insertVideo.run(...v));

const insertLiveRoom = db.prepare(`
  INSERT OR IGNORE INTO live_rooms (user_id, title, cover, category_id, viewer_count, is_living)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const demoLiveRooms = [
  [3, '原神4.0枫丹开荒！一起探索新地图', 'https://picsum.photos/seed/live1/400/225', 2, 5280, 1],
  [2, '深夜吃播：今天吃小龙虾！', 'https://picsum.photos/seed/live2/400/225', 3, 3120, 1],
  [4, '动画杂谈：聊聊那些年我们追过的番', 'https://picsum.photos/seed/live3/400/225', 4, 1890, 0],
  [5, '音乐直播：弹唱经典老歌', 'https://picsum.photos/seed/live4/400/225', 3, 2450, 1],
  [6, '科技直播：最新数码产品开箱', 'https://picsum.photos/seed/live5/400/225', 1, 890, 0],
];

demoLiveRooms.forEach(l => insertLiveRoom.run(...l));

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (name, description, cover, price, original_price, stock, category_id, type, vip_discount, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const demoProducts = [
  ['B站年度大会员', '全站海量内容免费看，专享1080P+画质，尊贵标识', 'https://picsum.photos/seed/vip1/400/400', 233, 233, 99999, 1, 'vip', 0.9, 1],
  ['B站季度大会员', '3个月大会员权益，性价比之选', 'https://picsum.photos/seed/vip2/400/400', 68, 68, 99999, 1, 'vip', 0.9, 1],
  ['2233娘手办', '官方正版2233娘手办，精致细节，收藏必备', 'https://picsum.photos/seed/figure1/400/400', 599, 699, 500, 2, 'physical', 0.85, 1],
  ['B站主题卫衣', '舒适棉质，经典logo设计，多色可选', 'https://picsum.photos/seed/clothes1/400/400', 199, 299, 1000, 2, 'physical', 0.85, 1],
  ['机械键盘', 'B站联名款机械键盘，青轴/茶轴可选', 'https://picsum.photos/seed/keyboard1/400/400', 399, 499, 300, 3, 'physical', 0.85, 1],
];

demoProducts.forEach(p => insertProduct.run(...p));

const insertGame = db.prepare(`
  INSERT OR IGNORE INTO game_centers (name, icon, description, category, is_hot, is_new, sort_order, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const demoGames = [
  ['原神', 'https://picsum.photos/seed/icon1/100/100', '开放世界冒险RPG游戏', 'RPG', 1, 0, 1, 1],
  ['崩坏：星穹铁道', 'https://picsum.photos/seed/icon2/100/100', '银河冒险回合制RPG', 'RPG', 1, 0, 2, 1],
  ['和平精英', 'https://picsum.photos/seed/icon3/100/100', '战术竞技手游', '射击', 1, 0, 3, 1],
  ['王者荣耀', 'https://picsum.photos/seed/icon4/100/100', 'MOBA类手游', 'MOBA', 0, 0, 4, 1],
  ['鸣潮', 'https://picsum.photos/seed/icon5/100/100', '开放世界动作游戏', '动作', 0, 1, 5, 1],
  ['绝区零', 'https://picsum.photos/seed/icon6/100/100', '都市动作RPG', '动作', 1, 0, 6, 1],
];

demoGames.forEach(g => insertGame.run(...g));

const insertAd = db.prepare(`
  INSERT OR IGNORE INTO advertisements (title, cover, link, position, sort_order, status)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const demoAds = [
  ['B站年度大会员限时特惠', 'https://picsum.photos/seed/ad1/800/300', '/mall', 'banner', 1, 1],
  ['《黑神话：悟空》8月20日正式上线', 'https://picsum.photos/seed/ad2/800/300', '/video/BV1234567896', 'banner', 2, 1],
];

demoAds.forEach(a => insertAd.run(...a));

console.log('数据库初始化完成！');
db.close();
